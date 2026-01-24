import { useState } from 'react'
import Palette from './components/Palette'
import Canvas from './components/Canvas'
import PropertyEditor from './components/PropertyEditor'
import { validateDiagram, validateTransformation, formatValidationErrors } from './utils/validation'
import { applyTransformationToSelection, buildTransformationFromDiagram, getApplicableTransformations, getPortList } from './utils/transformation'
import './App.css'
import './index.css'

// Types for nodes
export type NodeType = {
  id: string
  type: string
  x: number
  y: number
  properties: Record<string, unknown>
}

// Add type for custom node definitions
export type NodeTypeDef = {
  name: string
  inputs: string[]
  outputs: string[]
}

// Add wire types
export type WireType = {
  id: string
  fromNodeId: string
  fromPortIdx: number
  toNodeId: string
  toPortIdx: number
}

export type TransformationType = {
  name: string
  inputPattern: string[]
  outputPattern: string[]
  replacementNodes: NodeType[]
}

const builtInNodeDefs: NodeTypeDef[] = [
  { name: 'Source', inputs: [], outputs: ['out'] },
  { name: 'Sink', inputs: ['in'], outputs: [] },
]

const areStringArraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

function App() {
  const [nodes, setNodes] = useState<NodeType[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const [customNodeDefs, setCustomNodeDefs] = useState<NodeTypeDef[]>([])
  const [transformations, setTransformations] = useState<TransformationType[]>([])
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [showSaveTransformationModal, setShowSaveTransformationModal] = useState(false)
  const [pendingTransformation, setPendingTransformation] = useState<TransformationType | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeIds: string[] } | null>(null)
  const [transformationContextMenu, setTransformationContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)
  const [wires, setWires] = useState<WireType[]>([])
  const [wireDraft, setWireDraft] = useState<{
    fromNodeId: string
    fromPortIdx: number
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)
  const [diagramName, setDiagramName] = useState<string>('Untitled Diagram')

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<NodeType[] | null>(null)

  // Handler to add a new custom node type
  const handleAddCustomNodeDef = (def: NodeTypeDef) => {
    setCustomNodeDefs(defs => [...defs, def])
  }

  // Handler for dropping a node from the palette
  const handleDropNode = (type: string, x: number, y: number) => {
    // Look up node definition in built-in and custom node defs
    const def = [...builtInNodeDefs, ...customNodeDefs].find(d => d.name === type)
    setNodes([...nodes, {
      id: `node-${Date.now()}`,
      type,
      x,
      y,
      properties: def
        ? { name: type, inputs: def.inputs, outputs: def.outputs }
        : { name: type },
    }])
  }

  // Handler for selecting nodes (single or multi)
  const handleSelectNode = (id: string, multi: boolean = false) => {
    if (multi) {
      setSelectedNodeIds(ids => ids.includes(id) ? ids : [...ids, id])
    } else {
      setSelectedNodeIds([id])
    }
  }

  // Handler to set selected node IDs directly (for lasso selection)
  const handleSetSelectedNodeIds = (ids: string[]) => setSelectedNodeIds(ids)

  // Handler for canvas click to clear selection
  const handleCanvasDeselect = () => setSelectedNodeIds([])

  // Handler for updating node properties
  const handleUpdateNode = (id: string, properties: Record<string, unknown>) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, properties } : n))
  }

  // Handler for moving a node
  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, x, y } : n))
  }

  // Start a wire from an output port
  const handleStartWire = (fromNodeId: string, fromPortIdx: number, start: { x: number; y: number }) => {
    setWireDraft({ fromNodeId, fromPortIdx, start, end: start })
  }

  // Update the draft wire endpoint
  const handleWireDraftMove = (end: { x: number; y: number }) => {
    setWireDraft(draft => draft ? { ...draft, end } : null)
  }

  // Complete a wire to an input port
  const handleCompleteWire = (toNodeId: string, toPortIdx: number) => {
    if (!wireDraft) return
    // Only allow one wire per input port
    if (wires.some(w => w.toNodeId === toNodeId && w.toPortIdx === toPortIdx)) {
      setWireDraft(null)
      return
    }
    setWires(wires => [
      ...wires,
      {
        id: `wire-${Date.now()}`,
        fromNodeId: wireDraft.fromNodeId,
        fromPortIdx: wireDraft.fromPortIdx,
        toNodeId,
        toPortIdx
      }
    ])
    setWireDraft(null)
  }

  // Cancel draft wire if not completed
  const handleCancelWire = () => setWireDraft(null)

  const ensurePaletteDefs = (replacementNodes: NodeType[]) => {
    const toNodeDef = (node: NodeType): NodeTypeDef | null => {
      const inputs = getPortList(node.properties, 'inputs')
      const outputs = getPortList(node.properties, 'outputs')
      if (!node.type) return null
      return { name: node.type, inputs, outputs }
    }

    setCustomNodeDefs(prev => {
      const existing = [...builtInNodeDefs, ...prev]
      const toAdd: NodeTypeDef[] = []
      replacementNodes.forEach(node => {
        const def = toNodeDef(node)
        if (!def) return
        const exists = existing.some(d => d.name === def.name && areStringArraysEqual(d.inputs, def.inputs) && areStringArraysEqual(d.outputs, def.outputs))
        const alreadyQueued = toAdd.some(d => d.name === def.name && areStringArraysEqual(d.inputs, def.inputs) && areStringArraysEqual(d.outputs, def.outputs))
        if (!exists && !alreadyQueued) {
          toAdd.push(def)
        }
      })
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev
    })
  }

  const handleAddTransformation = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          const validationErrors = validateTransformation(data)
          if (validationErrors.length > 0) {
            const errorMessage = formatValidationErrors(validationErrors)
            alert(`Invalid transformation file:\n${errorMessage}`)
            return
          }
          setTransformations(prev => [...prev, data as TransformationType])
        } catch (error) {
          alert(`Failed to load transformation: ${error instanceof Error ? error.message : 'Invalid JSON file.'}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleApplyTransformation = (transformation: TransformationType, nodeIds: string[]) => {
    const result = applyTransformationToSelection(nodes, wires, nodeIds, transformation)
    if (!result) {
      alert('Selected nodes do not match the transformation requirements.')
      return
    }

    ensurePaletteDefs(result.replacementNodes)
    setNodes(result.nodes)
    setWires(result.wires)
    setSelectedNodeIds(result.selectedNodeIds)
    setContextMenu(null)
  }

  // Save to local filesystem as JSON file
  const handleSave = () => {
    const saveData = {
      name: diagramName,
      nodes,
      customNodeDefs,
      wires
    }
    const json = JSON.stringify(saveData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${diagramName.replace(/[^a-zA-Z0-9-_]+/g, '_') || 'diagram'}.json`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  }
  // Load from local filesystem as JSON file
  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          
          // Validate the loaded data
          const validationErrors = validateDiagram(data)
          if (validationErrors.length > 0) {
            const errorMessage = formatValidationErrors(validationErrors)
            alert(`Invalid diagram file:\n${errorMessage}`)
            return
          }
          
          setDiagramName(data.name || 'Untitled Diagram')
          setNodes(data.nodes || [])
          setCustomNodeDefs(data.customNodeDefs || [])
          setWires(data.wires || [])
          setSelectedNodeIds([])
        } catch (error) {
          alert(`Failed to load diagram: ${error instanceof Error ? error.message : 'Invalid JSON file.'}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const saveTransformationToFile = (transformation: TransformationType) => {
    const json = JSON.stringify(transformation, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transformation.name.replace(/[^a-zA-Z0-9-_]+/g, '_') || 'transformation'}.json`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  }

  const handleSaveTransformation = () => {
    const transformation = buildTransformationFromDiagram(nodes, wires, diagramName)
    setPendingTransformation(transformation)
    setShowSaveTransformationModal(true)
  }

  const handleSaveTransformationDecision = (addToLibrary: boolean) => {
    if (!pendingTransformation) {
      setShowSaveTransformationModal(false)
      return
    }
    saveTransformationToFile(pendingTransformation)
    if (addToLibrary) {
      setTransformations(prev => [...prev, pendingTransformation])
    }
    setPendingTransformation(null)
    setShowSaveTransformationModal(false)
  }

  // Context menu handlers
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    const nodeIds = selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId]
    setSelectedNodeIds(nodeIds)
    setContextMenu({ x: e.clientX, y: e.clientY, nodeIds })
  }
  const handleCloseContextMenu = () => setContextMenu(null)
  const handleCloseTransformationContextMenu = () => setTransformationContextMenu(null)

  const handleTransformationContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setTransformationContextMenu({ x: e.clientX, y: e.clientY, index })
  }

  const handleDeleteTransformation = (index: number) => {
    setTransformations(prev => prev.filter((_, i) => i !== index))
    setTransformationContextMenu(null)
  }

  // Property modal handlers
  const handleClosePropertyModal = () => setShowPropertyModal(false)
  const handleUpdateNodeProperties = (properties: Record<string, unknown>) => {
    setNodes(nodes => nodes.map(n => n.id === selectedNodeIds[0] ? { ...n, properties: { ...n.properties, ...properties } } : n))
    setShowPropertyModal(false)
  }

  // Copy selected nodes
  const handleCopyNodes = () => {
    if (selectedNodeIds.length === 0) return;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    setClipboard(selectedNodes.map(n => ({ ...n })));
  };

  // Paste nodes
  const handlePasteNodes = () => {
    if (!clipboard || clipboard.length === 0) return;
    // Offset pasted nodes so they don't overlap
    const offset = 40;
    const now = Date.now();
    const idMap: Record<string, string> = {};
    const newNodes = clipboard.map((n, i) => {
      const newId = `node-${now + i}`;
      idMap[n.id] = newId;
      return {
        ...n,
        id: newId,
        x: n.x + offset,
        y: n.y + offset,
      };
    });
    setNodes(nodes => [...nodes, ...newNodes]);
    setSelectedNodeIds(newNodes.map(n => n.id));
    // Optionally, copy wires between selected nodes
    const newWires = wires.filter(w => clipboard.some(n => n.id === w.fromNodeId) && clipboard.some(n => n.id === w.toNodeId))
      .map(w => ({
        ...w,
        id: `wire-${now}-${w.id}`,
        fromNodeId: idMap[w.fromNodeId],
        toNodeId: idMap[w.toNodeId],
      }));
    setWires(wires => [...wires, ...newWires]);
  };

  // Delete selected nodes
  const handleDeleteNodes = () => {
    if (selectedNodeIds.length === 0) return;
    setNodes(nodes => nodes.filter(n => !selectedNodeIds.includes(n.id)));
    setWires(wires => wires.filter(w => !selectedNodeIds.includes(w.fromNodeId) && !selectedNodeIds.includes(w.toNodeId)));
    setSelectedNodeIds([]);
  };

  // Clear canvas
  const handleClear = () => {
    setNodes([])
    setSelectedNodeIds([])
  }

  const applicableTransformations = contextMenu
    ? getApplicableTransformations(nodes, wires, contextMenu.nodeIds, transformations)
    : []

  return (
    <div style={{ display: 'flex', height: '100vh', minWidth: 1000, maxWidth: '100vw', overflowX: 'auto' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: 48, background: '#f5f5f5', borderBottom: '1px solid #ccc', zIndex: 20, display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
        <input
          type="text"
          value={diagramName}
          onChange={e => setDiagramName(e.target.value)}
          style={{ marginRight: 12, fontSize: 18, fontWeight: 500, border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', width: 240, background: '#fff', color: '#181818' }}
          placeholder="Diagram Name"
        />
        <button onClick={handleSave} style={{ marginRight: 8 }}>Save</button>
        <button onClick={handleLoad} style={{ marginRight: 8 }}>Load</button>
        <button onClick={handleSaveTransformation} style={{ marginRight: 8 }}>Save Transformation</button>
        <button onClick={handleClear}>Clear Diagram</button>
      </div>
      <Palette
        customNodeDefs={customNodeDefs}
        onAddCustomNodeDef={handleAddCustomNodeDef}
      />
      <div style={{ flex: 1, display: 'flex', position: 'relative', height: '100vh' }}>
        <Canvas
          nodes={nodes}
          wires={wires}
          wireDraft={wireDraft}
          selectedNodeIds={selectedNodeIds}
          onSelectNode={handleSelectNode}
          onSetSelectedNodeIds={handleSetSelectedNodeIds}
          onDeselect={handleCanvasDeselect}
          onDropNode={handleDropNode}
          onMoveNode={handleMoveNode}
          onNodeContextMenu={handleNodeContextMenu}
          onStartWire={handleStartWire}
          onWireDraftMove={handleWireDraftMove}
          onCompleteWire={handleCompleteWire}
          onCancelWire={handleCancelWire}
          onCopyNodes={handleCopyNodes}
          onPasteNodes={handlePasteNodes}
          onDeleteNodes={handleDeleteNodes}
        />
      </div>
      {/* Right Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 48,
          right: 0,
          height: 'calc(100vh - 48px)',
          width: 320,
          background: '#f0f0f0',
          borderLeft: '1px solid #ccc',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.07)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Transformation Library</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {transformations.length === 0 && (
              <div style={{ color: '#777', fontSize: 12 }}>No transformations loaded.</div>
            )}
            {transformations.map((t, idx) => (
              <div
                key={`${t.name}-${idx}`}
                onContextMenu={e => handleTransformationContextMenu(e, idx)}
                style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 6, padding: 8, cursor: 'context-menu' }}
              >
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  In: {t.inputPattern.join(', ') || 'none'}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Out: {t.outputPattern.join(', ') || 'none'}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAddTransformation} style={{ marginTop: 10, width: '100%' }}>Add Transformation</button>
        </div>
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {selectedNodeIds.length !== 1 && (
            <div style={{ padding: 12, color: '#777' }}>Select a single node to edit properties.</div>
          )}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              left: 0,
              bottom: 0,
              background: '#f9f9f9',
              transform: selectedNodeIds.length === 1 ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
              overflowY: 'auto',
            }}
          >
            {selectedNodeIds.length === 1 && (
              <PropertyEditor
                nodes={nodes.filter(n => selectedNodeIds.includes(n.id))}
                onUpdateNode={handleUpdateNode}
                immediate
              />
            )}
          </div>
        </div>
      </div>
      {/* Context Menu */}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#fff', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onMouseLeave={handleCloseContextMenu}>
          <div style={{ padding: 8, cursor: 'pointer', color: 'red' }} onClick={() => { handleDeleteNodes(); handleCloseContextMenu(); }}>Delete</div>
          <div style={{ padding: 8, borderTop: '1px solid #eee', fontWeight: 600 }}>Apply Transformation</div>
          {applicableTransformations.length === 0 ? (
            <div style={{ padding: 8, color: '#888' }}>No applicable transformations</div>
          ) : (
            applicableTransformations.map((t, idx) => (
              <div
                key={`${t.name}-${idx}`}
                style={{ padding: 8, cursor: 'pointer' }}
                onClick={() => handleApplyTransformation(t, contextMenu.nodeIds)}
              >
                {t.name}
              </div>
            ))
          )}
        </div>
      )}
      {transformationContextMenu && (
        <div
          style={{ position: 'fixed', top: transformationContextMenu.y, left: transformationContextMenu.x, background: '#fff', border: '1px solid #ccc', zIndex: 110, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onMouseLeave={handleCloseTransformationContextMenu}
        >
          <div
            style={{ padding: 8, cursor: 'pointer', color: 'red' }}
            onClick={() => handleDeleteTransformation(transformationContextMenu.index)}
          >
            Delete
          </div>
        </div>
      )}
      {/* Property Modal */}
      {showPropertyModal && (
        <PropertyModal
          nodes={nodes.filter(n => selectedNodeIds.includes(n.id))}
          onClose={handleClosePropertyModal}
          onSave={handleUpdateNodeProperties}
        />
      )}
      {/* Save Transformation Modal */}
      {showSaveTransformationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 360, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0 }}>Add Transformation to Library?</h3>
            <p style={{ marginBottom: 20, color: '#444' }}>
              Save this transformation and add it to the Transformation Library?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => handleSaveTransformationDecision(true)}>Yes, add</button>
              <button type="button" onClick={() => handleSaveTransformationDecision(false)}>No, just save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// PropertyModal component (inline for simplicity)
function PropertyModal({ nodes, onClose, onSave }: { nodes: NodeType[]; onClose: () => void; onSave: (props: Record<string, unknown>) => void }) {
  const [form, setForm] = useState(() => {
    const base = nodes[0]?.properties || {}
    return {
      label: typeof base.label === 'string' ? (nodes.every(n => n.properties.label === base.label) ? base.label : '') : '',
      pythonFile: typeof base.pythonFile === 'string' ? (nodes.every(n => n.properties.pythonFile === base.pythonFile) ? base.pythonFile : '') : '',
      description: typeof base.description === 'string' ? (nodes.every(n => n.properties.description === base.description) ? base.description : '') : '',
      metadata: typeof base.metadata === 'string' ? (nodes.every(n => n.properties.metadata === base.metadata) ? base.metadata : '') : '',
    }
  })
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
        <h3>Edit Properties</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Label:<br />
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Python File Path:<br />
            <input value={form.pythonFile} onChange={e => setForm(f => ({ ...f, pythonFile: e.target.value }))} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Description:<br />
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Metadata (JSON):<br />
            <input value={form.metadata} onChange={e => setForm(f => ({ ...f, metadata: e.target.value }))} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  )
}

export default App

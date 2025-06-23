import { useState } from 'react'
import Palette from './components/Palette'
import Canvas from './components/Canvas'
import PropertyEditor from './components/PropertyEditor'
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

function App() {
  const [nodes, setNodes] = useState<NodeType[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const [customNodeDefs, setCustomNodeDefs] = useState<NodeTypeDef[]>([])
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeIds: string[] } | null>(null)
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
    // Built-in node definitions
    const builtInDefs = [
      { name: 'Source', inputs: [], outputs: ['out'] },
      { name: 'Sink', inputs: ['in'], outputs: [] },
    ];
    // Look up node definition in built-in and custom node defs
    const def = [...builtInDefs, ...customNodeDefs].find(d => d.name === type)
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
          setDiagramName(data.name || 'Untitled Diagram')
          setNodes(data.nodes || [])
          setCustomNodeDefs(data.customNodeDefs || [])
          setWires(data.wires || [])
          setSelectedNodeIds([])
        } catch {
          alert('Invalid JSON file.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // Context menu handlers
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    const nodeIds = selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId]
    setContextMenu({ x: e.clientX, y: e.clientY, nodeIds })
  }
  const handleCloseContextMenu = () => setContextMenu(null)

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
        {/* Sliding Property Editor */}
        <div
          style={{
            position: 'fixed',
            top: 48, // only top bar
            right: 0,
            height: 'calc(100vh - 48px)',
            width: 320,
            background: '#f9f9f9',
            borderLeft: '1px solid #ccc',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.07)',
            zIndex: 30,
            transform: selectedNodeIds.length === 1 ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
            display: 'flex',
            flexDirection: 'column',
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
      {/* Context Menu */}
      {contextMenu && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#fff', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} onMouseLeave={handleCloseContextMenu}>
          <div style={{ padding: 8, cursor: 'pointer', color: 'red' }} onClick={handleDeleteNodes}>Delete</div>
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

import { useEffect, useRef, useState } from 'react'
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
  internalWires?: WireType[]
}

type DiagramSnapshot = {
  nodes: NodeType[]
  wires: WireType[]
}

const builtInNodeDefs: NodeTypeDef[] = [
  { name: 'Source', inputs: [], outputs: ['out'] },
  { name: 'Sink', inputs: ['in'], outputs: [] },
]

const areStringArraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

const ESTIMATED_NODE_WIDTH = 150
const PORT_HEIGHT = 28
const BASE_NODE_HEIGHT = 60
const CLEANUP_COLUMN_GAP = 48
const CLEANUP_ROW_GAP = 16
const CLEANUP_PADDING = 24

const estimateNodeHeight = (node: NodeType) => {
  const inputs = getPortList(node.properties, 'inputs')
  const outputs = getPortList(node.properties, 'outputs')
  return Math.max(inputs.length, outputs.length) * PORT_HEIGHT + BASE_NODE_HEIGHT
}

function App() {
  const brandingBarHeight = 56
  const controlBarHeight = 48
  const topOffset = brandingBarHeight + controlBarHeight

  const [nodes, setNodes] = useState<NodeType[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedWireIds, setSelectedWireIds] = useState<string[]>([])

  const [customNodeDefs, setCustomNodeDefs] = useState<NodeTypeDef[]>([])
  const [transformations, setTransformations] = useState<TransformationType[]>([])
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [showSaveTransformationModal, setShowSaveTransformationModal] = useState(false)
  const [pendingTransformation, setPendingTransformation] = useState<TransformationType | null>(null)
  const [showTransformationErrorModal, setShowTransformationErrorModal] = useState(false)
  const [transformationErrorMessage, setTransformationErrorMessage] = useState<string>('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeIds: string[]; wireIds: string[] } | null>(null)
  const [transformationContextMenu, setTransformationContextMenu] = useState<{ x: number; y: number; index: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const transformationContextMenuRef = useRef<HTMLDivElement | null>(null)
  const [wires, setWires] = useState<WireType[]>([])
  const [wireDraft, setWireDraft] = useState<{
    fromNodeId: string
    fromPortIdx: number
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)
  const [diagramName, setDiagramName] = useState<string>('Untitled Diagram')

  const nodesRef = useRef<NodeType[]>([])
  const wiresRef = useRef<WireType[]>([])
  const undoStackRef = useRef<DiagramSnapshot[]>([])
  const dragSnapshotRef = useRef<DiagramSnapshot | null>(null)
  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null)

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<NodeType[] | null>(null)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    wiresRef.current = wires
  }, [wires])

  const cloneSnapshot = (snapshotNodes: NodeType[], snapshotWires: WireType[]): DiagramSnapshot => ({
    nodes: JSON.parse(JSON.stringify(snapshotNodes)) as NodeType[],
    wires: JSON.parse(JSON.stringify(snapshotWires)) as WireType[]
  })

  const pushUndoSnapshot = (snapshot: DiagramSnapshot) => {
    const stack = undoStackRef.current
    stack.push(snapshot)
    if (stack.length > 20) {
      stack.shift()
    }
  }

  const handleUndo = () => {
    const stack = undoStackRef.current
    const snapshot = stack.pop()
    if (!snapshot) return
    setNodes(snapshot.nodes)
    setWires(snapshot.wires)
    setSelectedNodeIds([])
    setSelectedWireIds([])
    setContextMenu(null)
    setWireDraft(null)
  }

  // Handler to add a new custom node type
  const handleAddCustomNodeDef = (def: NodeTypeDef) => {
    setCustomNodeDefs(defs => [...defs, def])
  }

  // Handler for dropping a node from the palette
  const handleDropNode = (type: string, x: number, y: number) => {
    // Look up node definition in built-in and custom node defs
    const def = [...builtInNodeDefs, ...customNodeDefs].find(d => d.name === type)
    pushUndoSnapshot(cloneSnapshot(nodesRef.current, wiresRef.current))
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
      setSelectedWireIds([])
    }
  }

  // Handler to set selected node IDs directly (for lasso selection)
  const handleSetSelectedNodeIds = (ids: string[]) => setSelectedNodeIds(ids)

  // Handler for selecting wires (single or multi)
  const handleSelectWire = (id: string, multi: boolean = false) => {
    // Clear node selection when selecting a single wire
    if (!multi) {
      setSelectedNodeIds([])
    }
    if (multi) {
      setSelectedWireIds(ids => ids.includes(id) ? ids : [...ids, id])
    } else {
      setSelectedWireIds([id])
    }
  }

  // Handler to set selected wire IDs directly (for lasso selection)
  const handleSetSelectedWireIds = (ids: string[]) => {
    setSelectedWireIds(ids)
  }

  // Handler for canvas click to clear selection
  const handleCanvasDeselect = () => {
    setSelectedNodeIds([])
    setSelectedWireIds([])
  }

  // Handler for updating node properties
  const handleUpdateNode = (id: string, properties: Record<string, unknown>) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, properties } : n))
  }

  // Handler for moving a node
  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, x, y } : n))
  }

  const handleMoveNodeStart = (id: string) => {
    const node = nodesRef.current.find(n => n.id === id)
    if (!node) return
    dragStartRef.current = { id, x: node.x, y: node.y }
    dragSnapshotRef.current = cloneSnapshot(nodesRef.current, wiresRef.current)
  }

  const handleMoveNodeEnd = (id: string) => {
    const start = dragStartRef.current
    const snapshot = dragSnapshotRef.current
    dragStartRef.current = null
    dragSnapshotRef.current = null
    if (!start || !snapshot || start.id !== id) return
    const node = nodesRef.current.find(n => n.id === id)
    if (!node) return
    if (node.x !== start.x || node.y !== start.y) {
      pushUndoSnapshot(snapshot)
    }
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
    pushUndoSnapshot(cloneSnapshot(nodesRef.current, wiresRef.current))
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

  const importTransformationFromJson = (text: string) => {
    try {
      const data = JSON.parse(text)
      const validationErrors = validateTransformation(data)
      if (validationErrors.length > 0) {
        const errorMessage = formatValidationErrors(validationErrors)
        setTransformationErrorMessage(`Invalid transformation file:\n${errorMessage}`)
        setShowTransformationErrorModal(true)
        return
      }
      setTransformations(prev => [...prev, data as TransformationType])
    } catch (error) {
      setTransformationErrorMessage(`Failed to load transformation: ${error instanceof Error ? error.message : 'Invalid JSON file.'}`)
      setShowTransformationErrorModal(true)
    }
  }

  const openTransformationFileInput = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.value = ''
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      document.body.removeChild(input)
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        importTransformationFromJson(event.target?.result as string)
      }
      reader.onerror = () => {
        setTransformationErrorMessage('Failed to read transformation file.')
        setShowTransformationErrorModal(true)
      }
      reader.readAsText(file)
    }
    document.body.appendChild(input)
    input.click()
  }

  const handleAddTransformation = () => {
    if ('showOpenFilePicker' in window) {
      (async () => {
        try {
          const [fileHandle] = await (window as unknown as { showOpenFilePicker: (options: { types?: Array<{ description: string; accept: Record<string, string[]> }>; multiple?: boolean; }) => Promise<unknown[]> }).showOpenFilePicker({
            types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
            multiple: false,
          })
          // @ts-expect-error: File System Access API types are not standard
          const file = await fileHandle.getFile()
          const text = await file.text()
          importTransformationFromJson(text)
        } catch (error) {
          if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError') {
            return
          }
          setTransformationErrorMessage(`Failed to open transformation file: ${error instanceof Error ? error.message : 'Unknown error.'}`)
          setShowTransformationErrorModal(true)
          openTransformationFileInput()
        }
      })()
      return
    }

    openTransformationFileInput()
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
  const importDiagramFromJson = (text: string) => {
    try {
      const data = JSON.parse(text)

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
      setSelectedWireIds([])
      setContextMenu(null)
      setWireDraft(null)
    } catch (error) {
      alert(`Failed to load diagram: ${error instanceof Error ? error.message : 'Invalid JSON file.'}`)
    }
  }

  const openDiagramFileInput = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.value = ''
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      document.body.removeChild(input)
      if (!file) return
      try {
        const text = await file.text()
        importDiagramFromJson(text)
      } catch (error) {
        alert(`Failed to read diagram file: ${error instanceof Error ? error.message : 'Unknown error.'}`)
      }
    }
    document.body.appendChild(input)
    input.click()
  }

  // Load from local filesystem as JSON file
  const handleLoad = () => {
    if ('showOpenFilePicker' in window) {
      ;(async () => {
        try {
          const [fileHandle] = await (window as unknown as { showOpenFilePicker: (options: { types?: Array<{ description: string; accept: Record<string, string[]> }>; multiple?: boolean; }) => Promise<unknown[]> }).showOpenFilePicker({
            types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
            multiple: false,
          })
          // @ts-expect-error: File System Access API types are not standard
          const file = await fileHandle.getFile()
          const text = await file.text()
          importDiagramFromJson(text)
        } catch (error) {
          if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError') {
            return
          }
          alert(`Failed to open diagram file: ${error instanceof Error ? error.message : 'Unknown error.'}`)
          openDiagramFileInput()
        }
      })()
      return
    }

    openDiagramFileInput()
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
    const wireIds = selectedNodeIds.includes(nodeId) ? selectedWireIds : []
    setSelectedNodeIds(nodeIds)
    setSelectedWireIds(wireIds)
    setContextMenu({ x: e.clientX, y: e.clientY, nodeIds, wireIds })
  }

  const handleWireContextMenu = (e: React.MouseEvent, wireId: string) => {
    e.preventDefault()
    const wireIds = selectedWireIds.includes(wireId) ? selectedWireIds : [wireId]
    const nodeIds = selectedWireIds.includes(wireId) ? selectedNodeIds : []
    setSelectedWireIds(wireIds)
    setSelectedNodeIds(nodeIds)
    setContextMenu({ x: e.clientX, y: e.clientY, nodeIds, wireIds })
  }

  const handleCloseContextMenu = () => setContextMenu(null)

  useEffect(() => {
    if (!contextMenu && !transformationContextMenu) return
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedContextMenu = contextMenuRef.current?.contains(target)
      const clickedTransformationMenu = transformationContextMenuRef.current?.contains(target)
      if (!clickedContextMenu && !clickedTransformationMenu) {
        setContextMenu(null)
        setTransformationContextMenu(null)
      }
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [contextMenu, transformationContextMenu])

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

  // Delete whatever is currently selected (nodes or wires)
  const handleDelete = () => {
    if (selectedNodeIds.length === 0 && selectedWireIds.length === 0) return
    pushUndoSnapshot(cloneSnapshot(nodesRef.current, wiresRef.current))
    setNodes(nodes => nodes.filter(n => !selectedNodeIds.includes(n.id)))
    setWires(wires => wires.filter(w =>
      !selectedWireIds.includes(w.id) &&
      !selectedNodeIds.includes(w.fromNodeId) &&
      !selectedNodeIds.includes(w.toNodeId)
    ))
    setSelectedNodeIds([])
    setSelectedWireIds([])
  };

  // Clear canvas
  const handleClear = () => {
    setNodes([])
    setSelectedNodeIds([])
  }

  const handleDiagramCleanup = () => {
    const currentNodes = nodesRef.current
    const currentWires = wiresRef.current
    if (currentNodes.length === 0) return

    pushUndoSnapshot(cloneSnapshot(currentNodes, currentWires))

    const hasUnwiredInput = (node: NodeType) => {
      const inputs = getPortList(node.properties, 'inputs')
      if (inputs.length === 0) return false
      return inputs.some((_, idx) => !currentWires.some(w => w.toNodeId === node.id && w.toPortIdx === idx))
    }

    const hasUnwiredOutput = (node: NodeType) => {
      const outputs = getPortList(node.properties, 'outputs')
      if (outputs.length === 0) return false
      return outputs.some((_, idx) => !currentWires.some(w => w.fromNodeId === node.id && w.fromPortIdx === idx))
    }

    const nodesWithoutInputs = currentNodes.filter(n => getPortList(n.properties, 'inputs').length === 0)
    const nodesWithoutOutputs = currentNodes.filter(n => getPortList(n.properties, 'outputs').length === 0)

    const leftCandidates = nodesWithoutInputs.length > 0
      ? nodesWithoutInputs
      : currentNodes.filter(hasUnwiredInput)
    const rightCandidates = nodesWithoutOutputs.length > 0
      ? nodesWithoutOutputs
      : currentNodes.filter(hasUnwiredOutput)

    const leftSet = new Set(leftCandidates.map(n => n.id))
    const rightSet = new Set(rightCandidates.map(n => n.id).filter(id => !leftSet.has(id)))

    const adjacency: Record<string, string[]> = {}
    const indegree: Record<string, number> = {}
    const depthByNode: Record<string, number> = {}
    currentNodes.forEach(node => {
      adjacency[node.id] = []
      indegree[node.id] = 0
      depthByNode[node.id] = 0
    })

    currentWires.forEach(wire => {
      if (!adjacency[wire.fromNodeId] || indegree[wire.toNodeId] === undefined) return
      if (!adjacency[wire.fromNodeId].includes(wire.toNodeId)) {
        adjacency[wire.fromNodeId].push(wire.toNodeId)
        indegree[wire.toNodeId] += 1
      }
    })

    const queue: string[] = []
    const queued = new Set<string>()

    if (leftSet.size > 0) {
      leftSet.forEach(id => {
        if (!queued.has(id)) {
          depthByNode[id] = 0
          queue.push(id)
          queued.add(id)
        }
      })
      currentNodes.forEach(node => {
        if (indegree[node.id] === 0 && !leftSet.has(node.id) && !queued.has(node.id)) {
          depthByNode[node.id] = 1
          queue.push(node.id)
          queued.add(node.id)
        }
      })
    } else {
      currentNodes.forEach(node => {
        if (indegree[node.id] === 0 && !queued.has(node.id)) {
          depthByNode[node.id] = 0
          queue.push(node.id)
          queued.add(node.id)
        }
      })
    }

    const processed = new Set<string>()
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      processed.add(nodeId)
      const baseDepth = depthByNode[nodeId] ?? 0
      adjacency[nodeId].forEach(nextId => {
        depthByNode[nextId] = Math.max(depthByNode[nextId] ?? 0, baseDepth + 1)
        indegree[nextId] -= 1
        if (indegree[nextId] === 0 && !queued.has(nextId)) {
          queue.push(nextId)
          queued.add(nextId)
        }
      })
    }

    // Fallback: handle any unprocessed nodes (typically caused by cycles in the diagram)
    // Nodes with no incoming wires that reach this point indicate circular dependencies,
    // since truly isolated nodes should have been processed in the initial BFS above.
    currentNodes.forEach(node => {
      if (processed.has(node.id)) return
      const incoming = currentWires.filter(w => w.toNodeId === node.id)
      if (incoming.length === 0) {
        // This case suggests a cycle: node has no incoming wires but wasn't processed
        console.warn(`Circular dependency detected in diagram: node "${node.type}" (${node.id}) appears to be part of a cycle`)
        depthByNode[node.id] = leftSet.size > 0 ? 1 : 0
      } else {
        const incomingDepth = Math.max(...incoming.map(w => depthByNode[w.fromNodeId] ?? 0))
        depthByNode[node.id] = incomingDepth + 1
      }
    })

    let maxDepth = Math.max(0, ...Object.values(depthByNode))
    if (rightSet.size > 0) {
      maxDepth += 1
      rightSet.forEach(id => {
        depthByNode[id] = maxDepth
      })
    }

    const depthKeys = Array.from(new Set(Object.values(depthByNode))).sort((a, b) => a - b)
    const depthMap = new Map<number, number>()
    depthKeys.forEach((depth, index) => depthMap.set(depth, index))
    Object.keys(depthByNode).forEach(id => {
      depthByNode[id] = depthMap.get(depthByNode[id]) ?? depthByNode[id]
    })

    const columns: Record<number, NodeType[]> = {}
    currentNodes.forEach(node => {
      const depth = depthByNode[node.id] ?? 0
      if (!columns[depth]) columns[depth] = []
      columns[depth].push(node)
    })

    const sortedColumnKeys = Object.keys(columns).map(Number).sort((a, b) => a - b)
    const newPositions: Record<string, { x: number; y: number }> = {}

    sortedColumnKeys.forEach(depth => {
      const columnNodes = columns[depth].slice().sort((a, b) => a.y - b.y)
      let currentY = CLEANUP_PADDING
      columnNodes.forEach(node => {
        newPositions[node.id] = {
          x: CLEANUP_PADDING + depth * (ESTIMATED_NODE_WIDTH + CLEANUP_COLUMN_GAP),
          y: currentY,
        }
        currentY += estimateNodeHeight(node) + CLEANUP_ROW_GAP
      })
    })

    setNodes(nodes => nodes.map(node => {
      const pos = newPositions[node.id]
      return pos ? { ...node, x: pos.x, y: pos.y } : node
    }))
  }

  const applicableTransformations = contextMenu
    ? getApplicableTransformations(nodes, wires, contextMenu.nodeIds, transformations)
    : []

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: brandingBarHeight, background: '#0b1e3a', color: '#fff', borderBottom: '3px solid #16a34a', zIndex: 30, display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 12 }}>
        <img src="/DxT.png" alt="DxT logo" style={{ height: 36, width: 36, objectFit: 'contain' }} />
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: 0.3 }}>Design by Transformation</div>
      </div>
      <div style={{ position: 'fixed', top: brandingBarHeight, left: 0, width: '100vw', height: controlBarHeight, background: '#f5f5f5', borderBottom: '1px solid #ccc', zIndex: 25, display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
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
        <button onClick={handleClear} style={{ marginRight: 8 }}>Clear Diagram</button>
        <button onClick={handleDiagramCleanup}>Diagram Cleanup</button>
      </div>
      <Palette
        customNodeDefs={customNodeDefs}
        onAddCustomNodeDef={handleAddCustomNodeDef}
        topOffset={topOffset}
      />
      <div style={{ flex: '0 0 60vw', width: '60vw', minWidth: 0, display: 'flex', position: 'relative', height: `calc(100vh - ${topOffset}px)`, marginTop: topOffset, boxSizing: 'border-box' }}>
        <Canvas
          nodes={nodes}
          wires={wires}
          wireDraft={wireDraft}
          selectedNodeIds={selectedNodeIds}
          selectedWireIds={selectedWireIds}
          onSelectNode={handleSelectNode}
          onSelectWire={handleSelectWire}
          onSetSelectedNodeIds={handleSetSelectedNodeIds}
          onSetSelectedWireIds={handleSetSelectedWireIds}
          onDeselect={handleCanvasDeselect}
          onDropNode={handleDropNode}
          onMoveNode={handleMoveNode}
          onMoveNodeStart={handleMoveNodeStart}
          onMoveNodeEnd={handleMoveNodeEnd}
          onNodeContextMenu={handleNodeContextMenu}
          onWireContextMenu={handleWireContextMenu}
          onStartWire={handleStartWire}
          onWireDraftMove={handleWireDraftMove}
          onCompleteWire={handleCompleteWire}
          onCancelWire={handleCancelWire}
          onCopyNodes={handleCopyNodes}
          onPasteNodes={handlePasteNodes}
          onDeleteNodes={handleDelete}
          onUndo={handleUndo}
        />
      </div>
      {/* Right Sidebar */}
      <div
        style={{
          position: 'relative',
          marginTop: topOffset,
          height: `calc(100vh - ${topOffset}px)`,
          width: '20vw',
          minWidth: 0,
          maxWidth: '20vw',
          background: '#f0f0f0',
          borderLeft: '1px solid #ccc',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.07)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
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
          <button onClick={handleAddTransformation} style={{ marginTop: 10, width: '100%' }}>Load Transformation</button>
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
        <div
          ref={contextMenuRef}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#fff', border: '1px solid #ccc', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div style={{ padding: 8, cursor: 'pointer', color: 'red' }} onClick={() => { handleDelete(); handleCloseContextMenu(); }}>Delete</div>
          {contextMenu.nodeIds.length > 0 && (
            <>
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
            </>
          )}
        </div>
      )}
      {transformationContextMenu && (
        <div
          ref={transformationContextMenuRef}
          style={{ position: 'fixed', top: transformationContextMenu.y, left: transformationContextMenu.x, background: '#fff', border: '1px solid #ccc', zIndex: 110, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onMouseDown={e => e.stopPropagation()}
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
      {showTransformationErrorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 360, maxWidth: 520, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0 }}>Transformation Load Failed</h3>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#444', marginBottom: 20 }}>{transformationErrorMessage}</pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowTransformationErrorModal(false)}>Close</button>
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

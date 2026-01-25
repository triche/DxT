import type { NodeType, WireType, TransformationType } from '../App'

type ExternalInputPort = { name: string; wire: WireType | null }
type ExternalOutputPort = { name: string; wires: WireType[] }

export const getPortList = (props: Record<string, unknown>, key: 'inputs' | 'outputs'): string[] => {
  const val = props[key]
  if (Array.isArray(val) && val.every(p => typeof p === 'string')) {
    return val as string[]
  }
  return []
}

const countPortNames = (ports: string[]) => {
  const counts: Record<string, number> = {}
  ports.forEach(name => {
    counts[name] = (counts[name] || 0) + 1
  })
  return counts
}

export const arePortMultisetsEqual = (a: string[], b: string[]) => {
  const aCounts = countPortNames(a)
  const bCounts = countPortNames(b)
  const aKeys = Object.keys(aCounts)
  const bKeys = Object.keys(bCounts)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(key => aCounts[key] === bCounts[key])
}

export const getExternalPorts = (nodes: NodeType[], wires: WireType[], nodeIds: string[]) => {
  const selectedSet = new Set(nodeIds)
  const selectedNodes = nodes.filter(n => selectedSet.has(n.id))
  const externalInputs: ExternalInputPort[] = []
  const externalOutputs: ExternalOutputPort[] = []

  selectedNodes.forEach(node => {
    const inputs = getPortList(node.properties, 'inputs')
    inputs.forEach((name, idx) => {
      const wire = wires.find(w => w.toNodeId === node.id && w.toPortIdx === idx) || null
      if (!wire || !selectedSet.has(wire.fromNodeId)) {
        externalInputs.push({ name, wire })
      }
    })

    const outputs = getPortList(node.properties, 'outputs')
    outputs.forEach((name, idx) => {
      const outgoing = wires.filter(w => w.fromNodeId === node.id && w.fromPortIdx === idx)
      const external = outgoing.filter(w => !selectedSet.has(w.toNodeId))
      if (external.length > 0 || outgoing.length === 0) {
        externalOutputs.push({ name, wires: external })
      }
    })
  })

  return { externalInputs, externalOutputs }
}

export const getApplicableTransformations = (
  nodes: NodeType[],
  wires: WireType[],
  nodeIds: string[],
  transformations: TransformationType[]
) => {
  if (nodeIds.length === 0) return []
  const { externalInputs, externalOutputs } = getExternalPorts(nodes, wires, nodeIds)
  const inputNames = externalInputs.map(p => p.name)
  const outputNames = externalOutputs.map(p => p.name)
  return transformations.filter(t =>
    arePortMultisetsEqual(inputNames, t.inputPattern) && arePortMultisetsEqual(outputNames, t.outputPattern)
  )
}

export const buildTransformationFromDiagram = (
  nodes: NodeType[],
  wires: WireType[],
  diagramName: string
): TransformationType => {
  const inputPattern: string[] = []
  const outputPattern: string[] = []

  // Create a set of node IDs for quick lookup
  const nodeIdSet = new Set(nodes.map(n => n.id))

  nodes.forEach(node => {
    const inputs = getPortList(node.properties, 'inputs')
    inputs.forEach((name, idx) => {
      const hasIncoming = wires.some(w => w.toNodeId === node.id && w.toPortIdx === idx)
      if (!hasIncoming) inputPattern.push(name)
    })

    const outputs = getPortList(node.properties, 'outputs')
    outputs.forEach((name, idx) => {
      const hasOutgoing = wires.some(w => w.fromNodeId === node.id && w.fromPortIdx === idx)
      if (!hasOutgoing) outputPattern.push(name)
    })
  })

  // Capture internal wires (wires connecting nodes within the transformation)
  const internalWires = wires.filter(w => 
    nodeIdSet.has(w.fromNodeId) && nodeIdSet.has(w.toNodeId)
  ).map(wire => ({ ...wire }))

  return {
    name: diagramName || 'Untitled Transformation',
    inputPattern,
    outputPattern,
    replacementNodes: nodes.map(node => ({ ...node })),
    internalWires: internalWires.length > 0 ? internalWires : undefined,
  }
}

export const applyTransformationToSelection = (
  nodes: NodeType[],
  wires: WireType[],
  nodeIds: string[],
  transformation: TransformationType
) => {
  if (nodeIds.length === 0) return null
  const { externalInputs, externalOutputs } = getExternalPorts(nodes, wires, nodeIds)
  const inputNames = externalInputs.map(p => p.name)
  const outputNames = externalOutputs.map(p => p.name)
  if (!arePortMultisetsEqual(inputNames, transformation.inputPattern) || !arePortMultisetsEqual(outputNames, transformation.outputPattern)) {
    return null
  }

  const selectedSet = new Set(nodeIds)
  const selectedNodes = nodes.filter(n => selectedSet.has(n.id))
  if (selectedNodes.length === 0) return null

  const replacementNodes = transformation.replacementNodes || []
  if (replacementNodes.length === 0) return null

  const selectedMinX = Math.min(...selectedNodes.map(n => n.x))
  const selectedMinY = Math.min(...selectedNodes.map(n => n.y))
  const replacementMinX = Math.min(...replacementNodes.map(n => n.x))
  const replacementMinY = Math.min(...replacementNodes.map(n => n.y))
  const deltaX = selectedMinX - replacementMinX
  const deltaY = selectedMinY - replacementMinY

  const now = Date.now()
  const idMap: Record<string, string> = {}
  const remappedReplacementNodes = replacementNodes.map((node, index) => {
    const newId = `node-${now}-${index}`
    idMap[node.id] = newId
    return {
      ...node,
      id: newId,
      x: node.x + deltaX,
      y: node.y + deltaY,
    }
  })

  const remainingNodes = nodes.filter(n => !selectedSet.has(n.id))
  const remainingWires = wires.filter(w => !selectedSet.has(w.fromNodeId) && !selectedSet.has(w.toNodeId))

  // Build sets of ports that are used by internal wires
  const internalWires = transformation.internalWires || []
  const usedInputPorts = new Set<string>()
  const usedOutputPorts = new Set<string>()
  
  internalWires.forEach(wire => {
    const newFromId = idMap[wire.fromNodeId]
    const newToId = idMap[wire.toNodeId]
    if (newFromId && newToId) {
      usedOutputPorts.add(`${newFromId}-${wire.fromPortIdx}`)
      usedInputPorts.add(`${newToId}-${wire.toPortIdx}`)
    }
  })

  const inputPortMap: Record<string, Array<{ nodeId: string; portIdx: number }>> = {}
  const outputPortMap: Record<string, Array<{ nodeId: string; portIdx: number }>> = {}

  remappedReplacementNodes.forEach(node => {
    const inputs = getPortList(node.properties, 'inputs')
    inputs.forEach((name, idx) => {
      // Skip ports that are already used by internal wires
      if (usedInputPorts.has(`${node.id}-${idx}`)) return
      if (!inputPortMap[name]) inputPortMap[name] = []
      inputPortMap[name].push({ nodeId: node.id, portIdx: idx })
    })
    const outputs = getPortList(node.properties, 'outputs')
    outputs.forEach((name, idx) => {
      // Skip ports that are already used by internal wires
      if (usedOutputPorts.has(`${node.id}-${idx}`)) return
      if (!outputPortMap[name]) outputPortMap[name] = []
      outputPortMap[name].push({ nodeId: node.id, portIdx: idx })
    })
  })

  let wireCounter = 0
  const nextWireId = () => `wire-${Date.now()}-${wireCounter++}`
  const newWires: WireType[] = [...remainingWires]

  // Add internal wires to the result with remapped IDs
  internalWires.forEach(wire => {
    const newFromId = idMap[wire.fromNodeId]
    const newToId = idMap[wire.toNodeId]
    if (newFromId && newToId) {
      newWires.push({
        id: nextWireId(),
        fromNodeId: newFromId,
        fromPortIdx: wire.fromPortIdx,
        toNodeId: newToId,
        toPortIdx: wire.toPortIdx,
      })
    }
  })

  externalInputs.forEach(input => {
    const targets = inputPortMap[input.name]
    if (!targets || targets.length === 0) return
    const target = targets.shift()!
    if (input.wire) {
      newWires.push({
        id: nextWireId(),
        fromNodeId: input.wire.fromNodeId,
        fromPortIdx: input.wire.fromPortIdx,
        toNodeId: target.nodeId,
        toPortIdx: target.portIdx,
      })
    }
  })

  externalOutputs.forEach(output => {
    const sources = outputPortMap[output.name]
    if (!sources || sources.length === 0) return
    const source = sources.shift()!
    output.wires.forEach(wire => {
      newWires.push({
        id: nextWireId(),
        fromNodeId: source.nodeId,
        fromPortIdx: source.portIdx,
        toNodeId: wire.toNodeId,
        toPortIdx: wire.toPortIdx,
      })
    })
  })

  return {
    nodes: [...remainingNodes, ...remappedReplacementNodes],
    wires: newWires,
    selectedNodeIds: remappedReplacementNodes.map(n => n.id),
    replacementNodes: remappedReplacementNodes,
  }
}

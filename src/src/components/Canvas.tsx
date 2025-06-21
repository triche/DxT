import React, { useRef } from 'react';
import type { NodeType } from '../App'

type WireType = {
  id: string
  fromNodeId: string
  fromPortIdx: number
  toNodeId: string
  toPortIdx: number
}

type CanvasProps = {
  nodes: NodeType[]
  wires: WireType[]
  wireDraft: {
    fromNodeId: string
    fromPortIdx: number
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null
  selectedNodeIds: string[]
  onSelectNode: (id: string, multi?: boolean) => void
  onDeselect: () => void
  onDropNode: (type: string, x: number, y: number) => void
  onMoveNode: (id: string, x: number, y: number) => void
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void
  onStartWire: (fromNodeId: string, fromPortIdx: number, start: { x: number; y: number }) => void
  onWireDraftMove: (end: { x: number; y: number }) => void
  onCompleteWire: (toNodeId: string, toPortIdx: number) => void
  onCancelWire: () => void
}

const Canvas = ({ nodes, wires, wireDraft, selectedNodeIds, onSelectNode, onDeselect, onDropNode, onMoveNode, onNodeContextMenu, onStartWire, onWireDraftMove, onCompleteWire, onCancelWire }: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Drop handler for new nodes
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('node-type')
    if (type) {
      const rect = (e.target as HTMLDivElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      onDropNode(type, x, y)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Drag state
  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [offset, setOffset] = React.useState<{x: number, y: number}>({x: 0, y: 0})

  const handleMouseDown = (e: React.MouseEvent, node: NodeType) => {
    e.stopPropagation()
    setDraggingId(node.id)
    setOffset({ x: e.clientX - node.x, y: e.clientY - node.y })
  }

  React.useEffect(() => {
    if (!draggingId) return
    const handleMouseMove = (e: MouseEvent) => {
      onMoveNode(draggingId, e.clientX - offset.x, e.clientY - offset.y)
    }
    const handleMouseUp = () => setDraggingId(null)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingId, offset, onMoveNode])

  // Store refs for all ports by node id and port index
  const outputPortRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const inputPortRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  // Helper to get the DOM position of a port relative to the canvas, accounting for scroll and palette offset
  function getPortCenter(portEl: HTMLDivElement, canvasEl: HTMLDivElement) {
    const portRect = portEl.getBoundingClientRect();
    const canvasRect = canvasEl.getBoundingClientRect();
    // Adjust for scroll position and palette offset
    //const scrollLeft = canvasEl.scrollLeft;
    //const scrollTop = canvasEl.scrollTop;
    // Returns the center coordinates of a port relative to the canvas
    return {
      x: portRect.left + portRect.width / 2 - canvasRect.left,
      y: portRect.top + portRect.height / 2 - canvasRect.top,
    };
  }

  // Mouse move for draft wire
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (wireDraft && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - canvasRect.left
      const y = e.clientY - canvasRect.top
      onWireDraftMove({ x, y })
    }
  }

  // Mouse up on canvas: cancel draft if not completed
  const handleCanvasMouseUp = () => {
    if (wireDraft) onCancelWire()
  }

  return (
    <div
      ref={canvasRef}
      style={{ flex: 1, minWidth: '70vw', maxWidth: '70vw', overflow: 'auto', position: 'relative', background: '#fff', border: '1px solid #ccc', margin: 8, userSelect: 'none', height: 'calc(100vh - 48px)' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={e => { if (e.target === e.currentTarget) onDeselect() }}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {/* Draw wires */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {wires.map(wire => {
            const fromNode = nodes.find(n => n.id === wire.fromNodeId)
            const toNode = nodes.find(n => n.id === wire.toNodeId)
            if (!fromNode || !toNode || !canvasRef.current) return null
            const fromPort = outputPortRefs.current[`${wire.fromNodeId}-${wire.fromPortIdx}`]
            const toPort = inputPortRefs.current[`${wire.toNodeId}-${wire.toPortIdx}`]
            if (!fromPort || !toPort) return null
            const from = getPortCenter(fromPort, canvasRef.current)
            const to = getPortCenter(toPort, canvasRef.current)
            // Right-angled polyline
            const midX = (from.x + to.x) / 2
            return (
              <polyline
                key={wire.id}
                points={`${from.x},${from.y} ${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`}
                fill="none"
                stroke="#181818"
                strokeWidth={2}
              />
            )
          })}
          {/* Draft wire as dotted line */}
          {wireDraft && (
            <polyline
              points={`${wireDraft.start.x},${wireDraft.start.y} ${(wireDraft.start.x + wireDraft.end.x) / 2},${wireDraft.start.y} ${(wireDraft.start.x + wireDraft.end.x) / 2},${wireDraft.end.y} ${wireDraft.end.x},${wireDraft.end.y}`}
              fill="none"
              stroke="#181818"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
        </svg>
      </div>
      {/* Render nodes and ports after wires so port circles are on top */}
      {nodes.map(node => {
        // Get port names from node properties (default to 1 input/output for example node)
        function getPorts(props: Record<string, unknown>, key: 'inputs' | 'outputs'): string[] {
          const val = props[key];
          if (Array.isArray(val) && val.every(p => typeof p === 'string')) {
            return val as string[];
          }
          // Only default if the property is missing (not present at all)
          return [];
        }
        const inputs = getPorts(node.properties, 'inputs')
        const outputs = getPorts(node.properties, 'outputs')
        const name = node.properties?.name as string
        return (
          <div
            key={node.id}
            onClick={e => {
              e.stopPropagation()
              onSelectNode(node.id, e.shiftKey)
            }}
            onMouseDown={e => handleMouseDown(e, node)}
            onContextMenu={e => onNodeContextMenu(e, node.id)}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              padding: 12,
              background: selectedNodeIds.includes(node.id) ? '#e0eaff' : '#f5f5f5',
              border: selectedNodeIds.includes(node.id) ? '2px solid #4a90e2' : '1px solid #aaa',
              borderRadius: 6,
              cursor: draggingId === node.id ? 'grabbing' : 'pointer',
              minWidth: 80,
              textAlign: 'center',
              userSelect: 'none',
              minHeight: Math.max(inputs.length, outputs.length) * 28 + 24,
              boxShadow: selectedNodeIds.includes(node.id) ? '0 0 8px #4a90e2' : undefined,
              zIndex: selectedNodeIds.includes(node.id) ? 2 : 1,
              outline: selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id) ? '2px dashed #4a90e2' : undefined,
            }}
          >
            <div>{name || node.type}</div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2, fontStyle: 'italic' }}>{node.type}</div>
            {/* Output connectors as blue lollipops, interactive for wiring */}
            {outputs.length > 0 && outputs.map((port, i) => {
              const isConnected = wires.some(w => w.fromNodeId === node.id && w.fromPortIdx === i)
              return (
                <div
                  key={port + i}
                  ref={el => { outputPortRefs.current[`${node.id}-${i}`] = el }}
                  style={{
                    position: 'absolute',
                    right: -16,
                    top: `${28 * (i + 1) - 8}px`,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'crosshair',
                    zIndex: 3,
                  }}
                  onMouseDown={e => {
                    e.stopPropagation()
                    if (canvasRef.current && outputPortRefs.current[`${node.id}-${i}`]) {
                      const { x, y } = getPortCenter(outputPortRefs.current[`${node.id}-${i}`]!, canvasRef.current)
                      onStartWire(node.id, i, { x, y })
                    }
                  }}
                >
                  <svg width="24" height="24">
                    <circle cx="18" cy="12" r="6" fill={isConnected ? '#4a90e2' : '#fff'} stroke="#4a90e2" strokeWidth="2" />
                    <rect x="2" y="10" width="12" height="4" fill="#4a90e2" />
                  </svg>
                </div>
              )
            })}
            {/* Input connectors as green lollipops, interactive for wiring completion */}
            {inputs.length > 0 && inputs.map((port, i) => {
              const isConnected = wires.some(w => w.toNodeId === node.id && w.toPortIdx === i)
              return (
                <div
                  key={port + i}
                  ref={el => { inputPortRefs.current[`${node.id}-${i}`] = el }}
                  style={{
                    position: 'absolute',
                    left: -16,
                    top: `${28 * (i + 1) - 8}px`,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: wireDraft ? 'pointer' : 'default',
                    zIndex: 3,
                  }}
                  onMouseUp={() => {
                    if (wireDraft) {
                      onCompleteWire(node.id, i)
                    }
                  }}
                >
                  <svg width="24" height="24">
                    <circle cx="6" cy="12" r="6" fill={isConnected ? '#27ae60' : '#fff'} stroke="#27ae60" strokeWidth="2" />
                    <rect x="12" y="10" width="10" height="4" fill="#27ae60" />
                  </svg>
                </div>
              )
            })}
          </div>
        )
      })}
      <h3 style={{ position: 'absolute', top: 8, left: 8, color: '#bbb' }}>Diagram</h3>
    </div>
  )
}

export default Canvas
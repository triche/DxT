import React, { useState } from 'react'

type PaletteProps = {
  customNodeDefs: { name: string; inputs: string[]; outputs: string[] }[]
  onAddCustomNodeDef: (def: { name: string; inputs: string[]; outputs: string[] }) => void
}

const Palette: React.FC<PaletteProps> = ({ customNodeDefs, onAddCustomNodeDef }) => {
  const [showModal, setShowModal] = useState(false)
  const [nodeName, setNodeName] = useState('')
  const [inputPorts, setInputPorts] = useState('')
  const [outputPorts, setOutputPorts] = useState('')

  const handleNewNode = () => {
    setShowModal(true)
    setNodeName('')
    setInputPorts('')
    setOutputPorts('')
  }

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddCustomNodeDef({
      name: nodeName.trim() || 'Custom Node',
      inputs: inputPorts.split(',').map(s => s.trim()).filter(Boolean),
      outputs: outputPorts.split(',').map(s => s.trim()).filter(Boolean)
    })
    setShowModal(false)
  }

  // Drag event handlers
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('node-type', type)
  }

  // Always-present node definitions
  const builtInNodes = [
    { name: 'Source', inputs: [], outputs: ['out'] },
    { name: 'Sink', inputs: ['in'], outputs: [] },
  ]

  return (
    <div style={{ width: '30vw', minWidth: 200, maxWidth: 400, background: '#f4f4f4', borderRight: '1px solid #ccc', padding: 16, boxSizing: 'border-box', height: '100vh', overflowY: 'auto', marginTop: 48 }}>
      <h3>Palette</h3>
      <button onClick={handleNewNode} style={{ marginBottom: 16 }}>New Node</button>
      {/* Built-in nodes */}
      {builtInNodes.map((node, idx) => (
        <div
          key={node.name + idx}
          draggable
          onDragStart={e => handleDragStart(e, node.name)}
          style={{ margin: '8px 0', padding: 8, background: '#fff', border: '1px solid #aaa', borderRadius: 4, cursor: 'grab' }}
        >
          <span style={{ fontStyle: 'italic' }}>{node.name}</span>
          <div style={{ fontSize: 12, color: '#888' }}>
            In: {node.inputs.join(', ') || 'none'}<br />
            Out: {node.outputs.join(', ') || 'none'}
          </div>
        </div>
      ))}
      {/* Custom nodes */}
      {customNodeDefs.map((node, idx) => (
        <div
          key={node.name + idx}
          draggable
          onDragStart={e => handleDragStart(e, node.name)}
          style={{ margin: '8px 0', padding: 8, background: '#fff', border: '1px solid #aaa', borderRadius: 4, cursor: 'grab' }}
        >
          <span style={{ fontStyle: 'italic' }}>{node.name}</span>
          <div style={{ fontSize: 12, color: '#888' }}>
            In: {node.inputs.join(', ') || 'none'}<br />
            Out: {node.outputs.join(', ') || 'none'}
          </div>
        </div>
      ))}
      {/* Modal dialog */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleModalSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
            <h4>Create New Node</h4>
            <div style={{ marginBottom: 12 }}>
              <label>Node Type:<br />
                <input value={nodeName} onChange={e => setNodeName(e.target.value)} style={{ width: '100%', background: '#fff', color: '#181818' }} required />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Input Ports (comma separated):<br />
                <input value={inputPorts} onChange={e => setInputPorts(e.target.value)} style={{ width: '100%', background: '#fff', color: '#181818' }} />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Output Ports (comma separated):<br />
                <input value={outputPorts} onChange={e => setOutputPorts(e.target.value)} style={{ width: '100%', background: '#fff', color: '#181818' }} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Palette
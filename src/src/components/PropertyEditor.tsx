import type { NodeType } from '../App'

type PropertyEditorProps = {
  nodes: NodeType[]
  onUpdateNode: (id: string, properties: Record<string, unknown>) => void
  immediate?: boolean
}

const PropertyEditor = ({ nodes, onUpdateNode, immediate }: PropertyEditorProps) => {
  if (!nodes.length) return null

  // For batch editing, show the name if all selected nodes have the same name
  const name = typeof nodes[0].properties.name === 'string' && nodes.every(n => n.properties.name === nodes[0].properties.name)
    ? (nodes[0].properties.name as string)
    : ''
  // For batch editing, show the type if all selected nodes have the same type
  const type = typeof nodes[0].type === 'string' && nodes.every(n => n.type === nodes[0].type)
    ? nodes[0].type
    : ''

  // For batch editing, show the label if all selected nodes have the same label
  const pythonFile = typeof nodes[0].properties.pythonFile === 'string' && nodes.every(n => n.properties.pythonFile === nodes[0].properties.pythonFile)
    ? (nodes[0].properties.pythonFile as string)
    : ''
  const description = typeof nodes[0].properties.description === 'string' && nodes.every(n => n.properties.description === nodes[0].properties.description)
    ? (nodes[0].properties.description as string)
    : ''

  // Immediate update handler
  const handleChange = (field: string, value: string) => {
    nodes.forEach(node => {
      onUpdateNode(node.id, { ...node.properties, [field]: value })
    })
  }

  return (
    <div style={{ width: '100%', padding: 24, background: 'inherit', height: '100%', boxSizing: 'border-box', overflowY: 'auto', color: '#181818' }}>
      <h3>Properties</h3>
      <div style={{ marginBottom: 12 }}>
        <label>Node Type:<br />
          <input
            type="text"
            value={type}
            readOnly
            style={{ width: '100%', background: '#f5f5f5', color: '#888', fontStyle: 'italic' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Node Name:<br />
          <input
            type="text"
            value={name}
            onChange={e => immediate ? handleChange('name', e.target.value) : undefined}
            style={{ width: '100%', background: '#fff', color: '#181818' }}
            placeholder={nodes.length > 1 ? '(multiple)' : ''}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Python File Path:<br />
          <input
            type="text"
            value={pythonFile}
            onChange={e => immediate ? handleChange('pythonFile', e.target.value) : undefined}
            style={{ width: '100%', background: '#fff', color: '#181818' }}
            placeholder={nodes.length > 1 ? '(multiple)' : ''}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Description:<br />
          <input
            type="text"
            value={description}
            onChange={e => immediate ? handleChange('description', e.target.value) : undefined}
            style={{ width: '100%', background: '#fff', color: '#181818' }}
            placeholder={nodes.length > 1 ? '(multiple)' : ''}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Input Ports:<br />
          <div style={{ color: '#181818', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, padding: '6px 8px', marginTop: 4 }}>
            {Array.isArray(nodes[0].properties.inputs) && nodes[0].properties.inputs.length > 0
              ? (nodes[0].properties.inputs as string[]).join(', ')
              : 'None'}
          </div>
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Output Ports:<br />
          <div style={{ color: '#181818', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, padding: '6px 8px', marginTop: 4 }}>
            {Array.isArray(nodes[0].properties.outputs) && nodes[0].properties.outputs.length > 0
              ? (nodes[0].properties.outputs as string[]).join(', ')
              : 'None'}
          </div>
        </label>
      </div>
      {nodes.length > 1 && <div style={{ color: '#888', marginTop: 8 }}>Editing {nodes.length} nodes</div>}
    </div>
  )
}

export default PropertyEditor
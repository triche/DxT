import React, { useState } from 'react'
import { validatePalette, formatValidationErrors } from '../utils/validation'

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

  // Save Palette handler
  const handleSavePalette = async () => {
    // Exclude built-in nodes
    const nodesToSave = customNodeDefs;
    const json = JSON.stringify(nodesToSave, null, 2);
    // Use File System Access API if available
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as unknown as { showSaveFilePicker: (options: { suggestedName?: string; types?: Array<{ description: string; accept: Record<string, string[]> }>; }) => Promise<unknown> }).showSaveFilePicker({
          suggestedName: 'Palette.json',
          types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        });
        // @ts-expect-error: File System Access API types are not standard
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
      } catch {
        // User cancelled or not supported
      }
    } else {
      // Fallback: download as blob
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Palette.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
  };

  // Load Palette handler
  const handleLoadPalette = async () => {
    // Use File System Access API if available
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as unknown as { showOpenFilePicker: (options: { types?: Array<{ description: string; accept: Record<string, string[]> }>; multiple?: boolean; }) => Promise<unknown[]> }).showOpenFilePicker({
          types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
          multiple: false,
        });
        // @ts-expect-error: File System Access API types are not standard
        const file = await fileHandle.getFile();
        const text = await file.text();
        importPaletteFromJson(text);
      } catch {
        // User cancelled or not supported
      }
    } else {
      // Fallback: use input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files && target.files[0];
        if (!file) return;
        const text = await file.text();
        importPaletteFromJson(text);
      };
      input.click();
    }
  };

  // Helper to import palette JSON and ensure unique node names
  const importPaletteFromJson = (text: string) => {
    try {
      const loaded: { name: string; inputs: string[]; outputs: string[] }[] = JSON.parse(text);
      
      // Validate the loaded palette data
      const validationErrors = validatePalette(loaded);
      if (validationErrors.length > 0) {
        const errorMessage = formatValidationErrors(validationErrors);
        alert(`Invalid palette file:\n${errorMessage}`);
        return;
      }
      
      loaded.forEach(def => {
        const baseName = def.name;
        let name = baseName;
        let i = 1;
        // Ensure unique name
        while ([...customNodeDefs, ...builtInNodes].some(n => n.name === name)) {
          name = baseName + i;
          i++;
        }
        onAddCustomNodeDef({ ...def, name });
      });
    } catch (error) {
      alert(`Failed to load palette: ${error instanceof Error ? error.message : 'Invalid palette JSON file.'}`);
    }
  };

  return (
    <div style={{ width: '30vw', minWidth: 200, maxWidth: 400, background: '#f4f4f4', borderRight: '1px solid #ccc', padding: 16, boxSizing: 'border-box', height: '100vh', overflowY: 'auto', marginTop: 48 }}>
      <h3>Palette</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={handleNewNode}>New Node</button>
        <button onClick={handleSavePalette}>Save Palette</button>
        <button onClick={handleLoadPalette}>Load Palette</button>
      </div>
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
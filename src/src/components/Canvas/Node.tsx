import React from 'react';
import Port from './Port';
import type { NodeType } from '../../App';

type WireType = {
  id: string;
  fromNodeId: string;
  fromPortIdx: number;
  toNodeId: string;
  toPortIdx: number;
};

type WireDraftType = {
  fromNodeId: string;
  fromPortIdx: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
} | null;

type NodeProps = {
  node: NodeType;
  selectedNodeIds: string[];
  wires: WireType[];
  wireDraft: WireDraftType;
  onSelectNode: (id: string, multi?: boolean) => void;
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onStartWire: (fromNodeId: string, fromPortIdx: number, start: { x: number; y: number }) => void;
  onCompleteWire: (toNodeId: string, toPortIdx: number) => void;
  outputPortRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  inputPortRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  draggingId: string | null;
  handleMouseDown: (e: React.MouseEvent, node: NodeType) => void;
};

function getPorts(props: Record<string, unknown>, key: 'inputs' | 'outputs'): string[] {
  const val = props[key];
  if (Array.isArray(val) && val.every(p => typeof p === 'string')) {
    return val as string[];
  }
  return [];
}

const Node: React.FC<NodeProps> = ({ node, selectedNodeIds, wires, wireDraft, onSelectNode, onNodeContextMenu, onStartWire, onCompleteWire, outputPortRefs, inputPortRefs, draggingId, handleMouseDown }) => {
  const inputs = getPorts(node.properties, 'inputs');
  const outputs = getPorts(node.properties, 'outputs');
  const name = node.properties?.name as string;
  return (
    <div
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        onSelectNode(node.id, e.shiftKey);
      }}
      onMouseDown={e => {
        e.stopPropagation();
        e.preventDefault();
        handleMouseDown(e, node);
      }}
      onContextMenu={e => onNodeContextMenu(e, node.id)}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        padding: 12,
        paddingLeft: 28,
        paddingRight: 28,
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
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        overflow: 'visible',
      }}
    >
      <div style={{ userSelect: 'none' }}>{name || node.type}</div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 2, fontStyle: 'italic', userSelect: 'none' }}>{node.type}</div>
      {/* Output connectors */}
      {outputs.length > 0 && outputs.map((port, i) => {
        const isConnected = wires.some(w => w.fromNodeId === node.id && w.fromPortIdx === i);
        return (
          <Port
            key={port + i}
            type="output"
            isConnected={isConnected}
            ref={el => { outputPortRefs.current[`${node.id}-${i}`] = el; }}
            style={{ right: -16, top: `${28 * (i + 1) - 8}px` }}
            onMouseDown={e => {
              e.stopPropagation();
              if (outputPortRefs.current[`${node.id}-${i}`]) {
                onStartWire(node.id, i, { x: 0, y: 0 });
              }
            }}
          />
        );
      })}
      {/* Input connectors */}
      {inputs.length > 0 && inputs.map((port, i) => {
        const isConnected = wires.some(w => w.toNodeId === node.id && w.toPortIdx === i);
        return (
          <Port
            key={port + i}
            type="input"
            isConnected={isConnected}
            ref={el => { inputPortRefs.current[`${node.id}-${i}`] = el; }}
            style={{ left: -16, top: `${28 * (i + 1) - 8}px` }}
            onMouseUp={() => {
              if (wireDraft) {
                onCompleteWire(node.id, i);
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default Node;

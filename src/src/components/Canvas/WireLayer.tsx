import React from 'react';
import type { NodeType } from '../../App';

type WireType = {
  id: string;
  fromNodeId: string;
  fromPortIdx: number;
  toNodeId: string;
  toPortIdx: number;
};

type WireLayerProps = {
  nodes: NodeType[];
  wires: WireType[];
  wireDraft: {
    fromNodeId: string;
    fromPortIdx: number;
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
  outputPortRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  inputPortRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  canvasRef: React.RefObject<HTMLDivElement>;
};

function getPortCenter(portEl: HTMLDivElement, canvasEl: HTMLDivElement) {
  const portRect = portEl.getBoundingClientRect();
  const canvasRect = canvasEl.getBoundingClientRect();
  return {
    x: portRect.left + portRect.width / 2 - canvasRect.left,
    y: portRect.top + portRect.height / 2 - canvasRect.top,
  };
}

const WireLayer: React.FC<WireLayerProps> = ({ nodes, wires, wireDraft, outputPortRefs, inputPortRefs, canvasRef }) => (
  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
    {wires.map(wire => {
      const fromNode = nodes.find(n => n.id === wire.fromNodeId);
      const toNode = nodes.find(n => n.id === wire.toNodeId);
      if (!fromNode || !toNode || !canvasRef.current) return null;
      const fromPort = outputPortRefs.current[`${wire.fromNodeId}-${wire.fromPortIdx}`];
      const toPort = inputPortRefs.current[`${wire.toNodeId}-${wire.toPortIdx}`];
      if (!fromPort || !toPort) return null;
      const from = getPortCenter(fromPort, canvasRef.current);
      const to = getPortCenter(toPort, canvasRef.current);
      const midX = (from.x + to.x) / 2;
      return (
        <polyline
          key={wire.id}
          points={`${from.x},${from.y} ${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`}
          fill="none"
          stroke="#181818"
          strokeWidth={2}
        />
      );
    })}
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
);

export default WireLayer;

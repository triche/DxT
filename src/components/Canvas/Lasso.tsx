import React from 'react';

type LassoProps = {
  lasso: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
};

const Lasso: React.FC<LassoProps> = ({ lasso }) => {
  if (!lasso) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: Math.min(lasso.start.x, lasso.end.x),
        top: Math.min(lasso.start.y, lasso.end.y),
        width: Math.abs(lasso.end.x - lasso.start.x),
        height: Math.abs(lasso.end.y - lasso.start.y),
        background: 'rgba(100, 150, 255, 0.15)',
        border: '1.5px dashed #4a90e2',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  );
};

export default Lasso;

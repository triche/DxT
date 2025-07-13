import React from 'react';

type PortProps = {
  type: 'input' | 'output';
  isConnected: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
};

const Port = React.forwardRef<HTMLDivElement, PortProps>(
  ({ type, isConnected, onMouseDown, onMouseUp, style }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: type === 'output' ? 'crosshair' : 'pointer',
          zIndex: 3,
          ...style,
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <svg width="24" height="24">
          {type === 'output' ? (
            <>
              <circle cx="18" cy="12" r="6" fill={isConnected ? '#4a90e2' : '#fff'} stroke="#4a90e2" strokeWidth="2" />
              <rect x="2" y="10" width="12" height="4" fill="#4a90e2" />
            </>
          ) : (
            <>
              <circle cx="6" cy="12" r="6" fill={isConnected ? '#27ae60' : '#fff'} stroke="#27ae60" strokeWidth="2" />
              <rect x="12" y="10" width="10" height="4" fill="#27ae60" />
            </>
          )}
        </svg>
      </div>
    );
  }
);

export default Port;

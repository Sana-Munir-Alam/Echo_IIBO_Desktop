import React, { useState, useRef, useEffect } from 'react';
import '../styles/Window.css';

// Window Component - Simple version: Hides minimized windows instead of unmounting to preserve state
const Window = ({id, title, icon, children, x = 100, y = 100, width = 600, height = 400, minimized = false, maximized = false, zIndex = 1, active = false, onClose, onMinimize, onMaximize, onActivate, onDragStop, onResizeStop }) => {
  
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef(null);

  // Update position when props change
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x, y });
    }
  }, [x, y, isDragging]);

  // Update size when props change
  useEffect(() => {
    if (!isResizing) {
      setSize({ width, height });
    }
  }, [width, height, isResizing]);

  // Handles window activation
  const handleActivate = () => {
    if (!active) {
      onActivate(id);
    }
  };

  //  Handles drag start
  const handleMouseDown = (e) => {
    if (maximized) return;
    if (e.target.closest('.window-controls')) return;
    
    handleActivate();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resize start
  const handleResizeStart = (e) => {
    if (maximized) return;
    
    e.stopPropagation();
    handleActivate();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Simple close handler - just calls onClose
  const handleClose = () => {
    handleActivate();
    onClose(id);
  };

  // Simple minimize handler
  const handleMinimize = () => {
    handleActivate();
    onMinimize(id);
  };

  // Simple maximize handler
  const handleMaximize = () => {
    handleActivate();
    onMaximize(id);
  };

  // Add event listeners
  useEffect(() => {
    // Handle Drag Move
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = Math.max(0, e.clientY - dragStart.y);
        setPosition({ x: newX, y: newY });
      }
      
      if (isResizing) {
        const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    // Handle Drag End
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onDragStop) {
          onDragStop(position.x, position.y);
        }
      }
      
      if (isResizing) {
        setIsResizing(false);
        if (onResizeStop) {
          onResizeStop(size.width, size.height);
        }
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [
    isDragging,
    isResizing,
    dragStart,
    resizeStart,
    position.x,
    position.y,
    size.width,
    size.height,
    onDragStop,
    onResizeStop
  ]);

  // Calculate window style - HIDE instead of unmounting when minimized
  const windowStyle = {
    position: 'fixed',
    left: maximized ? 0 : `${position.x}px`,
    top: maximized ? 0 : `${position.y}px`,
    width: maximized ? '100vw' : `${size.width}px`,
    height: maximized ? 'calc(100vh - 48px)' : `${size.height}px`,
    zIndex: zIndex,
    cursor: isDragging ? 'grabbing' : 'default',
    display: minimized ? 'none' : 'block' // Hide instead of unmounting
  };

  return (
    <div ref={windowRef} id={`window-${id}`} className={`window-wrapper ${maximized ? 'maximized' : ''} ${active ? 'active' : ''}`} style={windowStyle} onClick={handleActivate}>
      
      {/* Window Header */}
      <div className={`window-header ${active ? '' : 'inactive'}`} onMouseDown={handleMouseDown}
        style={{ cursor: maximized ? 'default' : 'grab'}}
      >
        <div className="window-title" id={`window-title-${id}`}>
          <span className="window-icon">{icon}</span>
          <span className="window-title-text">{title}</span>
        </div>
        
        <div className="window-controls">
          <button id={`window-minimize-${id}`} className="window-control-btn" onClick={handleMinimize} title="Minimize">
            _
          </button>
          
          <button id={`window-maximize-${id}`} className="window-control-btn" onClick={handleMaximize} title={maximized ? 'Restore' : 'Maximize'}>
            {maximized ? '🗗' : '🗖'}
          </button>
          
          <button id={`window-close-${id}`} className="window-control-btn close" onClick={handleClose} title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="window-body" id={`window-body-${id}`}
        style={{
          width: '100%',
          height: 'calc(100% - 32px)',
          overflow: 'auto'
        }}
      >
        {children}
      </div>

      {/* Resize Handle */}
      {!maximized && (
        <div className="window-resize-handle" onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '16px',
            height: '16px',
            cursor: 'nwse-resize',
            zIndex: 10
          }}
        >
          <div style={{
            position: 'absolute',
            right: '2px',
            bottom: '2px',
            width: '12px',
            height: '12px',
            borderRight: '2px solid #999',
            borderBottom: '2px solid #999'
          }} />
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="window-debug">
          <div>ID: {id}</div>
          <div>Size: {Math.round(size.width)}x{Math.round(size.height)}</div>
          <div>Position: {Math.round(position.x)}, {Math.round(position.y)}</div>
          <div>State: {maximized ? 'Maximized' : minimized ? 'Minimized' : 'Normal'}</div>
        </div>
      )}
    </div>
  );
};

export default Window;
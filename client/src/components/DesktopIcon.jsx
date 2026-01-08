import React, { useState, useEffect } from 'react';
import '../styles/DesktopIcon.css';

const DesktopIcon = ({id, name, icon, type = 'folder', isFolder = false, fileData = null, x = 0, y = 0, selected = false, viewMode = 'medium', onClick, onDoubleClick, onRightClick }) => {
  const [position, setPosition] = useState({ x, y });

  // Update position when props change
  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  // Truncate long file names
  const truncateName = (fileName, maxLength) => {
    if (fileName.length <= maxLength) return fileName;
    
    // Extract extension if exists
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
      // No extension, just truncate
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    const extension = fileName.substring(lastDot);
    const nameWithoutExt = fileName.substring(0, lastDot);
    
    // Calculate available space for name part
    const availableLength = maxLength - extension.length - 3; // -3 for "..."
    // Extension too long, just truncate everything
    if (availableLength < 1) {
      return fileName.substring(0, maxLength - 3) + '...';
    }
    
    return nameWithoutExt.substring(0, availableLength) + '...' + extension;
  };

  // Get max length based on view mode
  const getMaxNameLength = () => {
    switch (viewMode) {
      case 'small': return 8;
      case 'medium': return 12;
      case 'large': return 16;
      default: return 12;
    }
  };

  // Handles icon click
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(id, fileData, e);
    }
  };

  // Handles icon double-click
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) { 
      onDoubleClick(id, fileData); 
    }
  };

  // Handles icon right-click
  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onRightClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      onRightClick(id, fileData, {
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      });
    }
  };

  // Gets file type display name
  const getFileType = () => {
    if (isFolder) return 'Folder';
    
    switch (type) {
      case 'txt': return 'Text Document';
      case 'cpp': return 'C++ Source File';
      case 'jpg':
      case 'png': return 'Image File';
      case 'mp4':
      case 'avi':
      case 'mov': return 'Video File';
      case 'pdf': return 'PDF Document';
      default: return 'File';
    }
  };

  // Icon container style
  const iconStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transition: 'all 0.2s ease',
    zIndex: selected ? 10 : 1
  };

  // Get appropriate icon based on type
  const getIcon = () => {
    if (icon) return icon;
    
    if (isFolder) return '📁';
    
    switch (type) {
      case 'txt': return '📄';
      case 'cpp': return '📘';
      case 'jpg':
      case 'png': return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov': return '🎬';
      case 'pdf': return '📕';
      default: return '📎';
    }
  };

  return (
    <div
      id={`desktop-icon-${id}`}
      className={`desktop-icon-container ${selected ? 'selected' : ''} desktop-icon-${viewMode}`}
      style={iconStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      title={`${name}\nType: ${getFileType()}\n${fileData?.size ? `Size: ${fileData.size} bytes` : ''}`}
      data-icon-id={id}
      data-icon-type={type}
      data-is-folder={isFolder}
    >
      {/* Icon */}
      <div className="desktop-icon-image">
        {getIcon()}
      </div>
      
      {/* Name Label */}
      <div className="desktop-icon-label">
        {name}
      </div>
      
      {/* Selection Indicator */}
      {selected && (
        <div className="desktop-icon-selection"></div>
      )}
      
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="desktop-icon-debug">
          <div>ID: {id}</div>
          <div>Type: {type}</div>
          <div>Pos: {Math.round(position.x)}, {Math.round(position.y)}</div>
          <div>Mode: {viewMode}</div>
        </div>
      )}
    </div>
  );
};

DesktopIcon.defaultProps = {
  id: '',
  name: 'Icon',
  icon: '',
  type: 'folder',
  isFolder: false,
  fileData: null,
  x: 0,
  y: 0,
  selected: false,
  viewMode: 'medium',
  onClick: null,
  onDoubleClick: null,
  onRightClick: null
};

export default DesktopIcon;
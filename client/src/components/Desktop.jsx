import React, { useState, useEffect } from 'react';
import DesktopIcon from './DesktopIcon';
import '../styles/Desktop.css';

const Desktop = ({ wallpaper, onDesktopContextMenu, onFileContextMenu, onWindowActivate, onOpenFile, onOpenFolder, viewMode = 'medium', sortMode = 'type'}) => {
  const [icons, setIcons] = useState([]);
  const [selectedIcons, setSelectedIcons] = useState(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Grid configuration based on view mode
  const gridConfig = {
    small: { iconsPerColumn: 9, iconSize: 60, spacing: 10 },
    medium: { iconsPerColumn: 7, iconSize: 80, spacing: 15 },
    large: { iconsPerColumn: 5, iconSize: 100, spacing: 20 }
  };

  useEffect(() => {
    const fetchDesktopFiles = async () => {
      try {
        console.log('📂 Fetching desktop files...');
        const response = await fetch(`${API_URL}/api/files?path=C:\\Desktop`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.files) {
            let sortedFiles = sortFiles(data.files, sortMode);
            const fileIcons = positionIconsInGrid(sortedFiles);
            
            setIcons(fileIcons);
            console.log(`✅ Loaded ${fileIcons.length} files from desktop`);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching desktop files:', error);
      }
    };

    fetchDesktopFiles();
  }, [API_URL, refreshKey, viewMode, sortMode]);

  const sortFiles = (files, mode) => {
    const filesCopy = [...files];
    
    switch (mode) {
      case 'name':
        return filesCopy.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'type':
        const typeOrder = {
          'folder': 0,
          'mp4': 1, 'avi': 1, 'mov': 1,
          'jpg': 2, 'jpeg': 2, 'png': 2, 'gif': 2,
          'pdf': 3,
          'cpp': 4,
          'txt': 5,
          'other': 6
        };
        
        return filesCopy.sort((a, b) => {
          const aType = a.isFolder ? 'folder' : a.type;
          const bType = b.isFolder ? 'folder' : b.type;
          const aOrder = typeOrder[aType] !== undefined ? typeOrder[aType] : 6;
          const bOrder = typeOrder[bType] !== undefined ? typeOrder[bType] : 6;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return a.name.localeCompare(b.name);
        });
      
      case 'date_created':
        return filesCopy.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateA - dateB;
        });
      
      case 'date_modified':
        return filesCopy.sort((a, b) => {
          const dateA = new Date(a.modifiedAt || 0);
          const dateB = new Date(b.modifiedAt || 0);
          return dateA - dateB;
        });
      
      default:
        return filesCopy;
    }
  };

  const positionIconsInGrid = (files) => {
    const config = gridConfig[viewMode];
    const {iconsPerColumn, iconSize, spacing } = config;
    
    const startX = 20;
    const startY = 20;
    const columnWidth = iconSize + spacing;
    const rowHeight = iconSize + spacing;
    
    // Reserve first position for "This PC" icon
    const fileIcons = files.map((file, index) => {
      const adjustedIndex = index + 1; // Skip first position
      const column = Math.floor(adjustedIndex / iconsPerColumn);
      const row = adjustedIndex % iconsPerColumn;
      
      return {
        id: file._id,
        name: file.name,
        icon: getFileIcon(file.type, file.isFolder),
        type: file.type,
        isFolder: file.isFolder,
        data: file,
        x: startX + (column * columnWidth),
        y: startY + (row * rowHeight)
      };
    });

    // Add "This PC" icon at the top
    const thisPCIcon = {
      id: 'this-pc',
      name: 'This PC',
      icon: '💻',
      type: 'system',
      isFolder: true,
      data: { isSystemFolder: true, systemType: 'this-pc' },
      x: startX,
      y: startY
    };

    return [thisPCIcon, ...fileIcons];
  };

  const getFileIcon = (type, isFolder) => {
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

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    onDesktopContextMenu(e, {
      x: e.clientX,
      y: e.clientY
    });
    
    setSelectedIcons(new Set());
  };

  const handleIconClick = (iconId, fileData, event) => {
    const e = event || { ctrlKey: false, metaKey: false, shiftKey: false };
    
    const newSelection = new Set(selectedIcons);
    
    if (e.ctrlKey || e.metaKey) {
      if (newSelection.has(iconId)) {
        newSelection.delete(iconId);
      } else {
        newSelection.add(iconId);
      }
    } else {
      newSelection.clear();
      newSelection.add(iconId);
    }
    
    setSelectedIcons(newSelection);
  };

  const handleIconDoubleClick = (iconId, fileData) => {
    console.log(`🖱️ Double-clicked: ${fileData?.name || iconId}`);
    
    // Handle "This PC" system icon
    if (fileData?.isSystemFolder && fileData?.systemType === 'this-pc') {
      console.log('💻 Opening This PC in File Explorer');
      if (onOpenFolder) {
        onOpenFolder({ path: 'C:', isSystemFolder: true });
      }
      setSelectedIcons(new Set());
      return;
    }
    
    // Handle regular folders
    if (fileData?.isFolder) {
      if (onOpenFolder) {
        onOpenFolder({ path: `${fileData.path}\\${fileData.name}` });
      }
    } else if (fileData) {
      if (onOpenFile) {
        onOpenFile(fileData);
      }
    }
    
    setSelectedIcons(new Set());
  };

  const handleIconRightClick = (iconId, fileData, position) => {
    // Don't show context menu for "This PC"
    if (fileData?.isSystemFolder) {
      return;
    }
    
    if (!selectedIcons.has(iconId)) {
      setSelectedIcons(new Set([iconId]));
    }
    
    onFileContextMenu(null, fileData, position);
  };

  const handleDesktopClick = (e) => {
    if (e.target.id === 'desktop-container') {
      setSelectedIcons(new Set());
      if (onWindowActivate) {
        onWindowActivate(null);
      }
    }
  };
  
  const refreshDesktop = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    window.refreshDesktop = refreshDesktop;
    
    return () => {
      delete window.refreshDesktop;
    };
  }, []);

  return (
    <div 
      id="desktop-container"
      className="desktop-container"
      style={{ 
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleRightClick}
    >
      {icons.map(icon => (
        <DesktopIcon
          key={`icon-${icon.id}`}
          id={icon.id}
          name={icon.name}
          icon={icon.icon}
          type={icon.type}
          isFolder={icon.isFolder}
          fileData={icon.data}
          x={icon.x}
          y={icon.y}
          selected={selectedIcons.has(icon.id)}
          viewMode={viewMode}
          onClick={handleIconClick}
          onDoubleClick={handleIconDoubleClick}
          onRightClick={handleIconRightClick}
        />
      ))}
    </div>
  );
};

Desktop.defaultProps = {
  wallpaper: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
  onDesktopContextMenu: () => {},
  onFileContextMenu: () => {},
  onOpenFile: () => {},
  onOpenFolder: () => {},
  viewMode: 'medium',
  sortMode: 'type'
};

export default Desktop;
import React, { useEffect, useRef, useState } from 'react';
import '../styles/ContextMenu.css';

const ContextMenu = ({ type, x, y, data, onClose, onAction, wallpaperOptions = [], currentViewMode = 'medium', currentSortMode = 'name', currentWallpaper = null }) => {
  const menuRef = useRef(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ left: 0, top: 0, openLeft: false });
  const closeTimerRef = useRef(null);

  // Desktop context menu items
  const desktopMenuItems = [
    { id: 'view', label: 'View', hasSubmenu: true },
    { id: 'sort_by', label: 'Sort by', hasSubmenu: true },
    { id: 'divider1', type: 'divider' },
    { id: 'refresh', label: 'Refresh' },
    { id: 'new', label: 'New', hasSubmenu: true },
    { id: 'upload', label: 'Add File' },
    { id: 'wallpaper', label: 'Change Wallpaper', hasSubmenu: true },
    { id: 'terminal', label: 'Open Terminal Here' },
  ];

  // File context menu items
  const fileMenuItems = [
    { id: 'open', label: 'Open' },
    { id: 'open_with', label: 'Open With', hasSubmenu: true },
    { id: 'open_new_window', label: 'Open in New Window' },
    { id: 'divider1', type: 'divider' },
    { id: 'rename', label: 'Rename' },
    { id: 'properties', label: 'Properties' },
    { id: 'divider2', type: 'divider' },
    { id: 'delete', label: 'Delete', danger: true },
  ];

  // Folder context menu items
  const folderMenuItems = [
    { id: 'open', label: 'Open' },
    { id: 'open_new_window', label: 'Open in New Window' },
    { id: 'open_terminal', label: 'Open in Terminal' },
    { id: 'divider1', type: 'divider' },
    { id: 'rename', label: 'Rename' },
    { id: 'properties', label: 'Properties' },
    { id: 'divider2', type: 'divider' },
    { id: 'delete', label: 'Delete', danger: true },
  ];

  // View submenu items
  const viewSubmenu = [
    { id: 'view_small', label: 'Small icons' },
    { id: 'view_medium', label: 'Medium icons' },
    { id: 'view_large', label: 'Large icons' },
  ];

  // Sort by submenu items
  const sortSubmenu = [
    { id: 'sort_name', label: 'Name' },
    { id: 'sort_type', label: 'Type' },
    { id: 'sort_date_created', label: 'Date created' },
    { id: 'sort_date_modified', label: 'Date modified' },
  ];

  // New submenu items
  const newSubmenu = [
    { id: 'new_folder', label: 'Folder' },
    { id: 'new_text', label: 'Text File' },
  ];

  // Open With submenu items (for files)
  const openWithSubmenu = [
    { id: 'open_notepad', label: 'Notepad' },
    { id: 'open_explorer', label: 'File Explorer' },
    { id: 'open_terminal', label: 'Terminal' },
  ];

  // Get menu items based on type
  const getMenuItems = () => {
    switch (type) {
      case 'desktop':
        return desktopMenuItems;
      case 'file':
        return fileMenuItems;
      case 'folder':
        return folderMenuItems;
      default:
        return [];
    }
  };

  // Get submenu items
  const getSubmenuItems = (menuId) => {
    switch (menuId) {
      case 'view':
        return viewSubmenu;
      case 'sort_by':
        return sortSubmenu;
      case 'new':
        return newSubmenu;
      case 'open_with':
        return openWithSubmenu;
      case 'wallpaper':
        return wallpaperOptions.map((url, index) => ({
          id: `wallpaper_${index}`,
          label: `Wallpaper ${index + 1}`,
          data: url
        }));
      default:
        return [];
    }
  };

  // Check if a submenu item is currently selected (for showing check marks)
  const isSubmenuItemSelected = (menuId, subItemId, subItemData = null) => {
    if (menuId === 'view') {
      const viewMode = subItemId.replace('view_', '');
      return viewMode === currentViewMode;
    }
    
    if (menuId === 'sort_by') {
      const sortMode = subItemId.replace('sort_', '');
      return sortMode === currentSortMode;
    }
    
    if (menuId === 'wallpaper' && subItemData && currentWallpaper) {
      return subItemData === currentWallpaper;
    }
    
    return false;
  };

  // Position menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 5;
      }

      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 5;
      }

      adjustedX = Math.max(5, adjustedX);
      adjustedY = Math.max(5, adjustedY);

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [onClose]);

  // Handle Menu Item Click
  const handleMenuItemClick = (action, actionData = null) => {
    console.log(`🎯 Context menu action: ${action}`, actionData);
    
    // Handle view mode changes
    if (action.startsWith('view_')) {
      const viewMode = action.replace('view_', '');
      if (window.setDesktopViewMode) {
        window.setDesktopViewMode(viewMode);
        console.log(`👁️ View mode changed to: ${viewMode}`);
      }
      onClose();
      return;
    }
    
    // Handle sort mode changes
    if (action.startsWith('sort_')) {
      const sortMode = action.replace('sort_', '');
      if (window.setDesktopSortMode) {
        window.setDesktopSortMode(sortMode);
        console.log(`🔤 Sort mode changed to: ${sortMode}`);
      }
      onClose();
      return;
    }
    
    const actionMap = {
      // Desktop actions
      'refresh': 'refresh',
      'upload': 'upload_file',
      'terminal': 'open_terminal',
      'properties': 'properties',
      
      // File actions
      'open': 'open_file',
      'rename': 'rename_file',
      'delete': 'delete_file',
      
      // New items
      'new_folder': 'create_folder',
      'new_text': 'create_text_file',
      
      // Wallpaper
      'wallpaper_0': 'change_wallpaper',
      'wallpaper_1': 'change_wallpaper',
      'wallpaper_2': 'change_wallpaper',

      // Open with options
      'open_notepad': 'open_notepad',
      'open_explorer': 'open_explorer',
      'open_terminal': 'open_terminal',
    };

    const mappedAction = actionMap[action];
    if (mappedAction) {
      onAction(mappedAction, actionData || data);
      onClose();
    } else {
      console.warn(`Unknown action: ${action}`);
    }
  };

  // Show submenu INSTANTLY when hovering over parent menu item
  const handleSubmenuMouseEnter = (menuId, element) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const submenuWidth = 200;
    const submenuHeight = 250;
    
    let left = rect.right + 2;
    let top = rect.top - 6;
    
    const openLeft = left + submenuWidth > viewportWidth;
    if (openLeft) {
      left = rect.left - submenuWidth - 2;
    }
    
    if (top + submenuHeight > viewportHeight) {
      top = Math.max(5, viewportHeight - submenuHeight - 5);
    }
    
    setSubmenuPosition({ left, top, openLeft });
    setActiveSubmenu(menuId);
  };

  const handleSubmenuMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 100);
  };

  const handleSubmenuEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleSubmenuLeave = () => {
    setActiveSubmenu(null);
  };

  const menuItems = getMenuItems();

  return (
    <>
      <div 
        className="context-menu-overlay"
        onClick={onClose}
      />
      
      <div 
        id="context-menu-container"
        className="context-menu-container"
        ref={menuRef}
        style={{ 
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`
        }}
      >
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div 
                key={`divider-${index}`}
                className="context-menu-divider"
              />
            );
          }

          const submenuItems = item.hasSubmenu ? getSubmenuItems(item.id) : [];
          const isSubmenuActive = activeSubmenu === item.id;

          return (
            <div
              key={`menu-${item.id}`}
              id={`menu-item-${item.id}`}
              className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.hasSubmenu ? 'has-submenu' : ''} ${isSubmenuActive ? 'active' : ''}`}
              onClick={() => !item.hasSubmenu && handleMenuItemClick(item.id)}
              onMouseEnter={(e) => {
                if (item.hasSubmenu) {
                  handleSubmenuMouseEnter(item.id, e.currentTarget);
                }
              }}
              onMouseLeave={() => {
                if (item.hasSubmenu) {
                  handleSubmenuMouseLeave();
                }
              }}
            >
              {item.label}
              
              {item.hasSubmenu && submenuItems.length > 0 && isSubmenuActive && (
                <div 
                  className={`context-submenu ${submenuPosition.openLeft ? 'context-submenu-left' : ''}`}
                  id={`submenu-${item.id}`}
                  style={{
                    left: `${submenuPosition.left}px`,
                    top: `${submenuPosition.top}px`,
                  }}
                  onMouseEnter={handleSubmenuEnter}
                  onMouseLeave={handleSubmenuLeave}
                >
                  {submenuItems.map(subItem => {
                    const isSelected = isSubmenuItemSelected(item.id, subItem.id, subItem.data);
                    
                    return (
                      <div
                        key={`submenu-${item.id}-${subItem.id}`}
                        id={`submenu-item-${subItem.id}`}
                        className={`context-menu-item ${subItem.danger ? 'danger' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleMenuItemClick(subItem.id, subItem.data)}
                      >
                        <span className="context-menu-item-check">
                          {isSelected && '✓'}
                        </span>
                        <span className="context-menu-item-label">
                          {subItem.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

ContextMenu.defaultProps = {
  type: 'desktop',
  x: 0,
  y: 0,
  data: null,
  onClose: () => {},
  onAction: () => {},
  wallpaperOptions: [],
  currentViewMode: 'medium',
  currentSortMode: 'name',
  currentWallpaper: null
};

export default ContextMenu;
import React, { useState, useEffect } from 'react';
import Error from './Error';
import '../styles/FileExplorer.css';

const FileExplorer = ({ onClose, onMinimize, onMaximize, initialPath = 'C:' }) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [folderTree, setFolderTree] = useState({});
  const [expandedFolders, setExpandedFolders] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Allowed root folders - only these can be accessed
  const ALLOWED_FOLDERS = ['Desktop', 'Documents', 'Pictures', 'Videos', 'Downloads'];

  useEffect(() => {
    buildFolderTreeWithChildren();
  }, []);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  useEffect(() => {
    // Listen for navigation requests from password validation
    const handleNavigateToPath = (e) => {
      const { path } = e.detail;
      console.log(`📂 Navigating to path after password validation: ${path}`);
      setCurrentPath(path);
      setSelectedFile(null);
    };
    
    window.addEventListener('navigateToPath', handleNavigateToPath);
    
    return () => {
      window.removeEventListener('navigateToPath', handleNavigateToPath);
    };
  }, []);

  // Build folder tree with first-level children only
  const buildFolderTreeWithChildren = async () => {
    const tree = {
      'C:': {
        name: 'C:',
        path: 'C:',
        children: {}
      }
    };

    // For each allowed folder, fetch its direct children
    for (const folderName of ALLOWED_FOLDERS) {
      const folderPath = `C:\\${folderName}`;
      
      try {
        const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(folderPath)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            tree['C:'].children[folderName] = {
              name: folderName,
              path: folderPath,
              children: data.files || []
            };
          } else {
            tree['C:'].children[folderName] = {
              name: folderName,
              path: folderPath,
              children: []
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching ${folderName}:`, error);
        tree['C:'].children[folderName] = {
          name: folderName,
          path: folderPath,
          children: []
        };
      }
    }

    setFolderTree(tree);
  };

  // Fetch files for current directory
  const fetchFiles = async (path) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can access this path
  const canAccessPath = (path) => {
    if (path === 'C:') return true;
    
    const pathParts = path.split('\\').filter(p => p && p !== 'C:');
    
    // Can only access first-level folders
    if (pathParts.length === 1 && ALLOWED_FOLDERS.includes(pathParts[0])) {
      return true;
    }
    
    return false;
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleFileClick = (file) => {
    setSelectedFile(file._id === selectedFile ? null : file._id);
  };
  
  const handleFileDoubleClick = (file) => {
    if (file.isFolder) {
      const newPath = currentPath === 'C:' ? `C:\\${file.name}` : `${currentPath}\\${file.name}`;
      
      // Check if this is an allowed first-level folder
      const isAllowedFolder = currentPath === 'C:' && canAccessPath(newPath);
      
      if (isAllowedFolder) {
        // This is a first-level allowed folder - check for password lock
        if (file.properties?.passwordLocked && file.properties?.passwordKeys?.length > 0) {
          console.log(`🔒 Folder "${file.name}" is password locked`);
          
          // Instead of showing error, we need to trigger password modal. Since FileExplorer doesn't have direct access to the password modal, we'll emit a custom event that App.js can listen to
          const passwordEvent = new CustomEvent('requestPasswordAccess', {
            detail: {
              file: file, action: 'open_folder_in_explorer', targetPath: newPath}
          });
          window.dispatchEvent(passwordEvent);
          return;
        }
        // Not locked, navigate normally
        setCurrentPath(newPath);
        setSelectedFile(null);
      } else {              // Not an allowed folder - show existing error
        setErrorMessage(`Access Denied: You don't have the clearance to access further.`);
        setShowError(true);
      }
    } else {
      // Trying to open a file directly - show existing error: Files cannot be opened from File Explorer regardless of password
      setErrorMessage(`Access Denied: You don't have the clearance to access further.`);
      setShowError(true);
    }
  };

  const navigateUp = () => {
    if (currentPath === 'C:') return;
    
    const pathParts = currentPath.split('\\').filter(part => part && part !== 'C:');
    pathParts.pop();
    const newPath = pathParts.length === 0 ? 'C:' : 'C:\\' + pathParts.join('\\');
    setCurrentPath(newPath);
    setSelectedFile(null);
  };

  const navigateTo = (path) => {
    // Normalize path to prevent duplicates
    const normalizedPath = path === 'C:' ? 'C:' : path.replace(/C:\\+/g, 'C:\\').replace(/\\+/g, '\\');
    
    // Only navigate if the path is different from current
    if (normalizedPath === currentPath) {
      return;
    }
    
    if (canAccessPath(normalizedPath)) {
      setCurrentPath(normalizedPath);
      setSelectedFile(null);
    } else {
      setErrorMessage(`Access Denied: You don't have the clearance to access further.`);
      setShowError(true);
    }
  };

  const handleToolbarAction = (action) => {
    switch (action) {
      case 'back':
      case 'up':
        navigateUp();
        break;
      case 'refresh':
        fetchFiles(currentPath);
        buildFolderTreeWithChildren();
        break;
      case 'view_grid':
        setViewMode('grid');
        break;
      case 'view_list':
        setViewMode('list');
        break;
      default:
        console.warn(`Unknown toolbar action: ${action}`);
    }
  };

  // Handle arrow toggle - ONLY expands/collapses, does NOT navigate
  const handleArrowToggle = (e, folderPath) => {
    e.stopPropagation();
    
    setExpandedFolders(prev => {
      if (prev.includes(folderPath)) {
        return prev.filter(p => p !== folderPath);
      } else {
        return [...prev, folderPath];
      }
    });
  };

  // Handle clicking on folder name in sidebar
  const handleSidebarFolderClick = (path) => {
    // Normalize path
    const normalizedPath = path === 'C:' ? 'C:' : path.replace(/C:\\+/g, 'C:\\').replace(/\\+/g, '\\');
    
    // Only navigate if path is different
    if (normalizedPath === currentPath) {
      return;
    }
    
    // Only allow navigation to top-level allowed folders and C:
    if (canAccessPath(normalizedPath)) {
      setCurrentPath(normalizedPath);
      setSelectedFile(null);
    } else {
      setErrorMessage(`Access Denied: You don't have the clearance to access further.`);
      setShowError(true);
    }
  };

  // Handle single click on child item - just select, no error
  const handleChildItemClick = (e) => {
    e.stopPropagation();
    // Just prevent action, don't show error on single click
  };

  // Handle double click on child item - show error
  const handleChildItemDoubleClick = (e) => {
    e.stopPropagation();
    setErrorMessage(`Access Denied: You don't have the clearance to access further.`);
    setShowError(true);
  };

  // Render the C: drive and its top-level folders
  const renderFolderTree = () => {
    if (!folderTree['C:']) return null;
    
    const cDrive = folderTree['C:'];
    const isRootExpanded = expandedFolders.includes('C:');
    const isRootActive = currentPath === 'C:';
    
    return (
      <div>
        {/* C: Drive Root */}
        <div 
          className={`sidebar-tree-item ${isRootActive ? 'active' : ''}`}
          style={{ paddingLeft: '8px' }}
          onClick={() => handleSidebarFolderClick('C:')}
        >
          <span 
            className="sidebar-tree-toggle"
            onClick={(e) => handleArrowToggle(e, 'C:')}
          >
            {isRootExpanded ? '▼' : '▶'}
          </span>
          <span className="sidebar-tree-icon">💻</span>
          <span className="sidebar-tree-label">C:</span>
        </div>

        {/* Top-level folders (Desktop, Documents, etc.) */}
        {isRootExpanded && (
          <div className="sidebar-tree-children">
            {Object.values(cDrive.children)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(folder => {
                const isFolderExpanded = expandedFolders.includes(folder.path);
                const isFolderActive = currentPath === folder.path;
                const hasChildren = folder.children && folder.children.length > 0;

                return (
                  <div key={folder.path}>
                    {/* Top-level folder (allowed) */}
                    <div 
                      className={`sidebar-tree-item ${isFolderActive ? 'active' : ''}`}
                      style={{ paddingLeft: '24px' }}
                      onClick={() => handleSidebarFolderClick(folder.path)}
                    >
                      {hasChildren && (
                        <span 
                          className="sidebar-tree-toggle"
                          onClick={(e) => handleArrowToggle(e, folder.path)}
                        >
                          {isFolderExpanded ? '▼' : '▶'}
                        </span>
                      )}
                      <span className="sidebar-tree-icon">📁</span>
                      <span className="sidebar-tree-label">{folder.name}</span>
                    </div>

                    {/* First-level children (NOT ACCESSIBLE) */}
                    {isFolderExpanded && hasChildren && (
                      <div className="sidebar-tree-children">
                        {folder.children.map((child, index) => (
                          <div 
                            key={`child-${folder.path}-${index}`}
                            className="sidebar-tree-item sidebar-tree-item-restricted"
                            style={{ paddingLeft: '40px' }}
                            onClick={handleChildItemClick}
                            onDoubleClick={handleChildItemDoubleClick}
                          >
                            <span className="sidebar-tree-icon">
                              {getFileIcon(child.type, child.isFolder)}
                            </span>
                            <span className="sidebar-tree-label">{child.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  // Build breadcrumbs from current path
  const getBreadcrumbs = () => {
    if (currentPath === 'C:') {
      return [];
    }
    
    const pathParts = currentPath.split('\\').filter(part => part && part !== 'C:');
    return pathParts;
  };

  const breadcrumbs = getBreadcrumbs();
  
  return (
    <div className="file-explorer-container">
      <div className="file-explorer-toolbar">
        <div className="toolbar-buttons">
          <button className="toolbar-btn" onClick={() => handleToolbarAction('back')} title="Back">
            ←
          </button>
          <button className="toolbar-btn" onClick={() => handleToolbarAction('up')} title="Up">
            ↑
          </button>
          <div className="toolbar-separator"></div>
          <button className="toolbar-btn" onClick={() => handleToolbarAction('refresh')} title="Refresh">
            ↻
          </button>
        </div>

        <div className="toolbar-view">
          <button className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => handleToolbarAction('view_grid')} title="Grid View">
            ▦
          </button>
          <button className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => handleToolbarAction('view_list')} title="List View">
            ≡
          </button>
        </div>
      </div>

      <div className="file-explorer-path">
        <span className="path-prefix">Path:</span>
        <button className="path-item" onClick={() => navigateTo('C:')}>
          This PC
        </button>
        {breadcrumbs.map((crumb, index) => {
          const path = 'C:\\' + breadcrumbs.slice(0, index + 1).join('\\');
          return (
            <React.Fragment key={`crumb-${index}`}>
              <span className="path-separator">›</span>
              <button className="path-item" onClick={() => navigateTo(path)}>
                {crumb}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="file-explorer-body">
        <div className="file-explorer-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">This PC</h3>
            <div className="sidebar-tree">
              {renderFolderTree()}
            </div>
          </div>
        </div>

        <div className="file-explorer-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading files...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-folder">
              <div className="empty-icon">📁</div>
              <div className="empty-text">This folder is empty</div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="file-explorer-grid">
              {files.map(file => (
                <div
                  key={`file-${file._id}`}
                  className={`file-explorer-item ${selectedFile === file._id ? 'selected' : ''}`}
                  onClick={() => handleFileClick(file)}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                  title={`${file.name}\nType: ${file.type}\nSize: ${formatFileSize(file.size)}`}
                >
                  <div className="file-explorer-item-icon">
                    {getFileIcon(file.type, file.isFolder)}
                  </div>
                  <div className="file-explorer-item-name">
                    {file.name}
                  </div>
                  {!file.isFolder && (
                    <div className="file-explorer-item-size">
                      {formatFileSize(file.size)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="file-explorer-list">
              <table className="file-list-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Date Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => (
                    <tr
                      key={`file-row-${file._id}`}
                      className={`file-list-row ${selectedFile === file._id ? 'selected' : ''}`}
                      onClick={() => handleFileClick(file)}
                      onDoubleClick={() => handleFileDoubleClick(file)}
                    >
                      <td>
                        <span className="file-list-icon">
                          {getFileIcon(file.type, file.isFolder)}
                        </span>
                        {file.name}
                      </td>
                      <td>{file.isFolder ? 'Folder' : file.type.toUpperCase()}</td>
                      <td>{file.isFolder ? '--' : formatFileSize(file.size)}</td>
                      <td>{formatDate(file.modifiedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="file-explorer-status">
        <div className="status-left">
          {files.length} item{files.length !== 1 ? 's' : ''}
          {selectedFile && ` (1 selected)`}
        </div>
        <div className="status-right">
          {selectedFile ? (
            <span>Selected: {files.find(f => f._id === selectedFile)?.name}</span>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </div>

      {showError && (
        <Error 
          message={errorMessage}
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  );
};

export default FileExplorer;
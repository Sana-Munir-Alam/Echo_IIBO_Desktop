import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import FileExplorer from './components/FileExplorer';
import Terminal from './components/Terminal';
import Notepad from './components/Notepad';
import ContextMenu from './components/ContextMenu';
import Window from './components/Window';
import MediaViewer from './components/MediaViewer';
import Properties from './components/Properties';
import PasswordAccess from './components/PasswordAccess';
import SignInPage from './components/SignInPage';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [windows, setWindows] = useState([]);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [wallpaper, setWallpaper] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [activeWindow, setActiveWindow] = useState(null);
  const [desktopViewMode, setDesktopViewMode] = useState('medium');
  const [desktopSortMode, setDesktopSortMode] = useState('name');
  const [passwordModal, setPasswordModal] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('🚀 App initialization started');
        
        const wallpaperResponse = await fetch(`${API_URL}/api/wallpaper`);
        if (wallpaperResponse.ok) {
          const wallpaperData = await wallpaperResponse.json();
          setWallpaper(wallpaperData.currentWallpaper);
          console.log('🎨 Wallpaper loaded:', wallpaperData.currentWallpaper);
        } else {
          setWallpaper('https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg');
        }

        const healthResponse = await fetch(`${API_URL}/api/health`);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('✅ Backend health:', healthData.status);
        }
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };

    fetchInitialData();
  }, [API_URL]);

  useEffect(() => {
    window.setDesktopViewMode = (mode) => {
      console.log('👁️ Setting desktop view mode:', mode);
      setDesktopViewMode(mode);
    };
    
    window.setDesktopSortMode = (mode) => {
      console.log('🔤 Setting desktop sort mode:', mode);
      setDesktopSortMode(mode);
    };
    
    return () => {
      delete window.setDesktopViewMode;
      delete window.setDesktopSortMode;
    };
  }, []);

  useEffect(() => {
    // Listen for password access requests from File Explorer
    const handlePasswordAccessRequest = (e) => {
      const { file, action, targetPath } = e.detail;
      console.log(`🔒 Password access requested for "${file.name}" from File Explorer`);
      setPasswordModal({ file: file, action: 'open_folder_in_explorer', targetPath: targetPath});
    };
    
    window.addEventListener('requestPasswordAccess', handlePasswordAccessRequest);
    return () => {
      window.removeEventListener('requestPasswordAccess', handlePasswordAccessRequest);
    };
  }, []);

  const handleSignIn = () => {
    console.log('🔓 User signed in successfully');
    
    // Add slide-up animation class
    const signinPage = document.querySelector('.signin-page');
    if (signinPage) {
      signinPage.classList.add('slide-up');
    }
    
    // Wait for animation to complete before removing sign-in page
    setTimeout(() => {
      setIsSignedIn(true);
    }, 600);
  };

  const closeWindow = useCallback((windowId) => {
    console.log(`❌ Closing window ${windowId}`);
    setWindows(prev => prev.filter(window => window.id !== windowId));
    if (activeWindow === windowId) {
      setActiveWindow(null);
    }
  }, [activeWindow]);

  const minimizeWindow = useCallback((windowId) => {
    console.log(`🔽 Minimizing window ${windowId}`);
    setWindows(prev => prev.map(window =>
      window.id === windowId ? { ...window, minimized: true } : window
    ));
  }, []);

  const maximizeWindow = useCallback((windowId) => {
    console.log(`🔼 Maximizing window ${windowId}`);
    setWindows(prev => prev.map(window =>
      window.id === windowId ? { ...window, maximized: !window.maximized } : window
    ));
  }, []);

  const activateWindow = useCallback((windowId) => {
    console.log(`🎯 Activating window ${windowId}`);
    setWindows(prev => prev.map(window => ({
      ...window,
      zIndex: window.id === windowId ? prev.length + 1 : window.zIndex
    })));
    setActiveWindow(windowId);
  }, []);

  const handleDesktopContextMenu = useCallback((e, position) => {
    e.preventDefault();
    console.log('🖱️ Desktop context menu opened at:', position);
    setContextMenu({ type: 'desktop', x: position.x, y: position.y, data: null});
  }, []);

  const handleFileContextMenu = useCallback((e, file, position) => {
    if (e) e.preventDefault();
    console.log('🖱️ File context menu opened for:', file?.name);
    setContextMenu({ type: 'file', x: position.x, y: position.y, data: file});
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleNotepadClose = useCallback(async (windowId) => {
    console.log(`📝 Handling Notepad close for window ${windowId}`);
    
    const windowToClose = windows.find(w => w.id === windowId);
    if (!windowToClose) return;
    
    if (windowToClose.type !== 'notepad') {
      closeWindow(windowId);
      return;
    }
    
    const closeEvent = new CustomEvent('checkBeforeClose', {
      detail: { windowId }
    });
    
    const windowBody = document.getElementById(`window-body-${windowId}`);
    if (windowBody) {
      windowBody.dispatchEvent(closeEvent);
    }
  }, [windows, closeWindow]);
  
  const nextWindowIdRef = useRef(1);
  const launchApp = useCallback((appType, props = {}) => {
    console.log(`🚀 Launching app: ${appType}`, props);
    
    const windowId = nextWindowIdRef.current;
    nextWindowIdRef.current += 1;
    let title = '';
    let icon = '📄';
    let component = null;
    let width = 600;
    let height = 400;

    switch (appType) {
      case 'explorer':
        title = props.path === 'C:' ? 'This PC' : 'File Explorer';
        icon = '📁';
        width = 900;
        height = 600;
        component = (
          <FileExplorer 
            key={windowId} 
            onClose={() => closeWindow(windowId)} 
            onMinimize={() => minimizeWindow(windowId)} 
            onMaximize={() => maximizeWindow(windowId)} 
            initialPath={props.path || 'C:'}
          />
        );
        break;

      case 'terminal':
        title = 'Command Prompt';
        icon = '⌨️';
        width = 700;
        height = 500;
        component = (
          <Terminal key={windowId} onClose={() => closeWindow(windowId)} onLaunchApp={launchApp}/>
        );
        break;

      case 'notepad':
        title = props.file?.name || 'Untitled - Notepad';
        icon = '📝';
        width = 600;
        height = 500;
        component = (
          <Notepad key={windowId} file={props.file} onClose={() => handleNotepadClose(windowId)} launchApp={launchApp}/>
        );
        break;

      case 'media_viewer':
        title = props.file?.name || 'Media Viewer';
        icon = props.file?.type === 'jpg' || props.file?.type === 'png' ? '🖼️' :  props.file?.type === 'mp4' ? '🎬' : '📄';
        width = 800;
        height = 600;
        component = (
          <MediaViewer key={windowId} file={props.file}/>
        );
        break;

      case 'properties':
        title = `${props.file?.name} Properties`;
        icon = '📋';
        width = 450;
        height = 550;
        component = (
          <Properties key={windowId} file={props.file} onClose={() => closeWindow(windowId)}/>
        );
        break;

      default:
        console.error(`Unknown app type: ${appType}`);
        return;
    }

    const newWindow = {
      id: windowId,
      title,
      icon,
      component,
      type: appType,
      props,
      x: 50 + (windows.length * 30),
      y: 50 + (windows.length * 30),
      width,
      height,
      minimized: false,
      maximized: false,
      zIndex: windows.length + 1
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindow(windowId);
    setShowStartMenu(false);

    console.log(`✅ Window ${windowId} opened: ${title}`);
  }, [windows.length, closeWindow, minimizeWindow, maximizeWindow, handleNotepadClose]);

  useEffect(() => {
    const handleCanClose = async (e) => {
      const { windowId } = e.detail;
      const { canClose, saveFirst } = e.detail;
      
      if (canClose) {
        if (saveFirst) {
          setTimeout(() => {
            closeWindow(windowId);
          }, 100);
        } else {
          closeWindow(windowId);
        }
      }
    };

    window.addEventListener('canCloseResponse', handleCanClose);
    
    return () => {
      window.removeEventListener('canCloseResponse', handleCanClose);
    };
  }, [closeWindow]);

  const handleContextMenuAction = useCallback(async (action, data = null) => {
    console.log(`🎯 Context menu action: ${action}`, data);
    
    switch (action) {
      case 'open_terminal':
        launchApp('terminal', { path: 'C:' });
        break;
        
      case 'create_folder':
        try {
          const folderName = prompt('Enter folder name:', 'New Folder');
          if (folderName) {
            const response = await fetch(`${API_URL}/api/files/folder`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: folderName, path: 'C:\\Desktop' })
            });
            
            if (response.ok) {
              console.log(`✅ Folder created: ${folderName}`);
              if (window.refreshDesktop) window.refreshDesktop();
            }
          }
        } catch (error) {
          console.error('❌ Error creating folder:', error);
        }
        break;
        
      case 'create_text_file':
        try {
          const fileName = prompt('Enter file name:', 'New Text File.txt');
          if (fileName) {
            const response = await fetch(`${API_URL}/api/files/text`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: fileName.endsWith('.txt') ? fileName : `${fileName}.txt`,
                path: 'C:\\Desktop',
                content: ''
              })
            });
            
            if (response.ok) {
              console.log(`✅ Text file created: ${fileName}`);
              if (window.refreshDesktop) window.refreshDesktop();
            }
          }
        } catch (error) {
          console.error('❌ Error creating text file:', error);
        }
        break;
      
      case 'upload_file':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.cpp,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.pdf';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              if (file.size > 50 * 1024 * 1024) {
                alert('File too large! Maximum size is 50MB.');
                return;
              }

              const formData = new FormData();
              formData.append('file', file);
              formData.append('path', 'C:\\Desktop');
              
              console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
              
              const response = await fetch(`${API_URL}/api/files/upload`, {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                await response.json();
                console.log(`✅ File uploaded: ${file.name}`);
                if (window.refreshDesktop) window.refreshDesktop();
                alert(`File "${file.name}" uploaded successfully!`);
              } else {
                const error = await response.json();
                console.error('❌ Upload failed:', error.error);
                alert(`Upload failed: ${error.error}`);
              }
            } catch (error) {
              console.error('❌ Error uploading file:', error);
              alert('Error uploading file');
            }
          }
        };
        input.click();
        break;

      case 'change_wallpaper':
        if (data && typeof data === 'string') {
          try {
            const response = await fetch(`${API_URL}/api/wallpaper`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallpaperUrl: data })
            });
            
            if (response.ok) {
              const result = await response.json();
              setWallpaper(result.currentWallpaper);
              console.log(`✅ Wallpaper changed to: ${data}`);
            }
          } catch (error) {
            console.error('❌ Error changing wallpaper:', error);
          }
        }
        break;
        
      case 'refresh':
        console.log('🔄 Refreshing desktop');
        if (window.refreshDesktop) window.refreshDesktop();
        break;
        
      case 'open_file':
        if (data) {
          launchApp('notepad', { file: data });
        }
        break;
        
      case 'properties':
        if (data) {
          launchApp('properties', { file: data });
        }
        break;
        
      case 'rename_file':
        if (data) {
          const renameCode = prompt(`Enter rename code to rename "${data.name}":`);
          if (renameCode) {
            try {
              const verifyResponse = await fetch(`${API_URL}/api/files/verify-rename-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ renameCode })
              });
              
              const verifyResult = await verifyResponse.json();
              
              if (!verifyResult.success) {
                alert('Invalid rename code!');
                return;
              }
              
              const newName = prompt(`Rename "${data.name}" to:`, data.name);
              if (newName && newName.trim() !== '' && newName !== data.name) {
                const response = await fetch(`${API_URL}/api/files/${data._id}/rename`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ renameCode: renameCode, newName: newName.trim() })
                });
                
                if (response.ok) {
                  console.log(`✅ File renamed: ${data.name} → ${newName}`);
                  alert(`File renamed successfully to "${newName}"`);
                  if (window.refreshDesktop) window.refreshDesktop();
                } else {
                  const error = await response.json();
                  alert(`Rename failed: ${error.error}`);
                }
              }
            } catch (error) {
              console.error('❌ Error renaming file:', error);
              alert('Error renaming file');
            }
          }
        }
        break;

      case 'delete_file':
        if (data) {
          const deletionCode = prompt(`Enter deletion code to delete "${data.name}":`);
          if (deletionCode) {
            try {
              const response = await fetch(`${API_URL}/api/files/${data._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deletionCode })
              });
              
              if (response.ok) {
                console.log(`✅ File deleted: ${data.name}`);
                alert('File deleted successfully');
                if (window.refreshDesktop) window.refreshDesktop();
              } else {
                const error = await response.json();
                alert(`Deletion failed: ${error.error}`);
              }
            } catch (error) {
              console.error('❌ Error deleting file:', error);
              alert('Error deleting file');
            }
          }
        }
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
    
    closeContextMenu();
  }, [API_URL, launchApp, closeContextMenu]);

  const handleOpenFile = useCallback((fileData) => {
    if (fileData) {
      // Check if file is password locked
      if (fileData.properties?.passwordLocked && fileData.properties?.passwordKeys?.length > 0) {
        console.log(`🔒 File "${fileData.name}" is password locked`);
        setPasswordModal({
          file: fileData,
          action: 'open_file'
        });
        return;
      }
      
      // Not locked, proceed normally
      const isMedia = ['jpg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf'].includes(fileData.type);
      
      if (isMedia) {
        launchApp('media_viewer', { file: fileData });
      } else {
        launchApp('notepad', { file: fileData });
      }
    }
  }, [launchApp]);

  // Update handleOpenFolder function to check for password lock
  const handleOpenFolder = useCallback((folderData) => {
    if (!folderData) return;
    
    // Handle "This PC" system folder
    if (folderData.isSystemFolder) {
      launchApp('explorer', { path: folderData.path || 'C:' });
      return;
    }
    
    // Check if folder is password locked
    if (folderData.properties?.passwordLocked && folderData.properties?.passwordKeys?.length > 0) {
      console.log(`🔒 Folder "${folderData.name}" is password locked`);
      setPasswordModal({
        file: folderData,
        action: 'open_folder'
      });
      return;
    }
    
    // Not locked, proceed normally
    launchApp('explorer', { path: folderData.path || 'C:' });
  }, [launchApp]);
  
  const handlePasswordSuccess = useCallback(() => {
    if (!passwordModal) return;
    
    const { file, action, targetPath } = passwordModal;
    
    console.log(`✅ Password validated for "${file.name}"`);
    
    // Execute the original action
    if (action === 'open_file') {
      const isMedia = ['jpg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf'].includes(file.type);
      if (isMedia) { launchApp('media_viewer', { file });} 
      else { launchApp('notepad', { file });}
    } else if (action === 'open_folder') {
      const path = file.path ? `${file.path}\\${file.name}` : `C:\\${file.name}`;
      launchApp('explorer', { path });
    } else if (action === 'open_folder_in_explorer') {
      // Navigate to the folder in the existing File Explorer window
      // Dispatch a custom event that FileExplorer can listen to
      const navigateEvent = new CustomEvent('navigateToPath', {
        detail: { path: targetPath }
      });
      window.dispatchEvent(navigateEvent);
    }
    
    // Close modal
    setPasswordModal(null);
  }, [passwordModal, launchApp]);

  // Add handler for password modal cancel
  const handlePasswordCancel = useCallback(() => {
    console.log('❌ Password access cancelled');
    setPasswordModal(null);
  }, []);

  // Show sign-in page if not signed in
  if (!isSignedIn) {
    return <SignInPage onSignIn={handleSignIn} />;
  }

  return (
    <div id="app-root" className="app-root">
      <Desktop
        wallpaper={wallpaper}
        windows={windows}
        onDesktopContextMenu={handleDesktopContextMenu}
        onFileContextMenu={handleFileContextMenu}
        onWindowActivate={activateWindow}
        activeWindow={activeWindow}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        viewMode={desktopViewMode}
        sortMode={desktopSortMode}
      />

      {windows.map(window => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          icon={window.icon}
          x={window.x}
          y={window.y}
          width={window.width}
          height={window.height}
          minimized={window.minimized}
          maximized={window.maximized}
          zIndex={window.zIndex}
          active={activeWindow === window.id}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => maximizeWindow(window.id)}
          onActivate={() => activateWindow(window.id)}
          onDragStop={(x, y) => {
            setWindows(prev => prev.map(w =>
              w.id === window.id ? { ...w, x, y } : w
            ));
          }}
          onResizeStop={(width, height) => {
            setWindows(prev => prev.map(w =>
              w.id === window.id ? { ...w, width, height } : w
            ));
          }}
        >
          {window.component}
        </Window>
      ))}
      <Taskbar
        onStartMenuToggle={() => setShowStartMenu(!showStartMenu)}
        onAppLaunch={launchApp}
        windows={windows}
        activeWindow={activeWindow}
        onWindowActivate={activateWindow}
        onWindowRestore={(windowId) => {
          setWindows(prev => prev.map(window =>
            window.id === windowId ? { ...window, minimized: false } : window
          ));
          activateWindow(windowId);
        }}
      />

      {showStartMenu && (
        <StartMenu onClose={() => setShowStartMenu(false)} onAppLaunch={launchApp}/>
      )}

      {contextMenu && (
        <ContextMenu
          type={contextMenu.type}
          x={contextMenu.x}
          y={contextMenu.y}
          data={contextMenu.data}
          onClose={closeContextMenu}
          onAction={handleContextMenuAction}
          wallpaperOptions={[
            'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg',
            'https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-fall-nature-scenery-free-image.jpeg',
            'https://images.pexels.com/photos/751601/pexels-photo-751601.jpeg?cs=srgb&dl=pexels-grizzlybear-751601.jpg&fm=jpg'
          ]}
          currentViewMode={desktopViewMode}
          currentSortMode={desktopSortMode}
          currentWallpaper={wallpaper}
        />
      )}

      {passwordModal && (
        <PasswordAccess 
          file={passwordModal.file} 
          onSuccess={handlePasswordSuccess} 
          onCancel={handlePasswordCancel}
        />
      )}
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Notepad.css';

// Notepad Component - Windows-like text editor
const Notepad = ({ file, onClose, launchApp }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [fontSize, setFontSize] = useState(13);
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentFilePath, setCurrentFilePath] = useState('C:\\Desktop');
  const [currentFileId, setCurrentFileId] = useState(null);
  const textareaRef = useRef(null);

  const MIN_FONT_SIZE = 8;
  const MAX_FONT_SIZE = 72;
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Initialize with file content
  useEffect(() => {
    if (file) {
      setFileName(file.name);
      setText(file.content || '');
      setCurrentFilePath(file.path || 'C:\\Desktop');
      setCurrentFileId(file._id || null);
      setIsModified(false);
      setIsSaved(true);
    } else {
      setFileName('Untitled.txt');
      setText('');
      setCurrentFilePath('C:\\Desktop');
      setCurrentFileId(null);
      setIsModified(false);
      setIsSaved(true);
    }
  }, [file]);

  // Listen for close requests from parent
  useEffect(() => {
    const handleCheckBeforeClose = async (e) => {
      const { windowId } = e.detail;
      
      console.log(`📝 Notepad ${windowId} asked if it can close`);
      
      if (isSaved && !isModified) {
        // File is already saved, can close immediately
        console.log('✅ File is saved, closing immediately');
        window.dispatchEvent(new CustomEvent('canCloseResponse', {
          detail: { windowId, canClose: true, saveFirst: false }
        }));
      } else {
        // File is not saved, show popup
        console.log('⚠️ File not saved, showing popup');
        const result = await showSavePopup();
        
        if (result === 'save') {
          // Save and then close
          const saved = await handleSave();
          if (saved) {
            window.dispatchEvent(new CustomEvent('canCloseResponse', {
              detail: { windowId, canClose: true, saveFirst: true }
            }));
          } else {
            // Save failed, don't close
            window.dispatchEvent(new CustomEvent('canCloseResponse', {
              detail: { windowId, canClose: false, saveFirst: false }
            }));
          }
        } else if (result === 'dontSave') {
          // Don't save, just close
          window.dispatchEvent(new CustomEvent('canCloseResponse', {
            detail: { windowId, canClose: true, saveFirst: false }
          }));
        } else {
          // Cancel, don't close
          window.dispatchEvent(new CustomEvent('canCloseResponse', {
            detail: { windowId, canClose: false, saveFirst: false }
          }));
        }
      }
    };

    window.addEventListener('checkBeforeClose', handleCheckBeforeClose);
    
    return () => {
      window.removeEventListener('checkBeforeClose', handleCheckBeforeClose);
    };
  }, [isSaved, isModified, text, fileName, currentFileId, currentFilePath]);

  // Handles text change
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!isModified) {
      setIsModified(true);
      setIsSaved(false);
    }
  };

  // Validates save code with backend
  const validateSaveCode = async () => {
    const userCode = prompt('Enter Save Code:');
    if (userCode === null) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/files/verify-save-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveCode: userCode })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        alert('❌ Invalid Save Code!');
        return false;
      }
    } catch (error) {
      console.error('Error validating save code:', error);
      alert('❌ Error validating save code');
      return false;
    }
  };

  // Saves the file - returns true if saved successfully
  const handleSave = async () => {
    closeAllMenus();
    
    if (!await validateSaveCode()) return false;

    try {
      if (currentFileId) {
        // Update existing file
        const response = await fetch(`${API_URL}/api/files/${currentFileId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text })
        });
        
        if (response.ok) {
          setIsModified(false);
          setIsSaved(true);
          if (window.refreshDesktop) window.refreshDesktop();
          return true;
        } else {
          const error = await response.json();
          alert(`❌ Failed to save file: ${error.error}`);
          return false;
        }
      } else {
        // Create new file
        const response = await fetch(`${API_URL}/api/files/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: fileName,
            content: text,
            path: currentFilePath
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          setCurrentFileId(result.file._id);
          setIsModified(false);
          setIsSaved(true);
          if (window.refreshDesktop) window.refreshDesktop();
          return true;
        } else {
          const error = await response.json();
          alert(`❌ Failed to save file: ${error.error}`);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error saving file:', error);
      alert('❌ Error saving file');
      return false;
    }
  };

  // Save As - requires save code and rename code
  const handleSaveAs = async () => {
    closeAllMenus();
    
    if (!await validateSaveCode()) return;

    const renameCode = prompt('Enter Rename Code:');
    if (renameCode === null) return;
    
    try {
      const verifyResponse = await fetch(`${API_URL}/api/files/verify-rename-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renameCode })
      });
      
      const verifyResult = await verifyResponse.json();
      
      if (!verifyResult.success) {
        alert('❌ Invalid Rename Code!');
        return;
      }

      const newFileName = prompt('Enter new file name:', fileName);
      if (newFileName === null || newFileName.trim() === '') return;

      const response = await fetch(`${API_URL}/api/files/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFileName.trim(),
          content: text,
          path: currentFilePath
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setFileName(newFileName.trim());
        setCurrentFileId(result.file._id);
        setIsModified(false);
        setIsSaved(true);
        alert('✅ File saved as ' + newFileName.trim());
        if (window.refreshDesktop) window.refreshDesktop();
      } else {
        const error = await response.json();
        alert(`❌ Failed to save file: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving file:', error);
      alert('❌ Error saving file');
    }
  };

  // Opens file explorer
  const handleOpen = () => {
    closeAllMenus();
    
    if (launchApp) {
      launchApp('explorer', { 
        path: currentFilePath
      });
    } else {
      alert('Unable to open File Explorer.');
    }
  };

  // Creates new file
  const handleNew = async () => {
    closeAllMenus();
    
    const newFileName = prompt('Enter new file name (with .txt extension):');
    if (newFileName === null || newFileName.trim() === '') return;

    try {
      const response = await fetch(`${API_URL}/api/files/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFileName.trim(),
          content: '',
          path: currentFilePath
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('✅ File created: ' + newFileName.trim());
        
        if (launchApp) {
          launchApp('notepad', { file: result.file });
        }
        
        if (window.refreshDesktop) window.refreshDesktop();
      } else {
        const error = await response.json();
        alert(`❌ Failed to create file: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating file:', error);
      alert('❌ Error creating file');
    }
  };

  // Show save popup and return the user's choice
  const showSavePopup = () => {
    return new Promise((resolve) => {
      const popup = document.createElement('div');
      popup.className = 'notepad-close-popup-overlay';
      popup.innerHTML = `
        <div class="notepad-close-popup">
          <div class="popup-title">Notepad</div>
          <div class="popup-message">
            Do you want to save changes to ${fileName}?
          </div>
          <div class="popup-buttons">
            <button class="popup-btn popup-save">Save</button>
            <button class="popup-btn popup-dont-save">Don't Save</button>
            <button class="popup-btn popup-cancel">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(popup);
      
      popup.querySelector('.popup-save').onclick = () => {
        popup.remove();
        resolve('save');
      };
      
      popup.querySelector('.popup-dont-save').onclick = () => {
        popup.remove();
        resolve('dontSave');
      };
      
      popup.querySelector('.popup-cancel').onclick = () => {
        popup.remove();
        resolve('cancel');
      };
    });
  };

  // Handles close from File menu
  const handleExit = async () => {
    closeAllMenus();
    
    if (isSaved && !isModified) {
      // File is already saved, close immediately
      onClose();
    } else {
      // File is not saved, show popup
      const result = await showSavePopup();
      
      if (result === 'save') {
        const saved = await handleSave();
        if (saved) {
          onClose();
        }
      } else if (result === 'dontSave') {
        onClose();
      }
      // If cancel, do nothing
    }
  };

  // Edit operations
  const handleUndo = () => {
    closeAllMenus();
    document.execCommand('undo');
  };

  const handleCut = () => {
    closeAllMenus();
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = text.substring(start, end);
      
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
        const newText = text.substring(0, start) + text.substring(end);
        setText(newText);
        setIsModified(true);
        setIsSaved(false);
        
        setTimeout(() => {
          textareaRef.current.selectionStart = start;
          textareaRef.current.selectionEnd = start;
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    closeAllMenus();
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = text.substring(start, end);
      
      if (selectedText) {
        navigator.clipboard.writeText(selectedText);
      }
    }
  };

  const handlePaste = async () => {
    closeAllMenus();
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (textareaRef.current && clipboardText) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newText = text.substring(0, start) + clipboardText + text.substring(end);
        setText(newText);
        setIsModified(true);
        setIsSaved(false);
        
        setTimeout(() => {
          const newPos = start + clipboardText.length;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
        }, 0);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleDelete = () => {
    closeAllMenus();
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      if (start !== end) {
        const newText = text.substring(0, start) + text.substring(end);
        setText(newText);
        setIsModified(true);
        setIsSaved(false);
        
        setTimeout(() => {
          textareaRef.current.selectionStart = start;
          textareaRef.current.selectionEnd = start;
        }, 0);
      }
    }
  };

  const handleSelectAll = () => {
    closeAllMenus();
    if (textareaRef.current) {
      textareaRef.current.select();
    }
  };

  // Zoom operations
  const handleZoomIn = () => {
    closeAllMenus();
    if (fontSize < MAX_FONT_SIZE) {
      setFontSize(prev => Math.min(prev + 2, MAX_FONT_SIZE));
    }
  };

  const handleZoomOut = () => {
    closeAllMenus();
    if (fontSize > MIN_FONT_SIZE) {
      setFontSize(prev => Math.max(prev - 2, MIN_FONT_SIZE));
    }
  };

  // Menu handling
  const handleMenuClick = (menuName) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
    }
  };

  const handleMenuHover = (menuName) => {
    setActiveMenu(menuName);
  };

  const closeAllMenus = () => {
    setActiveMenu(null);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeMenu && !e.target.closest('.notepad-menu-item')) {
        closeAllMenus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Get cursor position
  const getCursorPosition = () => {
    if (!textareaRef.current) return { line: 1, col: 1 };
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    return { line, col };
  };

  const { line, col } = getCursorPosition();

  return (
    <div className="notepad-container">
      <div className="notepad-toolbar">
        <div 
          className={`notepad-menu-item ${activeMenu === 'file' ? 'active' : ''}`}
          onMouseEnter={() => handleMenuHover('file')}
        >
          <button 
            className="notepad-btn"
            onClick={() => handleMenuClick('file')}
          >
            File
          </button>
          
          {activeMenu === 'file' && (
            <div className="notepad-dropdown show">
              <div className="dropdown-item" onClick={handleNew}>New</div>
              <div className="dropdown-item" onClick={handleOpen}>Open...</div>
              <div className="dropdown-item" onClick={handleSave}>Save</div>
              <div className="dropdown-item" onClick={handleSaveAs}>Save As...</div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={handleExit}>Exit</div>
            </div>
          )}
        </div>

        <div className={`notepad-menu-item ${activeMenu === 'edit' ? 'active' : ''}`} onMouseEnter={() => handleMenuHover('edit')}>
          <button className="notepad-btn" onClick={() => handleMenuClick('edit')}>
            Edit
          </button>
          
          {activeMenu === 'edit' && (
            <div className="notepad-dropdown show">
              <div className="dropdown-item" onClick={handleUndo}>Undo</div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={handleCut}>Cut</div>
              <div className="dropdown-item" onClick={handleCopy}>Copy</div>
              <div className="dropdown-item" onClick={handlePaste}>Paste</div>
              <div className="dropdown-item" onClick={handleDelete}>Delete</div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={handleSelectAll}>Select All</div>
            </div>
          )}
        </div>

        <div className={`notepad-menu-item ${activeMenu === 'view' ? 'active' : ''}`} onMouseEnter={() => handleMenuHover('view')}>
          <button className="notepad-btn" onClick={() => handleMenuClick('view')}>
            View
          </button>
          
          {activeMenu === 'view' && (
            <div className="notepad-dropdown show">
              <div className="dropdown-item" onClick={handleZoomIn}>
                Zoom In {fontSize >= MAX_FONT_SIZE ? '(Max)' : ''}
              </div>
              <div className="dropdown-item" onClick={handleZoomOut}>
                Zoom Out {fontSize <= MIN_FONT_SIZE ? '(Min)' : ''}
              </div>
            </div>
          )}
        </div>

        <div className={`notepad-menu-item ${activeMenu === 'help' ? 'active' : ''}`} onMouseEnter={() => handleMenuHover('help')}>
          <button className="notepad-btn" onClick={() => handleMenuClick('help')}>
            Help
          </button>
          
          {activeMenu === 'help' && (
            <div className="notepad-dropdown show">
              <div className="dropdown-item" onClick={closeAllMenus}>
                About Notepad
              </div>
            </div>
          )}
        </div>
      </div>

      <textarea ref={textareaRef} className="notepad-textarea" value={text} onChange={handleTextChange} placeholder="Type your text here..." spellCheck="true" wrap="soft" style={{ fontSize: `${fontSize}px` }}/>

      <div className="notepad-status">
        <div className="status-left">
          <span className="status-filename">{fileName}</span>
          {isModified && <span className="status-modified"> *</span>}
          <span className="status-divider">|</span>
          <span className={`status-saved ${isSaved ? 'saved' : 'unsaved'}`}>
            Saved: {isSaved ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="status-right">
          Ln {line}, Col {col} | Zoom: {fontSize}px
        </div>
      </div>
    </div>
  );
};

export default Notepad;
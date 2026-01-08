import React, { useState, useEffect, useRef } from 'react';
import '../styles/Terminal.css';

const Terminal = ({ onClose, onLaunchApp }) => {
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentPath, setCurrentPath] = useState('C:');
  const [terminalOutput, setTerminalOutput] = useState([]);
  
  // Password state
  const [isAwaitingPassword, setIsAwaitingPassword] = useState(false);
  const [passwordState, setPasswordState] = useState({
    targetFile: null,
    command: null,
    args: null,
    expectedCount: 0,
    currentIndex: 0,
    passwords: []
  });
  
  const terminalRef = useRef(null);
  const outputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const commands = {
    'help': 'Display this help message',
    'dir': 'List directory contents',
    'cd [path]': 'Change directory (case-sensitive)',
    'cd..': 'Go to parent directory',
    'type [file]': 'Display file contents',
    'start [file]': 'Open file in appropriate application',
    'prop [file]': 'Display file/folder properties (Details tab)',
    'cls': 'Clear screen',
    'echo [text]': 'Display text',
    'date': 'Display current date and time',
    'ver': 'Display version information',
    'exit': 'Close terminal',
  };

  const showPrompt = () => {
    if (terminalOutput.length > 0) {
      addOutput('');
    }
  };

  useEffect(() => {
    addOutput('Microsoft Windows [Version 10.0.19044.1766]');
    addOutput('(c) Microsoft Corporation. All rights reserved.');
    addOutput('');
    showPrompt();

    if (terminalRef.current) {
      terminalRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const addOutput = (text) => {
    setTerminalOutput(prev => [...prev, text]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Validate passwords with backend
  const validatePasswords = async (fileId, passwords) => {
    try {
      const response = await fetch(`${API_URL}/api/files/validate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, passwords })
      });
      
      if (!response.ok) {
        return { success: false, valid: false };
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Password validation error:', error);
      return { success: false, valid: false };
    }
  };

  // Handle password input
  const handlePasswordInput = async (input) => {
    const trimmedInput = input.trim();
    
    // Store the password
    const newPasswords = [...passwordState.passwords, trimmedInput];
    const newIndex = passwordState.currentIndex + 1;
    
    // Check if we've collected all passwords
    if (newIndex >= passwordState.expectedCount) {
      // Validate all passwords
      const validation = await validatePasswords(passwordState.targetFile._id, newPasswords);
      
      if (validation.success && validation.valid) {
        // Passwords correct - execute the original command
        addOutput('Access granted.');
        setIsAwaitingPassword(false);
        
        // Execute the deferred command
        switch (passwordState.command) {
          case 'cd':
            await executeCdAfterValidation(passwordState.targetFile);
            break;
          case 'type':
            await executeTypeAfterValidation(passwordState.targetFile);
            break;
          case 'start':
            await executeStartAfterValidation(passwordState.targetFile);
            break;
          default:
            addOutput(`Given command is not recognized as an internal or external command,`);
            addOutput('operable program or batch file.');
        } 
        
        // Reset password state
        setPasswordState({
          targetFile: null,
          command: null,
          args: null,
          expectedCount: 0,
          currentIndex: 0,
          passwords: []
        });
        
        showPrompt();
      } else {
        // Password incorrect
        addOutput('Incorrect password!!');
        setIsAwaitingPassword(false);
        
        // Reset password state
        setPasswordState({
          targetFile: null,
          command: null,
          args: null,
          expectedCount: 0,
          currentIndex: 0,
          passwords: []
        });
        
        showPrompt();
      }
    } else {
      // Request next password
      setPasswordState({
        ...passwordState,
        passwords: newPasswords,
        currentIndex: newIndex
      });
      addOutput(`Password ${newIndex + 1}:`);
    }
  };

  // Execute CD after password validation
  const executeCdAfterValidation = async (folder) => {
    const newPath = currentPath === 'C:' ? `C:\\${folder.name}` : `${currentPath}\\${folder.name}`;
    setCurrentPath(newPath);
  };

  // Execute TYPE after password validation
  const executeTypeAfterValidation = async (file) => {
    if (file.type === 'txt' || file.type === 'cpp') {
      if (file.content) {
        const lines = file.content.split('\n');
        lines.forEach(line => addOutput(line));
      } else {
        addOutput('File is empty or content not available.');
      }
    } else if (['jpg', 'png', 'gif'].includes(file.type)) {
      addOutput(`${file.name} is an image file.`);
      addOutput(`Size: ${(file.size / 1024).toFixed(2)} KB`);
      addOutput(`Type: ${file.type.toUpperCase()} image`);
      addOutput('Use "start filename" to view the image.');
    } else if (['mp4', 'avi', 'mov'].includes(file.type)) {
      addOutput(`${file.name} is a video file.`);
      addOutput(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      addOutput(`Type: ${file.type.toUpperCase()} video`);
      addOutput('Use "start filename" to play the video.');
    } else if (file.type === 'pdf') {
      addOutput(`${file.name} is a PDF document.`);
      addOutput(`Size: ${(file.size / 1024).toFixed(2)} KB`);
      addOutput('Use "start filename" to view the PDF.');
    } else {
      addOutput(`${file.name} is a binary file.`);
      addOutput(`Size: ${(file.size / 1024).toFixed(2)} KB`);
      addOutput('Cannot display binary file contents.');
    }
  };

  // Execute START after password validation
  const executeStartAfterValidation = async (file) => {
    addOutput(`Opening ${file.name}...`);
    
    const isMedia = ['jpg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf'].includes(file.type);
    
    if (isMedia) {
      if (onLaunchApp) {
        onLaunchApp('media_viewer', { file });
      } else {
        addOutput('Cannot open media file - no media viewer available.');
      }
    } else {
      if (onLaunchApp) {
        onLaunchApp('notepad', { file });
      } else {
        addOutput('Cannot open file - no application available.');
      }
    }
  };

  const executeCommand = async (command) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    addOutput(`${currentPath}> ${trimmedCommand}`);

    const [cmd, ...args] = trimmedCommand.split(' ');
    const lowerCmd = cmd.toLowerCase();

    switch (lowerCmd) {
      case 'help':
        showHelp();
        break;
      
      case 'dir':
        await listDirectory();
        break;
      
      case 'cd':
        await changeDirectory(args.join(' '));
        break;
      
      case 'cd..':
        await changeDirectory('..');
        break;
      
      case 'type':
        if (args[0]) {
          await showFileContents(args[0]);
        } else {
          addOutput('The syntax of the command is incorrect.');
        }
        break;
      
      case 'start':
        if (args[0]) {
          await openFile(args[0]);
        } else {
          addOutput('The syntax of the command is incorrect.');
        }
        break;
      
      case 'prop':
        if (args[0]) {
          await showProperties(args[0]);
        } else {
          addOutput('The syntax of the command is incorrect.');
          addOutput('Usage: PROP [filename or foldername]');
        }
        break;
      
      case 'cls':
        clearScreen();
        return;
      
      case 'echo':
        addOutput(args.join(' '));
        break;
      
      case 'date':
        addOutput(new Date().toLocaleString());
        break;
      
      case 'ver':
        addOutput('Microsoft Windows [Version 10.0.19044.1766]');
        break;
      
      case 'exit':
        onClose();
        return;
      
      default:
        addOutput(`'${cmd}' is not recognized as an internal or external command,`);
        addOutput('operable program or batch file.');
    }

    showPrompt();
  };

  const showHelp = () => {
    addOutput('For more information on a specific command, type HELP command-name');
    Object.entries(commands).forEach(([cmd, desc]) => {
      addOutput(`${cmd.toUpperCase().padEnd(20)} ${desc}`);
    });
  };

  const listDirectory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(currentPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        addOutput(` Directory of ${currentPath}`);
        addOutput('');
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).replace(/\//g, '-');
        
        let totalSize = 0;
        let fileCount = 0;
        let dirCount = 0;
        
        data.files.filter(f => f.isFolder).forEach(file => {
          const lockIndicator = file.properties?.passwordLocked ? ' [LOCKED]' : '';
          addOutput(`${dateStr}  ${'<DIR>'.padEnd(14)} ${file.name}${lockIndicator}`);
          dirCount++;
        });
        
        data.files.filter(f => !f.isFolder).forEach(file => {
          const size = file.size || 0;
          const lockIndicator = file.properties?.passwordLocked ? ' [LOCKED]' : '';
          addOutput(`${dateStr}  ${size.toString().padStart(14)} ${file.name}${lockIndicator}`);
          totalSize += size;
          fileCount++;
        });
        
        addOutput(`               ${fileCount} File(s) ${totalSize.toLocaleString().padStart(14)} bytes`);
        addOutput(`               ${dirCount} Dir(s)`);
      } else {
        addOutput(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Terminal error:', error);
      addOutput('The system cannot find the path specified.');
    }
  };

  const changeDirectory = async (path) => {
    if (!path || path === '') {
      addOutput(currentPath);
      return;
    }
    
    if (path === '..') {
      if (currentPath === 'C:') {
        addOutput('Already at root directory');
        return;
      }
      
      const pathParts = currentPath.split('\\').filter(part => part);
      if (pathParts.length === 1) {
        setCurrentPath('C:');
        return;
      }
      
      pathParts.pop();
      const newPath = pathParts.join('\\');
      setCurrentPath(newPath);
      return;
    }
    
    const lastPart = currentPath.split('\\').pop() || currentPath;
    if (lastPart === path) {
      addOutput('The system cannot find the path specified.');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(currentPath)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const folder = data.files.find(f => f.isFolder && f.name === path);
          
          if (folder) {
            // Check if folder is password locked
            if (folder.properties?.passwordLocked && folder.properties?.passwordKeys?.length > 0) {
              // Initiate password prompt
              addOutput('This folder is locked. Enter password:');
              addOutput('Password 1:');
              
              setIsAwaitingPassword(true);
              setPasswordState({
                targetFile: folder,
                command: 'cd',
                args: path,
                expectedCount: folder.properties.passwordKeys.length,
                currentIndex: 0,
                passwords: []
              });
              return; // Don't change directory yet
            } else {
              // Not locked, change directory immediately
              const newPath = currentPath === 'C:' ? `C:\\${path}` : `${currentPath}\\${path}`;
              setCurrentPath(newPath);
            }
          } else {
            addOutput('The system cannot find the path specified.');
          }
        } else {
          addOutput('The system cannot find the path specified.');
        }
      } else {
        addOutput('The system cannot find the path specified.');
      }
    } catch (error) {
      addOutput('The system cannot find the path specified.');
    }
  };

  const showFileContents = async (filename) => {
    try {
      const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(currentPath)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const file = data.files.find(f => !f.isFolder && f.name === filename);
          
          if (file) {
            // Check if file is password locked
            if (file.properties?.passwordLocked && file.properties?.passwordKeys?.length > 0) {
              // Initiate password prompt
              addOutput('This file is locked. Enter password:');
              addOutput('Password 1:');
              
              setIsAwaitingPassword(true);
              setPasswordState({
                targetFile: file,
                command: 'type',
                args: filename,
                expectedCount: file.properties.passwordKeys.length,
                currentIndex: 0,
                passwords: []
              });
              return; // Don't show contents yet
            }
            
            // Not locked, show contents immediately
            if (file.type === 'txt' || file.type === 'cpp') {
              if (file.content) {
                const lines = file.content.split('\n');
                lines.forEach(line => addOutput(line));
              } else {
                addOutput('File is empty or content not available.');
              }
            } else if (['jpg', 'png', 'gif'].includes(file.type)) {
              addOutput(`${filename} is an image file.`);
              addOutput(`Size: ${(file.size / 1024).toFixed(2)} KB`);
              addOutput(`Type: ${file.type.toUpperCase()} image`);
              addOutput('Use "start filename" to view the image.');
            } else if (['mp4', 'avi', 'mov'].includes(file.type)) {
              addOutput(`${filename} is a video file.`);
              addOutput(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
              addOutput(`Type: ${file.type.toUpperCase()} video`);
              addOutput('Use "start filename" to play the video.');
            } else if (file.type === 'pdf') {
              addOutput(`${filename} is a PDF document.`);
              addOutput(`Size: ${(file.size / 1024).toFixed(2)} KB`);
              addOutput('Use "start filename" to view the PDF.');
            } else {
              addOutput(`${filename} is a binary file.`);
              addOutput(`Size: ${(file.size / 1024).toFixed(2)} KB`);
              addOutput('Cannot display binary file contents.');
            }
          } else {
            addOutput('The system cannot find the file specified.');
          }
        } else {
          addOutput('The system cannot find the file specified.');
        }
      }
    } catch (error) {
      addOutput('The system cannot find the file specified.');
    }
  };

  const openFile = async (filename) => {
    try {
      const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(currentPath)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const file = data.files.find(f => !f.isFolder && f.name === filename);
          
          if (file) {
            // Check if file is password locked
            if (file.properties?.passwordLocked && file.properties?.passwordKeys?.length > 0) {
              // Initiate password prompt
              addOutput('This file is locked. Enter password:');
              addOutput('Password 1:');
              
              setIsAwaitingPassword(true);
              setPasswordState({
                targetFile: file,
                command: 'start',
                args: filename,
                expectedCount: file.properties.passwordKeys.length,
                currentIndex: 0,
                passwords: []
              });
              return; // Don't open file yet
            }
            
            // Not locked, open immediately
            addOutput(`Opening ${filename}...`);
            
            const isMedia = ['jpg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf'].includes(file.type);
            
            if (isMedia) {
              if (onLaunchApp) {
                onLaunchApp('media_viewer', { file });
              } else {
                addOutput('Cannot open media file - no media viewer available.');
              }
            } else {
              if (onLaunchApp) {
                onLaunchApp('notepad', { file });
              } else {
                addOutput('Cannot open file - no application available.');
              }
            }
          } else {
            addOutput('The system cannot find the file specified.');
          }
        } else {
          addOutput('The system cannot find the file specified.');
        }
      }
    } catch (error) {
      addOutput('The system cannot find the file specified.');
    }
  };

  const showProperties = async (filename) => {
    try {
      const response = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(currentPath)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const file = data.files.find(f => f.name === filename);
          
          if (file) {
            addOutput('');
            addOutput('='.repeat(70));
            addOutput(`PROPERTIES: ${file.name}`);
            addOutput('='.repeat(70));
            addOutput('');
            
            addOutput('FILE INFORMATION:');
            addOutput(`  Name:                ${file.name}`);
            addOutput(`  Type:                ${file.isFolder ? 'File folder' : file.type.toUpperCase() + ' File'}`);
            if (!file.isFolder) {
              addOutput(`  File Extension:      .${file.type}`);
            }
            if (file.mimeType) {
              addOutput(`  MIME Type:           ${file.mimeType}`);
            }
            addOutput('');
            
            addOutput('SIZE:');
            addOutput(`  Size:                ${file.isFolder ? '--' : formatFileSize(file.size)}`);
            if (!file.isFolder) {
              addOutput(`  Size on disk:        ${formatFileSize(file.size)}`);
            }
            addOutput('');
            
            addOutput('LOCATION:');
            addOutput(`  Path:                ${file.path || 'C:'}`);
            if (file.filePath) {
              addOutput(`  Physical Path:       ${file.filePath}`);
            }
            addOutput('');
            
            addOutput('DATES:');
            addOutput(`  Created:             ${formatDate(file.createdAt)}`);
            addOutput(`  Modified:            ${formatDate(file.modifiedAt)}`);
            addOutput(`  Accessed:            ${formatDate(file.modifiedAt)}`);
            addOutput('');
            
            addOutput('OWNERSHIP:');
            addOutput(`  Owner:               ${file.properties?.owner || 'System Administrator'}`);
            addOutput(`  Computer:            DESKTOP-PC`);
            addOutput('');
            
            addOutput('ADDITIONAL PROPERTIES:');
            if (file.properties?.additionalProperty) {
              addOutput(`  ${file.properties.additionalProperty}`);
            } else {
              addOutput('  NULL');
            }
            addOutput('');
            
            addOutput('ATTRIBUTES:');
            addOutput(`  Read-only:           No`);
            addOutput(`  Hidden:              No`);
            addOutput(`  Password Locked:     ${file.properties?.passwordLocked ? 'Yes' : 'No'}`);
            
            addOutput('');
            addOutput('='.repeat(70));
          } else {
            addOutput('The system cannot find the file or folder specified.');
          }
        } else {
          addOutput('The system cannot find the file or folder specified.');
        }
      }
    } catch (error) {
      addOutput('Error retrieving properties.');
    }
  };

  const clearScreen = () => {
    setTerminalOutput([]);
    addOutput('Microsoft Windows [Version 10.0.19044.1766]');
    addOutput('(c) Microsoft Corporation. All rights reserved.');
    addOutput('');
    showPrompt();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const input = currentCommand;
      setCurrentCommand('');
      
      // If awaiting password, handle as password input
      if (isAwaitingPassword) {
        handlePasswordInput(input);
      } else {
        // Normal command execution
        executeCommand(input);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isAwaitingPassword && commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isAwaitingPassword && historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (newIndex === commandHistory.length - 1 && historyIndex === newIndex) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-body">
        <div className="terminal-output" ref={outputRef}>
          {terminalOutput.map((line, index) => (
            <div key={`line-${index}`} className="terminal-line">
              {line}
            </div>
          ))}
          
          <div className="terminal-input-line">
            {!isAwaitingPassword && (
              <span className="terminal-prompt">{currentPath}&gt;</span>
            )}
            <input
              ref={terminalRef}
              type={isAwaitingPassword ? "password" : "text"}
              className="terminal-input"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck="false"
              placeholder={isAwaitingPassword ? "Enter password..." : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
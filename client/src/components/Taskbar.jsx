import React, { useState, useEffect } from 'react';
import '../styles/Taskbar.css';

// Taskbar Component:: Windows-style taskbar with Start menu, app shortcuts, and clock
const Taskbar = ({ onStartMenuToggle, onAppLaunch, windows = [], activeWindow, onWindowActivate, onWindowRestore}) => {
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // App shortcuts configuration
  const appShortcuts = [
    { id: 'explorer', name: 'File Explorer', icon: '📁', type: 'explorer' },
    { id: 'notepad', name: 'Notepad', icon: '📝', type: 'notepad' },
    { id: 'terminal', name: 'Terminal', icon: '⌨️', type: 'terminal' },
    { id: 'browser', name: 'Browser', icon: '🌐', type: 'browser' },
  ];

  // Format time as HH:MM
  const formatTime = () => {
    return time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format date as Day, Month Date
  const formatDate = () => {
    return time.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handles app shortcut click:  @param {Object} app - App object
  const handleAppClick = (app) => {
    console.log(`🚀 Launching app: ${app.name}`);
    onAppLaunch(app.type);
  };

  // Handles window taskbar button click:  @param {Object} window - Window object
  const handleWindowClick = (window) => {
    if (window.minimized) {
      console.log(`📂 Restoring window ${window.id}: ${window.title}`);
      onWindowRestore(window.id);
    } else {
      console.log(`🎯 Activating window ${window.id}: ${window.title}`);
      onWindowActivate(window.id);
    }
  };

  return (
    <div id="taskbar-container" className="taskbar-container">
      {/* Start Button */}
      <button
        key="taskbar-start-btn"
        id="taskbar-start-btn"
        className="taskbar-start-btn"
        onClick={onStartMenuToggle}
        title="Start"
      >
        <span className="start-btn-icon">🪟</span>
        <span className="start-btn-text">Start</span>
      </button>

      {/* App Shortcuts */}
      <div id="taskbar-apps" className="taskbar-apps">
        {appShortcuts.map(app => (
          <button
            key={`shortcut-${app.id}`}
            id={`taskbar-app-${app.id}`}
            className="taskbar-app-btn"
            onClick={() => handleAppClick(app)}
            title={app.name}
          >
            {app.icon}
          </button>
        ))}
      </div>

      {/* Open Windows - SHOW ALL WINDOWS (including minimized) */}
      <div id="taskbar-windows" className="taskbar-apps">
        {windows.map(window => (
          <button
            key={`window-${window.id}`}
            id={`taskbar-window-${window.id}`}
            className={`taskbar-app-btn ${activeWindow === window.id ? 'active' : ''} ${window.minimized ? 'minimized' : ''}`}
            onClick={() => handleWindowClick(window)}
            title={`${window.title}${window.minimized ? ' (Minimized)' : ''}`}
          >
            {window.icon}
            {window.minimized && <span className="minimized-indicator">_</span>}
          </button>
        ))}
      </div>

      {/* Clock */}
      <div id="taskbar-clock" className="taskbar-clock">
        <div className="taskbar-time" id="taskbar-time">
          {formatTime()}
        </div>
        <div className="taskbar-date" id="taskbar-date">
          {formatDate()}
        </div>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="taskbar-debug">
          <span>Windows: {windows.length}</span>
          <span>Minimized: {windows.filter(w => w.minimized).length}</span>
        </div>
      )}
    </div>
  );
};

Taskbar.defaultProps = {
  windows: [],
  activeWindow: null,
  onStartMenuToggle: () => {},
  onAppLaunch: () => {},
  onWindowActivate: () => {},
  onWindowRestore: () => {}
};

export default Taskbar;
import React, { useEffect, useRef } from 'react';
import '../styles/StartMenu.css';

//Start Menu Component: Windows-style start menu with app launcher
const StartMenu = ({ onClose, onAppLaunch }) => {
  const menuRef = useRef(null);

  // Available applications
  const applications = [
    { id: 'explorer', name: 'File Explorer', icon: '📁', description: 'Browse files and folders' },
    { id: 'notepad', name: 'Notepad', icon: '📝', description: 'Text editor' },
    { id: 'terminal', name: 'Terminal', icon: '⌨️', description: 'Command line interface' },
    { id: 'browser', name: 'Browser', icon: '🌐', description: 'Web browser' },
    { id: 'calculator', name: 'Calculator', icon: '🧮', description: 'Simple calculator' },
    { id: 'settings', name: 'Settings', icon: '⚙️', description: 'System settings' },
  ];

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
    };
  }, [onClose]);

  // Handles app click: @param {Object} app - Application object
  const handleAppClick = (app) => {
    console.log(`🚀 Starting ${app.name}`);
    onAppLaunch(app.id);
    onClose();
  };

  // Handles power options @param {string} option - Power option
  const handlePowerOption = (option) => {
    console.log(`🔌 Power option: ${option}`);
    switch (option) {
      case 'shutdown':
        alert('System shutting down...');
        break;
      case 'restart':
        alert('System restarting...');
        break;
      case 'sleep':
        alert('System going to sleep...');
        break;
      default:
        break;
    }
    onClose();
  };

  return (
    <div id="start-menu-container" className="start-menu-container" ref={menuRef}>

      {/* Header */}
      <div className="start-menu-header">
        <div className="start-menu-user">
          <div className="start-menu-user-avatar">
            👤
          </div>
          <div className="start-menu-user-info">
            <div className="start-menu-username">Kiro Veyron</div>
            <div className="start-menu-user-status">Administrator</div>
          </div>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="start-menu-apps">
        {applications.map(app => (
          <div
            key={`start-app-${app.id}`}
            id={`start-app-${app.id}`}
            className="start-menu-app"
            onClick={() => handleAppClick(app)}
            title={app.description}
          >
            <div className="start-menu-app-icon">
              {app.icon}
            </div>
            <div className="start-menu-app-name">
              {app.name}
            </div>
          </div>
        ))}
      </div>

      {/* Power Options */}
      <div className="start-menu-footer">
        <div className="start-menu-power-options">
          <button
            id="start-power-shutdown"
            className="start-menu-power-btn"
            onClick={() => handlePowerOption('shutdown')}
            title="Shut down"
          >
            ⏻
          </button>
          <button
            id="start-power-restart"
            className="start-menu-power-btn"
            onClick={() => handlePowerOption('restart')}
            title="Restart"
          >
            ↻
          </button>
          <button
            id="start-power-sleep"
            className="start-menu-power-btn"
            onClick={() => handlePowerOption('sleep')}
            title="Sleep"
          >
            🌙
          </button>
        </div>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="start-menu-debug">
          <span>Apps: {applications.length}</span>
        </div>
      )}
    </div>
  );
};

export default StartMenu;
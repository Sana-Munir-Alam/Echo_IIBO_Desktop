import React, { useState } from 'react';
import '../styles/Properties.css';

//Properties Component: Windows-style properties dialog for files and folders
const Properties = ({ file, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!file) {
    return null;
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get file type description
  const getFileType = () => {
    if (file.isFolder) return 'File folder';
    
    const typeMap = {
      'txt': 'Text Document',
      'cpp': 'C++ Source File',
      'jpg': 'JPEG Image',
      'jpeg': 'JPEG Image',
      'png': 'PNG Image',
      'gif': 'GIF Image',
      'mp4': 'MP4 Video',
      'avi': 'AVI Video',
      'mov': 'QuickTime Video',
      'pdf': 'PDF Document'
    };
    
    return typeMap[file.type] || 'File';
  };

  // Get file icon
  const getFileIcon = () => {
    if (file.isFolder) return '📁';
    
    const iconMap = {
      'txt': '📄',
      'cpp': '📘',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp4': '🎬',
      'avi': '🎬',
      'mov': '🎬',
      'pdf': '📕'
    };
    
    return iconMap[file.type] || '📎';
  };

  // General Tab Content
  const GeneralTab = () => (
    <div className="properties-tab-content">
      <div className="properties-icon-section">
        <div className="properties-icon-large">
          {getFileIcon()}
        </div>
        <div className="properties-filename">
          {file.name}
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <div className="properties-row">
          <span className="properties-label">Type:</span>
          <span className="properties-value">{getFileType()}</span>
        </div>

        {!file.isFolder && (
          <>
            <div className="properties-row">
              <span className="properties-label">Opens with:</span>
              <span className="properties-value">
                {file.type === 'txt' || file.type === 'cpp' ? 'Notepad' : 'Default viewer'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <div className="properties-row">
          <span className="properties-label">Location:</span>
          <span className="properties-value">{file.path || 'C:'}</span>
        </div>

        <div className="properties-row">
          <span className="properties-label">Size:</span>
          <span className="properties-value">
            {file.isFolder ? '--' : `${formatFileSize(file.size)} (${file.size?.toLocaleString()} bytes)`}
          </span>
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <div className="properties-row">
          <span className="properties-label">Created:</span>
          <span className="properties-value">{formatDate(file.createdAt)}</span>
        </div>

        <div className="properties-row">
          <span className="properties-label">Modified:</span>
          <span className="properties-value">{formatDate(file.modifiedAt)}</span>
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <div className="properties-label-header">Attributes:</div>
        <div className="properties-attributes">
          <label className="properties-checkbox">
            <input type="checkbox" disabled />
            <span>Read-only</span>
          </label>
          <label className="properties-checkbox">
            <input type="checkbox" disabled />
            <span>Hidden</span>
          </label>
          <label className="properties-checkbox">
            <input 
              type="checkbox" 
              checked={file.properties?.passwordLocked || false}
              disabled 
            />
            <span>Password Locked</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Details Tab Content
  const DetailsTab = () => (
    <div className="properties-tab-content">
      <div className="properties-section">
        <h3 className="properties-section-title">File Information</h3>
        
        <div className="properties-details-row">
          <span className="properties-details-label">Name:</span>
          <span className="properties-details-value">{file.name}</span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Type:</span>
          <span className="properties-details-value">{getFileType()}</span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">File Extension:</span>
          <span className="properties-details-value">
            {file.isFolder ? '--' : `.${file.type}`}
          </span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">MIME Type:</span>
          <span className="properties-details-value">
            {file.mimeType || '--'}
          </span>
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <h3 className="properties-section-title">Size</h3>
        
        <div className="properties-details-row">
          <span className="properties-details-label">Size:</span>
          <span className="properties-details-value">
            {file.isFolder ? '--' : formatFileSize(file.size)}
          </span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Size on disk:</span>
          <span className="properties-details-value">
            {file.isFolder ? '--' : formatFileSize(file.size)}
          </span>
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <h3 className="properties-section-title">Dates</h3>
        
        <div className="properties-details-row">
          <span className="properties-details-label">Created:</span>
          <span className="properties-details-value">{formatDate(file.createdAt)}</span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Modified:</span>
          <span className="properties-details-value">{formatDate(file.modifiedAt)}</span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Accessed:</span>
          <span className="properties-details-value">{formatDate(file.modifiedAt)}</span>
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <h3 className="properties-section-title">Ownership</h3>
        
        <div className="properties-details-row">
          <span className="properties-details-label">Owner:</span>
          <span className="properties-details-value">
            {file.properties?.owner || 'System Administrator'}
          </span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Computer:</span>
          <span className="properties-details-value">DESKTOP-PC</span>
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <h3 className="properties-section-title">Additional Properties</h3>
        
        <div className="properties-additional-box">
          {file.properties?.additionalProperty ? (
            <div className="properties-additional-content">
              {file.properties.additionalProperty}
            </div>
          ) : (
            <div className="properties-additional-null">NULL</div>
          )}
        </div>
      </div>

      <div className="properties-divider"></div>

      <div className="properties-section">
        <h3 className="properties-section-title">Attributes</h3>
        
        <div className="properties-details-row">
          <span className="properties-details-label">Read-only:</span>
          <span className="properties-details-value">No</span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Hidden:</span>
          <span className="properties-details-value">No</span>
        </div>

        <div className="properties-details-row">
          <span className="properties-details-label">Password Locked:</span>
          <span className="properties-details-value">
            {file.properties?.passwordLocked ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="properties-container">
      {/* Header */}
      <div className="properties-header">
        <div className="properties-title">
          {file.name} Properties
        </div>
      </div>

      {/* Tabs */}
      <div className="properties-tabs">
        <button className={`properties-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          General
        </button>
        <button className={`properties-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
          Details
        </button>
      </div>

      {/* Tab Content */}
      <div className="properties-body">
        {activeTab === 'general' ? <GeneralTab /> : <DetailsTab />}
      </div>

      {/* Footer */}
      <div className="properties-footer">
        <button className="properties-btn properties-btn-primary" onClick={onClose}>
          OK
        </button>
        <button className="properties-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="properties-btn" disabled>
          Apply
        </button>
      </div>
    </div>
  );
};

export default Properties;
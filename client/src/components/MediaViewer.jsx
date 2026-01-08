import React from 'react';
import '../styles/MediaViewer.css';

const MediaViewer = ({ file }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const isImage = ['jpg', 'png', 'gif'].includes(file.type);
  const isVideo = ['mp4', 'avi', 'mov'].includes(file.type);
  const isPDF = file.type === 'pdf';
  
  // Get file URL from server
  const getMediaUrl = () => {
    if (!file.filePath) {
      console.error('No file path available');
      return '';
    }
    // Return the full URL to the uploaded file
    return `${API_URL}/${file.filePath}`;
  };
  
  const getMimeType = (type) => {
    const mimeMap = {
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'pdf': 'application/pdf'
    };
    return mimeMap[type] || 'application/octet-stream';
  };

  const mediaUrl = getMediaUrl();

  return (
    <div className="media-viewer">
      <div className="media-viewer-header">
        <h3>{file.name}</h3>
        <p className="media-info">
          Size: {(file.size / 1024 / 1024).toFixed(2)} MB | Type: {file.type.toUpperCase()}
        </p>
      </div>
      
      <div className="media-viewer-content">
        {!mediaUrl ? (
          <div className="error-message">
            <p>Error: File path not available</p>
            <p>This file may not have been uploaded correctly.</p>
          </div>
        ) : isImage ? (
          <img 
            src={mediaUrl} 
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            onError={(e) => {
              console.error('Image load error:', e);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : isVideo ? (
          <video 
            controls 
            style={{ maxWidth: '100%', maxHeight: '80vh' }}
            onError={(e) => {
              console.error('Video load error:', e);
            }}
          >
            <source src={mediaUrl} type={getMimeType(file.type)} />
            Your browser does not support the video tag.
          </video>
        ) : isPDF ? (
          <div className="pdf-viewer">
            <p>PDF file: {file.name}</p>
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
              Open PDF in new tab
            </a>
            <iframe
              src={mediaUrl}
              title={file.name}
              style={{ width: '100%', height: '70vh', border: 'none' }}
            />
          </div>
        ) : (
          <div className="unknown-file">
            <p>Cannot preview this file type: {file.type}</p>
            <p>File size: {(file.size / 1024).toFixed(2)} KB</p>
            <a href={mediaUrl} download={file.name} className="download-btn">
              Download File
            </a>
          </div>
        )}
        
        {/* Error fallback (hidden by default) */}
        <div className="error-message" style={{ display: 'none' }}>
          <p>Error loading media file</p>
          <p>The file may be corrupted or in an unsupported format.</p>
          <a href={mediaUrl} download={file.name} className="download-btn">
            Try downloading the file
          </a>
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
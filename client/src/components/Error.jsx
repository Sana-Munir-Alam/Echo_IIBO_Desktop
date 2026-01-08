import React from 'react';
import '../styles/Error.css';

const Error = ({ message, onClose }) => {
  return (
    <>
      <div className="error-overlay" />
      <div className="error-dialog">
        <div className="error-header">
          <span className="error-title">⚠️ File Explorer</span>
          <button className="error-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="error-body">
          <p className="error-main-text">
            {message || 'Access is restricted.'}
          </p>

          <p className="error-sub-text">
            The requested object is not accessible from this context.
          </p>

          <p className="error-hint">
            Operation Aborted
          </p>
        </div>

        <div className="error-footer">
          <button className="error-btn-ok" onClick={onClose}>OK</button>
        </div>
      </div>
    </>
  );
};

export default Error;

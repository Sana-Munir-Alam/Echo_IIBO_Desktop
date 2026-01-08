import React, { useState, useEffect, useRef } from 'react';
import '../styles/PasswordAccess.css';

const PasswordAccess = ({ file, onSuccess, onCancel }) => {
  const [currentPasswordIndex, setCurrentPasswordIndex] = useState(0);
  const [passwordInput, setPasswordInput] = useState('');
  const [collectedPasswords, setCollectedPasswords] = useState([]);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const totalPasswords = file?.properties?.passwordKeys?.length || 0;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentPasswordIndex]);

  const validatePasswords = async (passwords) => {
    try {
      const response = await fetch(`${API_URL}/api/files/validate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: file._id, 
          passwords 
        })
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

  const handleSubmit = async () => {
    if (!passwordInput.trim()) {
      return;
    }

    const newPasswords = [...collectedPasswords, passwordInput.trim()];
    setCollectedPasswords(newPasswords);
    setPasswordInput('');

    // Check if we've collected all passwords
    if (newPasswords.length >= totalPasswords) {
      setIsValidating(true);

      // Validate all passwords
      const validation = await validatePasswords(newPasswords);

      setIsValidating(false);

      if (validation.success && validation.valid) {
        // All passwords correct
        setShowSuccess(true);
        
        // Wait 1 second then proceed
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        // Incorrect password
        setShowError(true);
      }
    } else {
      // Move to next password
      setCurrentPasswordIndex(currentPasswordIndex + 1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleErrorClose = () => {
    setShowError(false);
    onCancel();
  };

  // Error popup
  if (showError) {
    return (
      <>
        <div className="password-access-overlay" onClick={handleErrorClose} />
        <div className="password-access-error">
          <div className="password-access-error-header">
            <span className="password-access-error-icon">⚠️</span>
            <span className="password-access-error-title">Access Denied</span>
          </div>
          <div className="password-access-error-body">
            <p>Incorrect Password</p>
            <p className="password-access-error-detail">
              Authentication failed. Access denied.
            </p>
          </div>
          <div className="password-access-error-footer">
            <button 
              className="password-access-btn password-access-btn-primary"
              onClick={handleErrorClose}
            >
              OK
            </button>
          </div>
        </div>
      </>
    );
  }

  // Success popup
  if (showSuccess) {
    return (
      <>
        <div className="password-access-overlay" />
        <div className="password-access-success">
          <div className="password-access-success-icon">✓</div>
          <div className="password-access-success-title">Access Granted</div>
          <div className="password-access-success-message">
            Authentication successful
          </div>
        </div>
      </>
    );
  }

  // Main password input popup
  return (
    <>
      <div className="password-access-overlay" onClick={onCancel} />
      <div className="password-access-modal">
        <div className="password-access-header">
          <div className="password-access-icon">🔒</div>
          <div className="password-access-title">
            Password Protected
          </div>
          <button 
            className="password-access-close"
            onClick={onCancel}
            title="Cancel"
          >
            ✕
          </button>
        </div>

        <div className="password-access-body">
          <div className="password-access-file-info">
            <div className="password-access-file-icon">
              {file?.isFolder ? '📁' : '📄'}
            </div>
            <div className="password-access-file-name">
              {file?.name || 'Unknown'}
            </div>
          </div>

          <div className="password-access-message">
            This {file?.isFolder ? 'folder' : 'file'} is password protected.
            Please enter the required passwords to access.
          </div>

          <div className="password-access-progress">
            Password {currentPasswordIndex + 1} of {totalPasswords}
          </div>

          <div className="password-access-input-group">
            <label className="password-access-label">
              Enter Password {currentPasswordIndex + 1}:
            </label>
            <input
              ref={inputRef}
              type="password"
              className="password-access-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••••••"
              disabled={isValidating}
              autoFocus
            />
          </div>

          {isValidating && (
            <div className="password-access-validating">
              Validating...
            </div>
          )}
        </div>

        <div className="password-access-footer">
          <button 
            className="password-access-btn password-access-btn-secondary"
            onClick={onCancel}
            disabled={isValidating}
          >
            Cancel
          </button>
          <button 
            className="password-access-btn password-access-btn-primary"
            onClick={handleSubmit}
            disabled={!passwordInput.trim() || isValidating}
          >
            {currentPasswordIndex + 1 >= totalPasswords ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
};

export default PasswordAccess;
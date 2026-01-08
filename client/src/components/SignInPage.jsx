import React, { useState, useRef, useEffect } from 'react';
import '../styles/SignInPage.css';

const SignInPage = ({ onSignIn }) => {
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      return;
    }

    setIsLoading(true);
    setShowError(false);

    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const result = await response.json();

      if (result.success) {
        // Successful login
        console.log('✅ Sign in successful');
        onSignIn();
      } else {
        // Failed login
        console.log('❌ Sign in failed');
        setShowError(true);
        setPassword('');
        setIsLoading(false);
        
        // Shake animation
        const container = document.querySelector('.signin-password-container');
        if (container) {
          container.classList.add('shake');
          setTimeout(() => {
            container.classList.remove('shake');
          }, 500);
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setShowError(true);
      setPassword('');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="signin-page">
      {/* Blurred Background */}
      <div className="signin-background"></div>

      {/* Sign In Container */}
      <div className="signin-container">
        {/* Profile Picture */}
        <div className="signin-profile">
          <div className="signin-avatar">
            👤
          </div>
        </div>

        {/* Username */}
        <div className="signin-username">
          Kiro Veyron
        </div>

        {/* Password Input */}
        <div className="signin-password-container">
          <input
            ref={inputRef}
            type="password"
            className={`signin-password-input ${showError ? 'error' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="PIN"
            maxLength="4"
            disabled={isLoading}
            autoFocus
          />
          
          {showError && (
            <div className="signin-error-message">
              The PIN is incorrect. Try again.
            </div>
          )}
        </div>

        {/* Hint Button */}
        <button 
          className="signin-hint-button"
          onClick={() => setShowHint(!showHint)}
          disabled={isLoading}
        >
          {showHint ? 'Hide hint' : 'Sign-in options'}
        </button>

        {/* Hint Text */}
        {showHint && (
          <div className="signin-hint-content">
            <div className="signin-hint-title">PIN Hint:</div>
            <div className="signin-hint-text">
              • A 4-digit PIN<br/>
              • The sum of the digits is 14<br/>
              • The third digit is double the first<br/>
              • The second digit is odd and greater than the first<br/>
              • The last digit is 3 less than the second
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          className="signin-submit-button"
          onClick={handleSubmit}
          disabled={isLoading || !password.trim()}
        >
          {isLoading ? (
            <div className="signin-loading-spinner"></div>
          ) : (
            '→'
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="signin-footer">
        <div className="signin-footer-icons">
          <button className="signin-footer-icon" title="Ease of access">
            ⚙️
          </button>
          <button className="signin-footer-icon" title="Power">
            ⏻
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
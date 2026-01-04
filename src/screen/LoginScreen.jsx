import React, { useState } from 'react';
import './LoginScreen.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authReducer';

function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('Demo2026');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const togglePassword = () => {
    setPasswordVisible((prev) => !prev);
  };

  const performDummyLogin = (overrideUser) => {
    // Dummy tokens just for front-end flow
    dispatch(
      setCredentials({
        access_token: `dummy_access_${Date.now()}`,
        refresh_token: `dummy_refresh_${Date.now()}`,
        user: overrideUser || username,
      })
    );
    navigate('/dashboard');
  };

  const handleLogin = () => {
    performDummyLogin(username || 'DemoUser');
  };

  const handleLoginWithDemoID = () => {
    setUsername('DemoID');
    performDummyLogin('DemoID');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="login-page">

      <div className="login-card">
        <div className="login-logo">King</div>

        <div className="login-input-group">
          <input
            type="text"
            className="login-input"
            placeholder="Demo2026"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <span className="input-icon" aria-hidden="true">👤</span>
        </div>

        <div className="login-input-group">
          <input
            type={passwordVisible ? 'text' : 'password'}
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="input-icon btn-eye"
            onClick={togglePassword}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? '🙈' : '👁️'}
          </button>
        </div>

        <button className="login-btn primary" onClick={handleLogin}>Login</button>
        {/* <button className="login-btn secondary" onClick={handleLoginWithDemoID}>Login with Demo ID</button> */}
      </div>
    </div>
  );
}

export default LoginScreen;
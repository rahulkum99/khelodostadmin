import React, { useState } from 'react';
import './LoginScreen.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authReducer';
import { useLoginMutation } from '../redux/api/authApi';

function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const togglePassword = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async () => {
    setError('');
    try {
      const result = await login({ username, password }).unwrap();
      const { accessToken, refreshToken, user } = result.data || {};

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid login response');
      }

      dispatch(
        setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
          user,
        })
      );
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed', err);
      const apiMessage = err?.data?.message || err?.error;
      setError(apiMessage || 'Login failed. Please check your credentials.');
    }
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
        {error && (
          <div style={{ color: 'white', marginBottom: '8px', fontSize: '13px' }}>
            {error}
          </div>
        )}
        <button
          className="login-btn primary"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {/* <button className="login-btn secondary" onClick={handleLoginWithDemoID}>Login with Demo ID</button> */}
      </div>
    </div>
  );
}

export default LoginScreen;
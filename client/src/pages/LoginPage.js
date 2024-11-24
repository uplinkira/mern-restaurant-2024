// client/src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../redux/slices/authSlice';
import useGoogleLogin from '../hooks/useGoogleLogin';
import { validateLoginForm } from '../utils/validation';
import '../App.css'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: googleError, renderGoogleButton } = useGoogleLogin();

  useEffect(() => {
    renderGoogleButton('googleSignInButton');
  }, [renderGoogleButton]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const errors = validateLoginForm({ email, password });
    if (Object.keys(errors).length > 0) {
      setErrorMessage(Object.values(errors).join('. '));
      setIsLoading(false);
      return;
    }

    dispatch(loginUser({ email, password }))
      .unwrap()
      .then(() => {
        console.log('Login successful');
        navigate('/'); // Redirect to home/dashboard
      })
      .catch((error) => {
        const message = error.message || 'Login failed';
        console.error('Login Error:', message);
        setErrorMessage(
          message === 'Request failed with status code 401' ? 'Invalid email or password' : message
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="login-container">
      <h2 className="login-header">Login</h2>
      {(errorMessage || googleError) && (
        <p className="error-message">{errorMessage || googleError}</p>
      )}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn-login" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div id="googleSignInButton"></div>
      {!window.google && (
        <p className="error-message">
          Google login is currently unavailable. Please try again later.
        </p>
      )}
    </div>
  );
};

export default Login;
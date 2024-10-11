import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { googleLogin, loginUser } from '../redux/slices/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();

  // Initialize Google Identity Services (GIS) for OAuth login
  useEffect(() => {
    const handleGoogleLogin = (response) => {
      if (response && response.credential) {
        const tokenId = response.credential; // GIS sends the token here
        dispatch(googleLogin(tokenId))
          .unwrap()
          .then(() => {
            console.log('Google login successful');
          })
          .catch((error) => {
            console.error('Google login error:', error);  // Log the error
            setErrorMessage(error.message || 'Google login failed. Please try again.');
          });
      } else {
        setErrorMessage('No credential received from Google login');
      }
    };

    const initializeGoogleLogin = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: '315787351849-krk8u0b8mljhqjit732n4sumcolepnst.apps.googleusercontent.com',  // Ensure this matches your client ID from Google Console
          callback: handleGoogleLogin,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { theme: 'outline', size: 'large' }
        );
      } else {
        setErrorMessage('Failed to load Google Identity Services. Please reload the page or check your internet connection.');
      }
    };

    initializeGoogleLogin();
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Log form values for debugging
    console.log('Login attempt with email:', email);
    console.log('Login attempt with password (raw):', password);  // Log the raw password for debugging

    dispatch(loginUser({ email, password }))
      .unwrap()
      .then(() => {
        console.log('Login successful with email and password');
      })
      .catch((error) => {
        // Specific error handling for better user feedback
        const message = error.message || 'Login failed';
        console.error('Login Error:', message);  // Log error details for debugging
        setErrorMessage(message === 'Request failed with status code 401' 
                        ? 'Invalid email or password' 
                        : message);
      });
  };

  return (
    <div className="login-container">
      <h2 className="login-header">Login</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </div>
        <button type="submit" className="btn-login">
          Login
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

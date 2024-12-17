// client/src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { validateLoginForm } from '../utils/validation';
import '../App.css';

const LoginPage = () => {
  const initialFormState = {
    email: '',
    password: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleAvailable, setGoogleAvailable] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    login, 
    isLoading, 
    error: authError, 
    initGoogleLogin, 
    renderGoogleButton,
    isAuthenticated,
    clearError
  } = useAuth();

  // Handle redirect on authentication
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Handle Google Sign-In initialization
  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        console.log('Starting Google Auth initialization...');
        if (!window.google) {
          console.error('Google API not loaded');
          setGoogleAvailable(false);
          return;
        }

        const success = await initGoogleLogin();
        if (success) {
          console.log('Google Auth initialized successfully');
          window.google.accounts.id.renderButton(
            document.getElementById('googleSignInButton'),
            {
              theme: 'filled_blue',
              size: 'large',
              width: 280,
              text: 'continue_with'
            }
          );
        } else {
          setGoogleAvailable(false);
        }
      } catch (error) {
        console.error('Google auth initialization failed:', error);
        setGoogleAvailable(false);
      }
    };

    initializeGoogleAuth();
    
    // Set initial email from registration if available
    const registrationEmail = location.state?.email;
    if (registrationEmail) {
      setFormData(prev => ({ ...prev, email: registrationEmail }));
    }

    return () => {
      const googleButton = document.getElementById('googleSignInButton');
      if (googleButton) {
        googleButton.innerHTML = '';
      }
    };
  }, [initGoogleLogin, clearError, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
    
    // Clear errors when user starts typing
    if (errorMessage) setErrorMessage('');
    if (authError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      // Validate form
      const validationErrors = validateLoginForm(formData);
      if (validationErrors) {
        const errorMessages = Object.values(validationErrors);
        setErrorMessage(errorMessages.join('. '));
        return;
      }

      // Attempt login
      const success = await login({
        email: formData.email.toLowerCase(),
        password: formData.password
      });

      if (!success) {
        setErrorMessage('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'An error occurred during login. Please try again.'
      );
    }
  };

  // Show registration success message if available
  const registrationMessage = location.state?.message;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Please sign in to continue</p>
        </div>

        {registrationMessage && (
          <div className="notification success-notification" role="alert">
            {registrationMessage}
          </div>
        )}

        {(errorMessage || authError) && (
          <div className="notification error-notification" role="alert">
            {errorMessage || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
              <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={`form-input ${errorMessage ? 'error' : ''}`}
              placeholder="Enter your email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errorMessage}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
              <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              className={`form-input ${errorMessage ? 'error' : ''}`}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={!!errorMessage}
              minLength={8}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {googleAvailable && (
          <div className="social-auth">
            <div className="social-auth-title">
              <span>Or continue with</span>
            </div>
            <div className="social-buttons">
              <div 
                id="googleSignInButton" 
                className="social-button"
                style={{ minHeight: '40px' }}
              />
            </div>
          </div>
        )}

        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
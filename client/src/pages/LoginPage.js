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
        await initGoogleLogin();
        renderGoogleButton('googleSignInButton', {
          theme: 'filled_blue',
          text: 'signin_with',
          shape: 'rectangular',
          size: 'large',
          width: '280',
          locale: 'en'
        });
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

    return () => clearError();
  }, [initGoogleLogin, renderGoogleButton, clearError, location.state]);

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
    <div className="login-container">
      <div className="login-content">
        <h2 className="login-header">Welcome Back</h2>
        <p className="login-subheader">Please sign in to continue</p>

        {registrationMessage && (
          <div className="success-message" role="alert">
            {registrationMessage}
          </div>
        )}

        {(errorMessage || authError) && (
          <div className="error-message" role="alert">
            {errorMessage || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">
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
              className="form-input"
              placeholder="Enter your email"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errorMessage}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
              <span className="required">*</span>
            </label>
            <div className="password-input-group">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="form-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!errorMessage}
                minLength={8}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`btn-login ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {googleAvailable && (
          <div className="google-login-container">
            <div className="divider">
              <span>Or continue with</span>
            </div>
            <div 
              id="googleSignInButton" 
              className="google-button"
              aria-label="Sign in with Google"
            />
          </div>
        )}

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
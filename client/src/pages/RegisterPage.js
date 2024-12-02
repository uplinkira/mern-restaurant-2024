// client/src/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { validateRegisterForm } from '../utils/validation';
import '../App.css';

const RegisterPage = () => {
  const initialFormState = {
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleAvailable, setGoogleAvailable] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    register, 
    isLoading, 
    error: authError, 
    initGoogleLogin, 
    renderGoogleButton,
    isAuthenticated,
    clearError 
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        await initGoogleLogin();
        renderGoogleButton('googleSignUpButton', {
          theme: 'filled_blue',
          text: 'signup_with',
          shape: 'rectangular',
          size: 'large',
          width: '280'  // Fixed width in pixels
        });
      } catch (error) {
        console.error('Google auth initialization failed:', error);
        setGoogleAvailable(false);
      }
    };

    initializeGoogleAuth();
    return () => clearError();
  }, [initGoogleLogin, renderGoogleButton, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phoneNumber' ? value : value.trim()
    }));
    
    // Clear errors when user starts typing
    if (errorMessage) setErrorMessage('');
    if (authError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Form validation
    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage(Object.values(validationErrors).join('. '));
      return;
    }

    try {
      // Prepare registration data
      const registrationData = {
        ...formData,
        email: formData.email.toLowerCase(),
        phoneNumber: formData.phoneNumber || undefined
      };

      const result = await register(registrationData);
      
      if (result.success) {
        // Clear form and navigate to login
        setFormData(initialFormState);
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please log in.',
            email: formData.email 
          },
          replace: true
        });
      } else {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Registration failed. Please try again.'
      );
    }
  };

  const formFields = [
    {
      name: 'username',
      type: 'text',
      label: 'Username',
      placeholder: 'Choose a username (3-30 characters)',
      autoComplete: 'username',
      minLength: 3,
      maxLength: 30,
      required: true
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      placeholder: 'Enter your first name',
      autoComplete: 'given-name',
      required: true
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      autoComplete: 'family-name',
      required: true
    },
    {
      name: 'phoneNumber',
      type: 'tel',
      label: 'Phone Number (Optional)',
      placeholder: '+1234567890',
      autoComplete: 'tel',
      pattern: "\\+?[1-9]\\d{1,14}",
      required: false
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      autoComplete: 'email',
      required: true
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Create a password (min. 8 characters)',
      autoComplete: 'new-password',
      minLength: 8,
      required: true
    },
    {
      name: 'confirmPassword',
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm your password',
      autoComplete: 'new-password',
      minLength: 8,
      required: true
    }
  ];

  return (
    <div className="register-container">
      <div className="register-content">
        <h2 className="register-header">Create Account</h2>
        <p className="register-subheader">Join Chen Pi Cuisine</p>

        {(errorMessage || authError) && (
          <div className="error-message" role="alert">
            {errorMessage || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {formFields.map(({ name, type, label, placeholder, autoComplete, pattern, required, minLength, maxLength }) => (
            <div className="form-group" key={name}>
              <label htmlFor={name}>
                {label}
                {required && <span className="required">*</span>}
              </label>
              <input
                type={type}
                id={name}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={required}
                disabled={isLoading}
                placeholder={placeholder}
                autoComplete={autoComplete}
                pattern={pattern}
                minLength={minLength}
                maxLength={maxLength}
                className="form-input"
                aria-required={required}
                aria-invalid={!!errorMessage}
              />
            </div>
          ))}

          <button 
            type="submit" 
            className={`btn-register ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {googleAvailable && (
          <div className="google-register-container">
            <div className="divider">
              <span>Or sign up with</span>
            </div>
            <div 
              id="googleSignUpButton" 
              className="google-button"
              aria-label="Sign up with Google"
            />
          </div>
        )}

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
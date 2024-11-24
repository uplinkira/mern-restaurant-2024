// client/src/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../redux/slices/authSlice';
import useGoogleLogin from '../hooks/useGoogleLogin';
import { validateRegisterForm } from '../utils/validation';
import '../App.css'; 

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: googleError, renderGoogleButton } = useGoogleLogin();

  useEffect(() => {
    renderGoogleButton('googleSignUpButton');
  }, [renderGoogleButton]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const errors = validateRegisterForm(formData);
    if (Object.keys(errors).length > 0) {
      setErrorMessage(Object.values(errors).join('. '));
      setIsLoading(false);
      return;
    }

    try {
      const response = await dispatch(registerUser(formData)).unwrap();
      console.log('Registration successful:', response);
      navigate('/login');  // Redirect to login page after successful registration
    } catch (error) {
      setErrorMessage(error.message || 'Registration failed. Please try again.');
      console.error('Registration Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-header">Register</h2>
      {(errorMessage || googleError) && (
        <p className="error-message">{errorMessage || googleError}</p>
      )}
      <form onSubmit={handleSubmit} className="register-form">
        {['username', 'firstName', 'lastName', 'phoneNumber', 'email', 'password', 'confirmPassword'].map((field) => (
          <div className="form-group" key={field}>
            <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</label>
            <input
              type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder={field === 'phoneNumber' ? '+123456789' : ''}
            />
          </div>
        ))}
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div id="googleSignUpButton"></div>
      {!window.google && (
        <p className="error-message">
          Google sign-up is currently unavailable. Please try again later.
        </p>
      )}
    </div>
  );
};

export default RegisterPage;
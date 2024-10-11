import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { googleLogin } from '../redux/slices/authSlice';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement login logic (dispatch loginUser with email and password)
    console.log('Login attempted with:', { email, password });
  };

  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt((response) => {
        if (response.credential) {
          const tokenId = response.credential;
          dispatch(googleLogin(tokenId))
            .unwrap()
            .then(() => {
              console.log('Google login successful');
            })
            .catch((error) => {
              setErrorMessage(error.message || 'Google login failed');
            });
        } else {
          setErrorMessage('No credential received from Google login');
        }
      });
    } else {
      console.error('Google Identity Services not loaded');
    }
  };

  // Initialize Google Identity Services on component mount
  useEffect(() => {
    const initializeGoogleLogin = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: '315787351849-krk8u0b8mljhqjit732n4sumcolepnst.apps.googleusercontent.com',
          callback: handleGoogleLogin,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { theme: 'outline', size: 'large' }
        );
      }
    };
    initializeGoogleLogin();
  }, []); // Only run on mount

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border mb-2 p-2 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border mb-2 p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">Login</button>
      </form>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <div id="googleSignInButton"></div> {/* Google Sign-In button */}
    </div>
  );
};

export default LoginPage;

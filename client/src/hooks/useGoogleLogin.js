// hooks/useGoogleLogin.js

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { googleLogin } from '../redux/slices/authSlice';

const useGoogleLogin = () => {
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleGoogleLogin = (response) => {
    if (response && response.credential) {
      const tokenId = response.credential;
      dispatch(googleLogin(tokenId))
        .unwrap()
        .then(() => {
          console.log('Google login successful');
          // You can add additional logic here, like navigation
        })
        .catch((error) => {
          console.error('Google login error:', error);
          setError(error.message || 'Google login failed. Please try again.');
        });
    } else {
      setError('No credential received from Google login');
    }
  };

  useEffect(() => {
    const initializeGoogleLogin = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });
      } else {
        setError('Failed to load Google Identity Services. Please reload the page or check your internet connection.');
      }
    };

    initializeGoogleLogin();
  }, [dispatch]);

  const renderGoogleButton = (elementId) => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        { theme: 'outline', size: 'large' }
      );
    }
  };

  return { error, renderGoogleButton };
};

export default useGoogleLogin;
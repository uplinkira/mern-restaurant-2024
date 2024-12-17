import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyToken,
  clearError,
  selectAuthState,
  googleLogin,
} from '../redux/slices/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, status, error } = useSelector(selectAuthState);
  const [isVerifying, setIsVerifying] = useState(false);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const verifyAuthToken = useCallback(async (silent = false) => {
    if (!silent) setIsVerifying(true);
    try {
      const resultAction = await dispatch(verifyToken());
      if (verifyToken.fulfilled.match(resultAction)) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    } finally {
      if (!silent) setIsVerifying(false);
    }
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated && !isVerifying) {
      verifyAuthToken(true);
    }
  }, [isAuthenticated, verifyAuthToken, isVerifying]);

  const login = useCallback(async (credentials) => {
    try {
      dispatch(clearError()); // Clear any existing errors before login attempt
      const resultAction = await dispatch(loginUser(credentials));
      
      if (loginUser.fulfilled.match(resultAction)) {
        // Login successful
        const from = location.state?.from || '/';
        navigate(from, { replace: true });
        return true;
      } else if (loginUser.rejected.match(resultAction)) {
        // Login failed with error
        console.error('Login failed:', resultAction.payload);
        return false;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [dispatch, navigate, location]);

  const register = useCallback(async (userData) => {
    try {
      dispatch(clearError()); // Clear any existing errors before registration attempt
      const resultAction = await dispatch(registerUser(userData));
      if (registerUser.fulfilled.match(resultAction)) {
        navigate('/login', { replace: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }, [dispatch, navigate]);

  const logout = useCallback(async () => {
    try {
      dispatch(clearError()); // Clear any existing errors before logout attempt
      await dispatch(logoutUser());
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [dispatch, navigate]);

  const checkAuth = useCallback(async (forceVerify = false) => {
    const token = localStorage.getItem('token');
    console.log('Checking auth - Token present:', !!token);
    console.log('Current auth state:', { isAuthenticated, status });

    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
      return false;
    }

    if (forceVerify || !isAuthenticated) {
      console.log('Verifying auth token...');
      const verified = await verifyAuthToken(true);
      if (!verified) {
        console.log('Token verification failed, redirecting to login');
        navigate('/login', {
          state: { from: location.pathname },
          replace: true
        });
        return false;
      }
      console.log('Token verified successfully');
    }
    return true;
  }, [isAuthenticated, navigate, location, verifyAuthToken]);

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      console.log('Google response received:', response);
      await dispatch(googleLogin(response.credential));
    } catch (error) {
      console.error('Google login error:', error);
    }
  }, [dispatch]);

  const initGoogleLogin = useCallback(async () => {
    try {
      console.log('Checking Google API availability...');
      if (!window.google) {
        console.error('Google API not loaded');
        return false;
      }

      console.log('Checking Client ID...');
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('Google Client ID not found');
        return false;
      }

      console.log('Initializing Google API with Client ID:', clientId);
      await window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse
      });

      console.log('Google API initialized successfully');
      return true;
    } catch (error) {
      console.error('Google auth initialization error:', error);
      return false;
    }
  }, [handleGoogleResponse]);

  return {
    isAuthenticated,
    user,
    isLoading: status === 'loading',
    error,
    login,
    register,
    logout,
    checkAuth,
    verifyAuthToken,
    clearError: () => dispatch(clearError()),
    initGoogleLogin,
    handleGoogleResponse
  };
};

export default useAuth;
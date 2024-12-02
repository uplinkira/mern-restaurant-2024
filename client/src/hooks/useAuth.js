import { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
 loginUser,
 registerUser,
 logoutUser,
 googleLogin,
 verifyToken,
 clearError,
 setInitializing,
 selectAuth,
 selectIsAuthenticated,
 selectUser,
 selectAuthStatus,
 selectAuthError,
 selectIsInitializing
} from '../redux/slices/authSlice';

const useAuth = () => {
 const dispatch = useDispatch();
 const navigate = useNavigate();
 const location = useLocation();
 const verificationTimer = useRef(null);

 const auth = useSelector(selectAuth);
 const isAuthenticated = useSelector(selectIsAuthenticated);
 const user = useSelector(selectUser);
 const status = useSelector(selectAuthStatus);
 const authError = useSelector(selectAuthError);
 const isInitializing = useSelector(selectIsInitializing);

 const [googleError, setGoogleError] = useState(null);
 const [isVerifying, setIsVerifying] = useState(false);

 const verifyAuthToken = useCallback(async (force = false) => {
   const token = localStorage.getItem('token');
   if (!token || (!force && isAuthenticated)) return false;
   
   setIsVerifying(true);
   try {
     await dispatch(verifyToken()).unwrap();
     return true;
   } catch (error) {
     console.error('Token verification failed:', error);
     return false;
   } finally {
     setIsVerifying(false);
   }
 }, [dispatch, isAuthenticated]);

 useEffect(() => {
   if (!isInitializing && !isVerifying) {
     verifyAuthToken();
   }

   verificationTimer.current = setInterval(() => {
     verifyAuthToken(true);
   }, 15 * 60 * 1000); // Verify every 15 minutes

   return () => {
     if (verificationTimer.current) {
       clearInterval(verificationTimer.current);
     }
   };
 }, [verifyAuthToken, isInitializing]);

 const handleLogin = useCallback(async (credentials) => {
   try {
     dispatch(clearError());
     const result = await dispatch(loginUser(credentials)).unwrap();
     if (result.user) {
       const redirectTo = location.state?.from || '/';
       navigate(redirectTo, { replace: true });
       return { success: true };
     }
     return { success: false, error: 'Login failed' };
   } catch (error) {
     return {
       success: false,
       error: error.message || 'Login failed. Please try again.'
     };
   }
 }, [dispatch, navigate, location]);

 const handleRegister = useCallback(async (userData) => {
   try {
     dispatch(clearError());
     const result = await dispatch(registerUser(userData)).unwrap();
     if (result.user) {
       navigate('/');
       return { success: true };
     }
     return { success: false, error: 'Registration failed' };
   } catch (error) {
     return {
       success: false,
       error: error.message || 'Registration failed. Please try again.'
     };
   }
 }, [dispatch, navigate]);

 const handleLogout = useCallback(async () => {
   if (verificationTimer.current) {
     clearInterval(verificationTimer.current);
   }
   try {
     await dispatch(logoutUser()).unwrap();
     navigate('/login');
     return { success: true };
   } catch (error) {
     console.error('Logout error:', error);
     return { success: false, error: 'Logout failed' };
   }
 }, [dispatch, navigate]);

 const handleGoogleLogin = useCallback(async (response) => {
   try {
     dispatch(clearError());
     if (!response?.credential) {
       throw new Error('No credential received from Google');
     }
     const result = await dispatch(googleLogin(response.credential)).unwrap();
     if (result.user) {
       const redirectTo = location.state?.from || '/';
       navigate(redirectTo, { replace: true });
       return { success: true };
     }
     return { success: false, error: 'Google login failed' };
   } catch (error) {
     const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Google login failed';
     setGoogleError(errorMessage);
     return { success: false, error: errorMessage };
   }
 }, [dispatch, navigate, location]);

 const checkAuth = useCallback(async (forceVerify = false) => {
   const token = localStorage.getItem('token');
   if (!token) {
     navigate('/login', { 
       state: { from: location.pathname },
       replace: true 
     });
     return false;
   }

   if (forceVerify || !isAuthenticated) {
     const verified = await verifyAuthToken(true);
     if (!verified) {
       navigate('/login', {
         state: { from: location.pathname },
         replace: true
       });
       return false;
     }
   }
   return true;
 }, [isAuthenticated, navigate, location, verifyAuthToken]);

 const initGoogleLogin = useCallback(() => {
   const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
   if (!googleClientId) {
     setGoogleError('Google Client ID is not configured');
     return;
   }

   if (window.google?.accounts) {
     window.google.accounts.id.initialize({
       client_id: googleClientId,
       callback: handleGoogleLogin,
       auto_select: false,
       cancel_on_tap_outside: true
     });
   } else {
     setGoogleError('Google Identity Services failed to load');
   }
 }, [handleGoogleLogin]);

 const renderGoogleButton = useCallback((elementId, customization = {}) => {
   if (window.google?.accounts) {
     window.google.accounts.id.renderButton(
       document.getElementById(elementId),
       {
         theme: 'filled_blue',
         size: 'large',
         type: 'standard',
         shape: 'rectangular',
         width: '100%',
         ...customization
       }
     );
   }
 }, []);

 return {
   isAuthenticated,
   user,
   isInitializing,
   isLoading: status === 'loading' || isVerifying,
   error: authError || googleError,
   status,
   login: handleLogin,
   register: handleRegister,
   logout: handleLogout,
   googleLogin: handleGoogleLogin,
   initGoogleLogin,
   renderGoogleButton,
   checkAuth,
   clearError: () => dispatch(clearError()),
   verifyToken: () => verifyAuthToken(true),
   auth
 };
};

export default useAuth;
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import store from './redux/store';
import App from './App';
import './index.css';

// Get Google Client ID from environment variable
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render app with all necessary providers
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={googleClientId}>
          <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
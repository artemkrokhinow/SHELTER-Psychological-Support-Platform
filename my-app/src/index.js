import React from 'react';
import ReactDOM from 'react-dom/client';
import './infrastructure/assets/styles/index-tailwind.css';
import './infrastructure/i18n';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="208244813457-lbctirhu4sfrcgurnfbsfh0kc0eq4rd9.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

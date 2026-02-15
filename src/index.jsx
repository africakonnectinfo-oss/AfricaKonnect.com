import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { authClient } from './lib/auth'
import App from './App.jsx'
import './index.css'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.error('Critical Error: VITE_NEON_AUTH_URL is missing in environment variables.');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ color: '#e11d48' }}>Configuration Error</h1>
      <p>The application cannot start because the authentication URL is missing.</p>
      <p style={{ color: '#666' }}>Please configure <code>VITE_NEON_AUTH_URL</code> in your deployment settings.</p>
    </div>
  );
} else {
  // authClient log removed to avoid TDZ if client is not ready

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>,
  );
}

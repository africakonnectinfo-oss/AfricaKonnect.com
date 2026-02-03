import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { NeonAuthUIProvider } from './lib/auth'
import App from './App.jsx'
import './index.css'

const authConfig = {
  baseURL: import.meta.env.VITE_NEON_AUTH_URL,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <NeonAuthUIProvider {...authConfig}>
          <App />
        </NeonAuthUIProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)

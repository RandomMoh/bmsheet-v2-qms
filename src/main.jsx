import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// Globally patch fetch to always include credentials for secure session management
const originalFetch = window.fetch;
window.fetch = function () {
  let [resource, config] = arguments;
  if (!config) config = {};
  config.credentials = 'include';
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

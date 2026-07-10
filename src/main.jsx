import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// Globally patch fetch:
// 1. Always include credentials (secure session cookie)
// 2. Auto-redirect to login on 401 (session expired)
const originalFetch = window.fetch;
window.fetch = function () {
  let [resource, config] = arguments;
  if (!config) config = {};
  config.credentials = 'include';
  return originalFetch(resource, config).then(response => {
    // If the server says session is expired/invalid, kick user to login
    if (response.status === 401) {
      const url = typeof resource === 'string' ? resource : resource.url;
      // Don't intercept the login or dev-login endpoints themselves
      if (!url.includes('login.php') && !url.includes('dev-login')) {
        sessionStorage.removeItem('qmsUser');
        sessionStorage.removeItem('qmsRole');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/qms_react/') {
          window.location.replace('/qms_react/');
        }
      }
    }
    return response;
  });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

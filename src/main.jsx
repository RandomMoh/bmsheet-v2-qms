import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

const originalFetch = window.fetch;
window.fetch = function () {
  let [resource, config] = arguments;
  if (!config) config = {};
  config.credentials = 'include';
  return originalFetch(resource, config).then(response => {
    if (response.status === 401) {
      const url = typeof resource === 'string' ? resource : resource.url;
      if (!url.includes('login.php') && !url.includes('dev-login')) {
        sessionStorage.removeItem('qmsUser');
        sessionStorage.removeItem('qmsRole');
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

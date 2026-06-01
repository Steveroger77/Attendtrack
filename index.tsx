
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign sandbox WebSocket or HMR connection failures
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason);
    if (msg && (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('HMR')
    )) {
      event.preventDefault();
      console.warn('Suppressed benign HMR/WebSocket rejection:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (msg && (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('HMR')
    )) {
      event.preventDefault();
      console.warn('Suppressed benign HMR/WebSocket error:', msg);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Enregistre le service worker dès l'ouverture — c'est ce qui permet à l'app
// de rester utilisable même sans connexion internet, pas seulement quand les
// notifications sont activées.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* pas grave, l'app fonctionne quand même en ligne */ });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './state'
import { App } from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)

// Installation sur l'ecran d'accueil, Android comme iPhone.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // pas de service worker en developpement, ce n'est pas bloquant
    })
  })
}

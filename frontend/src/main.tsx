import React from 'react'
import ReactDOM from 'react-dom/client'

// Global PWA Event Capture - Run this as early as possible
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPWAEvent = e;
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { TourProvider } from './components/common/GuidedTour'
import './i18n/config' // Initialize i18n
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import posthog from 'posthog-js'

if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_KEY !== 'phc_placeholder_key_replace_me') {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    persistence: 'localStorage',
    autocapture: true,
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TourProvider>
        <App />
      </TourProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content downloaded! Refresh page to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

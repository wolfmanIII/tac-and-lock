import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useBattleStore }   from './store/battleStore.js'
import { useUIStore }       from './store/uiStore.js'
import { useProfilesStore } from './store/profilesStore.js'

// Expose stores for Playwright e2e tests (stripped in production by tree-shaking guard)
if (import.meta.env.MODE !== 'production') {
  window.__ZUSTAND_BATTLE_STORE__   = useBattleStore
  window.__ZUSTAND_UI_STORE__       = useUIStore
  window.__ZUSTAND_PROFILES_STORE__ = useProfilesStore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

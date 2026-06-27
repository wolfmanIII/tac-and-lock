import './App.css'
import { useState } from 'react'
import { useUIStore } from './store/uiStore.js'
import { useAutosave } from './hooks/useAutosave.js'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import { Modal } from './components/modals/Modal.jsx'
import LegalFooter from './components/ui/LegalFooter.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import BattleView from './components/battle/BattleView.jsx'
import { HelpScreen } from './components/help/HelpScreen.jsx'
import { HUD }          from './components/ui/HUD.jsx'
import { PhaseTracker } from './components/ui/PhaseTracker.jsx'
import { BattleLog }    from './components/ui/BattleLog.jsx'
import { ContextMenu }  from './components/ui/ContextMenu.jsx'

import { InitiativeModal }     from './components/modals/InitiativeModal.jsx'
import { ManoeuvreModal }      from './components/modals/ManoeuvreModal.jsx'
import { AttackModal }         from './components/modals/AttackModal.jsx'
import { CriticalHitModal }    from './components/modals/CriticalHitModal.jsx'
import { ActionModal }         from './components/modals/ActionModal.jsx'
import { MissileLaunchModal }  from './components/modals/MissileLaunchModal.jsx'
import { MissileImpactModal }  from './components/modals/MissileImpactModal.jsx'
import { ShipDetailModal }     from './components/modals/ShipDetailModal.jsx'
import { ShipProfileModal }    from './components/modals/ShipProfileModal.jsx'
import { CrewAssignmentModal } from './components/modals/CrewAssignmentModal.jsx'
import { AddShipModal }        from './components/modals/AddShipModal.jsx'

/** Maps modal ID → component. Extend here without touching render logic. */
const MODAL_MAP = {
  'initiative':       InitiativeModal,
  'manoeuvre':        ManoeuvreModal,
  'attack':           AttackModal,
  'critical-hit':     CriticalHitModal,
  'action':           ActionModal,
  'missile-launch':   MissileLaunchModal,
  'missile-impact':   MissileImpactModal,
  'ship-detail':      ShipDetailModal,
  'ship-profile':     ShipProfileModal,
  'crew-assignment':  CrewAssignmentModal,
  'add-ship':         AddShipModal,
}

const WIDE_MODALS = new Set(['ship-profile', 'ship-detail', 'crew-assignment', 'action', 'add-ship'])

function ModalLayer() {
  const activeModal  = useUIStore((s) => s.activeModal)
  const modalPayload = useUIStore((s) => s.modalPayload)
  const closeModal   = useUIStore((s) => s.closeModal)

  if (!activeModal) return null
  const ModalComponent = MODAL_MAP[activeModal]
  if (!ModalComponent) return null

  return (
    <Modal onClose={closeModal} width={WIDE_MODALS.has(activeModal) ? 'max-w-2xl' : 'max-w-lg'} variant="dialog">
      <ModalComponent payload={modalPayload} onClose={closeModal} />
    </Modal>
  )
}

function BattleTopRight() {
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <>
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => setHelpOpen(true)}
          aria-label="Open field manual"
          className="bg-slate-900/80 border border-slate-700 rounded backdrop-blur-sm px-2.5 py-1 font-mono text-xs font-bold text-(--neon-cyan) hover:text-sky-200 hover:border-slate-500 transition-colors"
        >
          ?
        </button>
      </div>
      {helpOpen && (
        <Modal onClose={() => setHelpOpen(false)} variant="dialog" width="max-w-5xl" title="FIELD MANUAL">
          <div className="h-[75vh]">
            <HelpScreen onBack={() => setHelpOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  )
}

function AppScreens() {
  const screen = useUIStore((s) => s.screen)
  useAutosave()

  if (screen === 'dashboard') {
    return (
      <>
        <div className="h-[calc(100%-1.75rem)]">
          <Dashboard />
        </div>
        <LegalFooter />
      </>
    )
  }

  if (screen === 'help') {
    return (
      <>
        <div className="h-[calc(100%-1.75rem)]">
          <HelpScreen />
        </div>
        <LegalFooter />
      </>
    )
  }

  return (
    <>
      <div className="relative w-full h-[calc(100%-1.75rem)] overflow-hidden bg-slate-950">
        <BattleView />
        <HUD />
        <PhaseTracker />
        <BattleLog />
        <ContextMenu />
        <BattleTopRight />
      </div>
      <LegalFooter />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppScreens />
      <ModalLayer />
    </ErrorBoundary>
  )
}

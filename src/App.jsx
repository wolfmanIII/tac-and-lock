import './App.css'
import { useUIStore } from './store/uiStore.js'
import { useAutosave } from './hooks/useAutosave.js'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import { Modal } from './components/modals/Modal.jsx'
import LegalFooter from './components/ui/LegalFooter.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import BattleView from './components/battle/BattleView.jsx'

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
}

const WIDE_MODALS = new Set(['ship-profile', 'ship-detail', 'crew-assignment', 'action'])

function ModalLayer() {
  const activeModal  = useUIStore((s) => s.activeModal)
  const modalPayload = useUIStore((s) => s.modalPayload)
  const closeModal   = useUIStore((s) => s.closeModal)

  if (!activeModal) return null
  const ModalComponent = MODAL_MAP[activeModal]
  if (!ModalComponent) return null

  return (
    <Modal onClose={closeModal} wide={WIDE_MODALS.has(activeModal)}>
      <ModalComponent payload={modalPayload} onClose={closeModal} />
    </Modal>
  )
}

function AppScreens() {
  const screen = useUIStore((s) => s.screen)
  useAutosave()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {screen === 'dashboard' ? <Dashboard /> : <BattleView />}
      <LegalFooter />
      <ModalLayer />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppScreens />
    </ErrorBoundary>
  )
}

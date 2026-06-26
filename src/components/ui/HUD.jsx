import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'

const PHASE_LABEL = {
  setup:      'SETUP',
  manoeuvre:  'MANOEUVRE',
  attack:     'ATTACK',
  actions:    'ACTIONS',
}

const PHASE_COLOR = {
  setup:     'text-slate-400',
  manoeuvre: 'text-purple-300',
  attack:    'text-red-400',
  actions:   'text-emerald-400',
}

export function HUD() {
  const { round, phase, ships, advancePhase } = useBattleStore()
  const { gotoScreen, openModal } = useUIStore()

  function handleExit() {
    if (confirm('End battle and return to dashboard? Unsaved progress will be lost.')) {
      gotoScreen('dashboard')
    }
  }

  return (
    <header className="shrink-0 flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-6">
        <img src="/logo.png" alt="TAC & LOCK" className="h-7 w-auto opacity-90" />
        <span className="font-display text-sky-300 text-sm tracking-widest">
          ROUND <span className="text-white text-base">{round}</span>
        </span>
        <span className={`font-display text-sm tracking-widest ${PHASE_COLOR[phase] ?? 'text-slate-300'}`}>
          {PHASE_LABEL[phase] ?? phase.toUpperCase()} PHASE
        </span>
        <span className="text-slate-500 text-xs font-mono">{ships.length} ship{ships.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 text-xs font-display tracking-widest text-sky-300 border border-sky-800 hover:bg-sky-900/30 transition-colors rounded"
          onClick={() => openModal('initiative')}
        >
          INITIATIVE
        </button>
        <button
          className="px-3 py-1 text-xs font-display tracking-widest text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors rounded"
          onClick={advancePhase}
        >
          NEXT PHASE ▶
        </button>
        <button
          className="px-3 py-1 text-xs font-display tracking-widest text-red-400 border border-red-900 hover:bg-red-900/20 transition-colors rounded ml-2"
          onClick={handleExit}
        >
          EXIT
        </button>
      </div>
    </header>
  )
}

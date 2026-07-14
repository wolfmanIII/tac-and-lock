/**
 * HUD — floating top-left overlay.
 * Glassmorphism panels: round/phase badge, action buttons, exit confirm.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { Tooltip } from './Tooltip.jsx'
import { Modal } from '../modals/Modal.jsx'

// No "Manoeuvre/Attack/Actions Step" in 2300AD B3 (see battleStore.js) — a ship's
// turn in 'combat' is open-ended, gated by per-role actionsRemaining instead.
const PHASE_LABEL = {
  setup:      'SETUP',
  initiative: 'INITIATIVE',
  combat:     'COMBAT',
}

const PHASE_COLOR = {
  setup:      'text-gunmetal-300',
  initiative: 'text-amber-400',
  combat:     'text-bronze-400',
}

/** Short label for each crew role's action budget readout. */
const ROLE_ABBR = {
  pilot: 'Pilot', captain: 'Capt', engineer: 'Eng', sensor_operator: 'Sensor',
  gunner_turret: 'Gun', gunner_bay: 'Bay', marine: 'Marine', remote_pilot: 'RC',
}

export function HUD() {
  const round               = useBattleStore((s) => s.round)
  const phase               = useBattleStore((s) => s.phase)
  const ships               = useBattleStore((s) => s.ships)
  const initiativeOrder     = useBattleStore((s) => s.initiativeOrder)
  const currentActorIndex   = useBattleStore((s) => s.currentActorIndex)
  const drones              = useBattleStore((s) => s.drones)
  const undoStack           = useBattleStore((s) => s.undoStack)
  const redoStack           = useBattleStore((s) => s.redoStack)
  const advancePhase        = useBattleStore((s) => s.advancePhase)
  const advanceActor        = useBattleStore((s) => s.advanceActor)
  const startNextRound      = useBattleStore((s) => s.startNextRound)
  const undo                = useBattleStore((s) => s.undo)
  const redo                = useBattleStore((s) => s.redo)
  const exportBattleState   = useBattleStore((s) => s.exportBattleState)
  const openModal           = useUIStore((s) => s.openModal)
  const gotoScreen          = useUIStore((s) => s.gotoScreen)

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  const [showExit, setShowExit]   = useState(false)
  const [blockMsg, setBlockMsg]   = useState(null)

  const allActorsGone = initiativeOrder.length === 0 || currentActorIndex >= initiativeOrder.length

  // Drones/missiles that have closed to engagement range and still need a GM resolution // 2300AD B3 p.61
  const dronesInRange = useMemo(
    () => drones.filter((d) => !d.destroyed && !d.detonated && (d.currentBand === 'Close' || d.currentBand === 'Adjacent')),
    [drones],
  )

  // In 'combat' there is no next stage to walk to (advancePhase only drives
  // setup → initiative → combat) — round advancement is NEXT ROUND (startNextRound),
  // rendered inline in the ACTING NOW block below, gated by the same drone check.
  const canAdvance = useMemo(() => {
    if (dronesInRange.length > 0) return false
    if (phase === 'setup')      return ships.length > 0
    if (phase === 'initiative') return initiativeOrder.length > 0
    return false
  }, [phase, ships, initiativeOrder, dronesInRange])

  const canAdvanceRound = dronesInRange.length === 0

  useEffect(() => { if (canAdvance) setBlockMsg(null) }, [canAdvance])

  const handleAdvance = useCallback(() => {
    if (!canAdvance) {
      if (dronesInRange.length > 0) {
        setBlockMsg(`Resolve ${dronesInRange.length} drone(s) in engagement range first.`)
      } else if (phase === 'setup') {
        setBlockMsg('Add at least one ship first.')
      } else if (phase === 'initiative') {
        setBlockMsg('Roll initiative before advancing.')
      }
      return
    }
    setBlockMsg(null)
    advancePhase()
  }, [canAdvance, advancePhase, phase, dronesInRange])

  const handleNextRound = useCallback(() => {
    if (!canAdvanceRound) {
      setBlockMsg(`Resolve ${dronesInRange.length} drone(s) in engagement range first.`)
      return
    }
    setBlockMsg(null)
    startNextRound()
  }, [canAdvanceRound, startNextRound, dronesInRange])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo) undo() }
      if ((e.ctrlKey && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey)) { e.preventDefault(); if (canRedo) redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canUndo, canRedo, undo, redo])

  const currentActor = ships.find((s) => s.id === initiativeOrder[currentActorIndex])
  const phaseLabel   = PHASE_LABEL[phase] ?? phase.toUpperCase()
  const phaseColor   = PHASE_COLOR[phase] ?? 'text-gunmetal-300'

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start pointer-events-none max-h-[calc(100vh-3.5rem)] overflow-y-auto">

      {/* Round + phase badge */}
      <div className="flex items-center gap-2 bg-gunmetal-900/80 border border-gunmetal-700 rounded px-3 py-1.5 backdrop-blur-sm pointer-events-auto">
        <img src="/logo.png" alt="" className="w-5 h-5 shrink-0" />
        <span className="text-gunmetal-600 text-xs">│</span>
        <span className="text-gunmetal-400 text-xs font-display tracking-widest">ROUND</span>
        <span className="text-bronze-400 font-mono font-bold text-lg leading-none">{round}</span>
        <span className="text-gunmetal-600 text-xs">│</span>
        <span className={`font-display text-xs tracking-widest ${phaseColor}`}>{phaseLabel}</span>
      </div>

      {/* Roll initiative CTA — shown during initiative phase */}
      {phase === 'initiative' && (
        <button
          onClick={() => openModal('initiative')}
          className="pointer-events-auto bg-amber-500/10 border border-amber-500/50 hover:bg-amber-500/20 text-amber-400 font-display text-xs tracking-widest rounded px-3 py-1.5 backdrop-blur-sm transition-colors"
        >
          🎲 ROLL INITIATIVE →
        </button>
      )}

      {/* Current actor badge + per-role action budget + END SHIP'S TURN — 'combat' stage */}
      {phase === 'combat' && initiativeOrder.length > 0 && (
        !allActorsGone ? (
          <div className="flex flex-col gap-1">
            <div className="bg-gunmetal-900/80 border border-gunmetal-700 rounded px-3 py-1.5 backdrop-blur-sm">
              <p className="text-[10px] font-display text-gunmetal-500 tracking-widest">ACTING NOW</p>
              <p className="font-mono text-sm text-bronze-400 font-bold leading-tight truncate max-w-44">
                {currentActor?.profile?.name ?? '—'}
              </p>
              <p className="text-[10px] font-mono text-gunmetal-500">
                {currentActorIndex + 1} / {initiativeOrder.length}
              </p>
              {currentActor && (
                <p className="text-[9px] font-mono text-gunmetal-400 mt-1 leading-snug">
                  {Object.entries(currentActor.actionsRemaining ?? {})
                    .map(([role, n]) => `${ROLE_ABBR[role] ?? role} ${n}`)
                    .join(' · ')}
                </p>
              )}
            </div>
            <button
              onClick={advanceActor}
              className="pointer-events-auto bg-gunmetal-800/80 border border-gunmetal-600 hover:border-bronze-400/60 text-gunmetal-300 hover:text-bronze-400 font-mono text-xs tracking-widest rounded px-3 py-1.5 backdrop-blur-sm transition-colors"
            >
              END SHIP'S TURN ⟶
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="bg-gunmetal-900/80 border border-gunmetal-700 rounded px-3 py-1 backdrop-blur-sm">
              <p className="text-[10px] font-display text-emerald-400 tracking-widest">ALL SHIPS DONE</p>
            </div>
            <button
              onClick={handleNextRound}
              className={`pointer-events-auto border rounded px-3 py-1.5 backdrop-blur-sm transition-colors font-mono text-xs tracking-widest ${
                canAdvanceRound
                  ? 'bg-gunmetal-800/80 border-gunmetal-600 hover:border-bronze-400/60 text-gunmetal-300 hover:text-bronze-400'
                  : 'bg-gunmetal-800/80 border-gunmetal-700 text-gunmetal-500 cursor-not-allowed'
              }`}
            >
              NEXT ROUND ⟶
            </button>
          </div>
        )
      )}

      {/* Drones/missiles in engagement range awaiting resolution */}
      {dronesInRange.length > 0 && (
        <p className="font-mono text-xs text-amber-400 animate-pulse pointer-events-none pl-1">
          ⚡ {dronesInRange.length} drone{dronesInRange.length !== 1 ? 's' : ''} in range, unresolved
        </p>
      )}

      {/* NEXT PHASE — only drives setup → initiative → combat; once in 'combat', round
          advancement is the NEXT ROUND button in the ACTING NOW block above. */}
      {phase !== 'combat' && (
        <button
          onClick={handleAdvance}
          className={`pointer-events-auto bg-gunmetal-800/80 border rounded px-3 py-1.5 backdrop-blur-sm transition-colors font-mono text-xs tracking-widest ${
            canAdvance
              ? 'border-gunmetal-600 hover:border-bronze-400/60 text-gunmetal-300 hover:text-bronze-400'
              : 'border-gunmetal-700 text-gunmetal-500 cursor-not-allowed'
          }`}
        >
          NEXT PHASE ⟶
        </button>
      )}
      {blockMsg && (
        <p className="font-mono text-xs text-amber-400/90 pl-1 pointer-events-none">🚨 {blockMsg}</p>
      )}

      {/* Utilities */}
      <div className="pointer-events-auto flex gap-1 mt-0.5">
        {canUndo && (
          <Tooltip label="Undo (Ctrl+Z)" position="bottom">
            <button onClick={undo} className="bg-gunmetal-800/80 border border-gunmetal-700 font-mono text-sm rounded px-2 py-1 backdrop-blur-sm transition-colors text-gunmetal-400 hover:text-gunmetal-300 hover:border-gunmetal-500">↩️</button>
          </Tooltip>
        )}
        {canRedo && (
          <Tooltip label="Redo (Ctrl+Y)" position="bottom">
            <button onClick={redo} className="bg-gunmetal-800/80 border border-gunmetal-700 font-mono text-sm rounded px-2 py-1 backdrop-blur-sm transition-colors text-gunmetal-400 hover:text-gunmetal-300 hover:border-gunmetal-500">↪️</button>
          </Tooltip>
        )}
        <Tooltip label="Save session to file" position="bottom">
          <button onClick={exportBattleState} className="bg-gunmetal-800/80 border border-gunmetal-700 text-gunmetal-400 hover:text-gunmetal-300 hover:border-gunmetal-500 font-mono text-xs rounded px-2 py-1 backdrop-blur-sm transition-colors">
            💾 SAVE
          </button>
        </Tooltip>
        <Tooltip label="Return to lobby" position="bottom">
          <button onClick={() => setShowExit(true)} className="bg-gunmetal-800/80 border border-gunmetal-700 text-gunmetal-400 hover:text-gunmetal-300 hover:border-gunmetal-500 font-mono text-base rounded px-2 py-1 backdrop-blur-sm transition-colors">
            🏠
          </button>
        </Tooltip>
      </div>

      {showExit && (
        <Modal title="ABANDON SESSION" onClose={() => setShowExit(false)} width="max-w-sm" variant="dialog">
          <div className="p-4 space-y-4">
            <p className="font-mono text-sm text-gunmetal-300 leading-relaxed">Unsaved progress will be lost.</p>
            <p className="font-mono text-xs text-gunmetal-400">Save the session before leaving to resume later.</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowExit(false); gotoScreen('dashboard') }}
                className="flex-1 py-2 bg-red-900/30 border border-red-700/50 text-red-400 font-display text-xs tracking-widest rounded hover:bg-red-900/50 transition-colors"
              >
                EXIT WITHOUT SAVING
              </button>
              <button
                onClick={() => setShowExit(false)}
                className="flex-1 py-2 border border-gunmetal-600 text-gunmetal-300 font-display text-xs tracking-widest rounded hover:border-gunmetal-400 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

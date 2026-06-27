/**
 * HUD — floating top-left overlay.
 * Glassmorphism panels: round/phase badge, action buttons, exit confirm.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { Tooltip } from './Tooltip.jsx'
import { Modal } from '../modals/Modal.jsx'

const PHASE_LABEL = {
  setup:      'SETUP',
  initiative: 'INITIATIVE',
  manoeuvre:  'MANOEUVRE',
  attack:     'ATTACK',
  actions:    'ACTIONS',
}

const PHASE_COLOR = {
  setup:      'text-slate-300',
  initiative: 'text-amber-400',
  manoeuvre:  'text-(--neon-cyan)',
  attack:     'text-red-400',
  actions:    'text-emerald-400',
}

/** Phases where the initiative order drives per-ship turns. // 2300AD B3 p.53 */
const ACTOR_TURN_PHASES = new Set(['manoeuvre', 'attack', 'actions'])

export function HUD() {
  const round               = useBattleStore((s) => s.round)
  const phase               = useBattleStore((s) => s.phase)
  const ships               = useBattleStore((s) => s.ships)
  const initiativeOrder     = useBattleStore((s) => s.initiativeOrder)
  const currentActorIndex   = useBattleStore((s) => s.currentActorIndex)
  const pendingMissileImpacts = useBattleStore((s) => s.pendingMissileImpacts)
  const undoStack           = useBattleStore((s) => s.undoStack)
  const redoStack           = useBattleStore((s) => s.redoStack)
  const advancePhase        = useBattleStore((s) => s.advancePhase)
  const advanceActor        = useBattleStore((s) => s.advanceActor)
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

  const canAdvance = useMemo(() => {
    if (pendingMissileImpacts.length > 0) return false
    if (phase === 'setup')                return ships.length > 0
    if (phase === 'initiative')           return initiativeOrder.length > 0
    if (ACTOR_TURN_PHASES.has(phase))     return allActorsGone
    return true
  }, [phase, ships, initiativeOrder, pendingMissileImpacts, allActorsGone])

  useEffect(() => { if (canAdvance) setBlockMsg(null) }, [canAdvance])

  const handleAdvance = useCallback(() => {
    if (!canAdvance) {
      if (pendingMissileImpacts.length > 0) {
        setBlockMsg(`Resolve ${pendingMissileImpacts.length} pending impact${pendingMissileImpacts.length !== 1 ? 's' : ''} first.`)
      } else if (phase === 'setup') {
        setBlockMsg('Add at least one ship first.')
      } else if (phase === 'initiative') {
        setBlockMsg('Roll initiative before advancing.')
      } else if (ACTOR_TURN_PHASES.has(phase)) {
        setBlockMsg('All actors must act before advancing phase.')
      }
      return
    }
    setBlockMsg(null)
    advancePhase()
  }, [canAdvance, advancePhase, phase, pendingMissileImpacts, allActorsGone])

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
  const phaseColor   = PHASE_COLOR[phase] ?? 'text-slate-300'

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start pointer-events-none max-h-[calc(100vh-3.5rem)] overflow-y-auto">

      {/* Round + phase badge */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded px-3 py-1.5 backdrop-blur-sm pointer-events-auto">
        <img src="/logo.png" alt="" className="w-5 h-5 shrink-0" />
        <span className="text-slate-600 text-xs">│</span>
        <span className="text-slate-400 text-xs font-display tracking-widest">ROUND</span>
        <span className="text-(--neon-cyan) font-mono font-bold text-lg leading-none">{round}</span>
        <span className="text-slate-600 text-xs">│</span>
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

      {/* Current actor badge + NEXT ACTOR button — shown during actor-turn phases */}
      {ACTOR_TURN_PHASES.has(phase) && initiativeOrder.length > 0 && (
        !allActorsGone ? (
          <div className="flex flex-col gap-1">
            <div className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1.5 backdrop-blur-sm">
              <p className="text-[10px] font-display text-slate-500 tracking-widest">ACTING NOW</p>
              <p className="font-mono text-sm text-(--neon-cyan) font-bold leading-tight truncate max-w-44">
                {currentActor?.profile?.name ?? '—'}
              </p>
              <p className="text-[10px] font-mono text-slate-500">
                {currentActorIndex + 1} / {initiativeOrder.length}
              </p>
            </div>
            <button
              onClick={advanceActor}
              className="pointer-events-auto bg-slate-800/80 border border-slate-600 hover:border-(--neon-cyan)/60 text-slate-300 hover:text-(--neon-cyan) font-mono text-xs tracking-widest rounded px-3 py-1.5 backdrop-blur-sm transition-colors"
            >
              DONE — NEXT ACTOR ⟶
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-700 rounded px-3 py-1 backdrop-blur-sm">
            <p className="text-[10px] font-display text-emerald-400 tracking-widest">ALL ACTORS DONE</p>
          </div>
        )
      )}

      {/* Pending missile impacts */}
      {pendingMissileImpacts.length > 0 && (
        <p className="font-mono text-xs text-amber-400 animate-pulse pointer-events-none pl-1">
          ⚡ {pendingMissileImpacts.length} impact{pendingMissileImpacts.length !== 1 ? 's' : ''} unresolved
        </p>
      )}

      {/* NEXT PHASE */}
      <button
        onClick={handleAdvance}
        className={`pointer-events-auto bg-slate-800/80 border rounded px-3 py-1.5 backdrop-blur-sm transition-colors font-mono text-xs tracking-widest ${
          canAdvance
            ? 'border-slate-600 hover:border-(--neon-cyan)/60 text-slate-300 hover:text-(--neon-cyan)'
            : 'border-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        NEXT PHASE ⟶
      </button>
      {blockMsg && (
        <p className="font-mono text-xs text-amber-400/90 pl-1 pointer-events-none">🚨 {blockMsg}</p>
      )}

      {/* Utilities */}
      <div className="pointer-events-auto flex gap-1 mt-0.5">
        {canUndo && (
          <Tooltip label="Undo (Ctrl+Z)" position="bottom">
            <button onClick={undo} className="bg-slate-800/80 border border-slate-700 font-mono text-sm rounded px-2 py-1 backdrop-blur-sm transition-colors text-slate-400 hover:text-slate-300 hover:border-slate-500">↩️</button>
          </Tooltip>
        )}
        {canRedo && (
          <Tooltip label="Redo (Ctrl+Y)" position="bottom">
            <button onClick={redo} className="bg-slate-800/80 border border-slate-700 font-mono text-sm rounded px-2 py-1 backdrop-blur-sm transition-colors text-slate-400 hover:text-slate-300 hover:border-slate-500">↪️</button>
          </Tooltip>
        )}
        <Tooltip label="Save session to file" position="bottom">
          <button onClick={exportBattleState} className="bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-500 font-mono text-xs rounded px-2 py-1 backdrop-blur-sm transition-colors">
            💾 SAVE
          </button>
        </Tooltip>
        <Tooltip label="Return to lobby" position="bottom">
          <button onClick={() => setShowExit(true)} className="bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-500 font-mono text-base rounded px-2 py-1 backdrop-blur-sm transition-colors">
            🏠
          </button>
        </Tooltip>
      </div>

      {showExit && (
        <Modal title="ABANDON SESSION" onClose={() => setShowExit(false)} width="max-w-sm" variant="dialog">
          <div className="p-4 space-y-4">
            <p className="font-mono text-sm text-slate-300 leading-relaxed">Unsaved progress will be lost.</p>
            <p className="font-mono text-xs text-slate-400">Save the session before leaving to resume later.</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowExit(false); gotoScreen('dashboard') }}
                className="flex-1 py-2 bg-red-900/30 border border-red-700/50 text-red-400 font-display text-xs tracking-widest rounded hover:bg-red-900/50 transition-colors"
              >
                EXIT WITHOUT SAVING
              </button>
              <button
                onClick={() => setShowExit(false)}
                className="flex-1 py-2 border border-slate-600 text-slate-300 font-display text-xs tracking-widest rounded hover:border-slate-400 transition-colors"
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

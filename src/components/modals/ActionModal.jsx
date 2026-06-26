import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { CREW_ACTIONS } from '../../data/crewActions.js'
import { roll2D6, formatCheckResult } from '../../utils/dice.js'
import { DiceInput } from '../forms/DiceInput.jsx'

const ALL_ACTIONS = Object.values(CREW_ACTIONS).flat()

export function ActionModal({ payload, onClose }) {
  const { shipId } = payload ?? {}
  const ships            = useBattleStore((s) => s.ships)
  const reduceCritical   = useBattleStore((s) => s.reduceCriticalSeverity)
  const repairHull       = useBattleStore((s) => s.repairHull)
  const applySensorLock  = useBattleStore((s) => s.applySensorLock)
  const applyEW          = useBattleStore((s) => s.applyEW)
  const spendEvasion     = useBattleStore((s) => s.spendEvasion)

  const ship    = ships.find((s) => s.id === shipId)
  const targets = ships.filter((s) => s.id !== shipId && !s.isDestroyed)

  const [selectedAction, setSelectedAction] = useState(null)
  const [targetId,       setTargetId]       = useState(targets[0]?.id ?? '')
  const [skillLevel,     setSkillLevel]     = useState(1)
  const [rollResult,     setRollResult]     = useState(null)
  const [manualMode,     setManualMode]     = useState(false)
  const [critSystem,     setCritSystem]     = useState('')

  const action = ALL_ACTIONS.find((a) => a.id === selectedAction)
  const target = ships.find((s) => s.id === targetId)

  function doRoll() {
    if (!action) return
    const dice  = roll2D6()
    const total = dice[0] + dice[1] + skillLevel
    const result = formatCheckResult(total, action.difficulty)
    setRollResult({ ...result, dice })
  }

  function onManual({ total }) {
    if (!action) return
    const result = formatCheckResult(total, action.difficulty)
    setRollResult({ ...result, dice: [] })
  }

  function applyAction() {
    if (!action || !rollResult?.success) return
    const effect = rollResult.effect

    switch (action.id) {
      case 'sensor_lock':
        if (target) applySensorLock(shipId, target.id, effect)
        break
      case 'electronic_warfare':
        if (target) applyEW(shipId, target.id, effect)
        break
      case 'emergency_repair':
        if (critSystem) reduceCritical(shipId, critSystem)
        break
      case 'damage_control':
      case 'overload_stutterwarp':
        // handled by GM narration; overload TAC speed bonus tracked via reduceTacSpeed/addShip
        break
      case 'evasive_action':
        spendEvasion(shipId, 1)
        break
      default:
        break
    }
    onClose()
  }

  // Group actions by role for display
  const groupedActions = Object.entries(CREW_ACTIONS).map(([role, actions]) => ({ role, actions }))

  return (
    <div className="p-6 space-y-4" style={{ minWidth: 480 }}>
      <div className="flex items-center justify-between">
        <p className="font-display text-emerald-400 text-sm tracking-widest">CREW ACTION</p>
        <p className="text-xs font-mono text-slate-400">{ship?.profile?.name}</p>
      </div>

      {/* Action picker */}
      <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
        {groupedActions.map(({ role, actions }) => (
          <div key={role}>
            <p className="text-[10px] font-display text-slate-600 tracking-widest mb-1">{role.toUpperCase()}</p>
            {actions.map((a) => (
              <button
                key={a.id}
                className={`w-full text-left px-3 py-2 rounded border mb-1 transition-colors
                  ${selectedAction === a.id
                    ? 'border-emerald-600 bg-emerald-900/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-800/30 hover:border-slate-600 text-slate-300'}`}
                onClick={() => setSelectedAction(a.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">{a.label}</span>
                  {a.reaction && <span className="text-[10px] text-amber-400 border border-amber-800 rounded px-1">REACTION</span>}
                </div>
                {selectedAction === a.id && (
                  <p className="text-[10px] text-slate-400 mt-1">{a.description}</p>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {action && (
        <div className="space-y-3 border-t border-slate-800 pt-3">
          {action.requiresTarget && (
            <div>
              <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">TARGET</p>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
                {targets.map((t) => <option key={t.id} value={t.id}>{t.profile?.name}</option>)}
              </select>
            </div>
          )}

          {action.id === 'emergency_repair' && (
            <div>
              <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">SYSTEM TO REPAIR</p>
              <select value={critSystem} onChange={(e) => setCritSystem(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
                <option value="">— select system —</option>
                {Object.entries(ship?.criticalTracks ?? {}).filter(([, sev]) => sev > 0).map(([sys, sev]) => (
                  <option key={sys} value={sys}>{sys} (sev {sev})</option>
                ))}
              </select>
            </div>
          )}

          {action.difficulty > 0 && (
            <>
              <div>
                <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">
                  SKILL LEVEL — {action.skill} ({action.difficultyLabel})
                </p>
                <div className="flex gap-2">
                  {[0,1,2,3,4].map((n) => (
                    <button key={n}
                      className={`flex-1 py-1.5 text-xs font-mono border rounded ${skillLevel === n ? 'border-emerald-500 text-emerald-300 bg-emerald-900/30' : 'border-slate-700 text-slate-400'}`}
                      onClick={() => setSkillLevel(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-xs font-display tracking-widest text-emerald-400 border border-emerald-800 hover:bg-emerald-900/20 rounded" onClick={doRoll}>ROLL DICE</button>
                <button className="text-xs font-mono text-slate-400 underline" onClick={() => setManualMode((m) => !m)}>manual</button>
              </div>
              {manualMode && <DiceInput dm={skillLevel} onChange={onManual} />}
            </>
          )}

          {rollResult && (
            <div className={`rounded p-3 border ${rollResult.success ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-900'}`}>
              <p className="font-display text-sm tracking-widest">
                {rollResult.success
                  ? <span className="text-emerald-400">SUCCESS — Effect {rollResult.effect}</span>
                  : <span className="text-red-400">FAILURE — Effect {rollResult.effect}</span>}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>CANCEL</button>
        {action && (action.difficulty === 0 || rollResult?.success) && (
          <button className="flex-1 py-2 text-xs font-display tracking-widest text-emerald-400 border border-emerald-800 hover:bg-emerald-900/20 rounded" onClick={applyAction}>
            APPLY ACTION
          </button>
        )}
      </div>
    </div>
  )
}

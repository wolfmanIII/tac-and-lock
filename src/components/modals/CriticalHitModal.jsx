import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { CRITICAL_LOCATION_TABLE, CRITICAL_HIT_EFFECTS, CRITICAL_HIT_SYSTEM_LABELS } from '../../data/criticalHits.js'
import { roll2D6 } from '../../utils/dice.js'

export function CriticalHitModal({ payload, onClose }) {
  const { shipId } = payload ?? {}
  const ships       = useBattleStore((s) => s.ships)
  const addCritical = useBattleStore((s) => s.addCriticalHit)
  const ship        = ships.find((s) => s.id === shipId)

  const [locationRoll, setLocationRoll] = useState(null)
  const [manualRoll,   setManualRoll]   = useState('')
  const [applied,      setApplied]      = useState(false)

  const roll = locationRoll ?? (manualRoll ? parseInt(manualRoll, 10) : null)
  const system = roll !== null ? CRITICAL_LOCATION_TABLE[Math.min(12, Math.max(2, roll))] : null
  const currentSev = ship?.criticalTracks?.[system] ?? 0
  const newSev = Math.min(6, currentSev + 1)
  const effect = system ? CRITICAL_HIT_EFFECTS[system]?.[newSev] : null

  function doRoll() {
    const dice = roll2D6()
    setLocationRoll(dice[0] + dice[1])
    setManualRoll('')
  }

  function apply() {
    if (!system || applied) return
    addCritical(shipId, system)
    setApplied(true)
  }

  return (
    <div className="p-6 space-y-4">
      <p className="font-display text-amber-400 text-sm tracking-widest">CRITICAL HIT</p>
      <p className="text-sm font-mono text-slate-300">{ship?.profile?.name ?? shipId}</p>
      <p className="text-[10px] font-mono text-slate-500">Roll 2D6 on location table // Trav2022 CRB p.168</p>

      {/* Location roll */}
      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded"
          onClick={doRoll}
        >
          ROLL LOCATION
        </button>
        <input
          type="number" min={2} max={12} value={manualRoll}
          onChange={(e) => { setManualRoll(e.target.value); setLocationRoll(null) }}
          placeholder="or type"
          className="w-20 text-center bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-200 font-mono text-sm focus:border-sky-400 outline-none"
        />
      </div>

      {/* Location table (compact reference) */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 bg-slate-800/50 rounded p-3 text-[10px] font-mono">
        {Object.entries(CRITICAL_LOCATION_TABLE).map(([d, sys]) => (
          <div key={d} className={`flex gap-2 ${sys === system ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
            <span className="text-slate-600">{d}:</span>
            <span>{CRITICAL_HIT_SYSTEM_LABELS[sys] ?? sys}</span>
          </div>
        ))}
      </div>

      {/* Result */}
      {system && (
        <div className="bg-amber-950/40 border border-amber-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-display text-amber-300 text-sm">{CRITICAL_HIT_SYSTEM_LABELS[system] ?? system}</p>
            <span className="text-xs font-mono text-slate-400">
              {currentSev} → <span className="text-amber-400">{newSev}</span>
            </span>
          </div>
          {effect && <p className="text-xs font-mono text-slate-200">{effect.label}</p>}
          {effect?.mechanics?.map((m, i) => (
            <p key={i} className="text-[10px] font-mono text-slate-400">
              ⟩ {m.type}{m.value !== undefined ? `: ${m.value}` : ''}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>
          {applied ? 'CLOSE' : 'SKIP'}
        </button>
        {system && !applied && (
          <button className="flex-1 py-2 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded" onClick={apply}>
            APPLY CRITICAL
          </button>
        )}
      </div>
    </div>
  )
}

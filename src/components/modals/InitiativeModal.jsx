import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { rollInitiative } from '../../utils/combat.js'
import { roll2D6 } from '../../utils/dice.js'

export function InitiativeModal({ onClose }) {
  const ships          = useBattleStore((s) => s.ships)
  const setInitOrder   = useBattleStore((s) => s.setInitiativeOrder)

  const [results, setResults] = useState(() =>
    ships.map((s) => ({ shipId: s.id, name: s.profile?.name ?? s.id, total: 0, locked: false }))
  )

  function rollAll() {
    setResults((prev) => prev.map((r) => {
      if (r.locked) return r
      const ship    = ships.find((s) => s.id === r.shipId)
      const pilot   = ship?.crewAssignments?.pilot ? 1 : 0 // simplified: use 1 if pilot assigned
      const tacSpeed = ship?.currentTacSpeed ?? 1
      const roll    = rollInitiative(tacSpeed, pilot)
      return { ...r, total: roll.total, dice: roll.dice, breakdown: roll }
    }))
  }

  function rollSingle(shipId) {
    setResults((prev) => prev.map((r) => {
      if (r.shipId !== shipId) return r
      const ship    = ships.find((s) => s.id === shipId)
      const pilot   = 1
      const tacSpeed = ship?.currentTacSpeed ?? 1
      const roll    = rollInitiative(tacSpeed, pilot)
      return { ...r, total: roll.total, dice: roll.dice, breakdown: roll }
    }))
  }

  function setManual(shipId, val) {
    const n = parseInt(val, 10)
    if (!isNaN(n)) setResults((prev) => prev.map((r) => r.shipId === shipId ? { ...r, total: n } : r))
  }

  function addTacticsBonus(shipId, bonus) {
    setResults((prev) => prev.map((r) => r.shipId === shipId ? { ...r, total: r.total + bonus } : r))
  }

  function confirm() {
    const ordered = [...results].sort((a, b) => b.total - a.total).map((r) => r.shipId)
    setInitOrder(ordered)
    onClose()
  }

  const sorted = [...results].sort((a, b) => b.total - a.total)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sky-300 text-sm tracking-widest">INITIATIVE ROLL</p>
        <button
          className="px-4 py-1.5 text-xs font-display tracking-widest text-slate-300 border border-slate-600 hover:bg-slate-800 rounded"
          onClick={rollAll}
        >
          ROLL ALL
        </button>
      </div>
      <p className="text-[10px] font-mono text-slate-500">2D6 + Pilot skill + TAC Speed // Trav2022 CRB p.161</p>

      <div className="space-y-2">
        {sorted.map((r, idx) => {
          const ship = ships.find((s) => s.id === r.shipId)
          return (
            <div key={r.shipId} className="flex items-center gap-3 bg-slate-800/50 rounded px-3 py-2">
              <span className="text-slate-500 text-xs font-mono w-4">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-slate-200 truncate">{r.name}</p>
                {r.breakdown && (
                  <p className="text-[10px] font-mono text-slate-500">
                    [{r.breakdown.dice.join('+')}] +pilot{r.breakdown.pilotSkill} +spd{r.breakdown.tacSpeed}
                    {r.breakdown.charDm !== 0 ? ` +dex${r.breakdown.charDm}` : ''}
                  </p>
                )}
              </div>
              <input
                type="number"
                value={r.total}
                onChange={(e) => setManual(r.shipId, e.target.value)}
                className="w-14 text-center bg-slate-800 border border-slate-600 rounded px-1 py-1 text-sky-300 font-mono text-sm focus:border-sky-400 outline-none"
              />
              <button
                className="text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-700 rounded px-2 py-1"
                onClick={() => rollSingle(r.shipId)}
              >
                🎲
              </button>
              <button
                className="text-xs font-mono text-emerald-500 hover:text-emerald-300 border border-emerald-900 rounded px-2 py-1"
                title="Add +1 Tactics bonus (Captain check success)"
                onClick={() => addTacticsBonus(r.shipId, 1)}
              >
                +TAC
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
          onClick={onClose}
        >
          CANCEL
        </button>
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-sky-300 border border-sky-700 hover:bg-sky-900/30 rounded"
          onClick={confirm}
        >
          CONFIRM ORDER
        </button>
      </div>
    </div>
  )
}

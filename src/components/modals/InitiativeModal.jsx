/**
 * InitiativeModal — roll initiative per 2300AD B3 p.54.
 * Opposed Tactics(naval) check (INT) by the Captain.
 * Formula: 2D6 + Tactics(naval) + INT DM
 */

import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { rollInitiative } from '../../utils/combat.js'
import { getAssignedSkill, getAssignedCharacteristic } from '../../utils/crew.js'

export function InitiativeModal({ onClose }) {
  const ships        = useBattleStore((s) => s.ships)
  const setInitOrder = useBattleStore((s) => s.setInitiativeOrder)

  const [results, setResults] = useState(() =>
    ships.map((s) => ({
      shipId: s.id,
      name:   s.profile?.name ?? s.id,
      color:  s.color,
      total:  0,
      breakdown: null,
    }))
  )

  function rollSingle(shipId) {
    const ship        = ships.find((s) => s.id === shipId)
    if (!ship) return
    const tacticsNaval = getAssignedSkill('captain', ship.crewAssignments, ship.crew)
    const captainInt   = getAssignedCharacteristic('captain', ship.crewAssignments, ship.crew, 'INT')
    const roll         = rollInitiative(tacticsNaval, captainInt)
    setResults((prev) => prev.map((r) =>
      r.shipId !== shipId ? r : { ...r, total: roll.total, breakdown: roll }
    ))
  }

  function rollAll() {
    setResults((prev) => prev.map((r) => {
      const ship        = ships.find((s) => s.id === r.shipId)
      if (!ship) return r
      const tacticsNaval = getAssignedSkill('captain', ship.crewAssignments, ship.crew)
      const captainInt   = getAssignedCharacteristic('captain', ship.crewAssignments, ship.crew, 'INT')
      const roll         = rollInitiative(tacticsNaval, captainInt)
      return { ...r, total: roll.total, breakdown: roll }
    }))
  }

  function setManual(shipId, val) {
    const n = parseInt(val, 10)
    if (!isNaN(n)) setResults((prev) => prev.map((r) => r.shipId === shipId ? { ...r, total: n, breakdown: null } : r))
  }

  function confirm() {
    const ordered = [...results].sort((a, b) => b.total - a.total).map((r) => r.shipId)
    setInitOrder(ordered)
    onClose()
  }

  const sorted = [...results].sort((a, b) => b.total - a.total)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-amber-400 text-sm tracking-widest">INITIATIVE</p>
          <p className="font-mono text-[10px] text-gunmetal-500 mt-0.5">
            2D6 + Tactics(naval) + INT DM — opposed Captain check // 2300AD B3 p.54
          </p>
        </div>
        <button
          onClick={rollAll}
          className="px-3 py-1.5 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded transition-colors"
        >
          ROLL ALL
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map((r, idx) => {
          const bd = r.breakdown
          return (
            <div key={r.shipId}
              className={`flex items-center gap-3 rounded px-3 py-2 border ${
                idx === 0 && r.total > 0 ? 'border-amber-800/60 bg-amber-950/30' : 'border-gunmetal-700/50 bg-gunmetal-800/40'
              }`}>
              <span className="text-gunmetal-500 text-xs font-mono w-4">{idx + 1}.</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color ?? '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-mono truncate ${idx === 0 && r.total > 0 ? 'text-amber-300' : 'text-gunmetal-200'}`}>
                  {r.name}
                </p>
                {bd && (
                  <p className="text-[10px] font-mono text-gunmetal-500">
                    [{bd.dice.join('+')}]
                    {bd.tacticsNaval > 0 ? ` +tactics${bd.tacticsNaval}` : ''}
                    {bd.intDm !== 0 ? ` INT${bd.intDm > 0 ? '+' : ''}${bd.intDm}` : ''}
                    {' '}= {bd.total}
                  </p>
                )}
              </div>
              <input
                type="number"
                value={r.total}
                onChange={(e) => setManual(r.shipId, e.target.value)}
                className="w-14 text-center bg-gunmetal-800 border border-gunmetal-600 rounded px-1 py-1 text-amber-300 font-mono text-sm focus:border-amber-500 outline-none"
              />
              <button
                onClick={() => rollSingle(r.shipId)}
                className="text-xs font-mono text-gunmetal-400 hover:text-amber-400 border border-gunmetal-700 hover:border-amber-800 rounded px-2 py-1 transition-colors"
              >
                🎲
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-xs font-display tracking-widest text-gunmetal-400 border border-gunmetal-700 hover:bg-gunmetal-800 rounded"
        >
          CANCEL
        </button>
        <button
          onClick={confirm}
          className="flex-1 py-2 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded"
        >
          CONFIRM ORDER
        </button>
      </div>
    </div>
  )
}

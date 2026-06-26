import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { RANGE_BANDS, RANGE_BAND_MOVE_COST } from '../../data/rangeBands.js'
import { pairKey, getCloserBand, getFartherBand } from '../../utils/rangeBands.js'
import { getAssignedSkill, getAssignedCharacteristic } from '../../utils/crew.js'
import { getCharDM, roll2D6 } from '../../utils/dice.js'

export function ManoeuvreModal({ payload, onClose }) {
  const { shipAId, shipBId, shipId } = payload ?? {}
  const ships      = useBattleStore((s) => s.ships)
  const rangeBands = useBattleStore((s) => s.rangeBands)
  const manoeuvre    = useBattleStore((s) => s.manoeuvre)
  const setRangeBand = useBattleStore((s) => s.setRangeBand)
  const setEvasionDm = useBattleStore((s) => s.setEvasionDm)

  // If only one ship given, pick first pair it's in
  const allPairs = []
  for (let i = 0; i < ships.length; i++) {
    for (let j = i + 1; j < ships.length; j++) {
      allPairs.push([ships[i], ships[j]])
    }
  }

  const relevantPairs = allPairs.filter(([a, b]) =>
    !shipId || a.id === shipId || b.id === shipId
  ).filter(([a, b]) =>
    !shipAId || !shipBId || (
      (a.id === shipAId && b.id === shipBId) ||
      (a.id === shipBId && b.id === shipAId)
    )
  )

  const [pairIdx,     setPairIdx]    = useState(0)
  const [intent,      setIntent]     = useState('hold')
  const [tacSpeed,    setTacSpeed]   = useState(1)
  const [directBand,  setDirectBand] = useState(null)
  // Evasion — B3 p.55: opposed Pilot check (DEX), Effect → DM table
  const [evadingShipId, setEvadingShipId] = useState(null)
  const [evasionRoll,   setEvasionRoll]   = useState(null)

  const pair = relevantPairs[pairIdx]
  if (!pair) {
    return (
      <div className="p-6 space-y-4">
        <p className="font-display text-sky-300 text-sm tracking-widest">MANOEUVRE</p>
        <p className="text-slate-400 font-mono text-sm">No pairs available. Add at least 2 ships.</p>
        <button className="px-4 py-2 text-xs font-display text-slate-300 border border-slate-600 hover:bg-slate-800 rounded" onClick={onClose}>CLOSE</button>
      </div>
    )
  }

  const [a, b] = pair
  const key     = pairKey(a.id, b.id)
  const current = rangeBands[key] ?? 'Long'
  const bandDef = RANGE_BANDS.find((bd) => bd.id === current)
  const closer  = getCloserBand(current)
  const farther = getFartherBand(current)

  /** B3 p.55 — Effect of opposed Pilot check → DM applied to all incoming attacks. */
  function evasionEffectToDm(effect) {
    if (effect >= 5)  return -2
    if (effect >= 1)  return -1
    if (effect <= -5) return  1  // enemy gains DM+1
    return 0
  }

  function rollEvasion(shipId) {
    const ship       = ships.find((s) => s.id === shipId)
    if (!ship) return
    const pilotSkill = getAssignedSkill('pilot', ship.crewAssignments, ship.crew)
    const dexChar    = getAssignedCharacteristic('pilot', ship.crewAssignments, ship.crew, 'DEX')
    const dexDm      = getCharDM(dexChar)
    const dice       = roll2D6()
    const total      = dice[0] + dice[1] + pilotSkill + dexDm
    const effect     = total - 10  // opposed vs enemy Pilot (assume enemy also rolls ~10)
    const dm         = evasionEffectToDm(effect)
    setEvadingShipId(shipId)
    setEvasionRoll({ dice, total, effect, dm, pilotSkill, dexDm })
    setEvasionDm(shipId, dm)
  }

  function clearEvasion(shipId) {
    setEvadingShipId(null)
    setEvasionRoll(null)
    setEvasionDm(shipId, 0)
  }

  function applyManoeuvre() {
    if (directBand && directBand !== current) {
      setRangeBand(a.id, b.id, directBand)
    } else if (intent !== 'hold') {
      manoeuvre(a.id, b.id, intent, tacSpeed)
    }
    onClose()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sky-300 text-sm tracking-widest">MANOEUVRE</p>
        {relevantPairs.length > 1 && (
          <div className="flex gap-1">
            {relevantPairs.map((_, i) => (
              <button key={i} className={`w-6 h-6 text-xs border rounded ${i === pairIdx ? 'border-sky-500 text-sky-300' : 'border-slate-700 text-slate-500'}`}
                onClick={() => { setPairIdx(i); setIntent('hold'); setDirectBand(null) }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 rounded p-3 text-sm font-mono text-slate-200 text-center">
        {a.profile?.name} <span className="text-slate-500">↔</span> {b.profile?.name}
      </div>

      {/* Current band */}
      <div className="text-center">
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">CURRENT RANGE</p>
        <p className="text-xl font-display text-sky-300">{bandDef?.label ?? current}</p>
        <p className="text-xs font-mono text-slate-500">{bandDef?.distance}</p>
      </div>

      {/* Movement options */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">INTENT</p>
        <div className="grid grid-cols-3 gap-2">
          {(['closer', 'hold', 'farther'] ).map((opt) => (
            <button
              key={opt}
              disabled={(opt === 'closer' && !closer) || (opt === 'farther' && !farther)}
              className={`py-2 text-xs font-display tracking-widest border rounded transition-colors
                ${intent === opt ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}
                disabled:opacity-30 disabled:cursor-not-allowed`}
              onClick={() => { setIntent(opt); setDirectBand(null) }}
            >
              {opt === 'closer' ? '◀ APPROACH' : opt === 'farther' ? 'FLEE ▶' : 'HOLD'}
            </button>
          ))}
        </div>
      </div>

      {intent !== 'hold' && (
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">
            TAC SPEED SPENT (cost: {RANGE_BAND_MOVE_COST[intent === 'closer' ? closer : farther] ?? '?'})
          </p>
          <div className="flex gap-2">
            {[1,2,3,4,5,6].map((n) => (
              <button
                key={n}
                className={`flex-1 py-1.5 text-xs font-mono border rounded ${tacSpeed === n ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400'}`}
                onClick={() => setTacSpeed(n)}
              >{n}</button>
            ))}
          </div>
        </div>
      )}

      {/* GM override: set band directly */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">GM OVERRIDE — SET BAND DIRECTLY</p>
        <div className="grid grid-cols-4 gap-1">
          {RANGE_BANDS.map((bd) => (
            <button
              key={bd.id}
              className={`py-1 text-[10px] font-mono border rounded transition-colors
                ${directBand === bd.id ? 'border-sky-500 text-sky-300 bg-sky-900/30' :
                  current === bd.id ? 'border-slate-600 text-slate-300 bg-slate-800/50' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
              onClick={() => { setDirectBand(bd.id === current ? null : bd.id); setIntent('hold') }}
            >
              {bd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evasion — B3 p.55: opposed Pilot check (DEX) during Manoeuvre Step */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">
          EVASION — OPPOSED PILOT (DEX) // 2300AD B3 p.55
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[a, b].map((ship) => {
            const isEvading = evadingShipId === ship.id
            const result    = isEvading ? evasionRoll : null
            return (
              <div key={ship.id} className={`rounded border p-2 space-y-1 ${isEvading ? 'border-sky-700 bg-sky-950/30' : 'border-slate-700 bg-slate-800/30'}`}>
                <p className="font-mono text-[10px] text-slate-300 truncate">{ship.profile?.name ?? ship.id}</p>
                {result ? (
                  <>
                    <p className="font-mono text-[10px] text-slate-400">
                      [{result.dice.join('+')}] +{result.pilotSkill} +dex{result.dexDm} = {result.total}
                    </p>
                    <p className={`font-mono text-xs font-bold ${result.dm < 0 ? 'text-sky-400' : result.dm > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      Evasion DM: {result.dm > 0 ? '+' : ''}{result.dm}
                    </p>
                    <button onClick={() => clearEvasion(ship.id)}
                      className="text-[9px] font-mono text-slate-500 hover:text-slate-300 underline">
                      clear
                    </button>
                  </>
                ) : (
                  <button onClick={() => rollEvasion(ship.id)}
                    className="w-full py-1 text-[10px] font-display tracking-widest text-slate-400 border border-slate-600 hover:border-sky-600 hover:text-sky-400 rounded transition-colors">
                    EVADE 🎲
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[9px] font-mono text-slate-600 mt-1">Effect 1–4: DM−1 · Effect 5+: DM−2 · Effect ≤−5: enemy DM+1</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>
          CANCEL
        </button>
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-sky-300 border border-sky-700 hover:bg-sky-900/30 rounded"
          onClick={applyManoeuvre}
        >
          APPLY
        </button>
      </div>
    </div>
  )
}

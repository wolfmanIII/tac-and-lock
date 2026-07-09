import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { RANGE_BANDS } from '../../data/rangeBands.js'
import { pairKey, getCloserBand, getFartherBand } from '../../utils/rangeBands.js'
import { getAssignedSkill, getAssignedCharacteristic } from '../../utils/crew.js'
import { getCharDM, roll2D6 } from '../../utils/dice.js'

/** Opposed Pilot (DEX) check for one ship — TAC Speed is a fixed DM, never spent. // 2300AD B3 p.54 */
function rollPilotCheck(ship) {
  const pilotSkill = getAssignedSkill('pilot', ship.crewAssignments, ship.crew)
  const dexChar    = getAssignedCharacteristic('pilot', ship.crewAssignments, ship.crew, 'DEX')
  const dexDm      = getCharDM(dexChar)
  const tacSpeed   = ship.currentTacSpeed ?? 0
  const commandDm  = (ship.commandBonus ?? []).find((cb) => cb.role === 'pilot')?.dm ?? 0
  const dice       = roll2D6()
  const total      = dice[0] + dice[1] + pilotSkill + dexDm + tacSpeed + commandDm
  return { dice, pilotSkill, dexDm, tacSpeed, commandDm, total }
}

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
  const [actingShipId, setActingShipId] = useState(null)
  const [intent,       setIntent]       = useState(null) // 'closer' (Close) | 'farther' (Open)
  const [manoeuvreRoll, setManoeuvreRoll] = useState(null)
  const [applyEnemyChoice, setApplyEnemyChoice] = useState(false)
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

  const actingShip = actingShipId ? (actingShipId === a.id ? a : b) : null
  const otherShip   = actingShipId ? (actingShipId === a.id ? b : a) : null

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
    // Captain's Command from a previous round, if it targeted this ship's pilot // B3 p.54
    const commandDm  = (ship.commandBonus ?? []).find((cb) => cb.role === 'pilot')?.dm ?? 0
    const dice       = roll2D6()
    const total      = dice[0] + dice[1] + pilotSkill + dexDm + commandDm
    const effect     = total - 10  // opposed vs enemy Pilot (assume enemy also rolls ~10)
    const dm         = evasionEffectToDm(effect)
    setEvadingShipId(shipId)
    setEvasionRoll({ dice, total, effect, dm, pilotSkill, dexDm, commandDm })
    setEvasionDm(shipId, dm)
  }

  function clearEvasion(shipId) {
    setEvadingShipId(null)
    setEvasionRoll(null)
    setEvasionDm(shipId, 0)
  }

  /** Opposed Pilot check (DEX), TAC Speed as DM — Open/Close. // 2300AD B3 p.54 */
  function rollManoeuvre() {
    if (!actingShip || !otherShip) return
    const actingCheck = rollPilotCheck(actingShip)
    const otherCheck  = rollPilotCheck(otherShip)
    const effect      = actingCheck.total - otherCheck.total
    setManoeuvreRoll({ actingCheck, otherCheck, effect })
    setApplyEnemyChoice(false)
  }

  function clearManoeuvreRoll() {
    setManoeuvreRoll(null)
    setApplyEnemyChoice(false)
  }

  function applyManoeuvre() {
    if (directBand && directBand !== current) {
      setRangeBand(a.id, b.id, directBand)
      onClose()
      return
    }
    if (manoeuvreRoll && intent && actingShipId) {
      const bandsChanged = Math.abs(manoeuvreRoll.effect)
      if (bandsChanged > 0) {
        if (manoeuvreRoll.effect > 0) {
          // Acting ship's Pilot won the opposed check.
          manoeuvre(a.id, b.id, actingShipId, intent, bandsChanged)
        } else if (applyEnemyChoice) {
          // Acting ship failed — "if desired", the enemy capitalizes: range moves
          // the opposite way, credited to the other ship. // 2300AD B3 p.54
          const otherShipId = actingShipId === a.id ? b.id : a.id
          const reverseDirection = intent === 'closer' ? 'farther' : 'closer'
          manoeuvre(a.id, b.id, otherShipId, reverseDirection, bandsChanged)
        }
      }
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
                onClick={() => { setPairIdx(i); setActingShipId(null); setIntent(null); setManoeuvreRoll(null); setDirectBand(null) }}>
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

      {/* Manoeuvre — opposed Pilot check // 2300AD B3 p.54 */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">
          MANOEUVRE — OPPOSED PILOT (DEX) // 2300AD B3 p.54
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[a, b].map((ship) => (
            <button
              key={ship.id}
              disabled={(!closer && !farther)}
              className={`py-1.5 text-xs font-mono border rounded transition-colors truncate
                ${actingShipId === ship.id ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              onClick={() => { setActingShipId(ship.id); setManoeuvreRoll(null) }}
            >
              {ship.profile?.name ?? ship.id}
            </button>
          ))}
        </div>
        {actingShipId && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              disabled={!closer}
              className={`py-2 text-xs font-display tracking-widest border rounded transition-colors
                ${intent === 'closer' ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}
                disabled:opacity-30 disabled:cursor-not-allowed`}
              onClick={() => { setIntent('closer'); setManoeuvreRoll(null) }}
            >
              ◀ CLOSE (approach)
            </button>
            <button
              disabled={!farther}
              className={`py-2 text-xs font-display tracking-widest border rounded transition-colors
                ${intent === 'farther' ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}
                disabled:opacity-30 disabled:cursor-not-allowed`}
              onClick={() => { setIntent('farther'); setManoeuvreRoll(null) }}
            >
              OPEN (flee) ▶
            </button>
          </div>
        )}

        {actingShipId && intent && !manoeuvreRoll && (
          <button
            onClick={rollManoeuvre}
            className="w-full py-1.5 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-sky-600 hover:text-sky-400 rounded transition-colors"
          >
            ROLL 🎲
          </button>
        )}

        {manoeuvreRoll && (
          <div className="rounded border border-slate-700 bg-slate-800/30 p-2 space-y-1.5">
            <p className="font-mono text-[10px] text-slate-400">
              {actingShip.profile?.name}: [{manoeuvreRoll.actingCheck.dice.join('+')}] +{manoeuvreRoll.actingCheck.pilotSkill} +dex{manoeuvreRoll.actingCheck.dexDm} +tac{manoeuvreRoll.actingCheck.tacSpeed}
              {manoeuvreRoll.actingCheck.commandDm ? ` +cmd${manoeuvreRoll.actingCheck.commandDm}` : ''} = {manoeuvreRoll.actingCheck.total}
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              {otherShip.profile?.name}: [{manoeuvreRoll.otherCheck.dice.join('+')}] +{manoeuvreRoll.otherCheck.pilotSkill} +dex{manoeuvreRoll.otherCheck.dexDm} +tac{manoeuvreRoll.otherCheck.tacSpeed}
              {manoeuvreRoll.otherCheck.commandDm ? ` +cmd${manoeuvreRoll.otherCheck.commandDm}` : ''} = {manoeuvreRoll.otherCheck.total}
            </p>
            {manoeuvreRoll.effect > 0 ? (
              <p className="font-mono text-xs font-bold text-sky-400">
                {actingShip.profile?.name} succeeds — Effect {manoeuvreRoll.effect}: moves {Math.abs(manoeuvreRoll.effect)} band(s) {intent === 'closer' ? 'closer' : 'farther'}.
              </p>
            ) : manoeuvreRoll.effect < 0 ? (
              <>
                <p className="font-mono text-xs font-bold text-red-400">
                  {actingShip.profile?.name} fails — Effect {manoeuvreRoll.effect}: {otherShip.profile?.name} may {intent === 'closer' ? 'open the range' : 'close the range'} by {Math.abs(manoeuvreRoll.effect)} band(s), if desired.
                </p>
                <label className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <input type="checkbox" checked={applyEnemyChoice} onChange={(e) => setApplyEnemyChoice(e.target.checked)} />
                  Enemy takes the opportunity
                </label>
              </>
            ) : (
              <p className="font-mono text-xs font-bold text-slate-400">Tied check — no range change.</p>
            )}
            <button onClick={clearManoeuvreRoll}
              className="text-[9px] font-mono text-slate-500 hover:text-slate-300 underline">
              re-roll
            </button>
          </div>
        )}
      </div>

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
              onClick={() => setDirectBand(bd.id === current ? null : bd.id)}
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
                      [{result.dice.join('+')}] +{result.pilotSkill} +dex{result.dexDm}
                      {result.commandDm ? ` +cmd${result.commandDm}` : ''} = {result.total}
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

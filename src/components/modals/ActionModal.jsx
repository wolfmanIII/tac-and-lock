import { useState, useMemo } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { CREW_ACTIONS } from '../../data/crewActions.js'
import { CREW_SKILLS } from '../../utils/crew.js'
import { roll2D6, formatCheckResult } from '../../utils/dice.js'
import { DiceInput } from '../forms/DiceInput.jsx'

/** Roles a Captain can target with a Command — every crew role except themself. // 2300AD B3 p.54 */
const COMMAND_TARGET_ROLES = Object.keys(CREW_SKILLS).filter((r) => r !== 'captain')

const ALL_ACTIONS = Object.values(CREW_ACTIONS).flat()

/** Actions that show APPLY on failure too (have a failure-path store effect). */
const HAS_FAILURE_EFFECT = new Set(['overload_stutterwarp', 'electronic_warfare'])

/** Boarding result table — diff = attacker_total − defender_total. // B3 p.55 */
function getBoardingResult(diff) {
  if (diff <= -7) return { label: 'ATTACKERS DEFEATED', detail: 'Defender may counter-attack DM+4 next round.', hullDice: 0, armourPiercing: false, carryDm: 0, side: 'defender' }
  if (diff <= -4) return { label: 'ATTACKERS DEFEATED', detail: 'Attackers must retreat or are captured/killed.', hullDice: 0, armourPiercing: false, carryDm: 0, side: 'none' }
  if (diff <= -1) return { label: 'COMBAT CONTINUES', detail: 'Defender DM+2 next round; defending ship takes 2D Hull.', hullDice: 2, armourPiercing: false, carryDm: 2, side: 'defender' }
  if (diff === 0) return { label: 'COMBAT CONTINUES', detail: 'No advantage — roll again next round.', hullDice: 0, armourPiercing: false, carryDm: 0, side: 'none' }
  if (diff <= 3)  return { label: 'COMBAT CONTINUES', detail: 'Attacker DM+2 next round; defending ship takes 2D Hull.', hullDice: 2, armourPiercing: false, carryDm: 2, side: 'attacker' }
  if (diff <= 6)  return { label: 'BOARDING SUCCEEDED', detail: 'Defending ship takes 1D Hull (ignores Armour); 2D rounds to pacify.', hullDice: 1, armourPiercing: true, carryDm: 0, side: 'none' }
  return { label: 'IMMEDIATE BOARDING', detail: 'Control of the defending ship passes to attackers.', hullDice: 0, armourPiercing: false, carryDm: 0, side: 'none' }
}

function roll(n) {
  let total = 0
  for (let i = 0; i < n; i++) total += Math.ceil(Math.random() * 6)
  return total
}

export function ActionModal({ payload, onClose }) {
  const { shipId } = payload ?? {}

  const ships                = useBattleStore((s) => s.ships)
  const reduceCritical       = useBattleStore((s) => s.reduceCriticalSeverity)
  const repairHull           = useBattleStore((s) => s.repairHull)
  const applyEW              = useBattleStore((s) => s.applyEW)
  const addCriticalHit       = useBattleStore((s) => s.addCriticalHit)
  const updateShip           = useBattleStore((s) => s.updateShip)
  const applyCommand         = useBattleStore((s) => s.applyCommand)
  const removeHazard         = useBattleStore((s) => s.removeHazard)
  const applyDamage          = useBattleStore((s) => s.applyDamage)

  const ship    = ships.find((s) => s.id === shipId)
  const targets = ships.filter((s) => s.id !== shipId && !s.isDestroyed)

  // Commands issued so far this round on this ship — capped at one per Leadership level. // B3 p.54
  const issuedCommands = ship?.commandBonusNextRound ?? []
  const availableCommandRoles = COMMAND_TARGET_ROLES.filter(
    (r) => !issuedCommands.some((cb) => cb.role === r),
  )

  const [selectedAction,         setSelectedAction]         = useState(null)
  const [targetId,               setTargetId]               = useState(targets[0]?.id ?? '')
  const [skillLevel,             setSkillLevel]             = useState(1)
  const [rollResult,             setRollResult]             = useState(null)
  const [manualMode,             setManualMode]             = useState(false)
  const [critSystem,             setCritSystem]             = useState('')
  const [repairMode,             setRepairMode]             = useState('system') // 'system' | 'hull'
  const [selectedHazardId,       setSelectedHazardId]       = useState('')
  const [boardingDefenderTotal,  setBoardingDefenderTotal]  = useState('')
  const [boardingHullDamage,     setBoardingHullDamage]     = useState(null)
  const [commandRole,            setCommandRole]            = useState(COMMAND_TARGET_ROLES[0])

  const action = ALL_ACTIONS.find((a) => a.id === selectedAction)
  const target = ships.find((s) => s.id === targetId)

  // Falls back to the first still-available role once the selected one has been commanded. // B3 p.54
  const effectiveCommandRole = availableCommandRoles.includes(commandRole)
    ? commandRole
    : availableCommandRoles[0]

  // "One command per combat round per level of Leadership skill" — skillLevel is the GM's
  // manually-entered Leadership rating for this check (same convention as every other action
  // roll in this modal), so it doubles as the per-round Commands cap. // 2300AD B3 p.54
  const commandsRemaining = selectedAction === 'commands'
    ? Math.max(0, skillLevel - issuedCommands.length)
    : null

  // Boarding result derived from attacker roll + defender manual total
  const boardingResult = useMemo(() => {
    if (selectedAction !== 'boarding_action') return null
    if (!rollResult || !boardingDefenderTotal) return null
    const attackerTotal  = rollResult.total
    const defenderTotal  = Number(boardingDefenderTotal)
    if (!Number.isFinite(defenderTotal)) return null
    return getBoardingResult(attackerTotal - defenderTotal)
  }, [selectedAction, rollResult, boardingDefenderTotal])

  function doRoll() {
    if (!action) return
    const dice  = roll2D6()
    const total = dice[0] + dice[1] + skillLevel
    const result = formatCheckResult(total, action.difficulty)
    setRollResult({ ...result, dice, total })
    setBoardingHullDamage(null)
  }

  function onManual({ total }) {
    if (!action) return
    const result = formatCheckResult(total, action.difficulty)
    setRollResult({ ...result, dice: [], total })
    setBoardingHullDamage(null)
  }

  function rollBoardingHull(result) {
    if (!result || result.hullDice === 0) return 0
    const dmg = roll(result.hullDice)
    setBoardingHullDamage(dmg)
    return dmg
  }

  function applyAction() {
    if (!action) return

    const success = rollResult?.success ?? false
    const effect  = rollResult?.effect  ?? 0

    switch (action.id) {
      case 'electronic_warfare':
        // Effect banding (incl. the Effect ≤−5 backfire) is resolved inside applyEW,
        // so this fires on both success and failure — not gated on `success`. // B3 p.54
        if (target) applyEW(shipId, target.id, effect)
        break

      case 'ew_countermeasure': {
        if (success) {
          const jammer = ships.find((s) => s.ewTarget === shipId)
          if (jammer) updateShip(jammer.id, { ewTarget: null, ewEffect: 0 })
        }
        break
      }

      case 'emergency_repair':
        if (success) {
          if (repairMode === 'hull') repairHull(shipId, 1)
          else if (critSystem) reduceCritical(shipId, critSystem)
        }
        break

      case 'damage_control':
        if (success && selectedHazardId) removeHazard(shipId, selectedHazardId)
        break

      case 'overload_stutterwarp': // B3 p.55 — Effect 1-4 → +1 TAC Speed, Effect 5-6 → +2
        if (success) {
          if (ship) updateShip(shipId, {
            currentTacSpeed: ship.currentTacSpeed + (effect >= 5 ? 2 : 1),
          })
        } else {
          addCriticalHit(shipId, 'stutterwarp')
        }
        break

      case 'active_sensors': // B3 p.57 — activeSensorsOn → +1 Signature
        if (success) updateShip(shipId, { activeSensorsOn: true })
        break

      case 'commands': { // B3 p.54 — activates next round, see applyCommand
        if (success) applyCommand(shipId, effectiveCommandRole, effect >= 5 ? 2 : 1)
        break
      }

      case 'boarding_action': { // B3 p.55
        if (!boardingResult) break
        const hullDmg = boardingHullDamage ?? (boardingResult.hullDice > 0 ? rollBoardingHull(boardingResult) : 0)
        if (hullDmg > 0 && target) {
          const armour = boardingResult.armourPiercing ? 0 : (target.currentArmour ?? 0)
          applyDamage(target.id, Math.max(0, hullDmg - armour), shipId)
        }
        // Store carry-over DM for next boarding round
        if (boardingResult.carryDm > 0) {
          const dmSide = boardingResult.side
          if (dmSide === 'attacker') updateShip(shipId, { boardingDmNextRound: boardingResult.carryDm })
          if (dmSide === 'defender' && target) updateShip(target.id, { boardingDmNextRound: boardingResult.carryDm })
        }
        break
      }

      case 'repel_boarders': { // B3 p.55 — defender's roll; stores carry-over DM
        if (success && (ship?.boardingDmNextRound ?? 0) > 0) {
          // Consume existing boarding DM carry-over on a successful defence
          updateShip(shipId, { boardingDmNextRound: 0 })
        }
        break
      }

      default:
        break
    }
    // A Captain with commands left to give (per Leadership level) keeps the modal open to
    // issue the next one, instead of closing after a single Command. // B3 p.54
    if (action.id === 'commands' && success && commandsRemaining > 1) {
      setRollResult(null)
      return
    }
    onClose()
  }

  const groupedActions = Object.entries(CREW_ACTIONS).map(([role, actions]) => ({ role, actions }))

  const canApply = action && (
    action.id !== 'commands' || commandsRemaining > 0
  ) && (
    action.difficulty === 0 ||
    rollResult?.success ||
    HAS_FAILURE_EFFECT.has(action.id) && rollResult ||
    (action.id === 'boarding_action' && boardingResult)
  )

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
                onClick={() => { setSelectedAction(a.id); setRollResult(null); setBoardingHullDamage(null) }}
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

          {/* Target ship picker */}
          {action.requiresTarget && (
            <div>
              <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">TARGET</p>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
                {targets.map((t) => <option key={t.id} value={t.id}>{t.profile?.name}</option>)}
              </select>
            </div>
          )}

          {/* Emergency Repair — hull vs system mode */}
          {action.id === 'emergency_repair' && (
            <div className="space-y-2">
              <p className="text-[10px] font-display text-slate-500 tracking-widest">REPAIR TARGET</p>
              <div className="flex gap-2">
                {['system', 'hull'].map((mode) => (
                  <button key={mode} onClick={() => setRepairMode(mode)}
                    className={`flex-1 py-1 text-xs font-mono border rounded ${repairMode === mode ? 'border-emerald-500 text-emerald-300 bg-emerald-900/30' : 'border-slate-700 text-slate-400'}`}>
                    {mode === 'system' ? 'Critical System' : 'Hull (+1 HP)'}
                  </button>
                ))}
              </div>
              {repairMode === 'system' && (
                <select value={critSystem} onChange={(e) => setCritSystem(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
                  <option value="">— select system —</option>
                  {Object.entries(ship?.criticalTracks ?? {}).filter(([, sev]) => sev > 0).map(([sys, sev]) => (
                    <option key={sys} value={sys}>{sys} (sev {sev})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Damage Control — hazard picker */}
          {action.id === 'damage_control' && (
            <div>
              <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">ACTIVE HAZARD</p>
              {(ship?.hazards ?? []).length === 0 ? (
                <p className="text-xs font-mono text-slate-500 italic">No active hazards — add them in Ship Sheet.</p>
              ) : (
                <select value={selectedHazardId} onChange={(e) => setSelectedHazardId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
                  <option value="">— select hazard —</option>
                  {(ship?.hazards ?? []).map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Commands — crew role picker (own ship, not an enemy target) */}
          {action.id === 'commands' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-display text-slate-500 tracking-widest">ORDER RECIPIENT (crew role)</p>
                <p className="text-[10px] font-mono text-slate-500">
                  {commandsRemaining}/{skillLevel} left this round
                </p>
              </div>
              {availableCommandRoles.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 italic">Every crew role already has a Command this round.</p>
              ) : (
                <select value={effectiveCommandRole} onChange={(e) => setCommandRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
                  {availableCommandRoles.map((r) => <option key={r} value={r}>{CREW_SKILLS[r]} ({r})</option>)}
                </select>
              )}
              {issuedCommands.length > 0 && (
                <p className="text-[10px] font-mono text-emerald-500 mt-1">
                  Issued: {issuedCommands.map((cb) => `${cb.role} (+${cb.dm})`).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Boarding Action — defender total input + result table */}
          {action.id === 'boarding_action' && (
            <div className="space-y-2">
              <p className="text-[10px] font-display text-slate-500 tracking-widest">DEFENDER TOTAL (2D + mods)</p>
              <input type="number" min={2} max={24} value={boardingDefenderTotal}
                onChange={(e) => { setBoardingDefenderTotal(e.target.value); setBoardingHullDamage(null) }}
                placeholder="enter defender's 2D+mods total"
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none" />
              {boardingResult && (
                <div className={`rounded p-3 border space-y-1 ${
                  boardingResult.label.includes('SUCCEEDED') || boardingResult.label.includes('IMMEDIATE')
                    ? 'bg-emerald-950/50 border-emerald-800'
                    : boardingResult.label.includes('DEFEATED')
                      ? 'bg-red-950/50 border-red-900'
                      : 'bg-slate-800/60 border-slate-700'
                }`}>
                  <p className="font-display text-xs tracking-widest text-slate-200">{boardingResult.label}</p>
                  <p className="text-[11px] font-mono text-slate-400">{boardingResult.detail}</p>
                  {boardingResult.hullDice > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-red-400">{boardingResult.hullDice}D Hull damage</span>
                      {boardingHullDamage === null ? (
                        <button onClick={() => rollBoardingHull(boardingResult)}
                          className="text-[10px] font-display tracking-widest text-red-400 border border-red-800 rounded px-2 py-0.5 hover:bg-red-900/20">
                          ROLL {boardingResult.hullDice}D
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-red-300 font-bold">= {boardingHullDamage}{boardingResult.armourPiercing ? ' (ignores armour)' : ''}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Standard skill roll block (all actions with difficulty > 0, except boarding which has its own) */}
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
              {action.id === 'boarding_action' && rollResult && (
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Attacker total: {rollResult.total} — enter defender total above</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>CANCEL</button>
        {canApply && (
          <button className="flex-1 py-2 text-xs font-display tracking-widest text-emerald-400 border border-emerald-800 hover:bg-emerald-900/20 rounded" onClick={applyAction}>
            APPLY RESULT
          </button>
        )}
      </div>
    </div>
  )
}

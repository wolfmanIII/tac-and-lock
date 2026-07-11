/**
 * DroneAttackModal — resolves a single drone/missile's attack against its target.
 * // 2300AD B3 p.55–56, p.61 — full 3-step Firing Solution per unit, not a "salvo" roll.
 * See doc/drone-combat-redesign-spec.md.
 *
 * Step 1: Sensor hand-off (Electronics(sensors) INT, no penalty) OR
 *         self-generated (Remote Pilot's Piloting action, DEX, DM-2).
 * Step 2: Position Vessel — Remote Pilot, Electronics(remote ops) DEX, +drone TAC Speed,
 *         +DM2 flat drone Pilot bonus (crewed fighters <100t get +DM1 instead — not modeled).
 * Step 3: Gunner — Difficult (10+), Fire Control DM, range DM at drone's current band.
 *
 * Point Defence (target's reaction) is also resolved here, inline, one drone at a time —
 * NOT an abstract salvo-wide roll. // 2300AD B3 p.55–56
 */

import { useState, useMemo } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore }     from '../../store/uiStore.js'
import { WEAPONS }        from '../../data/weapons.js'
import { SENSOR_TIME_LAG_DM } from '../../data/rangeBands.js'
import { getAssignedSkill, getAssignedCharacteristic } from '../../utils/crew.js'
import { getCharDM, roll2D6 } from '../../utils/dice.js'
import { getRangeDM, rollDamage, isSurfaceFixtureDamage, isInternalCriticalHit, computeEffectiveSignature, getPointDefenceDm, getEasyTargetAttackDm, getEasyTargetDamageMultiplier, getAtmosphericTargetDm, getOrtilleryDm, getFireControlDm, getScreenDm, getWeaponTraitAttackDm } from '../../utils/combat.js'
import { DiceInput } from '../forms/DiceInput.jsx'

const STEP_PD     = 0
const STEP_SENSOR = 1
const STEP_PILOT  = 2
const STEP_GUNNER = 3

function fmtDm(n) {
  return n >= 0 ? `+${n}` : `${n}`
}

function DmRow({ label, value }) {
  if (value === 0) return null
  return (
    <div className="flex items-center justify-between text-xs font-mono">
      <span className="text-slate-400">{label}</span>
      <span className={value > 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtDm(value)}</span>
    </div>
  )
}

function DmBreakdown({ rows, total }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded px-3 py-2 space-y-1">
      {rows.map(([label, value]) => <DmRow key={label} label={label} value={value} />)}
      <div className="border-t border-slate-700 pt-1 mt-1 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-300 tracking-widest">TOTAL DM</span>
        <span className={`font-bold ${total >= 0 ? 'text-sky-300' : 'text-red-400'}`}>{fmtDm(total)}</span>
      </div>
    </div>
  )
}

function RollBlock({ dm, onRoll, onManual, result, target, disabled = false }) {
  const [showManual, setShowManual] = useState(false)
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed" onClick={onRoll} disabled={disabled}>
          ROLL 2D6
        </button>
        <button className="text-xs font-mono text-slate-500 hover:text-slate-400 transition-colors underline" onClick={() => setShowManual((v) => !v)} disabled={disabled}>
          {showManual ? 'hide' : 'enter manually'}
        </button>
      </div>
      {showManual && <DiceInput dm={dm} onChange={onManual} />}
      {result !== null && (
        <div className={`rounded px-3 py-2 border text-xs font-mono space-y-0.5 ${result.total >= target ? 'bg-emerald-950/60 border-emerald-800' : 'bg-red-950/40 border-red-900/60'}`}>
          <div className="flex items-center justify-between">
            <span className="font-display tracking-widest text-sm">
              {result.total >= target ? <span className="text-emerald-400">SUCCESS</span> : <span className="text-red-400">FAILURE</span>}
            </span>
            <span className="text-slate-400">{result.dice[0]}+{result.dice[1]}{dm !== 0 ? ` ${fmtDm(dm)}` : ''} = {result.total}</span>
          </div>
          <div className="text-slate-400">
            Effect: <span className={result.effect >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtDm(result.effect)}</span>
            {result.effect > 0 && <span className="ml-2 text-sky-400">→ carries as DM to next step</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export function DroneAttackModal({ payload, onClose }) {
  const { droneId } = payload ?? {}
  const ships       = useBattleStore((s) => s.ships)
  const drones      = useBattleStore((s) => s.drones)
  const applyDamage = useBattleStore((s) => s.applyDamage)
  const detonateDrone  = useBattleStore((s) => s.detonateDrone)
  const depleteScreens  = useBattleStore((s) => s.depleteScreens)
  const interceptDrone = useBattleStore((s) => s.interceptDrone)
  const spendCrewAction = useBattleStore((s) => s.spendCrewAction)
  const updateShip      = useBattleStore((s) => s.updateShip)
  const { openModal } = useUIStore()

  const drone  = drones.find((d) => d.id === droneId)
  const owner  = ships.find((s) => s.id === drone?.ownerId)
  const target = ships.find((s) => s.id === drone?.targetId)
  const weapon = WEAPONS[drone?.weaponId]
  const ownerBudget  = owner?.actionsRemaining ?? {}
  const targetBudget = target?.actionsRemaining ?? {}

  const [step, setStep] = useState(STEP_PD)
  const [sensorMode, setSensorMode] = useState('handoff') // 'handoff' | 'self'
  const [pdResult,     setPdResult]     = useState(null)
  const [step1Result,   setStep1Result]   = useState(null)
  const [step2Result,   setStep2Result]   = useState(null)
  const [step3Result,   setStep3Result]   = useState(null)
  const [damageResult,  setDamageResult]  = useState(null)
  const [detonationMode, setDetonationMode] = useState(false) // Whiskey only — single-use alt warhead
  // Tracks which (ship, role, step-slot) combos have already spent an action this
  // session, so re-rolling the SAME step via ← BACK doesn't double-spend — but two
  // different steps drawing on the same role (e.g. self-generated Step 1 + Step 2,
  // both remote_pilot) each still spend independently. // 2300AD B3 p.53
  const [spentSlots, setSpentSlots] = useState(new Set())
  function spendOnce(shipId, role, slot) {
    const key = `${shipId}:${role}:${slot}`
    if (spentSlots.has(key)) return
    spendCrewAction(shipId, role)
    setSpentSlots((prev) => new Set(prev).add(key))
  }

  // ── Point Defence — one-at-a-time intercept, target ship's own gunner // B3 p.55–56 ──
  const pdDms = useMemo(() => {
    if (!target || !weapon) return { rows: [], total: 0 }
    const gunnerSkill = getAssignedSkill('gunner_turret', target.crewAssignments, target.crew)
    const dexDm       = getCharDM(getAssignedCharacteristic('gunner_turret', target.crewAssignments, target.crew, 'DEX'))
    const pdDm        = getPointDefenceDm(weapon.traits)
    // Fire Control applies to all attack rolls, including point defence // B3 p.62
    const fireControlDm = getFireControlDm(target.software)
    const total = gunnerSkill + dexDm + pdDm + fireControlDm
    return { rows: [['Gunner skill', gunnerSkill], ['DEX DM', dexDm], ['Point Defence', pdDm], ['Fire Control', fireControlDm]], total }
  }, [target, weapon])

  function rollPd() {
    const dice = roll2D6()
    const total = dice[0] + dice[1] + pdDms.total
    setPdResult({ dice, total, effect: total - 10, success: total >= 10 })
    if (target) spendOnce(target.id, 'gunner_turret', 'pd')
  }
  function manualPd({ dice, total }) {
    setPdResult({ dice, total, effect: total - 10, success: total >= 10 })
    if (target) spendOnce(target.id, 'gunner_turret', 'pd')
  }
  function applyIntercept() {
    interceptDrone(droneId)
    onClose()
  }

  // ── Step 1: Sensor (hand-off, no penalty) or self-generated (Piloting, DM-2) // B3 p.55 ──
  const step1Dms = useMemo(() => {
    if (!owner || !target) return { rows: [], total: 0 }
    const sig       = computeEffectiveSignature(target)
    const sensorQDm = owner.sensors?.dm ?? 0
    const timeLagDm = SENSOR_TIME_LAG_DM[drone?.currentBand] ?? 0
    if (sensorMode === 'handoff') {
      const skill = getAssignedSkill('sensor_operator', owner.crewAssignments, owner.crew)
      const intDm = getCharDM(getAssignedCharacteristic('sensor_operator', owner.crewAssignments, owner.crew))
      const total = skill + intDm + sig.effective + sensorQDm + timeLagDm
      return { rows: [['Sensors skill', skill], ['INT DM', intDm], ['Target Signature', sig.effective], ['Sensor quality', sensorQDm], ['Time-lag', timeLagDm]], total }
    }
    // Self-generated — Remote Pilot's Piloting action, DEX, DM-2 // B3 p.55
    const skill = getAssignedSkill('remote_pilot', owner.crewAssignments, owner.crew)
    const dexDm = getCharDM(getAssignedCharacteristic('remote_pilot', owner.crewAssignments, owner.crew, 'DEX'))
    const total = skill + dexDm + sig.effective + timeLagDm - 2
    return { rows: [['Remote Pilot skill', skill], ['DEX DM', dexDm], ['Target Signature', sig.effective], ['Time-lag', timeLagDm], ['Self-generated', -2]], total }
  }, [owner, target, sensorMode, drone])

  const step1CarryEffect = step1Result ? Math.max(0, step1Result.effect) : 0

  function rollStep1() {
    const dice = roll2D6()
    const total = dice[0] + dice[1] + step1Dms.total
    setStep1Result({ dice, total, effect: total - 12 })
    if (owner) spendOnce(owner.id, sensorMode === 'handoff' ? 'sensor_operator' : 'remote_pilot', 'step1')
  }
  function manualStep1({ dice, total }) {
    setStep1Result({ dice, total, effect: total - 12 })
    if (owner) spendOnce(owner.id, sensorMode === 'handoff' ? 'sensor_operator' : 'remote_pilot', 'step1')
  }

  // ── Step 2: Position Vessel — Remote Pilot, Electronics(remote ops) DEX // B3 p.55–56 ──
  // Drones get a flat DM+2 to all Pilot checks (crewed fighters under 100 tons get DM+1
  // instead — not currently a modeled unit type, so every drone/missile weapon here is DM+2).
  const step2Dms = useMemo(() => {
    if (!owner) return { rows: [], total: 0 }
    const skill = getAssignedSkill('remote_pilot', owner.crewAssignments, owner.crew)
    const dexDm = getCharDM(getAssignedCharacteristic('remote_pilot', owner.crewAssignments, owner.crew, 'DEX'))
    const tacSpeed = weapon?.tacSpeed ?? 0
    const droneDm = 2
    const total = skill + dexDm + tacSpeed + droneDm + step1CarryEffect
    return { rows: [['Remote Pilot skill', skill], ['DEX DM', dexDm], ['Drone TAC Speed', tacSpeed], ['Drone Pilot bonus', droneDm], ['Carry (Step 1)', step1CarryEffect]], total }
  }, [owner, weapon, step1CarryEffect])

  const step2CarryEffect = step2Result ? Math.max(0, step2Result.effect) : 0

  function rollStep2() {
    const dice = roll2D6()
    const total = dice[0] + dice[1] + step2Dms.total
    setStep2Result({ dice, total, effect: total - 10 })
    if (owner) spendOnce(owner.id, 'remote_pilot', 'step2')
  }
  function manualStep2({ dice, total }) {
    setStep2Result({ dice, total, effect: total - 10 })
    if (owner) spendOnce(owner.id, 'remote_pilot', 'step2')
  }

  // ── Step 3: Gunner — Difficult (10+), Fire Control, range, target's reactive DMs // B3 p.56 ──
  // Remote Pilot is the one who "fights drones" per the B3 p.53 Crew Actions table
  // (not a separate turret gunner) — this step draws the owner's own remote_pilot skill.
  const step3Dms = useMemo(() => {
    if (!owner || !target || !weapon) return { rows: [], total: 0 }
    const remotePilotSkill = getAssignedSkill('remote_pilot', owner.crewAssignments, owner.crew)
    const remotePilotDexDm = getCharDM(getAssignedCharacteristic('remote_pilot', owner.crewAssignments, owner.crew, 'DEX'))
    const fireControlDm = getFireControlDm(owner.software)
    const rangeDm = getRangeDM(drone.weaponId, drone.currentBand)
    const evasionDm    = target.evasionDm ?? 0
    const jammer = ships.find((s) => s.ewTarget === owner.id)
    const jammerPenalty = jammer?.ewEffect ?? 0
    // Stationary or reaction-drive target — Firing Solution is trivial // B3 p.56
    const easyTargetDm = getEasyTargetAttackDm(target)
    // Planetary surface / atmospheric flight range modifiers, and Ortillery vs. surface targets // B3 p.56, p.59
    const atmosphericDm = getAtmosphericTargetDm(target)
    const ortilleryDm   = getOrtilleryDm(weapon.traits, target)
    // Defensive Screens — negative DM equal to target's active Rating, laser weapons only // B3 p.62
    const screenDm = getScreenDm(target, weapon)
    // Weapon traits — Accurate +1, Slow −2 // B3 p.59
    const weaponTraitDm = getWeaponTraitAttackDm(weapon.traits)
    const total = remotePilotSkill + remotePilotDexDm + fireControlDm + rangeDm + step2CarryEffect + evasionDm + jammerPenalty + easyTargetDm + atmosphericDm + ortilleryDm + screenDm + weaponTraitDm
    return {
      rows: [
        ['Remote Pilot skill', remotePilotSkill],
        ['DEX DM', remotePilotDexDm],
        ['Fire Control', fireControlDm],
        [`Range (${drone.currentBand})`, rangeDm],
        ['Carry (Step 2)', step2CarryEffect],
        ['Evasion penalty', evasionDm],
        ['Weapon trait', weaponTraitDm],
        ...(jammerPenalty !== 0 ? [['EW jamming', jammerPenalty]] : []),
        ...(easyTargetDm !== 0 ? [['Stationary/reaction-drive target', easyTargetDm]] : []),
        ...(atmosphericDm !== 0 ? [['Planetary/atmospheric condition', atmosphericDm]] : []),
        ...(ortilleryDm !== 0 ? [['Ortillery', ortilleryDm]] : []),
        ...(screenDm !== 0 ? [['Defensive Screens', screenDm]] : []),
      ],
      total,
    }
  }, [owner, target, weapon, drone, ships, step2CarryEffect])

  const damageOverride = detonationMode && weapon.detonationMode ? weapon.detonationMode : null

  function rollStep3() {
    const dice = roll2D6()
    const total = dice[0] + dice[1] + step3Dms.total
    const effect = total - 10
    setStep3Result({ dice, total, effect })
    if (owner) spendOnce(owner.id, 'remote_pilot', 'step3')
    if (total >= 10) {
      setDamageResult(rollDamage(drone.weaponId, 1, target.currentArmour ?? 0, damageOverride, getEasyTargetDamageMultiplier(target)))
    }
  }
  function manualStep3({ dice, total }) {
    const effect = total - 10
    setStep3Result({ dice, total, effect })
    if (owner) spendOnce(owner.id, 'remote_pilot', 'step3')
    if (total >= 10) {
      setDamageResult(rollDamage(drone.weaponId, 1, target.currentArmour ?? 0, damageOverride, getEasyTargetDamageMultiplier(target)))
    }
  }

  function applyResults() {
    if (!damageResult || !target) return
    applyDamage(target.id, damageResult.net, owner?.id)
    if (weapon?.isLaser) depleteScreens(target.id) // only laser fire depletes screens // B3 p.62
    detonateDrone(droneId)
    const effect = step3Result?.effect ?? 0
    // Improve Critical (Sensor Operator) lowers the threshold for this ship's next shot
    // this round — "next shot" is singular, so it's consumed here regardless of whether
    // it actually produced a crit. // 2300AD B3 p.54
    const critThreshold = owner.improveCriticalThreshold ?? 6
    if (owner.improveCriticalThreshold != null) updateShip(owner.id, { improveCriticalThreshold: null })
    if (isSurfaceFixtureDamage(effect)) {
      openModal('critical-hit', { shipId: target.id, mode: 'surface', effect })
    } else if (isInternalCriticalHit(effect, damageResult.net, target.currentHull, critThreshold)) {
      openModal('critical-hit', { shipId: target.id, mode: 'internal', effect })
    }
    onClose()
  }

  function applyMiss() {
    // "Next shot this round" is consumed by this attempt whether it hit or not.
    if (owner.improveCriticalThreshold != null) updateShip(owner.id, { improveCriticalThreshold: null })
    detonateDrone(droneId)
    onClose()
  }

  if (!drone || !owner || !target || !weapon) {
    return (
      <div className="p-6">
        <p className="text-slate-400 font-mono text-sm">Drone not found.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-xs font-display text-slate-300 border border-slate-600 rounded">CLOSE</button>
      </div>
    )
  }

  // ── STEP_PD: Point Defence (target's reaction) ──────────────────────────────

  if (step === STEP_PD) {
    return (
      <div className="p-5 space-y-3">
        <p className="font-display text-xs text-slate-500 tracking-widest uppercase">DRONE ATTACK — {weapon.name}</p>
        <p className="font-mono text-[10px] text-slate-500">
          {owner.profile?.name} → {target.profile?.name} · {drone.currentBand} · Round {drone.roundsElapsed}
        </p>

        <div className="bg-sky-950/20 border border-sky-900/50 rounded p-3 space-y-2">
          <p className="text-[10px] font-display text-sky-400 tracking-widest uppercase">
            {target.profile?.name} — POINT DEFENCE · Gunner (turret) DEX · Difficult (10+) // B3 p.55–56
          </p>
          {targetBudget.gunner_turret <= 0 && (
            <p className="font-mono text-[10px] text-red-400">{target.profile?.name}'s Gunner has no actions left this round (Gunnery cap — B3 p.53).</p>
          )}
          <DmBreakdown rows={pdDms.rows} total={pdDms.total} />
          <RollBlock dm={pdDms.total} onRoll={rollPd} onManual={manualPd} result={pdResult} target={10} disabled={targetBudget.gunner_turret <= 0} />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
            CANCEL
          </button>
          {pdResult?.success && (
            <button onClick={applyIntercept} className="flex-1 py-2 text-xs font-display tracking-widest text-emerald-400 border border-emerald-700 hover:bg-emerald-900/20 rounded transition-colors">
              INTERCEPTED — DESTROY DRONE
            </button>
          )}
          <button onClick={() => setStep(STEP_SENSOR)} className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors">
            NO INTERCEPT → FIRING SOLUTION
          </button>
        </div>
      </div>
    )
  }

  // ── STEP_SENSOR ──────────────────────────────────────────────────────────────

  if (step === STEP_SENSOR) {
    return (
      <div className="p-5 space-y-3">
        <p className="font-display text-xs text-slate-500 tracking-widest uppercase">STEP 1 — SENSOR / FIRING SOLUTION</p>
        <p className="font-mono text-[10px] text-slate-500">Very Difficult (12+) // 2300AD B3 p.55</p>

        <div className="flex gap-2">
          <button onClick={() => setSensorMode('handoff')} className={`flex-1 py-1.5 text-xs font-mono border rounded ${sensorMode === 'handoff' ? 'border-emerald-500 text-emerald-300 bg-emerald-900/30' : 'border-slate-700 text-slate-400'}`}>
            Sensor Hand-off
          </button>
          <button onClick={() => setSensorMode('self')} className={`flex-1 py-1.5 text-xs font-mono border rounded ${sensorMode === 'self' ? 'border-emerald-500 text-emerald-300 bg-emerald-900/30' : 'border-slate-700 text-slate-400'}`}>
            Self-Generated (DM−2)
          </button>
        </div>

        {(sensorMode === 'handoff' ? ownerBudget.sensor_operator : ownerBudget.remote_pilot) <= 0 && (
          <p className="font-mono text-[10px] text-red-400">
            {sensorMode === 'handoff' ? 'Sensor Operator' : 'Remote Pilot'} has no actions left this round.
          </p>
        )}
        <DmBreakdown rows={step1Dms.rows} total={step1Dms.total} />
        <RollBlock dm={step1Dms.total} onRoll={rollStep1} onManual={manualStep1} result={step1Result} target={12}
          disabled={(sensorMode === 'handoff' ? ownerBudget.sensor_operator : ownerBudget.remote_pilot) <= 0} />

        <div className="flex gap-2 pt-1">
          <button onClick={() => setStep(STEP_PD)} className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">← BACK</button>
          <button onClick={() => setStep(STEP_PILOT)} disabled={!step1Result || ownerBudget.remote_pilot <= 0} className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            NEXT → PILOT
          </button>
        </div>
        {step1Result && ownerBudget.remote_pilot <= 0 && (
          <p className="font-mono text-[10px] text-red-400">Remote Pilot has no actions left this round — Firing Solution can't continue.</p>
        )}
      </div>
    )
  }

  // ── STEP_PILOT ───────────────────────────────────────────────────────────────

  if (step === STEP_PILOT) {
    return (
      <div className="p-5 space-y-3">
        <p className="font-display text-xs text-slate-500 tracking-widest uppercase">STEP 2 — POSITION VESSEL (Remote Pilot)</p>
        <p className="font-mono text-[10px] text-slate-500">Difficult (10+) · Electronics (remote ops) · DEX // 2300AD B3 p.55–56</p>

        {step1CarryEffect > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-sky-950/50 border border-sky-800/60 rounded text-xs font-mono">
            <span className="text-sky-400">Step 1 Effect {fmtDm(step1Result.effect)}</span>
            <span className="text-slate-500">→ carry</span>
            <span className="text-sky-300">DM{fmtDm(step1CarryEffect)}</span>
          </div>
        )}

        {ownerBudget.remote_pilot <= 0 && (
          <p className="font-mono text-[10px] text-red-400">Remote Pilot has no actions left this round.</p>
        )}
        <DmBreakdown rows={step2Dms.rows} total={step2Dms.total} />
        <RollBlock dm={step2Dms.total} onRoll={rollStep2} onManual={manualStep2} result={step2Result} target={10} disabled={ownerBudget.remote_pilot <= 0} />

        <div className="flex gap-2 pt-1">
          <button onClick={() => { setStep(STEP_SENSOR); setStep2Result(null) }} className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">← BACK</button>
          <button onClick={() => setStep(STEP_GUNNER)} disabled={!step2Result || ownerBudget.remote_pilot <= 0} className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            NEXT → GUNNER
          </button>
        </div>
        {step2Result && ownerBudget.remote_pilot <= 0 && (
          <p className="font-mono text-[10px] text-red-400">Remote Pilot has no actions left this round — Firing Solution can't continue.</p>
        )}
      </div>
    )
  }

  // ── STEP_GUNNER ──────────────────────────────────────────────────────────────

  const hit = step3Result?.total >= 10
  const effect = step3Result?.effect ?? 0
  const critThreshold = owner.improveCriticalThreshold ?? 6

  return (
    <div className="p-5 space-y-3">
      <p className="font-display text-xs text-slate-500 tracking-widest uppercase">STEP 3 — GUNNER · {weapon.name}</p>
      <p className="font-mono text-[10px] text-slate-500">Difficult (10+) // 2300AD B3 p.56</p>

      {weapon.detonationMode && !step3Result && (
        <label className="flex items-center gap-2 text-xs font-mono text-amber-400">
          <input type="checkbox" checked={detonationMode} onChange={(e) => setDetonationMode(e.target.checked)} />
          Use detonation mode ({weapon.detonationMode.damage}, single-use)
        </label>
      )}

      {step2CarryEffect > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-sky-950/50 border border-sky-800/60 rounded text-xs font-mono">
          <span className="text-sky-400">Step 2 Effect {fmtDm(step2Result.effect)}</span>
          <span className="text-slate-500">→ carry</span>
          <span className="text-sky-300">DM{fmtDm(step2CarryEffect)}</span>
        </div>
      )}

      {critThreshold < 6 && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-red-950/40 border border-red-800/60 rounded text-xs font-mono">
          <span className="text-red-400">Improve Critical active</span>
          <span className="text-slate-400">— this shot crits at Effect {critThreshold}+ instead of 6+ // B3 p.54</span>
        </div>
      )}

      {ownerBudget.remote_pilot <= 0 && (
        <p className="font-mono text-[10px] text-red-400">Remote Pilot has no actions left this round.</p>
      )}
      <DmBreakdown rows={step3Dms.rows} total={step3Dms.total} />
      <RollBlock dm={step3Dms.total} onRoll={rollStep3} onManual={manualStep3} result={step3Result} target={10} disabled={ownerBudget.remote_pilot <= 0} />

      {hit && damageResult && (
        <div className="bg-red-950/40 border border-red-900/60 rounded px-3 py-2 space-y-1.5">
          <p className="font-display text-xs text-red-400 tracking-widest uppercase">Damage</p>
          <p className="font-mono text-xs text-slate-300">
            {weapon.name}: {damageResult.rolls.join('+')}{damageResult.bonus !== 0 ? ` ${fmtDm(damageResult.bonus)}` : ''} = {damageResult.gross}
          </p>
          <p className="font-mono text-xs text-slate-400">
            ARM {damageResult.armour} → Net: <span className="text-red-400 font-bold">{damageResult.net}</span>
          </p>
          {getEasyTargetDamageMultiplier(target) > 1 && (
            <p className="text-amber-400 font-mono text-xs">×2 damage — stationary/reaction-drive target // B3 p.56</p>
          )}
          {isSurfaceFixtureDamage(effect) && !isInternalCriticalHit(effect, damageResult.net, target.currentHull, critThreshold) && (
            <p className="text-amber-400 font-mono text-xs">⚠ Effect ≥ 3 — Surface Fixture roll // B3 p.58</p>
          )}
          {isInternalCriticalHit(effect, damageResult.net, target.currentHull, critThreshold) && (
            <p className="text-red-400 font-mono text-xs">⚠ INTERNAL CRITICAL HIT — roll on location table // B3 p.58</p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => { setStep(STEP_PILOT); setStep3Result(null); setDamageResult(null) }} className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">← BACK</button>
        {step3Result && !hit && (
          <button onClick={applyMiss} className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded transition-colors">MISS — CLOSE</button>
        )}
        {hit && damageResult && (
          <button onClick={applyResults} className="flex-1 py-2 text-xs font-display tracking-widest text-red-400 border border-red-700 hover:bg-red-900/20 rounded transition-colors">
            APPLY DAMAGE
          </button>
        )}
      </div>
    </div>
  )
}

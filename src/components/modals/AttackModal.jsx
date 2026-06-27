/**
 * AttackModal — 3-step Firing Solution per 2300AD B3 p.56.
 * Step 1: Sensor Op, Very Difficult (12+) Electronics(sensors) INT.
 * Step 2: Pilot, Difficult (10+) Pilot DEX.
 * Step 3: Gunner, Difficult (10+) Gunner INT.
 * Each step's positive Effect carries as DM to the next step.
 */

import { useState, useMemo } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore }     from '../../store/uiStore.js'
import { WEAPONS }        from '../../data/weapons.js'
import { SENSOR_TIME_LAG_DM } from '../../data/rangeBands.js'
import { pairKey }        from '../../utils/rangeBands.js'
import { getAssignedSkill, getAssignedCharacteristic } from '../../utils/crew.js'
import { getCharDM, roll2D6 } from '../../utils/dice.js'
import { getRangeDM, rollDamage, isSurfaceFixtureDamage, isInternalCriticalHit, getWeaponTraitAttackDm, computeEffectiveSignature } from '../../utils/combat.js'
import { DiceInput } from '../forms/DiceInput.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_SETUP  = 0
const STEP_SENSOR = 1
const STEP_PILOT  = 2
const STEP_GUNNER = 3
const STEP_DAMAGE = 4

const STEP_LABELS = {
  [STEP_SENSOR]: 'STEP 1 — SENSOR OPERATOR',
  [STEP_PILOT]:  'STEP 2 — PILOT',
  [STEP_GUNNER]: 'STEP 3 — GUNNER',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFireControlDm(software) {
  if (!software) return 0
  if (software.includes('fire_control_3')) return 3
  if (software.includes('fire_control_2')) return 2
  if (software.includes('fire_control_1')) return 1
  return 0
}

function fmtDm(n) {
  return n >= 0 ? `+${n}` : `${n}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {[STEP_SENSOR, STEP_PILOT, STEP_GUNNER].map((s) => (
        <div key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            current > s  ? 'bg-emerald-600' :
            current === s ? 'bg-(--neon-cyan)' :
                            'bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

function RollBlock({ dm, onRoll, onManual, result, target }) {
  const [showManual, setShowManual] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1.5 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors"
          onClick={onRoll}
        >
          ROLL 2D6
        </button>
        <button
          className="text-xs font-mono text-slate-500 hover:text-slate-400 transition-colors underline"
          onClick={() => setShowManual((v) => !v)}
        >
          {showManual ? 'hide' : 'enter manually'}
        </button>
      </div>

      {showManual && <DiceInput dm={dm} onChange={onManual} />}

      {result !== null && (
        <div className={`rounded px-3 py-2 border text-xs font-mono space-y-0.5
          ${result.total >= target ? 'bg-emerald-950/60 border-emerald-800' : 'bg-red-950/40 border-red-900/60'}`}>
          <div className="flex items-center justify-between">
            <span className="font-display tracking-widest text-sm">
              {result.total >= target
                ? <span className="text-emerald-400">SUCCESS</span>
                : <span className="text-red-400">FAILURE</span>}
            </span>
            <span className="text-slate-400">
              {result.dice[0]}+{result.dice[1]}{dm !== 0 ? ` ${fmtDm(dm)}` : ''} = {result.total}
            </span>
          </div>
          <div className="text-slate-400">
            Effect: <span className={result.effect >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {fmtDm(result.effect)}
            </span>
            {result.effect > 0 && (
              <span className="ml-2 text-sky-400">→ carries as DM to next step</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AttackModal({ payload, onClose }) {
  const { attackerId } = payload ?? {}
  const ships          = useBattleStore((s) => s.ships)
  const rangeBands     = useBattleStore((s) => s.rangeBands)
  const leadingFireDm  = useBattleStore((s) => s.leadingFireDm)
  const applyDamage    = useBattleStore((s) => s.applyDamage)
  const addCritical    = useBattleStore((s) => s.addCriticalHit)
  const { openModal }  = useUIStore()

  const attacker = ships.find((s) => s.id === attackerId) ?? ships[0]
  const targets  = ships.filter((s) => s.id !== attacker?.id && !s.isDestroyed)

  const [step,          setStep]          = useState(STEP_SETUP)
  const [targetId,      setTargetId]      = useState(targets[0]?.id ?? '')
  const [weaponIdx,     setWeaponIdx]     = useState(0)
  const [weaponCount,   setWeaponCount]   = useState(1)
  const [evasionDm,     setEvasionDm]     = useState(0)  // set by GM from target's evasion result
  const [step1Result,   setStep1Result]   = useState(null)
  const [step2Result,   setStep2Result]   = useState(null)
  const [step3Result,   setStep3Result]   = useState(null)
  const [damageResult,  setDamageResult]  = useState(null)
  const [applied,       setApplied]       = useState(false)

  const target  = ships.find((s) => s.id === targetId)
  const bandKey = attacker && target ? pairKey(attacker.id, target.id) : null
  const band    = bandKey ? (rangeBands[bandKey] ?? 'Long') : 'Long'

  const shipWeapons = attacker?.weapons ?? []
  const weaponSlot  = shipWeapons[weaponIdx] ?? { weaponId: 'll98', count: 1, label: '' }
  const weaponId    = weaponSlot.weaponId
  const weapon      = WEAPONS[weaponId]

  // ── DM calculations ────────────────────────────────────────────────────────

  const step1Dms = useMemo(() => {
    if (!attacker || !target) return { rows: [], total: 0 }
    const sensorSkill = getAssignedSkill('sensor_operator', attacker.crewAssignments, attacker.crew)
    const intChar     = getAssignedCharacteristic('sensor_operator', attacker.crewAssignments, attacker.crew)
    const intDm       = getCharDM(intChar)
    const sig       = computeEffectiveSignature(target) // // 2300AD B3 p.57
    const sensorQDm = attacker.sensors?.dm ?? 0
    const timeLagDm = SENSOR_TIME_LAG_DM[band] ?? 0
    const total = sensorSkill + intDm + sig.effective + sensorQDm + timeLagDm
    const sigLabel = sig.delta !== 0
      ? `Target Signature (${sig.base}${sig.delta > 0 ? '+' : ''}${sig.delta})`
      : 'Target Signature'
    return {
      rows: [
        ['Sensors skill',      sensorSkill],
        ['INT DM',             intDm],
        [sigLabel,             sig.effective],
        ['Sensor quality',     sensorQDm],
        [`Time-lag (${band})`, timeLagDm],
      ],
      total,
    }
  }, [attacker, target, band])

  const step1CarryEffect = step1Result ? Math.max(0, step1Result.effect) : 0

  const step2Dms = useMemo(() => {
    if (!attacker) return { rows: [], total: 0 }
    const pilotSkill = getAssignedSkill('pilot', attacker.crewAssignments, attacker.crew)
    const dexChar    = getAssignedCharacteristic('pilot', attacker.crewAssignments, attacker.crew, 'DEX')
    const dexDm      = getCharDM(dexChar)
    const tacSpeed   = attacker.currentTacSpeed ?? attacker.tacSpeed ?? 1
    const total = pilotSkill + dexDm + tacSpeed + step1CarryEffect
    return {
      rows: [
        ['Pilot skill',       pilotSkill],
        ['DEX DM',            dexDm],
        ['TAC Speed',         tacSpeed],
        ['Carry (Step 1)',    step1CarryEffect],
      ],
      total,
    }
  }, [attacker, step1CarryEffect])

  const step2CarryEffect = step2Result ? Math.max(0, step2Result.effect) : 0

  const step3Dms = useMemo(() => {
    if (!attacker || !weapon) return { rows: [], total: 0 }
    const gunnerSkill    = getAssignedSkill('gunner_turret', attacker.crewAssignments, attacker.crew)
    const intChar        = getAssignedCharacteristic('gunner_turret', attacker.crewAssignments, attacker.crew)
    const intDm          = getCharDM(intChar)
    const fireControlDm  = getFireControlDm(attacker.software)
    const rangeDm        = getRangeDM(weaponId, band)
    const weaponTraitDm  = getWeaponTraitAttackDm(weapon.traits) // Accurate +1, Slow −2 // B3 p.59
    // EW penalty: find any ship currently jamming the attacker // B3 p.55
    const jammer = ships.find((s) => s.ewTarget === attacker.id)
    const jammerPenalty = jammer?.ewEffect ?? 0 // already negative
    const total = gunnerSkill + intDm + fireControlDm + rangeDm + step2CarryEffect + evasionDm + weaponTraitDm + jammerPenalty + leadingFireDm
    return {
      rows: [
        ['Gunner skill',      gunnerSkill],
        ['INT DM',            intDm],
        ['Fire Control',      fireControlDm],
        [`Range (${band})`,   rangeDm],
        ['Carry (Step 2)',    step2CarryEffect],
        ['Evasion penalty',   evasionDm],
        ['Weapon trait',      weaponTraitDm],
        ...(jammerPenalty !== 0 ? [['EW jamming',       jammerPenalty]] : []),
        ...(leadingFireDm  !== 0 ? [['Leading Fire',    leadingFireDm]] : []),
      ],
      total,
    }
  }, [attacker, weaponId, band, step2CarryEffect, evasionDm, weapon, ships, leadingFireDm])

  // ── Roll handlers ──────────────────────────────────────────────────────────

  function rollStep1() {
    const dice   = roll2D6()
    const base   = dice[0] + dice[1]
    const total  = base + step1Dms.total
    const effect = total - 12  // Very Difficult
    setStep1Result({ dice, base, total, effect })
  }

  function manualStep1({ dice, total }) {
    setStep1Result({ dice, base: dice[0] + dice[1], total, effect: total - 12 })
  }

  function rollStep2() {
    const dice   = roll2D6()
    const base   = dice[0] + dice[1]
    const total  = base + step2Dms.total
    const effect = total - 10  // Difficult
    setStep2Result({ dice, base, total, effect })
  }

  function manualStep2({ dice, total }) {
    setStep2Result({ dice, base: dice[0] + dice[1], total, effect: total - 10 })
  }

  function rollStep3() {
    const dice   = roll2D6()
    const base   = dice[0] + dice[1]
    const total  = base + step3Dms.total
    const effect = total - 10  // Difficult
    setStep3Result({ dice, base, total, effect })
    if (total >= 10) {
      const dmgResult = rollDamage(weaponId, weaponCount, target?.currentArmour ?? 0)
      setDamageResult(dmgResult)
    }
  }

  function manualStep3({ dice, total }) {
    const effect = total - 10
    setStep3Result({ dice, base: dice[0] + dice[1], total, effect })
    if (total >= 10) {
      const dmgResult = rollDamage(weaponId, weaponCount, target?.currentArmour ?? 0)
      setDamageResult(dmgResult)
    }
  }

  function applyResults() {
    if (!damageResult || !target || applied) return
    applyDamage(target.id, damageResult.net, attacker?.id)
    const effect = step3Result?.effect ?? 0
    if (isSurfaceFixtureDamage(effect)) {
      openModal('critical-hit', { shipId: target.id, mode: 'surface', effect })
    } else if (isInternalCriticalHit(effect, damageResult.net, target.currentHull)) {
      openModal('critical-hit', { shipId: target.id, mode: 'internal' })
    }
    setApplied(true)
    onClose()
  }

  // ── Early exit ─────────────────────────────────────────────────────────────

  if (!attacker) {
    return (
      <div className="p-6">
        <p className="text-slate-400 font-mono text-sm">No ships in battle.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-xs font-display text-slate-300 border border-slate-600 rounded">CLOSE</button>
      </div>
    )
  }

  // ── Setup screen ───────────────────────────────────────────────────────────

  if (step === STEP_SETUP) {
    return (
      <div className="p-5 space-y-4">
        <div>
          <p className="font-display text-xs text-slate-500 tracking-widest uppercase mb-0.5">FIRING SOLUTION</p>
          <p className="font-display text-(--neon-cyan) text-base tracking-widest">
            {attacker.profile?.name ?? attacker.id}
          </p>
        </div>

        {/* Target selection */}
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">TARGET</p>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-(--neon-cyan)/60 outline-none"
          >
            {targets.map((t) => <option key={t.id} value={t.id}>{t.profile?.name ?? t.id}</option>)}
          </select>
          {target && (
            <p className="font-mono text-[10px] text-slate-500">
              Range: <span className="text-slate-300">{band}</span>
              {' '}· Signature: <span className="text-sky-400">+{computeEffectiveSignature(target).effective}</span>
              {' '}· Hull: <span className="text-slate-300">{target.currentHull}/{target.hullPoints}</span>
              {' '}· Armour: <span className="text-slate-300">{target.currentArmour ?? target.armour ?? 0}</span>
            </p>
          )}
        </div>

        {/* Weapon selection */}
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">WEAPON</p>
          {shipWeapons.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={weaponIdx}
                onChange={(e) => setWeaponIdx(Number(e.target.value))}
                className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-(--neon-cyan)/60 outline-none"
              >
                {shipWeapons.map((w, i) => (
                  <option key={i} value={i}>
                    {WEAPONS[w.weaponId]?.name ?? w.weaponId}
                    {w.label ? ` — ${w.label}` : ''}
                  </option>
                ))}
              </select>
              <select
                value={weaponCount}
                onChange={(e) => setWeaponCount(Number(e.target.value))}
                className="w-16 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-(--neon-cyan)/60 outline-none"
              >
                <option value={1}>×1</option>
                <option value={2}>×2</option>
                <option value={3}>×3</option>
              </select>
            </div>
          ) : (
            <p className="text-red-400 font-mono text-xs">No weapons mounted.</p>
          )}
          {weapon && (
            <p className="font-mono text-[10px] text-slate-500">
              {weapon.damage}{weaponCount > 1 ? ` (×${weaponCount})` : ''}
              {weapon.traits.length > 0 ? ` · ${weapon.traits.join(', ')}` : ''}
            </p>
          )}
        </div>

        {/* Evasion DM (GM entry from target's evasion result) */}
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">
            TARGET EVASION DM <span className="text-slate-600 normal-case">(from opposed Pilot check // B3 p.55)</span>
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={-10} max={0} value={evasionDm}
              onChange={(e) => setEvasionDm(Math.min(0, Number(e.target.value) || 0))}
              className="w-20 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-(--neon-cyan)/60 outline-none"
            />
            <span className="font-mono text-[10px] text-slate-500">0 if no evasion; −1/−2 per B3 p.55 Effect table</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
            CANCEL
          </button>
          <button onClick={() => setStep(STEP_SENSOR)}
            disabled={!target || !weapon}
            className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            BEGIN FIRING SOLUTION →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 1: Sensor Operator ────────────────────────────────────────────────

  if (step === STEP_SENSOR) {
    return (
      <div className="p-5 space-y-3">
        <StepIndicator current={STEP_SENSOR} />
        <div>
          <p className="font-display text-xs text-slate-500 tracking-widest uppercase">{STEP_LABELS[STEP_SENSOR]}</p>
          <p className="font-mono text-[10px] text-slate-500 mt-0.5">
            Very Difficult (12+) · Electronics (sensors) · INT // 2300AD B3 p.56
          </p>
        </div>

        <DmBreakdown rows={step1Dms.rows} total={step1Dms.total} />

        <RollBlock
          dm={step1Dms.total}
          onRoll={rollStep1}
          onManual={manualStep1}
          result={step1Result}
          target={12}
        />

        <div className="flex gap-2 pt-1">
          <button onClick={() => setStep(STEP_SETUP)}
            className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
            ← BACK
          </button>
          <button
            onClick={() => setStep(STEP_PILOT)}
            disabled={!step1Result}
            className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            NEXT → PILOT
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Pilot ──────────────────────────────────────────────────────────

  if (step === STEP_PILOT) {
    return (
      <div className="p-5 space-y-3">
        <StepIndicator current={STEP_PILOT} />
        <div>
          <p className="font-display text-xs text-slate-500 tracking-widest uppercase">{STEP_LABELS[STEP_PILOT]}</p>
          <p className="font-mono text-[10px] text-slate-500 mt-0.5">
            Difficult (10+) · Pilot · DEX // 2300AD B3 p.56
          </p>
        </div>

        {step1CarryEffect > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-sky-950/50 border border-sky-800/60 rounded text-xs font-mono">
            <span className="text-sky-400">Step 1 Effect {fmtDm(step1Result.effect)}</span>
            <span className="text-slate-500">→ carry</span>
            <span className="text-sky-300">DM{fmtDm(step1CarryEffect)}</span>
          </div>
        )}

        <DmBreakdown rows={step2Dms.rows} total={step2Dms.total} />

        <RollBlock
          dm={step2Dms.total}
          onRoll={rollStep2}
          onManual={manualStep2}
          result={step2Result}
          target={10}
        />

        <div className="flex gap-2 pt-1">
          <button onClick={() => { setStep(STEP_SENSOR); setStep2Result(null) }}
            className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
            ← BACK
          </button>
          <button
            onClick={() => setStep(STEP_GUNNER)}
            disabled={!step2Result}
            className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            NEXT → GUNNER
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Gunner ─────────────────────────────────────────────────────────

  if (step === STEP_GUNNER) {
    const hit    = step3Result?.total >= 10
    const effect = step3Result?.effect ?? 0

    return (
      <div className="p-5 space-y-3">
        <StepIndicator current={STEP_GUNNER} />
        <div>
          <p className="font-display text-xs text-slate-500 tracking-widest uppercase">{STEP_LABELS[STEP_GUNNER]}</p>
          <p className="font-mono text-[10px] text-slate-500 mt-0.5">
            Difficult (10+) · Gunner · INT · {weapon?.name ?? weaponId} // 2300AD B3 p.56
          </p>
        </div>

        {step2CarryEffect > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-sky-950/50 border border-sky-800/60 rounded text-xs font-mono">
            <span className="text-sky-400">Step 2 Effect {fmtDm(step2Result.effect)}</span>
            <span className="text-slate-500">→ carry</span>
            <span className="text-sky-300">DM{fmtDm(step2CarryEffect)}</span>
          </div>
        )}

        <DmBreakdown rows={step3Dms.rows} total={step3Dms.total} />

        <RollBlock
          dm={step3Dms.total}
          onRoll={rollStep3}
          onManual={manualStep3}
          result={step3Result}
          target={10}
        />

        {/* Damage result */}
        {hit && damageResult && (
          <div className="bg-red-950/40 border border-red-900/60 rounded px-3 py-2 space-y-1.5">
            <p className="font-display text-xs text-red-400 tracking-widest uppercase">Damage</p>
            <p className="font-mono text-xs text-slate-300">
              {weapon?.name}: {damageResult.rolls.join('+')}
              {damageResult.bonus !== 0 ? ` ${fmtDm(damageResult.bonus)}` : ''} = {damageResult.gross}
            </p>
            <p className="font-mono text-xs text-slate-400">
              ARM {damageResult.armour} → Net: <span className="text-red-400 font-bold">{damageResult.net}</span>
            </p>
            {isSurfaceFixtureDamage(effect) && !isInternalCriticalHit(effect, damageResult.net, target?.currentHull ?? 999) && (
              <p className="text-amber-400 font-mono text-xs">⚠ Effect ≥ 3 — Surface Fixture roll // B3 p.58</p>
            )}
            {isInternalCriticalHit(effect, damageResult.net, target?.currentHull ?? 999) && (
              <p className="text-red-400 font-mono text-xs">⚠ INTERNAL CRITICAL HIT — roll on location table // B3 p.58</p>
            )}
          </div>
        )}

        {step3Result && !hit && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setStep(STEP_PILOT); setStep3Result(null); setDamageResult(null) }}
              className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
              ← BACK
            </button>
            <button onClick={onClose}
              className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded transition-colors">
              MISS — CLOSE
            </button>
          </div>
        )}

        {!step3Result && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setStep(STEP_PILOT); setStep3Result(null); setDamageResult(null) }}
              className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
              ← BACK
            </button>
          </div>
        )}

        {hit && damageResult && (
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-600 hover:border-slate-500 rounded transition-colors">
              SKIP
            </button>
            <button onClick={applyResults}
              className="flex-1 py-2 text-xs font-display tracking-widest text-red-400 border border-red-700 hover:bg-red-900/20 rounded transition-colors">
              APPLY DAMAGE
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}

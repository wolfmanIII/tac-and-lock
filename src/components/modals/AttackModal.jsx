import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { WEAPONS, WEAPON_IDS } from '../../data/weapons.js'
import { pairKey } from '../../utils/rangeBands.js'
import { computeAttackDMs, rollAttack, rollDamage, isCriticalHit } from '../../utils/combat.js'
import { DiceInput } from '../forms/DiceInput.jsx'

export function AttackModal({ payload, onClose }) {
  const { attackerId } = payload ?? {}
  const ships      = useBattleStore((s) => s.ships)
  const rangeBands = useBattleStore((s) => s.rangeBands)
  const applyDamage   = useBattleStore((s) => s.applyDamage)
  const addCritical   = useBattleStore((s) => s.addCriticalHit)
  const { openModal } = useUIStore()

  const attacker = ships.find((s) => s.id === attackerId) ?? ships[0]
  const targets  = ships.filter((s) => s.id !== attacker?.id && !s.isDestroyed)

  const [targetId,   setTargetId]   = useState(targets[0]?.id ?? '')
  const [weaponId,   setWeaponId]   = useState(attacker?.weapons?.[0]?.weaponId ?? WEAPON_IDS[0])
  const [weaponCount, setWeaponCount] = useState(1)
  const [manualMode, setManualMode] = useState(false)
  const [attackResult, setAttackResult] = useState(null)
  const [damageResult, setDamageResult] = useState(null)

  const target  = ships.find((s) => s.id === targetId)
  const bandKey = attacker && target ? pairKey(attacker.id, target.id) : null
  const band    = bandKey ? (rangeBands[bandKey] ?? 'Long') : 'Long'
  const weapon  = WEAPONS[weaponId]

  // Compute DMs
  const dms = attacker && target ? computeAttackDMs({
    gunnerSkill:    1,  // simplified: 1 if gunner assigned
    weaponId,
    rangeBand:      band,
    sensorLockDm:   target?.sensorLocked ? 1 : 0,
    evasiveDm:      -(target?.evasionSpent ?? 0),
    targetSizeDm:   0,
  }) : { dms: {}, total: 0 }

  function doRoll() {
    const result = rollAttack(dms.total)
    setAttackResult(result)
    if (result.success) {
      const dmgResult = rollDamage(weaponId, weaponCount, target?.currentArmour ?? 0)
      setDamageResult(dmgResult)
    } else {
      setDamageResult(null)
    }
  }

  function onManualAttack({ total }) {
    const effect  = total - 8
    const success = total >= 8
    setAttackResult({ total, success, effect, dice: [], base: 0, totalDm: dms.total })
    if (success) {
      const dmgResult = rollDamage(weaponId, weaponCount, target?.currentArmour ?? 0)
      setDamageResult(dmgResult)
    } else {
      setDamageResult(null)
    }
  }

  function applyResults() {
    if (!damageResult || !target) return
    applyDamage(target.id, damageResult.net, attacker?.id)
    if (isCriticalHit(attackResult.effect, damageResult.net, target.currentHull)) {
      openModal('critical-hit', { shipId: target.id })
    }
    onClose()
  }

  if (!attacker) return (
    <div className="p-6">
      <p className="text-slate-400 font-mono text-sm">No ships in battle.</p>
      <button onClick={onClose} className="mt-4 px-4 py-2 text-xs font-display text-slate-300 border border-slate-600 rounded">CLOSE</button>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <p className="font-display text-sky-300 text-sm tracking-widest">ATTACK ROLL</p>
      <p className="text-[10px] font-mono text-slate-500">2D6 + DMs ≥ 8 to hit // Trav2022 CRB p.163</p>

      {/* Attacker / Target */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">ATTACKER</p>
          <p className="text-sm font-mono text-slate-200">{attacker.profile?.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">TARGET</p>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none"
          >
            {targets.map((t) => <option key={t.id} value={t.id}>{t.profile?.name}</option>)}
          </select>
        </div>
      </div>

      {/* Weapon */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">WEAPON</p>
        <div className="flex gap-2">
          <select
            value={weaponId}
            onChange={(e) => setWeaponId(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none"
          >
            {(attacker.weapons?.length > 0 ? attacker.weapons : [{ weaponId: WEAPON_IDS[0], label: 'Unknown' }]).map((w) => (
              <option key={w.weaponId} value={w.weaponId}>{WEAPONS[w.weaponId]?.name ?? w.weaponId} ×{w.count}</option>
            ))}
          </select>
          <select
            value={weaponCount}
            onChange={(e) => setWeaponCount(Number(e.target.value))}
            className="w-16 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none"
          >
            <option value={1}>×1</option>
            <option value={2}>×2</option>
            <option value={3}>×3</option>
          </select>
        </div>
      </div>

      {/* DM breakdown */}
      <div className="bg-slate-800/50 rounded p-3 space-y-1">
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">
          RANGE: {band} | DM TOTAL: <span className={dms.total >= 0 ? 'text-emerald-400' : 'text-red-400'}>{dms.total >= 0 ? '+' : ''}{dms.total}</span>
        </p>
        {Object.entries(dms.dms).filter(([, v]) => v !== 0).map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">{k}</span>
            <span className={v > 0 ? 'text-emerald-400' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span>
          </div>
        ))}
      </div>

      {/* Roll */}
      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 text-xs font-display tracking-widest text-sky-300 border border-sky-700 hover:bg-sky-900/30 rounded"
          onClick={doRoll}
        >
          ROLL DICE
        </button>
        <button
          className="text-xs font-mono text-slate-400 underline"
          onClick={() => setManualMode((m) => !m)}
        >
          {manualMode ? 'hide manual' : 'enter manually'}
        </button>
      </div>

      {manualMode && <DiceInput dm={dms.total} onChange={onManualAttack} />}

      {/* Result */}
      {attackResult && (
        <div className={`rounded p-3 border ${attackResult.success ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-900'}`}>
          <div className="flex items-center justify-between">
            <p className="font-display text-sm tracking-widest">
              {attackResult.success
                ? <span className="text-emerald-400">HIT — Effect {attackResult.effect}</span>
                : <span className="text-red-400">MISS — Effect {attackResult.effect}</span>}
            </p>
            <span className="text-slate-400 font-mono text-sm">{attackResult.total}</span>
          </div>

          {attackResult.success && damageResult && (
            <div className="mt-2 space-y-1 text-xs font-mono">
              <p className="text-slate-300">
                Damage: <span className="text-red-400">{damageResult.rolls.join('+')}
                {damageResult.bonus ? ` +${damageResult.bonus}` : ''} = {damageResult.gross}</span>
                {' '}− ARM {damageResult.armour} = <span className="text-red-300 font-bold">{damageResult.net} net</span>
              </p>
              {isCriticalHit(attackResult.effect, damageResult.net, target?.currentHull ?? 999) && (
                <p className="text-amber-400">⚠ CRITICAL HIT — roll on critical table</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>
          CANCEL
        </button>
        {attackResult?.success && damageResult && (
          <button className="flex-1 py-2 text-xs font-display tracking-widest text-red-400 border border-red-700 hover:bg-red-900/20 rounded" onClick={applyResults}>
            APPLY DAMAGE
          </button>
        )}
      </div>
    </div>
  )
}

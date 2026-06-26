import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { computeMissileAttackDM, rollMissileAttack, resolvePointDefence } from '../../utils/missiles.js'
import { rollDamage, isSurfaceFixtureDamage, isInternalCriticalHit } from '../../utils/combat.js'
import { useUIStore } from '../../store/uiStore.js'
import { DiceInput } from '../forms/DiceInput.jsx'

export function MissileImpactModal({ payload, onClose }) {
  const { salvoId } = payload ?? {}
  const ships           = useBattleStore((s) => s.ships)
  const missiles        = useBattleStore((s) => s.missiles)
  const pending         = useBattleStore((s) => s.pendingMissileImpacts)
  const applyDamage     = useBattleStore((s) => s.applyDamage)
  const applyPD         = useBattleStore((s) => s.applyPointDefence)
  const resolveImpact   = useBattleStore((s) => s.resolveMissileImpact)
  const { openModal }   = useUIStore()

  const salvo  = [...missiles, ...pending].find((m) => m.id === salvoId)
  const target = ships.find((s) => s.id === salvo?.targetId)

  const [pdDestroyed, setPdDestroyed] = useState(0)
  const [attackResult, setAttackResult] = useState(null)
  const [damageResult, setDamageResult] = useState(null)
  const [manualMode,   setManualMode]   = useState(false)

  if (!salvo || !target) return (
    <div className="p-6">
      <p className="text-slate-400 font-mono text-sm">Salvo not found.</p>
      <button onClick={onClose} className="mt-4 px-4 py-2 text-xs font-display text-slate-300 border border-slate-600 rounded">CLOSE</button>
    </div>
  )

  const remaining = Math.max(0, (salvo.salvoRemaining ?? salvo.salvoSize) - pdDestroyed)
  const { dms, total: totalDm } = computeMissileAttackDM({
    salvoDmBonus: Math.max(0, remaining - 1),
    evasiveDm:   -(target.evasionSpent ?? 0),
  })

  function doRoll() {
    const result = rollMissileAttack(totalDm)
    setAttackResult(result)
    if (result.success && remaining > 0) {
      // Each missile in the salvo can hit; roll damage once (simplification)
      const dmg = rollDamage('missile_rack', 1, target.currentArmour ?? 0)
      setDamageResult(dmg)
    } else {
      setDamageResult(null)
    }
  }

  function onManualResult({ total }) {
    const effect  = total - 10  // Difficult (10+) // 2300AD B3 p.56
    const success = total >= 10
    setAttackResult({ total, success, effect, dice: [] })
    if (success && remaining > 0) {
      const dmg = rollDamage('missile_rack', 1, target.currentArmour ?? 0)
      setDamageResult(dmg)
    }
  }

  function applyResults() {
    if (!attackResult?.success || !damageResult) return
    if (pdDestroyed > 0) applyPD(salvoId, pdDestroyed)
    applyDamage(target.id, damageResult.net, salvo.attackerId)
    const effect = attackResult.effect
    if (isSurfaceFixtureDamage(effect) && !isInternalCriticalHit(effect, damageResult.net, target.currentHull)) {
      openModal('critical-hit', { shipId: target.id, mode: 'surface', effect })
    } else if (isInternalCriticalHit(effect, damageResult.net, target.currentHull)) {
      openModal('critical-hit', { shipId: target.id, mode: 'internal' })
    }
    resolveImpact(salvoId)
    onClose()
  }

  function resolveMiss() {
    if (pdDestroyed > 0) applyPD(salvoId, pdDestroyed)
    resolveImpact(salvoId)
    onClose()
  }

  return (
    <div className="p-6 space-y-4">
      <p className="font-display text-red-400 text-sm tracking-widest">💥 MISSILE IMPACT</p>

      <div className="bg-slate-800/50 rounded p-3 space-y-1 text-sm font-mono">
        <p><span className="text-slate-400">Target:</span> <span className="text-slate-200">{target.profile?.name}</span></p>
        <p><span className="text-slate-400">Salvo:</span> <span className="text-amber-400">{salvo.salvoSize}</span> missiles
          {' '}(<span className="text-slate-300">{remaining} remaining after PD</span>)
        </p>
      </div>

      {/* Point defence */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">POINT DEFENCE — missiles shot down</p>
        <div className="flex gap-2">
          {[0,1,2,3,4,5].map((n) => (
            <button key={n}
              className={`flex-1 py-1.5 text-xs font-mono border rounded ${pdDestroyed === n ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400'}`}
              onClick={() => setPdDestroyed(n)}>{n}</button>
          ))}
        </div>
      </div>

      {remaining > 0 && (
        <>
          <div className="bg-slate-800/50 rounded p-3 space-y-1">
            <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">ATTACK DM BREAKDOWN</p>
            {Object.entries(dms).filter(([, v]) => v !== 0).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">{k}</span>
                <span className={v > 0 ? 'text-emerald-400' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-1 flex justify-between text-sm font-mono font-bold">
              <span className="text-slate-300">Total DM</span>
              <span className={totalDm >= 0 ? 'text-emerald-400' : 'text-red-400'}>{totalDm >= 0 ? '+' : ''}{totalDm}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-xs font-display tracking-widest text-red-400 border border-red-800 hover:bg-red-900/20 rounded" onClick={doRoll}>ROLL ATTACK</button>
            <button className="text-xs font-mono text-slate-400 underline" onClick={() => setManualMode((m) => !m)}>manual</button>
          </div>
          {manualMode && <DiceInput dm={totalDm} onChange={onManualResult} />}
        </>
      )}

      {attackResult && (
        <div className={`rounded p-3 border ${attackResult.success ? 'bg-red-950/50 border-red-800' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex justify-between">
            <p className="font-display text-sm tracking-widest">
              {attackResult.success ? <span className="text-red-400">IMPACT — Effect {attackResult.effect}</span> : <span className="text-slate-300">EVADED</span>}
            </p>
            <span className="text-slate-400 font-mono">{attackResult.total}</span>
          </div>
          {attackResult.success && damageResult && (
            <p className="mt-1 text-xs font-mono text-slate-300">
              Damage: {damageResult.gross} − ARM {damageResult.armour} = <span className="text-red-300 font-bold">{damageResult.net}</span> net
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
          onClick={resolveMiss}>
          {remaining === 0 ? 'ALL SHOT DOWN' : 'MISS / SKIP'}
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

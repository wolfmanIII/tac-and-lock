/**
 * DroneLaunchModal — launch individually tracked combat drones/missiles.
 * // 2300AD B3 p.61 — no "salvo" abstraction; each unit is its own entity.
 * See doc/drone-combat-redesign-spec.md.
 */

import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { WEAPONS } from '../../data/weapons.js'
import { pairKey } from '../../utils/rangeBands.js'

export function DroneLaunchModal({ payload, onClose }) {
  const { attackerId } = payload ?? {}
  const ships       = useBattleStore((s) => s.ships)
  const rangeBands  = useBattleStore((s) => s.rangeBands)
  const launchDrone = useBattleStore((s) => s.launchDrone)

  const attacker = ships.find((s) => s.id === attackerId) ?? ships[0]
  const targets  = ships.filter((s) => s.id !== attacker?.id && !s.isDestroyed)

  // Only weapon slots that represent a drone/missile — engine-only flag, not a B3 trait
  const droneWeapons = (attacker?.weapons ?? []).filter((w) => WEAPONS[w.weaponId]?.launchable)

  const [targetId,   setTargetId]   = useState(targets[0]?.id ?? '')
  const [weaponIdx,  setWeaponIdx]  = useState(0)
  const [count,      setCount]      = useState(1)

  const target     = ships.find((s) => s.id === targetId)
  const weaponSlot = droneWeapons[weaponIdx]
  const weapon     = weaponSlot ? WEAPONS[weaponSlot.weaponId] : null
  const band       = attacker && target ? (rangeBands[pairKey(attacker.id, target.id)] ?? 'Long') : 'Long'

  function launch() {
    if (!target || !weapon) return
    for (let i = 0; i < count; i++) {
      launchDrone(attacker.id, target.id, weapon.id)
    }
    onClose()
  }

  if (!attacker) return null

  return (
    <div className="p-6 space-y-4">
      <p className="font-display text-amber-400 text-sm tracking-widest">LAUNCH DRONE</p>
      <p className="text-[10px] font-mono text-slate-500">2300AD B3 p.61 — each unit tracked individually</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">LAUNCHER</p>
          <p className="text-sm font-mono text-slate-200">{attacker.profile?.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">TARGET</p>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1 focus:border-sky-400 outline-none">
            {targets.map((t) => <option key={t.id} value={t.id}>{t.profile?.name}</option>)}
          </select>
        </div>
      </div>

      {droneWeapons.length === 0 ? (
        <p className="text-red-400 font-mono text-xs">No drone/missile weapons mounted.</p>
      ) : (
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-slate-500 tracking-widest uppercase">WEAPON</p>
          <select value={weaponIdx} onChange={(e) => setWeaponIdx(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-amber-400 outline-none">
            {droneWeapons.map((w, i) => (
              <option key={i} value={i}>{WEAPONS[w.weaponId]?.name ?? w.weaponId}{w.label ? ` — ${w.label}` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {weapon && (
        <div className="bg-slate-800/50 rounded p-3 grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] font-display text-slate-500 tracking-widest">LAUNCH BAND</p>
            <p className="text-sm font-mono text-slate-200">{band}</p>
          </div>
          <div>
            <p className="text-[10px] font-display text-slate-500 tracking-widest">TAC SPEED</p>
            <p className="text-sm font-mono text-slate-200">{weapon.tacSpeed ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-display text-slate-500 tracking-widest">ENDURANCE</p>
            <p className="text-sm font-mono text-slate-200">{weapon.enduranceRounds ?? '—'}R</p>
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">UNITS TO LAUNCH</p>
        <div className="flex gap-2">
          {[1,2,3,4,5,6].map((n) => (
            <button key={n}
              className={`flex-1 py-2 text-sm font-mono border rounded ${count === n ? 'border-amber-500 text-amber-300 bg-amber-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              onClick={() => setCount(n)}>{n}</button>
          ))}
        </div>
        <p className="text-[9px] font-mono text-slate-600 mt-1">Each unit closes range and attacks independently — no salvo bonus.</p>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>CANCEL</button>
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={launch}
          disabled={!target || !weapon}
        >
          LAUNCH 🚀
        </button>
      </div>
    </div>
  )
}

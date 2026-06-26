import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { pairKey } from '../../utils/rangeBands.js'
import { computeFlightRounds } from '../../utils/missiles.js'

export function MissileLaunchModal({ payload, onClose }) {
  const { attackerId } = payload ?? {}
  const ships        = useBattleStore((s) => s.ships)
  const rangeBands   = useBattleStore((s) => s.rangeBands)
  const launchMissiles = useBattleStore((s) => s.launchMissiles)
  const round        = useBattleStore((s) => s.round)

  const attacker = ships.find((s) => s.id === attackerId) ?? ships[0]
  const targets  = ships.filter((s) => s.id !== attacker?.id && !s.isDestroyed)

  const [targetId,   setTargetId]   = useState(targets[0]?.id ?? '')
  const [salvoSize,  setSalvoSize]  = useState(1)

  const target  = ships.find((s) => s.id === targetId)
  const band    = attacker && target ? (rangeBands[pairKey(attacker.id, target.id)] ?? 'Long') : 'Long'
  const flight  = computeFlightRounds(band)

  function launch() {
    if (!target) return
    launchMissiles(attacker.id, target.id, salvoSize)
    onClose()
  }

  if (!attacker) return null

  return (
    <div className="p-6 space-y-4">
      <p className="font-display text-amber-400 text-sm tracking-widest">MISSILE LAUNCH</p>
      <p className="text-[10px] font-mono text-slate-500">Trav2022 CRB p.169</p>

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

      <div className="bg-slate-800/50 rounded p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">LAUNCH BAND</p>
          <p className="text-sm font-mono text-slate-200">{band}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-display text-slate-500 tracking-widest">ROUNDS TO IMPACT</p>
          <p className={`text-sm font-mono ${flight === 0 ? 'text-red-400' : flight <= 2 ? 'text-amber-400' : 'text-slate-200'}`}>
            {flight === 0 ? 'IMMEDIATE' : `${flight} round${flight !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-2">SALVO SIZE</p>
        <div className="flex gap-2">
          {[1,2,3,4,5,6].map((n) => (
            <button key={n}
              className={`flex-1 py-2 text-sm font-mono border rounded ${salvoSize === n ? 'border-amber-500 text-amber-300 bg-amber-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              onClick={() => setSalvoSize(n)}>{n}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onClose}>CANCEL</button>
        <button className="flex-1 py-2 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded" onClick={launch}>
          LAUNCH 🚀
        </button>
      </div>
    </div>
  )
}

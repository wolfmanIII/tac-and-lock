import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'

export function MissileTracker() {
  const missiles     = useBattleStore((s) => s.missiles)
  const ships        = useBattleStore((s) => s.ships)
  const pendingImpacts = useBattleStore((s) => s.pendingMissileImpacts)
  const { openModal } = useUIStore()

  const shipName = (id) => ships.find((s) => s.id === id)?.profile?.name ?? id

  if (missiles.length === 0 && pendingImpacts.length === 0) return null

  return (
    <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/50">
      <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">MISSILES IN FLIGHT</p>
      <div className="flex flex-wrap gap-2">
        {missiles.filter((m) => !m.arrived).map((m) => (
          <div key={m.id} className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-amber-900/50 rounded px-2 py-0.5">
            <span className="text-amber-400">🚀</span>
            <span className="text-slate-300">{m.salvoRemaining}×</span>
            <span className="text-slate-400">{shipName(m.attackerId)} → {shipName(m.targetId)}</span>
            <span className="text-amber-300 font-bold">{m.roundsLeft}r</span>
          </div>
        ))}
        {pendingImpacts.map((m) => (
          <button
            key={m.id}
            className="flex items-center gap-1.5 text-xs font-mono bg-red-950 border border-red-600 rounded px-2 py-0.5 hover:bg-red-900 transition-colors animate-pulse"
            onClick={() => openModal('missile-impact', { salvoId: m.id })}
          >
            <span className="text-red-400">💥</span>
            <span className="text-red-300">{m.salvoRemaining}× IMPACT — {shipName(m.targetId)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

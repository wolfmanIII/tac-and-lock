import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { WEAPONS } from '../../data/weapons.js'

/** Displays individually tracked drones/missiles in flight. // 2300AD B3 p.61 */
export function DroneTracker() {
  const drones       = useBattleStore((s) => s.drones)
  const ships        = useBattleStore((s) => s.ships)
  const { openModal } = useUIStore()

  const shipName = (id) => ships.find((s) => s.id === id)?.profile?.name ?? id

  const active   = drones.filter((d) => !d.destroyed && !d.detonated)
  const inFlight = active.filter((d) => d.currentBand !== 'Close' && d.currentBand !== 'Adjacent')
  const inRange  = active.filter((d) => d.currentBand === 'Close' || d.currentBand === 'Adjacent')

  if (active.length === 0) return null

  return (
    <div>
      <h2 className="font-display text-xs tracking-widest mb-3 pb-1.5 border-b text-amber-400 border-amber-400/30">
        DRONES / MISSILES IN FLIGHT
      </h2>
      <div className="flex flex-wrap gap-2 mb-2">
        {inFlight.map((d) => (
          <div key={d.id} className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-amber-900/50 rounded px-2 py-0.5">
            <span className="text-amber-400">🚀</span>
            <span className="text-slate-300">{WEAPONS[d.weaponId]?.name ?? d.weaponId}</span>
            <span className="text-slate-400">{shipName(d.ownerId)} → {shipName(d.targetId)}</span>
            <span className="text-amber-300 font-bold">{d.currentBand}</span>
          </div>
        ))}
        {inRange.map((d) => (
          <button
            key={d.id}
            className="flex items-center gap-1.5 text-xs font-mono bg-red-950 border border-red-600 rounded px-2 py-0.5 hover:bg-red-900 transition-colors animate-pulse"
            onClick={() => openModal('drone-attack', { droneId: d.id })}
          >
            <span className="text-red-400">💥</span>
            <span className="text-red-300">{WEAPONS[d.weaponId]?.name ?? d.weaponId} IN RANGE — {shipName(d.ownerId)} → {shipName(d.targetId)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

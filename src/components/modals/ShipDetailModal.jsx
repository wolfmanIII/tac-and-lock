import { useBattleStore } from '../../store/battleStore.js'
import { WEAPONS } from '../../data/weapons.js'
import { CRITICAL_HIT_SYSTEM_LABELS, SURFACE_FIXTURE_SYSTEM_LABELS } from '../../data/criticalHits.js'
import { FACTION_COLOR } from '../../data/factions.js'
import { RANGE_BAND_ORDER } from '../../data/rangeBands.js'
import { pairKey } from '../../utils/rangeBands.js'

const SEV_COLOR = ['text-slate-500', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500', 'text-red-600', 'text-red-700']

export function ShipDetailModal({ payload, onClose }) {
  const { shipId } = payload ?? {}
  const ships      = useBattleStore((s) => s.ships)
  const rangeBands = useBattleStore((s) => s.rangeBands)
  const ship       = ships.find((s) => s.id === shipId)

  if (!ship) return (
    <div className="p-6">
      <p className="text-slate-400 font-mono text-sm">Ship not found.</p>
      <button onClick={onClose} className="mt-4 px-4 py-2 text-xs font-display text-slate-300 border border-slate-600 rounded">CLOSE</button>
    </div>
  )

  const p = ship.profile ?? {}
  const factionColor = FACTION_COLOR[ship.faction] ?? 'border-slate-600'

  const bandSummary = ships
    .filter((s) => s.id !== ship.id)
    .map((other) => {
      const key  = pairKey(ship.id, other.id)
      const band = rangeBands[key] ?? '—'
      return { name: other.profile?.name ?? other.id, band }
    })

  const crits          = Object.entries(ship.criticalTracks ?? {}).filter(([, sev]) => sev > 0)
  const surfaceHits    = Object.entries(ship.surfaceFixtureTracks ?? {}).filter(([, hits]) => hits > 0)
  const evasionDm      = ship.evasionDm ?? 0

  return (
    <div className="p-6 space-y-5" style={{ minWidth: 480, maxWidth: 600 }}>
      {/* Header */}
      <div className={`border-l-4 pl-3 ${factionColor}`}>
        <p className="font-display text-sky-300 text-base tracking-widest">{p.name}</p>
        <p className="text-xs font-mono text-slate-400">{p.class} · {ship.faction ?? '—'}</p>
        {ship.isDestroyed && <p className="text-[10px] font-display text-red-500 tracking-widest mt-1">DESTROYED</p>}
      </div>

      {/* Hull */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">HULL INTEGRITY</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
            {(() => {
              const pct = p.hullPoints > 0 ? (ship.currentHull / p.hullPoints) : 0
              const color = pct > 0.6 ? 'bg-emerald-500' : pct > 0.3 ? 'bg-amber-500' : 'bg-red-500'
              return <div className={`h-full ${color}`} style={{ width: `${Math.max(0, pct * 100)}%` }} />
            })()}
          </div>
          <span className="font-mono text-sm text-slate-200 whitespace-nowrap">{ship.currentHull} / {p.hullPoints}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">ARMOUR</p>
          <p className="text-slate-200">{p.armour}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">TAC SPEED</p>
          <p className="text-slate-200">{ship.currentTacSpeed ?? p.tacSpeed} / {p.tacSpeed}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">TAC AVAIL</p>
          <p className="text-sky-300">{ship.tacSpeedAvailable ?? p.tacSpeed}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">SENSORS</p>
          <p className="text-slate-200">{p.sensors?.type ?? '—'} DM{p.sensors?.dm >= 0 ? '+' : ''}{p.sensors?.dm ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">COMPUTER</p>
          <p className="text-slate-200">{p.computer?.model ?? '—'} BW{p.computer?.bandwidth ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">SIGNATURE</p>
          <p className="text-slate-200">{ship.signature ?? p.signature ?? 2}</p>
        </div>
      </div>

      {/* Evasion state */}
      {evasionDm !== 0 && (
        <div className="bg-sky-950/30 border border-sky-800/50 rounded px-3 py-2">
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-0.5">EVASION ACTIVE</p>
          <p className={`text-sm font-mono font-bold ${evasionDm < 0 ? 'text-sky-400' : 'text-red-400'}`}>
            DM{evasionDm > 0 ? '+' : ''}{evasionDm} to all incoming attacks
          </p>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">Resets at round end // 2300AD B3 p.55</p>
        </div>
      )}

      {/* Weapons */}
      {(p.weapons ?? []).length > 0 && (
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">WEAPONS</p>
          <div className="space-y-1">
            {p.weapons.map((w, i) => {
              const wData = WEAPONS[w.weaponId]
              return (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded px-3 py-1.5">
                  <span className="text-xs font-mono text-slate-200">{w.label ?? wData?.name ?? w.weaponId}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {w.count}× {wData?.damage ?? '—'} dmg
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Range bands */}
      {bandSummary.length > 0 && (
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">RANGE BANDS</p>
          <div className="space-y-1">
            {bandSummary.map((b) => (
              <div key={b.name} className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{b.name}</span>
                <span className="text-slate-200">{b.band}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status flags */}
      <div className="flex flex-wrap gap-2">
        {ship.sensorLocked  && <span className="px-2 py-0.5 text-[10px] font-mono bg-sky-900/40 border border-sky-700 text-sky-300 rounded">SENSOR LOCK</span>}
        {ship.ewTarget      && <span className="px-2 py-0.5 text-[10px] font-mono bg-violet-900/40 border border-violet-700 text-violet-300 rounded">EW TARGET</span>}
      </div>

      {/* Surface fixture hits */}
      {surfaceHits.length > 0 && (
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">SURFACE FIXTURE DAMAGE</p>
          <div className="grid grid-cols-2 gap-1">
            {surfaceHits.map(([sys, hits]) => (
              <div key={sys} className="flex items-center justify-between bg-amber-950/30 border border-amber-900/40 rounded px-2 py-1">
                <span className="text-[10px] font-mono text-slate-300">{SURFACE_FIXTURE_SYSTEM_LABELS[sys] ?? sys}</span>
                <span className="text-xs font-mono font-bold text-amber-400">{hits} hit{hits !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal critical tracks */}
      {crits.length > 0 && (
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">INTERNAL CRITICAL HITS</p>
          <div className="grid grid-cols-2 gap-1">
            {crits.map(([sys, sev]) => (
              <div key={sys} className="flex items-center justify-between bg-red-950/30 border border-red-900/40 rounded px-2 py-1">
                <span className="text-[10px] font-mono text-slate-300">{CRITICAL_HIT_SYSTEM_LABELS[sys] ?? sys}</span>
                <span className={`text-xs font-mono font-bold ${SEV_COLOR[sev] ?? 'text-red-400'}`}>SEV {sev}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Software */}
      {(p.software ?? []).length > 0 && (
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">SOFTWARE</p>
          <div className="flex flex-wrap gap-1">
            {p.software.map((sw, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded">{sw.name ?? sw}</span>
            ))}
          </div>
        </div>
      )}

      <button
        className="w-full py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
        onClick={onClose}>
        CLOSE
      </button>
    </div>
  )
}

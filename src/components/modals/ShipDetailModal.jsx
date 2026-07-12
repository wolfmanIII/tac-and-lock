import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { WEAPONS } from '../../data/weapons.js'
import { CRITICAL_HIT_SYSTEM_LABELS, SURFACE_FIXTURE_SYSTEM_LABELS } from '../../data/criticalHits.js'
import { FACTION_COLOR } from '../../data/factions.js'
import { pairKey } from '../../utils/rangeBands.js'
import { computeEffectiveSignature, getReactionDriveSignatureDm, isEasyTarget, ATMOSPHERIC_CONDITIONS, getAtmosphericTargetDm } from '../../utils/combat.js'
import { useShipTokenIcon } from '../battle/useShipTokenIcon.js'

const SEV_COLOR = ['text-slate-500', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500', 'text-red-600', 'text-red-700']

const SIG_FLAGS = [
  { key: 'radiatorsRetracted',   label: 'Radiators Retracted',   dm: -1 },
  { key: 'heatSinkActive',       label: 'Heat Sink Active',       dm: -4 },
  { key: 'solarPanelsExtended',  label: 'Solar Panels Extended',  dm: +2 },
  { key: 'spinHabitatRetracted', label: 'Spin Habitat Retracted', dm: -1 },
  { key: 'reactionDriveActive',  label: 'Reaction Drive Active',  dm: null }, // resolved per-ship from reactionDriveType // B3 p.57
  { key: 'activeSensorsOn',      label: 'Active Sensors On',      dm: +1 },
  { key: 'stealthActive',        label: 'Stealth Active',         dm: -4 },
]

export function ShipDetailModal({ payload, onClose }) {
  const { shipId }    = payload ?? {}
  const ships         = useBattleStore((s) => s.ships)
  const rangeBands    = useBattleStore((s) => s.rangeBands)
  const toggleShipFlag = useBattleStore((s) => s.toggleShipFlag)
  const updateShip      = useBattleStore((s) => s.updateShip)
  const addHazard      = useBattleStore((s) => s.addHazard)
  const removeHazard   = useBattleStore((s) => s.removeHazard)
  const ship          = ships.find((s) => s.id === shipId)
  const shipColor     = ship?.color ?? FACTION_COLOR[ship?.faction] ?? '#94a3b8'
  const tokenRef      = useShipTokenIcon({ ...ship, color: shipColor }, 40)

  const [hazardInput, setHazardInput] = useState('')

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
      <div className={`flex items-center gap-3 border-l-4 pl-3 ${factionColor}`}>
        <canvas ref={tokenRef} width={40} height={40} className="shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-sky-300 text-base tracking-widest">{p.name}</p>
          <p className="text-xs font-mono text-slate-400">{p.class} · {ship.faction ?? '—'}</p>
          {ship.isDestroyed && <p className="text-[10px] font-display text-red-500 tracking-widest mt-1">DESTROYED</p>}
        </div>
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
          <p className="text-slate-200">{ship.currentTacSpeed ?? p.tacSpeed}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">SENSORS</p>
          <p className="text-slate-200">{p.sensors?.type ?? '—'} DM{p.sensors?.dm >= 0 ? '+' : ''}{p.sensors?.dm ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] font-display text-slate-500 tracking-widest">COMPUTER</p>
          <p className="text-slate-200">{p.computer?.model ?? '—'} BW{p.computer?.bandwidth ?? 0}</p>
        </div>
        {(() => {
          const sig = computeEffectiveSignature(ship)
          return (
            <div>
              <p className="text-[10px] font-display text-slate-500 tracking-widest">SIGNATURE</p>
              <p className="text-slate-200 flex items-baseline gap-1">
                {sig.effective}
                {sig.delta !== 0 && (
                  <span className={`text-[9px] font-mono ${sig.delta > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                    ({sig.delta > 0 ? '+' : ''}{sig.delta})
                  </span>
                )}
              </p>
            </div>
          )
        })()}
      </div>

      {/* Signature condition toggles — 2300AD B3 p.57 */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1.5">SIGNATURE CONDITIONS</p>
        <div className="grid grid-cols-2 gap-1">
          {SIG_FLAGS.map(({ key, label, dm: staticDm }) => {
            const active = !!ship[key]
            const dm = key === 'reactionDriveActive' ? getReactionDriveSignatureDm(ship.reactionDriveType) : staticDm
            return (
              <button
                key={key}
                onClick={() => toggleShipFlag(shipId, key)}
                className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono border transition-colors
                  ${active
                    ? 'bg-sky-900/40 border-sky-700 text-sky-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
              >
                <span>{label}</span>
                <span className={`font-bold ml-2 ${dm > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                  {dm > 0 ? `+${dm}` : dm}
                </span>
              </button>
            )
          })}
        </div>
        {(() => {
          const sig = computeEffectiveSignature(ship)
          if (sig.mods.some(([l]) => ['Hull damage >50%', 'Power Plant crit', 'EW active'].includes(l))) {
            return (
              <div className="mt-1 flex flex-wrap gap-1">
                {sig.mods
                  .filter(([l]) => ['Hull damage >50%', 'Power Plant crit', 'EW active'].includes(l))
                  .map(([l, v]) => (
                    <span key={l} className="text-[9px] font-mono text-amber-400 border border-amber-800/50 rounded px-1 py-0.5">
                      {v > 0 ? '+' : ''}{v} {l}
                    </span>
                  ))}
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* Stationary / reaction-drive target — attack DM+2 & ×2 damage for attackers, not a Signature modifier // B3 p.56 */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1.5">FIRING SOLUTION EASE</p>
        <button
          onClick={() => toggleShipFlag(shipId, 'isStationary')}
          className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono border transition-colors
            ${ship.isStationary
              ? 'bg-amber-900/40 border-amber-700 text-amber-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
        >
          <span>Stationary (not manoeuvring)</span>
          <span className="font-bold ml-2 text-amber-400">DM+2 / ×2 dmg to attackers</span>
        </button>
        {isEasyTarget(ship) && (
          <p className="text-[9px] font-mono text-slate-600 mt-1">
            {ship.isStationary ? 'Stationary' : 'Reaction Drive Active'} — attacks against this ship gain DM+2 and inflict double damage // 2300AD B3 p.56
          </p>
        )}
      </div>

      {/* Planetary/atmospheric condition — attack range DM, applies regardless of range band // 2300AD B3 p.56 */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1.5">PLANETARY / ATMOSPHERIC CONDITION</p>
        <select
          value={ship.atmosphericCondition ?? 'none'}
          onChange={(e) => updateShip(shipId, { atmosphericCondition: e.target.value })}
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-2 py-1 focus:border-sky-400 outline-none"
        >
          {ATMOSPHERIC_CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}{c.dm !== 0 ? ` (DM${c.dm})` : ''}</option>
          ))}
        </select>
        {getAtmosphericTargetDm(ship) !== 0 && (
          <p className="text-[9px] font-mono text-slate-600 mt-1">
            Attacks against this ship suffer DM{getAtmosphericTargetDm(ship)} // 2300AD B3 p.56
          </p>
        )}
      </div>

      {/* Defensive Screens — Gunner Action equipment, not a Signature modifier // B3 p.62 */}
      {ship.screenRating > 0 && (
        <div className="bg-sky-950/30 border border-sky-800/50 rounded px-3 py-2">
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-0.5">DEFENSIVE SCREENS</p>
          <p className="text-sm font-mono font-bold text-sky-400">
            Rating {ship.screenCurrentRating}/{ship.screenRating}
            {ship.screenCurrentRating > 0 && ` (DM−${ship.screenCurrentRating} vs. laser attacks)`}
          </p>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">
            {ship.screenDeployed ? `${ship.screenReloads} reload(s) left` : 'Not yet deployed'} — Deploy/Recharge via the Attack modal (Gunner Action) // 2300AD B3 p.55, p.62
          </p>
        </div>
      )}

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

      {/* Captain's Command(s) — active this round, up to one per Leadership level // B3 p.54 */}
      {(ship.commandBonus ?? []).length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded px-3 py-2 space-y-1">
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-0.5">CAPTAIN'S COMMAND(S) ACTIVE</p>
          {ship.commandBonus.map((cb) => (
            <p key={cb.role} className="text-sm font-mono font-bold text-emerald-400">
              DM+{cb.dm} to {cb.role} this round
            </p>
          ))}
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">
            Auto-applied to Gunner (turret) and Pilot checks; add manually elsewhere // 2300AD B3 p.54
          </p>
        </div>
      )}

      {/* Improve Critical (Sensor Operator) — lowers crit threshold for this ship's next hit // B3 p.54 */}
      {ship.improveCriticalThreshold != null && (
        <div className="bg-red-950/30 border border-red-800/50 rounded px-3 py-2">
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-0.5">IMPROVE CRITICAL ACTIVE</p>
          <p className="text-sm font-mono font-bold text-red-400">
            Next hit crits at Effect {ship.improveCriticalThreshold}+ instead of 6+
          </p>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">Auto-applied in AttackModal/DroneAttackModal; expires after this round // 2300AD B3 p.54</p>
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
        {ship.ewTarget && <span className="px-2 py-0.5 text-[10px] font-mono bg-violet-900/40 border border-violet-700 text-violet-300 rounded">EW TARGET</span>}
      </div>

      {/* Active hazards — GM-managed, cleared by damage_control // B3 p.55 */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1.5">ACTIVE HAZARDS</p>
        {(ship.hazards ?? []).length > 0 ? (
          <div className="space-y-1 mb-2">
            {(ship.hazards ?? []).map((h) => (
              <div key={h.id} className="flex items-center justify-between bg-amber-950/30 border border-amber-900/40 rounded px-2 py-1">
                <span className="text-[11px] font-mono text-amber-300">{h.label}</span>
                <button onClick={() => removeHazard(shipId, h.id)}
                  className="text-[10px] font-mono text-slate-500 hover:text-red-400 transition-colors">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] font-mono text-slate-600 italic mb-2">No active hazards</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={hazardInput}
            onChange={(e) => setHazardInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hazardInput.trim()) {
                addHazard(shipId, hazardInput.trim())
                setHazardInput('')
              }
            }}
            placeholder="add hazard…"
            className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-2 py-1 focus:border-amber-600 outline-none"
          />
          <button
            disabled={!hazardInput.trim()}
            onClick={() => { if (hazardInput.trim()) { addHazard(shipId, hazardInput.trim()); setHazardInput('') } }}
            className="px-3 py-1 text-[10px] font-display tracking-widest border rounded
              disabled:text-slate-600 disabled:border-slate-800
              enabled:text-amber-400 enabled:border-amber-800 enabled:hover:bg-amber-900/20">
            ADD
          </button>
        </div>
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

import { useUIStore } from '../../store/uiStore.js'
import { useBattleStore } from '../../store/battleStore.js'
import { FACTION_COLOR } from '../../data/factions.js'
import { CRITICAL_HIT_SYSTEM_LABELS, SURFACE_FIXTURE_SYSTEM_LABELS } from '../../data/criticalHits.js'
import { Tooltip } from '../ui/Tooltip.jsx'
import { computeEffectiveSignature } from '../../utils/combat.js'
import { useShipTokenIcon } from './useShipTokenIcon.js'

const SEV_COLOR = ['', 'text-amber-300', 'text-amber-400', 'text-orange-400', 'text-orange-500', 'text-red-500', 'text-red-600']

function HullBar({ current, max }) {
  const pct = max > 0 ? Math.max(0, current / max) : 0
  const color = pct > 0.5 ? 'bg-emerald-500' : pct > 0.25 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-12 text-right shrink-0">
        {current}/{max}
      </span>
    </div>
  )
}

export function ShipBentoCard({ ship }) {
  const { openModal, showContextMenu } = useUIStore()
  const phase             = useBattleStore((s) => s.phase)
  const initiativeOrder   = useBattleStore((s) => s.initiativeOrder)
  const currentActorIndex = useBattleStore((s) => s.currentActorIndex)

  const shipColor        = ship.color ?? FACTION_COLOR[ship.faction] ?? '#94a3b8'
  const tokenRef          = useShipTokenIcon({ ...ship, color: shipColor }, 32)
  const activeCrits      = Object.entries(ship.criticalTracks ?? {}).filter(([, sev]) => sev > 0)
  const activeSurface    = Object.entries(ship.surfaceFixtureTracks ?? {}).filter(([, hits]) => hits > 0)
  const isDestroyed      = ship.isDestroyed
  // No "Manoeuvre/Attack/Actions Step" in 2300AD B3 — a ship's turn in 'combat' is
  // open-ended; each modal gates/warns on its own role's actionsRemaining budget. // B3 p.53
  const isCurrentActor = initiativeOrder[currentActorIndex] === ship.id
  const canAct          = phase === 'combat' && isCurrentActor && !isDestroyed

  function onContextMenu(e) {
    e.preventDefault()
    e.stopPropagation()
    showContextMenu(e.clientX, e.clientY, ship.id)
  }

  return (
    <div
      className={`bg-slate-900 border rounded-lg cursor-context-menu transition-colors select-none ${
        isDestroyed
          ? 'border-red-900/50 opacity-40'
          : 'border-slate-700 hover:border-slate-600'
      }`}
      onContextMenu={onContextMenu}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <canvas ref={tokenRef} width={32} height={32} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-slate-200 font-bold truncate">{ship.profile?.name ?? ship.id}</p>
          <p className="text-[10px] font-mono text-slate-500 truncate">{ship.profile?.class}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
          {ship.ewTarget && (
            <Tooltip content="This ship is jamming a target">
              <span className="text-[10px] text-purple-400 border border-purple-800 rounded px-1">EW</span>
            </Tooltip>
          )}
          {(ship.evasionDm ?? 0) !== 0 && (
            <Tooltip content={`Evasion active: DM${ship.evasionDm > 0 ? '+' : ''}${ship.evasionDm} to incoming attacks`}>
              <span className="text-[10px] text-sky-400 border border-sky-800 rounded px-1">
                EVA {ship.evasionDm > 0 ? '+' : ''}{ship.evasionDm}
              </span>
            </Tooltip>
          )}
          {(ship.commandBonus ?? []).map((cb) => (
            <Tooltip key={cb.role} content={`Captain's Command: DM+${cb.dm} to ${cb.role} this round`}>
              <span className="text-[10px] text-emerald-400 border border-emerald-800 rounded px-1">
                CMD +{cb.dm}
              </span>
            </Tooltip>
          ))}
          {isDestroyed && (
            <span className="text-[10px] text-red-500 border border-red-900 rounded px-1 font-display">DEST</span>
          )}
        </div>
      </div>

      {/* Hull bar */}
      <div className="px-3 pb-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-display text-slate-500 tracking-widest">HULL</span>
        </div>
        <HullBar current={ship.currentHull} max={ship.hullPoints} />
      </div>

      {/* Stats row */}
      <div className="px-3 pb-1.5 flex items-center gap-4 text-xs font-mono">
        <Tooltip content="TAC Speed — fixed DM added to Pilot checks (Open/Close, Position Vessel) // 2300AD B3 p.54">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-display tracking-widest">TAC SPD</span>
            <span className="text-slate-300">{ship.currentTacSpeed}</span>
          </div>
        </Tooltip>
        <Tooltip content={`Armour rating: ${ship.currentArmour}`}>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-display tracking-widest">ARM</span>
            <span className="text-slate-300">{ship.currentArmour}</span>
          </div>
        </Tooltip>
        {(() => {
          const sig = computeEffectiveSignature(ship)
          const tip = sig.delta !== 0
            ? `Signature ${sig.base} base ${sig.delta > 0 ? '+' : ''}${sig.delta} mods = ${sig.effective} effective\n${sig.mods.map(([l, v]) => `${v > 0 ? '+' : ''}${v} ${l}`).join(', ')}`
            : 'Signature — DM bonus for enemy Electronics(sensors) checks // 2300AD B3 p.57'
          return (
            <Tooltip content={tip}>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-display tracking-widest">SIG</span>
                <span className="text-slate-300 flex items-baseline gap-0.5">
                  {sig.effective}
                  {sig.delta !== 0 && (
                    <span className={`text-[9px] ${sig.delta > 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                      {sig.delta > 0 ? `+${sig.delta}` : sig.delta}
                    </span>
                  )}
                </span>
              </div>
            </Tooltip>
          )
        })()}
      </div>

      {/* Surface fixture hits (amber) */}
      {activeSurface.length > 0 && (
        <div className="px-3 pb-1 flex flex-wrap gap-1">
          {activeSurface.map(([sys, hits]) => (
            <Tooltip key={sys} content={`${SURFACE_FIXTURE_SYSTEM_LABELS[sys]}: ${hits} hit${hits !== 1 ? 's' : ''}`}>
              <span className="text-[10px] font-mono border border-amber-800/50 text-amber-400 rounded px-1">
                {SURFACE_FIXTURE_SYSTEM_LABELS[sys]?.slice(0, 3).toUpperCase()} ×{hits}
              </span>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Internal critical hit tracks (red) */}
      {activeCrits.length > 0 && (
        <div className="px-3 pb-1.5 flex flex-wrap gap-1">
          {activeCrits.map(([sys, sev]) => (
            <Tooltip key={sys} content={`${CRITICAL_HIT_SYSTEM_LABELS[sys]}: severity ${sev}`}>
              <span className={`text-[10px] font-mono border border-current/30 rounded px-1 ${SEV_COLOR[sev] ?? 'text-amber-300'}`}>
                {CRITICAL_HIT_SYSTEM_LABELS[sys]?.slice(0, 4).toUpperCase()} {sev}
              </span>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-3 pb-2 flex gap-1.5">
        <button
          disabled={!canAct}
          className="flex-1 py-1 text-[10px] font-display tracking-widest border border-red-900 text-red-400
            hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
          onClick={(e) => { e.stopPropagation(); openModal('attack', { attackerId: ship.id }) }}
        >
          ATK
        </button>
        <button
          disabled={!canAct}
          className="flex-1 py-1 text-[10px] font-display tracking-widest border border-purple-900 text-purple-400
            hover:bg-purple-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
          onClick={(e) => { e.stopPropagation(); openModal('manoeuvre', { shipId: ship.id }) }}
        >
          MNV
        </button>
        <button
          disabled={!canAct}
          className="flex-1 py-1 text-[10px] font-display tracking-widest border border-emerald-900 text-emerald-400
            hover:bg-emerald-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
          onClick={(e) => { e.stopPropagation(); openModal('action', { shipId: ship.id }) }}
        >
          ACT
        </button>
        <button
          className="py-1 px-2 text-[10px] font-display tracking-widest border border-slate-700 text-slate-400
            hover:bg-slate-800 transition-colors rounded"
          onClick={(e) => { e.stopPropagation(); openModal('ship-detail', { shipId: ship.id }) }}
        >
          ···
        </button>
      </div>
    </div>
  )
}

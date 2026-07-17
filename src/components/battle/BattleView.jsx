/**
 * BattleView — scrollable battle content layer.
 * HUD / PhaseTracker / BattleLog / ContextMenu are absolute overlays rendered by App.jsx.
 * Layout mirrors thrust-and-drift BasicBattleView: DISTANCES at top, ships grouped by faction.
 */

import { useCallback, useMemo } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { pairKey } from '../../utils/rangeBands.js'
import { RANGE_BAND_ORDER } from '../../data/rangeBands.js'
import { FACTION_COLOR } from '../../data/factions.js'
import { ShipBentoCard } from './ShipBentoCard.jsx'
import { DroneTracker } from './DroneTracker.jsx'

// ── Faction constants ─────────────────────────────────────────────────────────

const FACTION_LABELS = {
  players: 'GIOCATORI',
  npc:     'NPC',
  neutral: 'NEUTRALI',
}

const FACTION_HEADER_CLASS = {
  players: 'text-bronze-400 border-bronze-400/30',
  npc:     'text-red-400 border-red-400/30',
  neutral: 'text-gunmetal-400 border-gunmetal-600',
}

const BAND_LABEL = { VeryLong: 'Very Long' }

const BAND_VALUE_COLOR = {
  Adjacent: 'text-red-400',
  Close:    'text-orange-400',
  Short:    'text-amber-400',
  Medium:   'text-yellow-300',
  Long:     'text-gunmetal-300',
  VeryLong: 'text-gunmetal-400',
  Distant:  'text-gunmetal-500',
}

// ── RangeBandRow ──────────────────────────────────────────────────────────────

/**
 * @param {{ ship1: object, ship2: object, band: string, ended: boolean, onSet: (band: string) => void, onMnv: () => void }} props
 */
function RangeBandRow({ ship1, ship2, band, ended, onSet, onMnv }) {
  const idx = RANGE_BAND_ORDER.indexOf(band)

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ship1.color ?? FACTION_COLOR[ship1.faction] ?? '#94a3b8' }} />
      <span className="font-mono text-xs text-gunmetal-300 truncate max-w-24">{ship1.profile?.name ?? ship1.id}</span>
      <span className="text-gunmetal-500 mx-0.5">↔</span>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ship2.color ?? FACTION_COLOR[ship2.faction] ?? '#94a3b8' }} />
      <span className="font-mono text-xs text-gunmetal-300 truncate max-w-24">{ship2.profile?.name ?? ship2.id}</span>

      {ended && (
        <span
          className="font-display text-[9px] tracking-widest text-red-400 border border-red-800 rounded px-1 py-0.5 shrink-0"
          title="Combat ends one round after Distant, if the pursuer cannot close // 2300AD B3 p.54"
        >
          COMBAT ENDED
        </span>
      )}

      <button
        onClick={onMnv}
        className={`ml-auto font-display text-xs tracking-widest shrink-0 w-20 text-right hover:underline ${BAND_VALUE_COLOR[band] ?? 'text-gunmetal-300'}`}
        title="Open Manoeuvre modal"
      >
        {BAND_LABEL[band] ?? band}
      </button>

      <div className="flex gap-1 shrink-0">
        <button
          disabled={idx <= 0}
          onClick={() => onSet(RANGE_BAND_ORDER[idx - 1])}
          title="Closer (GM override)"
          className="w-5 h-5 flex items-center justify-center border border-gunmetal-700 text-gunmetal-400 rounded text-xs
            hover:border-gunmetal-500 hover:text-gunmetal-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >▼</button>
        <button
          disabled={idx >= RANGE_BAND_ORDER.length - 1}
          onClick={() => onSet(RANGE_BAND_ORDER[idx + 1])}
          title="Further (GM override)"
          className="w-5 h-5 flex items-center justify-center border border-gunmetal-700 text-gunmetal-400 rounded text-xs
            hover:border-gunmetal-500 hover:text-gunmetal-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >▲</button>
      </div>
    </div>
  )
}

// ── BattleView ────────────────────────────────────────────────────────────────

export default function BattleView() {
  const ships           = useBattleStore((s) => s.ships)
  const drones          = useBattleStore((s) => s.drones)
  const rangeBands      = useBattleStore((s) => s.rangeBands)
  const distantPursuit  = useBattleStore((s) => s.distantPursuit)
  const setRangeBand    = useBattleStore((s) => s.setRangeBand)
  const { openModal, showContextMenu } = useUIStore()

  // Right-click on the battle background opens the background context menu.
  // ShipBentoCard right-clicks call showContextMenu with their own shipId via stopPropagation.
  const handleContainerCtx = useCallback((e) => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, null)
  }, [showContextMenu])

  // All cross-faction pairs that have a registered range band
  const trackedPairs = useMemo(() => {
    const pairs = []
    const seen  = new Set()
    for (const s1 of ships) {
      for (const s2 of ships) {
        if (s1.id === s2.id) continue
        const key = pairKey(s1.id, s2.id)
        if (seen.has(key)) continue
        seen.add(key)
        const band = rangeBands[key]
        if (band) pairs.push({ s1, s2, band, key })
      }
    }
    return pairs
  }, [ships, rangeBands])

  // Ships grouped by faction
  const byFaction = useMemo(() =>
    ships.reduce((acc, ship) => {
      const f = ship.faction ?? 'neutral'
      if (!acc[f]) acc[f] = []
      acc[f].push(ship)
      return acc
    }, {}),
  [ships])

  return (
    <div
      className="w-full h-full overflow-y-auto p-6"
      onContextMenu={handleContainerCtx}
    >
      {ships.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg width="80" height="80" viewBox="0 0 100 100" className="opacity-20 mx-auto mb-4" aria-hidden="true">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#0891b2" strokeWidth="0.8" />
              <circle cx="50" cy="50" r="24" fill="none" stroke="#0891b2" strokeWidth="0.8" />
              <circle cx="50" cy="50" r="4"  fill="none" stroke="#0891b2" strokeWidth="0.8" />
              <line x1="12" y1="50" x2="26" y2="50" stroke="#0891b2" strokeWidth="0.8" />
              <line x1="74" y1="50" x2="88" y2="50" stroke="#0891b2" strokeWidth="0.8" />
              <line x1="50" y1="12" x2="50" y2="26" stroke="#0891b2" strokeWidth="0.8" />
              <line x1="50" y1="74" x2="50" y2="88" stroke="#0891b2" strokeWidth="0.8" />
            </svg>
            <p className="font-display text-xs text-gunmetal-500 tracking-widest">NO VESSELS</p>
            <p className="font-mono text-xs text-gunmetal-600 mt-1">Add ships from the dashboard to begin.</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Drone/missile tracker */}
        {drones.length > 0 && <DroneTracker />}

        {/* DISTANCES — range band matrix */}
        {trackedPairs.length > 0 && (
          <div>
            <h2 className="font-display text-xs tracking-widest mb-3 pb-1.5 border-b text-gunmetal-400 border-gunmetal-700">
              DISTANCES
            </h2>
            <div className="divide-y divide-gunmetal-800">
              {trackedPairs.map(({ s1, s2, band, key }) => (
                <RangeBandRow
                  key={key}
                  ship1={s1}
                  ship2={s2}
                  band={band}
                  ended={!!distantPursuit[key]?.ended}
                  onSet={(newBand) => setRangeBand(s1.id, s2.id, newBand)}
                  onMnv={() => openModal('manoeuvre', { shipAId: s1.id, shipBId: s2.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ships by faction */}
        {Object.entries(byFaction).map(([faction, factionShips]) => (
          <div key={faction}>
            <h2 className={`font-display text-xs tracking-widest mb-3 pb-1.5 border-b ${FACTION_HEADER_CLASS[faction] ?? FACTION_HEADER_CLASS.neutral}`}>
              {FACTION_LABELS[faction] ?? faction.toUpperCase()}
              <span className="ml-2 text-gunmetal-400">({factionShips.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {factionShips.map((ship) => (
                <ShipBentoCard
                  key={ship.id}
                  ship={ship}
                />
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}

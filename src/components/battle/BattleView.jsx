/**
 * BattleView — scrollable battle content layer.
 * HUD / PhaseTracker / BattleLog / ContextMenu are absolute overlays rendered by App.jsx.
 */

import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { pairKey } from '../../utils/rangeBands.js'
import { ShipBentoCard } from './ShipBentoCard.jsx'
import { MissileTracker } from './MissileTracker.jsx'

const BAND_COLOR = {
  Adjacent: 'text-red-400',
  Close:    'text-orange-400',
  Short:    'text-amber-400',
  Medium:   'text-yellow-300',
  Long:     'text-slate-300',
  VeryLong: 'text-slate-400',
  Distant:  'text-slate-500',
}

function bandLabel(id) {
  return id === 'VeryLong' ? 'Very Long' : id
}

function RangeBandPanel() {
  const ships      = useBattleStore((s) => s.ships)
  const rangeBands = useBattleStore((s) => s.rangeBands)
  const { openModal } = useUIStore()

  const pairs = []
  for (let i = 0; i < ships.length; i++) {
    for (let j = i + 1; j < ships.length; j++) {
      const a = ships[i], b = ships[j]
      const band = rangeBands[pairKey(a.id, b.id)] ?? 'Long'
      pairs.push({ a, b, band })
    }
  }

  if (pairs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-8 py-16">
        <svg width="96" height="96" viewBox="0 0 100 100" className="opacity-20" aria-hidden="true">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#0891b2" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="#0891b2" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="4"  fill="none" stroke="#0891b2" strokeWidth="0.8" />
          <line x1="12" y1="50" x2="26" y2="50" stroke="#0891b2" strokeWidth="0.8" />
          <line x1="74" y1="50" x2="88" y2="50" stroke="#0891b2" strokeWidth="0.8" />
          <line x1="50" y1="12" x2="50" y2="26" stroke="#0891b2" strokeWidth="0.8" />
          <line x1="50" y1="74" x2="50" y2="88" stroke="#0891b2" strokeWidth="0.8" />
        </svg>
        <div>
          <p className="font-display text-xs text-slate-500 tracking-widest">NO RANGE BANDS</p>
          <p className="font-mono text-xs text-slate-600 mt-1">Add ≥ 2 ships to display contacts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 space-y-2">
      <p className="text-[10px] font-display text-slate-500 tracking-widest mb-3">TACTICAL CONTACTS</p>
      {pairs.map(({ a, b, band }) => (
        <button
          key={`${a.id}-${b.id}`}
          className="w-full flex items-center gap-3 px-3 py-2 bg-slate-900/60 border border-slate-800
            hover:border-slate-600 rounded text-left transition-colors group"
          onClick={() => openModal('manoeuvre', { shipAId: a.id, shipBId: b.id })}
        >
          <span className="flex-1 text-xs font-mono text-slate-300 truncate">{a.profile?.name ?? a.id}</span>
          <span className="text-slate-600 text-xs">↔</span>
          <span className="flex-1 text-xs font-mono text-slate-300 truncate text-right">{b.profile?.name ?? b.id}</span>
          <span className={`text-xs font-display tracking-widest shrink-0 w-20 text-right ${BAND_COLOR[band] ?? 'text-slate-300'}`}>
            {bandLabel(band)}
          </span>
          <span className="text-slate-700 group-hover:text-slate-400 text-xs">✎</span>
        </button>
      ))}
    </div>
  )
}

export default function BattleView() {
  const ships     = useBattleStore((s) => s.ships)
  const { openModal } = useUIStore()

  return (
    <div className="w-full h-full overflow-y-auto">
      <MissileTracker />

      <div className="flex min-h-full">
        {/* Ship bento cards — left column */}
        <div className="w-72 shrink-0 flex flex-col border-r border-slate-800 min-h-full">
          <div className="px-3 pt-3 pb-2 shrink-0 flex items-center justify-between border-b border-slate-800">
            <span className="text-[10px] font-display text-slate-500 tracking-widest">
              VESSELS ({ships.length})
            </span>
            <button
              className="text-[10px] font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 px-2 py-0.5 rounded hover:bg-(--neon-cyan)/10 transition-colors"
              onClick={() => openModal('ship-profile')}
            >
              + ADD
            </button>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {ships.length === 0 ? (
              <p className="text-slate-600 text-xs font-mono text-center mt-8">No ships in battle.</p>
            ) : (
              ships.map((ship) => <ShipBentoCard key={ship.id} ship={ship} />)
            )}
          </div>
        </div>

        {/* Range band panel — center */}
        <RangeBandPanel />
      </div>
    </div>
  )
}

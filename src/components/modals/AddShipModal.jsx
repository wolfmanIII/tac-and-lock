import { useState } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'
import { useBattleStore } from '../../store/battleStore.js'
import { FACTIONS } from '../../data/factions.js'
import { RANGE_BANDS } from '../../data/rangeBands.js'

export function AddShipModal({ onClose }) {
  const profiles = useProfilesStore((s) => s.profiles)
  const addShip  = useBattleStore((s) => s.addShip)

  const [selectedId, setSelectedId] = useState(profiles[0]?.id ?? null)
  const [faction,    setFaction]    = useState('npc')
  const [startBand,  setStartBand]  = useState('Long')
  const [filter,     setFilter]     = useState('')

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )
  const selected = profiles.find((p) => p.id === selectedId) ?? null

  function handleConfirm() {
    if (!selected) return
    addShip(selected, faction, startBand)
    onClose()
  }

  return (
    <div className="space-y-4 p-4">
      <p className="font-mono text-xs text-(--neon-cyan) tracking-widest uppercase">Add Vessel</p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search profile…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-3 py-1.5 focus:outline-none focus:border-(--neon-cyan)/60"
      />

      {/* Profile list */}
      <div className="max-h-40 overflow-y-auto space-y-0.5 border border-slate-700 rounded">
        {filtered.length === 0 && (
          <p className="text-slate-400 font-mono text-xs italic px-3 py-2">No profiles found.</p>
        )}
        {filtered.map((p) => {
          const isSel = p.id === selectedId
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-3 py-1.5 font-mono text-xs transition-colors flex items-center gap-2 border-l-2 ${
                isSel
                  ? 'bg-sky-950 text-sky-200 border-sky-400'
                  : 'text-slate-300 hover:bg-slate-800 border-transparent'
              }`}
            >
              <span className={`w-3 shrink-0 text-center ${isSel ? 'text-sky-400' : 'text-transparent'}`}>▶</span>
              <span className="font-bold">{p.name}</span>
              {p.class && <span className={`ml-1 ${isSel ? 'text-sky-400/60' : 'text-slate-400'}`}>{p.class}</span>}
            </button>
          )
        })}
      </div>

      {/* Faction */}
      <div>
        <p className="text-slate-400 font-mono text-xs mb-1.5">Faction</p>
        <div className="flex gap-2">
          {FACTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFaction(f.id)}
              className={`flex-1 py-1.5 font-mono text-xs rounded border transition-colors ${
                faction === f.id
                  ? 'border-(--neon-cyan)/60 bg-(--neon-cyan)/10 text-(--neon-cyan)'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry range band */}
      <div>
        <p className="text-slate-400 font-mono text-xs mb-1.5">Entry range</p>
        <div className="flex gap-1.5 flex-wrap">
          {RANGE_BANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => setStartBand(b.id)}
              className={`px-2.5 py-1 font-mono text-xs rounded border transition-colors ${
                startBand === b.id
                  ? 'border-(--neon-cyan)/60 bg-(--neon-cyan)/10 text-(--neon-cyan)'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full py-2 bg-(--neon-cyan)/10 border border-(--neon-cyan)/40 text-(--neon-cyan) font-mono text-sm tracking-widest rounded hover:bg-(--neon-cyan)/20 transition-colors disabled:text-slate-400 disabled:border-slate-600/50 disabled:bg-transparent disabled:cursor-not-allowed"
      >
        ADD TO BATTLE
      </button>
    </div>
  )
}

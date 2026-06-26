import { useState } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'
import { useBattleStore } from '../../store/battleStore.js'
import { FACTIONS } from '../../data/factions.js'
import { RANGE_BANDS } from '../../data/rangeBands.js'

export function AddShipModal({ onClose }) {
  const profiles = useProfilesStore((s) => s.profiles)
  const addShip  = useBattleStore((s) => s.addShip)

  const [faction,   setFaction]   = useState('npc')
  const [startBand, setStartBand] = useState('Long')

  function handleAdd(profile) {
    addShip(profile, faction, startBand)
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-sm tracking-widest text-(--neon-cyan)">ADD VESSEL TO BATTLE</h2>

      {/* Faction */}
      <div>
        <p className="font-display text-xs text-slate-500 tracking-widest mb-1.5">FACTION</p>
        <div className="flex gap-2">
          {FACTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFaction(f.id)}
              style={faction === f.id ? { color: f.color, borderColor: f.color } : undefined}
              className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors
                ${faction === f.id ? 'bg-slate-800' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry range band */}
      <div>
        <p className="font-display text-xs text-slate-500 tracking-widest mb-1.5">ENTRY RANGE</p>
        <select
          value={startBand}
          onChange={(e) => setStartBand(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono
            rounded px-2 py-1.5 focus:outline-none focus:border-(--neon-cyan)"
        >
          {RANGE_BANDS.map((b) => (
            <option key={b.id} value={b.id}>{b.label} — {b.distance}</option>
          ))}
        </select>
      </div>

      {/* Profile list */}
      <div>
        <p className="font-display text-xs text-slate-500 tracking-widest mb-1.5">SELECT PROFILE</p>
        {profiles.length === 0 ? (
          <p className="font-mono text-xs text-slate-500 text-center py-6">
            No profiles available — create ship profiles on the dashboard first.
          </p>
        ) : (
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleAdd(profile)}
                className="w-full text-left px-3 py-2.5 rounded border border-slate-700
                  hover:border-(--neon-cyan)/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm text-slate-200 font-bold truncate">{profile.name}</span>
                  <span className="font-mono text-xs text-slate-500 shrink-0">{profile.class}</span>
                </div>
                <div className="flex gap-4 mt-0.5">
                  <span className="font-mono text-[10px] text-slate-400">HULL {profile.hullPoints}</span>
                  <span className="font-mono text-[10px] text-slate-400">ARM {profile.armour}</span>
                  <span className="font-mono text-[10px] text-slate-400">TAC {profile.tacSpeed}</span>
                  <span className="font-mono text-[10px] text-slate-400">{profile.weapons?.length ?? 0} WPN</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

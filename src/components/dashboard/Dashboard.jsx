import { useState } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'
import { useBattleStore } from '../../store/battleStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { useProfileImport } from './useProfileImport.js'
import { FACTIONS } from '../../data/factions.js'
import { RANGE_BANDS } from '../../data/rangeBands.js'

function ProfileCard({ profile, onAddToBattle }) {
  const { deleteProfile, duplicateProfile } = useProfilesStore()
  const { openModal } = useUIStore()

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded p-3 flex flex-col gap-2 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm text-slate-100 truncate">{profile.name}</p>
          <p className="text-[10px] font-mono text-slate-500">{profile.class}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            className="text-[10px] font-mono text-slate-500 hover:text-slate-200 px-1"
            onClick={() => openModal('ship-profile', { profileId: profile.id })}
          >
            ✎
          </button>
          <button
            className="text-[10px] font-mono text-slate-500 hover:text-slate-200 px-1"
            onClick={() => duplicateProfile(profile.id)}
          >
            ⊕
          </button>
          <button
            className="text-[10px] font-mono text-slate-500 hover:text-red-400 px-1"
            onClick={() => {
              if (confirm(`Delete "${profile.name}"?`)) deleteProfile(profile.id)
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex gap-3 text-[10px] font-mono text-slate-400">
        <span>HP {profile.hullPoints}</span>
        <span>ARM {profile.armour}</span>
        <span>SPD {profile.tacSpeed}</span>
        <span>{profile.weapons?.length ?? 0} wpn</span>
      </div>

      <button
        className="w-full py-1 text-[10px] font-display tracking-widest text-sky-300 border border-sky-800 hover:bg-sky-900/30 transition-colors rounded"
        onClick={() => onAddToBattle(profile)}
      >
        ADD TO BATTLE
      </button>
    </div>
  )
}

function AddToBattleDialog({ profile, onConfirm, onCancel }) {
  const [faction, setFaction] = useState(profile.faction ?? 'players')
  const [band,    setBand]    = useState('Long')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 bg-slate-900 border border-slate-700 rounded p-6 w-full max-w-sm space-y-4">
        <p className="font-display text-sky-300 text-sm tracking-widest">ADD TO BATTLE</p>
        <p className="text-slate-300 text-sm font-mono">{profile.name}</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display text-slate-500 tracking-widest block mb-1">FACTION</label>
            <div className="flex gap-2">
              {FACTIONS.map((f) => (
                <button
                  key={f.id}
                  className={`flex-1 py-1 text-xs font-mono border rounded transition-colors
                    ${faction === f.id ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  style={faction === f.id ? { borderColor: f.color, color: f.color } : {}}
                  onClick={() => setFaction(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-display text-slate-500 tracking-widest block mb-1">INITIAL RANGE (from all other ships)</label>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
            >
              {RANGE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label} — {b.distance}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
            onClick={onCancel}
          >
            CANCEL
          </button>
          <button
            className="flex-1 py-2 text-xs font-display tracking-widest text-sky-300 border border-sky-700 hover:bg-sky-900/30 rounded"
            onClick={() => onConfirm(profile, faction, band)}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const profiles    = useProfilesStore((s) => s.profiles)
  const { addShip, exportBattleState, importBattleState, ships } = useBattleStore()
  const { gotoScreen, openModal } = useUIStore()
  const { handleImport } = useProfileImport()
  const [addTarget, setAddTarget] = useState(null)
  const [battleImporting, setBattleImporting] = useState(false)

  function handleConfirmAdd(profile, faction, band) {
    addShip(profile, faction, band)
    setAddTarget(null)
  }

  async function handleImportBattle() {
    const input = document.createElement('input')
    input.type   = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setBattleImporting(true)
      try {
        await importBattleState(file)
        gotoScreen('battle')
      } catch (err) {
        alert(`Import failed: ${err.message}`)
      } finally {
        setBattleImporting(false)
      }
    }
    input.click()
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TAC & LOCK" className="h-10 w-auto" />
          <div>
            <p className="font-display text-sky-300 text-lg tracking-widest">TAC &amp; LOCK</p>
            <p className="text-[10px] font-mono text-slate-500">2300AD Space Combat — GM Interface</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
            onClick={handleImport}
          >
            IMPORT PROFILES
          </button>
          <button
            className="px-3 py-1.5 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
            onClick={handleImportBattle}
            disabled={battleImporting}
          >
            LOAD BATTLE
          </button>
          <button
            className="px-3 py-1.5 text-xs font-display tracking-widest text-sky-300 border border-sky-700 hover:bg-sky-900/30 rounded"
            onClick={() => openModal('ship-profile')}
          >
            + NEW PROFILE
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Profile library */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-[10px] font-display text-slate-500 tracking-widest mb-4">SHIP PROFILES ({profiles.length})</p>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} onAddToBattle={setAddTarget} />
            ))}
          </div>
        </div>

        {/* Battle queue */}
        <div className="w-72 shrink-0 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <p className="text-[10px] font-display text-slate-500 tracking-widest mb-3">BATTLE QUEUE ({ships.length})</p>
            {ships.length === 0 ? (
              <p className="text-xs font-mono text-slate-600">No ships added yet.</p>
            ) : (
              <div className="space-y-1.5">
                {ships.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.faction === 'players' ? '#60a5fa' : s.faction === 'npc' ? '#f87171' : '#a3a3a3' }} />
                    <span className="truncate">{s.profile?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 space-y-2">
            {ships.length >= 2 && (
              <button
                className="w-full py-2.5 text-sm font-display tracking-widest text-sky-300 border border-sky-600 hover:bg-sky-900/30 rounded transition-colors"
                onClick={() => gotoScreen('battle')}
              >
                LAUNCH BATTLE ▶
              </button>
            )}
            {ships.length > 0 && (
              <>
                <button
                  className="w-full py-1.5 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
                  onClick={exportBattleState}
                >
                  SAVE BATTLE
                </button>
                <button
                  className="w-full py-1.5 text-xs font-display tracking-widest text-red-400 border border-red-900 hover:bg-red-900/20 rounded"
                  onClick={() => {
                    if (confirm('Clear all ships from battle?')) useBattleStore.getState().resetBattle()
                  }}
                >
                  CLEAR BATTLE
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {addTarget && (
        <AddToBattleDialog
          profile={addTarget}
          onConfirm={handleConfirmAdd}
          onCancel={() => setAddTarget(null)}
        />
      )}
    </div>
  )
}

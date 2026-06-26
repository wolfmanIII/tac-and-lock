import { useState } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'
import { ShipProfileForm } from '../forms/ShipProfileForm.jsx'
import { blankCriticalTracks } from '../../data/defaultProfiles.js'

function blankProfile() {
  return {
    name:       '',
    class:      '',
    hullPoints: 20,
    armour:     0,
    tacSpeed:   1,
    sensors:    { type: 'Basic', dm: 0 },
    computer:   { model: '', bandwidth: 0 },
    weapons:    [],
    software:   [],
    criticalTracks: blankCriticalTracks(),
    notes:      '',
  }
}

export function ShipProfileModal({ payload, onClose }) {
  const { profileId } = payload ?? {}
  const profiles   = useProfilesStore((s) => s.profiles)
  const addProfile = useProfilesStore((s) => s.addProfile)
  const updateProfile = useProfilesStore((s) => s.updateProfile)

  const existing = profiles.find((p) => p.id === profileId)
  const [draft, setDraft] = useState(existing ? { ...existing } : blankProfile())
  const [error, setError] = useState('')

  function save() {
    if (!draft.name.trim()) { setError('Ship name is required.'); return }
    if (!draft.hullPoints || draft.hullPoints < 1) { setError('Hull Points must be ≥ 1.'); return }
    setError('')
    if (existing) {
      updateProfile(existing.id, draft)
    } else {
      addProfile(draft)
    }
    onClose()
  }

  return (
    <div className="p-6 space-y-5" style={{ minWidth: 480, maxWidth: 600 }}>
      <div className="flex items-center justify-between">
        <p className="font-display text-sky-300 text-sm tracking-widest">
          {existing ? 'EDIT PROFILE' : 'NEW SHIP PROFILE'}
        </p>
        {existing && <p className="text-[10px] font-mono text-slate-500">{existing.id}</p>}
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <ShipProfileForm profile={draft} onChange={setDraft} />
      </div>

      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded"
          onClick={onClose}>CANCEL</button>
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-sky-300 border border-sky-700 hover:bg-sky-900/20 rounded"
          onClick={save}>
          {existing ? 'SAVE CHANGES' : 'CREATE PROFILE'}
        </button>
      </div>
    </div>
  )
}

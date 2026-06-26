import { WEAPONS, WEAPON_IDS } from '../../data/weapons.js'
import { FACTIONS } from '../../data/factions.js'
import { blankCriticalTracks } from '../../data/defaultProfiles.js'

const SENSOR_TYPES = ['Basic', 'Civilian', 'Military', 'Distributed Array', 'Enhanced Array']

/** Controlled form for creating/editing a ship profile. `onChange` fires on every field change. */
export function ShipProfileForm({ profile, onChange }) {
  const p = profile

  function set(field, value) {
    onChange({ ...p, [field]: value })
  }

  function setNested(parent, field, value) {
    onChange({ ...p, [parent]: { ...p[parent], [field]: value } })
  }

  function addWeapon() {
    const weapons = [...(p.weapons ?? []), { weaponId: WEAPON_IDS[0], count: 1, label: '' }]
    onChange({ ...p, weapons })
  }

  function updateWeapon(i, field, value) {
    const weapons = (p.weapons ?? []).map((w, idx) => idx === i ? { ...w, [field]: value } : w)
    onChange({ ...p, weapons })
  }

  function removeWeapon(i) {
    onChange({ ...p, weapons: (p.weapons ?? []).filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-display text-slate-500 tracking-widest mb-1">SHIP NAME *</label>
          <input
            value={p.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="ISV Nomad"
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-display text-slate-500 tracking-widest mb-1">CLASS</label>
          <input
            value={p.class ?? ''}
            onChange={(e) => set('class', e.target.value)}
            placeholder="ISV-2"
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          />
        </div>
      </div>

      {/* Hull */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-display text-slate-500 tracking-widest mb-1">HULL POINTS *</label>
          <input
            type="number" min={1} value={p.hullPoints ?? ''}
            onChange={(e) => set('hullPoints', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-display text-slate-500 tracking-widest mb-1">ARMOUR</label>
          <input
            type="number" min={0} value={p.armour ?? 0}
            onChange={(e) => set('armour', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-display text-slate-500 tracking-widest mb-1">TAC SPEED</label>
          <input
            type="number" min={1} max={12} value={p.tacSpeed ?? 1}
            onChange={(e) => set('tacSpeed', Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          />
        </div>
      </div>

      {/* Sensors */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">SENSORS</p>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={p.sensors?.type ?? 'Basic'}
            onChange={(e) => setNested('sensors', 'type', e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          >
            {SENSOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-display text-slate-500 tracking-widest">DM</label>
            <input
              type="number" min={-3} max={4} value={p.sensors?.dm ?? 0}
              onChange={(e) => setNested('sensors', 'dm', Number(e.target.value))}
              className="w-16 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Computer */}
      <div>
        <p className="text-[10px] font-display text-slate-500 tracking-widest mb-1">COMPUTER</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={p.computer?.model ?? ''}
            onChange={(e) => setNested('computer', 'model', e.target.value)}
            placeholder="Computer/5"
            className="bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-display text-slate-500 tracking-widest">BW</label>
            <input
              type="number" min={0} max={30} value={p.computer?.bandwidth ?? 0}
              onChange={(e) => setNested('computer', 'bandwidth', Number(e.target.value))}
              className="w-16 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Weapons */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-display text-slate-500 tracking-widest">WEAPONS</p>
          <button
            onClick={addWeapon}
            className="text-[10px] font-display text-sky-400 border border-sky-800 rounded px-2 py-0.5 hover:bg-sky-900/20"
          >+ ADD</button>
        </div>
        <div className="space-y-2">
          {(p.weapons ?? []).map((w, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={w.weaponId}
                onChange={(e) => updateWeapon(i, 'weaponId', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-2 py-1.5 focus:border-sky-400 outline-none"
              >
                {WEAPON_IDS.map((id) => <option key={id} value={id}>{WEAPONS[id]?.name ?? id}</option>)}
              </select>
              <input
                type="number" min={1} max={9} value={w.count}
                onChange={(e) => updateWeapon(i, 'count', Number(e.target.value))}
                className="w-12 text-center bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-1 py-1.5 focus:border-sky-400 outline-none"
                title="Count"
              />
              <input
                value={w.label}
                onChange={(e) => updateWeapon(i, 'label', e.target.value)}
                placeholder="label"
                className="w-28 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-2 py-1.5 focus:border-sky-400 outline-none"
              />
              <button onClick={() => removeWeapon(i)} className="text-red-500 hover:text-red-400 font-mono text-xs px-1">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] font-display text-slate-500 tracking-widest mb-1">NOTES</label>
        <textarea
          value={p.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none resize-none"
        />
      </div>
    </div>
  )
}

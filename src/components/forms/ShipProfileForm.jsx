import { WEAPONS, WEAPON_IDS } from '../../data/weapons.js'
import { FACTIONS } from '../../data/factions.js'
import { SOFTWARE, SOFTWARE_IDS } from '../../data/software.js'
import { blankCriticalTracks } from '../../data/defaultProfiles.js'

const INPUT_CLS = 'w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none'
const LABEL_CLS = 'block text-[10px] font-display text-slate-500 tracking-widest mb-1'

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

  function toggleSoftware(id) {
    const current = p.software ?? []
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    onChange({ ...p, software: next })
  }

  const softwareSet = new Set(p.software ?? [])

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>SHIP NAME *</label>
          <input
            value={p.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            placeholder="ISV Nomad"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>CLASS</label>
          <input
            value={p.class ?? ''}
            onChange={(e) => set('class', e.target.value)}
            placeholder="ISV-2"
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Tonnage + Faction */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>TONNAGE</label>
          <input
            type="number" min={1}
            value={p.tonnage ?? ''}
            onChange={(e) => set('tonnage', Number(e.target.value))}
            placeholder="100"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>FACTION</label>
          <select
            value={p.faction ?? 'neutral'}
            onChange={(e) => set('faction', e.target.value)}
            className={INPUT_CLS}
          >
            {FACTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hull */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={LABEL_CLS}>HULL POINTS *</label>
          <input
            type="number" min={1} value={p.hullPoints ?? ''}
            onChange={(e) => set('hullPoints', Number(e.target.value))}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>ARMOUR</label>
          <input
            type="number" min={0} value={p.armour ?? 0}
            onChange={(e) => set('armour', Number(e.target.value))}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>TAC SPEED</label>
          <input
            type="number" min={1} max={12} value={p.tacSpeed ?? 1}
            onChange={(e) => set('tacSpeed', Number(e.target.value))}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Sensors — free text for 2300AD multi-sensor strings, plus DM */}
      <div>
        <p className={LABEL_CLS}>SENSORS</p>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <input
            value={p.sensors?.type ?? ''}
            onChange={(e) => setNested('sensors', 'type', e.target.value)}
            placeholder="Basic Military, DSS, GADS"
            className={INPUT_CLS}
          />
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-display text-slate-500 tracking-widest whitespace-nowrap">DM</label>
            <input
              type="number" min={-4} max={6} value={p.sensors?.dm ?? 0}
              onChange={(e) => setNested('sensors', 'dm', Number(e.target.value))}
              className="w-16 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Computer */}
      <div>
        <p className={LABEL_CLS}>COMPUTER</p>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <input
            value={p.computer?.model ?? ''}
            onChange={(e) => setNested('computer', 'model', e.target.value)}
            placeholder="Computer/10"
            className={INPUT_CLS}
          />
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-display text-slate-500 tracking-widest whitespace-nowrap">BW</label>
            <input
              type="number" min={0} max={50} value={p.computer?.bandwidth ?? 0}
              onChange={(e) => setNested('computer', 'bandwidth', Number(e.target.value))}
              className="w-16 bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Software */}
      <div>
        <p className={LABEL_CLS}>SOFTWARE</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {SOFTWARE_IDS.map((id) => {
            const sw = SOFTWARE[id]
            return (
              <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={softwareSet.has(id)}
                  onChange={() => toggleSoftware(id)}
                  className="accent-sky-400 w-3.5 h-3.5"
                />
                <span className="font-mono text-xs text-slate-300">{sw.name}</span>
                {sw.bandwidth > 0 && (
                  <span className="font-mono text-[10px] text-slate-500">BW{sw.bandwidth}</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Weapons */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className={LABEL_CLS}>WEAPONS</p>
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
        <label className={LABEL_CLS}>NOTES</label>
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

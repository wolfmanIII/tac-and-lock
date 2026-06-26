import { v7 as uuidv7 } from 'uuid'
import { WEAPONS, WEAPON_IDS } from '../../data/weapons.js'
import { FACTIONS } from '../../data/factions.js'
import { SOFTWARE, SOFTWARE_IDS } from '../../data/software.js'
import { blankCrewMember } from '../../utils/crew.js'
import { blankCriticalTracks } from '../../data/defaultProfiles.js'

const INPUT_CLS = 'w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none'
const LABEL_CLS = 'block text-[10px] font-display text-slate-500 tracking-widest mb-1'

/** Skill keys shown per crew member — matches blankCrewMember() schema. */
const CREW_SKILL_KEYS = [
  'pilot', 'gunner', 'sensors', 'engineer',
  'tactics', 'leadership', 'mechanic', 'gunCombat',
]

// ── Crew member row (ported from thrust-and-drift) ────────────────────────

function CrewMemberRow({ member, onChange, onRemove }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded px-2.5 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={member.name}
          placeholder="Name"
          onChange={(e) => onChange({ ...member, name: e.target.value })}
          className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs rounded px-2 py-1 focus:border-sky-400 outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-400 font-mono text-sm leading-none transition-colors shrink-0 px-1"
        >✕</button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {CREW_SKILL_KEYS.map((sk) => (
          <label key={sk} className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] text-slate-500 tracking-wide uppercase">{sk}</span>
            <input
              type="number"
              min={0}
              max={5}
              value={member.skills?.[sk] ?? 0}
              onChange={(e) => onChange({
                ...member,
                skills: { ...member.skills, [sk]: Math.max(0, Math.min(5, Number(e.target.value) || 0)) },
              })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs rounded px-1.5 py-1 focus:border-sky-400 outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────

/** Controlled form for creating/editing a ship profile. `onChange` fires on every field change. */
export function ShipProfileForm({ profile, onChange }) {
  const p = profile

  function set(field, value) {
    onChange({ ...p, [field]: value })
  }

  function setNested(parent, field, value) {
    onChange({ ...p, [parent]: { ...p[parent], [field]: value } })
  }

  // ── Weapons ──────────────────────────────────────────────────────────────

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

  // ── Software ─────────────────────────────────────────────────────────────

  function toggleSoftware(id) {
    const current = p.software ?? []
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    onChange({ ...p, software: next })
  }

  // ── Crew ─────────────────────────────────────────────────────────────────

  function addCrewMember() {
    const crew = [...(p.crew ?? []), blankCrewMember(uuidv7())]
    onChange({ ...p, crew })
  }

  function updateCrewMember(idx, updated) {
    const crew = (p.crew ?? []).map((m, i) => i === idx ? updated : m)
    onChange({ ...p, crew })
  }

  function removeCrewMember(idx) {
    onChange({ ...p, crew: (p.crew ?? []).filter((_, i) => i !== idx) })
  }

  const softwareSet = new Set(p.software ?? [])

  return (
    <div className="space-y-5">

      {/* Identity */}
      <section className="space-y-3">
        <h3 className={LABEL_CLS}>IDENTIFICATION</h3>
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
      </section>

      {/* Combat stats */}
      <section className="space-y-3">
        <h3 className={LABEL_CLS}>COMBAT STATS</h3>
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
      </section>

      {/* Sensors + Computer */}
      <section className="space-y-3">
        <h3 className={LABEL_CLS}>SENSORS &amp; COMPUTER</h3>
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
      </section>

      {/* Software */}
      <section className="space-y-2">
        <h3 className={LABEL_CLS}>SOFTWARE</h3>
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
      </section>

      {/* Weapons */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={LABEL_CLS}>WEAPONS</h3>
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
      </section>

      {/* Crew */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={LABEL_CLS}>CREW MANIFEST ({(p.crew ?? []).length})</h3>
          <button
            type="button"
            onClick={addCrewMember}
            className="text-[10px] font-display text-sky-400 border border-sky-800 rounded px-2 py-0.5 hover:bg-sky-900/20"
          >+ ADD</button>
        </div>
        {(p.crew ?? []).length === 0 && (
          <p className="text-slate-500 font-mono text-xs italic">No crew assigned.</p>
        )}
        <div className="space-y-2">
          {(p.crew ?? []).map((member, idx) => (
            <CrewMemberRow
              key={member.id}
              member={member}
              onChange={(updated) => updateCrewMember(idx, updated)}
              onRemove={() => removeCrewMember(idx)}
            />
          ))}
        </div>
      </section>

      {/* Notes */}
      <section>
        <label className={LABEL_CLS}>NOTES</label>
        <textarea
          value={p.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-sky-400 outline-none resize-none"
        />
      </section>

    </div>
  )
}

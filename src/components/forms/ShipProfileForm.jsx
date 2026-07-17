/**
 * ShipProfileForm — create or edit a ship profile.
 * Self-contained: reads from profilesStore, saves on confirm.
 * Ported from thrust-and-drift ShipProfileForm pattern.
 */

import { useState } from 'react'
import { v7 as uuidv7 } from 'uuid'
import { useProfilesStore } from '../../store/profilesStore.js'
import { WEAPONS, WEAPON_IDS } from '../../data/weapons.js'
import { FACTIONS } from '../../data/factions.js'
import { SOFTWARE, SOFTWARE_IDS } from '../../data/software.js'
import { blankCrewMember } from '../../utils/crew.js'
import { blankCriticalTracks, blankSurfaceFixtureTracks } from '../../data/defaultProfiles.js'
import { REACTION_DRIVE_TYPES, SCREEN_RATINGS, TARGETING_SYSTEMS } from '../../utils/combat.js'

// ── Helpers ───────────────────────────────────────────────────────────────

// Which Gunner role's action budget/skill fires this weapon slot — Turret Gunner or Bay
// Gunner, each with an independent per-round action budget. // 2300AD B3 p.53, issue #45
const WEAPON_MOUNTS = [
  { id: 'turret', label: 'Turret' },
  { id: 'bay',    label: 'Bay' },
]

// Short option labels for the per-weapon Targeting System selector // 2300AD B3 p.62
const TARGETING_SYSTEM_SHORT_LABELS = {
  none:             'None',
  light_tta:        'Light TTA',
  tta:              'TTA',
  utes:             'UTES',
  drone_controller: 'Drone Ctrl',
}

function blankCrew() {
  return {
    pilot: null, captain: null, engineer: null,
    sensor_operator: null, gunner_turret: null,
    gunner_bay: null, marine: null,
  }
}

function blankProfile() {
  return {
    name: '', class: '', tonnage: 100, faction: 'neutral',
    hullPoints: 20, currentHull: 20, armour: 0, tacSpeed: 1,
    signature: 2,   // base Signature for enemy Electronics(sensors) // 2300AD B3 p.57
    reactionDriveType: 'rocket', // rocket/thruster/nuclear — Signature DM while active // 2300AD B3 p.57
    screenRating: 0,    // Defensive Screens installed Rating, 0 = none fitted // 2300AD B3 p.62
    screenReloads: 0,   // spare screen reloads carried
    sensors: { type: '', dm: 0 },
    computer: { model: '', bandwidth: 0 },
    weapons: [], software: [], crew: [],
    crewAssignments: blankCrew(),
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    notes: '',
  }
}

function initProfile(existing) {
  if (!existing) return blankProfile()
  const blank = blankProfile()
  return {
    ...blank,
    ...existing,
    sensors:              { ...existing.sensors },
    computer:             { ...existing.computer },
    weapons:              (existing.weapons ?? []).map((w) => ({ ...w })),
    software:             [...(existing.software ?? [])],
    crew:                 (existing.crew ?? []).map((m) => ({
      ...m,
      skills:          { ...m.skills },
      characteristics: { ...blank.crew?.characteristics, ...(m.characteristics ?? {}) },
    })),
    criticalTracks:       { ...blank.criticalTracks,       ...(existing.criticalTracks ?? {}) },
    surfaceFixtureTracks: { ...blank.surfaceFixtureTracks,  ...(existing.surfaceFixtureTracks ?? {}) },
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

const FIELD_CLS = 'w-full bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-sm rounded px-2 py-1 focus:outline-none focus:border-bronze-400/60'
const LABEL_CLS = 'font-mono text-xs text-gunmetal-400 tracking-widest'

function NumField({ label, value, onChange, min = 0, max = 9999 }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className={LABEL_CLS}>{label}</span>
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className={FIELD_CLS}
      />
    </label>
  )
}

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className={LABEL_CLS}>{label}</span>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLS}
      />
    </label>
  )
}

const CREW_SKILL_KEYS = ['pilot', 'gunner', 'sensors', 'engineer', 'tactics', 'leadership', 'mechanic', 'gunCombat']
const CHAR_KEYS       = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC']

function CrewMemberRow({ member, onChange, onRemove }) {
  return (
    <div className="bg-gunmetal-800 rounded px-2.5 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text" value={member.name} placeholder="Name"
          onChange={(e) => onChange({ ...member, name: e.target.value })}
          className="flex-1 bg-gunmetal-700 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-2 py-1 focus:outline-none focus:border-bronze-400/60 placeholder:text-gunmetal-400"
        />
        <button type="button" onClick={onRemove}
          className="text-gunmetal-400 hover:text-red-400 font-mono text-sm leading-none transition-colors shrink-0 px-1">✕</button>
      </div>
      <div>
        <p className="font-mono text-[9px] text-gunmetal-500 tracking-widest uppercase mb-1">Skills</p>
        <div className="grid grid-cols-4 gap-1.5">
          {CREW_SKILL_KEYS.map((sk) => (
            <label key={sk} className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] text-gunmetal-500 tracking-wide uppercase">{sk}</span>
              <input
                type="number" min={0} max={5} value={member.skills?.[sk] ?? 0}
                onChange={(e) => onChange({
                  ...member,
                  skills: { ...member.skills, [sk]: Math.max(0, Math.min(5, Number(e.target.value) || 0)) },
                })}
                className="w-full bg-gunmetal-700 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-1.5 py-1 focus:outline-none focus:border-bronze-400/60"
              />
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-mono text-[9px] text-gunmetal-500 tracking-widest uppercase mb-1">Characteristics (INT/DEX used in combat)</p>
        <div className="grid grid-cols-6 gap-1.5">
          {CHAR_KEYS.map((ch) => (
            <label key={ch} className="flex flex-col gap-0.5">
              <span className={`font-mono text-[9px] tracking-wide uppercase ${ch === 'INT' || ch === 'DEX' ? 'text-bronze-400' : 'text-gunmetal-500'}`}>{ch}</span>
              <input
                type="number" min={0} max={15} value={member.characteristics?.[ch] ?? 7}
                onChange={(e) => onChange({
                  ...member,
                  characteristics: { ...member.characteristics, [ch]: Math.max(0, Math.min(15, Number(e.target.value) || 0)) },
                })}
                className="w-full bg-gunmetal-700 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-1.5 py-1 focus:outline-none focus:border-bronze-400/60"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

/**
 * @param {{ profileId: string|null, onSave: Function, onCancel: Function }} props
 */
export function ShipProfileForm({ profileId, onSave, onCancel }) {
  const profiles      = useProfilesStore((s) => s.profiles)
  const addProfile    = useProfilesStore((s) => s.addProfile)
  const updateProfile = useProfilesStore((s) => s.updateProfile)

  const existing = profileId ? profiles.find((p) => p.id === profileId) : null
  const [form, setForm] = useState(() => initProfile(existing))
  const [error, setError] = useState(null)

  const isNew = !existing

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setNested = (parent, key, value) => setForm((f) => ({ ...f, [parent]: { ...f[parent], [key]: value } }))

  // weapons
  const addWeapon = () => setForm((f) => ({ ...f, weapons: [...f.weapons, { weaponId: WEAPON_IDS[0], count: 1, label: '', targetingSystem: 'none', mount: 'turret' }] }))
  const updateWeapon = (i, key, value) => setForm((f) => ({ ...f, weapons: f.weapons.map((w, idx) => idx === i ? { ...w, [key]: value } : w) }))
  const removeWeapon = (i) => setForm((f) => ({ ...f, weapons: f.weapons.filter((_, idx) => idx !== i) }))

  // software
  const toggleSoftware = (id) => setForm((f) => {
    const current = f.software ?? []
    return { ...f, software: current.includes(id) ? current.filter((s) => s !== id) : [...current, id] }
  })

  // crew
  const addCrew    = () => setForm((f) => ({ ...f, crew: [...f.crew, blankCrewMember(uuidv7())] }))
  const updateCrew = (i, updated) => setForm((f) => ({ ...f, crew: f.crew.map((m, idx) => idx === i ? updated : m) }))
  const removeCrew = (i) => setForm((f) => ({ ...f, crew: f.crew.filter((_, idx) => idx !== i) }))

  function handleSave() {
    if (!form.name.trim()) { setError('Ship name is required.'); return }
    if (!form.hullPoints || form.hullPoints < 1) { setError('Hull Points must be ≥ 1.'); return }
    setError(null)
    const data = { ...form, name: form.name.trim(), currentHull: form.hullPoints }
    if (isNew) addProfile(data)
    else updateProfile(existing.id, data)
    onSave()
  }

  const softwareSet = new Set(form.software ?? [])

  return (
    <div className="h-full flex flex-col">

      <div className="px-5 py-3 border-b border-gunmetal-800 shrink-0">
        <h2 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase">
          {isNew ? '+ NEW PROFILE' : `EDIT — ${existing?.name ?? ''}`}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Identification */}
        <section className="space-y-3">
          <h3 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase border-b border-gunmetal-800 pb-1">Identification</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><TextField label="NAME *" value={form.name} onChange={(v) => set('name', v)} placeholder="ISV Nomad" /></div>
            <TextField label="CLASS" value={form.class} onChange={(v) => set('class', v)} placeholder="ISV-2" />
            <NumField  label="TONNAGE" value={form.tonnage} onChange={(v) => set('tonnage', v)} min={1} />
          </div>
          <div>
            <label className="flex flex-col gap-0.5">
              <span className={LABEL_CLS}>FACTION</span>
              <select value={form.faction} onChange={(e) => set('faction', e.target.value)} className={FIELD_CLS}>
                {FACTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* Combat stats */}
        <section className="space-y-3">
          <h3 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase border-b border-gunmetal-800 pb-1">Combat Stats</h3>
          <div className="grid grid-cols-4 gap-3">
            <NumField label="HULL POINTS *" value={form.hullPoints} onChange={(v) => set('hullPoints', v)} min={1} />
            <NumField label="ARMOUR"        value={form.armour}     onChange={(v) => set('armour', v)} />
            <NumField label="TAC SPEED"     value={form.tacSpeed}   onChange={(v) => set('tacSpeed', v)} min={1} max={12} />
            <NumField label="SIGNATURE"     value={form.signature ?? 2} onChange={(v) => set('signature', v)} min={0} max={10} />
          </div>
          <p className="font-mono text-[9px] text-gunmetal-500">SIGNATURE: DM applied to enemy Electronics (sensors) checks // 2300AD B3 p.57</p>
          <div>
            <label className="flex flex-col gap-0.5">
              <span className={LABEL_CLS}>REACTION DRIVE TYPE</span>
              <select value={form.reactionDriveType ?? 'rocket'} onChange={(e) => set('reactionDriveType', e.target.value)} className={FIELD_CLS}>
                {REACTION_DRIVE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} (+{t.dm} Signature while active)</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-0.5">
              <span className={LABEL_CLS}>DEFENSIVE SCREENS</span>
              <select value={form.screenRating ?? 0} onChange={(e) => set('screenRating', Number(e.target.value))} className={FIELD_CLS}>
                {SCREEN_RATINGS.map((r) => <option key={r.rating} value={r.rating}>{r.label}</option>)}
              </select>
            </label>
            <NumField label="SCREEN RELOADS CARRIED" value={form.screenReloads ?? 0} onChange={(v) => set('screenReloads', v)} min={0} />
          </div>
          <p className="font-mono text-[9px] text-gunmetal-500">Defensive Screens: −DM to attack rolls (laser weapons only) equal to active Rating; depletes 1/hit, recharge with a reload // 2300AD B3 p.62</p>
        </section>

        {/* Sensors + Computer */}
        <section className="space-y-3">
          <h3 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase border-b border-gunmetal-800 pb-1">Sensors &amp; Computer</h3>
          <div className="grid grid-cols-[1fr_64px] gap-2 items-end">
            <TextField label="SENSORS" value={form.sensors?.type ?? ''} onChange={(v) => setNested('sensors', 'type', v)} placeholder="Basic Military, DSS, GADS" />
            <NumField  label="DM" value={form.sensors?.dm ?? 0} onChange={(v) => setNested('sensors', 'dm', v)} min={-4} max={6} />
          </div>
          <div className="grid grid-cols-[1fr_64px] gap-2 items-end">
            <TextField label="COMPUTER" value={form.computer?.model ?? ''} onChange={(v) => setNested('computer', 'model', v)} placeholder="Computer/10" />
            <NumField  label="BW" value={form.computer?.bandwidth ?? 0} onChange={(v) => setNested('computer', 'bandwidth', v)} min={0} max={50} />
          </div>
        </section>

        {/* Software */}
        <section className="space-y-2">
          <h3 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase border-b border-gunmetal-800 pb-1">Software</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {SOFTWARE_IDS.map((id) => {
              const sw = SOFTWARE[id]
              return (
                <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={softwareSet.has(id)} onChange={() => toggleSoftware(id)} className="w-3.5 h-3.5 accent-bronze-400" />
                  <span className="font-mono text-xs text-gunmetal-300">{sw.name}</span>
                  {sw.bandwidth > 0 && <span className="font-mono text-[10px] text-gunmetal-500">BW{sw.bandwidth}</span>}
                </label>
              )
            })}
          </div>
        </section>

        {/* Weapons */}
        <section className="space-y-2">
          <div className="flex items-center justify-between border-b border-gunmetal-800 pb-1">
            <h3 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase">Weapons ({form.weapons.length})</h3>
            <button type="button" onClick={addWeapon} className="text-bronze-400 font-mono text-xs border border-bronze-400/30 rounded px-2 py-0.5 hover:bg-bronze-400/10 transition-colors">+ Add</button>
          </div>
          {form.weapons.length === 0 && <p className="text-gunmetal-400 font-mono text-xs italic">No weapons.</p>}
          <div className="space-y-1.5">
            {form.weapons.map((w, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={w.weaponId} onChange={(e) => updateWeapon(i, 'weaponId', e.target.value)}
                  className="flex-1 bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-2 py-1 focus:outline-none focus:border-bronze-400/60">
                  {WEAPON_IDS.map((id) => <option key={id} value={id}>{WEAPONS[id]?.name ?? id}</option>)}
                </select>
                <input type="number" min={1} max={9} value={w.count} onChange={(e) => updateWeapon(i, 'count', Number(e.target.value))}
                  className="w-10 text-center bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-1 py-1 focus:outline-none focus:border-bronze-400/60" />
                <input value={w.label} onChange={(e) => updateWeapon(i, 'label', e.target.value)} placeholder="label"
                  className="w-28 bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-2 py-1 focus:outline-none focus:border-bronze-400/60 placeholder:text-gunmetal-500" />
                <select value={w.targetingSystem ?? 'none'} onChange={(e) => updateWeapon(i, 'targetingSystem', e.target.value)}
                  title="Targeting System (Light TTA/TTA/UTES) — separate, stackable DM from Fire Control software // B3 p.62"
                  className="w-28 bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-1 py-1 focus:outline-none focus:border-bronze-400/60">
                  {TARGETING_SYSTEMS.map((t) => <option key={t.id} value={t.id}>{TARGETING_SYSTEM_SHORT_LABELS[t.id]}</option>)}
                </select>
                <select value={w.mount ?? 'turret'} onChange={(e) => updateWeapon(i, 'mount', e.target.value)}
                  title="Which Gunner role fires this weapon — Turret or Bay, each with its own action budget // 2300AD B3 p.53, issue #45"
                  className="w-20 bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-xs rounded px-1 py-1 focus:outline-none focus:border-bronze-400/60">
                  {WEAPON_MOUNTS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <button type="button" onClick={() => removeWeapon(i)} className="text-gunmetal-400 hover:text-red-400 font-mono text-sm transition-colors px-1">✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Crew */}
        <section className="space-y-2">
          <div className="flex items-center justify-between border-b border-gunmetal-800 pb-1">
            <h3 className="font-mono text-xs text-gunmetal-400 tracking-widest uppercase">Crew Manifest ({form.crew.length})</h3>
            <button type="button" onClick={addCrew} className="text-bronze-400 font-mono text-xs border border-bronze-400/30 rounded px-2 py-0.5 hover:bg-bronze-400/10 transition-colors">+ Add</button>
          </div>
          {form.crew.length === 0 && <p className="text-gunmetal-400 font-mono text-xs italic">No crew assigned.</p>}
          <div className="space-y-2">
            {form.crew.map((member, idx) => (
              <CrewMemberRow key={member.id} member={member}
                onChange={(updated) => updateCrew(idx, updated)}
                onRemove={() => removeCrew(idx)} />
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="flex flex-col gap-0.5">
            <span className={LABEL_CLS}>NOTES</span>
            <textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2}
              className="w-full bg-gunmetal-800 border border-gunmetal-600 text-gunmetal-200 font-mono text-sm rounded px-2 py-1 focus:outline-none focus:border-bronze-400/60 resize-none" />
          </label>
        </section>

      </div>

      <div className="px-5 py-3 border-t border-gunmetal-800 shrink-0 space-y-2">
        {error && <p className="text-red-400 font-mono text-xs">🚨 {error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 border border-gunmetal-700 text-gunmetal-400 font-mono text-xs rounded hover:border-gunmetal-500 transition-colors">
            CANCEL
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 py-2 bg-bronze-400/10 border border-bronze-400/40 text-bronze-400 font-mono text-xs tracking-widest rounded hover:bg-bronze-400/20 transition-colors">
            {isNew ? '+ CREATE PROFILE' : '✅ SAVE CHANGES'}
          </button>
        </div>
      </div>

    </div>
  )
}

import { useState } from 'react'
import { v7 as uuidv7 } from 'uuid'
import { useBattleStore } from '../../store/battleStore.js'
import { blankCrewMember, buildDefaultAssignments, CREW_SKILLS } from '../../utils/crew.js'

const ROLES = Object.keys(CREW_SKILLS)

export function CrewAssignmentModal({ payload, onClose }) {
  const { shipId } = payload ?? {}
  const ships   = useBattleStore((s) => s.ships)
  const updateShip = useBattleStore((s) => s.updateShip)

  const ship = ships.find((s) => s.id === shipId)
  const initialCrew = ship?.crew ?? []
  const initialAssignments = ship?.crewAssignments ?? buildDefaultAssignments()

  const [crew,        setCrew]        = useState(initialCrew.length ? [...initialCrew] : [blankCrewMember(uuidv7())])
  const [assignments, setAssignments] = useState({ ...initialAssignments })

  function addCrewMember() {
    setCrew((c) => [...c, blankCrewMember(uuidv7())])
  }

  function updateMember(i, field, value) {
    setCrew((c) => c.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  function updateSkill(memberId, skill, value) {
    setCrew((c) => c.map((m) => m.id === memberId
      ? { ...m, skills: { ...m.skills, [skill]: Number(value) } }
      : m))
  }

  function removeMember(i) {
    const removed = crew[i]
    setCrew((c) => c.filter((_, idx) => idx !== i))
    // Clear any assignments referencing removed member
    setAssignments((a) => {
      const next = { ...a }
      Object.keys(next).forEach((role) => { if (next[role] === removed.id) delete next[role] })
      return next
    })
  }

  function assignRole(role, crewId) {
    setAssignments((a) => ({ ...a, [role]: crewId || null }))
  }

  function save() {
    if (updateShip) updateShip(shipId, { crew, crewAssignments: assignments })
    onClose()
  }

  if (!ship) return (
    <div className="p-6">
      <p className="text-gunmetal-400 font-mono text-sm">Ship not found.</p>
      <button onClick={onClose} className="mt-4 px-4 py-2 text-xs font-display text-gunmetal-300 border border-gunmetal-600 rounded">CLOSE</button>
    </div>
  )

  return (
    <div className="p-6 space-y-5" style={{ minWidth: 540, maxWidth: 640 }}>
      <div className="flex items-center justify-between">
        <p className="font-display text-bronze-300 text-sm tracking-widest">CREW ASSIGNMENT</p>
        <p className="text-xs font-mono text-gunmetal-400">{ship.profile?.name}</p>
      </div>

      {/* Crew list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-display text-gunmetal-500 tracking-widest">CREW MEMBERS</p>
          <button
            onClick={addCrewMember}
            className="text-[10px] font-display text-bronze-400 border border-bronze-800 rounded px-2 py-0.5 hover:bg-bronze-900/20">
            + ADD
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {crew.map((m, i) => (
            <div key={m.id} className="bg-gunmetal-800/50 border border-gunmetal-700 rounded p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  value={m.name}
                  onChange={(e) => updateMember(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="flex-1 bg-gunmetal-900 border border-gunmetal-700 text-gunmetal-200 font-mono text-xs rounded px-2 py-1 focus:border-bronze-400 outline-none"
                />
                <button onClick={() => removeMember(i)} className="text-red-500 hover:text-red-400 font-mono text-xs px-1">×</button>
              </div>
              {/* Skills */}
              <div className="grid grid-cols-3 gap-2">
                {['pilot', 'gunner', 'sensors', 'engineer', 'tactics', 'leadership', 'mechanic', 'gunCombat', 'melee', 'countermeasures'].map((sk) => (
                  <div key={sk} className="flex items-center gap-1">
                    <label className="text-[9px] font-display text-gunmetal-500 tracking-widest capitalize w-16 truncate">{sk}</label>
                    <input
                      type="number" min={0} max={4} value={m.skills?.[sk] ?? 0}
                      onChange={(e) => updateSkill(m.id, sk, e.target.value)}
                      className="w-10 text-center bg-gunmetal-900 border border-gunmetal-700 text-gunmetal-200 font-mono text-xs rounded px-1 py-0.5 focus:border-bronze-400 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role assignments */}
      {crew.length > 0 && (
        <div>
          <p className="text-[10px] font-display text-gunmetal-500 tracking-widest mb-2">ROLE ASSIGNMENTS</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <div key={role} className="flex items-center gap-2">
                <label className="text-[10px] font-display text-gunmetal-400 tracking-widest capitalize w-20 shrink-0">{role}</label>
                <select
                  value={assignments[role] ?? ''}
                  onChange={(e) => assignRole(role, e.target.value)}
                  className="flex-1 bg-gunmetal-800 border border-gunmetal-700 text-gunmetal-200 font-mono text-xs rounded px-1 py-1 focus:border-bronze-400 outline-none"
                >
                  <option value="">— unassigned —</option>
                  {crew.map((m) => <option key={m.id} value={m.id}>{m.name || m.id.slice(0, 8)}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gunmetal-800">
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-gunmetal-400 border border-gunmetal-700 hover:bg-gunmetal-800 rounded"
          onClick={onClose}>CANCEL</button>
        <button
          className="flex-1 py-2 text-xs font-display tracking-widest text-bronze-300 border border-bronze-700 hover:bg-bronze-900/20 rounded"
          onClick={save}>SAVE CREW</button>
      </div>
    </div>
  )
}

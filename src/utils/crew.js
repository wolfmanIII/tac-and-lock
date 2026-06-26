// Trav2022 CRB p.161 — Ship crew roles and skill resolution.

/**
 * Canonical crew roles and the primary skill used in combat for each.
 * Marine added for 2300AD boarding actions.
 * @type {Record<string, string>}
 */
export const CREW_SKILLS = {
  pilot:           'Pilot',
  captain:         'Tactics (naval)',
  engineer:        'Engineer (stutterwarp)',
  sensor_operator: 'Electronics (sensors)',
  gunner_turret:   'Gunner (turret)',
  gunner_bay:      'Gunner (bay)',
  marine:          'Gun Combat',
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   role: string | null,
 *   skills: Record<string, number>,
 *   characteristics: Record<string, number>,
 * }} CrewMember
 */

/**
 * Create a blank crew member with default values.
 * @param {string} id
 * @param {string} [name]
 * @returns {CrewMember}
 */
export function blankCrewMember(id, name = 'Unknown') {
  return {
    id,
    name,
    role: null,
    skills: {
      pilot:           0,
      tactics:         0,
      engineer:        0,
      gunner:          0,
      sensors:         0,
      countermeasures: 0,
      leadership:      0,
      mechanic:        0,
      gunCombat:       0,
      melee:           0,
    },
    characteristics: {
      STR: 7,
      DEX: 7,
      END: 7,
      INT: 7,
      EDU: 7,
      SOC: 7,
    },
  }
}

/**
 * Get the base skill level for a crew member's assigned role.
 * @param {CrewMember} crew
 * @returns {number}
 */
export function getCrewSkill(crew) {
  const skillMap = {
    pilot:           crew.skills.pilot           ?? 0,
    captain:         crew.skills.tactics         ?? 0,
    engineer:        crew.skills.engineer        ?? 0,
    sensor_operator: crew.skills.sensors         ?? 0,
    gunner_turret:   crew.skills.gunner          ?? 0,
    gunner_bay:      crew.skills.gunner          ?? 0,
    marine:          crew.skills.gunCombat       ?? 0,
  }
  return skillMap[crew.role] ?? 0
}

/**
 * Build a default crew assignment map for a ship (one crew member per role, unassigned).
 * @returns {Record<string, string | null>} — role → crew member ID or null
 */
export function buildDefaultAssignments() {
  return Object.fromEntries(Object.keys(CREW_SKILLS).map((role) => [role, null]))
}

/**
 * Return the skill level of the crew member assigned to a given role.
 * @param {string} role
 * @param {Record<string, string | null>} assignments — role → crew ID
 * @param {CrewMember[]} crewList
 * @returns {number}
 */
export function getAssignedSkill(role, assignments, crewList) {
  const assignedId = assignments[role]
  if (!assignedId) return 0
  const crew = crewList.find((c) => c.id === assignedId)
  if (!crew) return 0
  return getCrewSkill({ ...crew, role })
}

/**
 * Effective skill: max of assigned crew skill and 0 (untrained penalty applies if < 0 in Traveller).
 * @param {string} role
 * @param {Record<string, string | null>} assignments
 * @param {CrewMember[]} crewList
 * @returns {number}
 */
export function getEffectiveSkill(role, assignments, crewList) {
  return getAssignedSkill(role, assignments, crewList)
}

/**
 * Migrate a crew member object from an older profile version.
 * Ensures all expected keys exist.
 * @param {Partial<CrewMember>} raw
 * @param {string} id
 * @returns {CrewMember}
 */
export function migrateCrew(raw, id) {
  const blank = blankCrewMember(id, raw.name)
  return {
    ...blank,
    ...raw,
    id,
    skills: { ...blank.skills, ...(raw.skills ?? {}) },
    characteristics: { ...blank.characteristics, ...(raw.characteristics ?? {}) },
  }
}

// 2300AD B3 p.53 — Ship crew roles and skill resolution.

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
  remote_pilot:    'Electronics (remote ops)', // pilots and fights drones/fighters // 2300AD B3 p.53, p.55
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
      remoteOps:       0,
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
    remote_pilot:    crew.skills.remoteOps       ?? 0,
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
 * Level of the crew member assigned as Captain in the Leadership skill — distinct from
 * getCrewSkill's Tactics (naval) (used for the Captain's general per-round action budget).
 * Commands are capped at one per round per Leadership level. // 2300AD B3 p.54
 * @param {Record<string, string | null>} crewAssignments
 * @param {CrewMember[]} crewList
 * @returns {number}
 */
export function getCaptainLeadershipSkill(crewAssignments, crewList) {
  const captain = (crewList ?? []).find((c) => c.id === crewAssignments?.captain)
  return captain?.skills?.leadership ?? 0
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
 * Build the per-role action budget for a round: "Travellers can take a number of
 * actions on their turn equal to their skill level in the primary skill for their
 * role." Gunnery is the explicit exception — "Gunnery cannot" be used more than
 * once per round, so gunner_turret/gunner_bay are hard-capped at 1 regardless of
 * skill level. // 2300AD B3 p.53
 * @param {Record<string, string | null>} [crewAssignments] — role → crew ID
 * @param {CrewMember[]} [crew]
 * @returns {Record<string, number>} role → actions remaining this round
 */
export function buildActionBudget(crewAssignments, crew) {
  const budget = {}
  for (const role of Object.keys(CREW_SKILLS)) {
    const skill = getAssignedSkill(role, crewAssignments ?? {}, crew ?? [])
    budget[role] = (role === 'gunner_turret' || role === 'gunner_bay')
      ? Math.min(1, skill)
      : Math.max(0, skill)
  }
  return budget
}

/**
 * The primary characteristic used by each crew role in 2300AD combat checks. // 2300AD B3 p.53–56
 * Sensor Op: INT (Electronics sensors check). Pilot: DEX (Pilot check). Gunner: INT (Gunner check).
 * Captain: INT (Tactics naval check). Engineer: INT (Engineer power/stutterwarp check).
 */
export const ROLE_PRIMARY_CHARACTERISTIC = {
  pilot:           'DEX', // Firing Solution Step 2 // B3 p.56
  captain:         'INT', // Initiative + Tactics assist // B3 p.54, p.56
  engineer:        'INT', // Engineer power assists // B3 p.56
  sensor_operator: 'INT', // Firing Solution Step 1 // B3 p.56
  gunner_turret:   'INT', // Firing Solution Step 3; Point Defence uses DEX // B3 p.56, p.55
  gunner_bay:      'INT', // same as turret gunner
  marine:          'STR', // boarding actions
  remote_pilot:    'DEX', // drone/fighter Pilot-equivalent checks // 2300AD B3 p.55
}

/**
 * Return the characteristic value of the crew member assigned to a given role.
 * Falls back to 7 (DM+0) when no crew is assigned.
 * @param {string} role
 * @param {Record<string, string | null>} assignments — role → crew ID
 * @param {import('./crew.js').CrewMember[]} crewList
 * @param {string} [characteristic] — override to query a specific stat (default: role's primary)
 * @returns {number}
 */
export function getAssignedCharacteristic(role, assignments, crewList, characteristic) {
  const stat = characteristic ?? ROLE_PRIMARY_CHARACTERISTIC[role] ?? 'INT'
  const assignedId = assignments[role]
  if (!assignedId) return 7
  const crew = crewList.find((c) => c.id === assignedId)
  return crew?.characteristics?.[stat] ?? 7
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

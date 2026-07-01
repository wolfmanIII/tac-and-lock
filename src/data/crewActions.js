// 2300AD B3 p.55–56 — Crew actions in combat.
// Actions Phase unless marked as Reaction (executed during Attack Step).

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   phase: 'manoeuvre' | 'attack' | 'actions',
 *   reaction: boolean,
 *   skill: string,
 *   difficulty: number,
 *   difficultyLabel: string,
 *   description: string,
 *   requiresTarget: boolean,
 * }} CrewAction
 */

/** @type {Record<string, CrewAction[]>} */
export const CREW_ACTIONS = {
  pilot: [
    {
      id: 'evasive_action',
      label: 'Evasive Action',
      phase: 'manoeuvre',
      reaction: false,
      skill: 'Pilot (DEX)',
      difficulty: 10,
      difficultyLabel: 'Opposed (10+)',
      description: 'Opposed Pilot (DEX) check vs 10. Effect 1–4 → DM−1 to incoming attacks; Effect 5+ → DM−2; Effect ≤−5 → enemy gains DM+1. // 2300AD B3 p.55',
      requiresTarget: false,
    },
  ],

  captain: [
    {
      id: 'sensor_lock',
      label: 'Sensor Lock',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (sensors)',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Electronics (sensors) Average (8+). On success, all attacks vs locked target gain DM+Effect (min +1) this round. Lock ends at round end.',
      requiresTarget: true,
    },
    {
      id: 'electronic_warfare',
      label: 'Electronic Warfare',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (countermeasures)',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Jam a target ship\'s sensors and fire control. On success, target suffers DM-Effect to all attacks and sensor checks this round.',
      requiresTarget: true,
    },
    {
      id: 'commands',
      label: 'Commands',
      phase: 'actions',
      reaction: false,
      skill: 'Leadership',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Leadership (INT or SOC) Average (8+). Issue an order to one crew member. Effect 1–4: DM+1 to their actions next round. Effect 5–6: DM+2. Activates the round AFTER this one (Actions Step is the last step of the round). // 2300AD B3 p.54',
      requiresTarget: false,
      targetsCrewRole: true, // picks a role of this ship's own crew, not an enemy ship
    },
  ],

  engineer: [
    {
      id: 'overload_stutterwarp',
      label: 'Overload Stutterwarp',
      phase: 'actions',
      reaction: false,
      skill: 'Engineer (stutterwarp)',
      difficulty: 10,
      difficultyLabel: 'Hard (10+)',
      description: 'Push the tactical stutterwarp past safe limits. Hard (10+). Success: +1 TAC Speed this round. Failure: DM-2 roll on stutterwarp critical track.',
      requiresTarget: false,
    },
    {
      id: 'emergency_repair',
      label: 'Emergency Repair',
      phase: 'actions',
      reaction: false,
      skill: 'Engineer',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Average (8+) Engineer check. Restore 1 hull point or reduce one critical hit track by 1 severity. Each attempt takes the full Actions phase.',
      requiresTarget: false,
    },
    {
      id: 'damage_control',
      label: 'Damage Control',
      phase: 'actions',
      reaction: false,
      skill: 'Mechanic',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Mechanic Average (8+). Halt or slow an active hull breach, fuel leak, or fire. Effect 4+ suppresses secondary effect for 1D rounds.',
      requiresTarget: false,
    },
  ],

  sensor_operator: [
    {
      id: 'active_sensors',
      label: 'Active Sensors',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (sensors)',
      difficulty: 6,
      difficultyLabel: 'Easy (6+)',
      description: 'Boost active sensor sweep. On success, reveal hidden ship positions and missile salvos at Very Long or Distant range.',
      requiresTarget: false,
    },
    {
      id: 'ew_countermeasure',
      label: 'EW Countermeasures',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (countermeasures)',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Counter incoming electronic warfare. Opposed Electronics (countermeasures) check vs attacker\'s EW roll; success negates their EW DM this round.',
      requiresTarget: true,
    },
  ],

  gunner: [
    {
      id: 'point_defence',
      label: 'Point Defence',
      phase: 'attack',
      reaction: true,
      skill: 'Gunner (turret) DEX',
      difficulty: 10,
      difficultyLabel: 'Difficult (10+)',
      description: 'Reaction: Gunner (turret) Difficult (10+) DEX. Each success reduces salvo size by 1. Weapons with Point Defence trait get DM+2 vs missiles at Close range. // 2300AD B3 p.55',
      requiresTarget: false,
    },
  ],

  marine: [
    {
      id: 'boarding_action',
      label: 'Boarding Action',
      phase: 'actions',
      reaction: false,
      skill: 'Gun Combat / Melee',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Marines attempt to breach and board target vessel. Must be at Adjacent range. DM-2 on attacker (Trav2022 CRB p.164).',
      requiresTarget: true,
    },
    {
      id: 'repel_boarders',
      label: 'Repel Boarders',
      phase: 'actions',
      reaction: true,
      skill: 'Gun Combat / Melee',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Defender marines resist boarding. Opposed roll; effect determines casualties on both sides.',
      requiresTarget: false,
    },
  ],
}

/** Flat list of all actions across all roles. */
export const ALL_CREW_ACTIONS = Object.values(CREW_ACTIONS).flat()

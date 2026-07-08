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

// Note: Evasion (opposed Pilot check, B3 p.55) is resolved directly inside
// ManoeuvreModal during the Manoeuvre Step, not as an Actions-phase crew
// action — there is no separate "pilot" role entry here.

/** @type {Record<string, CrewAction[]>} */
export const CREW_ACTIONS = {
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
      id: 'electronic_warfare',
      label: 'Electronic Warfare',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (comms)',
      difficulty: 10,
      difficultyLabel: 'Difficult (10+)',
      description: 'Disrupt a target ship\'s locks. Effect 1–4: target suffers DM−1 to Gunner checks this round. Effect 5–6: DM−2. Effect ≤−5: the target instead gains DM+1, having triangulated the jammer\'s emissions. // 2300AD B3 p.54',
      requiresTarget: true,
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

  // Point Defence moved to an inline reaction inside the drone/missile attack
  // resolution flow (DroneAttackModal) — see doc/drone-combat-redesign-spec.md.
  // It intercepts one specific drone at a time, not an abstract "salvo".

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

// Trav2022 CRB p.165–166 — Crew actions in combat.
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
      skill: 'Pilot',
      difficulty: 0, // no check — costs TAC Speed
      difficultyLabel: 'TAC Speed cost',
      description: 'Spend 1+ TAC Speed to gain evasion DM against incoming attacks this round. Each point spent grants DM-1 to all attacks targeting this ship.',
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
      id: 'leading_fire',
      label: 'Leading Fire',
      phase: 'actions',
      reaction: false,
      skill: 'Tactics (naval)',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Tactics (naval) Average (8+). Coordinate all gunners this round — on success, all attacks gain DM+1. Effect 4+ grants DM+2.',
      requiresTarget: false,
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
      skill: 'Gunner (turret)',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Reaction: shoot down an incoming missile salvo. Each success reduces salvo size by 1. Sandcasters and pulse lasers are most effective.',
      requiresTarget: false,
    },
    {
      id: 'deploy_sand',
      label: 'Deploy Sand',
      phase: 'attack',
      reaction: true,
      skill: 'Gunner (turret)',
      difficulty: 0,
      difficultyLabel: 'Automatic',
      description: 'Reaction: deploy sandcaster to absorb incoming laser fire. Each sandcaster adds +1 Armour vs one attack. No roll required.',
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

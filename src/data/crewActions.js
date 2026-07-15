// 2300AD B3 p.55–56 — Crew actions in combat.
// No "Manoeuvre/Attack/Actions Step" in 2300AD B3 (that's a Traveller CRB import,
// removed in #19) — these are just the actions available to the Captain/Engineer/
// Sensor Operator/Marine roles, spendable any time during a ship's turn from that
// role's own actionsRemaining budget (see utils/crew.js buildActionBudget). The
// `phase` field below is a display-grouping leftover, not enforced anywhere.

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

// Note: Evasion (opposed Pilot check, B3 p.54) is resolved directly inside
// ManoeuvreModal as a Pilot action, not as a captain/engineer/sensor_operator/
// marine crew action — there is no separate "pilot" role entry here.

// Note: "Sensor Lock" is not a 2300AD B3 action — it only exists in the
// Traveller 2022 CRB (flat DM+2, persists until broken by enemy EW), and B3
// p.52-62 has no equivalent. Deliberately not implemented; the closest B3
// concept (Scan Target's range-band reduction for the Firing Solution) is a
// different mechanic and is not currently modeled either.

/** @type {Record<string, CrewAction[]>} */
export const CREW_ACTIONS = {
  captain: [
    {
      id: 'commands',
      label: 'Commands',
      phase: 'actions',
      reaction: false,
      skill: 'Leadership',
      difficulty: 8,
      difficultyLabel: 'Routine (8+)',
      description: 'Leadership (INT or SOC) Routine (8+). One command per Leadership skill level, each to a different crew member. Effect 1–4: DM+1 to their actions this round. Effect 5–6: DM+2. Applies immediately — the Captain acts first, so a Command issued early in the ship\'s turn is available to that role\'s actions later this same round. Draws from the Captain\'s shared action budget (actionsRemaining.captain), same pool as the Tactics assist and Issue Order. // 2300AD B3 p.53–54',
      requiresTarget: false,
      targetsCrewRole: true, // picks a role of this ship's own crew, not an enemy ship
    },
    {
      id: 'issue_order',
      label: 'Issue Order (grant +1 action)',
      phase: 'actions',
      reaction: false,
      skill: 'Leadership',
      difficulty: 0, // no check required — a pure action-economy transfer // 2300AD B3 p.53
      difficultyLabel: 'No check',
      description: 'The captain spends one of their own actions to grant another crew role +1 action this round. Distinct from Commands (a DM+1/+2 buff, capped by Leadership level, applied immediately this round) — this is an immediate action-economy transfer, no roll. // 2300AD B3 p.53',
      requiresTarget: false,
      targetsCrewRole: true,
    },
  ],

  engineer: [
    {
      id: 're_route_power',
      label: 'Re-route Power',
      phase: 'actions',
      reaction: false,
      skill: 'Engineer (power)',
      difficulty: 8,
      difficultyLabel: 'Average (8+)',
      description: 'Redistribute available power after damage or a shortfall. No numeric Effect table in B3 (further detail is in the Aerospace Engineer\'s Handbook, a supplement not in this project\'s sources) — informational: GM narrates the resolution, e.g. temporarily restoring a system taken offline by a Power Plant or Radiator critical. // 2300AD B3 p.54',
      requiresTarget: false,
    },
    {
      id: 'overload_stutterwarp',
      label: 'Overload Stutterwarp',
      phase: 'actions',
      reaction: false,
      skill: 'Engineer (stutterwarp)',
      difficulty: 10,
      difficultyLabel: 'Difficult (10+)',
      description: 'Push the tactical stutterwarp past safe limits. Difficult (10+). Success: Effect 1–4 → +1 TAC Speed, Effect 5–6 → +2 this round. // 2300AD B3 p.54',
      requiresTarget: false,
    },
    {
      id: 'emergency_repair',
      label: 'Emergency Repair',
      phase: 'actions',
      reaction: false,
      skill: 'Mechanic',
      difficulty: 10,
      difficultyLabel: 'Difficult (10+)',
      description: 'Difficult (10+) Mechanic check (1D minutes). Restore 5 hull points or reduce one critical hit track by 1 severity. Each attempt takes the full Actions phase. // 2300AD B3 p.56–57',
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
      // Houserule — not found anywhere in 2300AD B3 p.44-58 (verified by full-text
      // search of the Sensor Operations and Signature sections). The only related
      // B3 rule is passive: using active sensors (incl. TTA/UTES) raises own
      // Signature by +1 (see `activeSensorsOn` in computeEffectiveSignature). This
      // rollable "reveal hidden positions" effect is not sourced to any page.
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
    {
      id: 'scan_target',
      label: 'Scan Target',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (sensors)',
      difficulty: 8,
      difficultyLabel: 'Routine (8+)',
      description: 'Scan a target for information (DM−1 per range band between ships). Effect 1–3: base info at current range (Trav CRB p.151). Effect 4–5: info as if one range band closer. Effect 6: as if two range bands closer. Informational — GM narrates the result. // 2300AD B3 p.54',
      requiresTarget: true,
    },
    {
      id: 'improve_critical',
      label: 'Improve Critical',
      phase: 'actions',
      reaction: false,
      skill: 'Electronics (sensors)',
      difficulty: 12,
      difficultyLabel: 'Very Difficult (12+)',
      description: 'Find a weakness in a target\'s defences (DM−1 per range band). On success, this ship\'s next Firing Solution shot this round scores a critical hit at Effect 5+ instead of 6+ (or Effect 4+ if this check itself had Effect 6+). // 2300AD B3 p.54',
      requiresTarget: false,
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
      skill: null,
      difficulty: 0,
      difficultyLabel: null,
      description: 'Marines attempt to breach and board target vessel. Must be at Adjacent range. No skill check — flat 2D6 + modifiers (Superior Armour/Weaponry/Skill&Tactics/Numbers, Defender w/o Marines) per side; the difference (attacker − defender total) is read off the Boarding Actions results table. // Trav2022 CRB p.175 (referenced by 2300AD B3 p.57)',
      requiresTarget: true,
    },
    {
      id: 'repel_boarders',
      label: 'Repel Boarders',
      phase: 'actions',
      reaction: true,
      skill: null,
      difficulty: 0,
      difficultyLabel: null,
      description: 'Defender marines resist boarding. No independent check — CRB p.175 resolves in one unified opposed roll via the attacker\'s Boarding Action. This just marks defending marines as actively engaged (spends the action); roll the flat 2D6 + modifiers total here and enter it as DEFENDER TOTAL in Boarding Action.',
      requiresTarget: false,
    },
  ],
}

/** Flat list of all actions across all roles. */
export const ALL_CREW_ACTIONS = Object.values(CREW_ACTIONS).flat()

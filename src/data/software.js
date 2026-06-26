// 2300AD B3 p.44 — Ship's computer software.
// No Manoeuvre/Evade software in 2300AD — those are CRB-only.
// Stutterwarp Control bandwidth = 2 × Warp Efficiency (per B3 p.44).

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   TL: number,
 *   bandwidth: number,
 *   effect: string,
 *   combatEffect?: { type: string, value: number } | null,
 * }} SoftwareDef
 */

/** @type {Record<string, SoftwareDef>} */
export const SOFTWARE = {
  operations: {
    id: 'operations',
    name: 'Operations',
    TL: 10,
    bandwidth: 0,
    effect: 'Basic ship control and life support. Always running (included).',
    combatEffect: null,
  },

  intellect: {
    id: 'intellect',
    name: 'Intellect',
    TL: 10,
    bandwidth: 10,
    effect: 'Allows a ship to understand and obey naturally-phrased verbal commands.',
    combatEffect: null,
  },

  stutterwarp_control: {
    id: 'stutterwarp_control',
    name: 'Stutterwarp Control',
    TL: 0, // same TL as the drive
    bandwidth: 0, // variable: 2 × Warp Efficiency — stored per ship
    effect: 'Enables stutterwarp FTL travel. Bandwidth = 2 × Warp Efficiency rating.',
    combatEffect: null,
  },

  fire_control_1: {
    id: 'fire_control_1',
    name: 'Fire Control/1',
    TL: 10,
    bandwidth: 5,
    effect: 'DM+1 to Gunner check (step 3 of Firing Solution). // 2300AD B3 p.44',
    combatEffect: { type: 'fire_control_dm', value: 1 },
  },

  fire_control_2: {
    id: 'fire_control_2',
    name: 'Fire Control/2',
    TL: 11,
    bandwidth: 10,
    effect: 'DM+2 to Gunner check (step 3 of Firing Solution). // 2300AD B3 p.44',
    combatEffect: { type: 'fire_control_dm', value: 2 },
  },

  fire_control_3: {
    id: 'fire_control_3',
    name: 'Fire Control/3',
    TL: 12,
    bandwidth: 15,
    effect: 'DM+3 to Gunner check (step 3 of Firing Solution). // 2300AD B3 p.44',
    combatEffect: { type: 'fire_control_dm', value: 3 },
  },

  auto_repair_1: {
    id: 'auto_repair_1',
    name: 'Auto-Repair/1',
    TL: 10,
    bandwidth: 10,
    effect: '1 automated repair attempt per round, or DM+1 to a manual repair check. Requires repair drones. // 2300AD B3 p.44',
    combatEffect: { type: 'repair_dm', value: 1 },
  },

  auto_repair_2: {
    id: 'auto_repair_2',
    name: 'Auto-Repair/2',
    TL: 11,
    bandwidth: 20,
    effect: '2 automated repair attempts per round, or DM+2 to a manual repair check. Requires repair drones. // 2300AD B3 p.44',
    combatEffect: { type: 'repair_dm', value: 2 },
  },

  archive: {
    id: 'archive',
    name: 'Archive',
    TL: 10,
    bandwidth: 0,
    effect: 'Contains a wealth of data on numerous subjects (included).',
    combatEffect: null,
  },
}

export const SOFTWARE_IDS = [
  'operations',
  'intellect',
  'stutterwarp_control',
  'fire_control_1',
  'fire_control_2',
  'fire_control_3',
  'auto_repair_1',
  'auto_repair_2',
  'archive',
]

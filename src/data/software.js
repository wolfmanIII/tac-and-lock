// Trav2022 CRB p.168 — Ship software packages.
// Computer bandwidth limits how many software packages run simultaneously.

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   TL: number,
 *   bandwidth: number,
 *   effect: string,
 *   combatEffect?: { type: string, value: number },
 * }} SoftwareDef
 */

/** @type {Record<string, SoftwareDef>} */
export const SOFTWARE = {
  manoeuvre: {
    id: 'manoeuvre',
    name: 'Manoeuvre/0',
    TL: 8,
    bandwidth: 0,
    effect: 'Basic flight control. Required for powered movement.',
    combatEffect: null,
  },

  library: {
    id: 'library',
    name: 'Library',
    TL: 8,
    bandwidth: 0,
    effect: 'Access to general information database.',
    combatEffect: null,
  },

  intellect: {
    id: 'intellect',
    name: 'Intellect',
    TL: 11,
    bandwidth: 1,
    effect: 'General AI that can operate ship systems at skill 0.',
    combatEffect: null,
  },

  evade_1: {
    id: 'evade_1',
    name: 'Evade/1',
    TL: 9,
    bandwidth: 1,
    effect: 'DM+1 to dodge incoming fire when evasive action declared.',
    combatEffect: { type: 'evade_dm', value: 1 },
  },

  evade_2: {
    id: 'evade_2',
    name: 'Evade/2',
    TL: 11,
    bandwidth: 2,
    effect: 'DM+2 to dodge incoming fire when evasive action declared.',
    combatEffect: { type: 'evade_dm', value: 2 },
  },

  evade_3: {
    id: 'evade_3',
    name: 'Evade/3',
    TL: 13,
    bandwidth: 4,
    effect: 'DM+3 to dodge incoming fire when evasive action declared.',
    combatEffect: { type: 'evade_dm', value: 3 },
  },

  fire_control_1: {
    id: 'fire_control_1',
    name: 'Fire Control/1',
    TL: 9,
    bandwidth: 2,
    effect: 'DM+1 to all attack rolls.',
    combatEffect: { type: 'fire_control_dm', value: 1 },
  },

  fire_control_2: {
    id: 'fire_control_2',
    name: 'Fire Control/2',
    TL: 11,
    bandwidth: 4,
    effect: 'DM+2 to all attack rolls.',
    combatEffect: { type: 'fire_control_dm', value: 2 },
  },

  fire_control_3: {
    id: 'fire_control_3',
    name: 'Fire Control/3',
    TL: 12,
    bandwidth: 6,
    effect: 'DM+3 to all attack rolls.',
    combatEffect: { type: 'fire_control_dm', value: 3 },
  },

  fire_control_4: {
    id: 'fire_control_4',
    name: 'Fire Control/4',
    TL: 13,
    bandwidth: 8,
    effect: 'DM+4 to all attack rolls.',
    combatEffect: { type: 'fire_control_dm', value: 4 },
  },

  fire_control_5: {
    id: 'fire_control_5',
    name: 'Fire Control/5',
    TL: 15,
    bandwidth: 10,
    effect: 'DM+5 to all attack rolls.',
    combatEffect: { type: 'fire_control_dm', value: 5 },
  },

  auto_repair_1: {
    id: 'auto_repair_1',
    name: 'Auto-Repair/1',
    TL: 10,
    bandwidth: 5,
    effect: 'DM+1 to repair checks. Automated damage control.',
    combatEffect: { type: 'repair_dm', value: 1 },
  },

  auto_repair_2: {
    id: 'auto_repair_2',
    name: 'Auto-Repair/2',
    TL: 12,
    bandwidth: 10,
    effect: 'DM+2 to repair checks. Advanced automated damage control.',
    combatEffect: { type: 'repair_dm', value: 2 },
  },
}

export const SOFTWARE_IDS = [
  'manoeuvre',
  'library',
  'intellect',
  'evade_1', 'evade_2', 'evade_3',
  'fire_control_1', 'fire_control_2', 'fire_control_3', 'fire_control_4', 'fire_control_5',
  'auto_repair_1', 'auto_repair_2',
]

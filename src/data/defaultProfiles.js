// Default 2300AD ship profiles for quick-start sessions.
// All stats are illustrative; GMs should adjust to match campaign ship sheets.

/**
 * Fresh critical-hit track state (all systems undamaged).
 * @returns {Record<string, number>}
 */
export function blankCriticalTracks() {
  return {
    sensors:          0,
    bridge:           0,
    hull:             0,
    weapon:           0,
    armour:           0,
    crew:             0,
    stutterwarpDrive: 0,
    powerPlant:       0,
    stutterwarpFtl:   0,
    fuel:             0,
    computer:         0,
  }
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   class: string,
 *   tonnage: number,
 *   faction: string,
 *   hullPoints: number,
 *   currentHull: number,
 *   armour: number,
 *   tacSpeed: number,
 *   sensors: { type: string, dm: number },
 *   computer: { model: string, bandwidth: number },
 *   weapons: { weaponId: string, count: number, label: string }[],
 *   software: string[],
 *   criticalTracks: Record<string, number>,
 *   crew: any[],
 *   crewAssignments: Record<string, string | null>,
 *   notes: string,
 * }} ShipProfile
 */

/** @type {ShipProfile[]} */
export const DEFAULT_PROFILES = [
  {
    id: 'default-isv2',
    name: 'BSS Cavendish',
    class: 'Trilon ISV-2',
    tonnage: 800,
    faction: 'players',
    hullPoints: 16,
    currentHull: 16,
    armour: 2,
    tacSpeed: 3,
    sensors: { type: 'Military Mk 3', dm: 2 },
    computer: { model: 'Model/2', bandwidth: 10 },
    weapons: [
      { weaponId: 'pulse_laser', count: 2, label: 'Fwd Twin Pulse Laser' },
      { weaponId: 'sandcaster',  count: 1, label: 'Aft Sandcaster' },
    ],
    software: ['manoeuvre', 'fire_control_2', 'evade_1', 'auto_repair_1'],
    criticalTracks: blankCriticalTracks(),
    crew: [],
    crewAssignments: {
      pilot:           null,
      captain:         null,
      engineer:        null,
      sensor_operator: null,
      gunner_turret:   null,
      gunner_bay:      null,
      marine:          null,
    },
    notes: 'Independent Survey Vessel. Lightly armed, good sensors. Common in frontier regions.',
  },

  {
    id: 'default-manchette',
    name: 'GAS-44 "Flèche"',
    class: 'Manchette Escort Fighter',
    tonnage: 100,
    faction: 'players',
    hullPoints: 2,
    currentHull: 2,
    armour: 4,
    tacSpeed: 6,
    sensors: { type: 'Military Mk 4', dm: 3 },
    computer: { model: 'Model/3', bandwidth: 15 },
    weapons: [
      { weaponId: 'pulse_laser', count: 2, label: 'Twin Pulse Laser' },
      { weaponId: 'missile_rack', count: 1, label: 'Missile Rack' },
    ],
    software: ['manoeuvre', 'fire_control_3', 'evade_2'],
    criticalTracks: blankCriticalTracks(),
    crew: [],
    crewAssignments: {
      pilot:           null,
      captain:         null,
      engineer:        null,
      sensor_operator: null,
      gunner_turret:   null,
      gunner_bay:      null,
      marine:          null,
    },
    notes: 'Fast military escort fighter. Fragile but highly manoeuvrable. Excels at missile interdiction.',
  },

  {
    id: 'default-thorez',
    name: 'Thorez IV',
    class: 'Thorez Courier',
    tonnage: 200,
    faction: 'npc',
    hullPoints: 4,
    currentHull: 4,
    armour: 2,
    tacSpeed: 4,
    sensors: { type: 'Civilian', dm: 0 },
    computer: { model: 'Model/2', bandwidth: 10 },
    weapons: [
      { weaponId: 'beam_laser', count: 1, label: 'Turret Beam Laser' },
    ],
    software: ['manoeuvre', 'fire_control_1', 'evade_1'],
    criticalTracks: blankCriticalTracks(),
    crew: [],
    crewAssignments: {
      pilot:           null,
      captain:         null,
      engineer:        null,
      sensor_operator: null,
      gunner_turret:   null,
      gunner_bay:      null,
      marine:          null,
    },
    notes: 'Standard armed courier. Fast and versatile. Often encountered as a NPC contact or antagonist.',
  },

  {
    id: 'default-corvette',
    name: 'MNS Vigilance',
    class: 'Patrol Corvette',
    tonnage: 400,
    faction: 'npc',
    hullPoints: 8,
    currentHull: 8,
    armour: 6,
    tacSpeed: 4,
    sensors: { type: 'Military Mk 4', dm: 3 },
    computer: { model: 'Model/3', bandwidth: 15 },
    weapons: [
      { weaponId: 'beam_laser',        count: 2, label: 'Port/Stbd Beam Laser' },
      { weaponId: 'missile_rack',       count: 1, label: 'Missile Rack' },
      { weaponId: 'particle_barbette',  count: 1, label: 'Fwd Particle Barbette' },
    ],
    software: ['manoeuvre', 'fire_control_3', 'evade_1', 'auto_repair_1'],
    criticalTracks: blankCriticalTracks(),
    crew: [],
    crewAssignments: {
      pilot:           null,
      captain:         null,
      engineer:        null,
      sensor_operator: null,
      gunner_turret:   null,
      gunner_bay:      null,
      marine:          null,
    },
    notes: 'Colonial Navy patrol vessel. Well-armed and armoured. Represents a serious threat to civilian ships.',
  },
]

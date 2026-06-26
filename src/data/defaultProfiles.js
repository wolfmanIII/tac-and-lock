// 2300AD ship profiles extracted from 2300AD Book 3: Vehicles and Spacecraft.
// Hull Points, Armour, Tac Speed, Sensors taken verbatim from stat blocks.
// Signature: base value from B3 stat block // 2300AD B3 p.57. GM should verify against actual stat block.
// Sensor combat DM: approximated from sensor type names — explicit DM values
// are in 2300AD B3 p.46 (Sensor Operations), not reproduced here.
// Weapon range DMs for 2300AD-specific weapons are approximated (see weapons.js).

import { blankSurfaceFixtureTracks } from './criticalHits.js'
export { blankSurfaceFixtureTracks }

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

/** Default crewAssignments record (all unassigned). */
function blankCrew() {
  return {
    pilot:           null,
    captain:         null,
    engineer:        null,
    sensor_operator: null,
    gunner_turret:   null,
    gunner_bay:      null,
    marine:          null,
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
 *   signature: number,              — base Signature for enemy Electronics(sensors) checks // 2300AD B3 p.57
 *   sensors: { type: string, dm: number },
 *   computer: { model: string, bandwidth: number },
 *   weapons: { weaponId: string, count: number, label: string }[],
 *   software: string[],
 *   criticalTracks: Record<string, number>,
 *   surfaceFixtureTracks: Record<string, number>,
 *   crew: any[],
 *   crewAssignments: Record<string, string | null>,
 *   notes: string,
 * }} ShipProfile
 */

/** @type {ShipProfile[]} */
export const DEFAULT_PROFILES = [
  // ── Civilian / Independent ─────────────────────────────────────────────────

  {
    // 2300AD B3 p.86 — TL10, 100t
    id: 'default-isv2',
    name: 'BSS Cavendish',
    class: 'Trilon ISV-2 Independent Scout',
    tonnage: 100,
    faction: 'players',
    hullPoints: 10,
    currentHull: 10,
    armour: 0,
    tacSpeed: 1,       // Stutterwarp: 1.41 ly/day, Tac Speed: 1
    signature: 2,      // small civilian, retractable radiators // 2300AD B3 p.57
    sensors: { type: 'Basic Military, Basic Survey, DSS, GADS, Telescope', dm: 3 },
    computer: { model: 'Computer/10', bandwidth: 10 },
    weapons: [],       // 1 hardpoint available, unarmed by default
    software: ['operations', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Survey scout. Stutterwarp 1.41 ly/day. Extensive sensor suite. 1 unarmed hardpoint. Often modified. // 2300AD B3 p.86',
  },

  {
    // 2300AD B3 p.88 — TL10, 200t
    id: 'default-thorez',
    name: 'Thorez IV',
    class: 'Thorez-class Courier',
    tonnage: 200,
    faction: 'neutral',
    hullPoints: 20,
    currentHull: 20,
    armour: 0,
    tacSpeed: 1,       // Stutterwarp: 1.29 ly/day, Tac Speed: 1
    signature: 2,      // small civilian courier // 2300AD B3 p.57
    sensors: { type: 'Basic Nav Array, DSS', dm: 1 },
    computer: { model: 'Computer/10', bandwidth: 10 },
    weapons: [],       // unarmed
    software: ['operations', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Multi-role courier and light freighter. Interface-capable. Unarmed. Common across French Arm. // 2300AD B3 p.88',
  },

  {
    // 2300AD B3 p.91 — TL12, 200t
    id: 'default-martinique',
    name: 'Soleil de Nuit',
    class: 'Martinique-class Yacht',
    tonnage: 200,
    faction: 'neutral',
    hullPoints: 22,
    currentHull: 22,
    armour: 0,
    tacSpeed: 1,       // Stutterwarp: 1.32 ly/day, Tac Speed: 1
    signature: 3,      // yacht with solar panels (extended = +2 signature) // 2300AD B3 p.57
    sensors: { type: 'Basic Nav Array, DSS, GADS, Telescope', dm: 2 },
    computer: { model: 'Computer/20', bandwidth: 20 },
    weapons: [],       // unarmed luxury yacht
    software: ['operations', 'auto_repair_1', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Luxury private starship. Spin gravity. Carries Turmfalke lander. Fuel-cell powered, can refuel via solar array. // 2300AD B3 p.91',
  },

  {
    // 2300AD B3 p.94 — TL10, 1000t
    id: 'default-anjou',
    name: 'L\'Anjou Libre',
    class: 'Anjou Cargo Ship',
    tonnage: 1000,
    faction: 'neutral',
    hullPoints: 100,
    currentHull: 100,
    armour: 0,
    tacSpeed: 1,       // Stutterwarp: 1.1 ly/day, Tac Speed: 1
    signature: 4,      // large civilian freighter, large radiator surface // 2300AD B3 p.57
    sensors: { type: 'Basic Nav Array, DSS', dm: 1 },
    computer: { model: 'Computer/15', bandwidth: 15 },
    weapons: [],       // 4 hardpoints available, unarmed by default
    software: ['operations', 'auto_repair_1', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Large bulk freighter. 4 unarmed hardpoints. Rotating habitat ring for crew comfort. 503t cargo. // 2300AD B3 p.94',
  },

  // ── Military (NPC) ─────────────────────────────────────────────────────────

  {
    // 2300AD B3 p.78 — TL12, 60t
    id: 'default-martel',
    name: 'Martel GAS-77',
    class: 'Martel 60-ton Fighter',
    tonnage: 60,
    faction: 'npc',
    hullPoints: 7,
    currentHull: 7,
    armour: 8,
    tacSpeed: 3,       // Stutterwarp: 3.29 ly/day, Tac Speed: 3
    signature: 4,      // military fighter, discharge vanes available // 2300AD B3 p.57
    sensors: { type: 'Advanced Military, Basic Military', dm: 4 },
    computer: { model: 'Computer/30fib', bandwidth: 30 },
    weapons: [
      { weaponId: 'ea1000',      count: 2, label: 'Twin EA1000 w/UTES (Fixed)' },
      { weaponId: 'missile_rack', count: 2, label: 'Combat Drones Ritage-2 x2' },
    ],
    software: ['operations', 'fire_control_2', 'auto_repair_1', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Ship-killer fighter. Two-pilot crew. Heavily armoured. Discharge Vanes for stealth. France/UK/Texas/Freihafen service. // 2300AD B3 p.78',
  },

  {
    // 2300AD B3 p.80 — TL12, 70t
    id: 'default-uoc70',
    name: 'HMS Vigilance',
    class: 'UOC70 Long Boat',
    tonnage: 70,
    faction: 'npc',
    hullPoints: 8,
    currentHull: 8,
    armour: 4,
    tacSpeed: 2,       // Stutterwarp: 1.98 ly/day, Tac Speed: 2
    signature: 3,      // small patrol craft // 2300AD B3 p.57
    sensors: { type: 'Basic Military, DSS, GADS', dm: 3 },
    computer: { model: 'Computer/15fib', bandwidth: 15 },
    weapons: [
      { weaponId: 'll98',             count: 1, label: 'LL98 Laser w/UTES (Surface)' },
      { weaponId: 'particle_barbette', count: 1, label: 'Light Plasma Gun PGHP (Fixed)' },
    ],
    software: ['operations', 'fire_control_2', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Customs/patrol craft. Orbital Quarantine Command. Breaching tube + grapple arm for boarding ops. // 2300AD B3 p.80',
  },

  {
    // 2300AD B3 p.104 — TL11, 300t
    id: 'default-aconit',
    name: 'FNS Aconit',
    class: 'Aconit-class Frigate',
    tonnage: 300,
    faction: 'npc',
    hullPoints: 30,
    currentHull: 30,
    armour: 4,
    tacSpeed: 3,       // Stutterwarp: 2.65 ly/day, Tac Speed: 3
    signature: 5,      // medium military frigate // 2300AD B3 p.57
    sensors: { type: 'Basic Military, DSS, GADS, Basic Survey', dm: 3 },
    computer: { model: 'Computer/20', bandwidth: 20 },
    weapons: [
      { weaponId: 'll98',             count: 2, label: 'Twin LL98 w/UTES (Surface)' },
      { weaponId: 'autocannon_25mm',  count: 2, label: '25mm Rotary AC x2 (Retractable)' },
      { weaponId: 'aero12',           count: 10, label: 'Aero-12 Missile x10 (Internal)' },
      { weaponId: 'anti_missile_laser', count: 1, label: 'Anti-Missile Laser (Retractable)' },
      { weaponId: 'sandcaster',       count: 1, label: 'Decoy Dispenser (Retractable)' },
    ],
    software: ['operations', 'fire_control_2', 'auto_repair_1', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Most common colonial warship. Interface-capable VTOL. 2 Combat Drones (Ritage-1). Azania/France/Canada/Texas/Ukraine service. // 2300AD B3 p.104',
  },

  // ── Alien (Kaefer) ─────────────────────────────────────────────────────────

  {
    // 2300AD B3 p.107-108 — TL13, 125t
    id: 'default-kaefer-geist',
    name: 'Geist-class Scout',
    class: "Kaefer 'Geist' Spy Craft",
    tonnage: 125,
    faction: 'npc',
    hullPoints: 12,
    currentHull: 12,
    armour: 4,
    tacSpeed: 2,       // Stutterwarp: 1.67 ly/day, Tac Speed: 2
    signature: 3,      // base value — Stealth reduces by 4 (to -1 effective) // 2300AD B3 p.57
    sensors: { type: "Kaefer 'Steel Yard' (Basic Military + Basic Survey, DSS)", dm: 3 },
    computer: { model: 'Computer/15', bandwidth: 15 },
    weapons: [
      { weaponId: 'grumbler',    count: 1, label: "Grumbler Laser w/KUTS (Surface)" },
      { weaponId: 'kingfisher',  count: 10, label: 'Kingfisher Missile x10 (Retractable)' },
      { weaponId: 'tri_beamer',  count: 1, label: 'Tri-Beamer (Retractable)' },
    ],
    software: ['operations', 'fire_control_1', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    surfaceFixtureTracks: blankSurfaceFixtureTracks(),
    crew: [],
    crewAssignments: blankCrew(),
    notes: 'Kaefer spy/scout craft. Stealth + Heat Sinks. 2 Whiskey Combat Drones. Detonates when capture is imminent. // 2300AD B3 p.107',
  },
]

// 2300AD B3 — Official ship catalog.
// Source: 2300AD Book 3: Vehicles and Spacecraft, pp.63–110.
//
// Catalog entries are ShipProfile-compatible objects WITHOUT id/createdAt.
// UUIDs are assigned by profilesStore.addProfile() when the GM adds a ship.
//
// Combat-relevant ships (TAC Speed > 0) are marked category: 'combat'.
// Non-combat craft (rockets, landers, atmospheric) are category: 'small-craft'.

import { blankCriticalTracks } from './defaultProfiles.js'

/**
 * @typedef {{
 *   name: string,
 *   class: string,
 *   tonnage: number,
 *   faction: string,
 *   hullPoints: number,
 *   armour: number,
 *   tacSpeed: number,
 *   signature: number,
 *   sensors: { type: string, dm: number },
 *   computer: { model: string, bandwidth: number },
 *   weapons: { weaponId: string, count: number, label: string }[],
 *   software: string[],
 *   criticalTracks: Record<string, number>,
 *   crew: any[],
 *   crewAssignments: Record<string, string|null>,
 *   notes: string,
 *   source: string,
 *   sourcePage: number,
 *   category: 'small-craft' | 'scout' | 'civilian' | 'military' | 'alien',
 * }} CatalogEntry
 */

function blankCrew() {
  return {
    pilot: null, captain: null, engineer: null,
    sensor_operator: null, gunner_turret: null,
    gunner_bay: null, marine: null,
  }
}

/**
 * @param {Partial<CatalogEntry>} fields
 * @returns {CatalogEntry}
 */
function entry(fields) {
  return {
    class:          fields.name ?? '',
    faction:        'neutral',
    armour:         0,
    tacSpeed:       1,
    signature:      2,
    sensors:        { type: 'Basic Nav Array', dm: 0 },
    computer:       { model: 'Computer/5', bandwidth: 5 },
    weapons:        [],
    software:       ['operations', 'stutterwarp_control'],
    criticalTracks: blankCriticalTracks(),
    crew:           [],
    crewAssignments: blankCrew(),
    notes:          '',
    source:         '2300AD B3',
    sourcePage:     0,
    category:       'civilian',
    ...fields,
  }
}

/** @type {CatalogEntry[]} */
export const SHIP_CATALOG = [

  // ── Small Craft (no stutterwarp / non-combat) ─────────────────────────

  entry({
    name:       'Sauvetage-5 Lifeboat',
    class:      'Sauvetage-5 Lifeboat',
    tonnage:    5,
    hullPoints: 0,
    tacSpeed:   0,
    signature:  1,
    sensors:    { type: 'Minimal', dm: -2 },
    computer:   { model: 'Computer/5', bandwidth: 5 },
    software:   ['operations'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 64,
    notes:      "L'Étage Aerospace. OMS rocket, disposable. Autopilot Skill 1 + 9 passengers. // 2300AD B3 p.64",
  }),

  entry({
    name:       'Nécessité 10-ton Drop Pod',
    class:      'Sabourin Nécessité',
    tonnage:    10,
    hullPoints: 1,
    tacSpeed:   0,
    signature:  1,
    sensors:    { type: 'Minimal', dm: -2 },
    computer:   { model: 'Computer/5', bandwidth: 5 },
    software:   ['operations'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 65,
    notes:      'Sabourin Cargo Systems. OMS rocket, disposable, unmanned. // 2300AD B3 p.65',
  }),

  entry({
    name:       'MASIC Star Carrier 50-ton Cargo Rocket',
    class:      'MASIC Star Carrier',
    tonnage:    50,
    hullPoints: 3,
    tacSpeed:   0,
    signature:  1,
    sensors:    { type: 'Minimal', dm: -2 },
    computer:   { model: 'Computer/5', bandwidth: 5 },
    software:   ['operations'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 66,
    notes:      'Manchurian Aerospace. Disposable cargo rocket. Autopilot Skill 1. Ground crew 7. // 2300AD B3 p.66',
  }),

  entry({
    name:       'DC30 Commercial Lander',
    class:      'DC30 Commercial Lander',
    tonnage:    30,
    hullPoints: 3,
    tacSpeed:   0,
    signature:  1,
    sensors:    { type: 'Minimal', dm: -2 },
    computer:   { model: 'Computer/5', bandwidth: 5 },
    software:   ['operations'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 68,
    notes:      "L'Étage Aerospace. Rocket lander. Pilot + Co-Pilot + 6 passengers. // 2300AD B3 p.68",
  }),

  entry({
    name:       'CA-120 Yup\'ik Combat Lander',
    class:      'CA-120 Yup\'ik',
    tonnage:    30,
    hullPoints: 3,
    armour:     5,
    tacSpeed:   0,
    signature:  0,
    sensors:    { type: 'Basic Military', dm: 0 },
    computer:   { model: 'Computer/10fib', bandwidth: 10 },
    weapons: [
      { weaponId: 'autocannon_25mm',  count: 1, label: '25mm Rotary AC (Retractable nose turret)' },
      { weaponId: 'aero12',           count: 10, label: 'Aero-12 Missile ×10 (Internal bay)' },
      { weaponId: 'anti_missile_laser', count: 1, label: 'Anti-Missile Laser (Retractable)' },
      { weaponId: 'sandcaster',       count: 1, label: 'Decoy Dispenser (Retractable)' },
    ],
    software:   ['operations', 'intellect'],
    faction:    'npc',
    category:   'small-craft',
    sourcePage: 70,
    notes:      'Trilon Aerospace / USA. Armoured combat lander. TL12. Improved Fire Control +2. Pilot + Weapons Officer + 10 passengers. // 2300AD B3 p.70',
  }),

  entry({
    name:       'Turmfalke Commercial Spaceplane',
    class:      'Turmfalke Spaceplane',
    tonnage:    20,
    hullPoints: 2,
    tacSpeed:   0,
    signature:  1,
    sensors:    { type: 'Basic Nav Array', dm: 0 },
    computer:   { model: 'Computer/5', bandwidth: 5 },
    software:   ['operations', 'intellect'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 72,
    notes:      'BRW AG / Germany. TL12. Rocket/air-breathing. Pilot + Co-Pilot + 6 passengers. Used as sub-craft on Martinique Yacht. // 2300AD B3 p.72',
  }),

  // ── Small Craft with Stutterwarp (combat-capable) ─────────────────────

  entry({
    name:       'British ExoSpace R40 Pinnace',
    class:      'R40 Commercial Pinnace',
    tonnage:    40,
    hullPoints: 4,
    tacSpeed:   2,
    signature:  2,
    sensors:    { type: 'Basic Nav Array', dm: 0 },
    computer:   { model: 'Computer/10', bandwidth: 10 },
    software:   ['operations', 'intellect', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 74,
    notes:      'British ExoSpace. TL11. Stutterwarp 1.7 ly/day. Unarmed. Pilot + Co-Pilot + 16 passengers. // 2300AD B3 p.74',
  }),

  entry({
    name:       'SLV-55 Scout Lander',
    class:      'SLV-55 Cutter',
    tonnage:    55,
    hullPoints: 5,
    tacSpeed:   0,
    signature:  2,
    sensors:    { type: 'Basic Military, Basic Survey', dm: 2 },
    computer:   { model: 'Computer/10', bandwidth: 10 },
    software:   ['operations', 'intellect'],
    faction:    'neutral',
    category:   'small-craft',
    sourcePage: 76,
    notes:      'Trilon Aerospace / USA. TL12. Atmospheric. Unarmed. 25-ton interchangeable mission module. Pilot + Co-Pilot + 8 passengers. Used as sub-craft on SSV-21. // 2300AD B3 p.76',
  }),

  // ── Military (fighters / warships) ────────────────────────────────────

  entry({
    name:       'Martel 60-ton Fighter',
    class:      'Martel Fighter (Harrier/Longhorn/Jaeger)',
    tonnage:    60,
    hullPoints: 7,
    armour:     8,
    tacSpeed:   3,
    signature:  2,
    sensors:    { type: 'Advanced Military, Basic Military', dm: 4 },
    computer:   { model: 'Computer/30fib', bandwidth: 30 },
    weapons: [
      { weaponId: 'ea1000', count: 2, label: 'Twin EA1000 w/UTES (Fixed retractable)' },
    ],
    software:   ['operations', 'intellect', 'fire_control_1', 'auto_repair_1', 'stutterwarp_control'],
    faction:    'npc',
    category:   'military',
    sourcePage: 78,
    notes:      'Giscard Aerospace / France. TL12. Stutterwarp 3.29 ly/day. Discharge Vanes. Two pilots. Also carries Ritage-2 drones ×2, Grape-Shot ×2. France/UK/Texas/Freihafen. // 2300AD B3 p.78',
  }),

  entry({
    name:       'UOC70 Long Boat',
    class:      'UOC70 Long Boat',
    tonnage:    70,
    hullPoints: 8,
    armour:     4,
    tacSpeed:   2,
    signature:  2,
    sensors:    { type: 'Basic Military, DSS, GADS', dm: 3 },
    computer:   { model: 'Computer/15fib', bandwidth: 15 },
    weapons: [
      { weaponId: 'll98',             count: 1, label: 'LL98 w/UTES (Surface retractable)' },
      { weaponId: 'particle_barbette', count: 1, label: 'Light Plasma Gun PGHP (Fixed)' },
    ],
    software:   ['operations', 'intellect', 'stutterwarp_control'],
    faction:    'npc',
    category:   'military',
    sourcePage: 80,
    notes:      'British ExoSpace / UK. TL12. Stutterwarp 1.98 ly/day. Breaching tube + grapple. 2 Pilots + 6 Ship\'s Troops + 2 Customs Officers. // 2300AD B3 p.80',
  }),

  // ── Civilian starships ─────────────────────────────────────────────────

  entry({
    name:       'ISV-2 Independent Scout',
    class:      'Trilon ISV-2',
    tonnage:    100,
    hullPoints: 10,
    tacSpeed:   1,
    signature:  2,
    sensors:    { type: 'Basic Military, Basic Survey, DSS, GADS, Telescope', dm: 3 },
    computer:   { model: 'Computer/10', bandwidth: 10 },
    software:   ['operations', 'intellect', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'scout',
    sourcePage: 86,
    notes:      'Trilon Aerospace / USA. TL10. Stutterwarp 1.41 ly/day. 1 unarmed hardpoint. Crew 10. // 2300AD B3 p.86',
  }),

  entry({
    name:       'Thorez-Class Courier',
    class:      'Thorez Courier',
    tonnage:    200,
    hullPoints: 20,
    tacSpeed:   1,
    signature:  2,
    sensors:    { type: 'Basic Nav Array, DSS', dm: 1 },
    computer:   { model: 'Computer/10', bandwidth: 10 },
    software:   ['operations', 'intellect', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'civilian',
    sourcePage: 88,
    notes:      'Darlan Aerospatiale / France. TL10. Stutterwarp 1.29 ly/day. Unarmed. Interface-capable. Crew 20 + 6 passengers. // 2300AD B3 p.88',
  }),

  entry({
    name:       'Martinique-Class Yacht',
    class:      'Martinique Yacht',
    tonnage:    200,
    hullPoints: 22,
    tacSpeed:   1,
    signature:  3,
    sensors:    { type: 'Basic Nav Array, DSS, GADS, Telescope', dm: 2 },
    computer:   { model: 'Computer/20', bandwidth: 20 },
    software:   ['operations', 'intellect', 'auto_repair_1', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'civilian',
    sourcePage: 91,
    notes:      "L'Étage Aerospace / France. TL12. Stutterwarp 1.32 ly/day. Spin gravity. Turmfalke sub-craft. Solar panels. Unarmed. // 2300AD B3 p.91",
  }),

  entry({
    name:       'Anjou Cargo Ship',
    class:      'Anjou',
    tonnage:    1000,
    hullPoints: 100,
    tacSpeed:   1,
    signature:  5,
    sensors:    { type: 'Basic Nav Array, DSS', dm: 1 },
    computer:   { model: 'Computer/15', bandwidth: 15 },
    software:   ['operations', 'intellect', 'auto_repair_1', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'civilian',
    sourcePage: 94,
    notes:      "L'Étage Heavy Space Systems / France. TL10. Stutterwarp 1.1 ly/day. 4 unarmed hardpoints. 503t cargo. Rotating hab ring. // 2300AD B3 p.94",
  }),

  entry({
    name:       'SSV-21 Special Services Vessel',
    class:      'Trilon C-System SSV-21',
    tonnage:    500,
    hullPoints: 55,
    tacSpeed:   1,
    signature:  3,
    sensors:    { type: 'Advanced Military, Advanced Survey, Standard Survey, DSS, GADS, Telescope', dm: 5 },
    computer:   { model: 'Computer/20', bandwidth: 20 },
    software:   ['operations', 'intellect', 'auto_repair_1', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'scout',
    sourcePage: 97,
    notes:      'Trilon / USA. TL12. Stutterwarp 1.38 ly/day. 2 unarmed hardpoints. 2× SLV-55 sub-craft. Science vessel. // 2300AD B3 p.97',
  }),

  entry({
    name:       'Liberty Colonial Transport',
    class:      "ALRP 'Liberty' Transport",
    tonnage:    600,
    hullPoints: 60,
    tacSpeed:   3,
    signature:  4,
    sensors:    { type: 'Basic Nav Array, DSS, GADS, Basic Survey', dm: 2 },
    computer:   { model: 'Computer/20', bandwidth: 20 },
    software:   ['operations', 'intellect', 'auto_repair_1', 'stutterwarp_control'],
    faction:    'neutral',
    category:   'civilian',
    sourcePage: 100,
    notes:      'ALRP / USA. TL11. Stutterwarp 2.5 ly/day. Nuclear OMS. 1 unarmed hardpoint. 200 passengers (Comfort −1). // 2300AD B3 p.100',
  }),

  // ── Military warships ─────────────────────────────────────────────────

  entry({
    name:       'Aconit-Class Frigate',
    class:      'Aconit Frigate',
    tonnage:    300,
    hullPoints: 30,
    armour:     4,
    tacSpeed:   3,
    signature:  3,
    sensors:    { type: 'Basic Military, DSS, GADS, Basic Survey', dm: 3 },
    computer:   { model: 'Computer/20', bandwidth: 20 },
    weapons: [
      { weaponId: 'll98',              count: 2, label: 'Twin LL98 w/UTES (Surface retractable)' },
      { weaponId: 'autocannon_25mm',   count: 2, label: '25mm Rotary AC ×2 (Retractable)' },
      { weaponId: 'aero12',            count: 10, label: 'Aero-12 Missile ×10 (Internal bay)' },
      { weaponId: 'anti_missile_laser', count: 1, label: 'Quinn PDC (Retractable)' },
      { weaponId: 'sandcaster',        count: 1, label: 'Decoy Dispenser (Retractable)' },
    ],
    software:   ['operations', 'intellect', 'fire_control_2', 'auto_repair_1', 'stutterwarp_control'],
    faction:    'npc',
    category:   'military',
    sourcePage: 104,
    notes:      'Darlan Aerospatiale / France. TL11. Stutterwarp 2.65 ly/day. Ritage-1 drones ×2. Interface-capable. 31 crew. France/Azania/Canada/Texas/Ukraine. // 2300AD B3 p.104',
  }),

  // ── Alien (Kaefer) ────────────────────────────────────────────────────

  entry({
    name:       "Kaefer 'Geist' Spy Craft",
    class:      "Kaefer 'Geist'",
    tonnage:    125,
    hullPoints: 12,
    armour:     4,
    tacSpeed:   2,
    signature:  2,
    sensors:    { type: "Kaefer 'Steel Yard' (Basic Military + Basic Survey), DSS", dm: 3 },
    computer:   { model: 'Computer/15', bandwidth: 15 },
    weapons: [
      { weaponId: 'grumbler',   count: 1, label: "Grumbler w/KUTS (Surface retractable)" },
      { weaponId: 'kingfisher', count: 10, label: 'Kingfisher Missile ×10 (Retractable)' },
      { weaponId: 'tri_beamer', count: 1, label: 'Tri-Beamer (Retractable)' },
    ],
    software:   ['operations', 'fire_control_1', 'stutterwarp_control'],
    faction:    'npc',
    category:   'alien',
    sourcePage: 107,
    notes:      "Kaefer. TL13 (est.). Stutterwarp 1.67 ly/day. Stealth hull + Heat Sinks. Whiskey drones ×2. Detonates if capture imminent. // 2300AD B3 p.107",
  }),
]

export const CATALOG_CATEGORIES = [
  { id: 'all',         label: 'All' },
  { id: 'military',    label: 'Military' },
  { id: 'scout',       label: 'Scout' },
  { id: 'civilian',    label: 'Civilian' },
  { id: 'small-craft', label: 'Small Craft' },
  { id: 'alien',       label: 'Alien' },
]

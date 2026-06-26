// 2300AD B3 p.58 — Surface Fixture Damage (external, any hit Effect ≥ 3).
// Internal Critical Hits: Trav2022 CRB p.158–159 with 2300AD substitutions.
// B3 substitutions: M-Drive → Reaction Drive; J-Drive → Stutterwarp Drive.

// ── SURFACE FIXTURE DAMAGE — B3 p.58 ────────────────────────────────────────

/**
 * Roll 2D on this table when attack Effect ≥ 3 (any hit, even non-penetrating).
 * Returns the surface system key.
 * @type {Record<number, string>}
 */
export const SURFACE_FIXTURE_TABLE = {
  2:  'fireControl',
  3:  'surfaceWeapon',
  4:  'surfaceWeapon',
  5:  'surfaceSensors',
  6:  'radiator',
  7:  'radiator',
  8:  'radiator',
  9:  'surfaceSensors',
  10: 'dischargeVanes',
  11: 'dischargeVanes',
  12: 'otherSystem',
}

/** Surface systems tracked by hit count (0 = undamaged, 1 = 1st hit, 2 = 2nd hit, 3 = 3rd/destroyed). */
export const SURFACE_FIXTURE_SYSTEMS = [
  'fireControl',
  'surfaceWeapon',
  'surfaceSensors',
  'radiator',
  'dischargeVanes',
  'otherSystem',
]

/**
 * Effects per surface fixture system per hit number (1, 2, 3).
 * `mechanics` drives automated state changes in battleStore.
 * @type {Record<string, Record<number, { label: string, mechanics: { type: string, value?: any }[] }>>}
 */
export const SURFACE_FIXTURE_EFFECTS = {
  fireControl: {
    1: { label: 'Fire Control — DM−2 to all attack rolls.', mechanics: [{ type: 'attack_dm', value: -2 }] },
    2: { label: 'Fire Control — no additional effect.', mechanics: [] },
    3: { label: 'Fire Control destroyed.', mechanics: [{ type: 'fire_control_destroyed' }] },
  },
  surfaceWeapon: {
    1: { label: 'Weapon — −1D Damage, DM−2 to attack rolls.', mechanics: [{ type: 'weapon_damage_dm', value: -1 }, { type: 'attack_dm', value: -2 }] },
    2: { label: 'Weapon disabled.', mechanics: [{ type: 'weapon_offline', value: 1 }] },
    3: { label: 'Weapon destroyed.', mechanics: [{ type: 'weapon_destroyed', value: 1 }] },
  },
  surfaceSensors: {
    1: { label: 'Sensors — DM−2 to all Electronics (sensors) checks.', mechanics: [{ type: 'sensors_dm', value: -2 }] },
    2: { label: 'Sensors — no additional effect.', mechanics: [] },
    3: { label: 'Sensors destroyed.', mechanics: [{ type: 'sensors_offline', value: true }] },
  },
  radiator: {
    // B3 p.58: 1st and 2nd hits have no effect. 3rd hit: Signature +2.
    // 4th hit: power halved or internal every round. 5th hit: power out or 1D/round + internal.
    1: { label: 'Radiator — 1st hit, no immediate effect.', mechanics: [] },
    2: { label: 'Radiator — 2nd hit, no immediate effect.', mechanics: [] },
    3: { label: 'Radiator damaged — Signature +2.', mechanics: [{ type: 'signature_modifier', value: 2 }] },
    4: { label: 'Radiator failing — power must be halved or suffer 1 Internal Crit per round.', mechanics: [{ type: 'radiator_failing' }] },
    5: { label: 'Radiator destroyed — power must be shut down or take 1D damage + 1 Internal Crit per round.', mechanics: [{ type: 'radiator_destroyed' }] },
  },
  dischargeVanes: {
    1: { label: 'Discharge Vanes disabled (if present; otherwise no effect).', mechanics: [{ type: 'discharge_vanes_offline' }] },
    2: { label: 'Discharge Vanes destroyed.', mechanics: [{ type: 'discharge_vanes_destroyed' }] },
    3: { label: 'Discharge Vanes — no further effect.', mechanics: [] },
  },
  otherSystem: {
    1: { label: 'Other external system disabled.', mechanics: [{ type: 'other_system_offline' }] },
    2: { label: 'Other external system destroyed.', mechanics: [{ type: 'other_system_destroyed' }] },
    3: { label: 'Other system — no further effect.', mechanics: [] },
  },
}

/** Fresh surface fixture track state (all systems undamaged). */
export function blankSurfaceFixtureTracks() {
  return {
    fireControl:    0,
    surfaceWeapon:  0,
    surfaceSensors: 0,
    radiator:       0,
    dischargeVanes: 0,
    otherSystem:    0,
  }
}

// ── INTERNAL CRITICAL HITS — CRB p.158–159 + 2300AD substitutions ───────────

/**
 * Roll 2D on this table for Internal Critical Hits (damage penetrates, Effect ≥ 6 or hull to 0).
 * B3 substitutions: J-Drive → Stutterwarp Drive; M-Drive → Reaction Drive (not tracked separately).
 * @type {Record<number, string>}
 */
export const INTERNAL_LOCATION_TABLE = {
  2:  'sensors',
  3:  'bridge',
  4:  'hull',
  5:  'weapon',
  6:  'armour',
  7:  'crew',
  8:  'stutterwarpDrive', // was M-Drive (Reaction Drive in 2300AD — TAC Speed -1 per hit)
  9:  'powerPlant',
  10: 'stutterwarpFtl',   // was J-Drive
  11: 'fuel',
  12: 'computer',
}

/** All 11 trackable internal critical hit systems. */
export const CRITICAL_HIT_SYSTEMS = [
  'sensors',
  'bridge',
  'hull',
  'weapon',
  'armour',
  'crew',
  'stutterwarpDrive',
  'powerPlant',
  'stutterwarpFtl',
  'fuel',
  'computer',
]

/**
 * Severity 1–6 effects per internal system (CRB p.158–159 + B3 substitutions).
 * @type {Record<string, Record<number, { label: string, mechanics: { type: string, value?: any }[] }>>}
 */
export const CRITICAL_HIT_EFFECTS = {
  sensors: {
    1: { label: 'Sensor interference — DM−2 to all sensor rolls.', mechanics: [{ type: 'sensors_dm', value: -2 }] },
    2: { label: 'Sensors damaged — DM−2, range halved.', mechanics: [{ type: 'sensors_dm', value: -2 }] },
    3: { label: 'Sensors severely damaged — DM−3, limited to Short range.', mechanics: [{ type: 'sensors_dm', value: -3 }] },
    4: { label: 'Sensors offline.', mechanics: [{ type: 'sensors_offline', value: true }] },
    5: { label: 'Sensors destroyed — offline, DM−2 to attacks.', mechanics: [{ type: 'sensors_offline', value: true }, { type: 'attack_dm', value: -2 }] },
    6: { label: 'Total sensor loss — destroyed, DM−4 to attacks.', mechanics: [{ type: 'sensors_offline', value: true }, { type: 'attack_dm', value: -4 }] },
  },

  bridge: {
    1: { label: 'Bridge hit — DM−1 to all bridge crew checks.', mechanics: [{ type: 'bridge_dm', value: -1 }] },
    2: { label: 'Bridge damaged — DM−2.', mechanics: [{ type: 'bridge_dm', value: -2 }] },
    3: { label: 'Bridge heavily damaged — DM−3; 1 crew casualty.', mechanics: [{ type: 'bridge_dm', value: -3 }, { type: 'crew_casualty', value: 1 }] },
    4: { label: 'Bridge depressurised — vacc suits required; DM−2.', mechanics: [{ type: 'hull_breach', value: true }, { type: 'bridge_dm', value: -2 }] },
    5: { label: 'Bridge crippled — offline; 1D crew casualties.', mechanics: [{ type: 'bridge_offline', value: true }, { type: 'crew_casualty', value: 'D6' }] },
    6: { label: 'Bridge destroyed — 2D crew casualties.', mechanics: [{ type: 'bridge_offline', value: true }, { type: 'crew_casualty', value: '2D6' }] },
  },

  hull: {
    1: { label: 'Hull breach — compartment venting.', mechanics: [{ type: 'hull_breach', value: true }] },
    2: { label: 'Significant breach — multiple compartments.', mechanics: [{ type: 'hull_breach', value: true }] },
    3: { label: 'Major breach — DM−1 to all checks.', mechanics: [{ type: 'hull_breach', value: true }, { type: 'bridge_dm', value: -1 }] },
    4: { label: 'Structural compromise — 1D crew casualties.', mechanics: [{ type: 'hull_breach', value: true }, { type: 'crew_casualty', value: 'D6' }] },
    5: { label: 'Hull critical — 2D crew casualties.', mechanics: [{ type: 'hull_breach', value: true }, { type: 'crew_casualty', value: '2D6' }] },
    6: { label: 'Hull destroyed — ship destroyed.', mechanics: [{ type: 'ship_destroyed', value: true }] },
  },

  weapon: {
    1: { label: 'Weapon hit — one turret DM−1 to next damage roll.', mechanics: [{ type: 'weapon_damage_dm', value: -1 }] },
    2: { label: 'Weapon damaged — one weapon offline.', mechanics: [{ type: 'weapon_offline', value: 1 }] },
    3: { label: 'Weapon destroyed.', mechanics: [{ type: 'weapon_destroyed', value: 1 }] },
    4: { label: 'Multiple weapons hit — two offline.', mechanics: [{ type: 'weapon_offline', value: 2 }] },
    5: { label: 'Weapons crippled — two destroyed, remaining DM−2.', mechanics: [{ type: 'weapon_destroyed', value: 2 }, { type: 'weapon_damage_dm', value: -2 }] },
    6: { label: 'All weapons destroyed.', mechanics: [{ type: 'weapon_destroyed', value: 99 }] },
  },

  armour: {
    1: { label: 'Armour ablated — Armour −2.', mechanics: [{ type: 'armour_reduce', value: 2 }] },
    2: { label: 'Armour damaged — Armour −4.', mechanics: [{ type: 'armour_reduce', value: 4 }] },
    3: { label: 'Armour degraded — Armour −6.', mechanics: [{ type: 'armour_reduce', value: 6 }] },
    4: { label: 'Armour halved.', mechanics: [{ type: 'armour_halve', value: true }] },
    5: { label: 'Armour destroyed — reduced to 0.', mechanics: [{ type: 'armour_reduce', value: 999 }] },
    6: { label: 'Armour stripped — Armour 0; DM−2 to future hull.', mechanics: [{ type: 'armour_reduce', value: 999 }, { type: 'bridge_dm', value: -2 }] },
  },

  crew: {
    1: { label: '1 crew incapacitated.', mechanics: [{ type: 'crew_casualty', value: 1 }] },
    2: { label: '1D crew incapacitated.', mechanics: [{ type: 'crew_casualty', value: 'D6' }] },
    3: { label: '2D crew casualties; DM−1 to all actions.', mechanics: [{ type: 'crew_casualty', value: '2D6' }, { type: 'bridge_dm', value: -1 }] },
    4: { label: 'Key crew out — GM chooses: Pilot, Captain, or Engineer.', mechanics: [{ type: 'crew_casualty', value: 'key' }] },
    5: { label: 'Bridge crew hit — all bridge crew 2D6 damage; DM−2.', mechanics: [{ type: 'crew_casualty', value: '2D6' }, { type: 'bridge_dm', value: -2 }] },
    6: { label: '3D crew killed.', mechanics: [{ type: 'crew_casualty', value: '3D6' }] },
  },

  stutterwarpDrive: {
    // 2300AD B3 p.58: TAC Speed −1 per point of Thrust lost (like M-Drive in CRB).
    1: { label: 'Stutterwarp hit — TAC Speed −1.', mechanics: [{ type: 'tacSpeed_reduce', value: 1 }] },
    2: { label: 'Drive damaged — TAC Speed −2.', mechanics: [{ type: 'tacSpeed_reduce', value: 2 }] },
    3: { label: 'Drive seriously damaged — TAC Speed halved.', mechanics: [{ type: 'tacSpeed_halve', value: true }] },
    4: { label: 'Drive crippled — TAC Speed reduced to 1.', mechanics: [{ type: 'tacSpeed_reduce', value: 99 }] },
    5: { label: 'Drive offline — TAC Speed 0.', mechanics: [{ type: 'tacSpeed_zero', value: true }] },
    6: { label: 'Drive destroyed — stutterwarp tactical drive gone.', mechanics: [{ type: 'tacSpeed_zero', value: true }] },
  },

  powerPlant: {
    1: { label: 'Power fluctuation — DM−1 to powered systems.', mechanics: [{ type: 'power_dm', value: -1 }] },
    2: { label: 'Power reduced — DM−2; one weapon powered down.', mechanics: [{ type: 'power_dm', value: -2 }] },
    3: { label: 'Power compromised — weapons half effective; DM−2.', mechanics: [{ type: 'power_dm', value: -2 }] },
    4: { label: 'Emergency power — sensors and weapons offline.', mechanics: [{ type: 'power_dm', value: -4 }, { type: 'sensors_offline', value: true }, { type: 'weapon_offline', value: 99 }] },
    5: { label: 'Power plant offline.', mechanics: [{ type: 'power_offline', value: true }] },
    6: { label: 'Power plant destroyed — 1D crew casualties.', mechanics: [{ type: 'power_offline', value: true }, { type: 'crew_casualty', value: 'D6' }] },
  },

  stutterwarpFtl: {
    // 2300AD B3 p.58: replace J-Drive with Stutterwarp (FTL only, not tactical).
    1: { label: 'FTL disrupted — next stutterwarp +1 day.', mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }] },
    2: { label: 'FTL coils damaged — DM−1 to jumps.', mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }] },
    3: { label: 'FTL seriously damaged — DM−2; repair before long range.', mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }] },
    4: { label: 'FTL disabled — cannot stutterwarp until repaired.', mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }] },
    5: { label: 'FTL destroyed — beyond field repair.', mechanics: [{ type: 'stutterwarp_ftl_destroyed', value: true }] },
    6: { label: 'FTL explodes — destroyed; 2D structural damage.', mechanics: [{ type: 'stutterwarp_ftl_destroyed', value: true }, { type: 'crew_casualty', value: '2D6' }] },
  },

  fuel: {
    1: { label: 'Minor fuel leak.', mechanics: [{ type: 'fuel_leak', value: 1 }] },
    2: { label: 'Fuel leak per round.', mechanics: [{ type: 'fuel_leak', value: 2 }] },
    3: { label: 'Significant fuel loss — range severely reduced.', mechanics: [{ type: 'fuel_leak', value: 3 }] },
    4: { label: 'Major fuel breach — emergency dump or risk explosion.', mechanics: [{ type: 'fuel_leak', value: 5 }] },
    5: { label: 'Fuel critical — dump or explode next round. 1D crew.', mechanics: [{ type: 'fuel_critical', value: true }, { type: 'crew_casualty', value: 'D6' }] },
    6: { label: 'Fuel explosion — ship destroyed.', mechanics: [{ type: 'ship_destroyed', value: true }] },
  },

  computer: {
    1: { label: 'Software glitch — DM−1 to software-aided actions.', mechanics: [{ type: 'computer_dm', value: -1 }] },
    2: { label: 'Computer hit — DM−2; one software crashes.', mechanics: [{ type: 'computer_dm', value: -2 }] },
    3: { label: 'Computer damaged — DM−3; multiple software offline.', mechanics: [{ type: 'computer_dm', value: -3 }] },
    4: { label: 'Computer severely hit — basic nav only; DM−4.', mechanics: [{ type: 'computer_dm', value: -4 }] },
    5: { label: 'Computer offline — manual operations only.', mechanics: [{ type: 'computer_offline', value: true }] },
    6: { label: 'Computer destroyed.', mechanics: [{ type: 'computer_offline', value: true }] },
  },
}

/** Display labels for internal critical hit systems. */
export const CRITICAL_HIT_SYSTEM_LABELS = {
  sensors:          'Sensors',
  bridge:           'Bridge',
  hull:             'Hull',
  weapon:           'Weapon',
  armour:           'Armour',
  crew:             'Crew',
  stutterwarpDrive: 'Stutterwarp Drive',
  powerPlant:       'Power Plant',
  stutterwarpFtl:   'Stutterwarp (FTL)',
  fuel:             'Fuel',
  computer:         'Computer',
}

/** Display labels for surface fixture systems. */
export const SURFACE_FIXTURE_SYSTEM_LABELS = {
  fireControl:    'Fire Control',
  surfaceWeapon:  'Weapon (External)',
  surfaceSensors: 'Sensors (External)',
  radiator:       'Radiator',
  dischargeVanes: 'Discharge Vanes',
  otherSystem:    'Other System',
}

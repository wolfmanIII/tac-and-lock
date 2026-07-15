// 2300AD B3 p.58 — Surface Fixture Damage (external, any hit Effect ≥ 3).
// Internal Critical Hits: Trav2022 CRB "p.158-159" per B3's own citation, but that
// range is unrelated Sensor Operations content in this project's CRB PDF — the real
// Location/Effects tables are on printed p.169/p.170 there (verified via pdftotext).
// B3 substitutions: M-Drive location → Reaction Drive (own binary mechanic, not
// M-Drive's table); J-Drive location → Stutterwarp Drive (reuses M-Drive's table,
// Thrust reinterpreted as TAC Speed).

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
    3: { label: 'Fire Control — no further effect.', mechanics: [] },
  },
  surfaceWeapon: {
    1: { label: 'Weapon — −1D Damage, DM−2 to attack rolls.', mechanics: [{ type: 'weapon_damage_dm', value: -1 }, { type: 'attack_dm', value: -2 }] },
    2: { label: 'Weapon disabled.', mechanics: [{ type: 'weapon_offline', value: 1 }] },
    3: { label: 'Weapon — no further effect.', mechanics: [] },
  },
  surfaceSensors: {
    1: { label: 'Sensors — DM−2 to all Electronics (sensors) checks.', mechanics: [{ type: 'sensors_dm', value: -2 }] },
    2: { label: 'Sensors — no additional effect.', mechanics: [] },
    3: { label: 'Sensors — no further effect.', mechanics: [] },
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

// ── INTERNAL CRITICAL HITS — CRB p.169–170 (as printed in this project's CRB PDF;
// B3 itself cites "p.158–159", but that range is unrelated Sensor Operations content
// in this specific PDF — a source-edition pagination mismatch) + 2300AD substitutions.

/**
 * Roll 2D on this table for Internal Critical Hits (damage penetrates, Effect ≥ 6 or hull to 0).
 * B3 p.58 substitutions, read carefully: the *location* named "M-Drive" is renamed
 * "Reaction Drive" and gets its own binary mechanic (not M-Drive's effects table — see
 * CRITICAL_HIT_EFFECTS.reactionDrive); the *location* named "J-Drive" is renamed
 * "Stutterwarp Drive" and reuses M-Drive's effects table (Thrust reinterpreted as TAC
 * Speed). These are easy to invert — verified against the primary source twice.
 * @type {Record<number, string>}
 */
export const INTERNAL_LOCATION_TABLE = {
  2:  'sensors',
  3:  'powerPlant',
  4:  'fuel',
  5:  'weapon',
  6:  'armour',
  7:  'hull',
  8:  'reactionDrive',   // was M-Drive — binary: 1st hit inoperable, 2nd hit destroyed
  9:  'cargo',
  10: 'stutterwarpDrive', // was J-Drive — reuses M-Drive's table, Thrust → TAC Speed
  11: 'crew',
  12: 'bridge',
}

/** All 11 trackable internal critical hit systems. */
export const CRITICAL_HIT_SYSTEMS = [
  'sensors',
  'powerPlant',
  'fuel',
  'weapon',
  'armour',
  'hull',
  'reactionDrive',
  'cargo',
  'stutterwarpDrive',
  'crew',
  'bridge',
]

/**
 * Max trackable severity per system — every system caps at 6 except Reaction Drive,
 * whose B3 mechanic is a 2-state binary (inoperable / destroyed), not a 1-6 ladder.
 * @type {Record<string, number>}
 */
export const CRITICAL_HIT_MAX_SEVERITY = {
  reactionDrive: 2,
}

/**
 * Max trackable severity for a system (6 unless overridden above).
 * @param {string} system
 * @returns {number}
 */
export function getMaxSeverity(system) {
  return CRITICAL_HIT_MAX_SEVERITY[system] ?? 6
}

/**
 * Severity for a new internal critical hit. CRB p.169: "The Severity of the critical
 * hit is equal to the Effect of the attack roll minus 5", and "If a spacecraft has
 * already sustained a critical hit to a location that receives another, use the
 * Severity of the new critical hit or the original plus one, whichever is higher."
 * Both rules combined, capped at the system's max (6 for most systems).
 *
 * Reaction Drive is the one exception: B3 p.58 describes it purely by hit count
 * ("the first hit renders the reaction drive inoperable... the second effectively
 * destroys it"), not by Effect — so a single very-high-Effect hit must NOT be able to
 * skip straight from undamaged to destroyed. It always advances by exactly +1 per hit,
 * capped at 2, ignoring the Effect-5 term entirely.
 * @param {number} effect — the triggering attack roll's Effect (≥ 6, since that's what
 *   triggers an internal crit at all)
 * @param {number} prevSeverity — this system's current severity (0 if undamaged)
 * @param {string} system
 * @returns {number}
 */
export function computeCriticalSeverity(effect, prevSeverity, system) {
  if (system === 'reactionDrive') return Math.min(getMaxSeverity(system), prevSeverity + 1)
  const fromEffect = effect - 5
  return Math.min(getMaxSeverity(system), Math.max(fromEffect, prevSeverity + 1, 1))
}

/**
 * Severity 1–6 effects per internal system (CRB p.170 + B3 substitutions). A few rows
 * repeat identical text across adjacent severities — transcribed faithfully from the
 * source rather than "corrected", since no errata for this table was found in
 * `doc/Traveller_Core_Rulebook_Update_2022_FAQ_Aug24.pdf`.
 * @type {Record<string, Record<number, { label: string, mechanics: { type: string, value?: any }[] }>>}
 */
export const CRITICAL_HIT_EFFECTS = {
  sensors: {
    1: { label: 'All checks to use sensors suffer DM−2.', mechanics: [{ type: 'sensors_dm', value: -2 }] },
    2: { label: 'Sensors inoperative beyond Medium range.', mechanics: [{ type: 'sensors_range_cap', value: 'Medium' }] },
    3: { label: 'Sensors inoperative beyond Short range.', mechanics: [{ type: 'sensors_range_cap', value: 'Short' }] },
    4: { label: 'Sensors inoperative beyond Close range.', mechanics: [{ type: 'sensors_range_cap', value: 'Close' }] },
    5: { label: 'Sensors inoperative beyond Adjacent range.', mechanics: [{ type: 'sensors_range_cap', value: 'Adjacent' }] },
    6: { label: 'Sensors disabled.', mechanics: [{ type: 'sensors_offline', value: true }] },
  },

  powerPlant: {
    1: { label: 'Power reduced by 10%.', mechanics: [{ type: 'power_reduce_pct', value: 10 }] },
    2: { label: 'Power reduced by 10% (as printed).', mechanics: [{ type: 'power_reduce_pct', value: 10 }] },
    3: { label: 'Power reduced by 50%.', mechanics: [{ type: 'power_reduce_pct', value: 50 }] },
    4: { label: 'Power reduced to 0.', mechanics: [{ type: 'power_offline', value: true }] },
    5: { label: 'Hull Severity +1. Power reduced to 0.', mechanics: [{ type: 'hull_severity_increase', value: 1 }, { type: 'power_offline', value: true }] },
    6: { label: 'Hull Severity +1D. Power reduced to 0.', mechanics: [{ type: 'hull_severity_increase', value: '1D6' }, { type: 'power_offline', value: true }] },
  },

  fuel: {
    1: { label: 'Leak — lose 1D tons of fuel per hour.', mechanics: [{ type: 'fuel_leak', value: '1D6/hour' }] },
    2: { label: 'Leak — lose 1D tons of fuel per round.', mechanics: [{ type: 'fuel_leak', value: '1D6/round' }] },
    3: { label: 'Leak — lose 1D×10% of fuel.', mechanics: [{ type: 'fuel_leak', value: '1D6x10%' }] },
    4: { label: 'Fuel tank destroyed.', mechanics: [{ type: 'fuel_tank_destroyed', value: true }] },
    5: { label: 'Fuel tank destroyed. Hull Severity +1.', mechanics: [{ type: 'fuel_tank_destroyed', value: true }, { type: 'hull_severity_increase', value: 1 }] },
    6: { label: 'Fuel tank destroyed. Hull Severity +1D.', mechanics: [{ type: 'fuel_tank_destroyed', value: true }, { type: 'hull_severity_increase', value: '1D6' }] },
  },

  weapon: {
    1: { label: 'Random weapon suffers DM−1 when used.', mechanics: [{ type: 'weapon_damage_dm', value: -1 }] },
    2: { label: 'Random weapon disabled.', mechanics: [{ type: 'weapon_offline', value: 1 }] },
    3: { label: 'Random weapon(s) destroyed.', mechanics: [{ type: 'weapon_destroyed', value: 1 }] },
    4: { label: 'Random weapon explodes. Hull Severity +1.', mechanics: [{ type: 'weapon_destroyed', value: 1 }, { type: 'hull_severity_increase', value: 1 }] },
    5: { label: 'D3 random weapons explode. Hull Severity +1.', mechanics: [{ type: 'weapon_destroyed', value: 'D3' }, { type: 'hull_severity_increase', value: 1 }] },
    6: { label: '1D random weapons explode. Hull Severity +1.', mechanics: [{ type: 'weapon_destroyed', value: '1D6' }, { type: 'hull_severity_increase', value: 1 }] },
  },

  armour: {
    1: { label: 'Armour reduced by −1.', mechanics: [{ type: 'armour_reduce', value: 1 }] },
    2: { label: 'Armour reduced by −D3.', mechanics: [{ type: 'armour_reduce', value: 'D3' }] },
    3: { label: 'Armour reduced by −1D.', mechanics: [{ type: 'armour_reduce', value: '1D6' }] },
    4: { label: 'Armour reduced by −1D (as printed).', mechanics: [{ type: 'armour_reduce', value: '1D6' }] },
    5: { label: 'Armour reduced by −2D. Hull Severity +1.', mechanics: [{ type: 'armour_reduce', value: '2D6' }, { type: 'hull_severity_increase', value: 1 }] },
    6: { label: 'Armour reduced by −2D (as printed). Hull Severity +1.', mechanics: [{ type: 'armour_reduce', value: '2D6' }, { type: 'hull_severity_increase', value: 1 }] },
  },

  hull: {
    // CRB p.169: "Any extra damage caused by the effects of critical hits ignores the spacecraft's Armour."
    1: { label: 'Spacecraft suffers 1D extra damage (ignores Armour).', mechanics: [{ type: 'extra_damage', value: '1D6' }] },
    2: { label: 'Spacecraft suffers 2D extra damage (ignores Armour).', mechanics: [{ type: 'extra_damage', value: '2D6' }] },
    3: { label: 'Spacecraft suffers 3D extra damage (ignores Armour).', mechanics: [{ type: 'extra_damage', value: '3D6' }] },
    4: { label: 'Spacecraft suffers 4D extra damage (ignores Armour).', mechanics: [{ type: 'extra_damage', value: '4D6' }] },
    5: { label: 'Spacecraft suffers 5D extra damage (ignores Armour).', mechanics: [{ type: 'extra_damage', value: '5D6' }] },
    6: { label: 'Spacecraft suffers 6D extra damage (ignores Armour).', mechanics: [{ type: 'extra_damage', value: '6D6' }] },
  },

  // Reaction Drive — 2300AD B3 p.58: NOT the normal 1-6 ladder. "Reaction drives are
  // very susceptible to damage. The first hit renders the reaction drive inoperable
  // until repaired, while the second effectively destroys it." Capped at severity 2
  // via getMaxSeverity/CRITICAL_HIT_MAX_SEVERITY.
  reactionDrive: {
    1: { label: 'Reaction Drive rendered inoperable until repaired.', mechanics: [{ type: 'reaction_drive_inoperable', value: true }] },
    2: { label: 'Reaction Drive destroyed.', mechanics: [{ type: 'reaction_drive_destroyed', value: true }] },
  },

  cargo: {
    1: { label: '10% of cargo destroyed.', mechanics: [{ type: 'cargo_destroyed_pct', value: 10 }] },
    2: { label: '1D×10% of cargo destroyed.', mechanics: [{ type: 'cargo_destroyed_pct', value: '1D6x10' }] },
    3: { label: '2D×10% of cargo destroyed.', mechanics: [{ type: 'cargo_destroyed_pct', value: '2D6x10' }] },
    4: { label: 'All cargo destroyed.', mechanics: [{ type: 'cargo_destroyed_pct', value: 100 }] },
    5: { label: 'All cargo destroyed. Hull Severity +1.', mechanics: [{ type: 'cargo_destroyed_pct', value: 100 }, { type: 'hull_severity_increase', value: 1 }] },
    6: { label: 'All cargo destroyed. Hull Severity +1D.', mechanics: [{ type: 'cargo_destroyed_pct', value: 100 }, { type: 'hull_severity_increase', value: '1D6' }] },
  },

  // Stutterwarp Drive — 2300AD B3 p.58: reuses M-Drive's effects table, "Thrust reduced"
  // reinterpreted as "Tac Speed reduced by -1 per point of Thrust lost".
  stutterwarpDrive: {
    1: { label: 'All checks to control the ship suffer DM−1.', mechanics: [{ type: 'pilot_dm', value: -1 }] },
    2: { label: 'All checks to control the ship suffer DM−1. TAC Speed −1.', mechanics: [{ type: 'pilot_dm', value: -1 }, { type: 'tacSpeed_reduce', value: 1 }] },
    3: { label: 'All checks to control the ship suffer DM−1. TAC Speed −1 (as printed).', mechanics: [{ type: 'pilot_dm', value: -1 }, { type: 'tacSpeed_reduce', value: 1 }] },
    4: { label: 'All checks to control the ship suffer DM−1. TAC Speed −1 (as printed).', mechanics: [{ type: 'pilot_dm', value: -1 }, { type: 'tacSpeed_reduce', value: 1 }] },
    5: { label: 'TAC Speed reduced to 0.', mechanics: [{ type: 'tacSpeed_zero', value: true }] },
    6: { label: 'TAC Speed reduced to 0. Hull Severity +1.', mechanics: [{ type: 'tacSpeed_zero', value: true }, { type: 'hull_severity_increase', value: 1 }] },
  },

  crew: {
    1: { label: 'Random occupant takes 1D damage.', mechanics: [{ type: 'crew_casualty', value: '1D6' }] },
    2: { label: 'Life support fails within 1D hours.', mechanics: [{ type: 'life_support_timer', value: '1D6 hours' }] },
    3: { label: '1D occupants take 2D damage.', mechanics: [{ type: 'crew_casualty', value: '1D6 occupants x 2D6' }] },
    4: { label: 'Life support fails within 1D rounds.', mechanics: [{ type: 'life_support_timer', value: '1D6 rounds' }] },
    5: { label: 'All occupants take 3D damage.', mechanics: [{ type: 'crew_casualty', value: 'all x 3D6' }] },
    6: { label: 'Life support fails.', mechanics: [{ type: 'life_support_timer', value: 'immediate' }] },
  },

  bridge: {
    1: { label: 'Random bridge station disabled.', mechanics: [{ type: 'bridge_station_offline', value: 1 }] },
    2: { label: 'Computer reboots — all software unavailable this round and next.', mechanics: [{ type: 'computer_offline_rounds', value: 2 }] },
    3: { label: 'Computer damaged. Reduce Bandwidth −50%.', mechanics: [{ type: 'bandwidth_reduce_pct', value: 50 }] },
    4: { label: 'Random bridge station destroyed. Occupant takes 1D×1D damage.', mechanics: [{ type: 'bridge_station_destroyed', value: 1 }, { type: 'crew_casualty', value: '1D6x1D6' }] },
    // Severity 5 reconstructed from a page-wrap-ambiguous extraction (lower confidence
    // than the rest of this table) — verify against the physical book if exact wording matters.
    5: { label: 'Computer destroyed.', mechanics: [{ type: 'computer_destroyed', value: true }] },
    6: { label: 'Random bridge station destroyed. Occupant takes 1D×1D damage. Hull Severity +1.', mechanics: [{ type: 'bridge_station_destroyed', value: 1 }, { type: 'crew_casualty', value: '1D6x1D6' }, { type: 'hull_severity_increase', value: 1 }] },
  },
}

/** Display labels for internal critical hit systems. */
export const CRITICAL_HIT_SYSTEM_LABELS = {
  sensors:          'Sensors',
  powerPlant:       'Power Plant',
  fuel:             'Fuel',
  weapon:           'Weapon',
  armour:           'Armour',
  hull:             'Hull',
  reactionDrive:    'Reaction Drive',
  cargo:            'Cargo',
  stutterwarpDrive: 'Stutterwarp Drive',
  crew:             'Crew',
  bridge:           'Bridge',
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

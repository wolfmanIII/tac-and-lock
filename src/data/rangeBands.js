// 2300AD B3 p.52 — Range bands. Light-second scale (~150,000 km = ½ ls = Close).
// Distances are B3 canonical. Movement between bands is resolved via an opposed
// Pilot check (Open/Close, B3 p.54) — see utils/rangeBands.js:moveBands — not a
// fixed TAC-Speed cost table (no such table exists in the source).

/** @type {{ id: string, label: string, distance: string }[]} */
export const RANGE_BANDS = [
  { id: 'Adjacent', label: 'Adjacent',  distance: '< 100 km' },
  { id: 'Close',    label: 'Close',     distance: '≤ 150,000 km' },
  { id: 'Short',    label: 'Short',     distance: '150,001–300,000 km' },
  { id: 'Medium',   label: 'Medium',    distance: '301,000–450,000 km' },
  { id: 'Long',     label: 'Long',      distance: '450,001–600,000 km' },
  { id: 'VeryLong', label: 'Very Long', distance: '600,001–750,000 km' },
  { id: 'Distant',  label: 'Distant',   distance: '> 750,000 km' },
]

/** Ordered array of band IDs from nearest to farthest. */
export const RANGE_BAND_ORDER = [
  'Adjacent', 'Close', 'Short', 'Medium', 'Long', 'VeryLong', 'Distant',
]

/**
 * Sensor Time-lag DM per range band. Applied to Electronics(sensors) checks
 * in Firing Solution Step 1. // 2300AD B3 p.47
 * @type {Record<string, number>}
 */
export const SENSOR_TIME_LAG_DM = {
  Adjacent:  1,
  Close:     0,
  Short:    -1,
  Medium:   -2,
  Long:     -3,
  VeryLong: -4,
  Distant:  -5,
}

/**
 * Bands at which a drone/missile's lightspeed lag DM applies — B3 p.55: "Drones at Long
 * range have a DM-1 to all actions due to lightspeed lag." B3 gives no finer-grained table
 * for VeryLong/Distant (unlike Sensor Time-Lag's full graduated scale), so "at Long range"
 * is read as the threshold beyond which lag kicks in, extending to the farther bands —
 * issue #49. Distinct from SENSOR_TIME_LAG_DM above: this depends on the range from the
 * drone to its *owner/controller* (`drone.ownerBand`), not to its target (`currentBand`).
 * @type {string[]}
 */
export const DRONE_LIGHTSPEED_LAG_BANDS = ['Long', 'VeryLong', 'Distant']

/**
 * Drone/missile lightspeed lag DM for a given owner↔drone band. // 2300AD B3 p.55, issue #49
 * B3's own text exempts a sensor hand-off from another vessel from this penalty ("some
 * functions, like using sensors, can be handed off... Drones at Long range have..."), so
 * callers must only apply this to actions actually routed through the drone's own remote
 * link — self-generated Sensor (Step 1), Position Vessel (Step 2), and Gunner (Step 3), not
 * a hand-off Sensor check or the target ship's own Point Defence reaction.
 * @param {string} ownerBand
 * @returns {number} -1 if ownerBand is Long/VeryLong/Distant, else 0
 */
export function getDroneLightspeedLagDm(ownerBand) {
  return DRONE_LIGHTSPEED_LAG_BANDS.includes(ownerBand) ? -1 : 0
}

/**
 * Default weapon attack DM per range band. // 2300AD B3 p.57
 * Weapon definitions in data/weapons.js always override these values.
 * Beyond Close range, DMs become severe — most weapons cannot reach Short at all.
 * Use -20 as "effectively out of range" sentinel (makes attack nearly impossible).
 * @type {Record<string, number>}
 */
export const RANGE_BAND_DEFAULT_ATTACK_DM = {
  Adjacent:  2,
  Close:     0,
  Short:    -6,
  Medium:  -20,
  Long:    -20,
  VeryLong:-20,
  Distant: -20,
}

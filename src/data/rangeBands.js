// 2300AD B3 p.52 — Range bands. Light-second scale (~150,000 km = ½ ls = Close).
// TAC Speed costs derived from stutterwarp efficiency tables; distances are B3 canonical.

/** @type {{ id: string, label: string, distance: string, tacSpeedCost: number }[]} */
export const RANGE_BANDS = [
  { id: 'Adjacent', label: 'Adjacent', distance: '< 100 km',              tacSpeedCost: 1  },
  { id: 'Close',    label: 'Close',    distance: '≤ 150,000 km',          tacSpeedCost: 1  },
  { id: 'Short',    label: 'Short',    distance: '150,001–300,000 km',    tacSpeedCost: 2  },
  { id: 'Medium',   label: 'Medium',   distance: '301,000–450,000 km',    tacSpeedCost: 5  },
  { id: 'Long',     label: 'Long',     distance: '450,001–600,000 km',    tacSpeedCost: 10 },
  { id: 'VeryLong', label: 'Very Long', distance: '600,001–750,000 km',   tacSpeedCost: 25 },
  { id: 'Distant',  label: 'Distant',  distance: '> 750,000 km',          tacSpeedCost: 50 },
]

/** Ordered array of band IDs from nearest to farthest. */
export const RANGE_BAND_ORDER = [
  'Adjacent', 'Close', 'Short', 'Medium', 'Long', 'VeryLong', 'Distant',
]

/**
 * TAC Speed cost to enter each band from the adjacent band.
 * Accumulate in basicBandPool per round; band changes when pool ≥ cost.
 * @type {Record<string, number>}
 */
export const RANGE_BAND_MOVE_COST = {
  Adjacent: 1,
  Close:    1,
  Short:    2,
  Medium:   5,
  Long:     10,
  VeryLong: 25,
  Distant:  50,
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

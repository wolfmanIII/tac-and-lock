// Trav2022 CRB p.160 — Range bands. tac-and-lock uses 7 bands (2300AD adds Close).

/** @type {{ id: string, label: string, distance: string, tacSpeedCost: number }[]} */
export const RANGE_BANDS = [
  { id: 'Adjacent', label: 'Adjacent', distance: '≤ 1 km',          tacSpeedCost: 1  },
  { id: 'Close',    label: 'Close',    distance: '1–10 km',          tacSpeedCost: 1  },
  { id: 'Short',    label: 'Short',    distance: '11–1,250 km',      tacSpeedCost: 2  },
  { id: 'Medium',   label: 'Medium',   distance: '1,251–10,000 km',  tacSpeedCost: 5  },
  { id: 'Long',     label: 'Long',     distance: '10,001–25,000 km', tacSpeedCost: 10 },
  { id: 'VeryLong', label: 'Very Long', distance: '25,001–50,000 km', tacSpeedCost: 25 },
  { id: 'Distant',  label: 'Distant',  distance: '> 50,000 km',      tacSpeedCost: 50 },
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
 * Weapon attack DM per range band for weapons without an explicit rangeDm table.
 * Weapon definitions in data/weapons.js always override these values.
 * @type {Record<string, number>}
 */
export const RANGE_BAND_DEFAULT_ATTACK_DM = {
  Adjacent: 0,
  Close:    0,
  Short:    0,
  Medium:   -1,
  Long:     -2,
  VeryLong: -4,
  Distant:  -6,
}

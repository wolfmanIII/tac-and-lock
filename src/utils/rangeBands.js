import { RANGE_BAND_ORDER, RANGE_BAND_MOVE_COST } from '../data/rangeBands.js'

export { RANGE_BAND_ORDER }

/**
 * Order-independent key for a ship pair.
 * @param {string} a — ship ID
 * @param {string} b — ship ID
 * @returns {string}
 */
export function pairKey(a, b) {
  return [a, b].sort().join('::')
}

/**
 * Index of a band in the ordered list (0 = Adjacent, 6 = Distant).
 * @param {string} bandId
 * @returns {number} -1 if not found
 */
export function getBandIndex(bandId) {
  return RANGE_BAND_ORDER.indexOf(bandId)
}

/**
 * Band ID one step closer (toward Adjacent). Returns null if already Adjacent.
 * @param {string} bandId
 * @returns {string | null}
 */
export function getCloserBand(bandId) {
  const idx = getBandIndex(bandId)
  return idx > 0 ? RANGE_BAND_ORDER[idx - 1] : null
}

/**
 * Band ID one step farther (toward Distant). Returns null if already Distant.
 * @param {string} bandId
 * @returns {string | null}
 */
export function getFartherBand(bandId) {
  const idx = getBandIndex(bandId)
  return idx >= 0 && idx < RANGE_BAND_ORDER.length - 1
    ? RANGE_BAND_ORDER[idx + 1]
    : null
}

/**
 * TAC Speed cost to move one step from fromBand toward toBand.
 * Cost = destination band's tacSpeedCost value.
 * @param {string} fromBand
 * @param {'closer' | 'farther'} direction
 * @returns {number} Infinity if already at the edge in that direction
 */
export function getTacSpeedCostOneStep(fromBand, direction) {
  const targetBand = direction === 'closer'
    ? getCloserBand(fromBand)
    : getFartherBand(fromBand)
  if (!targetBand) return Infinity
  return RANGE_BAND_MOVE_COST[targetBand]
}

/**
 * Total TAC Speed cost to move from fromBand to toBand (may be multiple steps).
 * Sums destination band costs for each step along the path.
 * @param {string} fromBand
 * @param {string} toBand
 * @returns {number} Infinity if either band is unknown
 */
export function getTacSpeedCostTo(fromBand, toBand) {
  const fromIdx = getBandIndex(fromBand)
  const toIdx   = getBandIndex(toBand)
  if (fromIdx === -1 || toIdx === -1) return Infinity
  if (fromIdx === toIdx) return 0

  const dir = toIdx > fromIdx ? 1 : -1
  let cost = 0
  for (let i = fromIdx + dir; i !== toIdx + dir; i += dir) {
    cost += RANGE_BAND_MOVE_COST[RANGE_BAND_ORDER[i]]
  }
  return cost
}

/**
 * Whether a ship with availableTacSpeed can move from fromBand to targetBand in one round.
 * @param {string} fromBand
 * @param {string} targetBand
 * @param {number} availableTacSpeed
 * @returns {boolean}
 */
export function canMoveOnce(fromBand, targetBand, availableTacSpeed) {
  return availableTacSpeed >= getTacSpeedCostTo(fromBand, targetBand)
}

/**
 * Resolve basicBandPool movement for a pair.
 * Each round, the net TAC Speed contribution is added to the pool.
 * When the pool reaches the cost threshold, the band changes.
 *
 * @param {string} currentBand
 * @param {number} pool — current accumulated TAC Speed for this pair
 * @param {'closer' | 'farther' | 'hold'} intent
 * @param {number} netTacSpeed — TAC Speed applied toward this movement this round
 * @returns {{ newBand: string, newPool: number }}
 */
export function resolveBasicBandMovement(currentBand, pool, intent, netTacSpeed) {
  if (intent === 'hold') return { newBand: currentBand, newPool: pool }

  const newPool = pool + netTacSpeed
  const cost    = getTacSpeedCostOneStep(currentBand, intent)

  if (newPool >= cost) {
    const newBand = intent === 'closer'
      ? getCloserBand(currentBand)
      : getFartherBand(currentBand)
    // Band change: pool resets (excess carries over)
    return {
      newBand: newBand ?? currentBand,
      newPool: newBand ? newPool - cost : pool,
    }
  }

  return { newBand: currentBand, newPool }
}

/**
 * Whether the given band represents a dogfight-range engagement.
 * Adjacent and Close are considered dogfight range in 2300AD.
 * @param {string} bandId
 * @returns {boolean}
 */
export function isDogfightRange(bandId) {
  return bandId === 'Adjacent' || bandId === 'Close'
}

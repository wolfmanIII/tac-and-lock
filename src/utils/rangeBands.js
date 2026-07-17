import { RANGE_BAND_ORDER } from '../data/rangeBands.js'

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
 * Move a number of bands in one direction from currentBand, clamped at the
 * track edges (Adjacent/Distant). Used to apply the Effect of an opposed
 * Pilot check (Open/Close, B3 p.54) to a range band pair.
 * @param {string} currentBand
 * @param {'closer' | 'farther'} direction
 * @param {number} count — number of bands to move (the check's Effect); ≤ 0 is a no-op
 * @returns {string} the resulting band id
 */
export function moveBands(currentBand, direction, count) {
  let band = currentBand
  for (let i = 0; i < count; i++) {
    const next = direction === 'closer' ? getCloserBand(band) : getFartherBand(band)
    if (!next) break // already at the edge of the track
    band = next
  }
  return band
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

/**
 * Which pending pursuits (tracked in `distantPursuit`, keyed by pairKey) flip to "ended"
 * at the start of `nextRound` — "Combat ends one round after the range becomes Distant, if
 * the pursuing ship cannot successfully close." // 2300AD B3 p.54
 *
 * Literal timing: a pair reaches Distant during round R (`since: R`); if it is still
 * Distant at the start of round R+1 (`nextRound > since`), combat ends for that pair. Skips
 * pairs no longer at Distant (successfully closed) and pairs already flagged `ended`.
 * @param {Record<string, { since: number, ended: boolean }>} distantPursuit
 * @param {Record<string, string>} rangeBands — pairKey → current band id
 * @param {number} nextRound — the round about to begin
 * @returns {string[]} pairKeys that newly end this round
 */
export function computeEndedPursuits(distantPursuit, rangeBands, nextRound) {
  return Object.entries(distantPursuit)
    .filter(([key, entry]) =>
      !entry.ended &&
      rangeBands[key] === 'Distant' &&
      nextRound > entry.since,
    )
    .map(([key]) => key)
}

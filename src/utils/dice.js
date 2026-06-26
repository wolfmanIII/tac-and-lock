/**
 * Roll n dice of the given number of sides.
 * @param {number} n
 * @param {number} sides
 * @returns {number[]}
 */
export function rollDice(n, sides) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * sides) + 1)
}

/** @returns {number[]} Two individual d6 results. */
export function roll2D6() {
  return rollDice(2, 6)
}

/** @returns {number} Single d6 result. */
export function roll1D6() {
  return rollDice(1, 6)[0]
}

/** @returns {number} 1–3 result. */
export function rollD3() {
  return Math.ceil(Math.random() * 3)
}

/**
 * Format an array of dice rolls as "[d1+d2]=sum".
 * @param {number[]} results
 * @returns {string}
 */
export function formatDiceResults(results) {
  const sum = results.reduce((a, b) => a + b, 0)
  return `[${results.join('+')}]=${sum}`
}

/**
 * Evaluate a task check result.
 * @param {number} total  — 2D6 + DMs
 * @param {number} difficulty  — target number (e.g. 8 for Average, 10 for Hard)
 * @returns {{ total: number, difficulty: number, success: boolean, effect: number }}
 */
export function formatCheckResult(total, difficulty) {
  return {
    total,
    difficulty,
    success: total >= difficulty,
    effect: total - difficulty,
  }
}

/**
 * Traveller characteristic DM. // Trav2022 CRB p.6
 * @param {number} stat — raw characteristic value (0–15)
 * @returns {number} DM (-3 to +3)
 */
export function getCharDM(stat) {
  if (stat <= 2)  return -2
  if (stat <= 5)  return -1
  if (stat <= 8)  return 0
  if (stat <= 11) return 1
  if (stat <= 14) return 2
  return 3
}

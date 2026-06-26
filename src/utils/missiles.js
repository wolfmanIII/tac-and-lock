// Trav2022 CRB p.169 — Missile mechanics in basic (range band) mode.

import { roll2D6 } from './dice.js'
import { getBandIndex, RANGE_BAND_ORDER } from './rangeBands.js'

/**
 * Rounds to impact based on launch range band.
 * Missiles travel at a fixed rate; closer = fewer rounds. // Trav2022 CRB p.169
 * @type {Record<string, number>}
 */
export const MISSILE_FLIGHT_ROUNDS = {
  Adjacent: 1,
  Close:    1,
  Short:    2,
  Medium:   3,
  Long:     4,
  VeryLong: 5,
  Distant:  6,
}

/**
 * Compute rounds to impact for a salvo launched at the given range band.
 * @param {string} launchBand
 * @returns {number}
 */
export function computeFlightRounds(launchBand) {
  return MISSILE_FLIGHT_ROUNDS[launchBand] ?? 1
}

/**
 * Advance a missile salvo one round closer to impact.
 * Moves the salvo one range band closer to its target.
 * @param {{ currentBand: string, roundsLeft: number }} salvo
 * @returns {{ currentBand: string, roundsLeft: number, arrived: boolean }}
 */
export function advanceMissileOneRound(salvo) {
  const roundsLeft = salvo.roundsLeft - 1
  const arrived    = roundsLeft <= 0

  if (arrived) {
    return { ...salvo, roundsLeft: 0, arrived: true }
  }

  // Move one band closer
  const idx      = getBandIndex(salvo.currentBand)
  const newBand  = idx > 0 ? RANGE_BAND_ORDER[idx - 1] : salvo.currentBand

  return { ...salvo, currentBand: newBand, roundsLeft, arrived: false }
}

/**
 * Compute the attack DM for a missile salvo at impact.
 * // Trav2022 CRB p.169 — base DM comes from salvo size and electronic warfare.
 *
 * @param {{
 *   salvoDmBonus?: number,      — DM from salvo size (each additional missile +DM1)
 *   fireControlDm?: number,     — fire control software DM
 *   sensorLockDm?: number,      — sensor lock action DM
 *   ewPenalty?: number,         — EW countermeasure penalty (negative or 0)
 *   evasiveDm?: number,         — target evasion penalty (negative or 0)
 *   pointDefenceReductions?: number, — number of missiles shot down by point defence
 * }} params
 * @returns {{ dms: Record<string, number>, total: number, salvosRemaining: number }}
 */
export function computeMissileAttackDM({
  salvoDmBonus       = 0,
  fireControlDm      = 0,
  sensorLockDm       = 0,
  ewPenalty          = 0,
  evasiveDm          = 0,
}) {
  const dms = {
    salvoDmBonus,
    fireControlDm,
    sensorLockDm,
    ewPenalty,
    evasiveDm,
  }
  const total = Object.values(dms).reduce((a, b) => a + b, 0)
  return { dms, total }
}

/**
 * Roll missile attack at impact. Missiles attack at 2D6 + DM, difficulty 8+.
 * // Trav2022 CRB p.169
 * @param {number} totalDm
 * @returns {{ dice: number[], base: number, totalDm: number, total: number, success: boolean, effect: number }}
 */
export function rollMissileAttack(totalDm) {
  const dice  = roll2D6()
  const base  = dice[0] + dice[1]
  const total = base + totalDm
  return {
    dice,
    base,
    totalDm,
    total,
    success: total >= 8,
    effect:  total - 8,
  }
}

/**
 * Compute point defence results against an incoming salvo.
 * Each successful PD gunner roll reduces the salvo count by 1.
 * // Trav2022 CRB p.164
 *
 * @param {number} salvoSize — number of missiles in the salvo
 * @param {{ roll: number, success: boolean }[]} pdRolls — one per PD weapon
 * @returns {{ salvosRemaining: number, destroyed: number }}
 */
export function resolvePointDefence(salvoSize, pdRolls) {
  const destroyed       = pdRolls.filter((r) => r.success).length
  const salvosRemaining = Math.max(0, salvoSize - destroyed)
  return { salvosRemaining, destroyed }
}

/**
 * Build a new missile salvo object for the battle store.
 * @param {{
 *   id: string,
 *   attackerId: string,
 *   targetId: string,
 *   launchBand: string,
 *   salvoSize: number,
 *   attackDmBonus?: number,
 *   round: number,
 * }} params
 * @returns {object}
 */
export function makeMissileSalvo({
  id,
  attackerId,
  targetId,
  launchBand,
  salvoSize,
  attackDmBonus = 0,
  round,
}) {
  const flightRounds = computeFlightRounds(launchBand)
  return {
    id,
    attackerId,
    targetId,
    launchBand,
    currentBand:    launchBand,
    salvoSize,
    salvoRemaining: salvoSize,
    attackDmBonus,
    flightRounds,
    roundsLeft:     flightRounds,
    launchedRound:  round,
    arrived:        flightRounds <= 1,
  }
}

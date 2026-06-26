// Trav2022 CRB pp.159–175 — Space combat mechanics.
// 2300AD: TAC Speed replaces Thrust; Stutterwarp replaces M-Drive/J-Drive.

import { roll2D6, getCharDM } from './dice.js'
import { WEAPONS } from '../data/weapons.js'
import { RANGE_BAND_DEFAULT_ATTACK_DM } from '../data/rangeBands.js'

// === INITIATIVE ===

/**
 * Roll initiative for a ship. // Trav2022 CRB p.161
 * Formula: 2D6 + Pilot skill + TAC Speed
 * @param {number} tacSpeed
 * @param {number} pilotSkill
 * @param {number} [pilotDex]  — Pilot's DEX characteristic (optional)
 * @returns {{ dice: number[], base: number, pilotSkill: number, charDm: number, tacSpeed: number, total: number }}
 */
export function rollInitiative(tacSpeed, pilotSkill, pilotDex = 7) {
  const dice   = roll2D6()
  const base   = dice[0] + dice[1]
  const charDm = getCharDM(pilotDex)
  return {
    dice,
    base,
    pilotSkill,
    charDm,
    tacSpeed,
    total: base + pilotSkill + charDm + tacSpeed,
  }
}

// === RANGE DM ===

/**
 * Attack DM for a weapon at a given range band.
 * @param {string} weaponId
 * @param {string} rangeBand
 * @returns {number}
 */
export function getRangeDM(weaponId, rangeBand) {
  const weapon = WEAPONS[weaponId]
  if (!weapon) return RANGE_BAND_DEFAULT_ATTACK_DM[rangeBand] ?? -8
  return weapon.rangeDm[rangeBand] ?? -8
}

// === CHARACTERISTIC DM ===

/**
 * DM bonus for a gunner's DEX in attack rolls. // Trav2022 CRB p.6
 * @param {number} dex
 * @returns {number}
 */
export function getGunnerDexDM(dex) {
  return getCharDM(dex)
}

// === TARGET SIZE DM ===

/**
 * DM for target ship size. Larger ships are easier to hit. // Trav2022 CRB p.163
 * @param {number} tonnage
 * @returns {number}
 */
export function getTargetSizeDM(tonnage) {
  if (tonnage < 100)    return -2
  if (tonnage < 1000)   return 0
  if (tonnage < 10000)  return 1
  if (tonnage < 100000) return 2
  return 4
}

// === EVASIVE ACTION DM ===

/**
 * DM applied against incoming attacks when a ship declares evasive action.
 * The penalty is equal to the TAC Speed spent on evasion. // Trav2022 CRB p.164
 * @param {number} tacSpeedSpent — TAC Speed allocated to evasion this round
 * @returns {number} negative DM (attacker penalty)
 */
export function getEvasiveDM(tacSpeedSpent) {
  return -Math.max(0, tacSpeedSpent)
}

// === ATTACK ROLL ===

/**
 * Collect all DMs for an attack roll and return a breakdown.
 * @param {{
 *   gunnerSkill: number,
 *   weaponId: string,
 *   rangeBand: string,
 *   fireControlDm?: number,   — from Fire Control software
 *   sensorLockDm?: number,    — from Sensor Lock action
 *   ewDm?: number,            — from Electronic Warfare (negative)
 *   evasiveDm?: number,       — from target's evasive action (negative)
 *   gunnerDexDm?: number,
 *   targetSizeDm?: number,
 *   otherDm?: number,
 * }} params
 * @returns {{ dms: Record<string, number>, total: number }}
 */
export function computeAttackDMs({
  gunnerSkill,
  weaponId,
  rangeBand,
  fireControlDm   = 0,
  sensorLockDm    = 0,
  ewDm            = 0,
  evasiveDm       = 0,
  gunnerDexDm     = 0,
  targetSizeDm    = 0,
  otherDm         = 0,
}) {
  const dms = {
    gunnerSkill,
    rangeDm:       getRangeDM(weaponId, rangeBand),
    fireControlDm,
    sensorLockDm,
    ewDm,
    evasiveDm,
    gunnerDexDm,
    targetSizeDm,
    otherDm,
  }
  const total = Object.values(dms).reduce((a, b) => a + b, 0)
  return { dms, total }
}

/**
 * Roll an attack (2D6 + total DM). // Trav2022 CRB p.163
 * @param {number} totalDm
 * @returns {{ dice: number[], base: number, totalDm: number, total: number, success: boolean, effect: number }}
 */
export function rollAttack(totalDm) {
  const dice   = roll2D6()
  const base   = dice[0] + dice[1]
  const total  = base + totalDm
  const target = 10 // Difficult (10+) — Gunner check in Firing Solution // 2300AD B3 p.56
  return {
    dice,
    base,
    totalDm,
    total,
    success: total >= target,
    effect:  total - target,
  }
}

// === DAMAGE ===

/**
 * Resolve AP penetration from weapon traits. // 2300AD B3 p.59
 * "Radiation" (particle barbette) = AP∞. "AP X" = ignore X armour points.
 * @param {string[]} traits
 * @param {number} armour
 * @returns {number} effective armour after AP reduction
 */
function resolveArmour(traits, armour) {
  if (traits.includes('Radiation')) return 0
  const apTrait = traits.find((t) => /^AP\s*\d+$/i.test(t))
  if (apTrait) {
    const apValue = parseInt(apTrait.replace(/\D/g, ''), 10)
    return Math.max(0, armour - apValue)
  }
  return Math.max(0, armour)
}

/**
 * Roll damage for a weapon hit.
 * Handles flat bonus in dice notation ("2D+2"), AP X trait, and multi-weapon bonus.
 * // 2300AD B3 p.59–60; Trav2022 CRB p.167
 *
 * @param {string} weaponId
 * @param {number} weaponCount — number of same weapon type in turret (1–3)
 * @param {number} armour      — target's current armour value
 * @returns {{ rolls: number[], bonus: number, gross: number, armour: number, net: number }}
 */
export function rollDamage(weaponId, weaponCount = 1, armour = 0) {
  const weapon = WEAPONS[weaponId]
  if (!weapon) return { rolls: [], bonus: 0, gross: 0, armour: 0, net: 0 }

  const [n, sides, flatBonus] = parseDiceNotation(weapon.damage)
  const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * sides) + 1)
  const diceTotal = rolls.reduce((a, b) => a + b, 0)

  // Multi-weapon bonus: +damageBonus per additional weapon (not per die) // Trav2022 CRB p.167
  const multiBonus = weapon.damageBonus * Math.max(0, weaponCount - 1)
  const bonus      = flatBonus + multiBonus
  const gross      = diceTotal + bonus

  const effectiveArmour = resolveArmour(weapon.traits, armour)
  const net = Math.max(0, gross - effectiveArmour)

  return { rolls, bonus, gross, armour: effectiveArmour, net }
}

// === CRITICAL HITS ===

/**
 * Check whether a hit qualifies as a critical hit.
 * In Traveller 2022, a critical hit occurs when a single hit brings the ship's
 * Hull to 0 or below, or when effect ≥ 6. // Trav2022 CRB p.162
 *
 * Simplified rule applied here: effect ≥ 6 on the attack roll, OR net damage ≥ hullCurrent.
 * @param {number} attackEffect — effect from the attack roll
 * @param {number} netDamage
 * @param {number} hullCurrent — ship's current hull points before this hit
 * @returns {boolean}
 */
export function isCriticalHit(attackEffect, netDamage, hullCurrent) {
  return attackEffect >= 6 || netDamage >= hullCurrent
}

/**
 * Next severity level to record for a given system.
 * @param {Record<string, number>} criticalTracks — current track state { system: severity }
 * @param {string} system
 * @returns {number} 1–6 (capped at 6)
 */
export function getNextSeverity(criticalTracks, system) {
  const current = criticalTracks[system] ?? 0
  return Math.min(6, current + 1)
}

// === HELPERS ===

/**
 * Parse a dice notation string into [count, sides, flatBonus].
 * Handles "2D", "4D", "2D+2", "1D-1". // 2300AD B3 p.60 (Grumbler: 2D+2)
 * @param {string} notation
 * @returns {[number, number, number]} [diceCount, sides, flatBonus]
 */
export function parseDiceNotation(notation) {
  const match = notation.match(/^(\d+)D(\d*)([+-]\d+)?$/i)
  if (!match) return [1, 6, 0]
  return [
    parseInt(match[1], 10),
    match[2] ? parseInt(match[2], 10) : 6,
    match[3] ? parseInt(match[3], 10) : 0,
  ]
}

/**
 * Sandcaster reaction: each sandcaster absorbs 1D3 armour points vs one laser attack.
 * // Trav2022 CRB p.164
 * @param {number} sandcasterCount — number of sandcasters deployed
 * @returns {{ armourBonus: number, rolls: number[] }}
 */
export function rollSandcasterAbsorption(sandcasterCount) {
  const rolls = Array.from({ length: sandcasterCount }, () => Math.ceil(Math.random() * 3))
  return {
    rolls,
    armourBonus: rolls.reduce((a, b) => a + b, 0),
  }
}

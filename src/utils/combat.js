// 2300AD B3 p.52–62 — Space combat mechanics (primary source).
// Trav2022 CRB p.158–159: internal critical hit location table (with B3 substitutions).
// When B3 and CRB diverge, B3 wins.

import { roll2D6, getCharDM } from './dice.js'
import { WEAPONS } from '../data/weapons.js'
import { RANGE_BAND_DEFAULT_ATTACK_DM } from '../data/rangeBands.js'

// === INITIATIVE ===

/**
 * Roll initiative for a ship. // 2300AD B3 p.54
 * Opposed Tactics(naval) check (INT) by the Captain.
 * Formula: 2D6 + Tactics(naval) + INT DM
 * @param {number} tacticsNaval — Captain's Tactics(naval) skill (0 if no captain assigned)
 * @param {number} [captainInt] — Captain's INT characteristic (default 7 = DM+0)
 * @param {{ dice: number[] } | null} [diceOverride] — pre-rolled dice (manual player entry)
 */
export function rollInitiative(tacticsNaval, captainInt = 7, diceOverride = null) {
  const dice  = diceOverride?.dice ?? roll2D6()
  const base  = dice[0] + dice[1]
  const intDm = getCharDM(captainInt)
  return {
    dice,
    base,
    tacticsNaval,
    intDm,
    captainInt,
    total: base + tacticsNaval + intDm,
    breakdown: { roll: base, tacticsNaval, intDm },
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
 * DM for a characteristic value (used for any stat as gunner/sensor/pilot).
 * @param {number} stat
 * @returns {number}
 */
export function getCharacteristicDM(stat) {
  return getCharDM(stat)
}

// === ATTACK ROLL ===

/**
 * Collect all DMs for the Gunner check (Step 3 of the Firing Solution). // 2300AD B3 p.56
 * carryEffect is the positive Effect from Step 2 (Pilot check); negative Effect is discarded.
 * @param {{
 *   gunnerSkill: number,
 *   gunnerIntDm: number,      — Gunner's INT DM (Gunner check uses INT // B3 p.56)
 *   weaponId: string,
 *   rangeBand: string,
 *   fireControlDm?: number,   — Fire Control software rating (+1/level // B3 p.44)
 *   carryEffect?: number,     — positive Effect carried from Pilot check (Step 2)
 *   captainAssistDm?: number, — Captain Tactics(naval) assist (+Effect if success // B3 p.56)
 *   evasionDm?: number,       — target evasion DM (opposed Pilot check Effect // B3 p.55)
 *   ewDm?: number,            — Electronic Warfare DM (negative)
 *   otherDm?: number,
 * }} params
 * @returns {{ dms: Record<string, number>, total: number }}
 */
/**
 * Compute the attack DM contribution from a weapon's traits. // 2300AD B3 p.59
 * Accurate: DM+1 to attack roll.
 * Slow: DM−2 to attack roll.
 * @param {string[]} traits
 * @returns {number}
 */
export function getWeaponTraitAttackDm(traits = []) {
  let dm = 0
  if (traits.includes('Accurate')) dm += 1
  if (traits.includes('Slow'))     dm -= 2
  return dm
}

/**
 * Point Defence reaction DM — the dedicated intercept action, distinct from the
 * "Point Defence" weapon trait's DM+2 (which applies to normal attacks vs
 * missiles/drones/fighters, not this reaction). // 2300AD B3 p.55, reinforced p.56
 * "Point defence requires a Difficult (10+) Gunner check (DEX), with DM-2 for missiles
 * and drones under 10 tons. If a PDC is used, it receives DM+4 instead of DM-2."
 * @param {string[]} traits — traits of the weapon used to intercept
 * @returns {number}
 */
export function getPointDefenceDm(traits = []) {
  return traits.includes('Point Defence') ? 4 : -2
}

export function computeAttackDMs({
  gunnerSkill,
  gunnerIntDm     = 0,
  weaponId,
  rangeBand,
  fireControlDm   = 0,
  carryEffect     = 0,
  captainAssistDm = 0,
  evasionDm       = 0,
  ewDm            = 0,
  otherDm         = 0,
}) {
  const weapon        = WEAPONS[weaponId]
  const weaponTraitDm = weapon ? getWeaponTraitAttackDm(weapon.traits) : 0
  const dms = {
    gunnerSkill,
    gunnerIntDm,
    rangeDm:        getRangeDM(weaponId, rangeBand),
    weaponTraitDm,
    fireControlDm,
    carryEffect,
    captainAssistDm,
    evasionDm,
    ewDm,
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
 * @param {{ damage?: string, traits?: string[] }} [overrides] — e.g. a drone's detonationMode
 * @param {number} [damageMultiplier] — e.g. 2 for a stationary/reaction-drive target // B3 p.56
 * @returns {{ rolls: number[], bonus: number, gross: number, armour: number, net: number }}
 */
export function rollDamage(weaponId, weaponCount = 1, armour = 0, overrides = null, damageMultiplier = 1) {
  const base = WEAPONS[weaponId]
  if (!base) return { rolls: [], bonus: 0, gross: 0, armour: 0, net: 0 }
  const weapon = overrides ? { ...base, ...overrides } : base

  const [n, sides, flatBonus] = parseDiceNotation(weapon.damage)
  const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * sides) + 1)
  const diceTotal = rolls.reduce((a, b) => a + b, 0)

  // Multi-weapon bonus: +damageBonus per additional weapon (not per die) // Trav2022 CRB p.167
  const multiBonus = weapon.damageBonus * Math.max(0, weaponCount - 1)

  // Per-die trait modifiers // 2300AD B3 p.59
  // Advanced: +1 per die; Obsolete: −1 per die (clamped so dice total never goes negative)
  const traits = weapon.traits ?? []
  let perDieMod = 0
  if (traits.includes('Advanced')) perDieMod += 1
  if (traits.includes('Obsolete')) perDieMod -= 1
  const traitBonus = n * perDieMod

  const bonus = flatBonus + multiBonus + traitBonus
  const gross = Math.max(0, diceTotal + bonus) * damageMultiplier

  const effectiveArmour = resolveArmour(traits, armour)
  const net = Math.max(0, gross - effectiveArmour)

  return { rolls, bonus, gross, armour: effectiveArmour, net }
}

// === CRITICAL HITS — 2300AD B3 p.58 ===

/**
 * Surface Fixture Damage check. // 2300AD B3 p.58
 * Any hit with Effect ≥ 3 triggers a roll on the Surface Fixture table,
 * even if the hit does not penetrate armour.
 * @param {number} attackEffect
 * @returns {boolean}
 */
export function isSurfaceFixtureDamage(attackEffect) {
  return attackEffect >= 3
}

/**
 * Internal Critical Hit check. // 2300AD B3 p.58
 * Effect ≥ 6 with net damage > 0 (penetrating hit), OR hull drops to 0.
 * @param {number} attackEffect
 * @param {number} netDamage — damage after armour reduction
 * @param {number} hullCurrent — ship hull points BEFORE this hit
 * @returns {boolean}
 */
export function isInternalCriticalHit(attackEffect, netDamage, hullCurrent) {
  return (attackEffect >= 6 && netDamage > 0) || netDamage >= hullCurrent
}

/** @deprecated Use isInternalCriticalHit instead. */
export function isCriticalHit(attackEffect, netDamage, hullCurrent) {
  return isInternalCriticalHit(attackEffect, netDamage, hullCurrent)
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

// === SIGNATURE — 2300AD B3 p.57 ===

/**
 * Reaction drive types and their Signature contribution while active.
 * "Rockets add +4 to Signature, while thrusters add +6. Nuclear thrusters add +8." // 2300AD B3 p.57
 * @type {Array<{ id: string, label: string, dm: number }>}
 */
export const REACTION_DRIVE_TYPES = [
  { id: 'rocket',   label: 'Rocket',           dm: 4 },
  { id: 'thruster', label: 'Thruster',         dm: 6 },
  { id: 'nuclear',  label: 'Nuclear Thruster', dm: 8 },
]

/**
 * Signature DM for a ship's reaction drive type, defaulting to rocket (+4) for
 * profiles that predate this field. // 2300AD B3 p.57
 * @param {string} [reactionDriveType]
 * @returns {number}
 */
export function getReactionDriveSignatureDm(reactionDriveType) {
  return REACTION_DRIVE_TYPES.find((t) => t.id === reactionDriveType)?.dm
    ?? REACTION_DRIVE_TYPES[0].dm
}

/**
 * Compute the effective Signature of a ship, applying all dynamic modifiers.
 * Returns base, delta, and effective value for UI breakdown display.
 *
 * Auto-computed modifiers:
 *   Damage > 50% Hull          → +1
 *   Power Plant critical hit   → +1 (per B3 p.58; severity ≥ 1 counts)
 *   Electronic Warfare active  → +2 (ship has ewTarget set)
 *
 * GM-toggle modifiers (flags on ship state):
 *   radiatorsRetracted   → −1
 *   heatSinkActive       → −4  (limited duration, GM resets manually)
 *   solarPanelsExtended  → +2
 *   spinHabitatRetracted → −1
 *   reactionDriveActive  → +4/+6/+8 depending on ship.reactionDriveType (rocket/thruster/nuclear)
 *   activeSensorsOn      → +1  (TTA, UTES)
 *   stealthActive        → −4  (stealth technology masking heat signature)
 *
 * @param {object} ship — battle-state ship object
 * @returns {{ base: number, delta: number, effective: number, mods: Array<[string, number]> }}
 */
export function computeEffectiveSignature(ship) {
  const base = ship.signature ?? 2
  const mods = []

  // Auto-computed
  const hp          = ship.hullPoints ?? ship.profile?.hullPoints ?? 1
  const currentHull = ship.currentHull ?? hp
  if (currentHull / hp < 0.5) mods.push(['Hull damage >50%', 1])

  if ((ship.criticalTracks?.powerPlant ?? 0) >= 1) mods.push(['Power Plant crit', 1])

  if (ship.ewTarget != null) mods.push(['EW active', 2])

  // Toggle flags
  if (ship.radiatorsRetracted)   mods.push(['Radiators retracted', -1])
  if (ship.heatSinkActive)       mods.push(['Heat sink active', -4])
  if (ship.solarPanelsExtended)  mods.push(['Solar panels extended', 2])
  if (ship.spinHabitatRetracted) mods.push(['Spin habitat retracted', -1])
  if (ship.reactionDriveActive)  mods.push(['Reaction drive active', getReactionDriveSignatureDm(ship.reactionDriveType)])
  if (ship.activeSensorsOn)      mods.push(['Active sensors on', 1])
  if (ship.stealthActive)        mods.push(['Stealth active', -4])

  const delta = mods.reduce((acc, [, v]) => acc + v, 0)
  return { base, delta, effective: base + delta, mods }
}

// === STATIONARY / REACTION-DRIVE TARGETS — 2300AD B3 p.56 ===

/**
 * Whether a target's Firing Solution is "trivial": it is stationary, or
 * manoeuvring under reaction drive rather than stutterwarp. Weapon systems
 * are optimised for stutterwarp-manoeuvring craft, so such targets are much
 * easier to hit. // 2300AD B3 p.56 ("Non-Stutterwarp and Stationary Targets")
 * @param {object} target — battle-state ship object
 * @returns {boolean}
 */
export function isEasyTarget(target) {
  return !!(target?.isStationary || target?.reactionDriveActive)
}

/**
 * Attack roll DM for an easy (stationary/reaction-drive) target: DM+2. // 2300AD B3 p.56
 * @param {object} target
 * @returns {number}
 */
export function getEasyTargetAttackDm(target) {
  return isEasyTarget(target) ? 2 : 0
}

/**
 * Damage multiplier for an easy (stationary/reaction-drive) target: ×2. // 2300AD B3 p.56
 * @param {object} target
 * @returns {number}
 */
export function getEasyTargetDamageMultiplier(target) {
  return isEasyTarget(target) ? 2 : 1
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

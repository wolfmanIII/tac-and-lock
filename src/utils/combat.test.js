/**
 * Tests for 2300AD space combat mechanics.
 * // 2300AD B3 p.52–62 (primary); Trav2022 CRB p.158–159 (crits)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseDiceNotation,
  getRangeDM,
  getTargetSizeDM,
  getEvasiveDM,
  getGunnerDexDM,
  computeAttackDMs,
  rollAttack,
  rollInitiative,
  rollDamage,
  isCriticalHit,
  getNextSeverity,
  rollSandcasterAbsorption,
} from './combat.js'

// === parseDiceNotation ===
// // 2300AD B3 p.60 (e.g. Grumbler: "2D+2", LL-88: "1D-1")

describe('parseDiceNotation', () => {
  const CASES = [
    ['2D',    [2, 6, 0]],
    ['1D',    [1, 6, 0]],
    ['4D',    [4, 6, 0]],
    ['2D+2',  [2, 6, 2]],
    ['1D-1',  [1, 6, -1]],
    ['2D6',   [2, 6, 0]],
    ['3D6+1', [3, 6, 1]],
  ]

  it.each(CASES)('"%s" → %j', (notation, expected) => {
    expect(parseDiceNotation(notation)).toEqual(expected)
  })

  it('invalid notation falls back to [1, 6, 0]', () => {
    expect(parseDiceNotation('bad')).toEqual([1, 6, 0])
    expect(parseDiceNotation('')).toEqual([1, 6, 0])
  })
})

// === getTargetSizeDM ===
// // Trav2022 CRB p.163

describe('getTargetSizeDM', () => {
  const CASES = [
    [0,      -2],
    [50,     -2],
    [99,     -2],
    [100,     0],
    [999,     0],
    [1000,    1],
    [9999,    1],
    [10000,   2],
    [99999,   2],
    [100000,  4],
    [999999,  4],
  ]

  it.each(CASES)('%i tons → DM %i', (tonnage, dm) => {
    expect(getTargetSizeDM(tonnage)).toBe(dm)
  })
})

// === getEvasiveDM ===
// // Trav2022 CRB p.164 — penalty = -tacSpeedSpent

describe('getEvasiveDM', () => {
  it('0 TAC Speed spent → 0 DM', () => {
    expect(Math.abs(getEvasiveDM(0))).toBe(0)
  })

  it('negative input clamped to 0', () => {
    expect(Math.abs(getEvasiveDM(-2))).toBe(0)
  })

  const CASES = [
    [1, -1],
    [2, -2],
    [5, -5],
    [10, -10],
  ]

  it.each(CASES)('%i TAC Speed → DM %i', (spent, dm) => {
    expect(getEvasiveDM(spent)).toBe(dm)
  })
})

// === getRangeDM ===
// // 2300AD B3 p.57 — most weapons effective only to Close

describe('getRangeDM', () => {
  it('ll98 at Adjacent → +2', () => {
    expect(getRangeDM('ll98', 'Adjacent')).toBe(2)
  })

  it('ll98 at Close → 0', () => {
    expect(getRangeDM('ll98', 'Close')).toBe(0)
  })

  it('ll98 at Short → -20 (beyond max range)', () => {
    expect(getRangeDM('ll98', 'Short')).toBe(-20)
  })

  it('grumbler at Short → -6 (unique extended range)', () => {
    // Grumbler can reach Short unlike other 2300AD lasers // 2300AD B3 p.57
    expect(getRangeDM('grumbler', 'Short')).toBe(-6)
  })

  it('grumbler at Medium → -20 (out of range)', () => {
    expect(getRangeDM('grumbler', 'Medium')).toBe(-20)
  })

  it('missile_rack has 0 DM at all bands (smart guidance)', () => {
    for (const band of ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'VeryLong', 'Distant']) {
      expect(getRangeDM('missile_rack', band)).toBe(0)
    }
  })

  it('unknown weapon falls back to default range DM', () => {
    // fallback: RANGE_BAND_DEFAULT_ATTACK_DM or -8
    expect(typeof getRangeDM('nonexistent', 'Close')).toBe('number')
  })
})

// === getGunnerDexDM ===
// wrapper around getCharDM — test via known breakpoints // Trav2022 CRB p.6

describe('getGunnerDexDM', () => {
  const CASES = [
    [0,  -2],
    [2,  -2],
    [3,  -1],
    [5,  -1],
    [6,   0],
    [8,   0],
    [9,   1],
    [11,  1],
    [12,  2],
    [14,  2],
    [15,  3],
  ]

  it.each(CASES)('DEX %i → DM %i', (dex, dm) => {
    expect(getGunnerDexDM(dex)).toBe(dm)
  })
})

// === computeAttackDMs ===

describe('computeAttackDMs', () => {
  it('returns { dms, total }', () => {
    const r = computeAttackDMs({ gunnerSkill: 2, weaponId: 'll98', rangeBand: 'Close' })
    expect(r).toHaveProperty('dms')
    expect(r).toHaveProperty('total')
  })

  it('total equals sum of all DM components', () => {
    const r = computeAttackDMs({
      gunnerSkill:   2,
      weaponId:      'll98',
      rangeBand:     'Close',
      fireControlDm: 1,
      sensorLockDm:  0,
      ewDm:          -1,
      evasiveDm:     -2,
      gunnerDexDm:   1,
      targetSizeDm:  0,
      otherDm:       0,
    })
    // rangeDm for ll98@Close = 0
    expect(r.total).toBe(2 + 0 + 1 + 0 + (-1) + (-2) + 1 + 0 + 0)
  })

  it('includes rangeDm from weapon definition', () => {
    const r = computeAttackDMs({ gunnerSkill: 0, weaponId: 'll98', rangeBand: 'Adjacent' })
    expect(r.dms.rangeDm).toBe(2) // ll98 at Adjacent = +2
  })

  it('all optional DMs default to 0', () => {
    const r = computeAttackDMs({ gunnerSkill: 3, weaponId: 'll98', rangeBand: 'Close' })
    expect(r.total).toBe(3 + 0) // gunnerSkill + rangeDm(Close=0)
  })
})

// === rollAttack (deterministic via Math.random mock) ===
// Math.floor(0.5 * 6) + 1 = 4 → each die = 4, 2d6 base = 8

describe('rollAttack', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('returns the expected shape', () => {
    const r = rollAttack(0)
    expect(r).toHaveProperty('dice')
    expect(r).toHaveProperty('base')
    expect(r).toHaveProperty('totalDm')
    expect(r).toHaveProperty('total')
    expect(r).toHaveProperty('success')
    expect(r).toHaveProperty('effect')
  })

  it('target is 10 (Difficult — Gunner check // 2300AD B3 p.56)', () => {
    // base = 8, totalDm = 0 → total 8 < 10 → miss
    const r = rollAttack(0)
    expect(r.success).toBe(false)
    expect(r.effect).toBe(-2)
  })

  it('hit when totalDm pushes total to 10+', () => {
    // base = 8, totalDm = 2 → total = 10 → hit, effect = 0
    const r = rollAttack(2)
    expect(r.success).toBe(true)
    expect(r.total).toBe(10)
    expect(r.effect).toBe(0)
  })

  it('critical when effect >= 6', () => {
    // base = 8, totalDm = 8 → total = 16, effect = 6
    const r = rollAttack(8)
    expect(isCriticalHit(r.effect, 1, 100)).toBe(true)
  })

  it('miss when DMs push total below 10', () => {
    // base = 8, totalDm = -5 → total = 3
    const r = rollAttack(-5)
    expect(r.success).toBe(false)
    expect(r.total).toBe(3)
  })

  it('effect = total − 10', () => {
    const r = rollAttack(4)
    expect(r.effect).toBe(r.total - 10)
  })
})

// === rollInitiative — 2300AD B3 p.54 ===
// Opposed Tactics(naval) check (INT): 2D6 + Tactics(naval) + INT DM

describe('rollInitiative', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('total = 2D6 + tacticsNaval + INT DM', () => {
    // base=8 (random 0.5 → each d6=4), tactics=2, INT=7→DM0 → total=10
    const r = rollInitiative(2, 7)
    expect(r.total).toBe(10)
  })

  it('includes tacticsNaval, intDm in result', () => {
    const r = rollInitiative(3, 7)
    expect(r.tacticsNaval).toBe(3)
    expect(r.intDm).toBe(0) // INT 7 → DM+0
    expect(r.total).toBe(8 + 3 + 0)
  })

  it('captainInt defaults to 7 (intDm 0)', () => {
    const r = rollInitiative(1)
    expect(r.intDm).toBe(0)
    expect(r.total).toBe(8 + 1 + 0)
  })

  it('high INT gives positive intDm', () => {
    // INT 11 → DM+1
    const r = rollInitiative(1, 11)
    expect(r.intDm).toBe(1)
    expect(r.total).toBe(8 + 1 + 1)
  })

  it('no tactics skill (0) still rolls correctly', () => {
    const r = rollInitiative(0, 7)
    expect(r.total).toBe(8)
  })

  it('diceOverride bypasses random roll', () => {
    const r = rollInitiative(2, 7, { dice: [5, 6] })
    expect(r.dice).toEqual([5, 6])
    expect(r.base).toBe(11)
    expect(r.total).toBe(11 + 2 + 0)
  })
})

// === isCriticalHit ===
// // Trav2022 CRB p.162 (adapted); simplified rule in combat.js

describe('isCriticalHit', () => {
  it('effect >= 6 is a critical regardless of damage', () => {
    expect(isCriticalHit(6,  0, 100)).toBe(true)
    expect(isCriticalHit(7,  0, 100)).toBe(true)
    expect(isCriticalHit(10, 0, 100)).toBe(true)
  })

  it('effect < 6 is not a critical unless damage >= hullCurrent', () => {
    expect(isCriticalHit(5, 5, 20)).toBe(false)
    expect(isCriticalHit(0, 0, 20)).toBe(false)
  })

  it('net damage >= hullCurrent triggers a critical at any effect', () => {
    expect(isCriticalHit(2, 20, 20)).toBe(true)
    expect(isCriticalHit(-1, 5, 5)).toBe(true)
    expect(isCriticalHit(0, 100, 10)).toBe(true)
  })

  it('damage < hullCurrent and effect < 6 = not critical', () => {
    expect(isCriticalHit(5, 19, 20)).toBe(false)
    expect(isCriticalHit(4, 1, 15)).toBe(false)
  })
})

// === getNextSeverity ===

describe('getNextSeverity', () => {
  it('virgin system (no track) starts at severity 1', () => {
    expect(getNextSeverity({}, 'sensors')).toBe(1)
    expect(getNextSeverity({ hull: 3 }, 'sensors')).toBe(1) // sensors unset
  })

  it('increments current severity by 1', () => {
    expect(getNextSeverity({ sensors: 2 }, 'sensors')).toBe(3)
    expect(getNextSeverity({ weapon: 5 }, 'weapon')).toBe(6)
  })

  it('caps at 6', () => {
    expect(getNextSeverity({ sensors: 6 }, 'sensors')).toBe(6)
    expect(getNextSeverity({ sensors: 9 }, 'sensors')).toBe(6) // corrupted state
  })
})

// === rollDamage (deterministic via Math.random mock) ===

describe('rollDamage', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  // Math.floor(0.5 * 6) + 1 = 4

  it('returns the expected shape', () => {
    const r = rollDamage('ll98', 1, 0)
    expect(r).toHaveProperty('rolls')
    expect(r).toHaveProperty('bonus')
    expect(r).toHaveProperty('gross')
    expect(r).toHaveProperty('armour')
    expect(r).toHaveProperty('net')
  })

  it('ll98 1 weapon, no armour → gross = 2×4 = 8, net = 8', () => {
    // ll98: damage='2D', flatBonus=0, no multiBonus at count=1
    const r = rollDamage('ll98', 1, 0)
    expect(r.gross).toBe(8)
    expect(r.net).toBe(8)
  })

  it('armour reduces net, clamped to 0', () => {
    const r = rollDamage('ll98', 1, 10)
    expect(r.net).toBe(0)
  })

  it('armour partially reduces net', () => {
    const r = rollDamage('ll98', 1, 3)
    expect(r.net).toBe(5) // 8 - 3
  })

  it('grumbler flat bonus: 2D+2 → gross = 2×4 + 2 = 10', () => {
    const r = rollDamage('grumbler', 1, 0)
    expect(r.gross).toBe(10)
    expect(r.bonus).toBe(2)
  })

  it('particle_barbette ignores armour (Radiation trait → AP∞)', () => {
    const r = rollDamage('particle_barbette', 1, 20)
    // effective armour → 0, net = gross
    expect(r.armour).toBe(0)
    expect(r.net).toBe(r.gross)
  })

  it('unknown weapon returns zeroes', () => {
    const r = rollDamage('no_such_weapon')
    expect(r).toEqual({ rolls: [], bonus: 0, gross: 0, armour: 0, net: 0 })
  })

  it('multi-weapon bonus applied per additional weapon', () => {
    // ll98: damageBonus=1; 3 weapons → multiBonus = 1 × (3-1) = 2; gross = 8 + 2 = 10
    const r = rollDamage('ll98', 3, 0)
    expect(r.gross).toBe(10)
  })
})

// === rollSandcasterAbsorption ===

describe('rollSandcasterAbsorption', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.9))
  afterEach(() => vi.restoreAllMocks())

  // Math.ceil(0.9 * 3) = 3 → each sandcaster gives 3

  it('returns rolls array and armourBonus', () => {
    const r = rollSandcasterAbsorption(2)
    expect(r).toHaveProperty('rolls')
    expect(r).toHaveProperty('armourBonus')
  })

  it('roll count equals sandcasterCount', () => {
    expect(rollSandcasterAbsorption(3).rolls).toHaveLength(3)
    expect(rollSandcasterAbsorption(1).rolls).toHaveLength(1)
  })

  it('armourBonus = sum of all rolls', () => {
    const r = rollSandcasterAbsorption(2)
    expect(r.armourBonus).toBe(r.rolls.reduce((a, b) => a + b, 0))
  })

  it('0 sandcasters → armourBonus = 0', () => {
    const r = rollSandcasterAbsorption(0)
    expect(r.armourBonus).toBe(0)
    expect(r.rolls).toHaveLength(0)
  })

  it('each roll is in [1, 3]', () => {
    vi.restoreAllMocks() // use real random
    for (let i = 0; i < 50; i++) {
      const r = rollSandcasterAbsorption(5)
      for (const roll of r.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(3)
      }
    }
  })
})

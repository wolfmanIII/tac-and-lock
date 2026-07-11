/**
 * Tests for 2300AD space combat mechanics.
 * // 2300AD B3 p.52–62 (primary); Trav2022 CRB p.158–159 (internal crits)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseDiceNotation,
  getRangeDM,
  getCharacteristicDM,
  computeAttackDMs,
  rollAttack,
  rollInitiative,
  rollDamage,
  getAutoScore,
  rollFullAuto,
  isSurfaceFixtureDamage,
  isInternalCriticalHit,
  isCriticalHit,
  getNextSeverity,
  getWeaponTraitAttackDm,
  computeEffectiveSignature,
  getReactionDriveSignatureDm,
  isEasyTarget,
  getEasyTargetAttackDm,
  getEasyTargetDamageMultiplier,
  getAtmosphericTargetDm,
  getOrtilleryDm,
  ATMOSPHERIC_CONDITIONS,
  getFireControlDm,
  getScreenDm,
  SCREEN_RATINGS,
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

// === getCharacteristicDM ===
// Traveller standard: 0-2 → −2, 3-5 → −1, 6-8 → 0, 9-11 → +1, 12-14 → +2, 15+ → +3

describe('getCharacteristicDM', () => {
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

  it.each(CASES)('stat %i → DM %i', (stat, dm) => {
    expect(getCharacteristicDM(stat)).toBe(dm)
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
    expect(typeof getRangeDM('nonexistent', 'Close')).toBe('number')
  })
})

// === computeAttackDMs — Firing Solution Step 3 // 2300AD B3 p.56 ===

describe('computeAttackDMs', () => {
  it('returns { dms, total }', () => {
    const r = computeAttackDMs({ gunnerSkill: 2, weaponId: 'll98', rangeBand: 'Close' })
    expect(r).toHaveProperty('dms')
    expect(r).toHaveProperty('total')
  })

  it('total equals sum of all DM components', () => {
    const r = computeAttackDMs({
      gunnerSkill:     2,
      gunnerIntDm:     1,
      weaponId:        'll98',
      rangeBand:       'Close',
      fireControlDm:   2,   // Fire Control/2
      carryEffect:     1,   // carried from Pilot check
      captainAssistDm: 0,
      evasionDm:       -2,
      ewDm:            -1,
      otherDm:         0,
    })
    // rangeDm@Close = 0; ll98 has Accurate → weaponTraitDm = +1 // 2300AD B3 p.59
    expect(r.total).toBe(2 + 1 + 0 + 1 + 2 + 1 + 0 + (-2) + (-1) + 0)
  })

  it('includes rangeDm from weapon definition', () => {
    const r = computeAttackDMs({ gunnerSkill: 0, weaponId: 'll98', rangeBand: 'Adjacent' })
    expect(r.dms.rangeDm).toBe(2) // ll98 at Adjacent = +2
  })

  it('all optional DMs default to 0', () => {
    const r = computeAttackDMs({ gunnerSkill: 3, weaponId: 'll98', rangeBand: 'Close' })
    // ll98 has Accurate (+1 weaponTraitDm) // 2300AD B3 p.59, p.60
    expect(r.total).toBe(3 + 0 + 1) // gunnerSkill + rangeDm(Close=0) + Accurate
    expect(r.dms.weaponTraitDm).toBe(1)
  })

  it('carryEffect carries positive Pilot check Effect to Gunner', () => {
    const r = computeAttackDMs({ gunnerSkill: 1, weaponId: 'll98', rangeBand: 'Close', carryEffect: 3 })
    // ll98 has Accurate (+1 weaponTraitDm) // 2300AD B3 p.59, p.60
    expect(r.total).toBe(1 + 0 + 3 + 1) // gunnerSkill + rangeDm + carryEffect + Accurate
    expect(r.dms.carryEffect).toBe(3)
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

  it('effect >= 6 with damage is an internal crit // 2300AD B3 p.58', () => {
    // base = 8, totalDm = 8 → total = 16, effect = 6
    const r = rollAttack(8)
    expect(isInternalCriticalHit(r.effect, 5, 100)).toBe(true)
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

// === isSurfaceFixtureDamage — 2300AD B3 p.58 ===
// Any hit with Effect >= 3 triggers a Surface Fixture roll, even non-penetrating

describe('isSurfaceFixtureDamage', () => {
  it('effect >= 3 → surface fixture triggered', () => {
    expect(isSurfaceFixtureDamage(3)).toBe(true)
    expect(isSurfaceFixtureDamage(4)).toBe(true)
    expect(isSurfaceFixtureDamage(10)).toBe(true)
  })

  it('effect < 3 → no surface fixture', () => {
    expect(isSurfaceFixtureDamage(2)).toBe(false)
    expect(isSurfaceFixtureDamage(0)).toBe(false)
    expect(isSurfaceFixtureDamage(-1)).toBe(false)
    expect(isSurfaceFixtureDamage(-5)).toBe(false)
  })
})

// === isInternalCriticalHit — 2300AD B3 p.58 ===
// Effect >= 6 AND net damage > 0, OR hull drops to 0

describe('isInternalCriticalHit', () => {
  it('effect >= 6 with net damage > 0 → internal crit', () => {
    expect(isInternalCriticalHit(6,  1, 100)).toBe(true)
    expect(isInternalCriticalHit(7,  5, 100)).toBe(true)
    expect(isInternalCriticalHit(10, 1, 100)).toBe(true)
  })

  it('effect >= 6 but zero net damage → NOT internal crit (no penetration)', () => {
    expect(isInternalCriticalHit(6,  0, 100)).toBe(false)
    expect(isInternalCriticalHit(10, 0, 100)).toBe(false)
  })

  it('net damage >= hullCurrent → internal crit regardless of effect', () => {
    expect(isInternalCriticalHit(2, 20, 20)).toBe(true)
    expect(isInternalCriticalHit(-1, 5, 5)).toBe(true)
    expect(isInternalCriticalHit(0, 100, 10)).toBe(true)
  })

  it('effect < 6 and damage < hullCurrent → not a crit', () => {
    expect(isInternalCriticalHit(5, 19, 20)).toBe(false)
    expect(isInternalCriticalHit(4, 1, 15)).toBe(false)
    expect(isInternalCriticalHit(0, 0, 20)).toBe(false)
  })

  // critThreshold — Improve Critical (Sensor Operator) lowers the threshold // 2300AD B3 p.54
  it('custom critThreshold of 5 makes Effect 5 a crit (normally requires 6)', () => {
    expect(isInternalCriticalHit(5, 1, 100, 5)).toBe(true)
    expect(isInternalCriticalHit(4, 1, 100, 5)).toBe(false)
  })

  it('custom critThreshold of 4 (Improve Critical check itself scored Effect 6+)', () => {
    expect(isInternalCriticalHit(4, 1, 100, 4)).toBe(true)
    expect(isInternalCriticalHit(3, 1, 100, 4)).toBe(false)
  })

  it('defaults to threshold 6 when critThreshold is omitted', () => {
    expect(isInternalCriticalHit(6, 1, 100)).toBe(true)
    expect(isInternalCriticalHit(5, 1, 100)).toBe(false)
  })
})

// === isCriticalHit (deprecated alias for isInternalCriticalHit) ===

describe('isCriticalHit (deprecated alias)', () => {
  it('delegates to isInternalCriticalHit', () => {
    expect(isCriticalHit(6, 1, 100)).toBe(isInternalCriticalHit(6, 1, 100))
    expect(isCriticalHit(2, 20, 20)).toBe(isInternalCriticalHit(2, 20, 20))
    expect(isCriticalHit(5, 5, 20)).toBe(isInternalCriticalHit(5, 5, 20))
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

  it('grumbler flat bonus + Advanced: 2D+2 Advanced → gross = 2×4 + 2(flat) + 2(Advanced) = 12', () => {
    // Advanced: +1 per die; 2 dice → +2 bonus on top of the +2 flat // 2300AD B3 p.59
    const r = rollDamage('grumbler', 1, 0)
    expect(r.gross).toBe(12)
    expect(r.bonus).toBe(4) // flatBonus(2) + traitBonus(2)
  })

  it('particle_barbette ignores armour (Radiation trait → AP∞)', () => {
    const r = rollDamage('particle_barbette', 1, 20)
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

  it('damageMultiplier doubles gross before armour // stationary/reaction-drive target B3 p.56', () => {
    // ll98: gross would be 8 at ×1 → 16 at ×2, armour 3 → net 13
    const r = rollDamage('ll98', 1, 3, null, 2)
    expect(r.gross).toBe(16)
    expect(r.net).toBe(13)
  })

  it('damageMultiplier defaults to 1 (no change) when omitted', () => {
    const r = rollDamage('ll98', 1, 0)
    expect(r.gross).toBe(8)
  })
})

// === getWeaponTraitAttackDm — 2300AD B3 p.59 ===
// Accurate: DM+1; Slow: DM−2; all other traits: 0

describe('getWeaponTraitAttackDm', () => {
  it('no traits → 0', () => {
    expect(getWeaponTraitAttackDm([])).toBe(0)
    expect(getWeaponTraitAttackDm()).toBe(0)
  })

  it('Accurate → +1', () => {
    expect(getWeaponTraitAttackDm(['Accurate'])).toBe(1)
  })

  it('Slow → −2', () => {
    expect(getWeaponTraitAttackDm(['Slow'])).toBe(-2)
  })

  it('Accurate + Slow → −1 (both apply)', () => {
    expect(getWeaponTraitAttackDm(['Accurate', 'Slow'])).toBe(-1)
  })

  it('unrelated traits do not affect attack DM', () => {
    expect(getWeaponTraitAttackDm(['AP4', 'EM', 'Inefficient', 'Point Defence'])).toBe(0)
  })

  it('ll98 has Accurate → DM+1 on attack', () => {
    // Darlan LL-98: traits = ['Accurate'] // 2300AD B3 p.60
    expect(getWeaponTraitAttackDm(['Accurate'])).toBe(1)
  })

  it('Allen BMZ-50 has Slow → DM−2 on attack', () => {
    // Allen BMZ-50: traits = ['AP4', 'EM', 'Inefficient', 'Slow'] // 2300AD B3 p.60
    expect(getWeaponTraitAttackDm(['AP4', 'EM', 'Inefficient', 'Slow'])).toBe(-2)
  })
})

// === rollDamage — Advanced/Obsolete per-die modifiers // 2300AD B3 p.59 ===

describe('rollDamage — Advanced/Obsolete traits', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  // Math.floor(0.5 * 6) + 1 = 4 per die

  it('Grumbler (Advanced, 2D+2): gross = 2×4 + 2(flat) + 2(Advanced 2 dice×+1) = 12', () => {
    // grumbler: damage='2D+2', traits=['Advanced','Inefficient']
    // dice: [4,4]=8; flatBonus=2; traitBonus=2×1=2; gross=12
    const r = rollDamage('grumbler', 1, 0)
    expect(r.gross).toBe(12)
    expect(r.bonus).toBe(4)   // flatBonus(2) + traitBonus(2)
  })

  it('Darlan LL-88 (Obsolete, 1D−1): gross = 4 + (−1 flat) + (1×−1 Obsolete) = 2', () => {
    // ll88: damage='1D-1', traits=['Obsolete','Accurate']
    // dice: [4]=4; flatBonus=−1; traitBonus=1×(−1)=−1; gross=max(0,2)=2
    const r = rollDamage('ll88', 1, 0)
    expect(r.gross).toBe(2)
    expect(r.bonus).toBe(-2)  // flatBonus(−1) + traitBonus(−1)
  })

  it('gross is clamped to 0 if all bonuses drive it negative', () => {
    // ll88 at die=1: 1 + (−1) + (−1) = −1 → clamped to 0
    vi.spyOn(Math, 'random').mockReturnValue(0) // Math.floor(0*6)+1 = 1
    const r = rollDamage('ll88', 1, 0)
    expect(r.gross).toBe(0)
    expect(r.net).toBe(0)
  })

  it('regular weapons without Advanced/Obsolete are unchanged', () => {
    // ll98 (Accurate only — no damage-affecting trait): damage='2D', dice=[4,4]=8
    const r = rollDamage('ll98', 1, 0)
    expect(r.gross).toBe(8)
    expect(r.bonus).toBe(0)
  })
})

// === getAutoScore — Auto X fire-mode trait // 2300AD B3 p.59, Trav2022 CRB p.75 ===

describe('getAutoScore', () => {
  it('parses the numeric rating out of an "Auto X" trait string', () => {
    expect(getAutoScore(['Auto 4'])).toBe(4)
    expect(getAutoScore(['AP12', 'Auto 3'])).toBe(3)
  })

  it('"Rapid Fire" (Quinn PDC) has no numeric rating → 0', () => {
    expect(getAutoScore(['Point Defence', 'Rapid Fire'])).toBe(0)
  })

  it('no traits / missing Auto trait → 0', () => {
    expect(getAutoScore([])).toBe(0)
    expect(getAutoScore()).toBe(0)
    expect(getAutoScore(['Accurate', 'Slow'])).toBe(0)
  })
})

// === rollDamage — Auto X Burst fire mode (flat +score to damage) ===

describe('rollDamage — Auto X Burst mode', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  // Math.floor(0.5 * 6) + 1 = 4 per die

  it('tri_beamer (5D, Auto 3) with Burst bonus: gross = 5×4 + 3 = 23', () => {
    const r = rollDamage('tri_beamer', 1, 0, null, 1, 3)
    expect(r.gross).toBe(23)
    expect(r.bonus).toBe(3)
    expect(r.net).toBe(23)
  })

  it('autoBurstBonus defaults to 0 — existing 5-arg calls unaffected', () => {
    const r = rollDamage('tri_beamer', 1, 0)
    expect(r.gross).toBe(20)
    expect(r.bonus).toBe(0)
  })

  it('Burst bonus stacks with AP X armour reduction', () => {
    // tri_beamer: AP12 → effective armour = max(0, 15-12) = 3; gross = 23; net = 20
    const r = rollDamage('tri_beamer', 1, 15, null, 1, 3)
    expect(r.armour).toBe(3)
    expect(r.net).toBe(20)
  })
})

// === rollFullAuto — Auto X Full Auto fire mode (N separate volleys) // Trav2022 CRB p.75 ===

describe('rollFullAuto', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('tri_beamer (5D, Auto 3) fires 3 volleys of 5 dice each', () => {
    const r = rollFullAuto('tri_beamer', 1, 0, null, 1, 3)
    expect(r.volleys).toBe(3)
    expect(r.rolls).toHaveLength(15)
    expect(r.gross).toBe(60)  // 3 × 20
    expect(r.net).toBe(60)
  })

  it('armour is applied per volley, not once on the combined total', () => {
    // tri_beamer: AP12 → effective armour = max(0, 15-12) = 3 per volley
    // per-volley: gross 20, net 17; 3 volleys → net 51, not 60-3=57
    const r = rollFullAuto('tri_beamer', 1, 15, null, 1, 3)
    expect(r.armour).toBe(3)
    expect(r.net).toBe(51)
  })

  it('n defaults to a single volley when omitted or below 1', () => {
    const r = rollFullAuto('tri_beamer', 1, 0, null, 1, 0)
    expect(r.volleys).toBe(1)
    expect(r.gross).toBe(20)
  })
})

// === getReactionDriveSignatureDm — 2300AD B3 p.57 ===

describe('getReactionDriveSignatureDm', () => {
  it('rocket → 4', () => {
    expect(getReactionDriveSignatureDm('rocket')).toBe(4)
  })

  it('thruster → 6', () => {
    expect(getReactionDriveSignatureDm('thruster')).toBe(6)
  })

  it('nuclear → 8', () => {
    expect(getReactionDriveSignatureDm('nuclear')).toBe(8)
  })

  it('unknown/missing type → defaults to rocket (4)', () => {
    expect(getReactionDriveSignatureDm(undefined)).toBe(4)
    expect(getReactionDriveSignatureDm('warp-sail')).toBe(4)
  })
})

// === computeEffectiveSignature — 2300AD B3 p.57 ===

describe('computeEffectiveSignature', () => {
  const base = (overrides = {}) => ({
    signature:    2,
    hullPoints:   20,
    currentHull:  20,
    criticalTracks: {},
    ewTarget:     null,
    radiatorsRetracted:   false,
    heatSinkActive:       false,
    solarPanelsExtended:  false,
    spinHabitatRetracted: false,
    reactionDriveActive:  false,
    activeSensorsOn:      false,
    stealthActive:        false,
    ...overrides,
  })

  it('no modifiers → effective equals base', () => {
    const r = computeEffectiveSignature(base())
    expect(r.effective).toBe(2)
    expect(r.delta).toBe(0)
    expect(r.mods).toHaveLength(0)
  })

  it('hull damage >50% → +1', () => {
    const r = computeEffectiveSignature(base({ currentHull: 9 })) // 9/20 = 45%
    expect(r.delta).toBe(1)
    expect(r.mods.find(([l]) => l === 'Hull damage >50%')).toBeTruthy()
  })

  it('hull exactly 50% → no modifier', () => {
    const r = computeEffectiveSignature(base({ currentHull: 10 })) // 10/20 = 50%, not <50%
    expect(r.delta).toBe(0)
  })

  it('power plant crit severity ≥ 1 → +1', () => {
    const r = computeEffectiveSignature(base({ criticalTracks: { powerPlant: 1 } }))
    expect(r.delta).toBe(1)
    expect(r.mods.find(([l]) => l === 'Power Plant crit')).toBeTruthy()
  })

  it('power plant crit severity 0 → no modifier', () => {
    const r = computeEffectiveSignature(base({ criticalTracks: { powerPlant: 0 } }))
    expect(r.delta).toBe(0)
  })

  it('ewTarget set → +2', () => {
    const r = computeEffectiveSignature(base({ ewTarget: 'some-ship-id' }))
    expect(r.delta).toBe(2)
    expect(r.mods.find(([l]) => l === 'EW active')).toBeTruthy()
  })

  it('radiatorsRetracted → −1', () => {
    const r = computeEffectiveSignature(base({ radiatorsRetracted: true }))
    expect(r.delta).toBe(-1)
  })

  it('heatSinkActive → −4', () => {
    const r = computeEffectiveSignature(base({ heatSinkActive: true }))
    expect(r.delta).toBe(-4)
  })

  it('solarPanelsExtended → +2', () => {
    const r = computeEffectiveSignature(base({ solarPanelsExtended: true }))
    expect(r.delta).toBe(2)
  })

  it('spinHabitatRetracted → −1', () => {
    const r = computeEffectiveSignature(base({ spinHabitatRetracted: true }))
    expect(r.delta).toBe(-1)
  })

  it('reactionDriveActive with no reactionDriveType set → +4 (defaults to rocket)', () => {
    const r = computeEffectiveSignature(base({ reactionDriveActive: true }))
    expect(r.delta).toBe(4)
  })

  it('reactionDriveActive with reactionDriveType "rocket" → +4', () => {
    const r = computeEffectiveSignature(base({ reactionDriveActive: true, reactionDriveType: 'rocket' }))
    expect(r.delta).toBe(4)
  })

  it('reactionDriveActive with reactionDriveType "thruster" → +6', () => {
    const r = computeEffectiveSignature(base({ reactionDriveActive: true, reactionDriveType: 'thruster' }))
    expect(r.delta).toBe(6)
  })

  it('reactionDriveActive with reactionDriveType "nuclear" → +8', () => {
    const r = computeEffectiveSignature(base({ reactionDriveActive: true, reactionDriveType: 'nuclear' }))
    expect(r.delta).toBe(8)
  })

  it('activeSensorsOn → +1', () => {
    const r = computeEffectiveSignature(base({ activeSensorsOn: true }))
    expect(r.delta).toBe(1)
  })

  it('stealthActive → −4', () => {
    const r = computeEffectiveSignature(base({ stealthActive: true }))
    expect(r.delta).toBe(-4)
    expect(r.mods.find(([l]) => l === 'Stealth active')).toBeTruthy()
  })

  it('multiple modifiers stack correctly', () => {
    // EW +2, radiators −1, heat sink −4 → net −3; effective = 2 + (−3) = −1
    const r = computeEffectiveSignature(base({
      ewTarget:          'target',
      radiatorsRetracted: true,
      heatSinkActive:     true,
    }))
    expect(r.delta).toBe(-3)
    expect(r.effective).toBe(-1)
    expect(r.mods).toHaveLength(3)
  })

  it('falls back to base=2 when signature is missing', () => {
    const r = computeEffectiveSignature({ currentHull: 10, hullPoints: 10 })
    expect(r.base).toBe(2)
    expect(r.effective).toBe(2)
  })
})

// === Stationary / reaction-drive targets — 2300AD B3 p.56 ===

describe('isEasyTarget / getEasyTargetAttackDm / getEasyTargetDamageMultiplier', () => {
  it('a normal manoeuvring target is not easy', () => {
    const target = { isStationary: false, reactionDriveActive: false }
    expect(isEasyTarget(target)).toBe(false)
    expect(getEasyTargetAttackDm(target)).toBe(0)
    expect(getEasyTargetDamageMultiplier(target)).toBe(1)
  })

  it('a stationary target is easy: DM+2, ×2 damage', () => {
    const target = { isStationary: true, reactionDriveActive: false }
    expect(isEasyTarget(target)).toBe(true)
    expect(getEasyTargetAttackDm(target)).toBe(2)
    expect(getEasyTargetDamageMultiplier(target)).toBe(2)
  })

  it('a reaction-drive-active target is easy: DM+2, ×2 damage', () => {
    const target = { isStationary: false, reactionDriveActive: true }
    expect(isEasyTarget(target)).toBe(true)
    expect(getEasyTargetAttackDm(target)).toBe(2)
    expect(getEasyTargetDamageMultiplier(target)).toBe(2)
  })

  it('both flags set does not stack — still DM+2, ×2', () => {
    const target = { isStationary: true, reactionDriveActive: true }
    expect(getEasyTargetAttackDm(target)).toBe(2)
    expect(getEasyTargetDamageMultiplier(target)).toBe(2)
  })

  it('handles a missing/undefined target gracefully', () => {
    expect(isEasyTarget(undefined)).toBe(false)
    expect(getEasyTargetAttackDm(null)).toBe(0)
  })
})

// === Planetary surface / atmospheric range modifiers — 2300AD B3 p.56, p.59 ===

describe('getAtmosphericTargetDm', () => {
  it('defaults to 0 DM when atmosphericCondition is missing or "none"', () => {
    expect(getAtmosphericTargetDm({})).toBe(0)
    expect(getAtmosphericTargetDm({ atmosphericCondition: 'none' })).toBe(0)
  })

  it('Planetary Surface (with atmosphere) → DM−6', () => {
    expect(getAtmosphericTargetDm({ atmosphericCondition: 'surface_atmo' })).toBe(-6)
  })

  it('Planetary Surface (no atmosphere) → DM−4', () => {
    expect(getAtmosphericTargetDm({ atmosphericCondition: 'surface_vacuum' })).toBe(-4)
  })

  it('Flight in Atmosphere → DM−2', () => {
    expect(getAtmosphericTargetDm({ atmosphericCondition: 'atmo_flight' })).toBe(-2)
  })

  it('handles a missing/undefined target gracefully', () => {
    expect(getAtmosphericTargetDm(undefined)).toBe(0)
  })

  it('ATMOSPHERIC_CONDITIONS has exactly the 4 documented entries', () => {
    expect(ATMOSPHERIC_CONDITIONS.map((c) => c.id).sort()).toEqual(
      ['atmo_flight', 'none', 'surface_atmo', 'surface_vacuum'].sort(),
    )
  })
})

describe('getOrtilleryDm', () => {
  it('no Ortillery trait → 0 regardless of target condition', () => {
    expect(getOrtilleryDm([], { atmosphericCondition: 'surface_atmo' })).toBe(0)
  })

  it('Ortillery trait vs. surface target (with atmosphere) → DM+4', () => {
    expect(getOrtilleryDm(['Ortillery'], { atmosphericCondition: 'surface_atmo' })).toBe(4)
  })

  it('Ortillery trait vs. surface target (no atmosphere) → DM+4', () => {
    expect(getOrtilleryDm(['Ortillery'], { atmosphericCondition: 'surface_vacuum' })).toBe(4)
  })

  it('Ortillery trait vs. a target in atmospheric flight (not on the surface) → 0', () => {
    expect(getOrtilleryDm(['Ortillery'], { atmosphericCondition: 'atmo_flight' })).toBe(0)
  })

  it('Ortillery trait vs. a target in space → 0', () => {
    expect(getOrtilleryDm(['Ortillery'], { atmosphericCondition: 'none' })).toBe(0)
  })
})

// === Fire Control — 2300AD B3 p.44, p.62 ===

describe('getFireControlDm', () => {
  it('no fire control software at all → DM-8 (including point defence) // B3 p.62', () => {
    expect(getFireControlDm([])).toBe(-8)
    expect(getFireControlDm(undefined)).toBe(-8)
  })

  it('fire_control_1 → +1', () => {
    expect(getFireControlDm(['fire_control_1'])).toBe(1)
  })

  it('fire_control_2 → +2', () => {
    expect(getFireControlDm(['fire_control_2'])).toBe(2)
  })

  it('fire_control_3 → +3', () => {
    expect(getFireControlDm(['fire_control_3'])).toBe(3)
  })

  it('other unrelated software present, no fire control → still DM-8', () => {
    expect(getFireControlDm(['auto_repair_1', 'stutterwarp_control'])).toBe(-8)
  })
})

// === Defensive Screens — 2300AD B3 p.55, p.62 ===

describe('getScreenDm', () => {
  it('laser weapon vs a screened target → −screenCurrentRating', () => {
    expect(getScreenDm({ screenCurrentRating: 2 }, { isLaser: true })).toBe(-2)
  })

  it('laser weapon vs an unscreened target (Rating 0) → 0', () => {
    expect(getScreenDm({ screenCurrentRating: 0 }, { isLaser: true })).toBe(0)
  })

  it('non-laser weapon (particle beam, kinetic, missile) is unaffected by screens', () => {
    expect(getScreenDm({ screenCurrentRating: 3 }, { isLaser: false })).toBe(0)
    expect(getScreenDm({ screenCurrentRating: 3 }, {})).toBe(0)
  })

  it('handles missing target/weapon gracefully', () => {
    expect(getScreenDm(undefined, { isLaser: true })).toBe(0)
    expect(getScreenDm({ screenCurrentRating: 2 }, undefined)).toBe(0)
  })

  it('SCREEN_RATINGS has the 4 documented entries (0 = None, 1-3 installed)', () => {
    expect(SCREEN_RATINGS.map((r) => r.rating)).toEqual([0, 1, 2, 3])
  })
})

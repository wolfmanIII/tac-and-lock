/**
 * Data integrity tests for weapons table.
 * // 2300AD B3 p.60–61 (2300AD weapons), Trav2022 CRB p.168 (generic weapons)
 */

import { describe, it, expect } from 'vitest'
import { WEAPONS, WEAPON_IDS } from './weapons.js'

const RANGE_BANDS = ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'VeryLong', 'Distant']
const REQUIRED_FIELDS = ['id', 'name', 'mount', 'TL', 'damage', 'damageBonus', 'optimalRange', 'rangeDm', 'traits', 'notes']

// === Structural integrity ===

describe('WEAPON_IDS', () => {
  it('contains entries for every key in WEAPONS', () => {
    const weaponKeys = Object.keys(WEAPONS).sort()
    expect([...WEAPON_IDS].sort()).toEqual(weaponKeys)
  })

  it('has no duplicate IDs', () => {
    expect(WEAPON_IDS.length).toBe(new Set(WEAPON_IDS).size)
  })
})

describe('WEAPONS — every weapon', () => {
  for (const id of WEAPON_IDS) {
    const w = WEAPONS[id]

    it(`${id}: has all required fields`, () => {
      for (const field of REQUIRED_FIELDS) {
        expect(w).toHaveProperty(field)
      }
    })

    it(`${id}: id matches key`, () => {
      expect(w.id).toBe(id)
    })

    it(`${id}: mount is valid`, () => {
      expect(['turret', 'barbette', 'bay', 'drone']).toContain(w.mount)
    })

    it(`${id}: rangeDm covers all 7 bands`, () => {
      for (const band of RANGE_BANDS) {
        expect(w.rangeDm).toHaveProperty(band)
        expect(typeof w.rangeDm[band]).toBe('number')
      }
    })

    it(`${id}: damageBonus is a non-negative number`, () => {
      expect(typeof w.damageBonus).toBe('number')
      expect(w.damageBonus).toBeGreaterThanOrEqual(0)
    })

    it(`${id}: traits is an array`, () => {
      expect(Array.isArray(w.traits)).toBe(true)
    })

    it(`${id}: TL is a positive integer`, () => {
      expect(Number.isInteger(w.TL)).toBe(true)
      expect(w.TL).toBeGreaterThan(0)
    })

    it(`${id}: optimalRange is a valid band`, () => {
      expect([...RANGE_BANDS, '—', 'N/A']).toContain(w.optimalRange)
    })

    it(`${id}: traits do not include invented/non-canonical entries (Smart, Reaction)`, () => {
      expect(w.traits).not.toContain('Smart')
      expect(w.traits).not.toContain('Reaction')
      if (w.detonationMode) {
        expect(w.detonationMode.traits).not.toContain('Smart')
        expect(w.detonationMode.traits).not.toContain('Reaction')
      }
    })
  }
})

// === Specific 2300AD weapon rules // 2300AD B3 p.60 ===

describe('2300AD canonical weapons', () => {
  it('ll98 — optimal range is Close // B3 p.60', () => {
    expect(WEAPONS.ll98.optimalRange).toBe('Close')
  })

  it('ll98 — has Accurate trait // B3 p.60', () => {
    expect(WEAPONS.ll98.traits).toContain('Accurate')
  })

  it('ll98 — beyond Close is out of range (rangeDm Short = -20)', () => {
    expect(WEAPONS.ll98.rangeDm.Short).toBe(-20)
  })

  it('grumbler — TL is 12 // B3 p.60', () => {
    expect(WEAPONS.grumbler.TL).toBe(12)
  })

  it('grumbler — optimal range is Short (unique) // B3 p.60', () => {
    expect(WEAPONS.grumbler.optimalRange).toBe('Short')
  })

  it('grumbler — has Advanced and Inefficient traits // B3 p.60', () => {
    expect(WEAPONS.grumbler.traits).toContain('Advanced')
    expect(WEAPONS.grumbler.traits).toContain('Inefficient')
  })

  it('grumbler — Short rangeDm is -6 // B3 p.57', () => {
    expect(WEAPONS.grumbler.rangeDm.Short).toBe(-6)
  })

  it('anti_missile_laser — optimal range is Adjacent // B3 p.60', () => {
    expect(WEAPONS.anti_missile_laser.optimalRange).toBe('Adjacent')
  })

  it('anti_missile_laser — beyond Adjacent is out of range (rangeDm Close = -20) // issue #30', () => {
    expect(WEAPONS.anti_missile_laser.rangeDm.Close).toBe(-20)
  })

  it('darlan_g2 — beyond Adjacent is out of range (rangeDm Close = -20) // issue #30', () => {
    expect(WEAPONS.darlan_g2.rangeDm.Close).toBe(-20)
  })

  it('anti_missile_laser — damage is 1D // B3 p.60', () => {
    expect(WEAPONS.anti_missile_laser.damage).toBe('1D')
  })

  it('anti_missile_laser — has Point Defence trait // B3 p.60', () => {
    expect(WEAPONS.anti_missile_laser.traits).toContain('Point Defence')
  })

  it('particle_barbette — has Radiation trait (AP∞) // B3 p.59', () => {
    expect(WEAPONS.particle_barbette.traits).toContain('Radiation')
  })

  it('grape_shot — TL is 11, damage is 2D // B3 p.61', () => {
    expect(WEAPONS.grape_shot.TL).toBe(11)
    expect(WEAPONS.grape_shot.damage).toBe('2D')
  })

  it('grape_shot — has Auto 4, Blast 4, Radiation traits // B3 p.61', () => {
    expect(WEAPONS.grape_shot.traits).toContain('Auto 4')
    expect(WEAPONS.grape_shot.traits).toContain('Blast 4')
    expect(WEAPONS.grape_shot.traits).toContain('Radiation')
  })

  it('grape_shot — optimal range is Close and has Slow trait (detonation lasers must fire at Close, DM-2) // B3 p.59', () => {
    expect(WEAPONS.grape_shot.optimalRange).toBe('Close')
    expect(WEAPONS.grape_shot.traits).toContain('Slow')
  })

  it('ll98 — name is "Darlan LL-98", not an invented flavor name // B3 p.60', () => {
    expect(WEAPONS.ll98.name).toBe('Darlan LL-98')
  })

  it('anti_missile_laser — does not have the invented "Reaction" trait // B3 p.60', () => {
    expect(WEAPONS.anti_missile_laser.traits).not.toContain('Reaction')
  })

  it('ritage1 — has no traits (B3 lists none) // B3 p.61', () => {
    expect(WEAPONS.ritage1.traits).toEqual([])
  })

  it('ritage2 — has Blast 6, Radiation, and Slow (detonation-laser Close-range penalty) // B3 p.59, p.61', () => {
    expect(WEAPONS.ritage2.traits).toContain('Blast 6')
    expect(WEAPONS.ritage2.traits).toContain('Radiation')
    expect(WEAPONS.ritage2.traits).toContain('Slow')
  })

  it('whiskey — base entry has no traits, detonationMode has Blast 3, Radiation, Slow // B3 p.59, p.61', () => {
    expect(WEAPONS.whiskey.traits).toEqual([])
    expect(WEAPONS.whiskey.detonationMode.traits).toContain('Blast 3')
    expect(WEAPONS.whiskey.detonationMode.traits).toContain('Radiation')
    expect(WEAPONS.whiskey.detonationMode.traits).toContain('Slow')
  })

  it('missile_rack, aero12, ritage1, ritage2, whiskey, kingfisher — launchable via DroneLaunchModal', () => {
    for (const id of ['missile_rack', 'aero12', 'ritage1', 'ritage2', 'whiskey', 'kingfisher']) {
      expect(WEAPONS[id].launchable).toBe(true)
    }
  })

  it('grape_shot is not launchable (direct-fire Firing Solution weapon, not a tracked drone/missile)', () => {
    expect(WEAPONS.grape_shot.launchable).toBeFalsy()
  })

  // isLaser — Defensive Screens (B3 p.62) only absorb laser fire, not particle beams or kinetic/missile
  // warheads. Combat drones and submunitions are "nuclear bomb-pumped detonation lasers" per B3 p.59-60,
  // so they count as laser too.
  it('laser weapons are flagged isLaser: true', () => {
    for (const id of ['pulse_laser', 'beam_laser', 'll88', 'darlan_g2', 'll98', 'ea1000', 'anti_missile_laser', 'grumbler', 'grape_shot', 'ritage1', 'ritage2', 'whiskey', 'tri_beamer']) {
      expect(WEAPONS[id].isLaser).toBe(true)
    }
  })

  it('non-laser weapons (particle beam, kinetic, missiles) are not flagged isLaser', () => {
    for (const id of ['missile_rack', 'particle_barbette', 'allen_bmz50', 'aero12', 'autocannon_25mm', 'kingfisher']) {
      expect(WEAPONS[id].isLaser).toBeFalsy()
    }
  })
})

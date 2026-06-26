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
      expect(['turret', 'barbette', 'bay']).toContain(w.mount)
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

  it('anti_missile_laser — damage is 1D // B3 p.60', () => {
    expect(WEAPONS.anti_missile_laser.damage).toBe('1D')
  })

  it('anti_missile_laser — has Point Defence trait // B3 p.60', () => {
    expect(WEAPONS.anti_missile_laser.traits).toContain('Point Defence')
  })

  it('particle_barbette — has Radiation trait (AP∞) // B3 p.59', () => {
    expect(WEAPONS.particle_barbette.traits).toContain('Radiation')
  })
})

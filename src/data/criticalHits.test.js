/**
 * Tests for criticalHits data — Surface Fixture + Internal Crit tables.
 * // 2300AD B3 p.58 (surface); Trav2022 CRB p.158-159 + B3 substitutions (internal).
 */

import { describe, it, expect } from 'vitest'
import {
  SURFACE_FIXTURE_TABLE,
  SURFACE_FIXTURE_SYSTEMS,
  SURFACE_FIXTURE_EFFECTS,
  blankSurfaceFixtureTracks,
  INTERNAL_LOCATION_TABLE,
  CRITICAL_HIT_SYSTEMS,
} from './criticalHits.js'

// === blankSurfaceFixtureTracks ===

describe('blankSurfaceFixtureTracks', () => {
  it('returns an object with all 6 surface fixture systems', () => {
    const tracks = blankSurfaceFixtureTracks()
    for (const system of SURFACE_FIXTURE_SYSTEMS) {
      expect(tracks).toHaveProperty(system)
    }
  })

  it('all systems start at 0 (undamaged)', () => {
    const tracks = blankSurfaceFixtureTracks()
    for (const v of Object.values(tracks)) {
      expect(v).toBe(0)
    }
  })

  it('returns a new object each call (no shared reference)', () => {
    const a = blankSurfaceFixtureTracks()
    const b = blankSurfaceFixtureTracks()
    a.fireControl = 1
    expect(b.fireControl).toBe(0)
  })
})

// === SURFACE_FIXTURE_TABLE ===

describe('SURFACE_FIXTURE_TABLE', () => {
  it('covers all 11 possible 2D results (2–12)', () => {
    for (let roll = 2; roll <= 12; roll++) {
      expect(SURFACE_FIXTURE_TABLE).toHaveProperty(String(roll))
    }
  })

  it('every entry maps to a valid system key', () => {
    for (const system of Object.values(SURFACE_FIXTURE_TABLE)) {
      expect(SURFACE_FIXTURE_SYSTEMS).toContain(system)
    }
  })

  it('roll 2 → fireControl (B3 p.58)', () => {
    expect(SURFACE_FIXTURE_TABLE[2]).toBe('fireControl')
  })

  it('roll 12 → otherSystem (B3 p.58)', () => {
    expect(SURFACE_FIXTURE_TABLE[12]).toBe('otherSystem')
  })

  it('radiator is the most common result (rolls 6–8)', () => {
    const radiatorRolls = Object.entries(SURFACE_FIXTURE_TABLE)
      .filter(([, v]) => v === 'radiator')
      .map(([k]) => Number(k))
    expect(radiatorRolls).toContain(6)
    expect(radiatorRolls).toContain(7)
    expect(radiatorRolls).toContain(8)
  })
})

// === SURFACE_FIXTURE_EFFECTS ===

describe('SURFACE_FIXTURE_EFFECTS', () => {
  it('has an entry for every system in SURFACE_FIXTURE_SYSTEMS', () => {
    for (const system of SURFACE_FIXTURE_SYSTEMS) {
      expect(SURFACE_FIXTURE_EFFECTS).toHaveProperty(system)
    }
  })

  it('every system has at least a 1st-hit and 2nd-hit effect', () => {
    for (const system of SURFACE_FIXTURE_SYSTEMS) {
      const effects = SURFACE_FIXTURE_EFFECTS[system]
      expect(effects).toHaveProperty('1')
      expect(effects).toHaveProperty('2')
    }
  })

  it('every effect entry has a label string', () => {
    for (const system of SURFACE_FIXTURE_SYSTEMS) {
      for (const entry of Object.values(SURFACE_FIXTURE_EFFECTS[system])) {
        expect(typeof entry.label).toBe('string')
        expect(entry.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('every effect entry has a mechanics array', () => {
    for (const system of SURFACE_FIXTURE_SYSTEMS) {
      for (const entry of Object.values(SURFACE_FIXTURE_EFFECTS[system])) {
        expect(Array.isArray(entry.mechanics)).toBe(true)
      }
    }
  })

  it('fireControl 1st hit applies attack_dm -2', () => {
    const mech = SURFACE_FIXTURE_EFFECTS.fireControl[1].mechanics
    const dm = mech.find((m) => m.type === 'attack_dm')
    expect(dm).toBeDefined()
    expect(dm.value).toBe(-2)
  })
})

// === INTERNAL_LOCATION_TABLE ===

describe('INTERNAL_LOCATION_TABLE', () => {
  it('covers all 11 possible 2D results (2–12)', () => {
    for (let roll = 2; roll <= 12; roll++) {
      expect(INTERNAL_LOCATION_TABLE).toHaveProperty(String(roll))
    }
  })

  it('every entry maps to a valid internal system key', () => {
    for (const system of Object.values(INTERNAL_LOCATION_TABLE)) {
      expect(CRITICAL_HIT_SYSTEMS).toContain(system)
    }
  })

  it('contains stutterwarpDrive (B3 substitution for M-Drive)', () => {
    const systems = Object.values(INTERNAL_LOCATION_TABLE)
    expect(systems).toContain('stutterwarpDrive')
  })

  it('contains stutterwarpFtl (B3 substitution for J-Drive)', () => {
    const systems = Object.values(INTERNAL_LOCATION_TABLE)
    expect(systems).toContain('stutterwarpFtl')
  })

  it('does not contain jumpDrive or mDrive (replaced by B3 substitutions)', () => {
    const systems = Object.values(INTERNAL_LOCATION_TABLE)
    expect(systems).not.toContain('jumpDrive')
    expect(systems).not.toContain('mDrive')
  })
})

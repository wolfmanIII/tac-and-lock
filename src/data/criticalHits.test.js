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
  CRITICAL_HIT_EFFECTS,
  CRITICAL_HIT_SYSTEM_LABELS,
  computeCriticalSeverity,
  getMaxSeverity,
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

  it('location 8 (was M-Drive) is reactionDrive, not stutterwarpDrive (CRB p.169 + B3 p.58)', () => {
    expect(INTERNAL_LOCATION_TABLE[8]).toBe('reactionDrive')
  })

  it('location 9 is cargo — previously missing entirely', () => {
    expect(INTERNAL_LOCATION_TABLE[9]).toBe('cargo')
  })

  it('location 10 (was J-Drive) is stutterwarpDrive, not stutterwarpFtl (B3 p.58)', () => {
    expect(INTERNAL_LOCATION_TABLE[10]).toBe('stutterwarpDrive')
  })

  it('does not contain jumpDrive, mDrive, computer, or stutterwarpFtl (invented/replaced locations)', () => {
    const systems = Object.values(INTERNAL_LOCATION_TABLE)
    expect(systems).not.toContain('jumpDrive')
    expect(systems).not.toContain('mDrive')
    expect(systems).not.toContain('computer')
    expect(systems).not.toContain('stutterwarpFtl')
  })
})

// === CRITICAL_HIT_EFFECTS / CRITICAL_HIT_SYSTEM_LABELS completeness ===

describe('CRITICAL_HIT_EFFECTS completeness', () => {
  it('has an entry for every system in CRITICAL_HIT_SYSTEMS', () => {
    for (const system of CRITICAL_HIT_SYSTEMS) {
      expect(CRITICAL_HIT_EFFECTS).toHaveProperty(system)
    }
  })

  it('every system has an effect entry for every severity up to its own max', () => {
    for (const system of CRITICAL_HIT_SYSTEMS) {
      const max = getMaxSeverity(system)
      for (let sev = 1; sev <= max; sev++) {
        expect(CRITICAL_HIT_EFFECTS[system]).toHaveProperty(String(sev))
        expect(typeof CRITICAL_HIT_EFFECTS[system][sev].label).toBe('string')
      }
    }
  })

  it('every system has a display label', () => {
    for (const system of CRITICAL_HIT_SYSTEMS) {
      expect(typeof CRITICAL_HIT_SYSTEM_LABELS[system]).toBe('string')
    }
  })
})

// === getMaxSeverity ===

describe('getMaxSeverity', () => {
  it('reactionDrive caps at 2 (binary: inoperable/destroyed, B3 p.58)', () => {
    expect(getMaxSeverity('reactionDrive')).toBe(2)
  })

  it('every other system caps at 6 (CRB p.169)', () => {
    for (const system of CRITICAL_HIT_SYSTEMS) {
      if (system === 'reactionDrive') continue
      expect(getMaxSeverity(system)).toBe(6)
    }
  })
})

// === computeCriticalSeverity ===

describe('computeCriticalSeverity', () => {
  it('Severity = Effect - 5 on a fresh hit (CRB p.169)', () => {
    expect(computeCriticalSeverity(8, 0, 'sensors')).toBe(3)
    expect(computeCriticalSeverity(6, 0, 'sensors')).toBe(1)
  })

  it('uses previous+1 when higher than the new Effect-5 (stacking rule, CRB p.169)', () => {
    // Effect 6 → 1, but a system already at severity 4 goes to 5, not down to 1
    expect(computeCriticalSeverity(6, 4, 'sensors')).toBe(5)
  })

  it('uses the new Effect-5 when higher than previous+1', () => {
    expect(computeCriticalSeverity(12, 1, 'sensors')).toBe(6)
  })

  it('caps at the system max even if the formula would exceed it', () => {
    expect(computeCriticalSeverity(20, 0, 'sensors')).toBe(6)
  })

  it('reactionDrive ignores the Effect-5 formula entirely — always +1 per hit, capped at 2 (B3 p.58: hit-count based, not Effect-based)', () => {
    expect(computeCriticalSeverity(6, 0, 'reactionDrive')).toBe(1)
    expect(computeCriticalSeverity(6, 1, 'reactionDrive')).toBe(2)
    // A very high Effect must NOT skip straight to "destroyed" on the first hit
    expect(computeCriticalSeverity(20, 0, 'reactionDrive')).toBe(1)
    expect(computeCriticalSeverity(20, 1, 'reactionDrive')).toBe(2)
    // Cannot advance past destroyed on a third hit
    expect(computeCriticalSeverity(20, 2, 'reactionDrive')).toBe(2)
  })

  it('never returns below 1', () => {
    expect(computeCriticalSeverity(6, 0, 'sensors')).toBeGreaterThanOrEqual(1)
  })
})

/**
 * Tests for crew role helpers.
 * // Trav2022 CRB p.161 — Ship crew roles and skill resolution
 */

import { describe, it, expect } from 'vitest'
import {
  CREW_SKILLS,
  blankCrewMember,
  getCrewSkill,
  buildDefaultAssignments,
  getAssignedSkill,
  getEffectiveSkill,
  migrateCrew,
} from './crew.js'

// === CREW_SKILLS ===

describe('CREW_SKILLS', () => {
  it('has all 7 canonical roles', () => {
    const roles = Object.keys(CREW_SKILLS)
    expect(roles).toContain('pilot')
    expect(roles).toContain('captain')
    expect(roles).toContain('engineer')
    expect(roles).toContain('sensor_operator')
    expect(roles).toContain('gunner_turret')
    expect(roles).toContain('gunner_bay')
    expect(roles).toContain('marine')
  })
})

// === blankCrewMember ===

describe('blankCrewMember', () => {
  it('returns object with the given id', () => {
    const m = blankCrewMember('test-id')
    expect(m.id).toBe('test-id')
  })

  it('defaults name to "Unknown"', () => {
    expect(blankCrewMember('x').name).toBe('Unknown')
  })

  it('accepts a custom name', () => {
    expect(blankCrewMember('x', 'Alice').name).toBe('Alice')
  })

  it('role starts as null (unassigned)', () => {
    expect(blankCrewMember('x').role).toBeNull()
  })

  it('skills object has all expected keys with value 0', () => {
    const { skills } = blankCrewMember('x')
    const EXPECTED = ['pilot', 'tactics', 'engineer', 'gunner', 'sensors',
      'countermeasures', 'leadership', 'mechanic', 'gunCombat', 'melee']
    for (const key of EXPECTED) {
      expect(skills).toHaveProperty(key)
      expect(skills[key]).toBe(0)
    }
  })

  it('characteristics default to 7 for all stats', () => {
    const { characteristics } = blankCrewMember('x')
    for (const stat of ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC']) {
      expect(characteristics[stat]).toBe(7)
    }
  })
})

// === getCrewSkill ===

describe('getCrewSkill', () => {
  function member(role, skills = {}) {
    return { ...blankCrewMember('x'), role, skills: { ...blankCrewMember('x').skills, ...skills } }
  }

  it('pilot role uses pilot skill', () => {
    expect(getCrewSkill(member('pilot', { pilot: 3 }))).toBe(3)
  })

  it('captain role uses tactics skill', () => {
    expect(getCrewSkill(member('captain', { tactics: 2 }))).toBe(2)
  })

  it('engineer role uses engineer skill', () => {
    expect(getCrewSkill(member('engineer', { engineer: 4 }))).toBe(4)
  })

  it('sensor_operator role uses sensors skill', () => {
    expect(getCrewSkill(member('sensor_operator', { sensors: 1 }))).toBe(1)
  })

  it('gunner_turret role uses gunner skill', () => {
    expect(getCrewSkill(member('gunner_turret', { gunner: 3 }))).toBe(3)
  })

  it('gunner_bay role uses gunner skill', () => {
    expect(getCrewSkill(member('gunner_bay', { gunner: 2 }))).toBe(2)
  })

  it('marine role uses gunCombat skill', () => {
    expect(getCrewSkill(member('marine', { gunCombat: 2 }))).toBe(2)
  })

  it('unknown role → 0', () => {
    expect(getCrewSkill(member('unknown_role', { pilot: 5 }))).toBe(0)
  })

  it('null role → 0', () => {
    expect(getCrewSkill(member(null, { pilot: 5 }))).toBe(0)
  })
})

// === buildDefaultAssignments ===

describe('buildDefaultAssignments', () => {
  it('returns an entry for every role in CREW_SKILLS', () => {
    const assignments = buildDefaultAssignments()
    for (const role of Object.keys(CREW_SKILLS)) {
      expect(assignments).toHaveProperty(role)
    }
  })

  it('all assignments start as null (nobody assigned)', () => {
    const assignments = buildDefaultAssignments()
    for (const v of Object.values(assignments)) {
      expect(v).toBeNull()
    }
  })
})

// === getAssignedSkill ===

describe('getAssignedSkill', () => {
  const crewList = [
    { ...blankCrewMember('crew-1'), role: null, skills: { ...blankCrewMember('x').skills, pilot: 3 } },
    { ...blankCrewMember('crew-2'), role: null, skills: { ...blankCrewMember('x').skills, gunner: 4 } },
  ]

  it('returns skill for assigned crew', () => {
    const assignments = { pilot: 'crew-1' }
    expect(getAssignedSkill('pilot', assignments, crewList)).toBe(3)
  })

  it('returns 0 when role is unassigned', () => {
    const assignments = { pilot: null }
    expect(getAssignedSkill('pilot', assignments, crewList)).toBe(0)
  })

  it('returns 0 when crew ID not found in list', () => {
    const assignments = { pilot: 'ghost-id' }
    expect(getAssignedSkill('pilot', assignments, crewList)).toBe(0)
  })

  it('resolves gunner_turret using gunner skill', () => {
    const assignments = { gunner_turret: 'crew-2' }
    expect(getAssignedSkill('gunner_turret', assignments, crewList)).toBe(4)
  })
})

// === getEffectiveSkill ===

describe('getEffectiveSkill', () => {
  it('matches getAssignedSkill (no additional logic currently)', () => {
    const crewList = [
      { ...blankCrewMember('c1'), skills: { ...blankCrewMember('x').skills, sensors: 2 } },
    ]
    const assignments = { sensor_operator: 'c1' }
    expect(getEffectiveSkill('sensor_operator', assignments, crewList)).toBe(2)
  })

  it('returns 0 when nobody assigned', () => {
    expect(getEffectiveSkill('pilot', { pilot: null }, [])).toBe(0)
  })
})

// === migrateCrew ===

describe('migrateCrew', () => {
  it('fills in missing skill keys from blank defaults', () => {
    const raw = { name: 'Bob', skills: { pilot: 2 } }
    const m = migrateCrew(raw, 'id-1')
    const blank = blankCrewMember('id-1').skills
    for (const key of Object.keys(blank)) {
      expect(m.skills).toHaveProperty(key)
    }
    expect(m.skills.pilot).toBe(2)
  })

  it('fills in missing characteristics', () => {
    const raw = { name: 'Eve', characteristics: { STR: 10 } }
    const m = migrateCrew(raw, 'id-2')
    for (const stat of ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC']) {
      expect(m.characteristics).toHaveProperty(stat)
    }
    expect(m.characteristics.STR).toBe(10)
    expect(m.characteristics.DEX).toBe(7) // filled from blank default
  })

  it('always sets the given id', () => {
    const m = migrateCrew({ id: 'old-id', name: 'X' }, 'new-id')
    expect(m.id).toBe('new-id')
  })

  it('preserves existing valid data', () => {
    const raw = { name: 'Zoe', role: 'pilot', skills: { pilot: 3, sensors: 1 } }
    const m = migrateCrew(raw, 'id-3')
    expect(m.name).toBe('Zoe')
    expect(m.role).toBe('pilot')
    expect(m.skills.pilot).toBe(3)
    expect(m.skills.sensors).toBe(1)
  })
})

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
  getAssignedCharacteristic,
  getEffectiveSkill,
  migrateCrew,
  buildActionBudget,
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

  it('missing skill key in skills object falls back to 0', () => {
    // Skills object with no keys at all — ?? 0 fallback fires on every property access
    const crew = { role: 'pilot', skills: {} }
    expect(getCrewSkill(crew)).toBe(0)
  })

  it('missing skill key for captain falls back to 0', () => {
    const crew = { role: 'captain', skills: { pilot: 3 } } // tactics missing
    expect(getCrewSkill(crew)).toBe(0)
  })

  it('missing skill key for marine falls back to 0', () => {
    const crew = { role: 'marine', skills: {} } // gunCombat missing
    expect(getCrewSkill(crew)).toBe(0)
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

// === getAssignedCharacteristic ===

describe('getAssignedCharacteristic', () => {
  const crewList = [
    {
      ...blankCrewMember('c1'),
      characteristics: { STR: 8, DEX: 10, END: 7, INT: 11, EDU: 9, SOC: 6 },
    },
  ]

  it('returns INT (primary) for captain role', () => {
    const assignments = { captain: 'c1' }
    expect(getAssignedCharacteristic('captain', assignments, crewList)).toBe(11)
  })

  it('returns DEX (primary) for pilot role', () => {
    const assignments = { pilot: 'c1' }
    expect(getAssignedCharacteristic('pilot', assignments, crewList)).toBe(10)
  })

  it('explicit characteristic override ignores role primary', () => {
    const assignments = { captain: 'c1' }
    expect(getAssignedCharacteristic('captain', assignments, crewList, 'STR')).toBe(8)
  })

  it('returns 7 (DM+0) when role is unassigned', () => {
    const assignments = { captain: null }
    expect(getAssignedCharacteristic('captain', assignments, crewList)).toBe(7)
  })

  it('returns 7 when crew ID not found in list', () => {
    const assignments = { pilot: 'ghost-id' }
    expect(getAssignedCharacteristic('pilot', assignments, crewList)).toBe(7)
  })

  it('unknown role falls back to INT characteristic', () => {
    // ROLE_PRIMARY_CHARACTERISTIC['unknown'] is undefined → ?? 'INT' fires
    const assignments = { unknown: 'c1' }
    expect(getAssignedCharacteristic('unknown', assignments, crewList)).toBe(11) // INT = 11
  })

  it('crew with no characteristics object falls back to 7', () => {
    const noCharsCrew = [{ ...blankCrewMember('c2'), characteristics: undefined }]
    const assignments = { pilot: 'c2' }
    expect(getAssignedCharacteristic('pilot', assignments, noCharsCrew)).toBe(7)
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

// === buildActionBudget — 2300AD B3 p.53 ===

describe('buildActionBudget', () => {
  it('returns an entry for every role in CREW_SKILLS', () => {
    const budget = buildActionBudget({}, [])
    for (const role of Object.keys(CREW_SKILLS)) {
      expect(budget).toHaveProperty(role)
    }
  })

  it('unassigned roles all budget to 0', () => {
    const budget = buildActionBudget({}, [])
    for (const value of Object.values(budget)) {
      expect(value).toBe(0)
    }
  })

  it('non-gunner role budget equals the assigned crew member\'s skill level', () => {
    const crew = [{ ...blankCrewMember('c1'), skills: { ...blankCrewMember('x').skills, pilot: 3 } }]
    const budget = buildActionBudget({ pilot: 'c1' }, crew)
    expect(budget.pilot).toBe(3)
  })

  it('gunner_turret is capped at 1 action even with a high skill level (Gunnery cannot be used more than once) // B3 p.53', () => {
    const crew = [{ ...blankCrewMember('c1'), skills: { ...blankCrewMember('x').skills, gunner: 4 } }]
    const budget = buildActionBudget({ gunner_turret: 'c1' }, crew)
    expect(budget.gunner_turret).toBe(1)
  })

  it('gunner_bay is also capped at 1', () => {
    const crew = [{ ...blankCrewMember('c1'), skills: { ...blankCrewMember('x').skills, gunner: 3 } }]
    const budget = buildActionBudget({ gunner_bay: 'c1' }, crew)
    expect(budget.gunner_bay).toBe(1)
  })

  it('a gunner with skill 0 still budgets to 0, not negative', () => {
    const crew = [{ ...blankCrewMember('c1'), skills: { ...blankCrewMember('x').skills, gunner: 0 } }]
    const budget = buildActionBudget({ gunner_turret: 'c1' }, crew)
    expect(budget.gunner_turret).toBe(0)
  })

  it('handles missing crewAssignments/crew gracefully (all zero)', () => {
    const budget = buildActionBudget(undefined, undefined)
    expect(budget.pilot).toBe(0)
    expect(budget.gunner_turret).toBe(0)
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

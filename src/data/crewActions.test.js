/**
 * Tests for crew action definitions.
 * // 2300AD B3 p.55–56 — Actions Phase + Reactions
 */

import { describe, it, expect } from 'vitest'
import { CREW_ACTIONS, ALL_CREW_ACTIONS } from './crewActions.js'

const REQUIRED_FIELDS = ['id', 'label', 'phase', 'reaction', 'skill', 'difficulty', 'difficultyLabel', 'description', 'requiresTarget']
const VALID_PHASES   = ['manoeuvre', 'attack', 'actions']

// === Structural integrity ===

describe('CREW_ACTIONS — every action', () => {
  it.each(ALL_CREW_ACTIONS.map((a) => [a.id, a]))('%s: has all required fields', (_, action) => {
    for (const field of REQUIRED_FIELDS) {
      expect(action, `field "${field}" missing on action "${action.id}"`).toHaveProperty(field)
    }
  })

  it.each(ALL_CREW_ACTIONS.map((a) => [a.id, a]))('%s: phase is valid', (_, action) => {
    expect(VALID_PHASES).toContain(action.phase)
  })

  it.each(ALL_CREW_ACTIONS.map((a) => [a.id, a]))('%s: difficulty is a number', (_, action) => {
    expect(typeof action.difficulty).toBe('number')
  })

  it.each(ALL_CREW_ACTIONS.map((a) => [a.id, a]))('%s: reaction is boolean', (_, action) => {
    expect(typeof action.reaction).toBe('boolean')
  })

  it.each(ALL_CREW_ACTIONS.map((a) => [a.id, a]))('%s: requiresTarget is boolean', (_, action) => {
    expect(typeof action.requiresTarget).toBe('boolean')
  })

  it('all action IDs are unique', () => {
    const ids = ALL_CREW_ACTIONS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// === ALL_CREW_ACTIONS flat list ===

describe('ALL_CREW_ACTIONS', () => {
  it('contains actions from all roles', () => {
    for (const role of Object.keys(CREW_ACTIONS)) {
      const roleIds = CREW_ACTIONS[role].map((a) => a.id)
      for (const id of roleIds) {
        expect(ALL_CREW_ACTIONS.map((a) => a.id)).toContain(id)
      }
    }
  })

  it('count matches sum of all role action arrays', () => {
    const total = Object.values(CREW_ACTIONS).reduce((sum, arr) => sum + arr.length, 0)
    expect(ALL_CREW_ACTIONS).toHaveLength(total)
  })
})

// === B3 p.55 specific checks ===

describe('evasive_action // B3 p.55', () => {
  const action = ALL_CREW_ACTIONS.find((a) => a.id === 'evasive_action')

  it('exists in pilot actions', () => {
    expect(action).toBeDefined()
  })

  it('difficulty is 10 (opposed Pilot check — not TAC Speed cost)', () => {
    expect(action.difficulty).toBe(10)
  })

  it('phase is manoeuvre', () => {
    expect(action.phase).toBe('manoeuvre')
  })

  it('description references Effect table', () => {
    expect(action.description).toMatch(/Effect/i)
  })
})

describe('point_defence // B3 p.55', () => {
  const action = ALL_CREW_ACTIONS.find((a) => a.id === 'point_defence')

  it('exists in gunner actions', () => {
    expect(action).toBeDefined()
  })

  it('difficulty is 10 (Difficult — not Average 8)', () => {
    expect(action.difficulty).toBe(10)
  })

  it('is a reaction', () => {
    expect(action.reaction).toBe(true)
  })

  it('phase is attack', () => {
    expect(action.phase).toBe('attack')
  })
})

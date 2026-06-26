/**
 * Tests for dice rolling utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  rollDice,
  roll2D6,
  roll1D6,
  rollD3,
  formatDiceResults,
  formatCheckResult,
  getCharDM,
} from './dice.js'

// === rollDice ===

describe('rollDice', () => {
  it('returns an array of length n', () => {
    expect(rollDice(3, 6)).toHaveLength(3)
    expect(rollDice(1, 20)).toHaveLength(1)
    expect(rollDice(5, 8)).toHaveLength(5)
  })

  it('each result in [1, sides]', () => {
    for (let i = 0; i < 50; i++) {
      const results = rollDice(4, 6)
      for (const r of results) {
        expect(r).toBeGreaterThanOrEqual(1)
        expect(r).toBeLessThanOrEqual(6)
      }
    }
  })

  it('all results are integers', () => {
    const results = rollDice(10, 6)
    for (const r of results) {
      expect(Number.isInteger(r)).toBe(true)
    }
  })

  it('0 dice → empty array', () => {
    expect(rollDice(0, 6)).toHaveLength(0)
  })
})

// === roll2D6 ===

describe('roll2D6', () => {
  it('returns exactly 2 values', () => {
    expect(roll2D6()).toHaveLength(2)
  })

  it('sum always in [2, 12]', () => {
    for (let i = 0; i < 100; i++) {
      const dice = roll2D6()
      const total = dice[0] + dice[1]
      expect(total).toBeGreaterThanOrEqual(2)
      expect(total).toBeLessThanOrEqual(12)
    }
  })
})

// === roll1D6 ===

describe('roll1D6', () => {
  it('returns a single number in [1, 6]', () => {
    for (let i = 0; i < 50; i++) {
      const r = roll1D6()
      expect(r).toBeGreaterThanOrEqual(1)
      expect(r).toBeLessThanOrEqual(6)
      expect(Number.isInteger(r)).toBe(true)
    }
  })
})

// === rollD3 ===

describe('rollD3', () => {
  it('returns a number in [1, 3]', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollD3()
      expect(r).toBeGreaterThanOrEqual(1)
      expect(r).toBeLessThanOrEqual(3)
      expect(Number.isInteger(r)).toBe(true)
    }
  })
})

// === formatDiceResults ===
// Format: "[d1+d2+...]=sum"

describe('formatDiceResults', () => {
  it('single die', () => {
    expect(formatDiceResults([5])).toBe('[5]=5')
  })

  it('two dice', () => {
    expect(formatDiceResults([3, 4])).toBe('[3+4]=7')
  })

  it('three dice', () => {
    expect(formatDiceResults([1, 2, 3])).toBe('[1+2+3]=6')
  })

  it('sum is correct', () => {
    expect(formatDiceResults([6, 6])).toBe('[6+6]=12')
    expect(formatDiceResults([1, 1])).toBe('[1+1]=2')
  })
})

// === formatCheckResult ===

describe('formatCheckResult', () => {
  it('success when total >= difficulty', () => {
    const r = formatCheckResult(10, 10)
    expect(r.success).toBe(true)
    expect(r.effect).toBe(0)
  })

  it('failure when total < difficulty', () => {
    const r = formatCheckResult(7, 10)
    expect(r.success).toBe(false)
    expect(r.effect).toBe(-3)
  })

  it('effect = total − difficulty', () => {
    const r = formatCheckResult(14, 10)
    expect(r.effect).toBe(4)
  })

  it('returns total and difficulty in result', () => {
    const r = formatCheckResult(12, 8)
    expect(r.total).toBe(12)
    expect(r.difficulty).toBe(8)
  })
})

// === getCharDM ===
// // Trav2022 CRB p.6

describe('getCharDM', () => {
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
    [20,  3],
  ]

  it.each(CASES)('stat %i → DM %i', (stat, dm) => {
    expect(getCharDM(stat)).toBe(dm)
  })
})

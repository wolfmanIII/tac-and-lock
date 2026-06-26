/**
 * Tests for range band utilities.
 * // 2300AD B3 p.52 — 7 range bands, light-second scale
 */

import { describe, it, expect } from 'vitest'
import {
  pairKey,
  getBandIndex,
  getCloserBand,
  getFartherBand,
  getTacSpeedCostOneStep,
  getTacSpeedCostTo,
  canMoveOnce,
  resolveBasicBandMovement,
  isDogfightRange,
  RANGE_BAND_ORDER,
} from './rangeBands.js'

// === RANGE_BAND_ORDER ===

describe('RANGE_BAND_ORDER', () => {
  it('contains exactly 7 bands // 2300AD B3 p.52', () => {
    expect(RANGE_BAND_ORDER).toHaveLength(7)
  })

  it('ordered from nearest to farthest', () => {
    expect(RANGE_BAND_ORDER).toEqual([
      'Adjacent', 'Close', 'Short', 'Medium', 'Long', 'VeryLong', 'Distant',
    ])
  })
})

// === pairKey ===

describe('pairKey', () => {
  it('order-independent — same key regardless of argument order', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'))
  })

  it('different pairs produce different keys', () => {
    expect(pairKey('a', 'b')).not.toBe(pairKey('a', 'c'))
  })

  it('same id on both sides produces a consistent key', () => {
    const k = pairKey('x', 'x')
    expect(typeof k).toBe('string')
    expect(k.length).toBeGreaterThan(0)
  })
})

// === getBandIndex ===

describe('getBandIndex', () => {
  const CASES = [
    ['Adjacent',  0],
    ['Close',     1],
    ['Short',     2],
    ['Medium',    3],
    ['Long',      4],
    ['VeryLong',  5],
    ['Distant',   6],
  ]

  it.each(CASES)('"%s" → index %i', (band, idx) => {
    expect(getBandIndex(band)).toBe(idx)
  })

  it('unknown band → -1', () => {
    expect(getBandIndex('Hyperspace')).toBe(-1)
  })
})

// === getCloserBand ===

describe('getCloserBand', () => {
  it('Adjacent has no closer band → null', () => {
    expect(getCloserBand('Adjacent')).toBeNull()
  })

  const CASES = [
    ['Close',    'Adjacent'],
    ['Short',    'Close'],
    ['Medium',   'Short'],
    ['Long',     'Medium'],
    ['VeryLong', 'Long'],
    ['Distant',  'VeryLong'],
  ]

  it.each(CASES)('from "%s" → closer is "%s"', (from, expected) => {
    expect(getCloserBand(from)).toBe(expected)
  })
})

// === getFartherBand ===

describe('getFartherBand', () => {
  it('Distant has no farther band → null', () => {
    expect(getFartherBand('Distant')).toBeNull()
  })

  const CASES = [
    ['Adjacent',  'Close'],
    ['Close',     'Short'],
    ['Short',     'Medium'],
    ['Medium',    'Long'],
    ['Long',      'VeryLong'],
    ['VeryLong',  'Distant'],
  ]

  it.each(CASES)('from "%s" → farther is "%s"', (from, expected) => {
    expect(getFartherBand(from)).toBe(expected)
  })
})

// === getTacSpeedCostOneStep ===
// Cost = destination band's tacSpeedCost // 2300AD B3 p.52

describe('getTacSpeedCostOneStep', () => {
  it('Adjacent → closer: Infinity (already at edge)', () => {
    expect(getTacSpeedCostOneStep('Adjacent', 'closer')).toBe(Infinity)
  })

  it('Distant → farther: Infinity (already at edge)', () => {
    expect(getTacSpeedCostOneStep('Distant', 'farther')).toBe(Infinity)
  })

  it('Close → closer: cost 1 (entering Adjacent)', () => {
    expect(getTacSpeedCostOneStep('Close', 'closer')).toBe(1)
  })

  it('Short → closer: cost 1 (entering Close)', () => {
    expect(getTacSpeedCostOneStep('Short', 'closer')).toBe(1)
  })

  it('Adjacent → farther: cost 1 (entering Close)', () => {
    expect(getTacSpeedCostOneStep('Adjacent', 'farther')).toBe(1)
  })

  it('Close → farther: cost 2 (entering Short)', () => {
    expect(getTacSpeedCostOneStep('Close', 'farther')).toBe(2)
  })

  it('Medium → farther: cost 10 (entering Long)', () => {
    expect(getTacSpeedCostOneStep('Medium', 'farther')).toBe(10)
  })
})

// === getTacSpeedCostTo ===

describe('getTacSpeedCostTo', () => {
  it('same band → 0 cost', () => {
    expect(getTacSpeedCostTo('Close', 'Close')).toBe(0)
    expect(getTacSpeedCostTo('Distant', 'Distant')).toBe(0)
  })

  it('Adjacent → Close = 1', () => {
    expect(getTacSpeedCostTo('Adjacent', 'Close')).toBe(1)
  })

  it('Adjacent → Short = 1 + 2 = 3', () => {
    expect(getTacSpeedCostTo('Adjacent', 'Short')).toBe(3)
  })

  it('Close → Medium = 2 + 5 = 7', () => {
    expect(getTacSpeedCostTo('Close', 'Medium')).toBe(7)
  })

  it('Short → Long = 5 + 10 = 15', () => {
    expect(getTacSpeedCostTo('Short', 'Long')).toBe(15)
  })

  it('reverse direction: Long → Short = 5 + 2 = 7', () => {
    // moving closer: Long→Medium (cost 5) + Medium→Short (cost 2) = 7
    expect(getTacSpeedCostTo('Long', 'Short')).toBe(7)
  })

  it('unknown band → Infinity', () => {
    expect(getTacSpeedCostTo('Warp', 'Close')).toBe(Infinity)
    expect(getTacSpeedCostTo('Close', 'Warp')).toBe(Infinity)
  })
})

// === canMoveOnce ===

describe('canMoveOnce', () => {
  it('exact TAC Speed = can move', () => {
    expect(canMoveOnce('Adjacent', 'Close', 1)).toBe(true)
  })

  it('more TAC Speed than needed = can move', () => {
    expect(canMoveOnce('Adjacent', 'Close', 5)).toBe(true)
  })

  it('not enough TAC Speed = cannot move', () => {
    expect(canMoveOnce('Close', 'Medium', 6)).toBe(false) // needs 7
  })

  it('same band = trivially true at any speed', () => {
    expect(canMoveOnce('Short', 'Short', 0)).toBe(true)
  })
})

// === resolveBasicBandMovement ===

describe('resolveBasicBandMovement', () => {
  it('hold intent → band and pool unchanged', () => {
    const r = resolveBasicBandMovement('Short', 3, 'hold', 5)
    expect(r.newBand).toBe('Short')
    expect(r.newPool).toBe(3) // pool unchanged
  })

  it('pool not yet reaching threshold → no band change', () => {
    // cost to enter Close from Short = 1; pool 0 + netTacSpeed 0 = 0 < 1
    const r = resolveBasicBandMovement('Short', 0, 'closer', 0)
    expect(r.newBand).toBe('Short')
    expect(r.newPool).toBe(0)
  })

  it('pool accumulates across calls without band change', () => {
    // entering Medium from Short costs 5; contribute 3 this round
    const r = resolveBasicBandMovement('Short', 0, 'farther', 3)
    expect(r.newBand).toBe('Short')
    expect(r.newPool).toBe(3)
  })

  it('pool reaches threshold → band changes and excess carries over', () => {
    // entering Close from Short costs 1; pool=0, netTacSpeed=3 → 3 >= 1 → band changes
    const r = resolveBasicBandMovement('Short', 0, 'closer', 3)
    expect(r.newBand).toBe('Close')
    expect(r.newPool).toBe(2) // 3 - 1
  })

  it('pool exactly meets threshold → band changes, pool = 0', () => {
    const r = resolveBasicBandMovement('Short', 0, 'closer', 1)
    expect(r.newBand).toBe('Close')
    expect(r.newPool).toBe(0)
  })

  it('already at edge going farther — stays put', () => {
    const r = resolveBasicBandMovement('Distant', 0, 'farther', 100)
    expect(r.newBand).toBe('Distant')
  })
})

// === isDogfightRange ===

describe('isDogfightRange', () => {
  it('Adjacent = dogfight range', () => {
    expect(isDogfightRange('Adjacent')).toBe(true)
  })

  it('Close = dogfight range // 2300AD — dogfight active at Adjacent/Close', () => {
    expect(isDogfightRange('Close')).toBe(true)
  })

  const NON_DOGFIGHT = ['Short', 'Medium', 'Long', 'VeryLong', 'Distant']

  it.each(NON_DOGFIGHT.map((b) => [b]))('"%s" = not dogfight range', ([band]) => {
    expect(isDogfightRange(band)).toBe(false)
  })
})

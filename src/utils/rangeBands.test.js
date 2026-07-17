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
  moveBands,
  isDogfightRange,
  computeEndedPursuits,
  RANGE_BAND_ORDER,
} from './rangeBands.js'
import { SENSOR_TIME_LAG_DM, getDroneLightspeedLagDm } from '../data/rangeBands.js'

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

// === moveBands ===
// Applies the Effect of an opposed Pilot check (Open/Close) to a band. // 2300AD B3 p.54

describe('moveBands', () => {
  it('moves one band closer', () => {
    expect(moveBands('Short', 'closer', 1)).toBe('Close')
  })

  it('moves one band farther', () => {
    expect(moveBands('Short', 'farther', 1)).toBe('Medium')
  })

  it('moves multiple bands in one call (large Effect)', () => {
    expect(moveBands('Distant', 'closer', 3)).toBe('Medium')
  })

  it('count 0 → no movement', () => {
    expect(moveBands('Short', 'closer', 0)).toBe('Short')
  })

  it('clamped at Adjacent — cannot go past the near edge', () => {
    expect(moveBands('Close', 'closer', 5)).toBe('Adjacent')
  })

  it('clamped at Distant — cannot go past the far edge', () => {
    expect(moveBands('Long', 'farther', 5)).toBe('Distant')
  })

  it('already at edge, moving further that way — stays put', () => {
    expect(moveBands('Distant', 'farther', 3)).toBe('Distant')
    expect(moveBands('Adjacent', 'closer', 3)).toBe('Adjacent')
  })
})

// === computeEndedPursuits ===
// "Combat ends one round after the range becomes Distant, if the pursuing ship cannot
// successfully close." // 2300AD B3 p.54

describe('computeEndedPursuits', () => {
  it('does not fire the same round Distant is reached', () => {
    const distantPursuit = { 'a::b': { since: 3, ended: false } }
    const rangeBands      = { 'a::b': 'Distant' }
    expect(computeEndedPursuits(distantPursuit, rangeBands, 3)).toEqual([])
  })

  it('fires at the start of the round after Distant was reached', () => {
    const distantPursuit = { 'a::b': { since: 3, ended: false } }
    const rangeBands      = { 'a::b': 'Distant' }
    expect(computeEndedPursuits(distantPursuit, rangeBands, 4)).toEqual(['a::b'])
  })

  it('skips a pair that closed back out of Distant', () => {
    const distantPursuit = { 'a::b': { since: 3, ended: false } }
    const rangeBands      = { 'a::b': 'VeryLong' }
    expect(computeEndedPursuits(distantPursuit, rangeBands, 4)).toEqual([])
  })

  it('does not re-fire a pair already flagged ended', () => {
    const distantPursuit = { 'a::b': { since: 3, ended: true } }
    const rangeBands      = { 'a::b': 'Distant' }
    expect(computeEndedPursuits(distantPursuit, rangeBands, 5)).toEqual([])
  })

  it('handles multiple tracked pairs independently', () => {
    const distantPursuit = {
      'a::b': { since: 3, ended: false }, // still Distant, one round elapsed → ends
      'c::d': { since: 4, ended: false }, // reached Distant this round → not yet
    }
    const rangeBands = { 'a::b': 'Distant', 'c::d': 'Distant' }
    expect(computeEndedPursuits(distantPursuit, rangeBands, 4)).toEqual(['a::b'])
  })

  it('empty distantPursuit → empty result', () => {
    expect(computeEndedPursuits({}, {}, 5)).toEqual([])
  })
})

// === SENSOR_TIME_LAG_DM ===
// Used in Firing Solution Step 1 for Electronics(sensors) check. // 2300AD B3 p.47

describe('SENSOR_TIME_LAG_DM', () => {
  const EXPECTED = [
    ['Adjacent',  1],
    ['Close',     0],
    ['Short',    -1],
    ['Medium',   -2],
    ['Long',     -3],
    ['VeryLong', -4],
    ['Distant',  -5],
  ]

  it.each(EXPECTED)('"%s" → DM %i // B3 p.47', (band, dm) => {
    expect(SENSOR_TIME_LAG_DM[band]).toBe(dm)
  })

  it('covers all 7 bands', () => {
    expect(Object.keys(SENSOR_TIME_LAG_DM)).toHaveLength(7)
    for (const band of RANGE_BAND_ORDER) {
      expect(SENSOR_TIME_LAG_DM).toHaveProperty(band)
    }
  })

  it('DMs are strictly decreasing from Adjacent to Distant', () => {
    const values = RANGE_BAND_ORDER.map((b) => SENSOR_TIME_LAG_DM[b])
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1])
    }
  })
})

// === getDroneLightspeedLagDm ===
// Distinct from SENSOR_TIME_LAG_DM above — depends on the drone's range from its own
// owner/controller (drone.ownerBand), not from its target. Flat DM-1 threshold, not a
// graduated scale — B3 gives no finer-grained table for VeryLong/Distant. // 2300AD B3 p.55

describe('getDroneLightspeedLagDm', () => {
  const EXPECTED = [
    ['Adjacent',  0],
    ['Close',     0],
    ['Short',     0],
    ['Medium',    0],
    ['Long',     -1],
    ['VeryLong', -1],
    ['Distant',  -1],
  ]

  it.each(EXPECTED)('"%s" → DM %i // B3 p.55', (band, dm) => {
    expect(getDroneLightspeedLagDm(band)).toBe(dm)
  })

  it('covers all 7 bands with no gaps', () => {
    for (const band of RANGE_BAND_ORDER) {
      expect(typeof getDroneLightspeedLagDm(band)).toBe('number')
    }
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

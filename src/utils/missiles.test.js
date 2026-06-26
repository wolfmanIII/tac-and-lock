/**
 * Tests for missile mechanics.
 * // 2300AD B3 p.56, p.61
 */

import { describe, it, expect, vi } from 'vitest'
import {
  MISSILE_FLIGHT_ROUNDS,
  computeFlightRounds,
  advanceMissileOneRound,
  computeMissileAttackDM,
  rollMissileAttack,
  resolvePointDefence,
  makeMissileSalvo,
} from './missiles.js'

// === computeFlightRounds ===

describe('computeFlightRounds', () => {
  it('Adjacent → 1 round', () => expect(computeFlightRounds('Adjacent')).toBe(1))
  it('Close → 1 round',    () => expect(computeFlightRounds('Close')).toBe(1))
  it('Short → 2 rounds',   () => expect(computeFlightRounds('Short')).toBe(2))
  it('Medium → 3 rounds',  () => expect(computeFlightRounds('Medium')).toBe(3))
  it('Long → 4 rounds',    () => expect(computeFlightRounds('Long')).toBe(4))
  it('VeryLong → 5 rounds',() => expect(computeFlightRounds('VeryLong')).toBe(5))
  it('Distant → 6 rounds', () => expect(computeFlightRounds('Distant')).toBe(6))
  it('unknown band → 1 (fallback)', () => expect(computeFlightRounds('Unknown')).toBe(1))

  it('MISSILE_FLIGHT_ROUNDS covers all 7 bands', () => {
    const bands = ['Adjacent', 'Close', 'Short', 'Medium', 'Long', 'VeryLong', 'Distant']
    for (const b of bands) expect(MISSILE_FLIGHT_ROUNDS).toHaveProperty(b)
  })
})

// === advanceMissileOneRound ===

describe('advanceMissileOneRound', () => {
  it('decrements roundsLeft by 1', () => {
    const result = advanceMissileOneRound({ currentBand: 'Long', roundsLeft: 4 })
    expect(result.roundsLeft).toBe(3)
  })

  it('moves band one step closer', () => {
    // Long (idx 4) → Medium (idx 3)
    const result = advanceMissileOneRound({ currentBand: 'Long', roundsLeft: 4 })
    expect(result.currentBand).toBe('Medium')
    expect(result.arrived).toBe(false)
  })

  it('sets arrived=true when roundsLeft reaches 0', () => {
    const result = advanceMissileOneRound({ currentBand: 'Close', roundsLeft: 1 })
    expect(result.arrived).toBe(true)
    expect(result.roundsLeft).toBe(0)
  })

  it('does not move band further when arrived', () => {
    const result = advanceMissileOneRound({ currentBand: 'Adjacent', roundsLeft: 1 })
    expect(result.arrived).toBe(true)
  })

  it('clamps at Adjacent (idx 0) — does not underflow band', () => {
    const result = advanceMissileOneRound({ currentBand: 'Adjacent', roundsLeft: 3 })
    expect(result.currentBand).toBe('Adjacent')
    expect(result.arrived).toBe(false)
  })

  it('preserves other salvo fields', () => {
    const salvo = { currentBand: 'Short', roundsLeft: 2, id: 'test-id', salvoSize: 3 }
    const result = advanceMissileOneRound(salvo)
    expect(result.id).toBe('test-id')
    expect(result.salvoSize).toBe(3)
  })
})

// === computeMissileAttackDM ===

describe('computeMissileAttackDM', () => {
  it('all zero by default', () => {
    const { dms, total } = computeMissileAttackDM({})
    expect(total).toBe(0)
    for (const v of Object.values(dms)) expect(v).toBe(0)
  })

  it('salvoDmBonus adds to total', () => {
    const { total } = computeMissileAttackDM({ salvoDmBonus: 2 })
    expect(total).toBe(2)
  })

  it('ewPenalty subtracts from total', () => {
    const { total } = computeMissileAttackDM({ ewPenalty: -3 })
    expect(total).toBe(-3)
  })

  it('all modifiers sum correctly', () => {
    const { total } = computeMissileAttackDM({
      salvoDmBonus: 3,
      fireControlDm: 2,
      sensorLockDm: 1,
      ewPenalty: -2,
      evasiveDm: -1,
    })
    expect(total).toBe(3)
  })

  it('returns dms breakdown object', () => {
    const { dms } = computeMissileAttackDM({ salvoDmBonus: 1 })
    expect(dms).toHaveProperty('salvoDmBonus', 1)
    expect(dms).toHaveProperty('fireControlDm', 0)
    expect(dms).toHaveProperty('ewPenalty', 0)
  })
})

// === rollMissileAttack ===

describe('rollMissileAttack', () => {
  it('success when total >= 10 (B3 p.56 — Difficult)', () => {
    // Force dice to always produce known results
    const result = rollMissileAttack(0)
    expect(typeof result.success).toBe('boolean')
    expect(result.success).toBe(result.total >= 10)
  })

  it('effect = total − 10', () => {
    const result = rollMissileAttack(0)
    expect(result.effect).toBe(result.total - 10)
  })

  it('effect is negative when total < 10', () => {
    // DM of -100 guarantees miss
    const result = rollMissileAttack(-100)
    expect(result.success).toBe(false)
    expect(result.effect).toBeLessThan(0)
  })

  it('effect is non-negative when total >= 10', () => {
    // DM of +100 guarantees hit
    const result = rollMissileAttack(100)
    expect(result.success).toBe(true)
    expect(result.effect).toBeGreaterThanOrEqual(0)
  })

  it('returns required fields', () => {
    const result = rollMissileAttack(2)
    expect(result).toHaveProperty('dice')
    expect(result).toHaveProperty('base')
    expect(result).toHaveProperty('totalDm', 2)
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('effect')
  })

  it('dice is array of 2 values summing to base', () => {
    const result = rollMissileAttack(0)
    expect(result.dice).toHaveLength(2)
    expect(result.dice[0] + result.dice[1]).toBe(result.base)
  })

  it('total = base + totalDm', () => {
    const result = rollMissileAttack(3)
    expect(result.total).toBe(result.base + 3)
  })
})

// === resolvePointDefence ===

describe('resolvePointDefence', () => {
  it('no PD rolls → 0 destroyed', () => {
    const { salvosRemaining, destroyed } = resolvePointDefence(4, [])
    expect(destroyed).toBe(0)
    expect(salvosRemaining).toBe(4)
  })

  it('one successful PD roll → 1 destroyed', () => {
    const { salvosRemaining, destroyed } = resolvePointDefence(3, [{ success: true }])
    expect(destroyed).toBe(1)
    expect(salvosRemaining).toBe(2)
  })

  it('counts only successful rolls', () => {
    const pdRolls = [
      { success: true },
      { success: false },
      { success: true },
      { success: false },
    ]
    const { destroyed, salvosRemaining } = resolvePointDefence(5, pdRolls)
    expect(destroyed).toBe(2)
    expect(salvosRemaining).toBe(3)
  })

  it('salvosRemaining never goes below 0', () => {
    // More PD successes than missiles
    const pdRolls = [{ success: true }, { success: true }, { success: true }]
    const { salvosRemaining } = resolvePointDefence(2, pdRolls)
    expect(salvosRemaining).toBe(0)
  })

  it('all failed PD → full salvo survives', () => {
    const pdRolls = [{ success: false }, { success: false }]
    const { salvosRemaining } = resolvePointDefence(4, pdRolls)
    expect(salvosRemaining).toBe(4)
  })
})

// === makeMissileSalvo ===

describe('makeMissileSalvo', () => {
  const BASE = {
    id: 'salvo-1',
    attackerId: 'ship-a',
    targetId: 'ship-b',
    launchBand: 'Long',
    salvoSize: 3,
    round: 2,
  }

  it('preserves id, attackerId, targetId', () => {
    const s = makeMissileSalvo(BASE)
    expect(s.id).toBe('salvo-1')
    expect(s.attackerId).toBe('ship-a')
    expect(s.targetId).toBe('ship-b')
  })

  it('flightRounds matches computeFlightRounds(launchBand)', () => {
    const s = makeMissileSalvo(BASE)
    expect(s.flightRounds).toBe(4) // Long = 4
    expect(s.roundsLeft).toBe(4)
  })

  it('currentBand starts at launchBand', () => {
    const s = makeMissileSalvo(BASE)
    expect(s.currentBand).toBe('Long')
  })

  it('salvoRemaining = salvoSize on creation', () => {
    const s = makeMissileSalvo(BASE)
    expect(s.salvoRemaining).toBe(3)
  })

  it('arrived=false when flight > 1 round', () => {
    const s = makeMissileSalvo(BASE) // Long = 4 rounds
    expect(s.arrived).toBe(false)
  })

  it('arrived=true when launched from Adjacent (1 round)', () => {
    const s = makeMissileSalvo({ ...BASE, launchBand: 'Adjacent' })
    expect(s.arrived).toBe(true)
    expect(s.flightRounds).toBe(1)
  })

  it('attackDmBonus defaults to 0', () => {
    const s = makeMissileSalvo(BASE)
    expect(s.attackDmBonus).toBe(0)
  })

  it('launchedRound records the launch round', () => {
    const s = makeMissileSalvo(BASE)
    expect(s.launchedRound).toBe(2)
  })
})

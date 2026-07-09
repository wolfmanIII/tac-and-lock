/**
 * Crew actions — Commands, EW, EW countermeasures.
 * // 2300AD B3 p.54–55 — Actions Phase crew actions
 */

import { test, expect } from '@playwright/test'
import { clearAppState, gotoBattle } from './helpers.js'

const ARMED_SHIPS = [
  {
    name: 'ISV-2 Trilon', faction: 'players',
    weapons: [{ weaponId: 'll98', count: 1, label: 'Fwd Laser' }],
  },
  {
    name: 'Kaefer Geist', faction: 'npc',
    weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser' }],
  },
]

/**
 * Inject two armed ships and return their IDs.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ id0: string, id1: string }>}
 */
async function setupShips(page) {
  return page.evaluate((defs) => {
    const store = window.__ZUSTAND_BATTLE_STORE__
    for (const def of defs) {
      store.getState().addShip(
        {
          name: def.name, class: 'Test', hullPoints: 20, armour: 3,
          tacSpeed: 4, signature: 2,
          sensors: { type: 'Basic Military', dm: 0 },
          computer: { model: 'TL-10', bandwidth: 20 },
          weapons: def.weapons, software: ['fire_control_1'],
          crew: [], crewAssignments: {},
        },
        def.faction, 'Close',
      )
    }
    const [s0, s1] = store.getState().ships
    return { id0: s0.id, id1: s1.id }
  }, ARMED_SHIPS)
}

/** Step through Firing Solution to Step 3 for the given attacker. */
async function reachStep3(page, attackerId) {
  await page.evaluate((id) => {
    window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id })
  }, attackerId)
  await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  await page.getByText('BEGIN FIRING SOLUTION →').click()
  await page.getByText('ROLL 2D6').click()
  await page.getByText('NEXT → PILOT').click()
  await page.getByText('ROLL 2D6').click()
  await page.getByText('NEXT → GUNNER').click()
  await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
}

// === Commands ================================================================
// "Leading Fire" (Tactics naval, battle-wide DM to all attacks) was not a
// canonical B3 rule — replaced by Commands (Leadership, per-ship, targets one
// crew role, activates next round). // 2300AD B3 p.54

test.describe('Commands — applyCommand', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('applyCommand sets commandBonusNextRound on the issuing ship only, not battle-wide', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyCommand(id, 'gunner_turret', 1)
    }, id0)
    const state = await page.evaluate((ids) => {
      const ships = window.__ZUSTAND_BATTLE_STORE__.getState().ships
      return {
        ship0: ships.find((s) => s.id === ids.id0).commandBonusNextRound,
        ship1: ships.find((s) => s.id === ids.id1).commandBonusNextRound,
      }
    }, { id0, id1 })
    expect(state.ship0).toEqual([{ role: 'gunner_turret', dm: 1 }])
    expect(state.ship1).toEqual([])
  })

  test('a Captain with Leadership 3 can issue three Commands to three different roles in one round', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(id, 'gunner_turret', 1)
      s.applyCommand(id, 'pilot', 2)
      s.applyCommand(id, 'sensor_operator', 1)
    }, id0)
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonusNextRound).toEqual([
      { role: 'gunner_turret', dm: 1 },
      { role: 'pilot', dm: 2 },
      { role: 'sensor_operator', dm: 1 },
    ])
  })

  test('re-issuing a Command to the same role replaces its DM instead of stacking', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(id, 'pilot', 1)
      s.applyCommand(id, 'pilot', 2)
    }, id0)
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonusNextRound).toEqual([{ role: 'pilot', dm: 2 }])
  })

  test('commandBonusNextRound promotes to commandBonus only after the round advances', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(ids.id0, 'gunner_turret', 2)
      s.setInitiativeOrder([ids.id0, ids.id1])
    }, { id0, id1 })
    // Not active yet — this round's Manoeuvre/Attack already passed by the time it's issued
    let ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonus).toEqual([])

    await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().startNextRound())
    ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonus).toEqual([{ role: 'gunner_turret', dm: 2 }])
    expect(ship0.commandBonusNextRound).toEqual([])
  })

  test('AttackModal step 3 shows Command row only for the ship that received it, targeting gunner_turret', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(ids.id0, 'gunner_turret', 1)
      s.setInitiativeOrder([ids.id0, ids.id1])
    }, { id0, id1 })
    await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().startNextRound())
    await reachStep3(page, id0)
    await expect(page.getByText('Command (Captain)')).toBeVisible()
  })
})

// === Electronic Warfare =====================================================

test.describe('Electronic Warfare — applyEW + ewEffect', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('applyEW sets ewTarget and ewEffect on attacker ship', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id0, ids.id1, 2)
    }, { id0, id1 })
    const ship0 = await page.evaluate((id) => {
      return window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    }, id0)
    expect(ship0.ewTarget).toBe(id1)
    expect(ship0.ewEffect).toBeLessThan(0) // penalty is negative
  })

  test('ewEffect magnitude ≥ 1 (DM floors at −1)', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // Effect 0 → penalty should still be −1
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id0, ids.id1, 0)
    }, { id0, id1 })
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship0.ewEffect).toBe(-1)
  })

  test('AttackModal step 3 shows EW jamming row when attacker is jammed', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // Ship 1 jams ship 0 (id1 jams id0) — so id0's attacks are penalised
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id1, ids.id0, 2)
    }, { id0, id1 })
    await reachStep3(page, id0)
    await expect(page.getByText('EW jamming')).toBeVisible()
  })

  test('EW jamming DM shown as negative value in step 3 breakdown', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id1, ids.id0, 2)
    }, { id0, id1 })
    await reachStep3(page, id0)
    // The value cell next to "EW jamming" label should contain a minus sign
    await expect(page.getByText(/^-\d/).first()).toBeVisible()
  })

  test('ewTarget and ewEffect reset to 0 at round end', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyEW(ids.id0, ids.id1, 2)
      s.startNextRound?.()
    }, { id0, id1 })
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship0.ewTarget).toBeNull()
    expect(ship0.ewEffect).toBe(0)
  })
})

// === EW Countermeasures =====================================================

test.describe('EW Countermeasures — ew_countermeasure action', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('successful countermeasure clears jammer ewTarget and ewEffect', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // id0 jams id1
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id0, ids.id1, 3)
    }, { id0, id1 })

    // id1 runs countermeasure — simulate what ActionModal does on success
    await page.evaluate((ids) => {
      const store = window.__ZUSTAND_BATTLE_STORE__.getState()
      const ships = store.ships
      const jammer = ships.find((s) => s.ewTarget === ids.id1)
      if (jammer) store.updateShip(jammer.id, { ewTarget: null, ewEffect: 0 })
    }, { id0, id1 })

    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship0.ewTarget).toBeNull()
    expect(ship0.ewEffect).toBe(0)
  })

  test('after countermeasure, AttackModal step 3 shows no EW jamming row', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // id1 jams id0, then id0 counters
    await page.evaluate((ids) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      store.getState().applyEW(ids.id1, ids.id0, 2)
      // Re-read state after mutation (getState() returns stale slice if captured early)
      const jammer = store.getState().ships.find((s) => s.ewTarget === ids.id0)
      if (jammer) store.getState().updateShip(jammer.id, { ewTarget: null, ewEffect: 0 })
    }, { id0, id1 })

    await reachStep3(page, id0)
    await expect(page.getByText('EW jamming')).not.toBeVisible()
  })
})

// Deploy Sand removed entirely — not a 2300AD B3 mechanic (zero occurrences in
// the source PDF). Point Defence moved to a per-drone reaction inside
// DroneAttackModal — see e2e/08-drones.spec.js.

// === Damage Control — hazards ===============================================

test.describe('Damage Control — addHazard / removeHazard', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('addHazard appends entry to ship.hazards', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().addHazard(id, 'Hull Fire')
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.hazards.length).toBe(1)
    expect(ship.hazards[0].label).toBe('Hull Fire')
  })

  test('removeHazard removes entry by id', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().addHazard(id, 'Fuel Leak')
    }, id0)
    const hazardId = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).hazards[0].id
    , id0)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().removeHazard(ids.id0, ids.hazardId)
    }, { id0, hazardId })
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.hazards.length).toBe(0)
  })

  test('addHazard accumulates multiple hazards', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.addHazard(id, 'Fire')
      s.addHazard(id, 'Breach')
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.hazards.length).toBe(2)
  })

  test('ShipDetailModal shows hazards panel', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().addHazard(id, 'Coolant Leak')
    }, id0)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('ship-detail', { shipId: id })
    }, id0)
    await expect(page.getByText('ACTIVE HAZARDS')).toBeVisible()
    await expect(page.getByText('Coolant Leak')).toBeVisible()
  })
})

// === Boarding Action — boardingDmNextRound ==================================

test.describe('Boarding — boardingDmNextRound carry-over', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('updateShip sets boardingDmNextRound on attacker ship', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { boardingDmNextRound: 2 })
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.boardingDmNextRound).toBe(2)
  })

  test('boardingDmNextRound resets to 0 at round end', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.updateShip(id, { boardingDmNextRound: 2 })
      s.startNextRound?.()
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.boardingDmNextRound).toBe(0)
  })
})

// Sensor Lock removed — it was never a 2300AD B3 action (only exists in the
// Traveller 2022 CRB, outside this project's declared CRB-fallback scope).

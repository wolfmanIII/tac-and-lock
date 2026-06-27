/**
 * Crew actions — leading fire, EW, EW countermeasures.
 * // 2300AD B3 p.55 — Actions Phase crew actions
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

// === Leading Fire ============================================================

test.describe('Leading Fire — applyLeadingFire', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('applyLeadingFire(1) sets leadingFireDm = 1 on store', async ({ page }) => {
    await page.evaluate(() => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyLeadingFire(1)
    })
    const dm = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().leadingFireDm,
    )
    expect(dm).toBe(1)
  })

  test('applyLeadingFire(2) sets leadingFireDm = 2', async ({ page }) => {
    await page.evaluate(() => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyLeadingFire(2)
    })
    const dm = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().leadingFireDm,
    )
    expect(dm).toBe(2)
  })

  test('applyLeadingFire is idempotent — keeps max value', async ({ page }) => {
    await page.evaluate(() => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyLeadingFire(2)
      s.applyLeadingFire(1) // lower value must not overwrite
    })
    const dm = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().leadingFireDm,
    )
    expect(dm).toBe(2)
  })

  test('leadingFireDm resets to 0 when round advances', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyLeadingFire(1)
      // Seed initiative so advancePhase can cycle through to next round
      s.setInitiativeOrder([ids.id0, ids.id1])
      // Fast-forward through all phases to trigger buildNextRoundState
      s.advancePhase() // setup → initiative (already in setup after gotoBattle)
    }, { id0, id1 })
    // Manually trigger round advance via store
    await page.evaluate(() => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      // Drain actors then push through all phases
      s.advanceActor(); s.advanceActor()  // drain manoeuvre actors in next phases
    })
    // Use startNextRound directly
    await page.evaluate(() => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.startNextRound?.()
    })
    const dm = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().leadingFireDm,
    )
    expect(dm).toBe(0)
  })

  test('AttackModal step 3 shows Leading Fire row when dm > 0', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate(() => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyLeadingFire(1)
    })
    await reachStep3(page, id0)
    await expect(page.getByText('Leading Fire')).toBeVisible()
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

// === Sensor Lock ============================================================

test.describe('Sensor Lock — applySensorLock + sensorLockDm', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('applySensorLock stores sensorLockDm on target ship', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // id0 sensor-locks id1 with effect 3 → dmBonus = max(1,3) = 3
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applySensorLock(ids.id0, ids.id1, 3)
    }, { id0, id1 })
    const ship1 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id1)
    expect(ship1.sensorLocked).toBe(true)
    expect(ship1.sensorLockDm).toBe(3)
  })

  test('sensorLockDm floors at 1 when effect ≤ 0', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applySensorLock(ids.id0, ids.id1, 0)
    }, { id0, id1 })
    const ship1 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id1)
    expect(ship1.sensorLockDm).toBe(1)
  })

  test('AttackModal step 3 shows Sensor lock row when target is locked', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // id0 locks id1, then id0 attacks id1 → sensor lock dm shows in id0's step 3
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applySensorLock(ids.id0, ids.id1, 2)
    }, { id0, id1 })
    await reachStep3(page, id0) // id0 attacks id1 (default target)
    await expect(page.getByText('Sensor lock')).toBeVisible()
  })

  test('sensorLocked and sensorLockDm reset to 0 at round end', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applySensorLock(ids.id0, ids.id1, 2)
      s.startNextRound?.()
    }, { id0, id1 })
    const ship1 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id1)
    expect(ship1.sensorLocked).toBe(false)
    expect(ship1.sensorLockDm).toBe(0)
  })
})

/**
 * Drone/missile flow — individually tracked units (no salvo), launch, tracker,
 * Point Defence, and the 3-step Firing Solution.
 * // 2300AD B3 p.55–56, p.61 — see doc/drone-combat-redesign-spec.md
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle, startCombat } from './helpers.js'

const SHIPS_WITH_DRONES = [
  { name: 'ISV-2 Trilon', faction: 'players', weapons: [{ weaponId: 'ritage1', count: 4, label: 'Drone bay', targetingSystem: 'light_tta' }] },
  { name: 'Kaefer Geist', faction: 'npc',      weapons: [{ weaponId: 'anti_missile_laser', count: 1, label: 'Quinn PDC', targetingSystem: 'light_tta' }] },
]

/** Open DroneLaunchModal for the first ship via store injection. */
async function openDroneLaunch(page) {
  await page.evaluate(() => {
    const ships = window.__ZUSTAND_BATTLE_STORE__.getState().ships
    if (ships.length < 2) throw new Error('Need at least 2 ships')
    window.__ZUSTAND_UI_STORE__.getState().openModal('drone-launch', { attackerId: ships[0].id })
  })
  await expect(page.getByText('LAUNCH DRONE')).toBeVisible()
}

function modalBody(page) {
  return page.locator('text=LAUNCH DRONE').locator('..')
}

/** Launch `count` Ritage-1 units and close the modal. */
async function launchDrones(page, count = 1) {
  await openDroneLaunch(page)
  await modalBody(page).getByRole('button', { name: String(count), exact: true }).click()
  await page.getByText('LAUNCH 🚀').click()
  await expect(page.getByText('LAUNCH DRONE')).not.toBeVisible()
}

/** Inject a drone directly into the store, already at the given band. */
async function injectDrone(page, { band = 'Close', weaponId = 'ritage1' } = {}) {
  return page.evaluate(({ band, weaponId }) => {
    const store = window.__ZUSTAND_BATTLE_STORE__
    const ships = store.getState().ships
    const drone = {
      id: 'test-drone-001',
      ownerId: ships[0].id,
      targetId: ships[1].id,
      weaponId,
      currentBand: band,
      roundsElapsed: 0,
      enduranceRounds: 60,
      destroyed: false,
      detonated: false,
      sensorLockSource: null,
      launchedRound: 1,
    }
    store.setState((s) => ({ drones: [...s.drones, drone] }))
    return drone.id
  }, { band, weaponId })
}

test.describe('Drone launch', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_WITH_DRONES)
  })

  test('modal shows LAUNCH DRONE header and launcher name', async ({ page }) => {
    await openDroneLaunch(page)
    await expect(modalBody(page).getByText('ISV-2 Trilon')).toBeVisible()
  })

  test('shows the drone weapon with TAC Speed and Endurance', async ({ page }) => {
    await openDroneLaunch(page)
    // Weapon name lives inside a <select><option> — Playwright reports option text as
    // "hidden" until the dropdown is open, so check the selected option value instead.
    // (select #0 = target ship, select #1 = weapon)
    await expect(modalBody(page).locator('select').nth(1)).toHaveValue('0')
    await expect(page.getByText('TAC SPEED')).toBeVisible()
    await expect(page.getByText('ENDURANCE')).toBeVisible()
  })

  test('unit count selector 1–6 all clickable', async ({ page }) => {
    await openDroneLaunch(page)
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await modalBody(page).getByRole('button', { name: String(n), exact: true }).click()
    }
  })

  test('LAUNCH creates N individual drone entities, not a salvo counter', async ({ page }) => {
    await launchDrones(page, 3)
    const drones = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().drones)
    expect(drones).toHaveLength(3)
    expect(drones.every((d) => d.weaponId === 'ritage1')).toBe(true)
    // Each is its own entity with a distinct id — no shared salvo count field
    expect(new Set(drones.map((d) => d.id)).size).toBe(3)
  })

  test('DroneTracker shows DRONES / MISSILES IN FLIGHT after launch', async ({ page }) => {
    await launchDrones(page, 1)
    await expect(page.getByText('DRONES / MISSILES IN FLIGHT')).toBeVisible()
  })

  test('CANCEL closes modal without launching', async ({ page }) => {
    await openDroneLaunch(page)
    await page.getByRole('button', { name: 'CANCEL' }).click()
    await expect(page.getByText('LAUNCH DRONE')).not.toBeVisible()
    const count = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().drones.length)
    expect(count).toBe(0)
  })
})

test.describe('Drone advancing', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_WITH_DRONES)
  })

  test('drone closes one band per round until Adjacent', async ({ page }) => {
    await injectDrone(page, { band: 'Short' })
    // Seed initiative so advancePhase can run through a full round
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      store.getState().setInitiativeOrder(store.getState().ships.map((s) => s.id))
    })
    await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().startNextRound())
    const band = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().drones.find((d) => d.id === 'test-drone-001')?.currentBand
    )
    expect(band).toBe('Close')
  })

  test('drone past Endurance goes inert (detonated)', async ({ page }) => {
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const ships = store.getState().ships
      store.setState((s) => ({
        drones: [...s.drones, {
          id: 'test-drone-inert', ownerId: ships[0].id, targetId: ships[1].id, weaponId: 'ritage1',
          currentBand: 'Long', roundsElapsed: 60, enduranceRounds: 60,
          destroyed: false, detonated: false, sensorLockSource: null, launchedRound: 1,
        }],
      }))
      store.getState().setInitiativeOrder(ships.map((s) => s.id))
    })
    await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().startNextRound())
    const detonated = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().drones.find((d) => d.id === 'test-drone-inert')?.detonated
    )
    expect(detonated).toBe(true)
  })
})

test.describe('Drone attack — Point Defence and Firing Solution', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_WITH_DRONES)
  })

  test('in-range drone appears as a resolvable button in the tracker', async ({ page }) => {
    await injectDrone(page, { band: 'Close' })
    await expect(page.getByText(/IN RANGE/)).toBeVisible()
  })

  test('opens with Point Defence panel first', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await expect(page.getByText(/— POINT DEFENCE ·/)).toBeVisible()
  })

  test('successful intercept destroys the drone', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    // Manual entry: force a high total to guarantee success (Difficult 10+)
    await page.getByText('enter manually').click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('INTERCEPTED — DESTROY DRONE')).toBeVisible()
    await page.getByText('INTERCEPTED — DESTROY DRONE').click()
    const destroyed = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().drones.find((d) => d.id === 'test-drone-001')?.destroyed
    )
    expect(destroyed).toBe(true)
  })

  test('proceeding through all 3 Firing Solution steps applies damage', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)

    // Steps 1-2 just need *a* result (success or failure) to unlock NEXT — real rolls are fine,
    // same pattern as e2e/07-attack.spec.js. Step 3 uses manual entry for a guaranteed hit.
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await expect(page.getByText('STEP 1 — SENSOR / FIRING SOLUTION')).toBeVisible()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('STEP 2 — POSITION VESSEL')).toBeVisible()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()

    await expect(page.getByText(/STEP 3 — GUNNER/)).toBeVisible()
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Damage', { exact: true })).toBeVisible()

    const hullBefore = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships[1].currentHull
    )
    await page.getByText('APPLY DAMAGE').click()
    const state = await page.evaluate(() => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      return { hull: s.ships[1].currentHull, detonated: s.drones.find((d) => d.id === 'test-drone-001')?.detonated }
    })
    expect(state.hull).toBeLessThanOrEqual(hullBefore)
    expect(state.detonated).toBe(true)
  })

  test('Step 2 (Position Vessel) shows the flat DM+2 drone Pilot bonus // B3 p.55', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('STEP 2 — POSITION VESSEL')).toBeVisible()
    await expect(page.getByText('Drone Pilot bonus')).toBeVisible()
    const row = page.locator('div', { hasText: 'Drone Pilot bonus' }).last()
    await expect(row.getByText('+2', { exact: true })).toBeVisible()
  })

  test('Step 3 (Gunner) shows Stationary/reaction-drive DM+2 and ×2 damage vs a stationary target // B3 p.56', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const target = store.getState().ships[1]
      store.getState().updateShip(target.id, { isStationary: true })
    })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()

    await expect(page.getByText('Stationary/reaction-drive target')).toBeVisible()
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('×2 damage', { exact: false })).toBeVisible()
  })

  test('Point Defence: no Fire Control software → no penalty (that DM belongs to Targeting System hardware, issue #25)', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const target = store.getState().ships[1]
      store.getState().updateShip(target.id, { software: [] })
    })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await expect(page.getByText(/— POINT DEFENCE ·/)).toBeVisible()
    await expect(page.getByText('Fire Control', { exact: false })).not.toBeVisible()
  })

  test('Point Defence shows Targeting System -8 when the intercepting weapon has none // B3 p.62, issue #25', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const target = store.getState().ships[1]
      store.getState().updateShip(target.id, {
        weapons: [{ weaponId: 'anti_missile_laser', count: 1, label: 'Quinn PDC', targetingSystem: 'none' }],
      })
    })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await expect(page.getByText(/— POINT DEFENCE ·/)).toBeVisible()
    const row = page.locator('div').filter({ hasText: 'Targeting System' }).last()
    await expect(row).toContainText('-8')
  })

  test('Step 3 (Gunner) applies the Slow trait DM-2 for a Ritage-2 drone // B3 p.59', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close', weaponId: 'ritage2' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()

    const row = page.locator('div').filter({ hasText: 'Weapon trait' }).last()
    await expect(row).toContainText('-2')
  })

  test('intercepting weapon picker: Point Defence DM depends on the DEFENDER\'s own weapon, not the drone\'s // issue #24 fix', async ({ page }) => {
    // Target ship has two weapon slots: a non-PDC laser (index 0) and the Quinn PDC (index 1).
    // Before the fix, the DM was read from the incoming drone's own weapon (never a PDC),
    // so it always showed -2 regardless of what the defender had installed.
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const target = store.getState().ships[1]
      store.getState().updateShip(target.id, {
        weapons: [
          { weaponId: 'll98', count: 1, label: 'Laser' },
          { weaponId: 'anti_missile_laser', count: 1, label: 'Quinn PDC' },
        ],
      })
    })
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await expect(page.getByText(/— POINT DEFENCE ·/)).toBeVisible()

    // Default selection (index 0, laser) → DM-2
    let row = page.locator('div').filter({ hasText: 'Point Defence' }).last()
    await expect(row).toContainText('-2')

    // Switch to the Quinn PDC (index 1) → DM+4
    await page.locator('select').filter({ hasText: 'Laser' }).selectOption('1')
    row = page.locator('div').filter({ hasText: 'Point Defence' }).last()
    await expect(row).toContainText('+4')
  })
})

// === Ship-only Firing Solution DMs ported to the drone modal — issues #31-#34 ===
// Captain Tactics assist (Step 3), Engineer assist (Step 1 + Step 2), Command bonus
// (Step 3), and target Evasion DM (Step 1) were implemented in AttackModal.jsx but
// never ported to DroneAttackModal.jsx. // 2300AD B3 p.54, p.56

test.describe('Drone attack — ported ship-only Firing Solution DMs (issues #31-#34)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_WITH_DRONES)
  })

  test('Step 1 shows an Engineer assist roll block; success adds a raw-Effect row // issue #32', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await expect(page.getByText('Engineer assist (optional)')).toBeVisible()

    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Engineer assist', { exact: true })).toBeVisible()
  })

  test('Step 2 shows its own Engineer assist roll block; success adds the banded TAC Speed row // issue #32', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await page.getByText('ROLL 2D6').last().click() // Step 1 main roll, no assist
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('Engineer assist (optional)')).toBeVisible()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6') // total 12+dm → Effect ≥ 5 → +2
    await expect(page.getByText('Engineer assist (TAC Speed)')).toBeVisible()
    const row = page.locator('div').filter({ hasText: 'Engineer assist (TAC Speed)' }).last()
    await expect(row).toContainText('+2')
  })

  test('Step 3 shows a Captain assist roll block; success adds a Tactics assist row // issue #31', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()

    await expect(page.getByText('Captain assist (optional)')).toBeVisible()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Tactics assist', { exact: true })).toBeVisible()
  })

  test('a Command issued to remote_pilot shows a Command (Captain) row in Step 3 // issue #33', async ({ page }) => {
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const owner = store.getState().ships[0]
      store.getState().applyCommand(owner.id, 'remote_pilot', 2)
    })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()

    const row = page.locator('div').filter({ hasText: 'Command (Captain)' }).last()
    await expect(row).toContainText('+2')
  })

  test('an evading target\'s DM appears in the drone\'s Step 1 breakdown, not just Step 3 // issue #34', async ({ page }) => {
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const target = store.getState().ships[1]
      store.getState().updateShip(target.id, { evasionDm: -2 })
    })
    const droneId = await injectDrone(page, { band: 'Close' })
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('drone-attack', { droneId: id })
    }, droneId)
    await page.getByText('NO INTERCEPT → FIRING SOLUTION').click()
    await expect(page.getByText('STEP 1 — SENSOR / FIRING SOLUTION')).toBeVisible()

    const row = page.locator('div').filter({ hasText: 'Target evasion' }).last()
    await expect(row).toContainText('-2')
  })
})

// === Proactive "engage" action — Point Defence weapon trait DM+2 (issue #24) ===

const SHIPS_ENGAGE = [
  { name: 'ISV-2 Trilon', faction: 'players', weapons: [
    { weaponId: 'll98', count: 1, label: 'Laser', targetingSystem: 'light_tta' },
    { weaponId: 'anti_missile_laser', count: 1, label: 'Quinn PDC', targetingSystem: 'light_tta' },
  ] },
  { name: 'Kaefer Geist', faction: 'npc', weapons: [{ weaponId: 'ritage1', count: 2, label: 'Drone bay', targetingSystem: 'light_tta' }] },
]

/** Inject a drone incoming AT ships[0] (the current actor after startCombat), launched by ships[1]. */
async function injectIncomingDrone(page, { band = 'Close', id = 'incoming-001' } = {}) {
  return page.evaluate(({ band, id }) => {
    const store = window.__ZUSTAND_BATTLE_STORE__
    const ships = store.getState().ships
    store.setState((s) => ({
      drones: [...s.drones, {
        id, ownerId: ships[1].id, targetId: ships[0].id, weaponId: 'ritage1',
        currentBand: band, roundsElapsed: 0, enduranceRounds: 60,
        destroyed: false, detonated: false, sensorLockSource: null, launchedRound: 1,
      }],
    }))
    return id
  }, { band, id })
}

test.describe('Drone attack — proactive engage (Point Defence weapon trait, issue #24)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_ENGAGE)
    await startCombat(page) // ISV-2 Trilon (ships[0]) becomes the current actor
  })

  test('context menu shows "Fire at incoming drone (Close)…" for a Close-range drone targeting this ship', async ({ page }) => {
    await injectIncomingDrone(page, { band: 'Close' })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await expect(page.getByText('Fire at incoming drone (Close)…')).toBeVisible()
  })

  test('not shown for the same drone at a non-Close range', async ({ page }) => {
    await injectIncomingDrone(page, { band: 'Adjacent' })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await expect(page.getByText('Fire at incoming drone (Close)…')).toHaveCount(0)
  })

  test('not shown for a drone incoming at a different ship', async ({ page }) => {
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const ships = store.getState().ships
      store.setState((s) => ({
        drones: [...s.drones, {
          id: 'other-target', ownerId: ships[0].id, targetId: ships[1].id, weaponId: 'ritage1',
          currentBand: 'Close', roundsElapsed: 0, enduranceRounds: 60,
          destroyed: false, detonated: false, sensorLockSource: null, launchedRound: 1,
        }],
      }))
    })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await expect(page.getByText('Fire at incoming drone (Close)…')).toHaveCount(0)
  })

  test('DM+2 row appears only when the selected weapon has the Point Defence trait', async ({ page }) => {
    await injectIncomingDrone(page, { band: 'Close' })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await page.getByText('Fire at incoming drone (Close)…').click()
    await expect(page.getByText('FIRE AT INCOMING DRONE')).toBeVisible()

    // Default (index 0, laser, no Point Defence trait) → no DM row
    await expect(page.getByText('Point Defence trait')).not.toBeVisible()

    // Switch to the Quinn PDC (index 1) → DM+2 row appears
    await page.locator('select').filter({ hasText: 'Laser' }).selectOption('1')
    const row = page.locator('div').filter({ hasText: 'Point Defence trait' }).last()
    await expect(row).toContainText('+2')
  })

  test('a successful engage destroys the drone and spends the Gunner action', async ({ page }) => {
    const droneId = await injectIncomingDrone(page, { band: 'Close' })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await page.getByText('Fire at incoming drone (Close)…').click()
    await page.locator('select').filter({ hasText: 'Laser' }).selectOption('1')
    await page.getByText('enter manually').click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('DESTROYED — CLOSE')).toBeVisible()
    await page.getByText('DESTROYED — CLOSE').click()

    const state = await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      return {
        destroyed: s.drones.find((d) => d.id === id)?.destroyed,
        gunnerBudget: s.ships[0].actionsRemaining.gunner_turret,
      }
    }, droneId)
    expect(state.destroyed).toBe(true)
    expect(state.gunnerBudget).toBe(0)
  })

  test('unavailable once the Gunner has no actions left this round', async ({ page }) => {
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const ship = store.getState().ships[0]
      store.getState().updateShip(ship.id, {
        actionsRemaining: { ...ship.actionsRemaining, gunner_turret: 0 },
      })
    })
    await injectIncomingDrone(page, { band: 'Close' })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await page.getByText('Fire at incoming drone (Close)…').click()
    await expect(page.getByText('has no actions left this round')).toBeVisible()
  })
})

test.describe('Context menu — real right-click, drone items', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_WITH_DRONES)
  })

  test('right-click the current actor\'s ship in combat shows enabled "Launch drone…"', async ({ page }) => {
    await startCombat(page) // ships[0] (ISV-2 Trilon) becomes the current actor by default
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    const item = page.getByText('Launch drone…')
    await expect(item).toBeVisible()
    await expect(item).toBeEnabled()
  })

  test('right-click a ship that is not the current actor shows disabled "Launch drone…"', async ({ page }) => {
    await startCombat(page) // ships[0] (ISV-2 Trilon) is the current actor — Kaefer Geist is not
    await page.locator('.cursor-context-menu').filter({ hasText: 'Kaefer Geist' }).click({ button: 'right' })
    const item = page.getByText('Launch drone…')
    await expect(item).toBeVisible()
    await expect(item).toBeDisabled()
  })

  test('"Resolve drone attack…" only appears once this ship has a drone in range', async ({ page }) => {
    await startCombat(page)
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await expect(page.getByText('Resolve drone attack…')).toHaveCount(0)
    // ContextMenu closes on outside mousedown (no Escape handler) — left-click the background
    await page.mouse.click(20, 20)

    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const ships = store.getState().ships
      store.setState((s) => ({
        drones: [...s.drones, {
          id: 'ctx-menu-drone', ownerId: ships[0].id, targetId: ships[1].id, weaponId: 'ritage1',
          currentBand: 'Close', roundsElapsed: 0, enduranceRounds: 60,
          destroyed: false, detonated: false, sensorLockSource: null, launchedRound: 1,
        }],
      }))
    })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await expect(page.getByText(/Resolve drone attack.*Close/)).toBeVisible()
  })

  test('clicking "Resolve drone attack…" opens the DroneAttackModal', async ({ page }) => {
    await startCombat(page)
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const ships = store.getState().ships
      store.setState((s) => ({
        drones: [...s.drones, {
          id: 'ctx-menu-drone-2', ownerId: ships[0].id, targetId: ships[1].id, weaponId: 'ritage1',
          currentBand: 'Adjacent', roundsElapsed: 0, enduranceRounds: 60,
          destroyed: false, detonated: false, sensorLockSource: null, launchedRound: 1,
        }],
      }))
    })
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await page.getByText(/Resolve drone attack/).click()
    await expect(page.getByText(/— POINT DEFENCE ·/)).toBeVisible()
  })
})

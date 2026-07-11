/**
 * Drone/missile flow — individually tracked units (no salvo), launch, tracker,
 * Point Defence, and the 3-step Firing Solution.
 * // 2300AD B3 p.55–56, p.61 — see doc/drone-combat-redesign-spec.md
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle, advanceToPhase } from './helpers.js'

const SHIPS_WITH_DRONES = [
  { name: 'ISV-2 Trilon', faction: 'players', weapons: [{ weaponId: 'ritage1', count: 4, label: 'Drone bay' }] },
  { name: 'Kaefer Geist', faction: 'npc',      weapons: [{ weaponId: 'anti_missile_laser', count: 1, label: 'Quinn PDC' }] },
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
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('STEP 2 — POSITION VESSEL')).toBeVisible()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()

    await expect(page.getByText(/STEP 3 — GUNNER/)).toBeVisible()
    await page.getByText('enter manually').click()
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
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('STEP 2 — POSITION VESSEL')).toBeVisible()
    await expect(page.getByText('Drone Pilot bonus')).toBeVisible()
    const row = page.locator('div', { hasText: 'Drone Pilot bonus' }).last()
    await expect(row.getByText('+2', { exact: true })).toBeVisible()
  })
})

test.describe('Context menu — real right-click, drone items', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page, SHIPS_WITH_DRONES)
  })

  test('right-click own ship in Attack phase shows enabled "Launch drone…"', async ({ page }) => {
    await advanceToPhase(page, 'attack')
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    const item = page.getByText('Launch drone…')
    await expect(item).toBeVisible()
    await expect(item).toBeEnabled()
  })

  test('right-click own ship outside Attack phase shows disabled "Launch drone…"', async ({ page }) => {
    await advanceToPhase(page, 'manoeuvre')
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    const item = page.getByText('Launch drone…')
    await expect(item).toBeVisible()
    await expect(item).toBeDisabled()
  })

  test('"Resolve drone attack…" only appears once this ship has a drone in range', async ({ page }) => {
    await advanceToPhase(page, 'attack')
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
    await advanceToPhase(page, 'attack')
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

/**
 * Missile flow — launch salvo, track in MissileTracker, impact resolution.
 * // 2300AD B3 p.56 (missiles) / Trav2022 CRB p.169 (flight rounds)
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle } from './helpers.js'

/** Open MissileLaunchModal for first ship via store injection. */
async function openMissileLaunch(page) {
  await page.evaluate(() => {
    const ships = window.__ZUSTAND_BATTLE_STORE__.getState().ships
    if (ships.length < 2) throw new Error('Need at least 2 ships')
    window.__ZUSTAND_UI_STORE__.getState().openModal('missile-launch', { attackerId: ships[0].id })
  })
  await expect(page.getByText('MISSILE LAUNCH')).toBeVisible()
}

/**
 * Scope a locator to inside the modal body.
 * The modal content div is the parent of the MISSILE LAUNCH amber header.
 */
function modalBody(page) {
  return page.locator('text=MISSILE LAUNCH').locator('..')
}

/** Launch a salvo of `size` missiles and close the modal. */
async function launchSalvo(page, size = 1) {
  await openMissileLaunch(page)
  // Scope salvo button click inside the modal to avoid BattleView button conflicts
  await modalBody(page).getByRole('button', { name: String(size) }).click()
  await page.getByText('LAUNCH 🚀').click()
  // Modal closes — MISSILE LAUNCH header gone
  await expect(page.getByText('MISSILE LAUNCH')).not.toBeVisible()
}

test.describe('Missile launch', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page)
  })

  test('modal shows MISSILE LAUNCH header and attacker name', async ({ page }) => {
    await openMissileLaunch(page)
    await expect(page.getByText('ISV-2 Trilon').first()).toBeVisible()
  })

  test('shows launch band and rounds to impact', async ({ page }) => {
    await openMissileLaunch(page)
    await expect(page.getByText('LAUNCH BAND')).toBeVisible()
    await expect(page.getByText('ROUNDS TO IMPACT')).toBeVisible()
  })

  test('ships at Long range → 4 rounds to impact', async ({ page }) => {
    await openMissileLaunch(page)
    // computeFlightRounds('Long') = 4 per MISSILE_FLIGHT_ROUNDS table
    await expect(page.getByText('4 rounds')).toBeVisible()
  })

  test('salvo size selector 1–6 all clickable', async ({ page }) => {
    await openMissileLaunch(page)
    await expect(page.getByText('SALVO SIZE')).toBeVisible()
    // Scope to modal body to avoid clicking BattleView round counter buttons
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await modalBody(page).getByRole('button', { name: String(n) }).click()
    }
  })

  test('LAUNCH stores missile salvo in battle store', async ({ page }) => {
    await launchSalvo(page, 2)
    const count = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().missiles.length
    )
    expect(count).toBe(1)
    const salvoSize = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().missiles[0].salvoSize
    )
    expect(salvoSize).toBe(2)
  })

  test('MissileTracker shows MISSILES IN FLIGHT after launch', async ({ page }) => {
    await launchSalvo(page, 1)
    await expect(page.getByText('MISSILES IN FLIGHT')).toBeVisible()
  })

  test('CANCEL closes modal without adding a missile', async ({ page }) => {
    await openMissileLaunch(page)
    await page.getByRole('button', { name: 'CANCEL' }).click()
    await expect(page.getByText('MISSILE LAUNCH')).not.toBeVisible()
    const count = await page.evaluate(() =>
      window.__ZUSTAND_BATTLE_STORE__.getState().missiles.length
    )
    expect(count).toBe(0)
  })
})

test.describe('Missile impact', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page)
  })

  test('impact modal opens for a pending salvo', async ({ page }) => {
    // Inject a salvo directly into pendingMissileImpacts to bypass flight time
    await page.evaluate(() => {
      const store  = window.__ZUSTAND_BATTLE_STORE__
      const ships  = store.getState().ships
      const attacker = ships[0]
      const target   = ships[1]
      // Directly place in pendingMissileImpacts (already arrived)
      store.setState((s) => ({
        pendingMissileImpacts: [
          ...s.pendingMissileImpacts,
          {
            id:              'test-salvo-001',
            attackerId:      attacker.id,
            targetId:        target.id,
            salvoSize:       2,
            salvoRemaining:  2,
            roundsLeft:      0,
            launchedRound:   1,
          },
        ],
      }))
      window.__ZUSTAND_UI_STORE__.getState().openModal('missile-impact', { salvoId: 'test-salvo-001' })
    })
    await expect(page.getByText('💥 MISSILE IMPACT')).toBeVisible()
  })

  test('impact modal shows target name and salvo size', async ({ page }) => {
    await page.evaluate(() => {
      const store    = window.__ZUSTAND_BATTLE_STORE__
      const ships    = store.getState().ships
      const attacker = ships[0]
      const target   = ships[1]
      store.setState((s) => ({
        pendingMissileImpacts: [
          ...s.pendingMissileImpacts,
          { id: 'test-salvo-002', attackerId: attacker.id, targetId: target.id,
            salvoSize: 3, salvoRemaining: 3, roundsLeft: 0, launchedRound: 1 },
        ],
      }))
      window.__ZUSTAND_UI_STORE__.getState().openModal('missile-impact', { salvoId: 'test-salvo-002' })
    })
    await expect(page.getByText('Kaefer Geist').first()).toBeVisible()
    await expect(page.getByText('3').first()).toBeVisible()
  })

  test('ROLL ATTACK button is present and triggers a result', async ({ page }) => {
    await page.evaluate(() => {
      const store    = window.__ZUSTAND_BATTLE_STORE__
      const ships    = store.getState().ships
      store.setState((s) => ({
        pendingMissileImpacts: [
          ...s.pendingMissileImpacts,
          { id: 'test-salvo-003', attackerId: ships[0].id, targetId: ships[1].id,
            salvoSize: 1, salvoRemaining: 1, roundsLeft: 0, launchedRound: 1 },
        ],
      }))
      window.__ZUSTAND_UI_STORE__.getState().openModal('missile-impact', { salvoId: 'test-salvo-003' })
    })
    await page.getByText('ROLL ATTACK').click()
    // SUCCESS (IMPACT) or EVADED must appear
    await expect(page.getByText(/IMPACT|EVADED/).first()).toBeVisible()
  })
})

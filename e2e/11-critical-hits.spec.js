/**
 * CriticalHitModal — Surface Fixture (B3 p.58) + Internal Critical Hit
 * (CRB location/effects tables + 2300AD substitutions, rebuilt for issue #23).
 */

import { test, expect } from '@playwright/test'
import { clearAppState, gotoBattle, fullCrew } from './helpers.js'

/** Inject a single ship and open the CriticalHitModal directly with the given payload. */
async function openCriticalHit(page, payload) {
  const shipId = await page.evaluate(({ crewInfo }) => {
    const store = window.__ZUSTAND_BATTLE_STORE__
    store.getState().addShip(
      {
        name: 'ISV-2 Trilon', class: 'Test class', hullPoints: 20, armour: 3,
        tacSpeed: 4, signature: 2,
        sensors: { type: 'Basic Military', dm: 0 },
        computer: { model: 'TL-10', bandwidth: 20 },
        weapons: [], software: ['fire_control_1'],
        ...crewInfo,
      },
      'players', 'Close',
    )
    return store.getState().ships[0].id
  }, { crewInfo: fullCrew() })

  await page.evaluate(({ shipId, payload }) => {
    window.__ZUSTAND_UI_STORE__.getState().openModal('critical-hit', { shipId, ...payload })
  }, { shipId, payload })

  return shipId
}

test.describe('CriticalHitModal — Surface Fixture (regression)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('opens and shows the SURFACE FIXTURE header', async ({ page }) => {
    await openCriticalHit(page, { mode: 'surface', effect: 4 })
    await expect(page.getByText('SURFACE FIXTURE')).toBeVisible()
  })
})

test.describe('CriticalHitModal — Internal Critical Hit', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('rolling location 2 shows Sensors', async ({ page }) => {
    await openCriticalHit(page, { mode: 'internal', effect: 8 })
    await page.locator('input[type="number"]').first().fill('2')
    await expect(page.locator('p.text-red-300').filter({ hasText: 'Sensors' })).toBeVisible()
  })

  test('location 8 shows Reaction Drive, not Stutterwarp Drive', async ({ page }) => {
    await openCriticalHit(page, { mode: 'internal', effect: 8 })
    await page.locator('input[type="number"]').first().fill('8')
    await expect(page.locator('p.text-red-300').filter({ hasText: 'Reaction Drive' })).toBeVisible()
  })

  test('location 10 shows Stutterwarp Drive', async ({ page }) => {
    await openCriticalHit(page, { mode: 'internal', effect: 8 })
    await page.locator('input[type="number"]').first().fill('10')
    await expect(page.locator('p.text-red-300').filter({ hasText: 'Stutterwarp Drive' })).toBeVisible()
  })

  test('location 9 shows Cargo (previously missing entirely)', async ({ page }) => {
    await openCriticalHit(page, { mode: 'internal', effect: 8 })
    await page.locator('input[type="number"]').first().fill('9')
    await expect(page.locator('p.text-red-300').filter({ hasText: 'Cargo' })).toBeVisible()
  })

  test('Effect 8 on a fresh system computes Severity 3 (Effect-5), not a flat +1', async ({ page }) => {
    const shipId = await openCriticalHit(page, { mode: 'internal', effect: 8 })
    await page.locator('input[type="number"]').first().fill('2') // Sensors
    await page.getByText('APPLY CRITICAL').click()
    const severity = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).criticalTracks.sensors
    , shipId)
    expect(severity).toBe(3)
  })

  test('stacking rule: a repeat low-Effect hit still bumps severity by previous+1', async ({ page }) => {
    // First hit: Effect 6 → severity 1
    const shipId = await openCriticalHit(page, { mode: 'internal', effect: 6 })
    await page.locator('input[type="number"]').first().fill('2') // Sensors
    await page.getByText('APPLY CRITICAL').click()
    await page.getByText('CLOSE').click()

    // Second hit: same low Effect 6 (would compute to 1 again from Effect-5 alone),
    // but the stacking rule (previous+1) should push it to 2, not leave it at 1.
    await page.evaluate((id) =>
      window.__ZUSTAND_UI_STORE__.getState().openModal('critical-hit', { shipId: id, mode: 'internal', effect: 6 })
    , shipId)
    await page.locator('input[type="number"]').first().fill('2')
    await page.getByText('APPLY CRITICAL').click()
    const severity = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).criticalTracks.sensors
    , shipId)
    expect(severity).toBe(2)
  })

  test('a system already at max severity shows the overflow note instead of APPLY CRITICAL', async ({ page }) => {
    const shipId = await openCriticalHit(page, { mode: 'internal', effect: 12 })
    await page.locator('input[type="number"]').first().fill('2') // Sensors → severity 7 capped to 6
    await page.getByText('APPLY CRITICAL').click()
    await page.getByText('CLOSE').click()

    await page.evaluate((id) =>
      window.__ZUSTAND_UI_STORE__.getState().openModal('critical-hit', { shipId: id, mode: 'internal', effect: 6 })
    , shipId)
    await page.locator('input[type="number"]').first().fill('2')
    await expect(page.getByText('APPLY CRITICAL')).not.toBeVisible()
    await expect(page.getByText('already at max severity')).toBeVisible()
  })

  test('Reaction Drive: first hit shows INOPERABLE, never exceeds severity 2', async ({ page }) => {
    const shipId = await openCriticalHit(page, { mode: 'internal', effect: 6 })
    await page.locator('input[type="number"]').first().fill('8') // Reaction Drive
    await expect(page.locator('span.text-red-400').filter({ hasText: 'INOPERABLE' })).toBeVisible()
    await page.getByText('APPLY CRITICAL').click()
    const severity = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).criticalTracks.reactionDrive
    , shipId)
    expect(severity).toBe(1)
  })

  test('Reaction Drive: second hit shows DESTROYED and caps at severity 2', async ({ page }) => {
    const shipId = await openCriticalHit(page, { mode: 'internal', effect: 12 })
    await page.locator('input[type="number"]').first().fill('8')
    await page.getByText('APPLY CRITICAL').click()
    await page.getByText('CLOSE').click()

    await page.evaluate((id) =>
      window.__ZUSTAND_UI_STORE__.getState().openModal('critical-hit', { shipId: id, mode: 'internal', effect: 12 })
    , shipId)
    await page.locator('input[type="number"]').first().fill('8')
    await expect(page.locator('span.text-red-400').filter({ hasText: 'DESTROYED' })).toBeVisible()
    await page.getByText('APPLY CRITICAL').click()
    const severity = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).criticalTracks.reactionDrive
    , shipId)
    expect(severity).toBe(2)
  })
})

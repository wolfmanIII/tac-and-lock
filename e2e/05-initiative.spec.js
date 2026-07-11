/**
 * InitiativeModal — roll initiative, confirm order, PhaseTracker updates.
 * // 2300AD B3 p.54 — Opposed Tactics(naval) INT check
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle } from './helpers.js'

test.describe('Initiative modal', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page)
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('INITIATIVE').first()).toBeVisible()
  })

  test('ROLL INITIATIVE button opens the modal', async ({ page }) => {
    await page.getByText('🎲 ROLL INITIATIVE →').click()
    await expect(page.getByText('2D6 + Tactics(naval) + INT DM')).toBeVisible()
  })

  test('modal lists both ships', async ({ page }) => {
    await page.getByText('🎲 ROLL INITIATIVE →').click()
    await expect(page.getByText('ISV-2 Trilon').first()).toBeVisible()
    await expect(page.getByText('Kaefer Geist').first()).toBeVisible()
  })

  test('ROLL ALL populates totals above 0', async ({ page }) => {
    await page.getByText('🎲 ROLL INITIATIVE →').click()
    await page.getByText('ROLL ALL').click()
    const inputs = page.locator('input[type="number"]')
    const first  = await inputs.first().inputValue()
    expect(Number(first)).toBeGreaterThan(0)
  })

  test('manual value entry works', async ({ page }) => {
    await page.getByText('🎲 ROLL INITIATIVE →').click()
    const inputs = page.locator('input[type="number"]')
    await inputs.first().fill('12')
    await expect(inputs.first()).toHaveValue('12')
  })

  test('CONFIRM ORDER unblocks NEXT PHASE', async ({ page }) => {
    await page.getByText('🎲 ROLL INITIATIVE →').click()
    await page.getByText('ROLL ALL').click()
    await page.getByText('CONFIRM ORDER').click()
    // Modal closes, NEXT PHASE should now work — advances to 'combat' (no more
    // separate Manoeuvre/Attack/Actions stages // 2300AD B3 p.53)
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('COMBAT').first()).toBeVisible()
  })
})

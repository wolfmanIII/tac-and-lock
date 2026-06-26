/**
 * Phase progression — setup → initiative → manoeuvre → attack → actions → round 2.
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle, advanceToPhase } from './helpers.js'

test.describe('Phase progression', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page)
  })

  test('starts in SETUP phase', async ({ page }) => {
    await expect(page.getByText('SETUP')).toBeVisible()
  })

  test('NEXT PHASE advances to INITIATIVE', async ({ page }) => {
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('INITIATIVE').first()).toBeVisible()
  })

  test('INITIATIVE phase shows Roll Initiative CTA', async ({ page }) => {
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('ROLL INITIATIVE').first()).toBeVisible()
  })

  test('cannot advance past INITIATIVE without rolling', async ({ page }) => {
    await page.getByText('NEXT PHASE ⟶').click() // → initiative
    await page.getByText('NEXT PHASE ⟶').click() // blocked
    await expect(page.getByText('Roll initiative before advancing')).toBeVisible()
    await expect(page.getByText('INITIATIVE').first()).toBeVisible()
  })

  test('full round cycle reaches round 2', async ({ page }) => {
    // advanceToPhase always starts from SETUP — call once to reach MANOEUVRE
    await advanceToPhase(page, 'manoeuvre')
    await expect(page.getByText('MANOEUVRE').first()).toBeVisible()

    // Manually step through remaining phases (we're already past SETUP/INITIATIVE)
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('ATTACK').first()).toBeVisible()

    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('ACTIONS').first()).toBeVisible()

    // ACTIONS → round 2
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('2').first()).toBeVisible()
  })
})

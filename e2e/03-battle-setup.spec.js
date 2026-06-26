/**
 * Battle setup — ships appear on BattleView after being added to the store.
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle } from './helpers.js'

test.describe('Battle setup', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('empty battle shows NO VESSELS message', async ({ page }) => {
    await expect(page.getByText('NO VESSELS')).toBeVisible()
  })

  test('ships appear after being added to store', async ({ page }) => {
    await addShipsToStore(page)
    // Ship name appears in BentoCard header (bold paragraph)
    await expect(page.locator('p.font-bold', { hasText: 'ISV-2 Trilon' })).toBeVisible()
    await expect(page.locator('p.font-bold', { hasText: 'Kaefer Geist' })).toBeVisible()
  })

  test('faction headers appear', async ({ page }) => {
    await addShipsToStore(page)
    await expect(page.getByText('GIOCATORI')).toBeVisible()
    await expect(page.getByText('NPC')).toBeVisible()
  })

  test('DISTANCES section shows pair range band', async ({ page }) => {
    await addShipsToStore(page)
    await expect(page.getByText('DISTANCES')).toBeVisible()
    await expect(page.getByText('Long').first()).toBeVisible()
  })

  test('ship card shows HULL label', async ({ page }) => {
    await addShipsToStore(page)
    await expect(page.getByText('HULL').first()).toBeVisible()
  })

  test('right-click background shows Add ship menu', async ({ page }) => {
    await page.mouse.click(400, 300, { button: 'right' })
    await expect(page.getByText('Add ship…')).toBeVisible()
  })
})

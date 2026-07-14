/**
 * Ship token shape — picker in AddShipModal (category-derived default +
 * manual override) and the resulting token preview shown on the bento card
 * and in ShipDetailModal.
 */

import { test, expect } from '@playwright/test'
import { clearAppState, gotoBattle, addShipsToStore, resetProfilesToDefaults } from './helpers.js'

test.describe('Token shape picker — AddShipModal', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await resetProfilesToDefaults(page)
    await gotoBattle(page)
    await page.mouse.click(400, 300, { button: 'right' })
    await page.getByText('Add ship…').click()
  })

  test('shows all 5 shape options', async ({ page }) => {
    await expect(page.getByText('Token shape')).toBeVisible()
    for (const label of ['Frigate', 'Scout', 'Freighter', 'Courier', 'Alien']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
    }
  })

  test('defaults to the profile category shape and switches with profile selection', async ({ page }) => {
    // BSS Cavendish — category 'scout' — default shape is Scout
    await page.getByRole('button', { name: /BSS Cavendish/ }).click()
    await expect(page.getByRole('button', { name: 'Scout', exact: true })).toHaveClass(/bronze-400/)

    // Martel GAS-77 — category 'military' — default shape is Frigate
    await page.getByRole('button', { name: /Martel GAS-77/ }).click()
    await expect(page.getByRole('button', { name: 'Frigate', exact: true })).toHaveClass(/bronze-400/)
    await expect(page.getByRole('button', { name: 'Scout', exact: true })).not.toHaveClass(/bronze-400/)
  })

  test('manual shape selection overrides the category default', async ({ page }) => {
    await page.getByRole('button', { name: /BSS Cavendish/ }).click()
    await expect(page.getByRole('button', { name: 'Scout', exact: true })).toHaveClass(/bronze-400/)

    await page.getByRole('button', { name: 'Alien', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Alien', exact: true })).toHaveClass(/bronze-400/)
    await expect(page.getByRole('button', { name: 'Scout', exact: true })).not.toHaveClass(/bronze-400/)
  })

  test('switching profile resets a manual override back to the new category default', async ({ page }) => {
    await page.getByRole('button', { name: /BSS Cavendish/ }).click()
    await page.getByRole('button', { name: 'Alien', exact: true }).click()

    await page.getByRole('button', { name: /Martel GAS-77/ }).click()
    await expect(page.getByRole('button', { name: 'Frigate', exact: true })).toHaveClass(/bronze-400/)
    await expect(page.getByRole('button', { name: 'Alien', exact: true })).not.toHaveClass(/bronze-400/)
  })

  test('confirming adds the ship with the chosen token shape', async ({ page }) => {
    await page.getByRole('button', { name: /BSS Cavendish/ }).click()
    await page.getByRole('button', { name: 'Alien', exact: true }).click()
    await page.getByText('ADD TO BATTLE').click()

    await expect(page.locator('p.font-bold', { hasText: 'BSS Cavendish' })).toBeVisible()

    const tokenShape = await page.evaluate(() => {
      const ships = window.__ZUSTAND_BATTLE_STORE__.getState().ships
      return ships.find((s) => s.profile?.name === 'BSS Cavendish')?.profile?.tokenShape
    })
    expect(tokenShape).toBe('alien')
  })
})

test.describe('Ship token preview — ShipDetailModal', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('ship sheet shows a single token canvas', async ({ page }) => {
    await addShipsToStore(page)
    await page.locator('.cursor-context-menu').filter({ hasText: 'ISV-2 Trilon' }).click({ button: 'right' })
    await page.getByText('Ship sheet').click()

    const modal = page.locator('.fixed.inset-0.z-50')
    await expect(modal.getByText('ISV-2 Trilon')).toBeVisible()
    await expect(modal.locator('canvas')).toHaveCount(1)
  })
})

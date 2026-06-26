/**
 * Smoke tests — app loads, core screens render without errors.
 */

import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /TAC.*LOCK/i })).toBeVisible()
    await expect(page.getByText('SHIP PROFILES')).toBeVisible()
    await expect(page.getByText('ENTER BATTLE')).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('legal footer is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Mongoose Publishing' })).toBeVisible()
  })

  test('enter battle shows BattleView', async ({ page }) => {
    await page.goto('/')
    await page.getByText('ENTER BATTLE').click()
    await expect(page.getByText('NO VESSELS')).toBeVisible()
  })

  test('HUD shows ROUND 1 in battle', async ({ page }) => {
    await page.goto('/')
    await page.getByText('ENTER BATTLE').click()
    await expect(page.getByText('ROUND')).toBeVisible()
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible()
  })
})

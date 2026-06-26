/**
 * Ship profile management — create, appear in list, persist.
 */

import { test, expect } from '@playwright/test'
import { clearAppState } from './helpers.js'

test.describe('Profile management', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
  })

  test('+ NEW PROFILE opens the form', async ({ page }) => {
    await page.getByText('+ NEW PROFILE').click()
    await expect(page.getByPlaceholder('ISV Nomad')).toBeVisible()
  })

  test('create a profile and see it in the list', async ({ page }) => {
    await page.getByText('+ NEW PROFILE').click()
    await page.getByPlaceholder('ISV Nomad').fill('ISV Testaguzza')
    await page.getByText('+ CREATE PROFILE').click()
    await expect(page.getByText('ISV Testaguzza')).toBeVisible()
  })

  test('profile count increments', async ({ page }) => {
    await expect(page.getByText('SHIP PROFILES (0)')).toBeVisible()
    await page.getByText('+ NEW PROFILE').click()
    await page.getByPlaceholder('ISV Nomad').fill('Nave Alpha')
    await page.getByText('+ CREATE PROFILE').click()
    await expect(page.getByText('SHIP PROFILES (1)')).toBeVisible()
  })

  test('catalog opens and shows ships', async ({ page }) => {
    await page.getByText('📖 OFFICIAL CATALOG').click()
    await expect(page.getByText('SHIP CATALOG')).toBeVisible()
    await expect(page.getByText('Sauvetage').first()).toBeVisible()
  })

  test('add ship from catalog to profiles', async ({ page }) => {
    await page.getByText('📖 OFFICIAL CATALOG').click()
    await page.getByRole('button', { name: '+ Profile' }).first().click()
    await expect(page.getByText('SHIP PROFILES (1)')).toBeVisible()
  })

  test('search filters profiles by name', async ({ page }) => {
    // Create two profiles
    await page.getByText('+ NEW PROFILE').click()
    await page.getByPlaceholder('ISV Nomad').fill('Alpha Ship')
    await page.getByText('+ CREATE PROFILE').click()

    await page.getByText('+ NEW PROFILE').click()
    await page.getByPlaceholder('ISV Nomad').fill('Beta Ship')
    await page.getByText('+ CREATE PROFILE').click()

    await page.getByPlaceholder('Search profile…').fill('alpha')
    await expect(page.getByText('Alpha Ship')).toBeVisible()
    await expect(page.getByText('Beta Ship')).not.toBeVisible()
  })
})

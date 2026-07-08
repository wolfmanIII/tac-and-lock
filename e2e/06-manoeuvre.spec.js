/**
 * ManoeuvreModal — range band changes, evasion, GM override.
 * // 2300AD B3 p.55
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle } from './helpers.js'

/** Open ManoeuvreModal via Zustand (avoids fragile right-click targeting). */
async function openManoeuvre(page) {
  await page.evaluate(() => {
    const ships = window.__ZUSTAND_BATTLE_STORE__.getState().ships
    if (ships.length < 2) throw new Error('Need at least 2 ships')
    window.__ZUSTAND_UI_STORE__.getState().openModal('manoeuvre', {
      shipAId: ships[0].id,
      shipBId: ships[1].id,
    })
  })
  await expect(page.getByText('MANOEUVRE').first()).toBeVisible()
}

test.describe('ManoeuvreModal', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page)
  })

  test('modal opens with MANOEUVRE title', async ({ page }) => {
    await openManoeuvre(page)
    await expect(page.getByText('CURRENT RANGE')).toBeVisible()
  })

  test('shows current range band (Long for injected ships)', async ({ page }) => {
    await openManoeuvre(page)
    // Ships are injected at Long range
    await expect(page.getByText('Long').first()).toBeVisible()
  })

  test('acting-ship picker shows both ship names', async ({ page }) => {
    await openManoeuvre(page)
    await expect(page.getByRole('button', { name: 'ISV-2 Trilon' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kaefer Geist' })).toBeVisible()
  })

  test('selecting acting ship shows CLOSE / OPEN intent buttons', async ({ page }) => {
    await openManoeuvre(page)
    await page.getByRole('button', { name: 'ISV-2 Trilon' }).click()
    await expect(page.getByText('◀ CLOSE (approach)')).toBeVisible()
    await expect(page.getByText('OPEN (flee) ▶')).toBeVisible()
  })

  test('picking acting ship + intent shows ROLL button, rolling shows the opposed check breakdown', async ({ page }) => {
    await openManoeuvre(page)
    await page.getByRole('button', { name: 'ISV-2 Trilon' }).click()
    await page.getByText('◀ CLOSE (approach)').click()
    await expect(page.getByRole('button', { name: 'ROLL 🎲' })).toBeVisible()
    await page.getByRole('button', { name: 'ROLL 🎲' }).click()
    // Breakdown lines for both ships' opposed Pilot checks
    await expect(page.getByText('ISV-2 Trilon:', { exact: false })).toBeVisible()
    await expect(page.getByText('Kaefer Geist:', { exact: false })).toBeVisible()
  })

  test('GM Override section is always present', async ({ page }) => {
    await openManoeuvre(page)
    await expect(page.getByText('GM OVERRIDE — SET BAND DIRECTLY')).toBeVisible()
    // Scope to the modal body (parent of the amber-colored MANOEUVRE header)
    // All 7 band buttons are in the override grid; use adjacent/close/short to avoid
    // ambiguity with the BattleView's "Long" range band buttons
    const modal = page.locator('text=GM OVERRIDE — SET BAND DIRECTLY').locator('..').locator('..')
    for (const band of ['Adjacent', 'Close', 'Short', 'Medium', 'Distant']) {
      await expect(modal.getByRole('button', { name: band })).toBeVisible()
    }
  })

  test('GM Override sets band directly and APPLY closes modal', async ({ page }) => {
    await openManoeuvre(page)
    // Scope to modal body to avoid ambiguity with BattleView band buttons
    const modal = page.locator('text=GM OVERRIDE — SET BAND DIRECTLY').locator('..').locator('..')
    await modal.getByRole('button', { name: 'Close' }).click()
    await page.getByRole('button', { name: 'APPLY' }).click()
    // Modal closes — MANOEUVRE header gone, battle view back
    await expect(page.getByText('CURRENT RANGE')).not.toBeVisible()
  })

  test('Evasion section shows EVADE buttons for both ships', async ({ page }) => {
    await openManoeuvre(page)
    await expect(page.getByText('EVASION — OPPOSED PILOT (DEX)')).toBeVisible()
    const evasionButtons = page.getByRole('button', { name: 'EVADE 🎲' })
    await expect(evasionButtons).toHaveCount(2)
  })

  test('rolling evasion shows DM result', async ({ page }) => {
    await openManoeuvre(page)
    await page.getByRole('button', { name: 'EVADE 🎲' }).first().click()
    await expect(page.getByText('Evasion DM:').first()).toBeVisible()
  })
})

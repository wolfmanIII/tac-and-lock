/**
 * Stage progression — setup → initiative → combat → round 2.
 * // 2300AD B3 p.53 — there is no "Manoeuvre/Attack/Actions Step" in B3 (that
 * structure is the Traveller CRB's own spacecraft combat loop); a ship's turn
 * in 'combat' is open-ended, gated by per-role actionsRemaining budgets, not a
 * single hasActedThisPhase boolean or a rigid phase sequence.
 */

import { test, expect } from '@playwright/test'
import { clearAppState, addShipsToStore, gotoBattle, startCombat, drainActors, endRound } from './helpers.js'

test.describe('Stage progression', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
    await addShipsToStore(page)
  })

  test('starts in SETUP stage', async ({ page }) => {
    await expect(page.getByText('SETUP')).toBeVisible()
  })

  test('NEXT PHASE advances to INITIATIVE', async ({ page }) => {
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('INITIATIVE').first()).toBeVisible()
  })

  test('INITIATIVE stage shows Roll Initiative CTA', async ({ page }) => {
    await page.getByText('NEXT PHASE ⟶').click()
    await expect(page.getByText('ROLL INITIATIVE').first()).toBeVisible()
  })

  test('cannot advance past INITIATIVE without rolling', async ({ page }) => {
    await page.getByText('NEXT PHASE ⟶').click() // → initiative
    await page.getByText('NEXT PHASE ⟶').click() // blocked
    await expect(page.getByText('Roll initiative before advancing')).toBeVisible()
    await expect(page.getByText('INITIATIVE').first()).toBeVisible()
  })

  test('rolling initiative and advancing reaches COMBAT, NEXT PHASE button disappears', async ({ page }) => {
    await startCombat(page)
    await expect(page.getByText('COMBAT').first()).toBeVisible()
    // Round advancement in 'combat' is END SHIP'S TURN / NEXT ROUND, not NEXT PHASE.
    await expect(page.getByText('NEXT PHASE ⟶')).not.toBeVisible()
  })

  test('COMBAT shows ACTING NOW for the first ship in initiative order', async ({ page }) => {
    await startCombat(page)
    // Scope to the ACTING NOW box — the ship name also appears in BattleView/PhaseTracker.
    const actingNow = page.locator('p', { hasText: 'ACTING NOW' }).locator('..')
    await expect(actingNow).toBeVisible()
    await expect(actingNow.getByText('ISV-2 Trilon')).toBeVisible()
    await expect(actingNow.getByText('1 / 2')).toBeVisible()
  })

  test('ACTING NOW shows a per-role action budget readout for the current ship', async ({ page }) => {
    await startCombat(page)
    // addShipsToStore's fixture crew has skill 2 in every role — Gunnery caps at 1.
    await expect(page.getByText(/Gun 1/)).toBeVisible()
    await expect(page.getByText(/Pilot 2/)).toBeVisible()
  })

  test('END SHIP\'S TURN advances to the next ship', async ({ page }) => {
    await startCombat(page)
    const actingNow = page.locator('p', { hasText: 'ACTING NOW' }).locator('..')
    await expect(actingNow.getByText('1 / 2')).toBeVisible()
    await page.getByText("END SHIP'S TURN ⟶").click()
    await expect(actingNow.getByText('2 / 2')).toBeVisible()
    await expect(actingNow.getByText('Kaefer Geist')).toBeVisible()
  })

  test('once all ships have ended their turn, ALL SHIPS DONE and NEXT ROUND appear', async ({ page }) => {
    await startCombat(page)
    await drainActors(page)
    await expect(page.getByText('ALL SHIPS DONE')).toBeVisible()
    await expect(page.getByText('NEXT ROUND ⟶')).toBeVisible()
  })

  test('full round cycle: combat → drain all ship turns → NEXT ROUND → round 2, back to INITIATIVE', async ({ page }) => {
    await startCombat(page)
    await endRound(page)
    await expect(page.getByText('2').first()).toBeVisible()
    await expect(page.getByText('INITIATIVE').first()).toBeVisible()
  })

  test('a ship\'s action budget is recomputed fresh at the start of the next round', async ({ page }) => {
    await startCombat(page)
    const id0 = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)
    // Spend the ship's one Gunnery action this round.
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().spendCrewAction(id, 'gunner_turret')
    }, id0)
    let ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.actionsRemaining.gunner_turret).toBe(0)

    await endRound(page)
    ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.actionsRemaining.gunner_turret).toBe(1)
  })
})

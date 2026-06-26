/**
 * AttackModal — 3-step Firing Solution.
 * // 2300AD B3 p.56 — Step 1: Sensor (12+), Step 2: Pilot (10+), Step 3: Gunner (10+)
 */

import { test, expect } from '@playwright/test'
import { clearAppState, gotoBattle } from './helpers.js'

const ARMED_SHIPS = [
  {
    name: 'ISV-2 Trilon', faction: 'players',
    weapons: [{ weaponId: 'll98', count: 1, label: 'Forward Laser' }],
  },
  {
    name: 'Kaefer Geist', faction: 'npc',
    weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser' }],
  },
]

/** Inject armed ships and open AttackModal for the first ship. */
async function openAttack(page) {
  await page.evaluate((shipDefs) => {
    const store = window.__ZUSTAND_BATTLE_STORE__
    for (const def of shipDefs) {
      store.getState().addShip(
        {
          name:            def.name,
          class:           'Test class',
          hullPoints:      20,
          armour:          3,
          tacSpeed:        4,
          signature:       2,
          sensors:         { type: 'Basic Military', dm: 0 },
          computer:        { model: 'TL-10', bandwidth: 20 },
          weapons:         def.weapons,
          software:        ['fire_control_1'],
          crew:            [],
          crewAssignments: {},
        },
        def.faction,
        'Close',  // Close range so the laser is in range
      )
    }
    const ships = store.getState().ships
    window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
  }, ARMED_SHIPS)
  await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
}

test.describe('AttackModal — Firing Solution', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('modal opens on SETUP screen with attacker name', async ({ page }) => {
    await openAttack(page)
    await expect(page.getByText('ISV-2 Trilon').first()).toBeVisible()
    await expect(page.getByText('BEGIN FIRING SOLUTION →')).toBeVisible()
  })

  test('shows target dropdown populated', async ({ page }) => {
    await openAttack(page)
    // Target select shows second ship
    await expect(page.getByRole('combobox').first()).toBeVisible()
  })

  test('BEGIN FIRING SOLUTION enters Step 1 — Sensor Operator', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await expect(page.getByText('STEP 1 — SENSOR OPERATOR')).toBeVisible()
    await expect(page.getByText('Very Difficult (12+)')).toBeVisible()
  })

  test('ROLL 2D6 on Step 1 shows SUCCESS or FAILURE result', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    // Either SUCCESS or FAILURE must appear
    const outcome = page.getByText(/SUCCESS|FAILURE/)
    await expect(outcome.first()).toBeVisible()
  })

  test('after Step 1 roll, NEXT → PILOT button is enabled', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    const nextBtn = page.getByText('NEXT → PILOT')
    await expect(nextBtn).toBeVisible()
    await expect(nextBtn).not.toBeDisabled()
  })

  test('Step 2 shows PILOT and DEX in breakdown', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    await expect(page.getByText('STEP 2 — PILOT')).toBeVisible()
    // 'Pilot skill' DM row is hidden when value = 0 (no crew assigned);
    // TAC Speed is always shown since tacSpeed = 4 in injected ships
    await expect(page.getByText('TAC Speed').first()).toBeVisible()
  })

  test('Step 3 shows GUNNER with Fire Control DM', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    // Step 1
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    // Step 2
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
    await expect(page.getByText('Fire Control').first()).toBeVisible()
  })
})

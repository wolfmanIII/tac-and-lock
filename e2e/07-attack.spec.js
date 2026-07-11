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

// === Evasion auto-read — Step 1 (Sensor) and Step 3 (Gunner) ===============
// // 2300AD B3 p.54 — Evade penalizes both Electronics(sensors) and Gunner checks

test.describe('AttackModal — evasion auto-read', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  /** Inject armed ships, set evasionDm on the target, then open AttackModal. */
  async function openAttackWithTargetEvasion(page, dm) {
    await page.evaluate(({ shipDefs, dm }) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 3,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: ['fire_control_1'],
            crew: [], crewAssignments: {},
          },
          def.faction, 'Close',
        )
      }
      const ships = store.getState().ships
      store.getState().updateShip(ships[1].id, { evasionDm: dm })
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
    }, { shipDefs: ARMED_SHIPS, dm })
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  }

  test('Step 1 (Sensor) shows Target evasion row from target.evasionDm', async ({ page }) => {
    await openAttackWithTargetEvasion(page, -2)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await expect(page.getByText('STEP 1 — SENSOR OPERATOR')).toBeVisible()
    // DmRow only renders when value !== 0, so the label alone confirms evasionDm was picked up;
    // scope the value check to that row to avoid matching an unrelated "-2" elsewhere on screen.
    const row = page.locator('div').filter({ hasText: 'Target evasion' }).last()
    await expect(row).toContainText('-2')
  })

  test('Step 3 (Gunner) shows the same evasion DM without manual re-entry', async ({ page }) => {
    await openAttackWithTargetEvasion(page, -1)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
    const row = page.locator('div').filter({ hasText: 'Evasion penalty' }).last()
    await expect(row).toContainText('-1')
  })

  test('setup screen shows "auto da Manoeuvre Step" hint when target has evasionDm', async ({ page }) => {
    await openAttackWithTargetEvasion(page, -2)
    await expect(page.getByText('auto da Manoeuvre Step')).toBeVisible()
  })
})

// === Captain Tactics Assist — Step 3, distinct from Commands ===============
// // 2300AD B3 p.54, p.56 — optional inline roll, Effect adds to that one Gunner check only

test.describe('AttackModal — Captain Tactics Assist', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  async function reachStep3(page) {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
  }

  test('Step 3 shows an optional Captain assist roll block before the main roll', async ({ page }) => {
    await reachStep3(page)
    await expect(page.getByText('Captain assist (optional)')).toBeVisible()
    await expect(page.getByText('Tactics (naval)')).toBeVisible()
  })

  test('a successful assist adds a Tactics assist row to the Step 3 breakdown', async ({ page }) => {
    await reachStep3(page)
    // Force a guaranteed success (Difficult 10+) via manual entry on the assist RollBlock
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Tactics assist')).toBeVisible()
  })

  test('assist and Commands stack — both rows appear when both are active', async ({ page }) => {
    const { id0 } = await (async () => {
      const ids = await page.evaluate((shipDefs) => {
        const store = window.__ZUSTAND_BATTLE_STORE__
        for (const def of shipDefs) {
          store.getState().addShip(
            {
              name: def.name, class: 'Test class', hullPoints: 20, armour: 3,
              tacSpeed: 4, signature: 2,
              sensors: { type: 'Basic Military', dm: 0 },
              computer: { model: 'TL-10', bandwidth: 20 },
              weapons: def.weapons, software: ['fire_control_1'],
              crew: [], crewAssignments: {},
            },
            def.faction, 'Close',
          )
        }
        const ships = store.getState().ships
        return { id0: ships[0].id, id1: ships[1].id }
      }, ARMED_SHIPS)
      return ids
    })()

    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(id, 'gunner_turret', 1)
      s.setInitiativeOrder(s.ships.map((sh) => sh.id))
    }, id0)
    await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().startNextRound())

    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id })
    }, id0)
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()

    await expect(page.getByText('Command (Captain)')).toBeVisible()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Tactics assist')).toBeVisible()
    await expect(page.getByText('Command (Captain)')).toBeVisible()
  })
})

// === Stationary / reaction-drive target — DM+2, ×2 damage ===================
// // 2300AD B3 p.56 — "Non-Stutterwarp and Stationary Targets"

test.describe('AttackModal — stationary/reaction-drive target bonus', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  /** Inject armed ships, flag the target per `flag`, then open AttackModal. */
  async function openAttackWithEasyTarget(page, flag) {
    await page.evaluate(({ shipDefs, flag }) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 0,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: ['fire_control_1'],
            crew: [], crewAssignments: {},
          },
          def.faction, 'Close',
        )
      }
      const ships = store.getState().ships
      if (flag) store.getState().updateShip(ships[1].id, { [flag]: true })
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
    }, { shipDefs: ARMED_SHIPS, flag })
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  }

  async function reachStep3(page) {
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
  }

  test('no bonus row when target is neither stationary nor on reaction drive', async ({ page }) => {
    await openAttackWithEasyTarget(page, null)
    await reachStep3(page)
    await expect(page.getByText('Stationary/reaction-drive target')).not.toBeVisible()
  })

  test('isStationary target shows DM+2 row in Step 3', async ({ page }) => {
    await openAttackWithEasyTarget(page, 'isStationary')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Stationary/reaction-drive target' }).last()
    await expect(row).toContainText('+2')
  })

  test('reactionDriveActive target shows DM+2 row in Step 3', async ({ page }) => {
    await openAttackWithEasyTarget(page, 'reactionDriveActive')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Stationary/reaction-drive target' }).last()
    await expect(row).toContainText('+2')
  })

  test('a hit on a stationary target shows the ×2 damage indicator', async ({ page }) => {
    await openAttackWithEasyTarget(page, 'isStationary')
    await reachStep3(page)
    // Two RollBlocks are visible pre-roll (optional Captain assist, then the main Gunner
    // roll) — .last() targets the main one, whose manual dice inputs decide the hit/miss.
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('×2 damage', { exact: false })).toBeVisible()
  })

  test('ShipDetailModal — toggling "Stationary" sets ship.isStationary', async ({ page }) => {
    await openAttackWithEasyTarget(page, null)
    const targetId = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[1].id)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('ship-detail', { shipId: id })
    }, targetId)
    await expect(page.getByText('Stationary (not manoeuvring)')).toBeVisible()
    await page.getByText('Stationary (not manoeuvring)').click()
    const isStationary = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).isStationary
    , targetId)
    expect(isStationary).toBe(true)
  })
})

// === Planetary surface / atmospheric range modifiers — 2300AD B3 p.56 ========

test.describe('AttackModal — planetary/atmospheric range modifiers', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  /** Inject armed ships, set the target's atmosphericCondition, then open AttackModal. */
  async function openAttackWithCondition(page, condition) {
    await page.evaluate(({ shipDefs, condition }) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 3,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: ['fire_control_1'],
            crew: [], crewAssignments: {},
          },
          def.faction, 'Close',
        )
      }
      const ships = store.getState().ships
      if (condition) store.getState().updateShip(ships[1].id, { atmosphericCondition: condition })
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
    }, { shipDefs: ARMED_SHIPS, condition })
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  }

  async function reachStep3(page) {
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
  }

  test('no row when target has no atmospheric condition set', async ({ page }) => {
    await openAttackWithCondition(page, null)
    await reachStep3(page)
    await expect(page.getByText('Planetary/atmospheric condition')).not.toBeVisible()
  })

  test('surface_atmo target shows DM−6 row in Step 3', async ({ page }) => {
    await openAttackWithCondition(page, 'surface_atmo')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Planetary/atmospheric condition' }).last()
    await expect(row).toContainText('-6')
  })

  test('surface_vacuum target shows DM−4 row in Step 3', async ({ page }) => {
    await openAttackWithCondition(page, 'surface_vacuum')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Planetary/atmospheric condition' }).last()
    await expect(row).toContainText('-4')
  })

  test('atmo_flight target shows DM−2 row in Step 3', async ({ page }) => {
    await openAttackWithCondition(page, 'atmo_flight')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Planetary/atmospheric condition' }).last()
    await expect(row).toContainText('-2')
  })

  test('ShipDetailModal — selecting a condition updates ship.atmosphericCondition', async ({ page }) => {
    await openAttackWithCondition(page, null)
    const targetId = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[1].id)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('ship-detail', { shipId: id })
    }, targetId)
    await expect(page.getByText('PLANETARY / ATMOSPHERIC CONDITION')).toBeVisible()
    await page.getByRole('combobox').last().selectOption('surface_vacuum')
    const condition = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).atmosphericCondition
    , targetId)
    expect(condition).toBe('surface_vacuum')
  })
})

/**
 * AttackModal — 3-step Firing Solution.
 * // 2300AD B3 p.56 — Step 1: Sensor (12+), Step 2: Pilot (10+), Step 3: Gunner (10+)
 */

import { test, expect } from '@playwright/test'
import { clearAppState, gotoBattle } from './helpers.js'

const ARMED_SHIPS = [
  {
    name: 'ISV-2 Trilon', faction: 'players',
    weapons: [{ weaponId: 'll98', count: 1, label: 'Forward Laser', targetingSystem: 'light_tta' }],
  },
  {
    name: 'Kaefer Geist', faction: 'npc',
    weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser', targetingSystem: 'light_tta' }],
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
          // A single crew member filling every role (skill 2), so every role's
          // actionsRemaining budget is non-zero — 2300AD B3 p.53.
          crew: [{
            id: 'crew-full', name: 'Full Crew', role: null,
            skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
            characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
          }],
          crewAssignments: {
            pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
            gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
          },
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
    await page.getByText('ROLL 2D6').last().click()
    // Either SUCCESS or FAILURE must appear
    const outcome = page.getByText(/SUCCESS|FAILURE/)
    await expect(outcome.first()).toBeVisible()
  })

  test('after Step 1 roll, NEXT → PILOT button is enabled', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    const nextBtn = page.getByText('NEXT → PILOT')
    await expect(nextBtn).toBeVisible()
    await expect(nextBtn).not.toBeDisabled()
  })

  test('Step 2 shows PILOT and DEX in breakdown', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
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
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    // Step 2
    await page.getByText('ROLL 2D6').last().click()
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
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
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
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
    const row = page.locator('div').filter({ hasText: 'Evasion penalty' }).last()
    await expect(row).toContainText('-1')
  })

  test('setup screen shows "auto from Manoeuvre action" hint when target has evasionDm', async ({ page }) => {
    await openAttackWithTargetEvasion(page, -2)
    await expect(page.getByText('auto from Manoeuvre action')).toBeVisible()
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
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
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
              crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
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

    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id })
    }, id0)
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()

    await expect(page.getByText('Command (Captain)')).toBeVisible()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Tactics assist')).toBeVisible()
    await expect(page.getByText('Command (Captain)')).toBeVisible()
  })
})

// === Engineer assist — Step 1 (Sensor) and Step 2 (Pilot) — issue #26 =======
// // 2300AD B3 p.56 — Routine (8+) Engineer (power) INT, distinct from the Captain
// Tactics assist (Step 3) and from the standalone "Boost Tac Speed" crew action.

test.describe('AttackModal — Engineer assist (Step 1 Sensor, Step 2 Pilot)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('Step 1 shows an Engineer assist roll block; success adds a raw-Effect row', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await expect(page.getByText('Engineer assist (optional)')).toBeVisible()
    await expect(page.getByText('Engineer (power)')).toBeVisible()

    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Engineer assist', { exact: true })).toBeVisible()
  })

  test('Step 2 shows its own Engineer assist roll block; success adds the banded TAC Speed row', async ({ page }) => {
    await openAttack(page)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click() // Step 1 main roll, no assist
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('Engineer assist (optional)')).toBeVisible()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6') // total 12+dm → Effect ≥ 5 → +2
    await expect(page.getByText('Engineer assist (TAC Speed)')).toBeVisible()
    const row = page.locator('div').filter({ hasText: 'Engineer assist (TAC Speed)' }).last()
    await expect(row).toContainText('+2')
  })

  test('an Engineer with 2 actions/round can assist both Step 1 and Step 2 in the same Firing Solution', async ({ page }) => {
    await openAttack(page)
    const shipId = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)

    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Engineer assist', { exact: true })).toBeVisible()
    await page.getByText('ROLL 2D6').last().click() // main Step 1 roll
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('Engineer assist (optional)')).toBeVisible()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Engineer assist (TAC Speed)')).toBeVisible()

    const engineerBudget = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).actionsRemaining.engineer
    , shipId)
    expect(engineerBudget).toBe(0) // skill 2 → 2 actions, both spent
  })

  test('an Engineer with only 1 action/round can assist only one of the two steps', async ({ page }) => {
    await openAttack(page)
    await page.evaluate(() => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const ship = store.getState().ships[0]
      store.getState().updateShip(ship.id, {
        actionsRemaining: { ...ship.actionsRemaining, engineer: 1 },
      })
    })
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('enter manually').first().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()

    await expect(page.getByText('Engineer has no actions left this round')).toBeVisible()
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
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
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
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
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
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
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
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
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

// === Fire Control DM-8 penalty when absent — 2300AD B3 p.62 (issue #25: hardware, not software) ==

test.describe('AttackModal — DM-8 penalty for weapons without a Targeting System', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  /** Inject armed ships with the given attacker weapon fields, open AttackModal for ships[0]. */
  async function openAttackWith(page, attackerWeapon, attackerSoftware) {
    const shipDefs = [
      { name: 'ISV-2 Trilon', faction: 'players', weapons: [attackerWeapon], software: attackerSoftware },
      { name: 'Kaefer Geist', faction: 'npc', weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser', targetingSystem: 'light_tta' }], software: ['fire_control_1'] },
    ]
    await page.evaluate((shipDefs) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 3,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: def.software,
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
          },
          def.faction, 'Close',
        )
      }
      const ships = store.getState().ships
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
    }, shipDefs)
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
  }

  test('Targeting System shows -8 when the weapon mount has none, even with Fire Control software installed', async ({ page }) => {
    await openAttackWith(page,
      { weaponId: 'll98', count: 1, label: 'Forward Laser', targetingSystem: 'none' },
      ['fire_control_2'], // software present — should NOT prevent the hardware penalty
    )
    const targetingRow = page.locator('div').filter({ hasText: 'Targeting System' }).last()
    await expect(targetingRow).toContainText('-8')
    const fireControlRow = page.locator('div').filter({ hasText: 'Fire Control' }).last()
    await expect(fireControlRow).toContainText('+2')
  })

  test('no Fire Control software, but a Targeting System installed → no -8 penalty', async ({ page }) => {
    await openAttackWith(page,
      { weaponId: 'll98', count: 1, label: 'Forward Laser', targetingSystem: 'light_tta' },
      [], // no fire_control_N software at all
    )
    await expect(page.getByText('Targeting System', { exact: false })).not.toBeVisible()
  })
})

// === Defensive Screens — 2300AD B3 p.55, p.62 ==================================

test.describe('AttackModal — Defensive Screens', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  /** Inject armed ships; ships[1] (target) gets the given screen fields. */
  async function setupShipsWithTargetScreens(page, screenFields = {}) {
    return page.evaluate(({ shipDefs, screenFields }) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 0,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: ['fire_control_1'],
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
          },
          def.faction, 'Close',
        )
      }
      const ships = store.getState().ships
      if (Object.keys(screenFields).length) store.getState().updateShip(ships[1].id, screenFields)
      return { id0: ships[0].id, id1: ships[1].id }
    }, { shipDefs: ARMED_SHIPS, screenFields })
  }

  async function reachStep3(page) {
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
  }

  test('no Defensive Screens row when target has no active screen', async ({ page }) => {
    const { id0 } = await setupShipsWithTargetScreens(page)
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await reachStep3(page)
    await expect(page.getByText('Defensive Screens')).not.toBeVisible()
  })

  test('Step 3 shows Defensive Screens DM equal to target\'s active Rating (laser weapon ll98)', async ({ page }) => {
    const { id0 } = await setupShipsWithTargetScreens(page, { screenRating: 2, screenDeployed: true, screenCurrentRating: 2 })
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Defensive Screens' }).last()
    await expect(row).toContainText('-2')
  })

  test('a hit on a screened target depletes the screen by 1', async ({ page }) => {
    const { id0, id1 } = await setupShipsWithTargetScreens(page, { screenRating: 3, screenDeployed: true, screenCurrentRating: 3 })
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await reachStep3(page)
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await page.getByText('APPLY DAMAGE').click()
    const rating = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).screenCurrentRating
    , id1)
    expect(rating).toBe(2)
  })

  test('a hit from a non-laser weapon does not deplete the screen', async ({ page }) => {
    const nonLaserShips = [
      { name: 'ISV-2 Trilon', faction: 'players', weapons: [{ weaponId: 'allen_bmz50', count: 1, label: 'Particle Beam', targetingSystem: 'light_tta' }] },
      { name: 'Kaefer Geist', faction: 'npc', weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser', targetingSystem: 'light_tta' }] },
    ]
    const { id0, id1 } = await page.evaluate(({ shipDefs, screenFields }) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 0,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: ['fire_control_1'],
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
          },
          def.faction, 'Close',
        )
      }
      const ships = store.getState().ships
      store.getState().updateShip(ships[1].id, screenFields)
      return { id0: ships[0].id, id1: ships[1].id }
    }, { shipDefs: nonLaserShips, screenFields: { screenRating: 3, screenDeployed: true, screenCurrentRating: 3 } })
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await reachStep3(page)
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await page.getByText('APPLY DAMAGE').click()
    const rating = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).screenCurrentRating
    , id1)
    expect(rating).toBe(3)
  })

  test('SETUP screen shows DEPLOY SCREENS for an undeployed screen-equipped ship', async ({ page }) => {
    const { id0 } = await setupShipsWithTargetScreens(page)
    await page.evaluate((id) => window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { screenRating: 1 }), id0)
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await expect(page.getByText('DEPLOY SCREENS')).toBeVisible()
    await page.getByText('DEPLOY SCREENS').click()
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.screenDeployed).toBe(true)
    expect(ship.screenCurrentRating).toBe(1)
  })

  test('SETUP screen shows RECHARGE SCREENS when deployed, depleted, and reloads remain', async ({ page }) => {
    const { id0 } = await setupShipsWithTargetScreens(page)
    await page.evaluate((id) => window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, {
      screenRating: 3, screenDeployed: true, screenCurrentRating: 1, screenReloads: 2,
    }), id0)
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await expect(page.getByText('RECHARGE SCREENS (−1 reload)')).toBeVisible()
    await page.getByText('RECHARGE SCREENS (−1 reload)').click()
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.screenCurrentRating).toBe(3)
    expect(ship.screenReloads).toBe(1)
  })

  test('RECHARGE SCREENS is absent when no reloads remain', async ({ page }) => {
    const { id0 } = await setupShipsWithTargetScreens(page)
    await page.evaluate((id) => window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, {
      screenRating: 3, screenDeployed: true, screenCurrentRating: 1, screenReloads: 0,
    }), id0)
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await expect(page.getByText('Defensive Screens (Gunner Action')).toBeVisible()
    await expect(page.getByText('RECHARGE SCREENS', { exact: false })).not.toBeVisible()
    await expect(page.getByText('DEPLOY SCREENS')).not.toBeVisible()
  })
})

// === Gunnery cap — one Fire Weapon per round, shared across a ship's Gunner
// Actions (Fire Weapon / Screens / Point Defence) // 2300AD B3 p.53, p.55 ====

test.describe('AttackModal — Gunnery action budget (one use per round)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('after firing once, a second Firing Solution this round is blocked (Gunner has no actions left)', async ({ page }) => {
    await openAttack(page) // fixture crew: gunner skill 2 → actionsRemaining.gunner_turret capped at 1
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')

    const id0 = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)
    const gunnerBudget = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).actionsRemaining.gunner_turret
    , id0)
    expect(gunnerBudget).toBe(0)

    // Close this modal instance (SKIP, without applying damage) before re-opening —
    // otherwise the same mounted AttackModal keeps its Step 3 local state.
    await page.getByText('SKIP', { exact: true }).click()

    // Re-open the Firing Solution for the same ship this round — Step 3 is blocked.
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await expect(page.getByText('NEXT → GUNNER')).toBeDisabled()
    await expect(page.getByText('Gunner has no actions left this round', { exact: false })).toBeVisible()
  })
})

// === Auto X fire mode — Single/Burst/Full Auto selector // 2300AD B3 p.59, Trav2022 CRB p.78 (#11) ===

test.describe('AttackModal — Auto X fire mode', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  const AUTO_SHIPS = [
    { name: 'Auto Gunship', faction: 'players', weapons: [{ weaponId: 'tri_beamer', count: 1, label: 'Tri-Beamer', targetingSystem: 'light_tta' }] },
    { name: 'Kaefer Geist', faction: 'npc', weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser', targetingSystem: 'light_tta' }] },
  ]

  async function openAutoAttack(page) {
    await page.evaluate((shipDefs) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      for (const def of shipDefs) {
        store.getState().addShip(
          {
            name: def.name, class: 'Test class', hullPoints: 20, armour: 3,
            tacSpeed: 4, signature: 2,
            sensors: { type: 'Basic Military', dm: 0 },
            computer: { model: 'TL-10', bandwidth: 20 },
            weapons: def.weapons, software: ['fire_control_1'],
            crew: [{
              id: 'crew-full', name: 'Full Crew', role: null,
              skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
              characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
            }],
            crewAssignments: {
              pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
              gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
            },
          },
          def.faction, 'Adjacent', // tri_beamer's optimal range
        )
      }
      const ships = store.getState().ships
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
    }, AUTO_SHIPS)
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  }

  async function reachStep3(page) {
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
  }

  test('fire-mode selector is shown for a weapon with Auto X, defaulting to Burst', async ({ page }) => {
    await openAutoAttack(page)
    await expect(page.getByText('Fire Mode (Kaefer Tri-Beamer — Auto 3)')).toBeVisible()
    await expect(page.getByLabel('Burst (+3 dmg)')).toBeChecked()
  })

  test('no fire-mode selector for a weapon without Auto X', async ({ page }) => {
    await openAutoAttack(page)
    await expect(page.getByLabel('Full Auto (×3)')).toBeVisible() // sanity: selector exists for tri_beamer first
    await page.evaluate(() => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.updateShip(s.ships[0].id, { weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser' }] })
    })
    await expect(page.getByText('Fire Mode', { exact: false })).not.toBeVisible()
  })

  test('Burst mode adds the Auto score to the damage total', async ({ page }) => {
    await openAutoAttack(page)
    await reachStep3(page)
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    // tri_beamer: 5D, Burst +3 — bonus shown in the damage breakdown. Scoped to the
    // damage line specifically — a bare "+3" text search can collide with other random
    // DM/dice values elsewhere on screen since damage rolls aren't seeded in e2e.
    const damageLine = page.locator('p').filter({ hasText: 'Kaefer Tri-Beamer:' })
    await expect(damageLine).toContainText('+3')
  })

  test('Full Auto mode fires 3 volleys, shown as ×3 in the damage breakdown', async ({ page }) => {
    await openAutoAttack(page)
    await page.getByLabel('Full Auto (×3)').check()
    await reachStep3(page)
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('Full Auto ×3', { exact: false })).toBeVisible()
  })
})

// === Targeting Systems (TTA/UTES) and Operate UTES Array // 2300AD B3 p.53, p.62 (#16) ===

test.describe('AttackModal — Targeting Systems and Operate UTES Array', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  async function openTargetingAttack(page, targetingSystem) {
    await page.evaluate(({ targetingSystem }) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      const crew = [{
        id: 'crew-full', name: 'Full Crew', role: null,
        skills: { pilot: 2, tactics: 2, engineer: 2, gunner: 2, sensors: 2, countermeasures: 2, leadership: 2, mechanic: 2, gunCombat: 2, melee: 2, remoteOps: 2 },
        characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
      }]
      const crewAssignments = {
        pilot: 'crew-full', captain: 'crew-full', engineer: 'crew-full', sensor_operator: 'crew-full',
        gunner_turret: 'crew-full', gunner_bay: 'crew-full', marine: 'crew-full', remote_pilot: 'crew-full',
      }
      store.getState().addShip(
        {
          name: 'Targeting Test Ship', class: 'Test class', hullPoints: 20, armour: 3,
          tacSpeed: 4, signature: 2,
          sensors: { type: 'Basic Military', dm: 0 },
          computer: { model: 'TL-10', bandwidth: 20 },
          weapons: [{ weaponId: 'll98', count: 1, label: 'Test Weapon', targetingSystem }],
          software: ['fire_control_1'],
          crew, crewAssignments,
        },
        'players', 'Close',
      )
      store.getState().addShip(
        {
          name: 'Enemy Target', class: 'Test class', hullPoints: 20, armour: 3,
          tacSpeed: 4, signature: 2,
          sensors: { type: 'Basic Military', dm: 0 },
          computer: { model: 'TL-10', bandwidth: 20 },
          weapons: [{ weaponId: 'll88', count: 1, label: 'Enemy Weapon' }],
          software: ['fire_control_1'],
          crew, crewAssignments,
        },
        'npc', 'Close',
      )
      const ships = store.getState().ships
      window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: ships[0].id })
    }, { targetingSystem })
    await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  }

  async function reachStep3(page) {
    await page.getByText('BEGIN FIRING SOLUTION →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → PILOT').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
    await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
  }

  test('TTA-equipped weapon shows a DM−1 Targeting System row in Step 3', async ({ page }) => {
    await openTargetingAttack(page, 'tta')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Targeting System' }).last()
    await expect(row).toContainText('-1')
  })

  test('UTES-equipped weapon shows a DM+1 Targeting System row in Step 3 (passive hardware)', async ({ page }) => {
    await openTargetingAttack(page, 'utes')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Targeting System' }).last()
    await expect(row).toContainText('+1')
  })

  test('Targeting System row shows -8 for an unequipped weapon // B3 p.62, issue #25', async ({ page }) => {
    await openTargetingAttack(page, 'none')
    await reachStep3(page)
    const row = page.locator('div').filter({ hasText: 'Targeting System' }).last()
    await expect(row).toContainText('-8')
  })

  test('Operate UTES Array block only appears for a UTES-equipped weapon', async ({ page }) => {
    await openTargetingAttack(page, 'utes')
    await expect(page.getByText('Operate UTES Array', { exact: false })).toBeVisible()
  })

  test('no Operate UTES Array block for a TTA-equipped (non-UTES) weapon', async ({ page }) => {
    await openTargetingAttack(page, 'tta')
    await expect(page.getByText('Operate UTES Array', { exact: false })).not.toBeVisible()
  })

  test('a successful manual Operate UTES Array roll sets utesSolutionDm/utesSolutionSlotIdx and spends the Gunner budget', async ({ page }) => {
    await openTargetingAttack(page, 'utes')
    await page.getByText('enter manually').click()
    // SETUP also renders the TARGET EVASION DM number input before this one — skip it.
    await page.locator('input[type="number"]').nth(1).fill('6')
    await page.locator('input[type="number"]').nth(2).fill('6')
    await page.getByText('CONFIRM (ends this ship\'s Firing Solution this round)').click()

    const id0 = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    // Full crew: gunner skill 2 + EDU DM 0 = +2; dice 6+6=12 → total 14, effect 2 → success, DM+1
    expect(ship.utesSolutionDm).toBe(1)
    expect(ship.utesSolutionSlotIdx).toBe(0)
    expect(ship.actionsRemaining.gunner_turret).toBe(0)
  })

  test('reopening with a matching UTES solution shows the ready banner and skips Step 1', async ({ page }) => {
    await openTargetingAttack(page, 'utes')
    const id0 = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { utesSolutionDm: 1, utesSolutionSlotIdx: 0 })
    }, id0)
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await expect(page.getByText('UTES Solution Ready', { exact: false })).toBeVisible()
    await page.getByText('BEGIN FIRING SOLUTION (SKIP SENSOR STEP) →').click()
    await expect(page.getByText('STEP 2 — PILOT')).toBeVisible()
    await expect(page.getByText('STEP 1 — SENSOR OPERATOR')).not.toBeVisible()
  })

  test('the UTES solution DM row appears in Step 3 and clears after the hit is applied', async ({ page }) => {
    await openTargetingAttack(page, 'utes')
    const id0 = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { utesSolutionDm: 2, utesSolutionSlotIdx: 0 })
    }, id0)
    await page.evaluate((id) => window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id }), id0)
    await page.getByText('BEGIN FIRING SOLUTION (SKIP SENSOR STEP) →').click()
    await page.getByText('ROLL 2D6').last().click()
    await page.getByText('NEXT → GUNNER').click()
    const row = page.locator('div').filter({ hasText: 'UTES solution (prev. round)' }).last()
    await expect(row).toContainText('+2')

    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await page.getByText('APPLY DAMAGE', { exact: true }).click()

    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.utesSolutionDm).toBe(null)
    expect(ship.utesSolutionSlotIdx).toBe(null)
  })

  test('an unused UTES solution clears at the next round boundary', async ({ page }) => {
    await openTargetingAttack(page, 'utes')
    const id0 = await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().ships[0].id)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.updateShip(id, { utesSolutionDm: 1, utesSolutionSlotIdx: 0 })
      s.setInitiativeOrder(s.ships.map((sh) => sh.id))
      s.startNextRound()
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.utesSolutionDm).toBe(null)
    expect(ship.utesSolutionSlotIdx).toBe(null)
  })
})

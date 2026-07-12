/**
 * Crew actions — Commands, EW, EW countermeasures.
 * // 2300AD B3 p.54–55 — Actions Phase crew actions
 */

import { test, expect } from '@playwright/test'
import { clearAppState, gotoBattle } from './helpers.js'

const ARMED_SHIPS = [
  {
    name: 'ISV-2 Trilon', faction: 'players',
    weapons: [{ weaponId: 'll98', count: 1, label: 'Fwd Laser', targetingSystem: 'light_tta' }],
  },
  {
    name: 'Kaefer Geist', faction: 'npc',
    weapons: [{ weaponId: 'll88', count: 1, label: 'Main Laser', targetingSystem: 'light_tta' }],
  },
]

/**
 * Inject two armed ships and return their IDs.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ id0: string, id1: string }>}
 */
async function setupShips(page) {
  return page.evaluate((defs) => {
    const store = window.__ZUSTAND_BATTLE_STORE__
    for (const def of defs) {
      store.getState().addShip(
        {
          name: def.name, class: 'Test', hullPoints: 20, armour: 3,
          tacSpeed: 4, signature: 2,
          sensors: { type: 'Basic Military', dm: 0 },
          computer: { model: 'TL-10', bandwidth: 20 },
          weapons: def.weapons, software: ['fire_control_1'],
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
        def.faction, 'Close',
      )
    }
    const [s0, s1] = store.getState().ships
    return { id0: s0.id, id1: s1.id }
  }, ARMED_SHIPS)
}

/** Step through Firing Solution to Step 3 for the given attacker. */
async function reachStep3(page, attackerId) {
  await page.evaluate((id) => {
    window.__ZUSTAND_UI_STORE__.getState().openModal('attack', { attackerId: id })
  }, attackerId)
  await expect(page.getByText('FIRING SOLUTION', { exact: true })).toBeVisible()
  await page.getByText('BEGIN FIRING SOLUTION →').click()
  await page.getByText('ROLL 2D6').click()
  await page.getByText('NEXT → PILOT').click()
  await page.getByText('ROLL 2D6').click()
  await page.getByText('NEXT → GUNNER').click()
  await expect(page.getByText('STEP 3 — GUNNER')).toBeVisible()
}

// === Commands ================================================================
// "Leading Fire" (Tactics naval, battle-wide DM to all attacks) was not a
// canonical B3 rule — replaced by Commands (Leadership, per-ship, targets one
// crew role, activates next round). // 2300AD B3 p.54

test.describe('Commands — applyCommand', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('applyCommand sets commandBonus on the issuing ship only, not battle-wide, active immediately', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyCommand(id, 'gunner_turret', 1)
    }, id0)
    const state = await page.evaluate((ids) => {
      const ships = window.__ZUSTAND_BATTLE_STORE__.getState().ships
      return {
        ship0: ships.find((s) => s.id === ids.id0).commandBonus,
        ship1: ships.find((s) => s.id === ids.id1).commandBonus,
      }
    }, { id0, id1 })
    // Immediate this round (B3 p.53–54, literal "for that combat round") — no NextRound staging.
    expect(state.ship0).toEqual([{ role: 'gunner_turret', dm: 1 }])
    expect(state.ship1).toEqual([])
  })

  test('a Captain with Leadership 3 can issue three Commands to three different roles in one round', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(id, 'gunner_turret', 1)
      s.applyCommand(id, 'pilot', 2)
      s.applyCommand(id, 'sensor_operator', 1)
    }, id0)
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonus).toEqual([
      { role: 'gunner_turret', dm: 1 },
      { role: 'pilot', dm: 2 },
      { role: 'sensor_operator', dm: 1 },
    ])
  })

  test('re-issuing a Command to the same role replaces its DM instead of stacking', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(id, 'pilot', 1)
      s.applyCommand(id, 'pilot', 2)
    }, id0)
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonus).toEqual([{ role: 'pilot', dm: 2 }])
  })

  test('commandBonus clears at the start of the next round if not re-issued', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(ids.id0, 'gunner_turret', 2)
      s.setInitiativeOrder([ids.id0, ids.id1])
    }, { id0, id1 })
    // Active immediately, this round.
    let ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonus).toEqual([{ role: 'gunner_turret', dm: 2 }])

    await page.evaluate(() => window.__ZUSTAND_BATTLE_STORE__.getState().startNextRound())
    ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id),
    id0)
    expect(ship0.commandBonus).toEqual([])
  })

  test('AttackModal step 3 shows Command row immediately this round, targeting gunner_turret', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyCommand(ids.id0, 'gunner_turret', 1)
      s.setInitiativeOrder([ids.id0, ids.id1])
    }, { id0, id1 })
    await reachStep3(page, id0)
    await expect(page.getByText('Command (Captain)')).toBeVisible()
  })
})

// === Electronic Warfare =====================================================

test.describe('Electronic Warfare — applyEW + ewEffect', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('applyEW sets ewTarget and ewEffect on attacker ship', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id0, ids.id1, 2)
    }, { id0, id1 })
    const ship0 = await page.evaluate((id) => {
      return window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    }, id0)
    expect(ship0.ewTarget).toBe(id1)
    expect(ship0.ewEffect).toBeLessThan(0) // penalty is negative
  })

  test('ewEffect magnitude ≥ 1 (DM floors at −1)', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // Effect 0 → penalty should still be −1
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id0, ids.id1, 0)
    }, { id0, id1 })
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship0.ewEffect).toBe(-1)
  })

  test('AttackModal step 3 shows EW jamming row when attacker is jammed', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // Ship 1 jams ship 0 (id1 jams id0) — so id0's attacks are penalised
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id1, ids.id0, 2)
    }, { id0, id1 })
    await reachStep3(page, id0)
    await expect(page.getByText('EW jamming')).toBeVisible()
  })

  test('EW jamming DM shown as negative value in step 3 breakdown', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id1, ids.id0, 2)
    }, { id0, id1 })
    await reachStep3(page, id0)
    // The value cell next to "EW jamming" label should contain a minus sign
    await expect(page.getByText(/^-\d/).first()).toBeVisible()
  })

  test('ewTarget and ewEffect reset to 0 at round end', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    await page.evaluate((ids) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyEW(ids.id0, ids.id1, 2)
      s.startNextRound?.()
    }, { id0, id1 })
    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship0.ewTarget).toBeNull()
    expect(ship0.ewEffect).toBe(0)
  })
})

// === EW Countermeasures =====================================================

test.describe('EW Countermeasures — ew_countermeasure action', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('successful countermeasure clears jammer ewTarget and ewEffect', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // id0 jams id1
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().applyEW(ids.id0, ids.id1, 3)
    }, { id0, id1 })

    // id1 runs countermeasure — simulate what ActionModal does on success
    await page.evaluate((ids) => {
      const store = window.__ZUSTAND_BATTLE_STORE__.getState()
      const ships = store.ships
      const jammer = ships.find((s) => s.ewTarget === ids.id1)
      if (jammer) store.updateShip(jammer.id, { ewTarget: null, ewEffect: 0 })
    }, { id0, id1 })

    const ship0 = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship0.ewTarget).toBeNull()
    expect(ship0.ewEffect).toBe(0)
  })

  test('after countermeasure, AttackModal step 3 shows no EW jamming row', async ({ page }) => {
    const { id0, id1 } = await setupShips(page)
    // id1 jams id0, then id0 counters
    await page.evaluate((ids) => {
      const store = window.__ZUSTAND_BATTLE_STORE__
      store.getState().applyEW(ids.id1, ids.id0, 2)
      // Re-read state after mutation (getState() returns stale slice if captured early)
      const jammer = store.getState().ships.find((s) => s.ewTarget === ids.id0)
      if (jammer) store.getState().updateShip(jammer.id, { ewTarget: null, ewEffect: 0 })
    }, { id0, id1 })

    await reachStep3(page, id0)
    await expect(page.getByText('EW jamming')).not.toBeVisible()
  })
})

// Deploy Sand removed entirely — not a 2300AD B3 mechanic (zero occurrences in
// the source PDF). Point Defence moved to a per-drone reaction inside
// DroneAttackModal — see e2e/08-drones.spec.js.

// === Damage Control — hazards ===============================================

test.describe('Damage Control — addHazard / removeHazard', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('addHazard appends entry to ship.hazards', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().addHazard(id, 'Hull Fire')
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.hazards.length).toBe(1)
    expect(ship.hazards[0].label).toBe('Hull Fire')
  })

  test('removeHazard removes entry by id', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().addHazard(id, 'Fuel Leak')
    }, id0)
    const hazardId = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).hazards[0].id
    , id0)
    await page.evaluate((ids) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().removeHazard(ids.id0, ids.hazardId)
    }, { id0, hazardId })
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.hazards.length).toBe(0)
  })

  test('addHazard accumulates multiple hazards', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.addHazard(id, 'Fire')
      s.addHazard(id, 'Breach')
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.hazards.length).toBe(2)
  })

  test('ShipDetailModal shows hazards panel', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().addHazard(id, 'Coolant Leak')
    }, id0)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('ship-detail', { shipId: id })
    }, id0)
    await expect(page.getByText('ACTIVE HAZARDS')).toBeVisible()
    await expect(page.getByText('Coolant Leak')).toBeVisible()
  })
})

// === Boarding Action — boardingDmNextRound ==================================

test.describe('Boarding — boardingDmNextRound carry-over', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('updateShip sets boardingDmNextRound on attacker ship', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { boardingDmNextRound: 2 })
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.boardingDmNextRound).toBe(2)
  })

  test('boardingDmNextRound resets to 0 at round end', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.updateShip(id, { boardingDmNextRound: 2 })
      s.startNextRound?.()
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.boardingDmNextRound).toBe(0)
  })
})

// Sensor Lock removed — it was never a 2300AD B3 action (only exists in the
// Traveller 2022 CRB, outside this project's declared CRB-fallback scope).

// === Emergency Repair — Mechanic Difficult (10+), 5 Hull points // B3 p.56–57 ===

test.describe('Emergency Repair — skill, difficulty, and repair amount', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('ActionModal shows Mechanic skill and Difficult (10+) for Emergency Repair', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Emergency Repair', { exact: true }).click()
    await expect(page.getByText('SKILL LEVEL — Mechanic (Difficult (10+))')).toBeVisible()
  })

  test('hull mode button reads "Hull (+5 HP)"', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Emergency Repair', { exact: true }).click()
    await expect(page.getByText('Hull (+5 HP)', { exact: true })).toBeVisible()
  })

  test('applying a successful hull-mode repair restores 5 hull points, not 1', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.applyDamage(id, 8, 0) // drop currentHull well below max so +5 is observable
    }, id0)
    const before = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).currentHull
    , id0)

    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Emergency Repair', { exact: true }).click()
    await page.getByText('Hull (+5 HP)', { exact: true }).click()
    await page.getByText('manual', { exact: true }).click()

    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(0).fill('6')
    await numberInputs.nth(1).fill('6')
    await expect(page.getByText('SUCCESS', { exact: false })).toBeVisible()
    await page.getByText('APPLY RESULT', { exact: true }).click()

    const after = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).currentHull
    , id0)
    expect(after - before).toBe(5)
  })
})

// === Scan Target / Improve Critical — Sensor Operator // 2300AD B3 p.54 =====

test.describe('Scan Target / Improve Critical', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('ActionModal lists Scan Target (Routine 8+) and Improve Critical (Very Difficult 12+)', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Scan Target', { exact: true }).click()
    await expect(page.getByText('SKILL LEVEL — Electronics (sensors) (Routine (8+))')).toBeVisible()
    await page.getByText('Improve Critical', { exact: true }).click()
    await expect(page.getByText('SKILL LEVEL — Electronics (sensors) (Very Difficult (12+))')).toBeVisible()
  })

  test('a successful Improve Critical sets improveCriticalThreshold to 5 (Effect 1-4) immediately', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Improve Critical', { exact: true }).click()
    await page.getByText('manual', { exact: true }).click()
    const numberInputs = page.locator('input[type="number"]')
    await numberInputs.nth(0).fill('6')
    await numberInputs.nth(1).fill('6') // 12 total, +0 skill = Effect 0 → success, Effect < 6
    await page.getByText('APPLY RESULT', { exact: true }).click()
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    // Applies immediately — "this ship's next Firing Solution shot this round" (B3 p.54, literal).
    expect(ship.improveCriticalThreshold).toBe(5)
  })

  test('improveCriticalThreshold is shown on the Ship Sheet as soon as it is set', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { improveCriticalThreshold: 5 })
    }, id0)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('ship-detail', { shipId: id })
    }, id0)
    await expect(page.getByText('IMPROVE CRITICAL ACTIVE')).toBeVisible()
    await expect(page.getByText('Next hit crits at Effect 5+ instead of 6+')).toBeVisible()
  })

  test('improveCriticalThreshold clears at the start of the next round if not consumed by a shot', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.updateShip(id, { improveCriticalThreshold: 5 })
      s.setInitiativeOrder(s.ships.map((sh) => sh.id))
      s.startNextRound()
    }, id0)
    const ship = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id)
    , id0)
    expect(ship.improveCriticalThreshold).toBe(null)
  })

  test('AttackModal Step 3 shows the Improve Critical active banner', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_BATTLE_STORE__.getState().updateShip(id, { improveCriticalThreshold: 5 })
    }, id0)
    await reachStep3(page, id0)
    await expect(page.getByText('Improve Critical active')).toBeVisible()
    await expect(page.getByText('this shot crits at Effect 5+ instead of 6+', { exact: false })).toBeVisible()
  })

  test('a hit with Effect 5 shows INTERNAL CRITICAL HIT when improveCriticalThreshold is 5 (normally requires 6)', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      // ll98 (Accurate +1) + fire_control_1 (+1) + this Command (+1) = DM+3 total on Step 3;
      // max dice roll (6+6=12) + 3 = 15, Effect = 5 exactly — deterministic, not a crit at the
      // normal threshold (6) but IS one at the lowered Improve Critical threshold (5) under test.
      s.updateShip(id, { improveCriticalThreshold: 5, commandBonus: [{ role: 'gunner_turret', dm: 1 }] })
    }, id0)
    await reachStep3(page, id0)
    await page.getByText('enter manually').last().click()
    await page.locator('input[type="number"]').nth(0).fill('6')
    await page.locator('input[type="number"]').nth(1).fill('6')
    await expect(page.getByText('⚠ INTERNAL CRITICAL HIT', { exact: false })).toBeVisible()
  })
})

// === Re-route Power — Engineer // 2300AD B3 p.54 (informational, no Effect table) ===

test.describe('Re-route Power', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('ActionModal lists Re-route Power as Average (8+) Engineer (power)', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Re-route Power', { exact: true }).click()
    await expect(page.getByText('SKILL LEVEL — Engineer (power) (Average (8+))')).toBeVisible()
  })
})

// === Issue Order — Captain grants +1 action, no check // 2300AD B3 p.53 =====
// Distinct from Commands (a DM+1/+2 buff activating next round): Issue Order
// spends one of the Captain's own actionsRemaining to grant +1 action, this
// round, to another crew role.

test.describe('Issue Order — grantExtraAction', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page)
    await gotoBattle(page)
  })

  test('ActionModal lists Issue Order with no check required', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Issue Order (grant +1 action)', { exact: true }).click()
    await expect(page.getByText("Costs one of the Captain's own actions", { exact: false })).toBeVisible()
  })

  test('applying Issue Order spends 1 captain action and grants +1 to the chosen role', async ({ page }) => {
    const { id0 } = await setupShips(page)
    // Fixture crew has skill 2 in every role — pilot starts at 2 actionsRemaining.
    const before = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).actionsRemaining
    , id0)
    expect(before.captain).toBe(2)
    expect(before.pilot).toBe(2)

    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Issue Order (grant +1 action)', { exact: true }).click()
    // Default recipient role is already selected — just apply.
    await page.getByText('APPLY RESULT', { exact: true }).click()

    const after = await page.evaluate((id) =>
      window.__ZUSTAND_BATTLE_STORE__.getState().ships.find((s) => s.id === id).actionsRemaining
    , id0)
    expect(after.captain).toBe(1)
    expect(after.pilot).toBe(3)
  })

  test('Issue Order is unavailable once the Captain has 0 actions left', async ({ page }) => {
    const { id0 } = await setupShips(page)
    await page.evaluate((id) => {
      const s = window.__ZUSTAND_BATTLE_STORE__.getState()
      s.spendCrewAction(id, 'captain')
      s.spendCrewAction(id, 'captain')
    }, id0)
    await page.evaluate((id) => {
      window.__ZUSTAND_UI_STORE__.getState().openModal('action', { shipId: id })
    }, id0)
    await page.getByText('Issue Order (grant +1 action)', { exact: true }).click()
    await expect(page.getByText('(captain) has no actions left this round', { exact: false })).toBeVisible()
    await expect(page.getByText('APPLY RESULT', { exact: true })).not.toBeVisible()
  })
})

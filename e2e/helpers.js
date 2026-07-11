/**
 * Shared Playwright helpers.
 */

import { expect } from '@playwright/test'

const DEFAULT_SHIPS = [
  { name: 'ISV-2 Trilon', faction: 'players' },
  { name: 'Kaefer Geist', faction: 'npc'     },
]

/**
 * A single crew member assigned to every role at once, all skills at the given
 * level — gives every role a non-zero actionsRemaining budget (2300AD B3 p.53)
 * without needing a full 8-person roster in every test fixture. Spread the
 * result into a ship definition passed to addShip(): `{ ...fullCrew(), ... }`.
 * @param {number} [skillLevel]
 * @returns {{ crew: object[], crewAssignments: Record<string, string> }}
 */
export function fullCrew(skillLevel = 2) {
  const id = 'crew-full'
  const crew = [{
    id,
    name: 'Full Crew',
    role: null,
    skills: {
      pilot: skillLevel, tactics: skillLevel, engineer: skillLevel, gunner: skillLevel,
      sensors: skillLevel, countermeasures: skillLevel, leadership: skillLevel,
      mechanic: skillLevel, gunCombat: skillLevel, melee: skillLevel, remoteOps: skillLevel,
    },
    characteristics: { STR: 7, DEX: 7, END: 7, INT: 7, EDU: 7, SOC: 7 },
  }]
  const crewAssignments = {
    pilot: id, captain: id, engineer: id, sensor_operator: id,
    gunner_turret: id, gunner_bay: id, marine: id, remote_pilot: id,
  }
  return { crew, crewAssignments }
}

/**
 * Clear IndexedDB and reset Zustand stores to a blank state.
 * Call in beforeEach to isolate tests from each other.
 * @param {import('@playwright/test').Page} page
 */
export async function clearAppState(page) {
  await page.goto('/')
  // Wait for stores to mount before resetting them
  await page.waitForFunction(() => !!window.__ZUSTAND_BATTLE_STORE__)
  await page.evaluate(async () => {
    // Await IDB deletion before reloading so the DB is truly gone
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('tac-and-lock')
      req.onsuccess = resolve
      req.onerror   = resolve
      req.onblocked = resolve
    })
    localStorage.clear()
    sessionStorage.clear()
    // Reset stores to blank state
    if (window.__ZUSTAND_BATTLE_STORE__) {
      window.__ZUSTAND_BATTLE_STORE__.getState().resetBattle()
    }
    if (window.__ZUSTAND_PROFILES_STORE__) {
      // Clear to empty so profile-count tests start at (0)
      window.__ZUSTAND_PROFILES_STORE__.setState({ profiles: [] })
    }
    if (window.__ZUSTAND_UI_STORE__) {
      window.__ZUSTAND_UI_STORE__.getState().gotoScreen('dashboard')
    }
  })
  await page.reload()
  // Wait for app to be ready again after reload
  await page.waitForFunction(() => !!window.__ZUSTAND_BATTLE_STORE__)
  // Reset profiles again — useAutosave may restore DEFAULT_PROFILES on mount
  await page.evaluate(() => {
    if (window.__ZUSTAND_PROFILES_STORE__) {
      window.__ZUSTAND_PROFILES_STORE__.setState({ profiles: [] })
    }
  })
}

/**
 * Inject ships directly into Zustand battle store via page.evaluate.
 * @param {import('@playwright/test').Page} page
 * @param {Array<{ name: string, faction: string }>} [ships]
 */
export async function addShipsToStore(page, ships = DEFAULT_SHIPS) {
  const { crew, crewAssignments } = fullCrew()
  await page.evaluate(({ shipDefs, crew, crewAssignments }) => {
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
          weapons:         def.weapons ?? [],
          software:        ['fire_control_1'],
          crew,
          crewAssignments,
        },
        def.faction,
        'Long',
      )
    }
  }, { shipDefs: ships, crew, crewAssignments })
}

/**
 * Reset the profiles store to the factory DEFAULT_PROFILES (with `category`
 * fields), so modals that key off profile category (e.g. AddShipModal's
 * token shape picker) have realistic data to work with.
 * @param {import('@playwright/test').Page} page
 */
export async function resetProfilesToDefaults(page) {
  await page.evaluate(() => {
    window.__ZUSTAND_PROFILES_STORE__.getState().resetToDefaults()
  })
}

/**
 * Go to battle screen.
 * @param {import('@playwright/test').Page} page
 */
export async function gotoBattle(page) {
  await page.getByText('ENTER BATTLE').click()
  await expect(page.getByText('ROUND')).toBeVisible()
}

/**
 * End every ship's turn in 'combat' by clicking "END SHIP'S TURN ⟶" until the
 * button disappears (all ships have had their turn this round). There is no
 * "Manoeuvre/Attack/Actions Step" in 2300AD B3 — a ship's turn is open-ended,
 * gated by per-role actionsRemaining, not a single hasActedThisPhase boolean.
 * // 2300AD B3 p.53
 * @param {import('@playwright/test').Page} page
 */
export async function drainActors(page) {
  const btn = page.getByText("END SHIP'S TURN ⟶")
  while (await btn.isVisible()) {
    await btn.click()
  }
}

/**
 * Advance to a given stage (setup → initiative → combat) by clicking NEXT PHASE,
 * seeding initiative order so the advance from 'initiative' is not blocked.
 * @param {import('@playwright/test').Page} page
 * @param {'initiative'|'combat'} targetPhase
 */
export async function advanceToPhase(page, targetPhase) {
  const ORDER = ['setup', 'initiative', 'combat']
  const targetIdx = ORDER.indexOf(targetPhase)

  for (let i = 0; i < targetIdx; i++) {
    const fromPhase = ORDER[i]
    if (fromPhase === 'initiative') {
      // Seed initiative order so advance is not blocked
      await page.evaluate(() => {
        const store = window.__ZUSTAND_BATTLE_STORE__
        const ships = store.getState().ships
        store.getState().setInitiativeOrder(ships.map((s) => s.id))
      })
    }
    await page.getByText('NEXT PHASE ⟶').click()
    // Use .first() — phase name may appear in multiple elements (label + button text)
    await expect(page.getByText(ORDER[i + 1].toUpperCase()).first()).toBeVisible()
  }
}

/** Convenience: seed initiative order and advance straight to the 'combat' stage. */
export async function startCombat(page) {
  await advanceToPhase(page, 'combat')
}

/**
 * End the current round: drain every ship's turn, then click NEXT ROUND ⟶.
 * @param {import('@playwright/test').Page} page
 */
export async function endRound(page) {
  await drainActors(page)
  await page.getByText('NEXT ROUND ⟶').click()
}

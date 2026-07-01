/**
 * Shared Playwright helpers.
 */

import { expect } from '@playwright/test'

const DEFAULT_SHIPS = [
  { name: 'ISV-2 Trilon', faction: 'players' },
  { name: 'Kaefer Geist', faction: 'npc'     },
]

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
          weapons:         def.weapons ?? [],
          software:        ['fire_control_1'],
          crew:            [],
          crewAssignments: {},
        },
        def.faction,
        'Long',
      )
    }
  }, ships)
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
 * Exhaust all actor turns in the current phase by clicking "DONE — NEXT ACTOR ⟶"
 * until the button disappears (all actors have acted).
 * Required before clicking NEXT PHASE in Manoeuvre/Attack/Actions phases.
 * @param {import('@playwright/test').Page} page
 */
export async function drainActors(page) {
  const btn = page.getByText('DONE — NEXT ACTOR ⟶')
  while (await btn.isVisible()) {
    await btn.click()
  }
}

/**
 * Advance to a given phase by clicking NEXT PHASE, optionally seeding
 * initiative order so the advance is not blocked.
 * @param {import('@playwright/test').Page} page
 * @param {'initiative'|'manoeuvre'|'attack'|'actions'} targetPhase
 */
export async function advanceToPhase(page, targetPhase) {
  const ORDER = ['setup', 'initiative', 'manoeuvre', 'attack', 'actions']
  const ACTOR_TURN_PHASES = new Set(['manoeuvre', 'attack', 'actions'])
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
    // Drain actor turns before advancing from an actor-turn phase
    if (ACTOR_TURN_PHASES.has(fromPhase)) {
      await drainActors(page)
    }
    await page.getByText('NEXT PHASE ⟶').click()
    // Use .first() — phase name may appear in multiple elements (label + button text)
    await expect(page.getByText(ORDER[i + 1].toUpperCase()).first()).toBeVisible()
  }
}

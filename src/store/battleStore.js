import { create } from 'zustand'
import { v7 as uuidv7 } from 'uuid'
import { pairKey, getCloserBand, moveBands } from '../utils/rangeBands.js'
import { FACTION_COLOR } from '../data/factions.js'
import { WEAPONS } from '../data/weapons.js'
import { exportBattle, importBattle } from '../utils/io.js'
import { rollInitiative } from '../utils/combat.js'

/** Phase sequence. Drives all transitions — no special cases needed. // 2300AD B3 p.53 */
const PHASE_ORDER = ['setup', 'initiative', 'manoeuvre', 'attack', 'actions']

/** Phases during which actor turns cycle through initiativeOrder. */
const ACTOR_TURN_PHASES = new Set(['manoeuvre', 'attack', 'actions'])

// === HELPERS ===

/**
 * Consistent log entry factory.
 * @param {{ round: number, phase: string, type: string, message: string, shipId?: string }} params
 * @returns {object}
 */
function makeLogEntry({ round, phase, type, message, shipId = null }) {
  return { id: uuidv7(), round, phase, type, message, shipId, ts: Date.now() }
}

/**
 * Extract the undo-able slices of state into a snapshot object.
 * @param {object} s — full store state
 */
function snapshot(s) {
  return {
    ships:                 structuredClone(s.ships),
    drones:                structuredClone(s.drones),
    rangeBands:            structuredClone(s.rangeBands),
    initiativeOrder:       [...s.initiativeOrder],
    currentActorIndex:     s.currentActorIndex,
    round:                 s.round,
    phase:                 s.phase,
    log:                   structuredClone(s.log),
  }
}

/**
 * Build a fresh ship battle-state from a profile object.
 * @param {import('../data/defaultProfiles.js').ShipProfile} profile
 * @param {string} faction
 * @param {string} [startBand]
 * @returns {object}
 */
function shipFromProfile(profile, faction, startBand = 'Long', color = null) {
  const resolvedFaction = faction ?? profile.faction
  return {
    id:                 uuidv7(),
    profileId:          profile.id,
    profile,           // full profile reference for display
    faction:            resolvedFaction,
    color:              color ?? FACTION_COLOR[resolvedFaction] ?? '#94a3b8',
    startBand,
    hullPoints:         profile.hullPoints,
    currentHull:        profile.hullPoints,
    armour:             profile.armour,
    currentArmour:      profile.armour,
    tacSpeed:           profile.tacSpeed,
    currentTacSpeed:    profile.tacSpeed, // fixed DM added to Pilot checks (Open/Close/Position Vessel) — never spent // 2300AD B3 p.54
    evasionDm:          0,  // B3 p.55: result of opposed Pilot check (−1, −2, or +1 for enemy)
    sensors:            { ...profile.sensors },
    computer:           { ...profile.computer },
    weapons:            profile.weapons.map((w) => ({ ...w, offline: false, destroyed: false })),
    software:           [...(profile.software ?? [])],
    signature:          profile.signature ?? 2, // base Signature // 2300AD B3 p.57
    reactionDriveType:  profile.reactionDriveType ?? 'rocket', // rocket/thruster/nuclear — Signature DM while active // 2300AD B3 p.57
    criticalTracks:     { ...(profile.criticalTracks ?? {}) },
    surfaceFixtureTracks: { ...(profile.surfaceFixtureTracks ?? {}) },
    crew:               structuredClone(profile.crew ?? []),
    crewAssignments:    { ...(profile.crewAssignments ?? {}) },
    ewTarget:                null,
    ewEffect:                0,   // negative DM this ship applies to its jammed target // B3 p.55
    hazards:                 [],  // active hazards [{ id, label }] — GM-managed, damage_control clears
    boardingDmNextRound:     0,   // carry-over DM from boarding result table to next round // B3 p.55
    isDestroyed:             false,
    // Signature modifier toggles — GM-controlled // 2300AD B3 p.57
    radiatorsRetracted:      false,
    heatSinkActive:          false,
    solarPanelsExtended:     false,
    spinHabitatRetracted:    false,
    reactionDriveActive:     false,
    activeSensorsOn:         false,
    stealthActive:           false,
    initiative:              0,
    initiativeBreakdown:     null,
    initiativeBonusNextRound: 0,
    hasActedThisPhase:       false,
    commandBonus:            [], // Array<{ role, dm }> — active this round, up to one per Leadership level // 2300AD B3 p.54
    commandBonusNextRound:   [], // Array<{ role, dm }> — declared in Actions Step, activates next round
  }
}

// === STORE ===

export const useBattleStore = create((set, get) => {
  // wh — push undo snapshot before mutation, with optional guard
  function wh(guardOrMutator, mutatorFn) {
    const hasMutator = typeof mutatorFn === 'function'
    const guard      = hasMutator ? guardOrMutator : null
    const mutator    = hasMutator ? mutatorFn : guardOrMutator

    return (...args) => {
      if (guard && !guard(...args)) return false
      get()._pushSnapshot()
      mutator(...args)
    }
  }

  /**
   * Advance a single drone one round: close one range band toward its target
   * (like a ship's own Manoeuvre Step, simplified to "always closes at max
   * TAC Speed" — see doc/drone-combat-redesign-spec.md §2.3), or mark it
   * detonated (gone inert) once its Endurance is exceeded. // 2300AD B3 p.61
   * @param {object} drone
   * @returns {object}
   */
  function advanceDroneOneRound(drone) {
    if (drone.destroyed || drone.detonated) return drone
    const roundsElapsed = drone.roundsElapsed + 1
    if (roundsElapsed > drone.enduranceRounds) {
      return { ...drone, roundsElapsed, detonated: true } // endurance exceeded — inert
    }
    if (drone.currentBand === 'Adjacent' || drone.currentBand === 'Close') {
      return { ...drone, roundsElapsed } // already within engagement range — holds position
    }
    return { ...drone, roundsElapsed, currentBand: getCloserBand(drone.currentBand) ?? drone.currentBand }
  }

  /**
   * Build state for the start of the next round.
   * Advances drones, resets per-round ship fields, increments round counter.
   * @param {object} s — current state
   * @returns {Partial<object>}
   */
  function buildNextRoundState(s) {
    const nextRound = s.round + 1

    // Advance all in-flight drones by one round // 2300AD B3 p.61
    const advancedDrones  = s.drones.map(advanceDroneOneRound)
    const newlyInRange    = advancedDrones.filter((d, i) =>
      !d.destroyed && !d.detonated &&
      (d.currentBand === 'Close' || d.currentBand === 'Adjacent') &&
      !(s.drones[i].currentBand === 'Close' || s.drones[i].currentBand === 'Adjacent'),
    )

    // Apply captain leadership bonuses, reset per-round ship state. // 2300AD B3 p.53
    const anyBonus = s.ships.some((sh) => (sh.initiativeBonusNextRound ?? 0) !== 0)
    const ships = s.ships.map((sh) => {
      const bonus = sh.initiativeBonusNextRound ?? 0
      return {
        ...sh,
        evasionDm:                0,
        ewTarget:                 null,
        ewEffect:                 0,
        boardingDmNextRound:      0,
        hasActedThisPhase:        false,
        initiative:               sh.initiative + bonus,
        initiativeBonusNextRound: 0,
        // Commands promotion: a Command declared in round N's Actions Step activates for round N+1,
        // then clears at the start of N+2 — same two-stage pattern as initiativeBonusNextRound. // B3 p.54
        commandBonus:             sh.commandBonusNextRound ?? [],
        commandBonusNextRound:    [],
      }
    })

    // Re-sort initiative if any captain used "Improve Initiative" last round. // 2300AD B3 p.53
    const newInitiativeOrder = anyBonus && s.initiativeOrder.length > 0
      ? [...s.initiativeOrder].sort((a, b) => {
          const ia = ships.find((sh) => sh.id === a)?.initiative ?? 0
          const ib = ships.find((sh) => sh.id === b)?.initiative ?? 0
          return ib - ia
        })
      : s.initiativeOrder

    const log = [
      ...s.log,
      makeLogEntry({
        round: nextRound,
        phase: 'initiative',
        type:  'system',
        message: `── Round ${nextRound} begins ──`,
      }),
      ...(newlyInRange.length > 0
        ? [makeLogEntry({
            round: nextRound,
            phase: 'initiative',
            type:  'system',
            message: `⚠ ${newlyInRange.length} drone(s) closed to engagement range.`,
          })]
        : []),
    ]

    return {
      round:                 nextRound,
      phase:                 'initiative',
      currentActorIndex:     0,
      ships,
      initiativeOrder:       newInitiativeOrder,
      drones:                advancedDrones,
      log,
    }
  }

  return {
    // === STATE ===
    id:                    uuidv7(),
    name:                  'New Battle',
    round:                 1,
    phase:                 'setup',
    savedAt:               null, // ISO timestamp of last autosave — display only, set by useAutosave
    initiativeOrder:       [],
    currentActorIndex:     0,
    ships:                 [],
    drones:                [], // launched combat drones/missiles // 2300AD B3 p.61
    rangeBands:            {},   // pairKey → band id
    log:                   [],
    undoStack:             [],
    redoStack:             [],

    // === UNDO / REDO ===

    _pushSnapshot: () => {
      const s    = get()
      const snap = snapshot(s)
      set((cur) => ({
        undoStack: [...cur.undoStack.slice(-49), snap],
        redoStack: [],
      }))
    },

    undo: () => {
      const { undoStack } = get()
      if (undoStack.length === 0) return
      const prev    = undoStack[undoStack.length - 1]
      const current = snapshot(get())
      set((s) => ({
        ...prev,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, current],
      }))
    },

    redo: () => {
      const { redoStack } = get()
      if (redoStack.length === 0) return
      const next    = redoStack[redoStack.length - 1]
      const current = snapshot(get())
      set((s) => ({
        ...next,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, current],
      }))
    },

    // === SHIPS ===

    /**
     * Add a ship to the battle from a profile.
     * @param {import('../data/defaultProfiles.js').ShipProfile} profile
     * @param {string} faction
     * @param {string} startBand — initial range band for all pair relationships
     * @param {string} [color] — token colour; defaults to faction colour
     */
    addShip: wh((profile, faction, startBand, color) => {
      const ship = shipFromProfile(profile, faction, startBand, color)
      const { ships, log, round, phase, rangeBands } = get()

      // Register this ship's range band vs every existing ship
      const newBands = { ...rangeBands }
      for (const other of ships) {
        const key = pairKey(ship.id, other.id)
        if (!newBands[key]) newBands[key] = startBand
      }

      set((s) => ({
        ships:      [...s.ships, ship],
        rangeBands: newBands,
        log: [...log, makeLogEntry({
          round, phase, type: 'system',
          message: `${profile.name} (${faction}) entered the battle at ${startBand} range.`,
          shipId: ship.id,
        })],
      }))
    }),

    /**
     * Remove a ship from the battle.
     * @param {string} shipId
     */
    removeShip: wh((shipId) => !!get().ships.find((s) => s.id === shipId), (shipId) => {
      const { log, round, phase } = get()
      const ship = get().ships.find((s) => s.id === shipId)
      set((s) => ({
        ships:          s.ships.filter((sh) => sh.id !== shipId),
        initiativeOrder: s.initiativeOrder.filter((id) => id !== shipId),
        log: [...log, makeLogEntry({
          round, phase, type: 'system',
          message: `${ship?.profile.name ?? shipId} removed from battle.`,
        })],
      }))
    }),

    // === INITIATIVE ===

    /**
     * Roll initiative for all ships and set the order. // 2300AD B3 p.54
     * Opposed Tactics(naval) check (INT) by the Captain.
     * Formula: 2D6 + Tactics(naval) + INT DM
     * Player ships accept manual dice overrides; NPC ships auto-roll.
     * @param {Record<string, { dice: number[] }>} [diceOverrides] — per-shipId manual dice (player ships)
     */
    rollAllInitiative: wh((diceOverrides = {}) => {
      const { ships, round } = get()

      const rolled = ships.map((ship) => {
        const captainId    = ship.crewAssignments?.captain ?? null
        const captain      = captainId ? ship.crew.find((c) => c.id === captainId) : null
        const tacticsNaval = captain?.skills.tactics   ?? 0
        const captainInt   = captain?.characteristics.INT ?? 7

        const result = rollInitiative(
          tacticsNaval,
          captainInt,
          diceOverrides[ship.id] ?? null,
        )
        return { id: ship.id, initiative: result.total, result }
      })

      const sorted = [...rolled].sort((a, b) => b.initiative - a.initiative)

      set((s) => ({
        ships: s.ships.map((sh) => {
          const r = rolled.find((r) => r.id === sh.id)
          return r ? { ...sh, initiative: r.initiative, initiativeBreakdown: r.result.breakdown } : sh
        }),
        initiativeOrder:   sorted.map((r) => r.id),
        currentActorIndex: 0,
        log: [
          ...s.log,
          ...rolled.map((r) => makeLogEntry({
            round,
            phase: 'initiative',
            type:  'system',
            message: `Initiative ${s.ships.find((sh) => sh.id === r.id)?.profile.name}: ${r.initiative}`,
            shipId: r.id,
          })),
        ],
      }))
    }),

    /**
     * Add a one-time initiative bonus to a ship (Captain Leadership action). // 2300AD B3 p.53
     * Applied at the start of the next round via buildNextRoundState.
     * @param {string} shipId
     * @param {number} bonus
     */
    /** Set initiative order from the modal after GM rolls. // 2300AD B3 p.54 */
    setInitiativeOrder: wh((orderedIds) => {
      set((s) => ({
        initiativeOrder: orderedIds,
        ships: s.ships.map((sh) => {
          const rank = orderedIds.indexOf(sh.id)
          return rank === -1 ? sh : { ...sh, initiative: orderedIds.length - rank }
        }),
        log: [...s.log, makeLogEntry(get(), 'initiative', `Initiative order set: ${orderedIds.map((id) => get().ships.find((sh) => sh.id === id)?.profile?.name ?? id).join(' → ')}`)],
      }))
    }),

    addInitiativeBonus: (shipId, bonus) => {
      set((s) => ({
        ships: s.ships.map((sh) =>
          sh.id !== shipId ? sh : {
            ...sh,
            initiativeBonusNextRound: (sh.initiativeBonusNextRound ?? 0) + bonus,
          },
        ),
      }))
    },

    // === PHASE ===

    /**
     * Advance to the next phase via PHASE_ORDER. // 2300AD B3 p.53
     * Actor-turn phases reset hasActedThisPhase. End of actions → next round.
     */
    advancePhase: wh(() => {
      const { phase } = get()
      const idx = PHASE_ORDER.indexOf(phase)

      // End of actions (last phase) → start next round
      if (idx === -1 || idx === PHASE_ORDER.length - 1) {
        set((s) => buildNextRoundState(s))
        return
      }

      const nextPhase = PHASE_ORDER[idx + 1]
      set((s) => ({
        phase:             nextPhase,
        currentActorIndex: 0,
        ships: s.ships.map((sh) => ({ ...sh, hasActedThisPhase: false })),
        log: [...s.log, makeLogEntry({
          round: s.round, phase: nextPhase, type: 'system',
          message: `Phase: ${nextPhase.toUpperCase()}`,
        })],
      }))
    }),

    /**
     * Mark the current actor as having acted; advance to the next actor,
     * skipping destroyed ships. // 2300AD B3 p.53
     */
    advanceActor: wh(() => {
      const { initiativeOrder, currentActorIndex, ships } = get()
      const shipId = initiativeOrder[currentActorIndex]

      let next = currentActorIndex + 1
      while (next < initiativeOrder.length) {
        const nextShip = ships.find((s) => s.id === initiativeOrder[next])
        if (!nextShip?.isDestroyed) break
        next++
      }

      set((s) => ({
        currentActorIndex: next,
        ships: s.ships.map((sh) =>
          sh.id === shipId ? { ...sh, hasActedThisPhase: true } : sh,
        ),
      }))
    }),

    // === MOVEMENT ===

    /**
     * Apply the resolved Effect of an opposed Pilot check (Open/Close) to a
     * ship pair's range band. // 2300AD B3 p.54
     * @param {string} shipAId
     * @param {string} shipBId
     * @param {string} actingShipId — the ship whose Pilot attempted the manoeuvre
     * @param {'closer' | 'farther'} direction
     * @param {number} bandsChanged — the check's Effect (bands moved), ≥ 1
     */
    manoeuvre: wh(
      (shipAId, shipBId) =>
        !!get().ships.find((s) => s.id === shipAId) &&
        !!get().ships.find((s) => s.id === shipBId),
      (shipAId, shipBId, actingShipId, direction, bandsChanged) => {
        const { rangeBands, round, phase } = get()
        const key         = pairKey(shipAId, shipBId)
        const currentBand = rangeBands[key] ?? 'Long'
        const newBand     = moveBands(currentBand, direction, bandsChanged)
        const bandChanged = newBand !== currentBand

        if (!bandChanged) return

        const actor = get().ships.find((s) => s.id === actingShipId)
        const other = get().ships.find((s) => s.id === (actingShipId === shipAId ? shipBId : shipAId))

        set((s) => ({
          rangeBands: { ...s.rangeBands, [key]: newBand },
          log: [...s.log, makeLogEntry({
            round, phase, type: 'manoeuvre',
            message: `${actor?.profile.name} ↔ ${other?.profile.name}: ${currentBand} → ${newBand} (Pilot Effect ${bandsChanged})`,
          })],
        }))
      },
    ),

    /**
     * Set the range band between two ships directly (GM override).
     * @param {string} shipAId
     * @param {string} shipBId
     * @param {string} band
     */
    setRangeBand: wh((shipAId, shipBId, band) => {
      const key = pairKey(shipAId, shipBId)
      set((s) => ({
        rangeBands: { ...s.rangeBands, [key]: band },
      }))
    }),

    /**
     * Set B3 evasion DM for a ship from an opposed Pilot check result. // 2300AD B3 p.55
     * @param {string} shipId
     * @param {number} dm — negative or 0 (e.g. -1, -2); +1 if enemy wins badly
     */
    setEvasionDm: wh((shipId) => !!get().ships.find((s) => s.id === shipId), (shipId, dm) => {
      set((s) => ({
        ships: s.ships.map((sh) => sh.id !== shipId ? sh : { ...sh, evasionDm: dm }),
      }))
    }),

    // === HULL & DAMAGE ===

    /**
     * Apply hull damage to a ship (after armour reduction).
     * @param {string} shipId
     * @param {number} netDamage
     * @param {string} [sourceShipId]
     */
    applyDamage: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, netDamage, _sourceShipId = null) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return

        const newHull     = Math.max(0, ship.currentHull - netDamage)
        const isDestroyed = newHull <= 0

        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : { ...sh, currentHull: newHull, isDestroyed },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'damage', shipId,
            message: isDestroyed
              ? `💀 ${ship.profile.name} DESTROYED (${netDamage} hull damage).`
              : `${ship.profile.name} takes ${netDamage} hull damage (${newHull}/${ship.hullPoints} remaining).`,
          })],
        }))
      },
    ),

    /**
     * Record a critical hit on a ship system. Increments severity by 1.
     * @param {string} shipId
     * @param {string} system — key from CRITICAL_HIT_SYSTEMS
     */
    addCriticalHit: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, system) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return

        const prevSeverity = ship.criticalTracks[system] ?? 0
        const newSeverity  = Math.min(6, prevSeverity + 1)

        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : {
              ...sh,
              criticalTracks: { ...sh.criticalTracks, [system]: newSeverity },
            },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'critical', shipId,
            message: `⚠ ${ship.profile.name}: ${system} critical hit — severity ${newSeverity}.`,
          })],
        }))
      },
    ),

    /**
     * Record a Surface Fixture hit. Increments hit count (max 5 for radiator, 3 for others).
     * @param {string} shipId
     * @param {string} system — key from SURFACE_FIXTURE_SYSTEMS
     */
    addSurfaceFixtureHit: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, system) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return
        const prev = ship.surfaceFixtureTracks?.[system] ?? 0
        const next = prev + 1
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : {
              ...sh,
              surfaceFixtureTracks: { ...(sh.surfaceFixtureTracks ?? {}), [system]: next },
            },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'critical', shipId,
            message: `⚡ ${ship.profile.name}: surface fixture ${system} hit #${next}.`,
          })],
        }))
      },
    ),

    /**
     * Reduce a critical hit track severity (from repair).
     * @param {string} shipId
     * @param {string} system
     */
    reduceCriticalSeverity: wh(
      (shipId, system) => {
        const ship = get().ships.find((s) => s.id === shipId)
        return !!(ship && (ship.criticalTracks[system] ?? 0) > 0)
      },
      (shipId, system) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return

        const current = ship.criticalTracks[system] ?? 0
        const next    = Math.max(0, current - 1)

        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : {
              ...sh,
              criticalTracks: { ...sh.criticalTracks, [system]: next },
            },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId,
            message: `🔧 ${ship.profile.name}: ${system} repaired to severity ${next}.`,
          })],
        }))
      },
    ),

    /**
     * Restore hull points (from emergency repair action).
     * @param {string} shipId
     * @param {number} amount
     */
    repairHull: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, amount) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return

        const newHull = Math.min(ship.hullPoints, ship.currentHull + amount)
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : { ...sh, currentHull: newHull, isDestroyed: false },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId,
            message: `🔧 ${ship.profile.name}: repaired ${amount} hull (${newHull}/${ship.hullPoints}).`,
          })],
        }))
      },
    ),

    /**
     * Patch arbitrary fields on a ship instance (used for crew/assignment updates).
     * @param {string} shipId
     * @param {object} patch
     */
    updateShip: (shipId, patch) => {
      set((s) => ({
        ships: s.ships.map((sh) => sh.id !== shipId ? sh : { ...sh, ...patch }),
      }))
    },

    /**
     * Toggle a signature-modifier flag on a ship. // 2300AD B3 p.57
     * Allowed flags: radiatorsRetracted, heatSinkActive, solarPanelsExtended,
     *                spinHabitatRetracted, reactionDriveActive, activeSensorsOn, stealthActive
     * @param {string} shipId
     * @param {string} flag
     */
    toggleShipFlag: wh((shipId, flag) => !!get().ships.find((s) => s.id === shipId), (shipId, flag) => {
      set((s) => ({
        ships: s.ships.map((sh) => sh.id !== shipId ? sh : { ...sh, [flag]: !sh[flag] }),
      }))
    }),

    /**
     * Reduce current armour (from armour critical hit effects).
     * @param {string} shipId
     * @param {number} reduction
     */
    reduceArmour: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, reduction) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return

        const newArmour = Math.max(0, ship.currentArmour - reduction)
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : { ...sh, currentArmour: newArmour },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'critical', shipId,
            message: `🛡 ${ship.profile.name}: armour reduced to ${newArmour}.`,
          })],
        }))
      },
    ),

    /**
     * Reduce current TAC Speed (from stutterwarp critical hit effects).
     * @param {string} shipId
     * @param {number} reduction
     */
    reduceTacSpeed: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, reduction) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        if (!ship) return

        const newTacSpeed = Math.max(0, ship.currentTacSpeed - reduction)
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : { ...sh, currentTacSpeed: newTacSpeed },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'critical', shipId,
            message: `⚡ ${ship.profile.name}: TAC Speed reduced to ${newTacSpeed}.`,
          })],
        }))
      },
    ),

    /**
     * Set a weapon's offline/destroyed status.
     * @param {string} shipId
     * @param {number} weaponIndex — index in ship.weapons[]
     * @param {{ offline?: boolean, destroyed?: boolean }} status
     */
    setWeaponStatus: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, weaponIndex, status) => {
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : {
              ...sh,
              weapons: sh.weapons.map((w, i) =>
                i !== weaponIndex ? w : { ...w, ...status },
              ),
            },
          ),
        }))
      },
    ),

    // === ACTIONS PHASE ===

    /**
     * Apply Electronic Warfare against a target. // 2300AD B3 p.54
     * Effect 1–4 → target suffers DM−1; Effect 5–6 → DM−2 (capped, not
     * linear with Effect). Effect ≤−5 → the jam backfires and the target
     * instead gains DM+1, having triangulated the jammer's emissions.
     * @param {string} attackerId
     * @param {string} targetId
     * @param {number} effect — check effect
     */
    applyEW: wh(
      (attackerId, targetId) =>
        !!get().ships.find((s) => s.id === attackerId) &&
        !!get().ships.find((s) => s.id === targetId),
      (attackerId, targetId, effect) => {
        const { round, phase } = get()
        const attacker = get().ships.find((s) => s.id === attackerId)
        const target   = get().ships.find((s) => s.id === targetId)
        const penalty  = effect >= 5 ? -2 : effect >= 0 ? -1 : effect <= -5 ? 1 : 0

        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== attackerId ? sh : { ...sh, ewTarget: targetId, ewEffect: penalty },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId: attackerId,
            message: penalty < 0
              ? `📡 ${attacker?.profile.name} jamming ${target?.profile.name} (DM${penalty} to ${target?.profile.name}'s attacks).`
              : penalty > 0
                ? `📡 ${attacker?.profile.name}'s jam on ${target?.profile.name} backfired — ${target?.profile.name} gains DM+1 to attacks.`
                : `📡 ${attacker?.profile.name} jamming attempt on ${target?.profile.name} had no effect.`,
          })],
        }))
      },
    ),

    /**
     * Captain issues a Command to one crew role of their own ship. // 2300AD B3 p.54
     * "A captain can issue one command per combat round PER LEVEL OF THEIR LEADERSHIP SKILL...
     * On Effect 1–4, the recipient gains DM+1 to their actions for that combat round. On
     * Effect 5–6, they receive DM+2." A Captain with Leadership 3 can therefore issue three
     * separate Commands to three different crew roles in the same round — the per-round cap
     * is enforced in the Actions Step UI (ActionModal.jsx), not here. Declared during the
     * Actions Step; activates for the FOLLOWING round (via the commandBonusNextRound →
     * commandBonus promotion in buildNextRoundState), since the Manoeuvre/Attack steps of the
     * current round have already passed by the time a ship reaches its own Actions turn.
     * Re-issuing to a role already commanded this round replaces that role's DM.
     * @param {string} shipId
     * @param {string} role — crew role receiving the order (pilot, gunner_turret, etc.)
     * @param {number} dm — 1 or 2
     */
    applyCommand: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, role, dm) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        set((s) => ({
          ships: s.ships.map((sh) => sh.id !== shipId ? sh : {
            ...sh,
            commandBonusNextRound: [
              ...(sh.commandBonusNextRound ?? []).filter((cb) => cb.role !== role),
              { role, dm },
            ],
          }),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId,
            message: `🎖 ${ship?.profile.name}: Command issued to ${role} — DM+${dm} next round.`,
          })],
        }))
      },
    ),

    /**
     * Add a GM-defined hazard to a ship (fire, breach, fuel leak, etc.). // B3 p.55
     * @param {string} shipId
     * @param {string} label
     */
    addHazard: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, label) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        const hazard = { id: uuidv7(), label }
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : { ...sh, hazards: [...(sh.hazards ?? []), hazard] },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'system', shipId,
            message: `⚠ ${ship?.profile.name}: hazard added — ${label}.`,
          })],
        }))
      },
    ),

    /**
     * Remove a hazard from a ship (damage control success). // B3 p.55
     * @param {string} shipId
     * @param {string} hazardId
     */
    removeHazard: wh(
      (shipId) => !!get().ships.find((s) => s.id === shipId),
      (shipId, hazardId) => {
        const { round, phase } = get()
        const ship = get().ships.find((s) => s.id === shipId)
        const hazard = (ship?.hazards ?? []).find((h) => h.id === hazardId)
        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== shipId ? sh : { ...sh, hazards: (sh.hazards ?? []).filter((h) => h.id !== hazardId) },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId,
            message: `🔧 ${ship?.profile.name}: hazard cleared — ${hazard?.label ?? hazardId}.`,
          })],
        }))
      },
    ),

    // === DRONES / MISSILES — 2300AD B3 p.55–56, p.61 ===
    // See doc/drone-combat-redesign-spec.md — each launched drone/missile is an
    // individually tracked unit that closes range on its own TAC Speed and resolves
    // its own 3-step Firing Solution, rather than an abstract CRB-style "salvo".

    /**
     * Launch a single combat drone/missile at a target. // 2300AD B3 p.61
     * Each unit is tracked individually — launch multiple times for a multi-drone strike.
     * @param {string} ownerId — launching ship
     * @param {string} targetId
     * @param {string} weaponId — 'ritage1' | 'ritage2' | 'whiskey' | 'aero12' | 'kingfisher'
     */
    launchDrone: wh(
      (ownerId, targetId) =>
        !!get().ships.find((s) => s.id === ownerId) &&
        !!get().ships.find((s) => s.id === targetId),
      (ownerId, targetId, weaponId) => {
        const { round, phase, rangeBands } = get()
        const weapon      = WEAPONS[weaponId]
        const launchBand  = rangeBands[pairKey(ownerId, targetId)] ?? 'Long'
        const owner       = get().ships.find((s) => s.id === ownerId)
        const target      = get().ships.find((s) => s.id === targetId)

        const drone = {
          id: uuidv7(),
          ownerId,
          targetId,
          weaponId,
          currentBand:      launchBand,
          roundsElapsed:    0,
          enduranceRounds:  weapon?.enduranceRounds ?? 10,
          destroyed:        false,
          detonated:        false,
          sensorLockSource: null, // null = self-generated Firing Solution (DM-2) // B3 p.55
          launchedRound:    round,
        }

        set((s) => ({
          drones: [...s.drones, drone],
          log: [...s.log, makeLogEntry({
            round, phase, type: 'attack', shipId: ownerId,
            message: `🚀 ${owner?.profile.name} launched ${weapon?.name ?? weaponId} at ${target?.profile.name} from ${launchBand}.`,
          })],
        }))
      },
    ),

    /**
     * Point Defence intercepts a single drone/missile. // 2300AD B3 p.55–56
     * One check per target — a PDC can attempt up to TL-4 of these per round (GM-tracked).
     * @param {string} droneId
     */
    interceptDrone: wh(
      (droneId) => !!get().drones.find((d) => d.id === droneId),
      (droneId) => {
        const { round, phase } = get()
        const drone  = get().drones.find((d) => d.id === droneId)
        const weapon = WEAPONS[drone?.weaponId]
        set((s) => ({
          drones: s.drones.map((d) => d.id !== droneId ? d : { ...d, destroyed: true }),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action',
            message: `🛡 Point Defence destroyed ${weapon?.name ?? drone?.weaponId ?? 'drone'}.`,
          })],
        }))
      },
    ),

    /**
     * Mark a drone/missile as consumed after its attack resolves (hit or miss).
     * The drone is consumed after any resolved attack attempt — these are all
     * single-shot warheads in the current canonical set; see doc/drone-combat-redesign-spec.md §3.
     * Damage itself is applied by the caller via applyDamage, same as AttackModal. // 2300AD B3 p.56
     * @param {string} droneId
     */
    detonateDrone: wh(
      (droneId) => !!get().drones.find((d) => d.id === droneId),
      (droneId) => {
        const { round, phase } = get()
        const drone  = get().drones.find((d) => d.id === droneId)
        const weapon = WEAPONS[drone?.weaponId]
        set((s) => ({
          drones: s.drones.map((d) => d.id !== droneId ? d : { ...d, detonated: true }),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'attack', shipId: drone?.targetId,
            message: `${weapon?.name ?? drone?.weaponId ?? 'Drone'} attack resolved.`,
          })],
        }))
      },
    ),

    // === ROUND / PHASE ADVANCEMENT ===

    /**
     * Start the next round (alias for advancePhase called from Actions).
     */
    startNextRound: wh(() => {
      set((s) => buildNextRoundState(s))
    }),

    // === LOG ===

    /** Add a free-form GM log entry. */
    addLogEntry: (message) => {
      set((s) => ({
        log: [...s.log, makeLogEntry({
          round: s.round, phase: s.phase, type: 'info', message,
        })],
      }))
    },

    clearLog: () => set({ log: [] }),

    // === RESET / IMPORT / EXPORT ===

    resetBattle: () => set({
      id:                    uuidv7(),
      name:                  'New Battle',
      round:                 1,
      phase:                 'setup',
      savedAt:               null,
      initiativeOrder:       [],
      currentActorIndex:     0,
      ships:                 [],
      drones:                [],
      rangeBands:            {},
      log:                   [],
      undoStack:             [],
      redoStack:             [],
    }),

    exportBattleState: () => {
      const {
        id, name, round, phase, initiativeOrder, currentActorIndex,
        ships, drones, rangeBands, log,
      } = get()
      exportBattle({
        id, name, round, phase, initiativeOrder, currentActorIndex,
        ships, drones, rangeBands, log,
        savedAt: new Date().toISOString(),
      })
    },

    importBattleState: async (file) => {
      const battle = await importBattle(file)
      set({
        id:                    battle.id ?? uuidv7(),
        name:                  battle.name ?? 'Imported Battle',
        round:                 battle.round ?? 1,
        phase:                 battle.phase ?? 'setup',
        initiativeOrder:       battle.initiativeOrder ?? [],
        currentActorIndex:     battle.currentActorIndex ?? 0,
        ships:                 battle.ships ?? [],
        drones:                battle.drones ?? [],
        rangeBands:            battle.rangeBands ?? {},
        log:                   battle.log ?? [],
        undoStack:             [],
        redoStack:             [],
      })
    },

    // === SELECTORS (derived, not stored) ===

    /** Get the range band between two ships. */
    getRangeBand: (shipAId, shipBId) => {
      return get().rangeBands[pairKey(shipAId, shipBId)] ?? 'Long'
    },

    /** Whether any drones/missiles are in engagement range awaiting resolution. */
    hasPendingImpacts: () => get().drones.some((d) =>
      !d.destroyed && !d.detonated && (d.currentBand === 'Close' || d.currentBand === 'Adjacent'),
    ),
  }
})

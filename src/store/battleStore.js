import { create } from 'zustand'
import { v7 as uuidv7 } from 'uuid'
import { pairKey, resolveBasicBandMovement } from '../utils/rangeBands.js'
import { advanceMissileOneRound, makeMissileSalvo } from '../utils/missiles.js'
import { exportBattle, importBattle } from '../utils/io.js'

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
    missiles:              structuredClone(s.missiles),
    rangeBands:            structuredClone(s.rangeBands),
    basicBandPool:         structuredClone(s.basicBandPool),
    initiativeOrder:       [...s.initiativeOrder],
    currentActorIndex:     s.currentActorIndex,
    round:                 s.round,
    phase:                 s.phase,
    log:                   structuredClone(s.log),
    pendingMissileImpacts: structuredClone(s.pendingMissileImpacts),
  }
}

/**
 * Build a fresh ship battle-state from a profile object.
 * @param {import('../data/defaultProfiles.js').ShipProfile} profile
 * @param {string} faction
 * @param {string} [startBand]
 * @returns {object}
 */
function shipFromProfile(profile, faction, startBand = 'Long') {
  return {
    id:                 uuidv7(),
    profileId:          profile.id,
    profile,           // full profile reference for display
    faction:            faction ?? profile.faction,
    startBand,
    hullPoints:         profile.hullPoints,
    currentHull:        profile.hullPoints,
    armour:             profile.armour,
    currentArmour:      profile.armour,
    tacSpeed:           profile.tacSpeed,
    currentTacSpeed:    profile.tacSpeed,
    tacSpeedAvailable:  profile.tacSpeed,
    evasionSpent:       0,
    sensors:            { ...profile.sensors },
    computer:           { ...profile.computer },
    weapons:            profile.weapons.map((w) => ({ ...w, offline: false, destroyed: false })),
    software:           [...(profile.software ?? [])],
    criticalTracks:     { ...(profile.criticalTracks ?? {}) },
    crew:               structuredClone(profile.crew ?? []),
    crewAssignments:    { ...(profile.crewAssignments ?? {}) },
    sensorLocked:       false,  // this ship has a sensor lock on it
    sensorLockTarget:   null,   // ship ID this ship has locked
    ewTarget:           null,   // ship ID this ship is jamming
    isDestroyed:        false,
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
   * Build state for the start of the next round.
   * Advances missiles, resets per-round ship fields, increments round counter.
   * @param {object} s — current state
   * @returns {Partial<object>}
   */
  function buildNextRoundState(s) {
    const nextRound = s.round + 1

    // Advance all in-flight missiles by one round
    const advanced   = s.missiles.map((m) => advanceMissileOneRound(m))
    const arrived    = advanced.filter((m) => m.arrived)
    const stillFying = advanced.filter((m) => !m.arrived)

    // Reset per-round ship state
    const ships = s.ships.map((sh) => ({
      ...sh,
      tacSpeedAvailable: sh.currentTacSpeed,
      evasionSpent:      0,
      sensorLockTarget:  null,
      sensorLocked:      false,
      ewTarget:          null,
    }))

    const log = [
      ...s.log,
      makeLogEntry({
        round: nextRound,
        phase: 'manoeuvre',
        type:  'system',
        message: `── Round ${nextRound} begins ──`,
      }),
      ...(arrived.length > 0
        ? [makeLogEntry({
            round: nextRound,
            phase: 'manoeuvre',
            type:  'system',
            message: `⚠ ${arrived.length} missile salvo(s) arriving this round.`,
          })]
        : []),
    ]

    return {
      round:                 nextRound,
      phase:                 'manoeuvre',
      currentActorIndex:     0,
      ships,
      missiles:              stillFying,
      pendingMissileImpacts: [...s.pendingMissileImpacts, ...arrived],
      log,
    }
  }

  return {
    // === STATE ===
    id:                    uuidv7(),
    name:                  'New Battle',
    round:                 1,
    phase:                 'setup',
    initiativeOrder:       [],
    currentActorIndex:     0,
    ships:                 [],
    missiles:              [],
    rangeBands:            {},   // pairKey → band id
    basicBandPool:         {},   // pairKey → accumulated TAC Speed toward next band change
    pendingMissileImpacts: [],
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
     */
    addShip: wh((profile, faction, startBand) => {
      const ship = shipFromProfile(profile, faction, startBand)
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
     * Set the initiative order for the round.
     * @param {string[]} orderedShipIds
     */
    setInitiativeOrder: wh((orderedShipIds) => {
      const { log, round, phase } = get()
      const names = orderedShipIds
        .map((id) => get().ships.find((s) => s.id === id)?.profile.name ?? id)
        .join(' > ')
      set(() => ({
        initiativeOrder:   orderedShipIds,
        currentActorIndex: 0,
        phase:             'manoeuvre',
        log: [...log, makeLogEntry({
          round, phase, type: 'system',
          message: `Initiative: ${names}`,
        })],
      }))
    }),

    // === PHASE ===

    /**
     * Advance to the next phase, or start the next round after Actions.
     */
    advancePhase: wh(() => {
      const { phase } = get()
      const NEXT = { setup: 'manoeuvre', manoeuvre: 'attack', attack: 'actions' }

      if (phase === 'actions') {
        // Start next round
        set((s) => buildNextRoundState(s))
        return
      }

      const next = NEXT[phase] ?? 'manoeuvre'
      set((s) => ({
        phase: next,
        log: [...s.log, makeLogEntry({
          round: s.round, phase: next, type: 'system',
          message: `Phase: ${next.toUpperCase()}`,
        })],
      }))
    }),

    // === MOVEMENT ===

    /**
     * Commit manoeuvre intent for a ship pair and resolve band movement.
     * @param {string} shipAId
     * @param {string} shipBId
     * @param {'closer' | 'farther' | 'hold'} intent
     * @param {number} netTacSpeed — net TAC Speed toward/away this round
     */
    manoeuvre: wh(
      (shipAId, shipBId) =>
        !!get().ships.find((s) => s.id === shipAId) &&
        !!get().ships.find((s) => s.id === shipBId),
      (shipAId, shipBId, intent, netTacSpeed) => {
        const { rangeBands, basicBandPool, round, phase } = get()
        const key         = pairKey(shipAId, shipBId)
        const currentBand = rangeBands[key] ?? 'Long'
        const pool        = basicBandPool[key] ?? 0

        const { newBand, newPool } = resolveBasicBandMovement(
          currentBand, pool, intent, netTacSpeed,
        )

        const bandChanged = newBand !== currentBand
        const shipA = get().ships.find((s) => s.id === shipAId)
        const shipB = get().ships.find((s) => s.id === shipBId)

        set((s) => ({
          rangeBands: { ...s.rangeBands, [key]: newBand },
          basicBandPool: {
            ...s.basicBandPool,
            [key]: bandChanged ? 0 : newPool,
          },
          log: bandChanged
            ? [...s.log, makeLogEntry({
                round, phase, type: 'manoeuvre',
                message: `${shipA?.profile.name} ↔ ${shipB?.profile.name}: ${currentBand} → ${newBand}`,
              })]
            : s.log,
        }))

        // Deduct TAC Speed from the ship that drove the manoeuvre
        if (netTacSpeed > 0 && intent !== 'hold') {
          set((s) => ({
            ships: s.ships.map((sh) =>
              sh.id === shipAId
                ? { ...sh, tacSpeedAvailable: Math.max(0, sh.tacSpeedAvailable - netTacSpeed) }
                : sh,
            ),
          }))
        }
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
        rangeBands:    { ...s.rangeBands, [key]: band },
        basicBandPool: { ...s.basicBandPool, [key]: 0 },
      }))
    }),

    /**
     * Reserve TAC Speed for evasion this round.
     * @param {string} shipId
     * @param {number} amount
     */
    spendEvasion: wh((shipId) => !!get().ships.find((s) => s.id === shipId), (shipId, amount) => {
      set((s) => ({
        ships: s.ships.map((sh) =>
          sh.id !== shipId ? sh : {
            ...sh,
            evasionSpent:      sh.evasionSpent + amount,
            tacSpeedAvailable: Math.max(0, sh.tacSpeedAvailable - amount),
          },
        ),
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
            sh.id !== shipId ? sh : {
              ...sh,
              currentTacSpeed:   newTacSpeed,
              tacSpeedAvailable: Math.min(sh.tacSpeedAvailable, newTacSpeed),
            },
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
     * Apply a Sensor Lock on a target ship.
     * @param {string} attackerId
     * @param {string} targetId
     * @param {number} effect — check effect (used for DM bonus)
     */
    applySensorLock: wh(
      (attackerId, targetId) =>
        !!get().ships.find((s) => s.id === attackerId) &&
        !!get().ships.find((s) => s.id === targetId),
      (attackerId, targetId, effect) => {
        const { round, phase } = get()
        const attacker = get().ships.find((s) => s.id === attackerId)
        const target   = get().ships.find((s) => s.id === targetId)
        const dmBonus  = Math.max(1, effect)

        set((s) => ({
          ships: s.ships.map((sh) => {
            if (sh.id === attackerId) return { ...sh, sensorLockTarget: targetId }
            if (sh.id === targetId)   return { ...sh, sensorLocked: true }
            return sh
          }),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId: attackerId,
            message: `📡 ${attacker?.profile.name} sensor locked ${target?.profile.name} (DM+${dmBonus} to attacks).`,
          })],
        }))
      },
    ),

    /**
     * Apply Electronic Warfare against a target.
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
        const penalty  = -Math.max(1, effect)

        set((s) => ({
          ships: s.ships.map((sh) =>
            sh.id !== attackerId ? sh : { ...sh, ewTarget: targetId },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action', shipId: attackerId,
            message: `📡 ${attacker?.profile.name} jamming ${target?.profile.name} (DM${penalty} to attacks/sensors).`,
          })],
        }))
      },
    ),

    // === MISSILES ===

    /**
     * Launch a missile salvo.
     * @param {string} attackerId
     * @param {string} targetId
     * @param {number} salvoSize
     * @param {number} [attackDmBonus]
     */
    launchMissiles: wh(
      (attackerId, targetId) =>
        !!get().ships.find((s) => s.id === attackerId) &&
        !!get().ships.find((s) => s.id === targetId),
      (attackerId, targetId, salvoSize, attackDmBonus = 0) => {
        const { round, phase, rangeBands } = get()
        const key         = pairKey(attackerId, targetId)
        const launchBand  = rangeBands[key] ?? 'Long'
        const attacker    = get().ships.find((s) => s.id === attackerId)
        const target      = get().ships.find((s) => s.id === targetId)

        const salvo = makeMissileSalvo({
          id: uuidv7(),
          attackerId,
          targetId,
          launchBand,
          salvoSize,
          attackDmBonus,
          round,
        })

        set((s) => ({
          missiles: [...s.missiles, salvo],
          log: [...s.log, makeLogEntry({
            round, phase, type: 'attack', shipId: attackerId,
            message: `🚀 ${attacker?.profile.name} launched ${salvoSize} missile(s) at ${target?.profile.name} from ${launchBand} (impact in ${salvo.flightRounds} round(s)).`,
          })],
        }))
      },
    ),

    /**
     * Resolve point defence against an arriving salvo.
     * @param {string} salvoId
     * @param {number} destroyed — missiles destroyed by PD
     */
    applyPointDefence: wh(
      (salvoId) => !!get().missiles.find((m) => m.id === salvoId),
      (salvoId, destroyed) => {
        const { round, phase } = get()
        const salvo = get().missiles.find((m) => m.id === salvoId)
        if (!salvo) return

        const remaining = Math.max(0, salvo.salvoRemaining - destroyed)
        set((s) => ({
          missiles: s.missiles.map((m) =>
            m.id !== salvoId ? m : { ...m, salvoRemaining: remaining },
          ),
          pendingMissileImpacts: s.pendingMissileImpacts.map((m) =>
            m.id !== salvoId ? m : { ...m, salvoRemaining: remaining },
          ),
          log: [...s.log, makeLogEntry({
            round, phase, type: 'action',
            message: `🛡 Point defence destroyed ${destroyed} missile(s) — ${remaining} remaining.`,
          })],
        }))
      },
    ),

    /**
     * Mark a missile salvo as resolved (after impact damage applied).
     * @param {string} salvoId
     */
    resolveMissileImpact: wh((salvoId) => {
      set((s) => ({
        pendingMissileImpacts: s.pendingMissileImpacts.filter((m) => m.id !== salvoId),
        missiles:              s.missiles.filter((m) => m.id !== salvoId),
      }))
    }),

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
      initiativeOrder:       [],
      currentActorIndex:     0,
      ships:                 [],
      missiles:              [],
      rangeBands:            {},
      basicBandPool:         {},
      pendingMissileImpacts: [],
      log:                   [],
      undoStack:             [],
      redoStack:             [],
    }),

    exportBattleState: () => {
      const {
        id, name, round, phase, initiativeOrder, currentActorIndex,
        ships, missiles, rangeBands, basicBandPool, pendingMissileImpacts, log,
      } = get()
      exportBattle({
        id, name, round, phase, initiativeOrder, currentActorIndex,
        ships, missiles, rangeBands, basicBandPool, pendingMissileImpacts, log,
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
        missiles:              battle.missiles ?? [],
        rangeBands:            battle.rangeBands ?? {},
        basicBandPool:         battle.basicBandPool ?? {},
        pendingMissileImpacts: battle.pendingMissileImpacts ?? [],
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

    /** Get accumulated band-pool value for a pair. */
    getBandPool: (shipAId, shipBId) => {
      return get().basicBandPool[pairKey(shipAId, shipBId)] ?? 0
    },

    /** Whether any missile salvos are pending impact. */
    hasPendingImpacts: () => get().pendingMissileImpacts.length > 0,
  }
})

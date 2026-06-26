import { useEffect, useRef } from 'react'
import { dbGet, dbPut, STORE_BATTLE, STORE_PROFILES } from '../utils/db.js'
import { useBattleStore } from '../store/battleStore.js'
import { useProfilesStore } from '../store/profilesStore.js'

const AUTOSAVE_INTERVAL_MS = 5_000
const BATTLE_KEY   = 'current'
const PROFILES_KEY = 'all'

/**
 * Autosave battle and profiles to IndexedDB every 5 seconds.
 * Restores the last saved battle on mount.
 *
 * Must be mounted once at the root of the app (inside providers).
 */
export function useAutosave() {
  const battleStore   = useBattleStore()
  const profilesStore = useProfilesStore()
  const restoredRef   = useRef(false)

  // Restore last battle on first mount
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    async function restore() {
      try {
        const savedBattle = await dbGet(STORE_BATTLE, BATTLE_KEY)
        if (savedBattle && Array.isArray(savedBattle.ships) && savedBattle.ships.length > 0) {
          useBattleStore.setState({
            ...savedBattle,
            undoStack: [],
            redoStack: [],
          })
        }

        const savedProfiles = await dbGet(STORE_PROFILES, PROFILES_KEY)
        if (Array.isArray(savedProfiles) && savedProfiles.length > 0) {
          useProfilesStore.setState({ profiles: savedProfiles })
        }
      } catch (err) {
        console.error('[useAutosave] restore failed:', err)
      }
    }

    restore()
  }, [])

  // Periodic autosave
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const {
          id, name, round, phase, initiativeOrder, currentActorIndex,
          ships, missiles, rangeBands, basicBandPool, pendingMissileImpacts, log,
        } = battleStore

        if (ships.length > 0) {
          await dbPut(STORE_BATTLE, BATTLE_KEY, {
            id, name, round, phase, initiativeOrder, currentActorIndex,
            ships, missiles, rangeBands, basicBandPool, pendingMissileImpacts, log,
          })
        }

        const { profiles } = profilesStore
        if (profiles.length > 0) {
          await dbPut(STORE_PROFILES, PROFILES_KEY, profiles)
        }
      } catch (err) {
        console.error('[useAutosave] save failed:', err)
      }
    }, AUTOSAVE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [battleStore, profilesStore])
}

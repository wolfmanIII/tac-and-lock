import { create } from 'zustand'
import { uuidv7 } from 'uuid'
import { DEFAULT_PROFILES } from '../data/defaultProfiles.js'
import { exportProfiles, importProfiles } from '../utils/io.js'

/**
 * @typedef {import('../data/defaultProfiles.js').ShipProfile} ShipProfile
 */

export const useProfilesStore = create((set, get) => ({
  /** @type {ShipProfile[]} */
  profiles: structuredClone(DEFAULT_PROFILES),

  // === CRUD ===

  /**
   * Add a new ship profile.
   * @param {Omit<ShipProfile, 'id'>} profile
   */
  addProfile: (profile) =>
    set((s) => ({
      profiles: [...s.profiles, { ...profile, id: uuidv7() }],
    })),

  /**
   * Replace a profile by id.
   * @param {string} id
   * @param {Partial<ShipProfile>} updates
   */
  updateProfile: (id, updates) =>
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates, id } : p)),
    })),

  /**
   * Remove a profile by id.
   * @param {string} id
   */
  deleteProfile: (id) =>
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
    })),

  /**
   * Duplicate an existing profile with a new id and name suffix.
   * @param {string} id
   */
  duplicateProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id)
    if (!profile) return
    set((s) => ({
      profiles: [
        ...s.profiles,
        { ...structuredClone(profile), id: uuidv7(), name: `${profile.name} (copy)` },
      ],
    }))
  },

  // === IMPORT / EXPORT ===

  /** Export all profiles to a JSON file download. */
  exportAll: () => {
    exportProfiles(get().profiles)
  },

  /**
   * Import profiles from a File, merging by id (existing ids are skipped).
   * @param {File} file
   * @returns {Promise<{ added: number, skipped: number }>}
   */
  importFromFile: async (file) => {
    const imported = await importProfiles(file)
    const { profiles } = get()
    const existingIds  = new Set(profiles.map((p) => p.id))

    const fresh   = imported.filter((p) => !existingIds.has(p.id))
    const skipped = imported.length - fresh.length

    set((s) => ({ profiles: [...s.profiles, ...fresh] }))
    return { added: fresh.length, skipped }
  },

  /** Reset to factory defaults. */
  resetToDefaults: () =>
    set({ profiles: structuredClone(DEFAULT_PROFILES) }),
}))

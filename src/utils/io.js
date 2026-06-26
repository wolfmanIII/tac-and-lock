/**
 * Parse a JSON file selected by the user via the File API.
 * @param {File} file
 * @returns {Promise<any>}
 */
export function parseJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result))
      } catch (err) {
        reject(new Error(`Invalid JSON in ${file.name}: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsText(file)
  })
}

/**
 * Trigger a browser download of a JSON-serialised object.
 * @param {any} data
 * @param {string} filename
 */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export a collection of ship profiles to a JSON file.
 * @param {object[]} profiles
 */
export function exportProfiles(profiles) {
  downloadJSON({ version: 1, profiles }, `tac-lock-profiles-${Date.now()}.json`)
}

/**
 * Import ship profiles from a File.
 * @param {File} file
 * @returns {Promise<object[]>}
 */
export async function importProfiles(file) {
  const data = await parseJSONFile(file)
  if (!Array.isArray(data.profiles)) {
    throw new Error('Invalid profiles file: missing "profiles" array.')
  }
  return data.profiles
}

/**
 * Export the full battle state to a JSON file.
 * @param {object} battleState
 */
export function exportBattle(battleState) {
  downloadJSON(battleState, `tac-lock-battle-${Date.now()}.json`)
}

/**
 * Import a battle state from a File.
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function importBattle(file) {
  const data = await parseJSONFile(file)
  if (!data.id || !Array.isArray(data.ships)) {
    throw new Error('Invalid battle file: missing "id" or "ships" array.')
  }
  return data
}

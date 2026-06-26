import { useCallback, useState } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'

export function useProfileImport() {
  const { importFromFile } = useProfilesStore()
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)

  const handleImport = useCallback(() => {
    setError(null)
    const input = document.createElement('input')
    input.type   = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const result = await importFromFile(file)
        if (result) {
          console.info(`[ProfileImport] added ${result.added}, skipped ${result.skipped}`)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }, [importFromFile])

  return { handleImport, importing, error, clearError: () => setError(null) }
}

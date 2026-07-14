import { useState } from 'react'

/**
 * Manual 2D6 input for GM rolls at the table.
 * Calls onChange({ dice, total }) when both dice are set.
 * @param {{ dm?: number, onChange: (result: { dice: number[], total: number }) => void }} props
 */
export function DiceInput({ dm = 0, onChange }) {
  const [d1, setD1] = useState('')
  const [d2, setD2] = useState('')

  function clamp(v) {
    const n = parseInt(v, 10)
    if (isNaN(n)) return ''
    return Math.min(6, Math.max(1, n))
  }

  function handleChange(which, raw) {
    const val = clamp(raw)
    const next1 = which === 1 ? val : d1
    const next2 = which === 2 ? val : d2
    if (which === 1) setD1(val)
    else setD2(val)

    if (next1 !== '' && next2 !== '') {
      const dice  = [Number(next1), Number(next2)]
      const total = dice[0] + dice[1] + dm
      onChange({ dice, total })
    }
  }

  const sum = d1 !== '' && d2 !== '' ? Number(d1) + Number(d2) : null
  const total = sum !== null ? sum + dm : null

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="text-gunmetal-400">2D6:</span>
      <input
        type="number" min={1} max={6} value={d1}
        onChange={(e) => handleChange(1, e.target.value)}
        className="w-10 text-center bg-gunmetal-800 border border-gunmetal-600 rounded px-1 py-0.5 text-gunmetal-200 focus:border-bronze-400 outline-none"
      />
      <span className="text-gunmetal-500">+</span>
      <input
        type="number" min={1} max={6} value={d2}
        onChange={(e) => handleChange(2, e.target.value)}
        className="w-10 text-center bg-gunmetal-800 border border-gunmetal-600 rounded px-1 py-0.5 text-gunmetal-200 focus:border-bronze-400 outline-none"
      />
      {dm !== 0 && (
        <span className={`text-sm ${dm > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {dm > 0 ? `+${dm}` : dm}
        </span>
      )}
      {total !== null && (
        <span className="ml-1 text-bronze-300 font-bold">= {total}</span>
      )}
    </div>
  )
}

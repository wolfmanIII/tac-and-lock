import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * Portal-based tooltip. Wrap the trigger element:
 * <Tooltip content="Armour rating">
 *   <span>ARM: 4</span>
 * </Tooltip>
 */
export function Tooltip({ content, children, delay = 400 }) {
  const [pos, setPos] = useState(null)
  const timerRef = useRef(null)

  const show = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect()
    timerRef.current = setTimeout(() => {
      setPos({ x: r.left + r.width / 2, y: r.bottom + 6 })
    }, delay)
  }, [delay])

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    setPos(null)
  }, [])

  return (
    <>
      <span onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </span>
      {pos && createPortal(
        <div
          className="fixed z-[200] px-2 py-1 text-xs font-mono bg-slate-800 border border-slate-600 text-slate-200 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  )
}

/**
 * BattleLog — collapsible resizable bottom-left overlay.
 * Starts collapsed. Drag the top edge to resize.
 *
 * Smooth drag: transition-[height] is disabled while dragging so each
 * setHeight call applies immediately instead of re-triggering a 200ms animation.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useBattleStore } from '../../store/battleStore.js'

const MAX_VISIBLE  = 60
const DEFAULT_H    = 160
const MIN_H        = 80
const MAX_H        = 600

const TYPE_COLOR = {
  move:   'text-blue-400',
  attack: 'text-red-400',
  damage: 'text-orange-400',
  action: 'text-purple-400',
  system: 'text-gunmetal-400',
  info:   'text-gunmetal-300',
}

const TYPE_PREFIX = {
  move:   '→',
  attack: '⚡',
  damage: '💥',
  action: '⚙',
  system: '·',
  info:   '»',
}

export function BattleLog() {
  const [collapsed,  setCollapsed]  = useState(true)
  const [height,     setHeight]     = useState(DEFAULT_H)
  const [isDragging, setIsDragging] = useState(false)
  const log      = useBattleStore((s) => s.log)
  const clearLog = useBattleStore((s) => s.clearLog)
  const listRef  = useRef(null)
  const dragRef  = useRef(null)

  const visible = log.slice(-MAX_VISIBLE)

  useEffect(() => {
    if (!collapsed && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [log.length, collapsed])

  const onDragStart = useCallback((e) => {
    dragRef.current = { startY: e.clientY, startH: height }
    setIsDragging(true)
    e.preventDefault()
  }, [height])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - e.clientY
      setHeight(Math.max(MIN_H, Math.min(MAX_H, dragRef.current.startH + delta)))
    }
    const onUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setIsDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  return (
    <div
      className={`absolute bottom-7 left-0 z-10 w-1/3 ${isDragging ? '' : 'transition-[height] duration-200'}`}
      style={{ height: collapsed ? 32 : height }}
    >
      <div className="h-full bg-gunmetal-950/85 border-t border-gunmetal-700 backdrop-blur-sm flex flex-col">
        {!collapsed && (
          <div onMouseDown={onDragStart} className="shrink-0 h-1.5 w-full cursor-ns-resize group" title="Drag to resize">
            <div className="mx-auto mt-px w-10 h-0.5 rounded-full bg-gunmetal-700 group-hover:bg-gunmetal-500 transition-colors" />
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-1 border-b border-gunmetal-800 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 text-gunmetal-400 hover:text-gunmetal-200 transition-colors font-mono text-xs tracking-widest"
          >
            <span>{collapsed ? '▲' : '▼'}</span>
            <span>BATTLE LOG</span>
            <span className="text-gunmetal-500">({log.length})</span>
          </button>
          <button onClick={clearLog} className="ml-auto text-gunmetal-400 hover:text-red-400 font-mono text-xs transition-colors">
            CLEAR
          </button>
        </div>

        {!collapsed && (
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-1 space-y-px">
            {visible.length === 0 && (
              <p className="text-gunmetal-400 font-mono text-xs italic">No events recorded.</p>
            )}
            {visible.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 font-mono text-xs leading-relaxed">
                <span className={`shrink-0 ${TYPE_COLOR[entry.type] ?? 'text-gunmetal-400'}`}>
                  {TYPE_PREFIX[entry.type] ?? '·'}
                </span>
                <span className="text-gunmetal-400 shrink-0">R{entry.round}</span>
                <span className="text-gunmetal-300 flex-1">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

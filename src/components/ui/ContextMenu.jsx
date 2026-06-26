import { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore.js'
import { useBattleStore } from '../../store/battleStore.js'

export function ContextMenu() {
  const { contextMenu, hideContextMenu, openModal } = useUIStore()
  const ref = useRef(null)

  useEffect(() => {
    if (!contextMenu) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) hideContextMenu()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [contextMenu, hideContextMenu])

  if (!contextMenu) return null
  const { x, y, shipId } = contextMenu
  if (!shipId) return null

  const items = [
    {
      label: 'View Details',
      action: () => openModal('ship-detail', { shipId }),
    },
    {
      label: 'Attack',
      action: () => openModal('attack', { attackerId: shipId }),
    },
    {
      label: 'Launch Missiles',
      action: () => openModal('missile-launch', { attackerId: shipId }),
    },
    {
      label: 'Crew Action',
      action: () => openModal('action', { shipId }),
    },
    {
      label: 'Assign Crew',
      action: () => openModal('crew-assignment', { shipId }),
    },
    null, // separator
    {
      label: 'Remove from Battle',
      action: () => {
        useBattleStore.getState().removeShip(shipId)
        hideContextMenu()
      },
      danger: true,
    },
  ]

  return (
    <div
      ref={ref}
      className="fixed z-40 min-w-[180px] bg-slate-900 border border-slate-700 rounded shadow-2xl overflow-hidden"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item === null ? (
          <div key={i} className="border-t border-slate-700 my-1" />
        ) : (
          <button
            key={item.label}
            className={`w-full text-left px-4 py-2 text-sm font-mono hover:bg-slate-800 transition-colors
              ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-slate-200'}`}
            onClick={() => { item.action(); hideContextMenu() }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  )
}

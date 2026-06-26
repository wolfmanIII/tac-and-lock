import { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore.js'
import { useBattleStore } from '../../store/battleStore.js'

function MenuItem({ label, onClick, danger = false }) {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm font-mono hover:bg-slate-800 transition-colors
        ${danger ? 'text-red-400 hover:text-red-300' : 'text-slate-200'}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function MenuDivider() {
  return <div className="border-t border-slate-700 my-1" />
}

function MenuShell({ x, y, menuRef, children }) {
  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[180px] bg-slate-900 border border-slate-700 rounded shadow-2xl overflow-hidden"
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  )
}

function BackgroundMenu({ x, y, menuRef, close }) {
  const openModal    = useUIStore((s) => s.openModal)
  const advancePhase = useBattleStore((s) => s.advancePhase)

  return (
    <MenuShell x={x} y={y} menuRef={menuRef}>
      <MenuItem label="Add Ship..."        onClick={() => { openModal('add-ship'); close() }} />
      <MenuDivider />
      <MenuItem label="Roll Initiative..." onClick={() => { openModal('initiative'); close() }} />
      <MenuItem label="Next Phase"         onClick={() => { advancePhase(); close() }} />
    </MenuShell>
  )
}

function ShipMenu({ x, y, menuRef, shipId, close }) {
  const openModal = useUIStore((s) => s.openModal)

  return (
    <MenuShell x={x} y={y} menuRef={menuRef}>
      <MenuItem label="View Details"     onClick={() => { openModal('ship-detail',     { shipId }); close() }} />
      <MenuItem label="Attack"           onClick={() => { openModal('attack',          { attackerId: shipId }); close() }} />
      <MenuItem label="Launch Missiles"  onClick={() => { openModal('missile-launch',  { attackerId: shipId }); close() }} />
      <MenuItem label="Crew Action"      onClick={() => { openModal('action',          { shipId }); close() }} />
      <MenuItem label="Assign Crew"      onClick={() => { openModal('crew-assignment', { shipId }); close() }} />
      <MenuDivider />
      <MenuItem
        label="Remove from Battle"
        danger
        onClick={() => { useBattleStore.getState().removeShip(shipId); close() }}
      />
    </MenuShell>
  )
}

export function ContextMenu() {
  const contextMenu     = useUIStore((s) => s.contextMenu)
  const hideContextMenu = useUIStore((s) => s.hideContextMenu)
  const menuRef         = useRef(null)

  useEffect(() => {
    if (!contextMenu) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) hideContextMenu()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [contextMenu, hideContextMenu])

  if (!contextMenu) return null

  const { x, y, shipId } = contextMenu
  const close = () => hideContextMenu()

  if (shipId) return <ShipMenu x={x} y={y} menuRef={menuRef} shipId={shipId} close={close} />
  return <BackgroundMenu x={x} y={y} menuRef={menuRef} close={close} />
}

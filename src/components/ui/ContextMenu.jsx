import { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore.js'
import { useBattleStore } from '../../store/battleStore.js'

function MenuItem({ icon, label, onClick, danger = false, disabled = false, hint = '' }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled && hint ? hint : undefined}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left font-mono text-xs transition-colors ${
        disabled
          ? 'text-slate-600 cursor-not-allowed'
          : danger
            ? 'text-red-400 hover:bg-red-950/50'
            : 'text-slate-300 hover:bg-slate-700/60 hover:text-slate-100'
      }`}
    >
      <span className={`w-4 text-center shrink-0 ${disabled ? 'opacity-40' : ''}`}>{icon}</span>
      {label}
    </button>
  )
}

function MenuDivider() {
  return <div className="border-t border-slate-700/50 my-0.5" />
}

function MenuShell({ x, y, menuRef, children }) {
  return (
    <div
      ref={menuRef}
      style={{ left: x, top: y }}
      className="absolute z-50 min-w-44 bg-slate-900 border border-slate-600 rounded shadow-xl overflow-hidden"
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
      <MenuItem icon="➕" label="Add ship…"          onClick={() => { openModal('add-ship'); close() }} />
      <MenuDivider />
      <MenuItem icon="🎲" label="Roll Initiative…"   onClick={() => { openModal('initiative'); close() }} />
      <MenuItem icon="🔄" label="Next phase"         onClick={() => { advancePhase(); close() }} />
    </MenuShell>
  )
}

function ShipMenu({ x, y, menuRef, shipId, close }) {
  const openModal         = useUIStore((s) => s.openModal)
  const ships             = useBattleStore((s) => s.ships)
  const drones            = useBattleStore((s) => s.drones)
  const phase             = useBattleStore((s) => s.phase)
  const initiativeOrder   = useBattleStore((s) => s.initiativeOrder)
  const currentActorIndex = useBattleStore((s) => s.currentActorIndex)
  const ship = ships.find((s) => s.id === shipId)

  // This ship's own drones that have closed to engagement range // 2300AD B3 p.61
  const ownDronesInRange = drones.filter((d) =>
    d.ownerId === shipId && !d.destroyed && !d.detonated &&
    (d.currentBand === 'Close' || d.currentBand === 'Adjacent'),
  )

  const isCurrentActor = initiativeOrder[currentActorIndex] === shipId
  const hasActed       = ship?.hasActedThisPhase ?? false

  const canAttack = phase === 'attack'  && isCurrentActor && !hasActed
  const canAction = phase === 'actions' && isCurrentActor && !hasActed

  const attackHint  = phase !== 'attack'  ? 'Solo nella fase Attack'
                    : !isCurrentActor     ? 'Non è il turno di questa nave'
                    : hasActed            ? 'Ha già agito in questa fase'
                    : ''
  const actionHint  = phase !== 'actions' ? 'Solo nella fase Actions'
                    : !isCurrentActor     ? 'Non è il turno di questa nave'
                    : hasActed            ? 'Ha già agito in questa fase'
                    : ''

  return (
    <MenuShell x={x} y={y} menuRef={menuRef}>
      {ship && (
        <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700">
          <p className="font-mono text-xs text-(--neon-cyan) font-bold truncate">{ship.profile.name}</p>
          <p className="font-mono text-xs text-slate-400">Hull {ship.currentHull}/{ship.hullPoints}</p>
        </div>
      )}
      <MenuItem icon="📊" label="Ship sheet"         onClick={() => { openModal('ship-detail',     { shipId }); close() }} />
      <MenuItem icon="🎯" label="Attack…"            onClick={() => { openModal('attack',          { attackerId: shipId }); close() }}
        disabled={!canAttack} hint={attackHint} />
      <MenuItem icon="🚀" label="Launch drone…"      onClick={() => { openModal('drone-launch',    { attackerId: shipId }); close() }}
        disabled={!canAttack} hint={attackHint} />
      <MenuItem icon="⚡" label="Crew action…"       onClick={() => { openModal('action',          { shipId }); close() }}
        disabled={!canAction} hint={actionHint} />
      <MenuItem icon="👥" label="Assign crew…"       onClick={() => { openModal('crew-assignment', { shipId }); close() }} />
      {ownDronesInRange.length > 0 && (
        <>
          <MenuDivider />
          {ownDronesInRange.map((d) => (
            <MenuItem key={d.id} icon="💥" label={`Resolve drone attack (${d.currentBand})…`}
              onClick={() => { openModal('drone-attack', { droneId: d.id }); close() }}
              disabled={!canAttack} hint={attackHint} />
          ))}
        </>
      )}
      <MenuDivider />
      <MenuItem icon="🗑" label="Remove from battle" danger onClick={() => { useBattleStore.getState().removeShip(shipId); close() }} />
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

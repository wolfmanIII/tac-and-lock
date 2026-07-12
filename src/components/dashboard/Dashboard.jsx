/**
 * Dashboard — pre-battle lobby.
 * Left panel: ship profile management (list + actions).
 * Right panel: CatalogPanel | ShipProfileForm | SessionPanel — toggled via `view` state.
 *
 * Pattern ported from thrust-and-drift Dashboard.
 */

import { useState } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'
import { useBattleStore }   from '../../store/battleStore.js'
import { useUIStore }       from '../../store/uiStore.js'
import { ShipProfileForm }  from '../forms/ShipProfileForm.jsx'
import { CatalogPanel }     from './CatalogPanel.jsx'
import { useProfileImport } from './useProfileImport.js'
import { Tooltip }          from '../ui/Tooltip.jsx'
import { FACTIONS, FACTION_COLOR } from '../../data/factions.js'
import { RANGE_BANDS, RANGE_BAND_ORDER } from '../../data/rangeBands.js'
import { pairKey }          from '../../utils/rangeBands.js'
import { useShipTokenIcon } from '../battle/useShipTokenIcon.js'

const PHASE_LABEL = {
  setup: 'SETUP', initiative: 'INITIATIVE', manoeuvre: 'MANOEUVRE', attack: 'ATTACK', actions: 'ACTIONS',
}

const ROSTER_TOKEN_SIZE = 40

/** Ship token silhouette for a roster row — same icon as the battle bento card. */
function RosterShipToken({ ship, fallbackColor }) {
  const tokenRef = useShipTokenIcon({ ...ship, color: ship.color ?? fallbackColor }, ROSTER_TOKEN_SIZE)
  return <canvas ref={tokenRef} width={ROSTER_TOKEN_SIZE} height={ROSTER_TOKEN_SIZE} className="shrink-0" />
}

/** TAC Speed / Armour mini-column. */
function RosterCombatStats({ ship }) {
  return (
    <div className="w-24 shrink-0 leading-tight">
      <p className="font-mono text-xs text-slate-300">TAC SPD {ship.currentTacSpeed ?? '—'}</p>
      <p className="font-mono text-xs text-slate-300">ARMOUR {ship.currentArmour ?? '—'}</p>
    </div>
  )
}

/** Nearest enemy range band — 2300AD has no hex/vector mode, only the band system. */
function nearestEnemyRangeBand(ship, ships, rangeBands) {
  const enemies = ships.filter((s) => s.id !== ship.id && s.faction !== ship.faction)
  if (enemies.length === 0) return null
  let nearestIdx = RANGE_BAND_ORDER.length - 1
  for (const enemy of enemies) {
    const band = rangeBands?.[pairKey(ship.id, enemy.id)] ?? 'Distant'
    const idx = RANGE_BAND_ORDER.indexOf(band)
    if (idx !== -1 && idx < nearestIdx) nearestIdx = idx
  }
  return RANGE_BAND_ORDER[nearestIdx]
}

/** Range-to-nearest-enemy telemetry mini-column. */
function RosterTelemetry({ band }) {
  return (
    <div className="w-28 shrink-0 leading-tight">
      <p className="font-mono text-xs text-slate-300">RANGE</p>
      <p className="font-mono text-xs text-slate-300">{band ?? '—'}</p>
    </div>
  )
}

/** Dogfight/destroyed status mini-column — defaults to COMBAT/NEUTRAL. */
function RosterStatus({ ship, band }) {
  const badge = ship.isDestroyed
    ? { label: '💥 DESTROYED', className: 'text-red-400' }
    : (band === 'Adjacent' || band === 'Close')
      ? { label: '⚔ DOGFIGHT', className: 'text-amber-400' }
      : ship.faction === 'neutral'
        ? { label: '○ NEUTRAL', className: 'text-slate-400' }
        : { label: '● COMBAT', className: 'text-(--neon-cyan)' }
  return (
    <div className="w-24 shrink-0 leading-tight">
      <p className={`font-mono text-xs font-bold truncate ${badge.className}`}>{badge.label}</p>
    </div>
  )
}

// ── Tiny icon button ──────────────────────────────────────────────────────

function ActionIcon({ label, title, onClick, dim = '' }) {
  return (
    <Tooltip label={title}>
      <button
        onClick={onClick}
        className={`w-6 h-6 flex items-center justify-center text-slate-400 font-mono text-sm rounded hover:bg-slate-700 transition-colors ${dim}`}
      >
        {label}
      </button>
    </Tooltip>
  )
}

// ── Left panel: profiles list ─────────────────────────────────────────────

function ProfilesPanel({ editingId, onEdit, onNew, onCatalog, catalogOpen, onAddToBattle }) {
  const profiles         = useProfilesStore((s) => s.profiles)
  const deleteProfile    = useProfilesStore((s) => s.deleteProfile)
  const duplicateProfile = useProfilesStore((s) => s.duplicateProfile)
  const exportAll        = useProfilesStore((s) => s.exportAll)
  const { importStatus, fileInputRef, handleImport } = useProfileImport()
  const [filter, setFilter] = useState('')

  const filtered = profiles.filter((p) =>
    (p.name ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.class ?? '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700 shrink-0 bg-slate-900">
        <h2 className="font-display text-xs text-(--neon-cyan) tracking-widest">
          SHIP PROFILES <span className="text-slate-400">({profiles.length})</span>
        </h2>
      </div>

      <div className="px-4 pt-3 pb-2 shrink-0">
        <input
          type="text"
          placeholder="Search profile…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded px-3 py-1.5 focus:outline-none focus:border-(--neon-cyan)/60 placeholder:text-slate-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 py-1">
        {filtered.length === 0 && (
          <p className="text-slate-400 font-mono text-xs italic px-2 py-2">
            {filter ? 'No results.' : 'No profiles. Create one.'}
          </p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`group flex items-center gap-2 px-2 py-2 rounded transition-colors ${
              editingId === p.id
                ? 'bg-(--neon-cyan)/10 border border-(--neon-cyan)/30'
                : 'border border-transparent hover:bg-slate-800'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className={`font-mono text-xs font-bold truncate ${editingId === p.id ? 'text-(--neon-cyan)' : 'text-slate-200'}`}>
                {p.name}
              </p>
              <p className="text-slate-400 font-mono text-xs truncate">
                {[p.class, p.tonnage ? `${p.tonnage}t` : null, p.hullPoints ? `HP${p.hullPoints}` : null].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className={`flex gap-1 shrink-0 ${editingId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <ActionIcon label="▶" title="Add to Battle" onClick={() => onAddToBattle(p)} dim="hover:text-emerald-400" />
              <ActionIcon label="✎" title="Edit"      onClick={() => onEdit(p.id)} dim="text-(--neon-cyan)" />
              <ActionIcon label="⧉" title="Duplicate" onClick={() => duplicateProfile(p.id)} />
              <ActionIcon label="⊗" title="Delete"    onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProfile(p.id) }} dim="hover:text-red-400" />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 shrink-0 space-y-2">
        {importStatus && (
          <p className={`font-mono text-xs ${importStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
            {importStatus.ok ? '✅ ' : '🚨 '}{importStatus.msg}
          </p>
        )}
        <button
          onClick={onNew}
          className="w-full py-1.5 bg-(--neon-cyan)/10 border border-(--neon-cyan)/30 text-(--neon-cyan) font-display text-xs tracking-widest rounded hover:bg-(--neon-cyan)/20 transition-colors"
        >
          + NEW PROFILE
        </button>
        <button
          onClick={onCatalog}
          className={`w-full py-1.5 border font-display text-xs tracking-widest rounded transition-colors ${
            catalogOpen
              ? 'border-amber-600/50 bg-amber-900/20 text-amber-400'
              : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
          }`}
        >
          📖 OFFICIAL CATALOG
        </button>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-1 border border-slate-700 text-slate-400 font-display text-xs rounded hover:border-slate-500 transition-colors"
          >↓ IMPORT</button>
          <button
            onClick={exportAll}
            className="flex-1 py-1 border border-slate-700 text-slate-400 font-display text-xs rounded hover:border-slate-500 transition-colors"
          >↑ EXPORT</button>
        </div>
      </div>
    </div>
  )
}

// ── Add-to-battle dialog ──────────────────────────────────────────────────

function AddToBattleDialog({ profile, onConfirm, onCancel }) {
  const [faction, setFaction] = useState(profile.faction ?? 'players')
  const [band,    setBand]    = useState('Long')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm space-y-4">
        <p className="font-display text-(--neon-cyan) text-sm tracking-widest">ADD TO BATTLE</p>
        <p className="text-slate-300 text-sm font-mono">{profile.name}</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-display text-slate-500 tracking-widest block mb-1">FACTION</label>
            <div className="flex gap-2">
              {FACTIONS.map((f) => (
                <button
                  key={f.id}
                  className={`flex-1 py-1 text-xs font-mono border rounded transition-colors ${faction === f.id ? 'border-sky-500 text-sky-300 bg-sky-900/30' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  style={faction === f.id ? { borderColor: f.color, color: f.color } : {}}
                  onClick={() => setFaction(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-display text-slate-500 tracking-widest block mb-1">INITIAL RANGE</label>
            <select
              value={band} onChange={(e) => setBand(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-sm rounded px-2 py-1.5 focus:border-(--neon-cyan) outline-none"
            >
              {RANGE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label} — {b.distance}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="flex-1 py-2 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={onCancel}>CANCEL</button>
          <button className="flex-1 py-2 text-xs font-display tracking-widest text-(--neon-cyan) border border-(--neon-cyan)/40 hover:bg-(--neon-cyan)/10 rounded" onClick={() => onConfirm(profile, faction, band)}>CONFIRM</button>
        </div>
      </div>
    </div>
  )
}

// ── Session panel (right default) ─────────────────────────────────────────

function StatusLine({ label, value, active = true }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-(--neon-cyan) animate-pulse' : 'bg-slate-700'}`} />
      <span className="font-mono text-xs text-slate-400 flex-1">{label}</span>
      <span className={`font-mono text-xs ${active ? 'text-(--neon-cyan)/60' : 'text-slate-400'}`}>{value}</span>
    </div>
  )
}

function SessionPanel({ onEnterBattle, onLoadBattle, loading, onFieldManual }) {
  const ships      = useBattleStore((s) => s.ships)
  const drones     = useBattleStore((s) => s.drones)
  const round      = useBattleStore((s) => s.round)
  const phase      = useBattleStore((s) => s.phase)
  const name       = useBattleStore((s) => s.name)
  const savedAt    = useBattleStore((s) => s.savedAt)
  const rangeBands = useBattleStore((s) => s.rangeBands)
  const { exportBattleState, resetBattle } = useBattleStore()

  const byFaction = ships.reduce((acc, ship) => {
    const f = ship.faction ?? 'neutral'
    if (!acc[f]) acc[f] = []
    acc[f].push(ship)
    return acc
  }, {})

  const savedAtFormatted = savedAt ? new Date(savedAt).toLocaleString('it-IT') : '—'

  return (
    <div className="h-full flex overflow-hidden">

      {/* Left: console */}
      <div className="border-r border-slate-800 flex flex-col overflow-hidden" style={{ width: 300 }}>
        <div className="px-5 py-3 border-b border-slate-800 shrink-0">
          <p className="font-display text-xs text-slate-400 tracking-widest">// OPERATIONS CONSOLE</p>
        </div>
        <div className="px-5 py-3 space-y-1.5 border-b border-slate-800 shrink-0">
          <StatusLine label="NAVIGATION"   value="ACTIVE"  />
          <StatusLine label="SENSORS"      value="ONLINE"  />
          <StatusLine label="ARMAMENTS"    value="READY"   />
          <StatusLine label="MISSION DATA" value="STANDBY" active={false} />
        </div>
        <div className="flex-1 px-5 py-5 space-y-3 overflow-y-auto">
          <p className="font-display text-xs text-slate-400 tracking-widest mb-1">ACTIONS</p>
          <button
            onClick={onEnterBattle}
            className="w-full py-3.5 bg-(--neon-cyan)/10 border border-(--neon-cyan)/40 text-(--neon-cyan) font-display text-xs tracking-widest rounded-lg hover:bg-(--neon-cyan)/20 transition-colors"
          >
            <span className="text-base block mb-0.5">▶</span>
            ENTER BATTLE
            <span className="block font-mono text-slate-400 mt-0.5 normal-case tracking-normal font-normal text-xs">Go to battle screen</span>
          </button>
          <button
            onClick={onLoadBattle}
            disabled={loading}
            className="w-full py-3 border border-slate-700 text-slate-400 font-display text-xs tracking-widest rounded-lg hover:border-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="text-sm block mb-0.5">{loading ? '⌛' : '↓'}</span>
            {loading ? 'LOADING…' : 'RESUME FROM FILE'}
            <span className="block font-mono text-slate-400 mt-0.5 normal-case tracking-normal font-normal text-xs">Import .json session</span>
          </button>
          {ships.length > 0 && (
            <div className="flex gap-2 pt-1">
              <button className="flex-1 py-1.5 text-xs font-display tracking-widest text-slate-400 border border-slate-700 hover:bg-slate-800 rounded" onClick={exportBattleState}>SAVE</button>
              <button className="flex-1 py-1.5 text-xs font-display tracking-widest text-red-400 border border-red-900 hover:bg-red-900/20 rounded" onClick={() => { if (confirm('Clear all ships?')) resetBattle() }}>CLEAR</button>
            </div>
          )}
          <button
            onClick={onFieldManual}
            className="w-full py-2 border border-slate-700 text-slate-500 font-display text-xs tracking-widest rounded-lg hover:border-slate-600 hover:text-slate-400 transition-colors"
          >
            📖 FIELD MANUAL
          </button>
        </div>
        <div className="shrink-0 px-5 py-3 border-t border-slate-800">
          <p className="font-mono text-xs text-slate-400 leading-relaxed">Add profiles on the left before entering battle.</p>
        </div>
      </div>

      {/* Right: tactical display */}
      <div className="relative flex flex-col flex-1 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 pointer-events-none opacity-25"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(15,23,42,0.5) 3px, rgba(15,23,42,0.5) 4px)' }} />
        <div className="relative z-10 flex flex-col h-full">
          <div className="px-6 py-3 border-b border-slate-800/60 shrink-0 flex items-center gap-3">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ships.length ? 'bg-(--neon-cyan) animate-pulse' : 'bg-slate-600'}`} />
            <span className="font-display text-xs text-slate-400 tracking-widest">TACTICAL DISPLAY</span>
            <div className="flex-1 h-px bg-slate-800" />
            <span className="font-display text-xs text-slate-400 tracking-widest">{ships.length ? 'ROSTER READY' : 'STANDBY'}</span>
          </div>
          <div className="px-6 py-3 border-b border-slate-800/60 shrink-0 grid grid-cols-2 gap-x-8 gap-y-1">
            {[
              { k: 'PROTOCOL',     v: '2300AD/TCV-1.0' },
              { k: 'RANGE SYSTEM', v: 'BAND' },
              { k: 'ROUND',        v: ships.length ? round : '—' },
              { k: 'PHASE',        v: ships.length ? (PHASE_LABEL[phase] ?? phase.toUpperCase()) : '—' },
              { k: 'VESSELS',      v: ships.length || '—' },
              { k: 'DRONES',       v: ships.length ? drones.length : '—' },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="font-mono text-xs text-slate-400">{k}</span>
                <span className={`font-mono text-xs ${ships.length ? 'text-(--neon-cyan)/70' : 'text-slate-400'}`}>{v}</span>
              </div>
            ))}
          </div>
          {ships.length > 0 && (
            <div className="px-6 py-2 border-b border-slate-800/40 shrink-0">
              <span className="font-mono text-xs text-slate-400">SESSION </span>
              <span className="font-mono text-xs text-slate-300">{name}</span>
              <span className="font-mono text-xs text-slate-400 ml-3">SAVED </span>
              <span className="font-mono text-xs text-slate-400">{savedAtFormatted}</span>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {ships.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                <svg width="72" height="72" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#0891b2" strokeWidth="0.8" />
                  <circle cx="50" cy="50" r="4"  fill="none" stroke="#0891b2" strokeWidth="0.8" />
                  <line x1="12" y1="50" x2="26" y2="50" stroke="#0891b2" strokeWidth="0.8" />
                  <line x1="74" y1="50" x2="88" y2="50" stroke="#0891b2" strokeWidth="0.8" />
                  <line x1="50" y1="12" x2="50" y2="26" stroke="#0891b2" strokeWidth="0.8" />
                  <line x1="50" y1="74" x2="50" y2="88" stroke="#0891b2" strokeWidth="0.8" />
                </svg>
                <p className="font-display text-xs text-slate-400 tracking-widest">NO VESSELS ASSIGNED</p>
              </div>
            ) : (
              <>
                <p className="font-display text-xs text-slate-400 tracking-widest mb-3">SHIP ROSTER</p>
                {FACTIONS.map(({ id: fId, label }) => {
                  const group = byFaction[fId]
                  if (!group || group.length === 0) return null
                  return (
                    <div key={fId} className="mb-4">
                      <p className="font-display text-xs tracking-widest mb-2" style={{ color: FACTION_COLOR[fId] }}>
                        {label.toUpperCase()} · {group.length}
                      </p>
                      <div className="space-y-1.5">
                        {group.map((s) => {
                          const hull = s.hullPoints ?? 0
                          const cur  = s.currentHull ?? hull
                          const pct  = hull > 0 ? Math.max(0, cur / hull) : 1
                          const bar  = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#eab308' : '#ef4444'
                          const band = nearestEnemyRangeBand(s, ships, rangeBands)
                          return (
                            <div key={s.id} className="flex items-center gap-2.5">
                              <RosterShipToken ship={s} fallbackColor={FACTION_COLOR[fId] ?? '#64748b'} />
                              <div className="min-w-0 flex-1">
                                <p className="font-mono text-xs text-slate-200 font-bold truncate">{s.profile?.name ?? '?'}</p>
                                <p className="font-mono text-xs text-slate-400 truncate">{s.profile?.class ?? '—'}</p>
                              </div>
                              <RosterCombatStats ship={s} />
                              <RosterTelemetry band={band} />
                              <RosterStatus ship={s} band={band} />
                              <div className="w-14 h-1 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: bar }} />
                              </div>
                              <span className="font-mono text-xs text-slate-400 w-10 text-right shrink-0">{cur}/{hull || '?'}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
          <div className="shrink-0 px-6 py-2 border-t border-slate-800/60">
            <div className="flex justify-between font-mono text-xs text-slate-400">
              <span>SYS:ONLINE</span>
              <span>2300AD // MONGOOSE PUBLISHING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  /**
   * view state — same pattern as thrust-and-drift:
   *   null        → SessionPanel
   *   'catalog'   → CatalogPanel
   *   'new'       → ShipProfileForm (create)
   *   string (id) → ShipProfileForm (edit)
   */
  const [view,      setView]      = useState(null)
  const [addTarget, setAddTarget] = useState(null)
  const [loadingBattle, setLoadingBattle] = useState(false)

  const { addShip, importBattleState } = useBattleStore()
  const { gotoScreen } = useUIStore()

  const handleEdit    = (id) => setView(id)
  const handleNew     = ()   => setView('new')
  const handleCatalog = ()   => setView((v) => (v === 'catalog' ? null : 'catalog'))
  const handleClose   = ()   => setView(null)

  const editingId   = view !== null && view !== 'catalog' && view !== 'new' ? view : null
  const catalogOpen = view === 'catalog'

  function handleConfirmAdd(profile, faction, band) {
    addShip(profile, faction, band)
    setAddTarget(null)
  }

  async function handleLoadBattle() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      setLoadingBattle(true)
      try { await importBattleState(file); gotoScreen('battle') }
      catch (err) { alert(`Import failed: ${err.message}`) }
      finally { setLoadingBattle(false) }
    }
    input.click()
  }

  return (
    <div className="w-full h-full flex bg-slate-950">

      {/* Left: profile library */}
      <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
        <ProfilesPanel
          editingId={editingId}
          onEdit={handleEdit}
          onNew={handleNew}
          onCatalog={handleCatalog}
          catalogOpen={catalogOpen}
          onAddToBattle={setAddTarget}
        />
      </div>

      {/* Right: header + main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="shrink-0 px-6 py-4 border-b border-slate-800 flex items-center gap-4">
          <div className="logo-stutter-wrap">
            <img src="/logo.png" alt="TAC &amp; LOCK" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display font-bold italic text-(--neon-cyan) tracking-widest text-2xl leading-tight">
              TAC &amp; LOCK
            </h1>
            <span className="font-display text-xs text-slate-400 tracking-widest">TACTICAL INTERFACE // 2300AD SPACE COMBAT</span>
            <span className="font-display text-xs text-slate-400 tracking-widest">SPACE COMBAT SIMULATOR</span>
          </div>
          <span className="ml-auto text-slate-400 font-mono text-xs">v{__APP_VERSION__}</span>
        </header>

        <main className="flex-1 overflow-hidden">
          {catalogOpen ? (
            <CatalogPanel />
          ) : view === 'new' || editingId ? (
            <ShipProfileForm
              key={view}
              profileId={editingId}
              onSave={handleClose}
              onCancel={handleClose}
            />
          ) : (
            <SessionPanel
              onEnterBattle={() => gotoScreen('battle')}
              onLoadBattle={handleLoadBattle}
              loading={loadingBattle}
              onFieldManual={() => gotoScreen('help')}
            />
          )}
        </main>

      </div>

      {addTarget && (
        <AddToBattleDialog
          profile={addTarget}
          onConfirm={handleConfirmAdd}
          onCancel={() => setAddTarget(null)}
        />
      )}
    </div>
  )
}

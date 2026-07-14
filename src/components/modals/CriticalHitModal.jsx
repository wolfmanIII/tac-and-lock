/**
 * CriticalHitModal — two modes:
 *   mode 'surface'  → Surface Fixture Damage (B3 p.58): any hit Effect ≥ 3
 *   mode 'internal' → Internal Critical Hit (CRB location/effects tables + 2300AD substitutions)
 */

import { useState } from 'react'
import { useBattleStore } from '../../store/battleStore.js'
import {
  SURFACE_FIXTURE_TABLE,
  SURFACE_FIXTURE_EFFECTS,
  SURFACE_FIXTURE_SYSTEM_LABELS,
  INTERNAL_LOCATION_TABLE,
  CRITICAL_HIT_EFFECTS,
  CRITICAL_HIT_SYSTEM_LABELS,
  computeCriticalSeverity,
  getMaxSeverity,
} from '../../data/criticalHits.js'
import { roll2D6 } from '../../utils/dice.js'

/** Reaction Drive is a 2-state binary (inoperable/destroyed), not a numeric severity. */
function severityLabel(system, severity) {
  if (system === 'reactionDrive') {
    return severity >= 2 ? 'DESTROYED' : severity >= 1 ? 'INOPERABLE' : 'OK'
  }
  return severity
}

// ── Surface Fixture mode ───────────────────────────────────────────────────

function SurfaceFixtureMode({ ship, onClose }) {
  const addSurfaceHit = useBattleStore((s) => s.addSurfaceFixtureHit)

  const [roll,    setRoll]    = useState(null)
  const [manual,  setManual]  = useState('')
  const [applied, setApplied] = useState(false)

  const total  = roll ?? (manual ? Math.max(2, Math.min(12, parseInt(manual, 10))) : null)
  const system = total !== null ? SURFACE_FIXTURE_TABLE[total] : null
  const currentHits = system ? (ship?.surfaceFixtureTracks?.[system] ?? 0) : 0
  const nextHit     = currentHits + 1
  const effect      = system ? SURFACE_FIXTURE_EFFECTS[system]?.[nextHit] : null

  function doRoll() {
    const dice = roll2D6()
    setRoll(dice[0] + dice[1])
    setManual('')
  }

  function apply() {
    if (!system || applied) return
    addSurfaceHit(ship.id, system)
    setApplied(true)
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="font-display text-amber-400 text-sm tracking-widest">SURFACE FIXTURE</p>
        <p className="font-mono text-[10px] text-gunmetal-500 mt-0.5">
          Effect ≥ 3 — roll 2D on fixture table // 2300AD B3 p.58
        </p>
        <p className="font-mono text-xs text-gunmetal-300 mt-1">{ship?.profile?.name ?? ship?.id}</p>
      </div>

      {/* Roll */}
      <div className="flex items-center gap-3">
        <button
          onClick={doRoll}
          className="px-3 py-1.5 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded transition-colors"
        >
          ROLL 2D6
        </button>
        <input
          type="number" min={2} max={12} value={manual}
          onChange={(e) => { setManual(e.target.value); setRoll(null) }}
          placeholder="or type"
          className="w-20 text-center bg-gunmetal-800 border border-gunmetal-600 rounded px-2 py-1.5 text-gunmetal-200 font-mono text-sm focus:border-amber-500 outline-none"
        />
        {total !== null && <span className="font-mono text-amber-300 font-bold">= {total}</span>}
      </div>

      {/* Compact reference table */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 bg-gunmetal-800/50 rounded p-2.5 text-[10px] font-mono">
        {Object.entries(SURFACE_FIXTURE_TABLE).map(([d, sys]) => (
          <div key={d} className={`flex gap-2 ${sys === system ? 'text-amber-400 font-bold' : 'text-gunmetal-500'}`}>
            <span className="text-gunmetal-600 w-5">{d}:</span>
            <span>{SURFACE_FIXTURE_SYSTEM_LABELS[sys] ?? sys}</span>
          </div>
        ))}
      </div>

      {/* Result */}
      {system && (
        <div className="bg-amber-950/40 border border-amber-800/70 rounded p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-display text-amber-300 text-sm tracking-wide">
              {SURFACE_FIXTURE_SYSTEM_LABELS[system] ?? system}
            </p>
            <span className="font-mono text-xs text-gunmetal-400">
              hit #{currentHits + 1}
            </span>
          </div>
          {effect
            ? <p className="font-mono text-xs text-gunmetal-200">{effect.label}</p>
            : <p className="font-mono text-xs text-gunmetal-500 italic">No further effect.</p>
          }
          {effect?.mechanics?.map((m, i) => (
            <p key={i} className="font-mono text-[10px] text-gunmetal-400">⟩ {m.type}{m.value !== undefined ? `: ${m.value}` : ''}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2 text-xs font-display tracking-widest text-gunmetal-400 border border-gunmetal-700 hover:bg-gunmetal-800 rounded">
          {applied ? 'CLOSE' : 'SKIP'}
        </button>
        {system && !applied && (
          <button onClick={apply}
            className="flex-1 py-2 text-xs font-display tracking-widest text-amber-400 border border-amber-800 hover:bg-amber-900/20 rounded">
            APPLY HIT
          </button>
        )}
      </div>
    </div>
  )
}

// ── Internal Critical Hit mode ─────────────────────────────────────────────

function InternalCritMode({ ship, effect: attackEffect, onClose }) {
  const addCritical = useBattleStore((s) => s.addCriticalHit)

  const [roll,    setRoll]    = useState(null)
  const [manual,  setManual]  = useState('')
  const [applied, setApplied] = useState(false)

  const total      = roll ?? (manual ? Math.max(2, Math.min(12, parseInt(manual, 10))) : null)
  const system     = total !== null ? INTERNAL_LOCATION_TABLE[total] : null
  const currentSev = ship?.criticalTracks?.[system] ?? 0
  const maxSev     = system ? getMaxSeverity(system) : 6
  const isMaxed    = system ? currentSev >= maxSev : false
  const newSev     = system && !isMaxed ? computeCriticalSeverity(attackEffect, currentSev, system) : null
  const effectEntry = system && newSev !== null ? CRITICAL_HIT_EFFECTS[system]?.[newSev] : null

  function doRoll() {
    const dice = roll2D6()
    setRoll(dice[0] + dice[1])
    setManual('')
  }

  function apply() {
    if (!system || applied || isMaxed) return
    addCritical(ship.id, system, attackEffect)
    setApplied(true)
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="font-display text-red-400 text-sm tracking-widest">INTERNAL CRITICAL</p>
        <p className="font-mono text-[10px] text-gunmetal-500 mt-0.5">
          Roll 2D on location table // Trav2022 CRB p.158–159 + 2300AD substitutions
        </p>
        <p className="font-mono text-xs text-gunmetal-300 mt-1">{ship?.profile?.name ?? ship?.id}</p>
      </div>

      {/* Roll */}
      <div className="flex items-center gap-3">
        <button
          onClick={doRoll}
          className="px-3 py-1.5 text-xs font-display tracking-widest text-red-400 border border-red-800 hover:bg-red-900/20 rounded transition-colors"
        >
          ROLL LOCATION
        </button>
        <input
          type="number" min={2} max={12} value={manual}
          onChange={(e) => { setManual(e.target.value); setRoll(null) }}
          placeholder="or type"
          className="w-20 text-center bg-gunmetal-800 border border-gunmetal-600 rounded px-2 py-1.5 text-gunmetal-200 font-mono text-sm focus:border-red-500 outline-none"
        />
        {total !== null && <span className="font-mono text-red-300 font-bold">= {total}</span>}
      </div>

      {/* Compact reference table */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 bg-gunmetal-800/50 rounded p-2.5 text-[10px] font-mono">
        {Object.entries(INTERNAL_LOCATION_TABLE).map(([d, sys]) => (
          <div key={d} className={`flex gap-2 ${sys === system ? 'text-red-400 font-bold' : 'text-gunmetal-500'}`}>
            <span className="text-gunmetal-600 w-5">{d}:</span>
            <span>{CRITICAL_HIT_SYSTEM_LABELS[sys] ?? sys}</span>
          </div>
        ))}
      </div>

      {/* Result */}
      {system && (
        <div className="bg-red-950/40 border border-red-900/60 rounded p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-display text-red-300 text-sm tracking-wide">
              {CRITICAL_HIT_SYSTEM_LABELS[system] ?? system}
            </p>
            <span className="font-mono text-xs text-gunmetal-400">
              {severityLabel(system, currentSev)} → <span className="text-red-400">{isMaxed ? severityLabel(system, currentSev) : severityLabel(system, newSev)}</span>
            </span>
          </div>
          {isMaxed && (
            <p className="font-mono text-xs text-amber-400">
              {CRITICAL_HIT_SYSTEM_LABELS[system] ?? system} already at max severity — CRB: this hit instead inflicts 6D extra damage, ignoring Armour (apply manually).
            </p>
          )}
          {!isMaxed && effectEntry && <p className="font-mono text-xs text-gunmetal-200">{effectEntry.label}</p>}
          {!isMaxed && effectEntry?.mechanics?.map((m, i) => (
            <p key={i} className="font-mono text-[10px] text-gunmetal-400">⟩ {m.type}{m.value !== undefined ? `: ${m.value}` : ''}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2 text-xs font-display tracking-widest text-gunmetal-400 border border-gunmetal-700 hover:bg-gunmetal-800 rounded">
          {applied ? 'CLOSE' : 'SKIP'}
        </button>
        {system && !applied && !isMaxed && (
          <button onClick={apply}
            className="flex-1 py-2 text-xs font-display tracking-widest text-red-400 border border-red-800 hover:bg-red-900/20 rounded">
            APPLY CRITICAL
          </button>
        )}
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────

export function CriticalHitModal({ payload, onClose }) {
  const { shipId, mode = 'internal', effect } = payload ?? {}
  const ships = useBattleStore((s) => s.ships)
  const ship  = ships.find((s) => s.id === shipId)

  if (mode === 'surface') {
    return <SurfaceFixtureMode ship={ship} onClose={onClose} />
  }
  return <InternalCritMode ship={ship} effect={effect} onClose={onClose} />
}

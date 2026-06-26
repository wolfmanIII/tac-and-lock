/**
 * CatalogPanel — official 2300AD ship browser.
 * Source: 2300AD B3 pp.63–110. Ported from thrust-and-drift CatalogPanel.
 * GM can filter by category, search by name, add to profile list with one click.
 */

import { useState, useMemo } from 'react'
import { v7 as uuidv7 } from 'uuid'
import { SHIP_CATALOG, CATALOG_CATEGORIES } from '../../data/shipCatalog.js'
import { useProfilesStore } from '../../store/profilesStore.js'

function StatBadge({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="font-mono text-slate-500 text-xs">{label}</span>
      <span className="font-mono text-slate-300 text-xs font-bold">{value}</span>
    </span>
  )
}

function ShipRow({ entry, added, onAdd }) {
  const hasWeapons = (entry.weapons ?? []).length > 0
  const weaponSummary = hasWeapons
    ? entry.weapons.map((w) => w.label || w.weaponId).join(', ')
    : '—'

  return (
    <div className="group flex items-start gap-3 px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono font-bold text-xs text-slate-200 truncate">{entry.name}</span>
          <span className="font-mono text-xs text-slate-500">p.{entry.sourcePage}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          <StatBadge label="T" value={`${entry.tonnage}t`} />
          <StatBadge label="HP" value={entry.hullPoints} />
          {entry.tacSpeed > 0
            ? <StatBadge label="TAC" value={entry.tacSpeed} />
            : <span className="font-mono text-slate-600 text-xs">no stutterwarp</span>
          }
          {entry.armour > 0 && <StatBadge label="ARM" value={entry.armour} />}
          <StatBadge label="SIG" value={entry.signature} />
        </div>
        <p className="font-mono text-xs text-slate-500 mt-0.5 truncate">{weaponSummary}</p>
      </div>
      <div className="shrink-0 pt-0.5">
        {added ? (
          <span className="font-mono text-xs text-green-500 whitespace-nowrap">✓ Added</span>
        ) : (
          <button
            onClick={() => onAdd(entry)}
            className="px-2 py-1 border border-slate-700 text-slate-400 font-mono text-xs rounded hover:border-(--neon-cyan)/50 hover:text-(--neon-cyan) transition-colors whitespace-nowrap"
          >
            + Profile
          </button>
        )}
      </div>
    </div>
  )
}

export function CatalogPanel() {
  const addProfile = useProfilesStore((s) => s.addProfile)

  const [activeCategory, setActiveCategory] = useState('all')
  const [search,         setSearch]         = useState('')
  const [addedNames,     setAddedNames]     = useState(() => new Set())

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return SHIP_CATALOG.filter((e) => {
      const matchCat  = activeCategory === 'all' || e.category === activeCategory
      const matchText = !term ||
        e.name.toLowerCase().includes(term) ||
        (e.class ?? '').toLowerCase().includes(term)
      return matchCat && matchText
    })
  }, [activeCategory, search])

  function handleAdd(entry) {
    addProfile({ ...entry, id: uuidv7(), createdAt: new Date().toISOString() })
    setAddedNames((prev) => {
      const next = new Set(prev)
      next.add(entry.name)
      return next
    })
    setTimeout(() => {
      setAddedNames((prev) => {
        const next = new Set(prev)
        next.delete(entry.name)
        return next
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full">

      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <h2 className="font-display text-xs text-(--neon-cyan) tracking-widest">
          SHIP CATALOG <span className="text-slate-400">({filtered.length}/{SHIP_CATALOG.length})</span>
        </h2>
        <p className="font-mono text-[10px] text-slate-500 mt-0.5">2300AD B3 pp.63–110</p>
      </div>

      <div className="px-4 pt-2 pb-0 shrink-0">
        <div className="flex flex-wrap gap-1">
          {CATALOG_CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`px-2 py-0.5 font-mono text-xs rounded transition-colors ${
                activeCategory === id
                  ? 'bg-(--neon-cyan)/15 border border-(--neon-cyan)/40 text-(--neon-cyan)'
                  : 'border border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2 pb-1 shrink-0">
        <input
          type="text"
          placeholder="Search ship…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs rounded px-3 py-1.5 focus:outline-none focus:border-(--neon-cyan)/60 placeholder:text-slate-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-slate-500 font-mono text-xs italic px-4 py-3">No ships found.</p>
        )}
        {filtered.map((e) => (
          <ShipRow
            key={e.name}
            entry={e}
            added={addedNames.has(e.name)}
            onAdd={handleAdd}
          />
        ))}
      </div>

      <div className="px-4 py-2 border-t border-slate-800 shrink-0">
        <p className="font-mono text-xs text-slate-500">Source: 2300AD B3 pp.63–110. Profiles can be edited after adding.</p>
      </div>

    </div>
  )
}

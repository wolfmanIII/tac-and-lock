import { useState, useEffect, useRef } from 'react'
import { useProfilesStore } from '../../store/profilesStore.js'
import { useBattleStore } from '../../store/battleStore.js'
import { FACTIONS } from '../../data/factions.js'
import { RANGE_BANDS } from '../../data/rangeBands.js'
import {
  SHIP_SHAPES, SHAPE_LABELS, DEFAULT_TOKEN_SHAPE_BY_CATEGORY,
  getShapeTracer, getDetailDrawer,
} from '../battle/shipTokenShapes.js'

const PRESET_COLORS = [
  '#60a5fa', '#f87171', '#4ade80', '#facc15',
  '#c084fc', '#fb923c', '#22d3ee', '#f472b6',
]

const PREVIEW_SIZE = 40

function ShapePreview({ shape, selected, onClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = PREVIEW_SIZE * dpr
    canvas.height = PREVIEW_SIZE * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
    ctx.save()
    ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2)
    const radius = PREVIEW_SIZE * 0.42
    getShapeTracer(shape)(ctx, radius)
    ctx.fillStyle = selected ? 'rgba(125,211,252,0.75)' : 'rgba(148,163,184,0.5)'
    ctx.fill()
    ctx.strokeStyle = selected ? 'rgba(125,211,252,0.9)' : 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.stroke()
    getDetailDrawer(shape)?.(ctx, radius)
    ctx.restore()
  }, [shape, selected])

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-colors ${
        selected ? 'border-(--neon-cyan)/60 bg-(--neon-cyan)/10' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <canvas ref={canvasRef} style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }} />
      <span className={`font-mono text-[10px] ${selected ? 'text-(--neon-cyan)' : 'text-slate-400'}`}>
        {SHAPE_LABELS[shape]}
      </span>
    </button>
  )
}

export function AddShipModal({ onClose }) {
  const profiles = useProfilesStore((s) => s.profiles)
  const addShip  = useBattleStore((s) => s.addShip)

  const [selectedId, setSelectedId] = useState(profiles[0]?.id ?? null)
  const [faction,    setFaction]    = useState('npc')
  const [color,      setColor]      = useState('#f87171')
  const [startBand,  setStartBand]  = useState('Long')
  const [filter,     setFilter]     = useState('')
  const [tokenShape, setTokenShape] = useState(
    DEFAULT_TOKEN_SHAPE_BY_CATEGORY[profiles[0]?.category] ?? 'courier'
  )

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )
  const selected = profiles.find((p) => p.id === selectedId) ?? null

  useEffect(() => {
    setTokenShape(DEFAULT_TOKEN_SHAPE_BY_CATEGORY[selected?.category] ?? 'courier')
  }, [selectedId, selected?.category])

  function handleConfirm() {
    if (!selected) return
    addShip({ ...selected, tokenShape }, faction, startBand, color)
    onClose()
  }

  return (
    <div className="space-y-4 p-4">

      {/* Search */}
      <input
        type="text"
        placeholder="Search profile…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 text-slate-200 font-mono text-xs rounded px-3 py-1.5 focus:outline-none focus:border-(--neon-cyan)/60"
      />

      {/* Profile list */}
      <div className="max-h-40 overflow-y-auto space-y-0.5 border border-slate-700 rounded">
        {filtered.length === 0 && (
          <p className="text-slate-400 font-mono text-xs italic px-3 py-2">No profiles found.</p>
        )}
        {filtered.map((p) => {
          const isSel = p.id === selectedId
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-3 py-1.5 font-mono text-xs transition-colors flex items-center gap-2 border-l-2 ${
                isSel
                  ? 'bg-sky-950 text-sky-200 border-sky-400'
                  : 'text-slate-300 hover:bg-slate-800 border-transparent'
              }`}
            >
              <span className={`w-3 shrink-0 text-center ${isSel ? 'text-sky-400' : 'text-transparent'}`}>▶</span>
              <span className="font-bold">{p.name}</span>
              {p.class && <span className={`ml-1 ${isSel ? 'text-sky-400/60' : 'text-slate-400'}`}>{p.class}</span>}
            </button>
          )
        })}
      </div>

      {/* Faction */}
      <div>
        <p className="text-slate-400 font-mono text-xs mb-1.5">Faction</p>
        <div className="flex gap-2">
          {FACTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFaction(f.id); setColor(f.color) }}
              className={`flex-1 py-1.5 font-mono text-xs rounded border transition-colors ${
                faction === f.id
                  ? 'border-(--neon-cyan)/60 bg-(--neon-cyan)/10 text-(--neon-cyan)'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Token color */}
      <div>
        <p className="text-slate-400 font-mono text-xs mb-1.5">Token color</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c ? 'border-white scale-125' : 'border-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Token shape */}
      <div>
        <p className="text-slate-400 font-mono text-xs mb-1.5">Token shape</p>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.keys(SHIP_SHAPES).map((shape) => (
            <ShapePreview
              key={shape}
              shape={shape}
              selected={tokenShape === shape}
              onClick={() => setTokenShape(shape)}
            />
          ))}
        </div>
      </div>

      {/* Entry range band */}
      <div>
        <p className="text-slate-400 font-mono text-xs mb-1.5">Entry range</p>
        <div className="flex gap-1.5 flex-wrap">
          {RANGE_BANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => setStartBand(b.id)}
              className={`px-2.5 py-1 font-mono text-xs rounded border transition-colors ${
                startBand === b.id
                  ? 'border-(--neon-cyan)/60 bg-(--neon-cyan)/10 text-(--neon-cyan)'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full py-2 bg-(--neon-cyan)/10 border border-(--neon-cyan)/40 text-(--neon-cyan) font-mono text-sm tracking-widest rounded hover:bg-(--neon-cyan)/20 transition-colors disabled:text-slate-400 disabled:border-slate-600/50 disabled:bg-transparent disabled:cursor-not-allowed"
      >
        ADD TO BATTLE
      </button>
    </div>
  )
}

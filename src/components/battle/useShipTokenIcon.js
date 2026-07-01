/**
 * useShipTokenIcon — draws a static ship-token silhouette onto a small canvas.
 * No HP arc (hull state is shown by the bento card's own hull bar): static
 * shape only, colored by faction/ship. Rendered rotated 90° clockwise (bow
 * pointing right) to read naturally alongside the card's horizontal layout.
 */

import { useRef, useEffect } from 'react'
import { getShapeTracer, getDetailDrawer } from './shipTokenShapes.js'

/**
 * @param {object} ship  Battle ship instance — needs profile.tokenShape, color
 * @param {number} [size=32]  Canvas size in CSS px (square)
 * @returns {import('react').RefObject<HTMLCanvasElement>} Ref to attach to a <canvas>
 */
export function useShipTokenIcon(ship, size = 32) {
  const canvasRef = useRef(null)

  const tokenShape = ship.profile?.tokenShape
  const color = ship.color

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const cx     = size / 2
    const cy     = size / 2
    const radius = size * 0.42

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(Math.PI / 2)
    const shape = tokenShape ?? 'courier'
    getShapeTracer(shape)(ctx, radius)
    ctx.fillStyle = color ?? '#64748b'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
    getDetailDrawer(shape)?.(ctx, radius)
    ctx.restore()
  }, [tokenShape, color, size])

  return canvasRef
}

/**
 * shipTokenShapes.js — Ship token silhouette tracers for TAC & LOCK.
 *
 * 2300AD hard-sci-fi aesthetic: truss spines, flat radiator panels, single
 * exhaust nozzles, discharge vanes, spin-habitat rings — no aerodynamic wings
 * (these hulls never touch atmosphere in combat).
 *
 * Each tracer function traces a closed path in LOCAL coordinates:
 *   - bow pointing UP (−y), centered at origin
 *   - does NOT fill or stroke — call those after
 *   - `size` is the token radius (same unit as useShipTokenIcon.js)
 *
 * Shape key stored on `ship.profile.tokenShape`, chosen when the ship is
 * added to the battle (AddShipModal), defaulting per catalog `category`
 * via DEFAULT_TOKEN_SHAPE_BY_CATEGORY.
 */

// ─── FRIGATE ──────────────────────────────────────────────────────────────────
// Military warship — slim forward hull, flared radiator panels amidships,
// blunt aft engine block, dorsal weapon spine.
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 */
export function traceShipBodyFrigate(ctx, size) {
  ctx.beginPath()

  ctx.moveTo(0,            -size)          // bow

  ctx.lineTo( size * 0.12, -size * 0.75)
  ctx.lineTo( size * 0.12, -size * 0.25)  // slim forward hull
  ctx.lineTo( size * 0.55, -size * 0.05)  // radiator panel leading edge
  ctx.lineTo( size * 0.62,  size * 0.15)  // radiator panel tip
  ctx.lineTo( size * 0.5,   size * 0.3)   // radiator panel trailing edge
  ctx.lineTo( size * 0.2,   size * 0.35)  // hull return
  ctx.lineTo( size * 0.35,  size * 0.7)   // aft engine block
  ctx.lineTo( size * 0.3,   size * 0.95)  // exhaust nozzle rim

  ctx.lineTo(0,             size * 0.82)  // central exhaust notch

  ctx.lineTo(-size * 0.3,   size * 0.95)
  ctx.lineTo(-size * 0.35,  size * 0.7)
  ctx.lineTo(-size * 0.2,   size * 0.35)
  ctx.lineTo(-size * 0.5,   size * 0.3)
  ctx.lineTo(-size * 0.62,  size * 0.15)
  ctx.lineTo(-size * 0.55, -size * 0.05)
  ctx.lineTo(-size * 0.12, -size * 0.25)
  ctx.lineTo(-size * 0.12, -size * 0.75)

  ctx.closePath()
}

// ─── SCOUT ────────────────────────────────────────────────────────────────────
// Slim survey/courier hull — prominent sensor dish at the bow, small discharge
// vane fins near the stern.
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 */
export function traceShipBodyScout(ctx, size) {
  ctx.beginPath()

  ctx.moveTo(0,            -size)

  ctx.lineTo( size * 0.1,  -size * 0.8)
  ctx.lineTo( size * 0.16, -size * 0.3)
  ctx.lineTo( size * 0.22,  size * 0.2)
  ctx.lineTo( size * 0.45,  size * 0.45)  // discharge vane
  ctx.lineTo( size * 0.4,   size * 0.65)
  ctx.lineTo( size * 0.15,  size * 0.55)
  ctx.lineTo( size * 0.12,  size * 0.95)

  ctx.lineTo(0,             size * 0.85)

  ctx.lineTo(-size * 0.12,  size * 0.95)
  ctx.lineTo(-size * 0.15,  size * 0.55)
  ctx.lineTo(-size * 0.4,   size * 0.65)
  ctx.lineTo(-size * 0.45,  size * 0.45)  // discharge vane
  ctx.lineTo(-size * 0.22,  size * 0.2)
  ctx.lineTo(-size * 0.16, -size * 0.3)
  ctx.lineTo(-size * 0.1,  -size * 0.8)

  ctx.closePath()
}

// ─── FREIGHTER ────────────────────────────────────────────────────────────────
// Boxy modular civilian hull — flat truss-built cargo section, offset spin
// habitat ring, aft engine block.
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 */
export function traceShipBodyFreighter(ctx, size) {
  ctx.beginPath()

  ctx.moveTo(-size * 0.3,  -size * 0.9)   // forward module top-left
  ctx.lineTo( size * 0.3,  -size * 0.9)
  ctx.lineTo( size * 0.35, -size * 0.5)
  ctx.lineTo( size * 0.3,   size * 0.6)
  ctx.lineTo( size * 0.4,   size * 0.75)  // aft engine block
  ctx.lineTo( size * 0.25,  size * 0.95)

  ctx.lineTo(-size * 0.25,  size * 0.95)
  ctx.lineTo(-size * 0.4,   size * 0.75)
  ctx.lineTo(-size * 0.3,   size * 0.6)
  ctx.lineTo(-size * 0.35, -size * 0.5)

  ctx.closePath()
}

// ─── COURIER ──────────────────────────────────────────────────────────────────
// Small craft — lifeboat/pinnace/lander capsule hull, twin thruster nubs.
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 */
export function traceShipBodyCourier(ctx, size) {
  ctx.beginPath()

  ctx.moveTo(0,             -size * 0.95)

  ctx.lineTo( size * 0.35,  -size * 0.6)
  ctx.lineTo( size * 0.4,    size * 0.2)
  ctx.lineTo( size * 0.25,   size * 0.7)
  ctx.lineTo( size * 0.15,   size * 0.95)

  ctx.lineTo(-size * 0.15,   size * 0.95)
  ctx.lineTo(-size * 0.25,   size * 0.7)
  ctx.lineTo(-size * 0.4,    size * 0.2)
  ctx.lineTo(-size * 0.35,  -size * 0.6)

  ctx.closePath()
}

// ─── ALIEN (Kaefer) ───────────────────────────────────────────────────────────
// Asymmetric insectoid carapace — deliberately irregular, unlike the
// mirror-symmetric human hulls above.
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 */
export function traceShipBodyAlien(ctx, size) {
  ctx.beginPath()

  ctx.moveTo(0,             -size)

  ctx.lineTo( size * 0.2,   -size * 0.7)   // mandible right
  ctx.lineTo( size * 0.45,  -size * 0.75)
  ctx.lineTo( size * 0.35,  -size * 0.35)
  ctx.lineTo( size * 0.7,   -size * 0.1)   // carapace bulge right
  ctx.lineTo( size * 0.55,   size * 0.3)
  ctx.lineTo( size * 0.65,   size * 0.6)   // asymmetric leg pod
  ctx.lineTo( size * 0.3,    size * 0.7)
  ctx.lineTo( size * 0.2,    size * 0.95)

  ctx.lineTo(-size * 0.15,   size * 0.9)
  ctx.lineTo(-size * 0.35,   size * 0.6)
  ctx.lineTo(-size * 0.55,   size * 0.35)  // carapace bulge left (smaller — asymmetric)
  ctx.lineTo(-size * 0.4,    0)
  ctx.lineTo(-size * 0.6,   -size * 0.25)
  ctx.lineTo(-size * 0.3,   -size * 0.4)
  ctx.lineTo(-size * 0.25,  -size * 0.75)  // mandible left

  ctx.closePath()
}

// ─── TOKEN DETAILS ────────────────────────────────────────────────────────────
// Per-shape overlay drawn AFTER fill+stroke, while transform is still active.

/** Frigate — dorsal weapon spine, radiator hatch lines, engine glow. */
export function drawFrigateDetail(ctx, size) {
  ctx.beginPath()
  ctx.rect(-size * 0.05, -size * 0.68, size * 0.1, size * 0.5)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 0.8
  for (const side of [1, -1]) {
    ctx.beginPath()
    ctx.moveTo(side * size * 0.2, 0)
    ctx.lineTo(side * size * 0.58, size * 0.12)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.arc(0, size * 0.8, size * 0.08, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(125,211,252,0.9)'
  ctx.fill()
}

/** Scout — sensor dish at the bow, dorsal spine line. */
export function drawScoutDetail(ctx, size) {
  ctx.beginPath()
  ctx.arc(0, -size * 0.72, size * 0.14, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(125,211,252,0.9)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -size * 0.5)
  ctx.lineTo(0,  size * 0.6)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  ctx.stroke()
}

/** Freighter — spin habitat ring (offset ellipse), cargo module seams, bridge windows. */
export function drawFreighterDetail(ctx, size) {
  ctx.beginPath()
  ctx.ellipse(size * 0.05, -size * 0.05, size * 0.55, size * 0.14, 0, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1.4
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 0.8
  for (let y = -size * 0.55; y < size * 0.4; y += size * 0.28) {
    ctx.beginPath()
    ctx.moveTo(-size * 0.3, y)
    ctx.lineTo( size * 0.3, y)
    ctx.stroke()
  }

  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.rect(i * size * 0.09 - size * 0.02, -size * 0.85, size * 0.04, size * 0.06)
    ctx.fillStyle = 'rgba(125,211,252,0.9)'
    ctx.fill()
  }
}

/** Courier — cockpit window, twin thruster nubs. */
export function drawCourierDetail(ctx, size) {
  ctx.beginPath()
  ctx.ellipse(0, -size * 0.55, size * 0.12, size * 0.2, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(125,211,252,0.85)'
  ctx.fill()

  for (const side of [1, -1]) {
    ctx.beginPath()
    ctx.arc(side * size * 0.3, size * 0.75, size * 0.06, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()
  }
}

/** Alien — sickly-green compound eye clusters, carapace ridge line. */
export function drawAlienDetail(ctx, size) {
  for (const [dx, dy] of [[size * 0.18, -size * 0.5], [-size * 0.15, -size * 0.45]]) {
    ctx.beginPath()
    ctx.arc(dx, dy, size * 0.09, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(190,242,100,0.85)'
    ctx.fill()
  }

  ctx.beginPath()
  ctx.moveTo(0, -size * 0.9)
  ctx.lineTo(0,  size * 0.5)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 0.8
  ctx.stroke()
}

/**
 * Map of detail draw functions, keyed by shape.
 * @type {Record<string, (ctx: CanvasRenderingContext2D, size: number) => void>}
 */
export const SHIP_DETAILS = {
  frigate:   drawFrigateDetail,
  scout:     drawScoutDetail,
  freighter: drawFreighterDetail,
  courier:   drawCourierDetail,
  alien:     drawAlienDetail,
}

/**
 * Return the detail drawer for a given shape key, or null if none registered.
 * @param {string} key
 * @returns {((ctx: CanvasRenderingContext2D, size: number) => void) | null}
 */
export function getDetailDrawer(key) {
  return SHIP_DETAILS[key] ?? null
}

// ─── SHAPE MAP ────────────────────────────────────────────────────────────────

/**
 * Registered shape keys — used as `ship.profile.tokenShape`.
 * @type {Record<string, (ctx: CanvasRenderingContext2D, size: number) => void>}
 */
export const SHIP_SHAPES = {
  frigate:   traceShipBodyFrigate,
  scout:     traceShipBodyScout,
  freighter: traceShipBodyFreighter,
  courier:   traceShipBodyCourier,
  alien:     traceShipBodyAlien,
}

/** Human-readable labels for the shape picker UI. */
export const SHAPE_LABELS = {
  frigate:   'Frigate',
  scout:     'Scout',
  freighter: 'Freighter',
  courier:   'Courier',
  alien:     'Alien',
}

/**
 * Return the tracer for a given shape key, falling back to courier.
 * @param {string} key
 * @returns {(ctx: CanvasRenderingContext2D, size: number) => void}
 */
export function getShapeTracer(key) {
  return SHIP_SHAPES[key] ?? traceShipBodyCourier
}

/**
 * Default shape suggested per catalog/profile `category` — used to
 * pre-select a sensible token when a ship is added to the battle.
 * @type {Record<string, string>}
 */
export const DEFAULT_TOKEN_SHAPE_BY_CATEGORY = {
  military:      'frigate',
  scout:         'scout',
  civilian:      'freighter',
  'small-craft': 'courier',
  alien:         'alien',
}

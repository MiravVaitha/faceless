// Every surface in the city is painted onto a <canvas> at runtime — the repo
// ships no image files, exactly like audio.ts synthesizes every sound. All
// generators are deterministic (seeded), so the city looks identical each run,
// and results are memoized so a texture is built once and shared.
import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from 'three'
import { WINDOW_PITCH_V } from './config'

// Seeded LCG → uniform 0..1. Same trick as the audio buffers.
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const shade = (hex: string, f: number) => '#' + new Color(hex).multiplyScalar(f).getHexString()

// ── Building facades ────────────────────────────────────────────────────────
// A facade tile is 2 windows wide (a building is one 4m cell ≈ two 2m windows)
// and ROWS storeys tall. We map it once across the width (repeat.x = 1, so no
// horizontal seam) and tile it vertically, scaling repeat.y by building height
// so a window is always one storey — towers and shops share a window size.
const FW_COLS = 2
const FW_ROWS = 8
const FW_CW = 64 // px per window, horizontally
const FW_CH = 96 // px per storey, vertically
export const TILE_WORLD_H = FW_ROWS * WINDOW_PITCH_V // metres one facade tile spans

interface Palette {
  wall: [string, string] // top → bottom gradient
  lit: string[] // window light colours
  litRatio: number
}

const PALETTES: Palette[] = [
  { wall: ['#26282d', '#1b1d21'], lit: ['#ffcf8a', '#ffd9a0', '#ffe6c0', '#a9c8ff'], litRatio: 0.42 },
  { wall: ['#2e241c', '#201810'], lit: ['#ffbe73', '#ffd28a', '#ff9d5c'], litRatio: 0.32 },
  { wall: ['#1b2030', '#121624'], lit: ['#bcd8ff', '#d8ecff', '#ffd9a0', '#8affe0'], litRatio: 0.5 },
  { wall: ['#1d2a26', '#121d19'], lit: ['#9affc8', '#d8ffe6', '#ffd9a0', '#bcd8ff'], litRatio: 0.38 },
  { wall: ['#271a2b', '#18101d'], lit: ['#ffa0e0', '#d6b0ff', '#ffd0a0', '#a9c8ff'], litRatio: 0.4 },
]

const facadeBase = new Map<number, { map: CanvasTexture; emissiveMap: CanvasTexture }>()

function buildFacade(variant: number) {
  const p = PALETTES[variant % PALETTES.length]
  const w = FW_COLS * FW_CW
  const h = FW_ROWS * FW_CH

  const diff = document.createElement('canvas')
  diff.width = w
  diff.height = h
  const emi = document.createElement('canvas')
  emi.width = w
  emi.height = h
  const d = diff.getContext('2d')!
  const e = emi.getContext('2d')!
  const rng = lcg(1009 + variant * 97)

  // concrete base, faintly darkening toward the street
  const grad = d.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, p.wall[0])
  grad.addColorStop(1, p.wall[1])
  d.fillStyle = grad
  d.fillRect(0, 0, w, h)
  e.fillStyle = '#000'
  e.fillRect(0, 0, w, h)

  for (let r = 0; r < FW_ROWS; r++) {
    for (let c = 0; c < FW_COLS; c++) {
      const x = c * FW_CW
      const y = r * FW_CH
      // recessed window frame, with margins so storeys tile seamlessly
      d.fillStyle = '#0b0c0f'
      d.fillRect(x + 6, y + 8, FW_CW - 12, FW_CH - 14)
      const mx = 12
      const myT = 14
      const myB = 22
      const gx = x + mx
      const gy = y + myT
      const gw = FW_CW - 2 * mx
      const gh = FW_CH - myT - myB

      if (rng() < p.litRatio) {
        const col = p.lit[(rng() * p.lit.length) | 0]
        // dim tint on the diffuse so the glass reads even where emissive is low
        d.globalAlpha = 0.16
        d.fillStyle = col
        d.fillRect(gx, gy, gw, gh)
        d.globalAlpha = 1
        // the actual glow lives in the emissive map
        const g2 = e.createLinearGradient(0, gy, 0, gy + gh)
        g2.addColorStop(0, shade(col, 0.6))
        g2.addColorStop(1, col)
        e.fillStyle = g2
        e.fillRect(gx, gy, gw, gh)
        // half-drawn blind across some lit windows
        if (rng() < 0.4) {
          e.fillStyle = `rgba(0,0,0,${(0.3 + rng() * 0.5).toFixed(2)})`
          e.fillRect(gx, gy, gw, gh * (0.25 + rng() * 0.5))
        }
      } else {
        d.fillStyle = '#0a0b0e'
        d.fillRect(gx, gy, gw, gh)
        // faint sky sheen so dark glass isn't a pure void
        if (rng() < 0.5) {
          e.fillStyle = 'rgba(36,50,74,0.10)'
          e.fillRect(gx, gy, gw, gh)
        }
      }
    }
  }

  // vertical grime streaks
  d.globalAlpha = 0.12
  d.fillStyle = '#000'
  for (let i = 0; i < 22; i++) d.fillRect(rng() * w, 0, 1 + rng() * 2, h)
  d.globalAlpha = 1

  const map = new CanvasTexture(diff)
  const emissiveMap = new CanvasTexture(emi)
  for (const t of [map, emissiveMap]) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
  }
  return { map, emissiveMap }
}

const facadeReady = new Map<string, { map: CanvasTexture; emissiveMap: CanvasTexture }>()

/** Facade textures for one variant, with vertical repeat tuned to `height`. */
export function facadeTextures(variant: number, height: number) {
  const key = `${variant}:${height}`
  const cached = facadeReady.get(key)
  if (cached) return cached

  let base = facadeBase.get(variant)
  if (!base) {
    base = buildFacade(variant)
    facadeBase.set(variant, base)
  }
  const map = base.map.clone()
  const emissiveMap = base.emissiveMap.clone()
  for (const t of [map, emissiveMap]) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    t.repeat.set(1, height / TILE_WORLD_H)
    t.needsUpdate = true
  }
  const made = { map, emissiveMap }
  facadeReady.set(key, made)
  return made
}

// ── Shopfronts (ground-floor glow) ──────────────────────────────────────────
// Six distinct storefront layouts (0-4 lit types + 5 closed shutter), so a
// street reads as a row of *different* shops, not one pane recoloured. Drawn
// mostly in greys/whites: the per-instance instanceColor sets each shop's hue,
// while the LAYOUT (sign band, portholes, lanterns, neon motif…) gives the
// structural variety. The number of lit types is SHOP_LIT_KINDS.
export const SHOP_LIT_KINDS = 5
export const SHOP_SHUTTER = 5

const shopCache = new Map<number, CanvasTexture>()

export function shopTexture(kind: number): CanvasTexture {
  const cached = shopCache.get(kind)
  if (cached) return cached
  const s = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const g = cv.getContext('2d')!
  g.fillStyle = '#050506'
  g.fillRect(0, 0, s, s)

  const signBand = () => {
    g.fillStyle = '#ededed'
    g.fillRect(7, 7, s - 14, 16)
    g.fillStyle = 'rgba(0,0,0,0.5)' // blocky "lettering"
    for (let i = 0; i < 6; i++) g.fillRect(16 + i * 16, 12, 4 + ((i * 37) % 8), 6)
  }
  const door = (cx: number, w: number) => {
    g.fillStyle = '#060607'
    g.fillRect(cx - (w * s) / 2, s * 0.52, w * s, s * 0.48)
  }

  switch (kind) {
    case 0: {
      // café / diner — warm spill from a low counter, stools in silhouette
      const rg = g.createRadialGradient(s / 2, s * 0.66, 4, s / 2, s * 0.66, s * 0.72)
      rg.addColorStop(0, '#ffffff')
      rg.addColorStop(0.5, '#b6b6b6')
      rg.addColorStop(1, '#0e0e0f')
      g.fillStyle = rg
      g.fillRect(6, 24, s - 12, s - 30)
      signBand()
      g.fillStyle = 'rgba(0,0,0,0.5)'
      g.fillRect(10, s * 0.7, s - 20, 4) // counter
      g.fillStyle = '#0e0e0f'
      for (const x of [s * 0.32, s * 0.5, s * 0.68]) {
        g.beginPath()
        g.arc(x, s * 0.78, 5, 0, 7)
        g.fill()
        g.fillRect(x - 1, s * 0.78, 2, 12)
      }
      g.fillStyle = 'rgba(0,0,0,0.4)'
      for (let i = 1; i < 3; i++) g.fillRect(i * (s / 3.2), 26, 2, s - 26)
      door(s * 0.85, 0.16)
      break
    }
    case 1: {
      // convenience store — bright, even, strip lights and shelves, twin doors
      g.fillStyle = '#cbced1'
      g.fillRect(6, 24, s - 12, s - 30)
      g.fillStyle = 'rgba(255,255,255,0.55)'
      for (let i = 0; i < 4; i++) g.fillRect(12 + i * 28, 26, 6, s - 30)
      signBand()
      g.fillStyle = 'rgba(0,0,0,0.3)'
      for (let r = 0; r < 3; r++) g.fillRect(10, 42 + r * 20, s - 20, 5) // shelves
      g.fillStyle = '#0a0a0b'
      g.fillRect(s * 0.4, s * 0.54, s * 0.2, s * 0.46)
      g.fillStyle = 'rgba(255,255,255,0.3)'
      g.fillRect(s * 0.5 - 1, s * 0.54, 2, s * 0.46)
      break
    }
    case 2: {
      // laundromat — cool even glow, a row of machine portholes
      g.fillStyle = '#bcc3c8'
      g.fillRect(6, 24, s - 12, s - 30)
      signBand()
      for (let i = 0; i < 4; i++) {
        const x = 20 + i * 25
        g.fillStyle = '#0b0d0f'
        g.fillRect(x - 9, s * 0.52, 22, 40)
        g.fillStyle = '#e3eaef'
        g.beginPath()
        g.arc(x + 2, s * 0.52 + 20, 8, 0, 7)
        g.fill()
        g.fillStyle = '#565c62'
        g.beginPath()
        g.arc(x + 2, s * 0.52 + 20, 4, 0, 7)
        g.fill()
      }
      break
    }
    case 3: {
      // neon bar — dark interior, a bright sign motif (reads as neon once tinted)
      g.fillStyle = '#171718'
      g.fillRect(6, 24, s - 12, s - 30)
      g.fillStyle = 'rgba(255,255,255,0.14)'
      g.fillRect(10, 26, s - 20, 9) // dim high window
      g.strokeStyle = '#ffffff'
      g.lineWidth = 5
      g.beginPath()
      g.arc(s / 2, s * 0.52, 24, 0, 7) // ring sign
      g.stroke()
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(s / 2 - 11, s * 0.52)
      g.lineTo(s / 2 + 11, s * 0.52)
      g.stroke()
      door(s * 0.5, 0.14)
      break
    }
    case 4: {
      // eatery — warm, paper lanterns up top, a noren curtain across the bottom
      const lg = g.createLinearGradient(0, 24, 0, s)
      lg.addColorStop(0, '#d9d3c5')
      lg.addColorStop(1, '#16130d')
      g.fillStyle = lg
      g.fillRect(6, 24, s - 12, s - 30)
      signBand()
      for (const x of [s * 0.3, s * 0.5, s * 0.7]) {
        g.fillStyle = '#ffffff'
        g.beginPath()
        g.ellipse(x, s * 0.44, 7, 9, 0, 0, 7)
        g.fill()
        g.fillStyle = 'rgba(0,0,0,0.4)'
        g.fillRect(x - 7, s * 0.44 - 1, 14, 2)
      }
      g.fillStyle = '#d2cdc0'
      g.fillRect(8, s * 0.66, s - 16, s * 0.34) // noren
      g.fillStyle = '#050506'
      for (let i = 1; i < 4; i++) g.fillRect(8 + (i * (s - 16)) / 4, s * 0.66, 3, s * 0.34)
      break
    }
    default: {
      // closed roller shutter — corrugated metal, faintly catching the street
      g.fillStyle = '#8d9197'
      g.fillRect(5, 6, s - 10, s - 11)
      for (let y = 9; y < s - 6; y += 6) {
        g.fillStyle = 'rgba(0,0,0,0.34)'
        g.fillRect(6, y, s - 12, 2)
        g.fillStyle = 'rgba(255,255,255,0.10)'
        g.fillRect(6, y + 2, s - 12, 1)
      }
      g.fillStyle = 'rgba(255,255,255,0.10)'
      g.fillRect(s * 0.22, 6, 7, s - 11) // sheen
      g.fillStyle = '#3a3d42'
      g.fillRect(s * 0.4, s - 18, s * 0.2, 6) // handle
      break
    }
  }

  // dark frame so the pane sits cleanly on the wall
  g.strokeStyle = '#040405'
  g.lineWidth = 7
  g.strokeRect(3, 3, s - 6, s - 6)

  const t = new CanvasTexture(cv)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  shopCache.set(kind, t)
  return t
}

// ── Awning ──────────────────────────────────────────────────────────────────
// Striped fabric tinted per-instance, so a shop's canopy reads as its own
// colour. Vertical stripes alternate bright/dim grey.
let awnTex: CanvasTexture | null = null
export function awningTexture() {
  if (awnTex) return awnTex
  const w = 96
  const h = 32
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const g = cv.getContext('2d')!
  for (let i = 0; i * 12 < w; i++) {
    g.fillStyle = i % 2 ? '#dcdcdc' : '#9a9a9a' // tinted per-instance, so keep it grey
    g.fillRect(i * 12, 0, 12, h)
  }
  g.fillStyle = 'rgba(0,0,0,0.3)' // shaded fold along the mounting edge
  g.fillRect(0, 0, w, 7)
  g.fillStyle = 'rgba(0,0,0,0.16)' // scalloped lower hem
  for (let i = 0; i * 16 < w; i++) g.fillRect(i * 16, h - 5, 8, 5)
  awnTex = new CanvasTexture(cv)
  awnTex.colorSpace = SRGBColorSpace
  awnTex.anisotropy = 4
  return awnTex
}

// ── Streetlight ground pool ─────────────────────────────────────────────────
// Soft radial alpha; drawn additively on the road, tinted warm.
let glowTex: CanvasTexture | null = null
export function lampGlowTexture() {
  if (glowTex) return glowTex
  const s = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const g = cv.getContext('2d')!
  const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  rg.addColorStop(0, 'rgba(255,255,255,0.85)')
  rg.addColorStop(0.4, 'rgba(255,255,255,0.32)')
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, s, s)
  glowTex = new CanvasTexture(cv)
  glowTex.colorSpace = SRGBColorSpace
  return glowTex
}

// ── Asphalt ─────────────────────────────────────────────────────────────────
let roadTex: CanvasTexture | null = null
export function asphaltTexture() {
  if (roadTex) return roadTex
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const g = cv.getContext('2d')!
  const rng = lcg(7)

  g.fillStyle = '#191b22'
  g.fillRect(0, 0, s, s)
  // aggregate speckle
  for (let i = 0; i < 4200; i++) {
    const v = (rng() * 46) | 0
    g.fillStyle = `rgba(${v + 18},${v + 20},${v + 26},0.5)`
    g.fillRect(rng() * s, rng() * s, 1, 1)
  }
  // worn patches
  for (let i = 0; i < 12; i++) {
    g.fillStyle = 'rgba(120,125,135,0.04)'
    g.beginPath()
    g.arc(rng() * s, rng() * s, 20 + rng() * 60, 0, Math.PI * 2)
    g.fill()
  }
  // cracks
  g.strokeStyle = 'rgba(0,0,0,0.5)'
  g.lineWidth = 1
  for (let i = 0; i < 10; i++) {
    let x = rng() * s
    let y = rng() * s
    g.beginPath()
    g.moveTo(x, y)
    for (let j = 0; j < 6; j++) {
      x += (rng() - 0.5) * 42
      y += (rng() - 0.5) * 42
      g.lineTo(x, y)
    }
    g.stroke()
  }

  roadTex = new CanvasTexture(cv)
  roadTex.wrapS = roadTex.wrapT = RepeatWrapping
  roadTex.colorSpace = SRGBColorSpace
  roadTex.anisotropy = 4
  return roadTex
}

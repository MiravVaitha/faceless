import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DoubleSide, InstancedMesh, Object3D } from 'three'
import {
  BUILDING_TIERS,
  CELL_SIZE,
  FACADE_VARIANTS,
  LAMP_COUNT,
  LAMP_GLOW_RADIUS,
  LAMP_HEIGHT,
  LAMP_LIGHT_DISTANCE,
  LAMP_LIGHT_INTENSITY,
  LAMP_SPACING,
  SHOPFRONT_OPEN_CHANCE,
} from './config'
import { COLS, GRID, MAP_DEPTH, MAP_WIDTH, ROWS, cellToWorld, isWall } from './map'
import {
  SHOP_LIT_KINDS,
  SHOP_SHUTTER,
  asphaltTexture,
  awningTexture,
  facadeTextures,
  lampGlowTexture,
  shopTexture,
} from './textures'

// Buildings sit a hair inside their cell so neighbouring blocks leave a thin
// dark groove between them (reads as separate buildings) instead of z-fighting
// on the shared face. Collision still uses the full cell, so the ~6cm slack is
// imperceptible.
const GAP = 0.12
const BUILD = CELL_SIZE - GAP
const BUILD_HALF = BUILD / 2
const SHOP_OFFSET = BUILD_HALF + 0.03 // pane just in front of the facade
const SHOP_H = 2.8
const SHOP_Y = 1.5
const ARM_LEN = 1.0
const _dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

// Stable hash → 0..1 per (cell, salt): same city every load, no stored seeds.
function rand(col: number, row: number, salt: number) {
  let n = Math.imul(col, 73856093) ^ Math.imul(row, 19349663) ^ Math.imul(salt, 83492791)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  n ^= n >>> 16
  return (n >>> 0) / 4294967296
}

// Shorter buildings are the most common; the odd tower breaks the skyline.
const TIER_WEIGHTS = [0.3, 0.34, 0.22, 0.14]
function pickTier(r: number) {
  let acc = 0
  for (let i = 0; i < TIER_WEIGHTS.length; i++) {
    acc += TIER_WEIGHTS[i]
    if (r < acc) return i
  }
  return TIER_WEIGHTS.length - 1
}

const WARM = ['#ffb066', '#ffc98a', '#ffe2b0'].map((c) => new Color(c))
const NEON = ['#ff7d5a', '#62e0ff', '#ff66b3', '#8cff9e', '#c9a3ff'].map((c) => new Color(c))
// dim metal grey for the unlit shutter pane (final = texture × this), kept
// darker than the lit shops so the glowing storefronts stand out
const SHUTTER_TINT = new Color('#787c84')
// fabric colours for shop awnings
const AWNING_COLORS = ['#bb3b2f', '#256f52', '#2f5f8c', '#c2901f', '#7d3f92', '#b03a5b'].map((c) => new Color(c))
const AWNING_CHANCE = 0.5 // of lit shops that get a canopy

const SHOP_OUT = 0.42 // how far an awning reaches over the street, meters
const AWNING_Y = 3.05 // canopy height, meters

type BuildingCell = { x: number; z: number; tint: Color }
type Bucket = { height: number; variant: number; cells: BuildingCell[] }
type Shop = { x: number; z: number; angle: number; tint: Color }
type Awning = { x: number; z: number; angle: number; tint: Color }
type Lamp = { px: number; pz: number; hx: number; hz: number; angle: number }

export default function Maze() {
  // group wall cells by (height tier × facade variant) — one instanced draw call each
  const buckets = useMemo(() => {
    const m = new Map<string, Bucket>()
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (GRID[row][col] !== 1) continue
        const onBoundary = row === 0 || col === 0 || row === ROWS - 1 || col === COLS - 1
        const tier = onBoundary ? (rand(col, row, 9) > 0.5 ? 3 : 2) : pickTier(rand(col, row, 1))
        const variant = Math.floor(rand(col, row, 2) * FACADE_VARIANTS) % FACADE_VARIANTS
        const key = `${tier}:${variant}`
        let b = m.get(key)
        if (!b) {
          b = { height: BUILDING_TIERS[tier], variant, cells: [] }
          m.set(key, b)
        }
        const { x, z } = cellToWorld(col, row)
        const v = 0.8 + rand(col, row, 3) * 0.4 // per-building brightness
        b.cells.push({ x, z, tint: new Color(v, v * 0.99, v * 0.95) })
      }
    }
    return [...m.values()]
  }, [])

  // a storefront on every street-facing ground floor: a lit shop of one of
  // SHOP_LIT_KINDS types, or a closed shutter. Grouped by kind so each type
  // draws with its own texture in a single instanced call. Some lit shops get
  // a coloured awning over the street.
  const { shopGroups, awnings } = useMemo(() => {
    const groups = new Map<number, Shop[]>()
    const awns: Awning[] = []
    const push = (kind: number, shop: Shop) => {
      let arr = groups.get(kind)
      if (!arr) groups.set(kind, (arr = []))
      arr.push(shop)
    }
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (GRID[row][col] !== 1) continue
        const { x, z } = cellToWorld(col, row)
        _dirs.forEach(([dx, dz], di) => {
          if (isWall(col + dx, row + dz)) return // faces another building, not a street
          const sx = x + dx * SHOP_OFFSET
          const sz = z + dz * SHOP_OFFSET
          const angle = Math.atan2(dx, dz)
          if (rand(col, row, 17 + di) >= SHOPFRONT_OPEN_CHANCE) {
            push(SHOP_SHUTTER, { x: sx, z: sz, angle, tint: SHUTTER_TINT })
            return
          }
          const kind = (rand(col, row, 23 + di) * SHOP_LIT_KINDS) | 0
          const palette = rand(col, row, 30 + di) < 0.6 ? WARM : NEON
          push(kind, { x: sx, z: sz, angle, tint: palette[(rand(col, row, 40 + di) * palette.length) | 0] })
          if (rand(col, row, 60 + di) < AWNING_CHANCE) {
            awns.push({
              x: sx + dx * SHOP_OUT,
              z: sz + dz * SHOP_OUT,
              angle,
              tint: AWNING_COLORS[(rand(col, row, 70 + di) * AWNING_COLORS.length) | 0],
            })
          }
        })
      }
    }
    return { shopGroups: [...groups.entries()], awnings: awns }
  }, [])

  // streetlights at the curb (floor cells touching a building), distributed so
  // they actually cover the streets: walk the curb cells in a shuffled order
  // and accept one only if it's at least LAMP_SPACING from every lamp so far —
  // a greedy spacing that avoids the clumps a plain "lowest N scores" gave.
  const lamps = useMemo(() => {
    const cand: { x: number; z: number; wdx: number; wdz: number; score: number }[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (GRID[row][col] !== 0) continue
        const wall = _dirs.find(([dx, dz]) => isWall(col + dx, row + dz))
        if (!wall) continue
        const { x, z } = cellToWorld(col, row)
        cand.push({ x, z, wdx: wall[0], wdz: wall[1], score: rand(col, row, 5) })
      }
    }
    cand.sort((a, b) => a.score - b.score)
    const placed: Lamp[] = []
    const minSq = LAMP_SPACING * LAMP_SPACING
    for (const c of cand) {
      if (placed.length >= LAMP_COUNT) break
      const px = c.x + c.wdx * CELL_SIZE * 0.3 // pole hugs the curb
      const pz = c.z + c.wdz * CELL_SIZE * 0.3
      if (placed.some((l) => (l.px - px) ** 2 + (l.pz - pz) ** 2 < minSq)) continue
      placed.push({
        px,
        pz,
        hx: px - c.wdx * ARM_LEN, // head reaches out over the street
        hz: pz - c.wdz * ARM_LEN,
        angle: Math.atan2(-c.wdx, -c.wdz),
      })
    }
    return placed
  }, [])

  const road = useMemo(() => {
    const t = asphaltTexture()
    t.repeat.set(MAP_WIDTH / 8, MAP_DEPTH / 8)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <group>
      <mesh position={[MAP_WIDTH / 2, 0, MAP_DEPTH / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[MAP_WIDTH, MAP_DEPTH]} />
        <meshStandardMaterial map={road} roughness={0.92} metalness={0} />
      </mesh>

      {buckets.map((b, i) => (
        <BuildingBatch key={i} {...b} />
      ))}

      {shopGroups.map(([kind, shops]) => (
        <ShopGroup key={kind} kind={kind} shops={shops} />
      ))}
      <Awnings awnings={awnings} />
      <Lamps lamps={lamps} />
    </group>
  )
}

function BuildingBatch({ height, variant, cells }: Bucket) {
  const ref = useRef<InstancedMesh>(null)
  const { map, emissiveMap } = useMemo(() => facadeTextures(variant, height), [variant, height])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const d = new Object3D()
    cells.forEach((c, i) => {
      d.position.set(c.x, height / 2, c.z)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
      mesh.setColorAt(i, c.tint)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [cells, height])

  // culling off: the instance bounds only cover one box, which would blank
  // whole blocks at the screen edge
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} frustumCulled={false}>
      <boxGeometry args={[BUILD, height, BUILD]} />
      <meshStandardMaterial
        map={map}
        emissiveMap={emissiveMap}
        emissive="#ffffff"
        emissiveIntensity={1.3}
        roughness={0.85}
        metalness={0}
      />
    </instancedMesh>
  )
}

function ShopGroup({ kind, shops }: { kind: number; shops: Shop[] }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const d = new Object3D()
    shops.forEach((s, i) => {
      d.position.set(s.x, SHOP_Y, s.z)
      d.rotation.set(0, s.angle, 0)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
      mesh.setColorAt(i, s.tint)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [shops])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, shops.length]} frustumCulled={false}>
      <planeGeometry args={[CELL_SIZE * 0.82, SHOP_H]} />
      {/* unlit: the bays glow on their own in the dark, like the bot's face */}
      <meshBasicMaterial map={shopTexture(kind)} side={DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}

function Awnings({ awnings }: { awnings: Awning[] }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const d = new Object3D()
    d.rotation.order = 'YXZ' // yaw to face the street, THEN dip the leading edge down
    awnings.forEach((a, i) => {
      d.position.set(a.x, AWNING_Y, a.z)
      d.rotation.set(-0.42, a.angle, 0)
      d.updateMatrix()
      mesh.setMatrixAt(i, d.matrix)
      mesh.setColorAt(i, a.tint)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [awnings])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, awnings.length]} frustumCulled={false}>
      <boxGeometry args={[CELL_SIZE * 0.84, 0.1, 0.95]} />
      {/* unlit + per-instance tint so the canopy colour reads in the dark, like
          the shop glow; the striped texture is grey so the tint comes through */}
      <meshBasicMaterial map={awningTexture()} side={DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}

function Lamps({ lamps }: { lamps: Lamp[] }) {
  const poles = useRef<InstancedMesh>(null)
  const arms = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const d = new Object3D()
    lamps.forEach((l, i) => {
      // pole
      d.position.set(l.px, LAMP_HEIGHT / 2, l.pz)
      d.rotation.set(0, 0, 0)
      d.updateMatrix()
      poles.current?.setMatrixAt(i, d.matrix)

      // arm: pole-top → head
      d.position.set((l.px + l.hx) / 2, LAMP_HEIGHT - 0.05, (l.pz + l.hz) / 2)
      d.rotation.set(0, l.angle, 0)
      d.updateMatrix()
      arms.current?.setMatrixAt(i, d.matrix)

      // head (the luminaire)
      d.position.set(l.hx, LAMP_HEIGHT - 0.1, l.hz)
      d.rotation.set(0, l.angle, 0)
      d.updateMatrix()
      heads.current?.setMatrixAt(i, d.matrix)

      // ground light-pool, flat on the road under the head
      d.position.set(l.hx, 0.04, l.hz)
      d.rotation.set(-Math.PI / 2, 0, 0)
      d.updateMatrix()
      pools.current?.setMatrixAt(i, d.matrix)
    })
    for (const m of [poles, arms, heads, pools]) {
      if (m.current) m.current.instanceMatrix.needsUpdate = true
    }
  }, [lamps])

  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.09, LAMP_HEIGHT, 6]} />
        <meshStandardMaterial color="#15161a" roughness={0.5} metalness={0.6} />
      </instancedMesh>

      <instancedMesh ref={arms} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.06, 0.06, ARM_LEN]} />
        <meshStandardMaterial color="#15161a" roughness={0.5} metalness={0.6} />
      </instancedMesh>

      <instancedMesh ref={heads} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.5, 0.16, 0.32]} />
        <meshBasicMaterial color="#ffe2b0" toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={pools} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <planeGeometry args={[LAMP_GLOW_RADIUS * 2, LAMP_GLOW_RADIUS * 2]} />
        <meshBasicMaterial
          map={lampGlowTexture()}
          color="#ffcf94"
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      {/* a real warm light per lamp so the road and nearby facades actually
          catch the glow — kept few (LAMP_COUNT) and shadowless for speed */}
      {lamps.map((l, i) => (
        <pointLight
          key={i}
          position={[l.hx, LAMP_HEIGHT - 0.1, l.hz]}
          color="#ffd9a0"
          intensity={LAMP_LIGHT_INTENSITY}
          distance={LAMP_LIGHT_DISTANCE}
          decay={2}
        />
      ))}
    </group>
  )
}

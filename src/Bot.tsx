import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, useTexture } from '@react-three/drei'
import { DoubleSide, Group, type PositionalAudio as ThreePositionalAudio, SRGBColorSpace, Vector3 } from 'three'
import { footstepsBuffer, getListener } from './audio'
import { slideMove } from './collision'
import {
  AUDIO_MAX,
  AUDIO_REF,
  BOT_FLOAT,
  BOT_HEIGHT,
  BOT_RADIUS,
  BOT_SPEED,
  CATCH_DISTANCE,
  JUMPSCARE_SCALE,
  JUMPSCARE_SNAP,
  PATH_REFRESH,
  WAYPOINT_RADIUS,
} from './config'
import { live } from './live'
import { BOT_SPAWN, cellToWorld, worldToCell } from './map'
import { type Cell, findPath } from './pathfinding'
import { useGame } from './store'

const spawn = cellToWorld(BOT_SPAWN.col, BOT_SPAWN.row)
const SPRITE_Y = BOT_HEIGHT / 2 + BOT_FLOAT

// scratch objects reused every frame — never allocate inside useFrame
const _target = new Vector3()
const _dir = new Vector3()

export default function Bot() {
  const faceUrl = useGame((s) => s.faceUrl)
  const runId = useGame((s) => s.runId)
  const phase = useGame((s) => s.phase)
  const texture = useTexture(faceUrl)
  const steps = useRef<ThreePositionalAudio>(null)

  // footsteps/breathing loop, swelling with proximity via the positional
  // panner (linear falloff from AUDIO_REF to silence at AUDIO_MAX)
  useEffect(() => {
    const a = steps.current
    if (!a || phase !== 'playing') return
    if (!a.buffer) {
      a.setBuffer(footstepsBuffer())
      a.setLoop(true)
      a.setRefDistance(AUDIO_REF)
      a.setMaxDistance(AUDIO_MAX)
      a.setDistanceModel('linear')
      a.setRolloffFactor(1)
      a.setVolume(0.9)
    }
    a.play()
    return () => {
      if (a.isPlaying) a.stop()
    }
  }, [phase])

  const group = useRef<Group>(null)
  const pos = useRef(new Vector3(spawn.x, SPRITE_Y, spawn.z))
  const path = useRef<Cell[]>([])
  const pathIdx = useRef(0)
  const repathIn = useRef(0)
  const scareT = useRef(0)

  // every new run — or a return to the menu — puts the bot back at the far
  // corner; during 'caught' it stays put so the jumpscare pose holds
  useEffect(() => {
    if (phase === 'caught') return
    pos.current.set(spawn.x, SPRITE_Y, spawn.z)
    path.current = []
    pathIdx.current = 0
    repathIn.current = 0
    scareT.current = 0
    live.botDistance = Infinity
    group.current?.position.copy(pos.current)
    group.current?.scale.setScalar(1)
  }, [runId, phase])

  useFrame(({ camera }, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.1)
    const p = pos.current
    const phase = useGame.getState().phase

    if (phase === 'caught') {
      // jumpscare: rush a point right in front of the camera and blow up the
      // sprite — exponential approach so it slams in regardless of distance
      scareT.current += dt
      camera.getWorldDirection(_dir)
      _target.copy(camera.position).addScaledVector(_dir, 1.0)
      const k = 1 - Math.exp(-dt / JUMPSCARE_SNAP)
      p.lerp(_target, k)
      g.scale.setScalar(g.scale.x + (JUMPSCARE_SCALE - g.scale.x) * k)
      g.position.copy(p)
      // dying tremor
      g.position.x += Math.sin(scareT.current * 67) * 0.05
      g.position.y += Math.sin(scareT.current * 53) * 0.04
      return
    }

    if (phase === 'playing' && live.active) {
      // Recompute the route on a timer, not every frame — the staleness is
      // part of the nextbot feel (it overshoots corners you just turned).
      repathIn.current -= dt
      if (repathIn.current <= 0) {
        const from = worldToCell(p.x, p.z)
        const to = worldToCell(camera.position.x, camera.position.z)
        path.current = findPath(from, to) ?? []
        pathIdx.current = 1 // [0] is the cell the bot is already in
        repathIn.current = PATH_REFRESH
      }

      // chase the next waypoint; with no path left (same cell as the player,
      // or A* declined) fall back to the Phase-4a beeline
      _target.set(camera.position.x, p.y, camera.position.z)
      const cells = path.current
      while (pathIdx.current < cells.length) {
        const wp = cellToWorld(cells[pathIdx.current].col, cells[pathIdx.current].row)
        if (Math.hypot(wp.x - p.x, wp.z - p.z) < WAYPOINT_RADIUS) {
          pathIdx.current++
          continue
        }
        _target.set(wp.x, p.y, wp.z)
        break
      }

      _dir.subVectors(_target, p).setY(0)
      const dist = _dir.length()
      if (dist > 1e-6) {
        _dir.divideScalar(dist)
        const step = Math.min(BOT_SPEED * dt, dist)
        const [nx, nz] = slideMove(p.x, p.z, _dir.x * step, _dir.z * step, BOT_RADIUS)
        p.x = nx
        p.z = nz
      }
    }

    g.position.copy(p)
    live.botDistance = Math.hypot(camera.position.x - p.x, camera.position.z - p.z)

    if (phase === 'playing' && live.active && live.botDistance < CATCH_DISTANCE) {
      useGame.getState().caught()
    }
  })

  // size the sprite from the photo's aspect, clamped relative to its height so
  // any image stays a believable looming figure rather than a sliver or a slab
  const img = texture.image as { width?: number; height?: number } | undefined
  const aspect = img?.width && img?.height ? img.width / img.height : 1
  const width = Math.min(Math.max(BOT_HEIGHT * aspect, BOT_HEIGHT * 0.5), BOT_HEIGHT * 1.5)

  return (
    <group ref={group} position={[spawn.x, SPRITE_Y, spawn.z]}>
      {/* only after the first Start, so the AudioContext is born post-gesture */}
      {phase !== 'menu' && <positionalAudio ref={steps} args={[getListener()]} />}
      <Billboard>
        <mesh>
          <planeGeometry args={[width, BOT_HEIGHT]} />
          {/* unlit + untonemapped: the face stays full-bright in the dark, nextbot style */}
          <meshBasicMaterial transparent side={DoubleSide} toneMapped={false}>
            {/* sRGB because uploaded photos are sRGB — linear washes them out */}
            <primitive object={texture} attach="map" colorSpace={SRGBColorSpace} anisotropy={4} />
          </meshBasicMaterial>
        </mesh>
      </Billboard>
    </group>
  )
}

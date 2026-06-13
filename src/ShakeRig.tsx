import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, PerspectiveCamera } from 'three'
import { FOV, FOV_PULSE, SHAKE_MAX } from './config'
import { live, threatLevel } from './live'
import { useGame } from './store'

// Proximity shake nudges the WORLD group, not the camera: visually identical,
// but player physics, the bot, and the catch check all read camera/bot
// positions and must never see the jitter. The offset is SET absolutely every
// frame (nothing accumulates), so it needs no ordering relative to gameplay
// callbacks — which matters, because a positive useFrame priority makes R3F
// hand over the render loop entirely (the screen goes black unless you call
// gl.render yourself). Camera rotation is equally off-limits:
// PointerLockControls re-derives its euler from the camera quaternion on every
// mouse move, so rotational shake would bake into where the player looks.
export default function ShakeRig({ children }: { children: ReactNode }) {
  const world = useRef<Group>(null)

  useFrame(({ camera, clock }) => {
    const t = threatLevel()

    const g = world.current
    if (g) {
      if (useGame.getState().phase === 'playing' && live.active && t > 0) {
        const amp = SHAKE_MAX * t * t
        const time = clock.elapsedTime
        g.position.set(
          (Math.sin(time * 31.7) + Math.sin(time * 19.3)) * 0.5 * amp,
          (Math.sin(time * 27.1) + Math.sin(time * 23.9)) * 0.5 * amp,
          0,
        )
      } else {
        g.position.set(0, 0, 0)
      }
    }

    const cam = camera as PerspectiveCamera
    const target = FOV + FOV_PULSE * t * t
    if (Math.abs(cam.fov - target) > 0.01) {
      cam.fov += (target - cam.fov) * 0.08
      cam.updateProjectionMatrix()
    }
  })

  return <group ref={world}>{children}</group>
}

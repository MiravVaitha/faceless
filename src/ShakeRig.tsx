import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { FOV, FOV_PULSE, SHAKE_MAX } from './config'
import { live, threatLevel } from './live'
import { useGame } from './store'

// Proximity screen shake as a camera POSITION offset, applied after gameplay
// logic (priority 10) and removed before it next frame (priority -10), so
// physics and the bot always see the true position. Rotation is off-limits:
// PointerLockControls re-derives its euler from the camera quaternion on every
// mouse move, so rotational shake would bake into where the player is looking.
export default function ShakeRig() {
  const offset = useRef(new Vector3())

  useFrame(({ camera }) => {
    camera.position.sub(offset.current)
    offset.current.set(0, 0, 0)
  }, -10)

  useFrame(({ camera, clock }) => {
    const t = threatLevel()
    if (useGame.getState().phase === 'playing' && live.locked && t > 0) {
      const amp = SHAKE_MAX * t * t
      const time = clock.elapsedTime
      offset.current.set(
        (Math.sin(time * 31.7) + Math.sin(time * 19.3)) * 0.5 * amp,
        (Math.sin(time * 27.1) + Math.sin(time * 23.9)) * 0.5 * amp,
        0,
      )
      camera.position.add(offset.current)
    }
    const cam = camera as PerspectiveCamera
    const target = FOV + FOV_PULSE * t * t
    if (Math.abs(cam.fov - target) > 0.01) {
      cam.fov += (target - cam.fov) * 0.08
      cam.updateProjectionMatrix()
    }
  }, 10)

  return null
}

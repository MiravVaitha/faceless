import { useEffect, useRef, type ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { Euler, Vector3 } from 'three'
import { slideMove } from './collision'
import {
  BHOP_SPEED_MULT,
  GAMEPAD_LOOK_SPEED,
  GRAVITY,
  JUMP_SPEED,
  MOUSE_SENS,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_SPRINT,
  PLAYER_WALK,
} from './config'
import { pollGamepad } from './gamepad'
import { live } from './live'
import { PLAYER_SPAWN, cellToWorld } from './map'

const spawn = cellToWorld(PLAYER_SPAWN.col, PLAYER_SPAWN.row)

type KeyAction = 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'jump'

const KEY_MAP: Record<string, KeyAction> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  Space: 'jump',
}

// scratch objects reused every frame — never allocate inside useFrame
const _euler = new Euler()
const _forward = new Vector3()
const _right = new Vector3()
const _move = new Vector3()

const PITCH_LIMIT = Math.PI / 2 - 0.01
// signed-square stick response: precise near center, fast at full deflection
const curve = (v: number) => v * Math.abs(v)

export default function Player({ onLockChange }: { onLockChange?: (locked: boolean) => void }) {
  const controls = useRef<ComponentRef<typeof PointerLockControls>>(null)
  const keys = useRef<Record<KeyAction, boolean>>({
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
  })
  const velocityY = useRef(0)
  const camera = useThree((s) => s.camera)

  // Reset to spawn on mount. We deliberately DON'T auto-grab the pointer: doing
  // so trapped the cursor the instant a run began, so you couldn't click
  // anything until you discovered Esc. Instead the "click to enter" overlay
  // locks on click, and a gamepad plays without ever needing a lock at all.
  useEffect(() => {
    camera.position.set(spawn.x, PLAYER_HEIGHT, spawn.z)
    camera.rotation.set(0, Math.PI, 0) // face down the long corridor
    velocityY.current = 0
    return () => {
      live.locked = false
      live.active = false
      document.exitPointerLock()
    }
  }, [camera])

  useEffect(() => {
    const setKey = (down: boolean) => (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code]
      if (!action) return
      keys.current[action] = down
      if (e.code === 'Space') e.preventDefault() // Space must not scroll the page
    }
    const onKeyDown = setKey(true)
    const onKeyUp = setKey(false)
    // keyup never fires if focus is lost mid-press — clear everything on blur
    const onBlur = () => {
      for (const action of Object.keys(keys.current) as KeyAction[]) {
        keys.current[action] = false
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1) // a dropped frame or tab switch must not teleport the player
    const k = keys.current

    const gp = pollGamepad()
    live.gamepad = gp.connected
    const active = live.locked || gp.connected
    live.active = active
    if (!active) return // paused (not locked, no pad): freeze the clock and all motion

    live.runTimeMs += dt * 1000

    // look — controller right stick. Mouse look is handled by PointerLockControls
    // on its own events; both read/write camera.quaternion, so they compose.
    if (gp.lookX !== 0 || gp.lookY !== 0) {
      _euler.setFromQuaternion(camera.quaternion, 'YXZ')
      _euler.y -= curve(gp.lookX) * GAMEPAD_LOOK_SPEED * dt
      _euler.x -= curve(gp.lookY) * GAMEPAD_LOOK_SPEED * dt
      _euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, _euler.x))
      _euler.z = 0
      camera.quaternion.setFromEuler(_euler)
    }

    // vertical — gravity, ground clamp, then jump. Holding jump re-fires on each
    // landing, so you bunny-hop continuously.
    velocityY.current -= GRAVITY * dt
    camera.position.y += velocityY.current * dt
    let grounded = false
    if (camera.position.y <= PLAYER_HEIGHT) {
      camera.position.y = PLAYER_HEIGHT
      velocityY.current = 0
      grounded = true
    }
    if (grounded && (k.jump || gp.jump)) {
      velocityY.current = JUMP_SPEED
      grounded = false
    }

    // horizontal — keyboard (digital) + left stick (analog), combined in input
    // space then clamped to length 1 so analog partials survive but diagonals
    // and stick+key overlap can't exceed full speed.
    const ahead = Number(k.forward) - Number(k.back) - gp.moveY
    const side = Number(k.right) - Number(k.left) + gp.moveX
    if (ahead !== 0 || side !== 0) {
      // walk along yaw only, so looking up/down never changes ground speed
      _euler.setFromQuaternion(camera.quaternion, 'YXZ')
      _forward.set(-Math.sin(_euler.y), 0, -Math.cos(_euler.y))
      _right.set(-_forward.z, 0, _forward.x)
      _move.set(0, 0, 0).addScaledVector(_forward, ahead).addScaledVector(_right, side)
      const mag = _move.length()
      if (mag > 1) _move.divideScalar(mag)

      const sprint = k.sprint || gp.sprint
      const speed = (sprint ? PLAYER_SPRINT : PLAYER_WALK) * (grounded ? 1 : BHOP_SPEED_MULT)
      const [nx, nz] = slideMove(
        camera.position.x,
        camera.position.z,
        _move.x * speed * dt,
        _move.z * speed * dt,
        PLAYER_RADIUS,
      )
      camera.position.x = nx
      camera.position.z = nz
    }
  })

  return (
    <PointerLockControls
      ref={controls}
      makeDefault
      pointerSpeed={MOUSE_SENS / 0.002} // three applies 0.002 rad/px internally; scale so MOUSE_SENS is the real sensitivity
      onLock={() => {
        live.locked = true
        onLockChange?.(true)
      }}
      onUnlock={() => {
        live.locked = false
        onLockChange?.(false)
      }}
    />
  )
}

import { useEffect, useRef, type ComponentRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { Euler, Vector3 } from 'three'
import { GRAVITY, MOUSE_SENS, PLAYER_HEIGHT, PLAYER_SPRINT, PLAYER_WALK } from './config'

type KeyAction = 'forward' | 'back' | 'left' | 'right' | 'sprint'

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
}

// scratch objects reused every frame — never allocate inside useFrame
const _euler = new Euler()
const _forward = new Vector3()
const _right = new Vector3()
const _move = new Vector3()

export default function Player({ onLockChange }: { onLockChange?: (locked: boolean) => void }) {
  const controls = useRef<ComponentRef<typeof PointerLockControls>>(null)
  const keys = useRef<Record<KeyAction, boolean>>({
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
  })
  const velocityY = useRef(0)

  useEffect(() => {
    const setKey = (down: boolean) => (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code]
      if (action) keys.current[action] = down
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

    velocityY.current -= GRAVITY * dt
    camera.position.y += velocityY.current * dt
    if (camera.position.y <= PLAYER_HEIGHT) {
      camera.position.y = PLAYER_HEIGHT
      velocityY.current = 0
    }

    if (!controls.current?.isLocked) return

    const k = keys.current
    const ahead = Number(k.forward) - Number(k.back)
    const side = Number(k.right) - Number(k.left)
    if (ahead === 0 && side === 0) return

    // walk along yaw only, so looking up/down never changes ground speed
    _euler.setFromQuaternion(camera.quaternion, 'YXZ')
    _forward.set(-Math.sin(_euler.y), 0, -Math.cos(_euler.y))
    _right.set(-_forward.z, 0, _forward.x)

    _move
      .set(0, 0, 0)
      .addScaledVector(_forward, ahead)
      .addScaledVector(_right, side)
      .normalize() // diagonals move at the same speed as straight lines

    const speed = k.sprint ? PLAYER_SPRINT : PLAYER_WALK
    camera.position.addScaledVector(_move, speed * dt)
  })

  return (
    <PointerLockControls
      ref={controls}
      makeDefault
      pointerSpeed={MOUSE_SENS / 0.002} // three applies 0.002 rad/px internally; scale so MOUSE_SENS is the real sensitivity
      onLock={() => onLockChange?.(true)}
      onUnlock={() => onLockChange?.(false)}
    />
  )
}

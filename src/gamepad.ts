import { STICK_DEADZONE } from './config'

// Xbox / standard-mapping gamepad, read fresh each frame via the Gamepad API.
// Axes: 0,1 = left stick (move), 2,3 = right stick (look). Buttons (standard):
// 0 A, 4 LB, 6 LT, 9 Start/Menu, 10 left-stick click.

export interface GamepadInput {
  connected: boolean
  moveX: number // -1..1, right positive
  moveY: number // -1..1, up negative (stick convention)
  lookX: number
  lookY: number
  sprint: boolean
  jump: boolean
}

const NONE: GamepadInput = {
  connected: false,
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  sprint: false,
  jump: false,
}

// Radial deadzone with rescaling, so output ramps smoothly from 0 just past the
// deadzone instead of jumping to a finite value (and drift never leaks through).
function deadzone(x: number, y: number): [number, number] {
  const mag = Math.hypot(x, y)
  if (mag < STICK_DEADZONE) return [0, 0]
  const scaled = Math.min((mag - STICK_DEADZONE) / (1 - STICK_DEADZONE), 1) / mag
  return [x * scaled, y * scaled]
}

function activePad(): Gamepad | null {
  const pads = navigator.getGamepads?.() ?? []
  // prefer a standard-mapped pad (Xbox reports 'standard' on Chrome)
  return pads.find((p) => p?.connected && p.mapping === 'standard') ?? pads.find((p) => p?.connected) ?? null
}

export function pollGamepad(): GamepadInput {
  const pad = activePad()
  if (!pad) return NONE
  const [moveX, moveY] = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0)
  const [lookX, lookY] = deadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0)
  const pressed = (i: number) => pad.buttons[i]?.pressed ?? false
  const value = (i: number) => pad.buttons[i]?.value ?? 0
  return {
    connected: true,
    moveX,
    moveY,
    lookX,
    lookY,
    sprint: pressed(4) || pressed(10) || value(6) > 0.4, // LB, left-stick click, or LT pulled
    jump: pressed(0), // A (held — enables continuous bunny-hopping)
  }
}

// Edge-triggered "confirm" (A or Start) for menu / game-over navigation. Keeps
// its own previous-state so a held button fires once, not every frame. Only one
// menu screen polls at a time, so the single module-level flag is safe.
let prevConfirm = false
export function pollConfirmPressed(): boolean {
  const pad = activePad()
  const down = !!pad && ((pad.buttons[0]?.pressed ?? false) || (pad.buttons[9]?.pressed ?? false))
  const edge = down && !prevConfirm
  prevConfirm = down
  return edge
}

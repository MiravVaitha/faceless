import { CATCH_DISTANCE, THREAT_DISTANCE } from './config'

// Per-frame values shared across the canvas/DOM boundary without re-renders.
// Written inside useFrame, read by DOM overlays via requestAnimationFrame.
// Discrete game state belongs in the zustand store, not here.
export const live = {
  locked: false, // pointer lock — mouse look + keyboard play
  gamepad: false, // a gamepad is connected and feeding input
  active: false, // accepting play input this frame: locked || gamepad. The bot,
  // the run clock, and the juice all gate on this so a controller (which can't
  // pointer-lock by clicking) plays exactly like mouse + keyboard.
  botDistance: Infinity,
  runTimeMs: 0, // play time accumulated while active, reset each run
}

/** 0 when the bot is THREAT_DISTANCE+ away, 1 at touching distance. */
export function threatLevel(): number {
  const t = 1 - (live.botDistance - CATCH_DISTANCE) / (THREAT_DISTANCE - CATCH_DISTANCE)
  return Math.min(1, Math.max(0, t))
}

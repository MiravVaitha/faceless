import { CATCH_DISTANCE, THREAT_DISTANCE } from './config'

// Per-frame values shared across the canvas/DOM boundary without re-renders.
// Written inside useFrame (or lock callbacks), read by DOM overlays via
// requestAnimationFrame. Discrete game state belongs in the zustand store,
// not here.
export const live = {
  locked: false,
  botDistance: Infinity,
  // pause bookkeeping: survival time only counts while the pointer is locked,
  // since the bot freezes when it isn't — otherwise Esc-idling farms the clock
  pausedAt: null as number | null,
  pausedTotal: 0,
}

/** 0 when the bot is THREAT_DISTANCE+ away, 1 at touching distance. */
export function threatLevel(): number {
  const t = 1 - (live.botDistance - CATCH_DISTANCE) / (THREAT_DISTANCE - CATCH_DISTANCE)
  return Math.min(1, Math.max(0, t))
}

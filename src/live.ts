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

// Per-frame values shared across the canvas/DOM boundary without re-renders.
// Written inside useFrame (or lock callbacks), read by DOM overlays via
// requestAnimationFrame. Discrete game state belongs in the zustand store,
// not here.
export const live = {
  locked: false,
  botDistance: Infinity,
}

import { CELL_SIZE } from './config'
import { isWall } from './map'

// Tiny shrink applied on the CROSS axis when mapping the player's box to grid
// cells, so a box resting exactly against a wall face doesn't register as
// inside that wall — without it, sliding along a wall sticks. The leading edge
// in the motion axis is checked exactly: shrinking it too would let the box
// sink an EPS-deep notch into walls instead of clamping flush. Corner clipping
// is bounded by EPS, so keep it just big enough to absorb float error (~1e-14
// at map scale) and far below anything visible.
const EPS = 1e-7

/**
 * Move a square of half-width `r` by (dx, dz) against the maze grid, one axis
 * at a time. Clamping x never blocks z and vice versa, which is what makes the
 * player slide along walls instead of stopping dead. Assumes |dx|,|dz| < one
 * cell per call (true: speeds are ~7 m/s on a clamped dt against 4 m cells).
 */
export function slideMove(x: number, z: number, dx: number, dz: number, r: number): [number, number] {
  if (dx !== 0) {
    let nx = x + dx
    const minRow = Math.floor((z - r + EPS) / CELL_SIZE)
    const maxRow = Math.floor((z + r - EPS) / CELL_SIZE)
    const leadCol = dx > 0 ? Math.floor((nx + r) / CELL_SIZE) : Math.floor((nx - r) / CELL_SIZE)
    for (let row = minRow; row <= maxRow; row++) {
      if (isWall(leadCol, row)) {
        nx = dx > 0 ? leadCol * CELL_SIZE - r : (leadCol + 1) * CELL_SIZE + r
        break
      }
    }
    x = nx
  }
  if (dz !== 0) {
    let nz = z + dz
    const minCol = Math.floor((x - r + EPS) / CELL_SIZE)
    const maxCol = Math.floor((x + r - EPS) / CELL_SIZE)
    const leadRow = dz > 0 ? Math.floor((nz + r) / CELL_SIZE) : Math.floor((nz - r) / CELL_SIZE)
    for (let col = minCol; col <= maxCol; col++) {
      if (isWall(col, leadRow)) {
        nz = dz > 0 ? leadRow * CELL_SIZE - r : (leadRow + 1) * CELL_SIZE + r
        break
      }
    }
    z = nz
  }
  return [x, z]
}

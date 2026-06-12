import { COLS, GRID, ROWS } from './map'

export interface Cell {
  col: number
  row: number
}

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

/**
 * A* over the maze grid, 4-directional so paths hug corridors and never cut
 * diagonally through wall corners. Returns cells from start to goal inclusive,
 * or null if either end is a wall. The grid is tiny (21×21), so a linear-scan
 * open list beats heap bookkeeping.
 */
export function findPath(start: Cell, goal: Cell): Cell[] | null {
  if (GRID[start.row]?.[start.col] !== 0 || GRID[goal.row]?.[goal.col] !== 0) return null

  const size = COLS * ROWS
  const goalIdx = goal.row * COLS + goal.col
  const gScore = new Float64Array(size).fill(Infinity)
  const parent = new Int32Array(size).fill(-1)
  const closed = new Uint8Array(size)
  const inOpen = new Uint8Array(size)
  const open: number[] = [start.row * COLS + start.col]
  gScore[open[0]] = 0
  inOpen[open[0]] = 1

  const h = (i: number) => Math.abs((i % COLS) - goal.col) + Math.abs(Math.floor(i / COLS) - goal.row)

  while (open.length > 0) {
    let best = 0
    for (let i = 1; i < open.length; i++) {
      if (gScore[open[i]] + h(open[i]) < gScore[open[best]] + h(open[best])) best = i
    }
    const current = open[best]
    open[best] = open[open.length - 1]
    open.pop()
    inOpen[current] = 0

    if (current === goalIdx) {
      const path: Cell[] = []
      for (let i = current; i !== -1; i = parent[i]) {
        path.push({ col: i % COLS, row: Math.floor(i / COLS) })
      }
      return path.reverse()
    }
    closed[current] = 1

    const c = current % COLS
    const r = Math.floor(current / COLS)
    for (const [dc, dr] of NEIGHBORS) {
      const nc = c + dc
      const nr = r + dr
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue
      if (GRID[nr][nc] !== 0) continue
      const ni = nr * COLS + nc
      if (closed[ni]) continue
      const tentative = gScore[current] + 1
      if (tentative < gScore[ni]) {
        gScore[ni] = tentative
        parent[ni] = current
        if (!inOpen[ni]) {
          open.push(ni)
          inOpen[ni] = 1
        }
      }
    }
  }
  return null
}

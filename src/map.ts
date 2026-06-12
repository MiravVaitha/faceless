import { CELL_SIZE } from './config'

// '#' wall · '.' floor · 'P' player spawn · 'B' bot spawn (used from Phase 3)
// Hand-authored chase map: mostly loops so there's always a second way out —
// dead ends kill the player in a pursuit game, so keep them rare and shallow.
const LAYOUT = [
  '#####################',
  '#P..#.......#.......#',
  '#.#.#.#####.#.#####.#',
  '#.#.....#...#.....#.#',
  '#.###.#.#.###.###.#.#',
  '#.....#.#.....#...#.#',
  '###.#.#.#####.#.###.#',
  '#...#.....#...#.#...#',
  '#.#####.#.#.###.#.#.#',
  '#.....#.#.#.....#.#.#',
  '#####.#.#.#######.#.#',
  '#...#.#.#.......#.#.#',
  '#.#.#.#.#######.#.#.#',
  '#.#...#.......#...#.#',
  '#.#.#########.###.#.#',
  '#.#.#.......#...#...#',
  '#.#.#.#####.###.###.#',
  '#.#...#...#...#.....#',
  '#.###.#.#.###.#####.#',
  '#.......#..........B#',
  '#####################',
]

export const ROWS = LAYOUT.length
export const COLS = LAYOUT[0].length

for (const line of LAYOUT) {
  if (line.length !== COLS) throw new Error(`map row "${line}" is not ${COLS} cells wide`)
}

/** 1 = wall, 0 = floor. Row-major: GRID[row][col]. Phase 4's A* walks this array. */
export const GRID: number[][] = LAYOUT.map((line) => [...line].map((ch) => (ch === '#' ? 1 : 0)))

function locate(marker: string): { col: number; row: number } {
  for (let row = 0; row < ROWS; row++) {
    const col = LAYOUT[row].indexOf(marker)
    if (col !== -1) return { col, row }
  }
  throw new Error(`map has no '${marker}' marker`)
}

export const PLAYER_SPAWN = locate('P')
export const BOT_SPAWN = locate('B')

export const MAP_WIDTH = COLS * CELL_SIZE
export const MAP_DEPTH = ROWS * CELL_SIZE

/** Out-of-bounds counts as wall so nothing can ever leave the map. */
export function isWall(col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true
  return GRID[row][col] === 1
}

export function cellToWorld(col: number, row: number): { x: number; z: number } {
  return { x: (col + 0.5) * CELL_SIZE, z: (row + 0.5) * CELL_SIZE }
}

export function worldToCell(x: number, z: number): { col: number; row: number } {
  return { col: Math.floor(x / CELL_SIZE), row: Math.floor(z / CELL_SIZE) }
}

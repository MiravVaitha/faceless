// Validates the maze in src/map.ts: rectangular, sealed boundary, exactly one
// P and one B, every floor cell reachable from P, and reports dead ends.
// Run: npm run check:map
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(new URL('../src/map.ts', import.meta.url), 'utf8')
const rows = [...source.matchAll(/^\s*'([#.PB]+)',\s*$/gm)].map((m) => m[1])

const fail = (msg) => {
  console.error(`✗ ${msg}`)
  process.exitCode = 1
}

if (rows.length === 0) fail('no LAYOUT rows found in src/map.ts')

const ROWS = rows.length
const COLS = rows[0]?.length ?? 0
rows.forEach((row, r) => {
  if (row.length !== COLS) fail(`row ${r} is ${row.length} wide, expected ${COLS}`)
})

for (const marker of ['P', 'B']) {
  const count = rows.join('').split(marker).length - 1
  if (count !== 1) fail(`expected exactly one '${marker}', found ${count}`)
}

rows.forEach((row, r) => {
  ;[...row].forEach((ch, c) => {
    const onBoundary = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1
    if (onBoundary && ch !== '#') fail(`boundary cell (${c},${r}) is '${ch}', not '#'`)
  })
})

const isFloor = (c, r) => r >= 0 && c >= 0 && r < ROWS && c < COLS && rows[r][c] !== '#'
const find = (marker) => {
  const r = rows.findIndex((row) => row.includes(marker))
  return { c: rows[r].indexOf(marker), r }
}

const start = find('P')
const seen = new Set([`${start.c},${start.r}`])
const queue = [start]
while (queue.length) {
  const { c, r } = queue.pop()
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const key = `${c + dc},${r + dr}`
    if (isFloor(c + dc, r + dr) && !seen.has(key)) {
      seen.add(key)
      queue.push({ c: c + dc, r: r + dr })
    }
  }
}

let floorCount = 0
const unreachable = []
const deadEnds = []
rows.forEach((row, r) => {
  ;[...row].forEach((ch, c) => {
    if (ch === '#') return
    floorCount++
    if (!seen.has(`${c},${r}`)) unreachable.push(`(${c},${r})`)
    const exits = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dc, dr]) => isFloor(c + dc, r + dr)).length
    if (exits === 1) deadEnds.push(`(${c},${r})`)
  })
})

if (unreachable.length) fail(`${unreachable.length} floor cells unreachable from P: ${unreachable.join(' ')}`)

console.log(`map ${COLS}×${ROWS}, ${floorCount} floor cells, all reachable: ${unreachable.length === 0}`)
console.log(`dead ends: ${deadEnds.length}${deadEnds.length ? ` at ${deadEnds.join(' ')}` : ''}`)
if (process.exitCode !== 1) console.log('✓ map OK')

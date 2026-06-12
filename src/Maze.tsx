import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Matrix4 } from 'three'
import { CELL_SIZE, WALL_HEIGHT } from './config'
import { GRID, MAP_DEPTH, MAP_WIDTH, cellToWorld } from './map'

// deterministic 0..1 per cell so wall shading is stable across renders
function hash01(n: number) {
  const s = Math.sin(n) * 43758.5453
  return s - Math.floor(s)
}

export default function Maze() {
  const walls = useMemo(() => {
    const cells: { col: number; row: number }[] = []
    GRID.forEach((rowArr, row) =>
      rowArr.forEach((value, col) => {
        if (value === 1) cells.push({ col, row })
      }),
    )
    return cells
  }, [])

  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    const color = new Color()
    walls.forEach(({ col, row }, i) => {
      const { x, z } = cellToWorld(col, row)
      matrix.setPosition(x, WALL_HEIGHT / 2, z)
      mesh.setMatrixAt(i, matrix)
      // slight per-wall tint variation breaks up the corridors visually
      color.set('#5d635a').multiplyScalar(0.88 + 0.24 * hash01(col * 127.1 + row * 311.7))
      mesh.setColorAt(i, color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [walls])

  return (
    <group>
      {/* one draw call for every wall; culling is off because the default
          bounds only cover a single box, which would blank walls at screen edges */}
      <instancedMesh ref={ref} args={[undefined, undefined, walls.length]} frustumCulled={false}>
        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial color="#ffffff" />
      </instancedMesh>
      <mesh position={[MAP_WIDTH / 2, 0, MAP_DEPTH / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[MAP_WIDTH, MAP_DEPTH]} />
        <meshStandardMaterial color="#4a5240" />
      </mesh>
    </group>
  )
}

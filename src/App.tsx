import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Bot from './Bot'
import Maze from './Maze'
import Menu from './Menu'
import Player from './Player'
import { FOV, PLAYER_HEIGHT } from './config'
import { PLAYER_SPAWN, cellToWorld } from './map'
import { useGame } from './store'

const spawn = cellToWorld(PLAYER_SPAWN.col, PLAYER_SPAWN.row)

export default function App() {
  const phase = useGame((s) => s.phase)
  const [locked, setLocked] = useState(false)

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{
          position: [spawn.x, PLAYER_HEIGHT, spawn.z],
          // face down the long corridor (+z) instead of into the spawn wall
          rotation: [0, Math.PI, 0],
          fov: FOV,
        }}
      >
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 10, 45]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 5]} intensity={1.2} />
        <Maze />
        <Suspense fallback={null}>
          <Bot />
        </Suspense>
        {/* mounted only while playing, so menu/game-over clicks can't grab the pointer */}
        {phase === 'playing' && <Player onLockChange={setLocked} />}
      </Canvas>

      {phase === 'menu' && <Menu />}

      {phase === 'playing' && !locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/70 px-8 py-6 text-center font-mono text-white">
            <p className="text-xl">Click to enter the maze</p>
            <p className="mt-3 text-sm text-white/60">WASD move &middot; Shift sprint &middot; Esc release mouse</p>
          </div>
        </div>
      )}
    </div>
  )
}

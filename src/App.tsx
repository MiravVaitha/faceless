import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Player from './Player'
import { FOV, PLAYER_HEIGHT } from './config'

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#4a5240" />
    </mesh>
  )
}

// temporary landmarks so motion (and sprint speed) reads on the flat plane — Phase 2's maze replaces these
const PILLARS: [number, number][] = [
  [8, -6],
  [-10, -14],
  [4, -22],
  [-5, 3],
  [14, 10],
  [-16, 12],
  [0, -10],
  [18, -18],
]

function Pillars() {
  return (
    <>
      {PILLARS.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, 1.5, z]}>
          <boxGeometry args={[1.2, 3, 1.2]} />
          <meshStandardMaterial color="#2e3328" />
        </mesh>
      ))}
    </>
  )
}

export default function App() {
  const [locked, setLocked] = useState(false)

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, PLAYER_HEIGHT, 5], fov: FOV }}>
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 10, 45]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 5]} intensity={1.2} />
        <Floor />
        <Pillars />
        <gridHelper args={[60, 60, '#3a4034', '#3a4034']} position={[0, 0.01, 0]} />
        <Player onLockChange={setLocked} />
      </Canvas>
      {!locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/70 px-8 py-6 text-center font-mono text-white">
            <p className="text-xl">Click to play</p>
            <p className="mt-3 text-sm text-white/60">WASD move &middot; Shift sprint &middot; Esc release mouse</p>
          </div>
        </div>
      )}
    </div>
  )
}

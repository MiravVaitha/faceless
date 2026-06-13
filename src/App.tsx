import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import AudioRig from './AudioRig'
import Bot from './Bot'
import GameOver from './GameOver'
import Hud from './Hud'
import Maze from './Maze'
import Menu from './Menu'
import Player from './Player'
import ShakeRig from './ShakeRig'
import { FOG_FAR, FOG_NEAR, FOV, PLAYER_HEIGHT } from './config'
import { PLAYER_SPAWN, cellToWorld } from './map'
import { useGame } from './store'

const spawn = cellToWorld(PLAYER_SPAWN.col, PLAYER_SPAWN.row)

export default function App() {
  const phase = useGame((s) => s.phase)
  const [locked, setLocked] = useState(false)
  const [hasPad, setHasPad] = useState(false)

  // a controller plays without pointer lock, so its presence hides the
  // click-to-enter prompt. Chrome only reports a pad after its first button
  // press (privacy), which is exactly when the player has "entered" anyway.
  useEffect(() => {
    const update = () => setHasPad((navigator.getGamepads?.() ?? []).some((p) => !!p?.connected))
    window.addEventListener('gamepadconnected', update)
    window.addEventListener('gamepaddisconnected', update)
    update()
    return () => {
      window.removeEventListener('gamepadconnected', update)
      window.removeEventListener('gamepaddisconnected', update)
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{
          position: [spawn.x, PLAYER_HEIGHT, spawn.z],
          // face down the long corridor (+z) instead of into the spawn wall
          rotation: [0, Math.PI, 0],
          fov: FOV,
        }}
        // ACES crushes the mid-tones into black; a little exposure lifts the
        // street back to navigable without washing out the neon.
        gl={{ toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={['#0a0e1a']} />
        <fog attach="fog" args={['#0a0e1a', FOG_NEAR, FOG_FAR]} />
        {/* Night city: the city's OWN lights — windows, shopfronts, streetlamps —
            do most of the work, but a cool moonwash lifts the road and walls
            enough to actually run through. The bot is unlit, so it stays
            readable no matter how dark the street. */}
        <ambientLight intensity={0.4} color="#44536f" />
        <hemisphereLight args={['#35496e', '#0d1119', 0.75]} />
        <directionalLight position={[40, 70, -25]} intensity={0.6} color="#a2b4da" />
        <ShakeRig>
          <Maze />
          <Suspense fallback={null}>
            <Bot />
          </Suspense>
        </ShakeRig>
        {/* mounted only while playing, so menu/game-over clicks can't grab the pointer */}
        {phase === 'playing' && <Player onLockChange={setLocked} />}
        {/* mounted only once a run exists, so the AudioContext is born inside the Start gesture */}
        {phase !== 'menu' && <AudioRig />}
      </Canvas>

      {phase === 'menu' && <Menu />}

      {phase === 'playing' && <Hud />}

      {phase === 'playing' && !locked && !hasPad && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/70 px-8 py-6 text-center font-mono text-white">
            <p className="text-xl">Click to step into the street</p>
            <p className="mt-1 text-sm text-white/50">(or press a button on your controller)</p>
            <p className="mt-3 text-sm text-white/60">
              WASD move &middot; Shift sprint &middot; Space jump &middot; Esc release mouse
            </p>
          </div>
        </div>
      )}

      {phase === 'caught' && (
        <>
          <div className="pointer-events-none absolute inset-0 animate-[jumpflash_0.7s_ease-out_forwards] bg-red-700" />
          <GameOver />
        </>
      )}
    </div>
  )
}

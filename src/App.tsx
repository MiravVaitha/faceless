import { Canvas } from '@react-three/fiber'
import { FOV, PLAYER_HEIGHT } from './config'

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#4a5240" />
    </mesh>
  )
}

export default function App() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, PLAYER_HEIGHT, 5], fov: FOV }}>
        <color attach="background" args={['#0a0a12']} />
        <fog attach="fog" args={['#0a0a12', 10, 45]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 5]} intensity={1.2} />
        <Floor />
      </Canvas>
    </div>
  )
}

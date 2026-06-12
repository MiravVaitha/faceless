import { Billboard, useTexture } from '@react-three/drei'
import { DoubleSide, SRGBColorSpace } from 'three'
import { BOT_FLOAT, BOT_HEIGHT } from './config'
import { BOT_SPAWN, cellToWorld } from './map'
import { placeholderFaceUrl } from './placeholderFace'

const spawn = cellToWorld(BOT_SPAWN.col, BOT_SPAWN.row)

export default function Bot() {
  const texture = useTexture(placeholderFaceUrl)

  // size the sprite like a person regardless of the photo's shape
  const img = texture.image as { width?: number; height?: number } | undefined
  const aspect = img?.width && img?.height ? img.width / img.height : 1
  const width = Math.min(Math.max(BOT_HEIGHT * aspect, 1.0), 2.6)

  return (
    <group position={[spawn.x, BOT_HEIGHT / 2 + BOT_FLOAT, spawn.z]}>
      <Billboard>
        <mesh>
          <planeGeometry args={[width, BOT_HEIGHT]} />
          {/* unlit + untonemapped: the face stays full-bright in the dark, nextbot style */}
          <meshBasicMaterial transparent side={DoubleSide} toneMapped={false}>
            {/* sRGB because uploaded photos are sRGB — linear washes them out */}
            <primitive object={texture} attach="map" colorSpace={SRGBColorSpace} anisotropy={4} />
          </meshBasicMaterial>
        </mesh>
      </Billboard>
    </group>
  )
}

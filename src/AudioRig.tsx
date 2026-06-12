import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Audio as ThreeAudio } from 'three'
import { droneBuffer, getListener, heartbeatBuffer, stingerBuffer } from './audio'
import { threatLevel } from './live'
import { useGame } from './store'

// Non-positional audio: chase drone, the player's own heartbeat, and the
// catch stinger. Mounted only once a run has started, so the AudioContext is
// created inside the Start click's gesture.
export default function AudioRig() {
  const camera = useThree((s) => s.camera)
  const phase = useGame((s) => s.phase)
  const [listener] = useState(getListener)
  const heart = useRef<ThreeAudio | null>(null)

  useEffect(() => {
    camera.add(listener)
    return () => {
      camera.remove(listener)
    }
  }, [camera, listener])

  // drone + heartbeat run while playing; both cut at the catch
  useEffect(() => {
    if (phase !== 'playing') return
    const drone = new ThreeAudio(listener)
    drone.setBuffer(droneBuffer())
    drone.setLoop(true)
    drone.setVolume(0.22)
    drone.play()
    const heartbeat = new ThreeAudio(listener)
    heartbeat.setBuffer(heartbeatBuffer())
    heartbeat.setLoop(true)
    heartbeat.setVolume(0)
    heartbeat.play()
    heart.current = heartbeat
    return () => {
      drone.stop()
      heartbeat.stop()
      heart.current = null
    }
  }, [phase, listener])

  // stinger exactly once per catch
  useEffect(() => {
    if (phase !== 'caught') return
    const stinger = new ThreeAudio(listener)
    stinger.setBuffer(stingerBuffer())
    stinger.setVolume(0.9)
    stinger.play()
    return () => {
      if (stinger.isPlaying) stinger.stop()
    }
  }, [phase, listener])

  // heartbeat swells and races as the bot closes in
  useFrame(() => {
    const heartbeat = heart.current
    if (heartbeat) {
      const t = threatLevel()
      heartbeat.setVolume(t * t * 0.5)
      heartbeat.setPlaybackRate(0.85 + t * 0.85)
    }
  })

  return null
}

import { useEffect, useRef } from 'react'
import { threatLevel } from './live'
import { runElapsedMs } from './store'

// Per-frame DOM updates happen via rAF + direct mutation: re-rendering React
// at 60fps for a ticking clock and a fading vignette would be wasteful.
export default function Hud() {
  const timer = useRef<HTMLDivElement>(null)
  const vignette = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (timer.current) {
        const s = runElapsedMs() / 1000
        timer.current.textContent = `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`
      }
      if (vignette.current) {
        vignette.current.style.opacity = (Math.pow(threatLevel(), 1.5) * 0.85).toFixed(3)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <div
        ref={vignette}
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 52%, rgba(190, 0, 0, 0.6) 100%)',
          opacity: 0,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
        <div ref={timer} className="font-mono text-xl text-white/70" />
      </div>
    </>
  )
}

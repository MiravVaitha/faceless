import { useEffect, useRef } from 'react'
import { runElapsedMs } from './store'

// Per-frame DOM updates happen via rAF + direct mutation: re-rendering React
// at 60fps for a ticking clock would be wasteful.
export default function Hud() {
  const timer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (timer.current) {
        const s = runElapsedMs() / 1000
        timer.current.textContent = `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
      <div ref={timer} className="font-mono text-xl text-white/70" />
    </div>
  )
}

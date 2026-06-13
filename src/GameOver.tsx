import { useEffect, useState } from 'react'
import { GAMEOVER_DELAY } from './config'
import { pollConfirmPressed } from './gamepad'
import { useGame } from './store'

const fmt = (ms: number) => `${(ms / 1000).toFixed(1)}s`

export default function GameOver() {
  const survivedMs = useGame((s) => s.survivedMs)
  const bestMs = useGame((s) => s.bestMs)
  const start = useGame((s) => s.start)
  const toMenu = useGame((s) => s.toMenu)

  // hold back the panel so the jumpscare gets the screen to itself first
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), GAMEOVER_DELAY)
    return () => clearTimeout(t)
  }, [])

  // A / Start on the gamepad runs again — only once the panel is up, so a held
  // jump button at the moment of the catch can't instantly restart
  useEffect(() => {
    if (!visible) return
    let raf = 0
    const tick = () => {
      if (pollConfirmPressed()) start()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, start])

  if (!visible) return null

  const isNewBest = bestMs !== null && survivedMs >= bestMs

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-4 font-mono text-white">
        <h1 className="text-6xl font-bold tracking-[0.3em] text-red-600">IT GOT YOU</h1>
        <p className="text-lg text-white/80">
          you lasted {fmt(survivedMs)}
          {isNewBest && <span className="ml-2 text-red-400">new best</span>}
        </p>
        {!isNewBest && bestMs !== null && <p className="text-sm text-white/50">best: {fmt(bestMs)}</p>}
        <div className="mt-4 flex gap-3">
          <button
            onClick={start}
            className="border border-red-700 bg-red-800/80 px-8 py-2 text-sm font-bold hover:bg-red-700"
          >
            RUN AGAIN
          </button>
          <button
            onClick={toMenu}
            className="border border-white/30 px-5 py-2 text-sm hover:border-white/70 hover:bg-white/10"
          >
            CHANGE FACE
          </button>
        </div>
        <p className="text-xs text-white/30">press A to run again</p>
      </div>
    </div>
  )
}

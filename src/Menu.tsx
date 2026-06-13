import { useCallback, useEffect, useRef, type ChangeEvent } from 'react'
import { resumeAudio } from './audio'
import { pollConfirmPressed } from './gamepad'
import { useGame } from './store'

export default function Menu() {
  const faceUrl = useGame((s) => s.faceUrl)
  const setFace = useGame((s) => s.setFace)
  const start = useGame((s) => s.start)
  const bestMs = useGame((s) => s.bestMs)
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFace(URL.createObjectURL(file))
    e.target.value = '' // so picking the same file again still fires onChange
  }

  // the only place audio is allowed to begin: inside the Start gesture
  const onStart = useCallback(() => {
    resumeAudio()
    start()
  }, [start])

  // A / Start on the gamepad also begins the run
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (pollConfirmPressed()) onStart()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onStart])

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85">
      <div className="flex flex-col items-center gap-5 font-mono text-white">
        <h1 className="text-5xl font-bold tracking-[0.4em] text-red-600">FACELESS</h1>
        <p className="text-sm text-white/50">upload a face. then run.</p>
        <img
          src={faceUrl}
          alt="the face that will chase you"
          className="h-44 w-44 border-2 border-red-900/70 bg-black/60 object-contain"
        />
        <div className="flex gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="border border-white/30 px-5 py-2 text-sm hover:border-white/70 hover:bg-white/10"
          >
            UPLOAD FACE
          </button>
          <button
            onClick={onStart}
            className="border border-red-700 bg-red-800/80 px-8 py-2 text-sm font-bold hover:bg-red-700"
          >
            START
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        <div className="text-center text-xs leading-relaxed text-white/40">
          <p>WASD / left-stick move &middot; Shift / LB sprint &middot; Space / A jump</p>
          <p>mouse / right-stick look &middot; don&apos;t let it touch you</p>
        </div>
        {bestMs !== null && (
          <p className="text-xs text-red-400/70">best survival: {(bestMs / 1000).toFixed(1)}s</p>
        )}
      </div>
    </div>
  )
}

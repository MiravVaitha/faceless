import { create } from 'zustand'
import { useTexture } from '@react-three/drei'
import { live } from './live'
import { placeholderFaceUrl } from './placeholderFace'

export type GamePhase = 'menu' | 'playing' | 'caught'

const BEST_KEY = 'faceless.best-ms'

function loadBest(): number | null {
  const n = Number(localStorage.getItem(BEST_KEY))
  return Number.isFinite(n) && n > 0 ? n : null
}

interface GameState {
  phase: GamePhase
  /** Texture source for the bot: the uploaded photo, or the built-in face. */
  faceUrl: string
  /** Bumped on every run start; effects keyed on it reset positions. */
  runId: number
  survivedMs: number
  bestMs: number | null
  setFace: (url: string) => void
  start: () => void
  caught: () => void
  toMenu: () => void
}

export const useGame = create<GameState>((set, get) => ({
  phase: 'menu',
  faceUrl: placeholderFaceUrl,
  runId: 0,
  survivedMs: 0,
  bestMs: loadBest(),

  setFace: (url) => {
    const prev = get().faceUrl
    if (prev.startsWith('blob:')) URL.revokeObjectURL(prev)
    useTexture.preload(url) // warm the cache so the bot doesn't pop in late
    set({ faceUrl: url })
  },

  start: () => {
    live.runTimeMs = 0 // the run clock; Player accumulates into it while active
    live.active = false
    set((s) => ({ phase: 'playing', runId: s.runId + 1, survivedMs: 0 }))
  },

  caught: () => {
    const s = get()
    if (s.phase !== 'playing') return
    const survivedMs = runElapsedMs()
    const bestMs = Math.max(s.bestMs ?? 0, survivedMs)
    localStorage.setItem(BEST_KEY, String(Math.round(bestMs)))
    set({ phase: 'caught', survivedMs, bestMs })
  },

  toMenu: () => set({ phase: 'menu' }),
}))

/** Accumulated active play time this run (frozen while paused / not active). */
export function runElapsedMs(): number {
  return useGame.getState().phase === 'menu' ? 0 : live.runTimeMs
}

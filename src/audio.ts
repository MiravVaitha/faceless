import { AudioListener } from 'three'

// All game audio is synthesized into buffers at runtime — the repo ships no
// sound files. Buffers are deterministic (seeded noise) and cached per name.
// The shared AudioListener (and with it the AudioContext) is created lazily so
// it can be born inside the Start click's user gesture — browsers refuse audio
// before one (and CLAUDE.md forbids it anyway).

let listener: AudioListener | null = null

export function getListener(): AudioListener {
  if (!listener) listener = new AudioListener()
  return listener
}

/** Call from a user-gesture handler (the Start button). */
export function resumeAudio() {
  const ctx = getListener().context
  if (ctx.state !== 'running') void ctx.resume()
}

const cache = new Map<string, AudioBuffer>()

function memo(name: string, make: (ctx: AudioContext) => AudioBuffer): AudioBuffer {
  let buffer = cache.get(name)
  if (!buffer) {
    buffer = make(getListener().context)
    cache.set(name, buffer)
  }
  return buffer
}

/** Seeded noise in -1..1, so every run sounds identical. */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s / 2 ** 32) * 2 - 1
  }
}

const TAU = Math.PI * 2

// Heavy uneven footfalls (descending 62Hz chirps + filtered-noise scuff) under
// a raspy breathing swell. 2.4s, loop-aligned.
function makeFootsteps(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const dur = 2.4
  const n = Math.floor(sr * dur)
  const buf = ctx.createBuffer(1, n, sr)
  const out = buf.getChannelData(0)
  const noise = lcg(7)
  let lpStep = 0
  let lpBreath = 0
  const stepTimes = [0, 0.62, 1.2, 1.81] // slightly uneven on purpose
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const w = noise()
    let steps = 0
    for (const st of stepTimes) {
      const d = t - st
      if (d >= 0 && d < 0.3) {
        const chirp = Math.sin(TAU * (62 * d - 55 * d * d))
        lpStep += (w - lpStep) * 0.18
        steps += chirp * Math.exp(-d * 20) * 0.9 + lpStep * Math.exp(-d * 45) * 0.5
      }
    }
    lpBreath += (w - lpBreath) * 0.035
    const cycle = 0.5 - 0.5 * Math.cos((TAU * t) / dur)
    const breath = lpBreath * (0.25 + Math.pow(cycle, 1.8) * 0.75) * 0.34
    out[i] = steps * 0.75 + breath
  }
  return buf
}

// Low detuned drone — every component frequency is a multiple of 1/8 Hz so
// the 8s buffer loops seamlessly.
function makeDrone(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const dur = 8
  const n = Math.floor(sr * dur)
  const buf = ctx.createBuffer(1, n, sr)
  const out = buf.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const am = 0.72 + 0.28 * Math.sin((TAU * t) / dur - Math.PI / 2)
    const warble = 0.5 + 0.5 * Math.sin(TAU * 0.25 * t)
    out[i] =
      (0.42 * Math.sin(TAU * 36.75 * t) +
        0.3 * Math.sin(TAU * 55 * t) +
        0.3 * Math.sin(TAU * 55.125 * t) +
        0.16 * Math.sin(TAU * 82.5 * t) * warble) *
      am *
      0.55
  }
  return buf
}

// One second of lub-dub; played looped with playbackRate driven by threat.
function makeHeartbeat(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const n = Math.floor(sr * 1.0)
  const buf = ctx.createBuffer(1, n, sr)
  const out = buf.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const lub = Math.exp(-(((t - 0.05) / 0.022) ** 2)) * Math.sin(TAU * 54 * (t - 0.05))
    const dub = Math.exp(-(((t - 0.28) / 0.018) ** 2)) * Math.sin(TAU * 49 * (t - 0.28)) * 0.75
    out[i] = (lub + dub) * 0.9
  }
  return buf
}

// Jumpscare stinger: noise blast + three tanh-saturated descending screams
// over a low boom.
function makeStinger(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const dur = 1.3
  const n = Math.floor(sr * dur)
  const buf = ctx.createBuffer(1, n, sr)
  const out = buf.getChannelData(0)
  const noise = lcg(13)
  const f0s = [330, 262, 196]
  const phases = [0, 0, 0]
  for (let i = 0; i < n; i++) {
    const t = i / sr
    let osc = 0
    for (let j = 0; j < f0s.length; j++) {
      const f = f0s[j] * Math.pow(0.22, t / 0.85)
      phases[j] += (TAU * f) / sr
      osc += Math.sin(phases[j]) / 3
    }
    const burst = noise() * Math.exp(-t * 8) * 1.6
    const boom = Math.sin(TAU * 44 * t) * Math.exp(-t * 3) * 1.1
    const env = t < 0.45 ? 1 : Math.exp(-(t - 0.45) * 5)
    out[i] = Math.tanh((osc * 1.7 + burst + boom) * 1.4) * env * 0.95
  }
  return buf
}

export const footstepsBuffer = () => memo('footsteps', makeFootsteps)
export const droneBuffer = () => memo('drone', makeDrone)
export const heartbeatBuffer = () => memo('heartbeat', makeHeartbeat)
export const stingerBuffer = () => memo('stinger', makeStinger)

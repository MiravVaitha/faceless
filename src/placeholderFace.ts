// Default chaser face, drawn at runtime so the repo ships no image assets.
// Deliberately crude: pale head, hollow stare, too-wide grin.

function makePlaceholderFace(): string {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')!

  g.fillStyle = '#15151a'
  g.fillRect(0, 0, size, size)

  // head
  g.fillStyle = '#d9d2c4'
  g.beginPath()
  g.ellipse(256, 268, 168, 216, 0, 0, Math.PI * 2)
  g.fill()

  // eye sockets
  g.fillStyle = '#0c0c0e'
  for (const x of [186, 326]) {
    g.beginPath()
    g.ellipse(x, 206, 46, 58, 0, 0, Math.PI * 2)
    g.fill()
  }
  // pinprick pupils, slightly cross-eyed
  g.fillStyle = '#e8e4da'
  g.beginPath()
  g.arc(196, 214, 7, 0, Math.PI * 2)
  g.arc(318, 210, 7, 0, Math.PI * 2)
  g.fill()

  // grin
  g.fillStyle = '#0c0c0e'
  g.beginPath()
  g.ellipse(256, 388, 118, 64, 0, 0, Math.PI)
  g.fill()
  g.fillStyle = '#cfc8ba'
  for (let i = 0; i < 7; i++) {
    g.fillRect(160 + i * 28, 388, 22, 26 + (i % 2) * 10)
  }

  // film grain, seeded so the face is identical every run
  let s = 41
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
  g.fillStyle = 'rgba(0,0,0,0.18)'
  for (let i = 0; i < 1400; i++) {
    g.fillRect(rng() * size, rng() * size, 2, 2)
  }

  return canvas.toDataURL('image/png')
}

export const placeholderFaceUrl = makePlaceholderFace()

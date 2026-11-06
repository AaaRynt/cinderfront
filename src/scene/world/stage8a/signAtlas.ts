import { CanvasTexture, SRGBColorSpace } from 'three'

import { createDeterministicRandom } from '../stage2/environment/seededLayout'

/** Two opaque enamel faces in a single synchronous texture. */
export function createSignAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const random = createDeterministicRandom('8a:sign-wear')

  function plate(y: number, base: string, ink: string, heading: string, footer: string, straight = false) {
    ctx.fillStyle = base
    ctx.fillRect(0, y, 512, 256)
    ctx.strokeStyle = ink
    ctx.lineWidth = 6
    ctx.strokeRect(15, y + 15, 482, 226)
    ctx.fillStyle = ink
    ctx.textAlign = 'left'
    ctx.font = straight ? 'bold 102px Arial' : 'bold 76px Arial'
    ctx.fillText(heading, 42, y + 126, 426)
    ctx.font = 'bold 35px Arial'
    ctx.fillText(footer, 42, y + 197, 325)
    ctx.save()
    ctx.translate(420, y + 173)
    if (straight) ctx.rotate(-Math.PI / 2)
    ctx.beginPath()
    ctx.moveTo(-31, -23)
    ctx.lineTo(3, 0)
    ctx.lineTo(-31, 24)
    ctx.lineTo(-6, 24)
    ctx.lineTo(31, 0)
    ctx.lineTo(-6, -23)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    for (let i = 0; i < 440; i++) {
      const x = random() * 512
      const row = random() * 256
      const edge = x < 27 || x > 485 || row < 24 || row > 232
      const chip = edge ? 2 + random() * 8 : 1 + random() * 3
      ctx.fillStyle = i % 3 ? '#724f37' : '#ccc1a0'
      ctx.globalAlpha = edge ? 0.62 : 0.23
      ctx.fillRect(x, y + row, chip * 1.3, Math.min(chip, 256 - row))
    }
    ctx.globalAlpha = 1
    for (const x of [28, 484]) {
      for (const row of [28, 228]) {
        ctx.fillStyle = '#7c725f'
        ctx.beginPath()
        ctx.arc(x, y + row, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  plate(0, '#c2a265', '#302f27', 'WASH RD', 'INSPECTION')
  plate(256, '#778985', '#f1e8c5', 'E-2', 'INLAND', true)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

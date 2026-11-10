import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three'

type Rgb = readonly [number, number, number]

function finish(name: string, width: number, height: number, colorAt: (x: number, y: number) => Rgb) {
  const rgba = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt((x + 0.5) / width, (y + 0.5) / height)
      const grain = (((x * 73) ^ (y * 151) ^ (x * y * 13)) & 7) - 3
      rgba.set([r + grain, g + grain, b + grain, 255], (y * width + x) * 4)
    }
  }
  const texture = new DataTexture(rgba, width, height)
  texture.name = name
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

export function createLandingFinishes() {
  const skirt = finish('lcac-skirt-rubber', 64, 64, (u, v) => {
    const edge = Math.min(u, 1 - u)
    if (v > 0.83 && v < 0.89) return [75, 79, 72]
    if (v < 0.55 && edge < 0.046) return [42, 46, 42]
    const flex = Math.sin(Math.PI * u) * (v < 0.68 ? 9 : 4)
    const scuff = v < 0.11 ? 7 * (1 - v / 0.11) : 0
    return [54 + flex + scuff, 60 + flex + scuff, 54 + flex + scuff]
  })
  skirt.wrapS = RepeatWrapping
  skirt.repeat.x = 40

  const deck = finish('lcac-deck-wear-and-tie-downs', 128, 256, (u, v) => {
    const lane = Math.abs(u - 0.5)
    const station = (v * 9) % 1
    if (lane > 0.47 || station < 0.016) return [65, 71, 65]
    if (lane > 0.44 && station > 0.17 && station < 0.7) return [139, 134, 97]
    if ((lane < 0.018 || Math.abs(lane - 0.36) < 0.015) && Math.abs(station - 0.5) < 0.09) return [53, 59, 54]
    if (lane < 0.013) return [118, 117, 99]
    const wear = Math.abs((lane - 0.1) * (lane - 0.3)) < 0.006 ? 6 : 0
    return [81 + wear, 88 + wear, 77 + wear]
  })

  const ramp = finish('lcac-ramp-traction-finish', 128, 128, (u, v) => {
    const edge = Math.min(u, 1 - u)
    if (edge < 0.021 || v < 0.02 || v > 0.985) return [140, 135, 102]
    if (edge < 0.046 || v < 0.045 || v > 0.95) return [69, 76, 69]
    if ((v * 9) % 1 < 0.2) return [112, 118, 103]
    return [89, 99, 90]
  })
  return { skirt, deck, ramp }
}

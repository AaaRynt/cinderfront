import { BufferGeometry, IcosahedronGeometry, Float32BufferAttribute } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import type { CoverKind } from './regionalLayout'

import { createDeterministicRandom } from '../stage2/environment/seededLayout'

export function createCoverGeometry(kind: CoverKind, variant: number): BufferGeometry {
  const random = createDeterministicRandom(`4c-geometry:${kind}:${variant}`)
  if (kind === 'grass') {
    const vertices: number[] = []
    for (let blade = 0; blade < 12; blade++) {
      const x = (random() - 0.5) * 0.68
      const z = (random() - 0.5) * 0.68
      const angle = random() * Math.PI
      const dx = Math.cos(angle) * 0.055
      const dz = Math.sin(angle) * 0.055
      // Broad lower leaves, tapered tips bent northeast, no cone silhouette.
      const h = 0.45 + random() * 0.55
      vertices.push(x - dx, -0.08, z - dz, x + dx, -0.08, z + dz, x + 0.13, h, z + 0.13)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    return geometry
  }
  const parts: BufferGeometry[] = []
  const lobes = kind === 'scrub' ? 4 : 2
  for (let lobe = 0; lobe < lobes; lobe++) {
    const part = new IcosahedronGeometry(0.5, 0)
    const size = lobe === 0 ? 0.76 : 0.35 + random() * 0.22
    part.scale(size, kind === 'rock' ? size * 0.8 : size, size * (0.7 + random() * 0.3))
    part.rotateY(random() * Math.PI)
    part.translate((random() - 0.5) * 0.33, size * 0.32 - 0.1, (random() - 0.5) * 0.33)
    parts.push(part)
  }
  const geometry = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const extent = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z))
  geometry.scale(0.5 / extent, 1, 0.5 / extent)
  return geometry
}

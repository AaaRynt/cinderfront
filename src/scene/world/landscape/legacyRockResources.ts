import { createContext } from 'react'
import { MeshStandardMaterial } from 'three'

import { createRockGeometry } from './landscapeGeometry'

export function createLegacyRockResources() {
  const geometry = [0, 1].map((v) => createRockGeometry(v).scale(1.4, 0.85, 1.4))
  const material = new MeshStandardMaterial({ color: '#928873', vertexColors: true, roughness: 1, flatShading: true })
  return {
    geometry,
    material,
    dispose() {
      geometry.forEach((g) => g.dispose())
      material.dispose()
    },
  }
}
export const LegacyRockResourcesContext = createContext<ReturnType<typeof createLegacyRockResources> | null>(null)

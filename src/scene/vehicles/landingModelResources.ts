import { BoxGeometry, BufferGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, MeshStandardMaterial, TorusGeometry } from 'three'

import { LCAC_SKIRT_PERIMETER, LAV_DIMENSIONS } from '@/simulation/landingCraftData'

import { createPrismGeometryXZ } from './modelGeometry'

function lavHull() {
  const vertices = [
    [-1.12, 0.68, -3.195],
    [1.12, 0.68, -3.195],
    [1.12, 0.68, 3.195],
    [-1.12, 0.68, 3.195],
    [-1.25, 1.65, -2.05],
    [1.25, 1.65, -2.05],
    [1.25, 1.65, 3.02],
    [-1.25, 1.65, 3.02],
  ]
  const indices = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]
  for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!]
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      indices.flatMap((i) => vertices[i]!),
      3,
    ),
  )
  geometry.computeVertexNormals()
  return geometry
}
function skirtGeometry() {
  const positions: number[] = [],
    indices: number[] = []
  for (const [x, z] of LCAC_SKIRT_PERIMETER) {
    // Low flexible bow lip under the cargo opening clears the deployed panel.
    const top = z < -12 && Math.abs(x) < 4.2 ? 0.55 : 1.35
    positions.push(x, 0, z, x * 0.97, top, z * 0.985)
  }
  for (let i = 0; i < LCAC_SKIRT_PERIMETER.length; i++) {
    const next = (i + 1) % LCAC_SKIRT_PERIMETER.length
    indices.push(i * 2, next * 2, i * 2 + 1, next * 2, next * 2 + 1, i * 2 + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** One owner for the two craft and eight payloads; individual meshes never dispose it. */
export function createLandingModelResources() {
  const geometry = {
    box: new BoxGeometry(),
    cylinder: new CylinderGeometry(1, 1, 1, 12),
    skirt: skirtGeometry(),
    platform: createPrismGeometryXZ(
      LCAC_SKIRT_PERIMETER.map(([x, z]) => [x * 0.965, z * 0.965]),
      0.12,
    ),
    fan: new TorusGeometry(2.075, 0.175, 8, 40),
    wheel: new CylinderGeometry(LAV_DIMENSIONS.wheelRadius, LAV_DIMENSIONS.wheelRadius, LAV_DIMENSIONS.wheelWidth, 20),
    hull: lavHull(),
    turret: new CylinderGeometry(0.77, 0.9, 0.68, 8),
    cannon: new CylinderGeometry(0.027, 0.038, 3.8, 8),
  }
  const material = {
    platform: new MeshStandardMaterial({ color: '#777c70', roughness: 0.84, metalness: 0.25 }),
    deck: new MeshStandardMaterial({ color: '#444c45', roughness: 0.94, metalness: 0.2 }),
    skirt: new MeshStandardMaterial({ color: '#141b19', roughness: 0.99, side: DoubleSide }),
    machinery: new MeshStandardMaterial({ color: '#adb0a0', roughness: 0.7, metalness: 0.3 }),
    metal: new MeshStandardMaterial({ color: '#292f2c', roughness: 0.56, metalness: 0.68 }),
    glass: new MeshStandardMaterial({ color: '#0f2229', roughness: 0.15, metalness: 0.8 }),
    lav: new MeshStandardMaterial({ color: '#7e8060', roughness: 0.88, metalness: 0.16 }),
    lavDark: new MeshStandardMaterial({ color: '#545d48', roughness: 0.85, metalness: 0.16 }),
    tire: new MeshStandardMaterial({ color: '#151b18', roughness: 0.98 }),
    red: new MeshStandardMaterial({ color: '#6f2421', emissive: '#b3261a', emissiveIntensity: 0.35 }),
    green: new MeshStandardMaterial({ color: '#2c604a', emissive: '#26864f', emissiveIntensity: 0.35 }),
  }
  return {
    geometry,
    material,
    dispose() {
      Object.values(geometry).forEach((g) => g.dispose())
      Object.values(material).forEach((m) => m.dispose())
    },
  }
}
export type LandingModelResources = ReturnType<typeof createLandingModelResources>

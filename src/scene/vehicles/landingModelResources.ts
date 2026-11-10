import { BoxGeometry, CylinderGeometry, DoubleSide, MeshStandardMaterial } from 'three'

import { LCAC_SKIRT_PERIMETER } from '@/simulation/landingCraftData'

import { createLavArches, createLavFittings, createLavHull, createLavTurret, createLavWheel, createLavWheelFace, createLcacCabin, createLcacFan, createLcacMachinery, createLcacSkirt } from './landingModelGeometry'
import { createLandingFinishes } from './landingSurfaceFinish'
import { createPrismGeometryXZ } from './modelGeometry'

/** One owner for the two craft and eight payloads; individual meshes never dispose it. */
export function createLandingModelResources() {
  const textures = createLandingFinishes()
  const geometry = {
    box: new BoxGeometry(),
    cylinder: new CylinderGeometry(1, 1, 1, 12),
    skirt: createLcacSkirt(),
    platform: createPrismGeometryXZ(
      LCAC_SKIRT_PERIMETER.map(([x, z]) => [x * 0.965, z * 0.965]),
      0.12,
    ),
    fan: createLcacFan(),
    machinery: createLcacMachinery(),
    cabin: createLcacCabin(),
    wheel: createLavWheel(),
    wheelFace: createLavWheelFace(),
    hull: createLavHull(),
    turret: createLavTurret(),
    lavArches: createLavArches(),
    lavFittings: createLavFittings(),
    cannon: new CylinderGeometry(0.027, 0.038, 3.8, 8),
  }
  const material = {
    platform: new MeshStandardMaterial({ color: '#777c70', roughness: 0.84, metalness: 0.25 }),
    deck: new MeshStandardMaterial({ map: textures.deck, roughness: 0.93, metalness: 0.16 }),
    ramp: new MeshStandardMaterial({ map: textures.ramp, roughness: 0.84, metalness: 0.27 }),
    traction: new MeshStandardMaterial({ color: '#485349', roughness: 0.91, metalness: 0.27 }),
    skirt: new MeshStandardMaterial({ map: textures.skirt, roughness: 0.99, side: DoubleSide }),
    machinery: new MeshStandardMaterial({ vertexColors: true, roughness: 0.76, metalness: 0.22 }),
    duct: new MeshStandardMaterial({ vertexColors: true, roughness: 0.67, metalness: 0.32 }),
    blade: new MeshStandardMaterial({ color: '#576259', roughness: 0.74, metalness: 0.41 }),
    metal: new MeshStandardMaterial({ color: '#292f2c', roughness: 0.56, metalness: 0.68 }),
    glass: new MeshStandardMaterial({ color: '#0f2229', roughness: 0.23, metalness: 0.55 }),
    lav: new MeshStandardMaterial({ vertexColors: true, roughness: 0.83, metalness: 0.14 }),
    lavDark: new MeshStandardMaterial({ color: '#556347', roughness: 0.85, metalness: 0.16 }),
    tire: new MeshStandardMaterial({ vertexColors: true, roughness: 0.98 }),
    hub: new MeshStandardMaterial({ vertexColors: true, roughness: 0.61, metalness: 0.3 }),
    red: new MeshStandardMaterial({ color: '#6f2421', emissive: '#b3261a', emissiveIntensity: 0.35 }),
    green: new MeshStandardMaterial({ color: '#2c604a', emissive: '#26864f', emissiveIntensity: 0.35 }),
  }
  return {
    geometry,
    material,
    textures,
    dispose() {
      Object.values(geometry).forEach((g) => g.dispose())
      Object.values(material).forEach((m) => m.dispose())
      Object.values(textures).forEach((t) => t.dispose())
    },
  }
}
export type LandingModelResources = ReturnType<typeof createLandingModelResources>

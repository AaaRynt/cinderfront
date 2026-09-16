import * as THREE from 'three'

import { SU30_ENGINE_OFFSETS } from '../../simulation/su30ModelData.ts'
import { createPrismGeometryXZ, createSectionedBodyGeometry } from './modelGeometry.ts'

const BOX = new THREE.BoxGeometry(1, 1, 1)
const NOZZLE = new THREE.CylinderGeometry(0.7, 0.85, 1, 16, 1, true)
const EXHAUST_DISC = new THREE.CircleGeometry(0.675, 16)

export const SU30_MATERIALS = {
  upper: new THREE.MeshStandardMaterial({ color: '#65727b', roughness: 0.67, metalness: 0.32, flatShading: true }),
  lower: new THREE.MeshStandardMaterial({ color: '#899294', roughness: 0.72, metalness: 0.24, flatShading: true }),
  nose: new THREE.MeshStandardMaterial({ color: '#35424d', roughness: 0.76, metalness: 0.19 }),
  canopy: new THREE.MeshStandardMaterial({ color: '#101c28', roughness: 0.09, metalness: 0.86 }),
  intake: new THREE.MeshStandardMaterial({ color: '#090f13', roughness: 0.86, metalness: 0.2 }),
  engine: new THREE.MeshStandardMaterial({ color: '#414b4e', roughness: 0.56, metalness: 0.72 }),
  scorched: new THREE.MeshStandardMaterial({ color: '#252a29', roughness: 0.92, metalness: 0.26 }),
} as const

const NOSE = createSectionedBodyGeometry(
  [
    { z: -10.97, halfWidth: 0.01, halfHeight: 0.01, centerY: -0.87 },
    { z: -10.0, halfWidth: 0.3, halfHeight: 0.23, centerY: -0.81 },
    { z: -8.1, halfWidth: 0.77, halfHeight: 0.53, centerY: -0.73 },
  ],
  12,
)

const CENTERBODY = createSectionedBodyGeometry(
  [
    { z: -8.1, halfWidth: 0.77, halfHeight: 0.53, centerY: -0.73 },
    { z: -5.8, halfWidth: 0.99, halfHeight: 0.66, centerY: -0.66 },
    { z: -3.0, halfWidth: 1.38, halfHeight: 0.79, centerY: -0.69 },
    { z: -0.8, halfWidth: 2.1, halfHeight: 0.68, centerY: -0.76 },
    { z: 2.8, halfWidth: 2.6, halfHeight: 0.56, centerY: -0.86 },
    { z: 4.7, halfWidth: 0.81, halfHeight: 0.4, centerY: -0.96 },
    { z: 6.0, halfWidth: 0.43, halfHeight: 0.3, centerY: -1.05 },
  ],
  12,
)

const CANOPY = createSectionedBodyGeometry(
  [
    { z: -7.9, halfWidth: 0.05, halfHeight: 0.04, centerY: -0.19 },
    { z: -6.9, halfWidth: 0.62, halfHeight: 0.4, centerY: 0.12 },
    { z: -5.35, halfWidth: 0.74, halfHeight: 0.51, centerY: 0.17 },
    { z: -3.9, halfWidth: 0.69, halfHeight: 0.4, centerY: 0.17 },
    { z: -3.1, halfWidth: 0.22, halfHeight: 0.06, centerY: 0.05 },
  ],
  12,
)

const CANOPY_FRAME = createSectionedBodyGeometry(
  [
    { z: -5.48, halfWidth: 0.745, halfHeight: 0.515, centerY: 0.17 },
    { z: -5.4, halfWidth: 0.745, halfHeight: 0.515, centerY: 0.17 },
  ],
  12,
)

const WING = createPrismGeometryXZ(
  [
    [1.35, -2.1],
    [7.35, 2.86],
    [7.35, 4.65],
    [2.03, 4.73],
  ],
  0.18,
  -0.72,
)

const WING_ROOT = createPrismGeometryXZ(
  [
    [0.79, -5.8],
    [1.48, -3.72],
    [2.3, -1.55],
    [2.23, 1.7],
    [1.08, 1.24],
  ],
  0.15,
  -0.68,
)

const STABILIZER = createPrismGeometryXZ(
  [
    [1.36, 5.24],
    [5.05, 7.06],
    [4.81, 9.08],
    [1.4, 8.64],
  ],
  0.15,
  -0.84,
)

// Rotate this shared X/Z profile onto Y/Z. It is vertical, not stealth-fighter canted.
const FIN = createPrismGeometryXZ(
  [
    [0, 3.39],
    [3.93, 6.05],
    [3.93, 6.92],
    [0, 8.37],
  ],
  0.16,
)

const NACELLE = createSectionedBodyGeometry(
  [
    { z: -0.48, halfWidth: 0.95, halfHeight: 0.98 },
    { z: 1.4, halfWidth: 0.98, halfHeight: 1.05 },
    { z: 4.0, halfWidth: 0.94, halfHeight: 1.02 },
    { z: 5.8, halfWidth: 0.88, halfHeight: 0.98 },
  ],
  12,
)

const AFT_NACELLE = createSectionedBodyGeometry(
  [
    { z: 5.8, halfWidth: 0.88, halfHeight: 0.98 },
    { z: 7.2, halfWidth: 0.86, halfHeight: 0.89 },
    { z: 7.6, halfWidth: 0.85, halfHeight: 0.85 },
  ],
  12,
)

const TAIL_BOOM = createSectionedBodyGeometry(
  [
    { z: 4.7, halfWidth: 0.47, halfHeight: 0.34, centerY: -0.98 },
    { z: 7.5, halfWidth: 0.39, halfHeight: 0.29, centerY: -1.13 },
    { z: 9.95, halfWidth: 0.27, halfHeight: 0.21, centerY: -1.16 },
    { z: 10.97, halfWidth: 0.015, halfHeight: 0.025, centerY: -1.16 },
  ],
  12,
)

interface Su30ModelPart {
  readonly name: string
  readonly geometry: THREE.BufferGeometry
  readonly material: THREE.Material
  readonly position?: [number, number, number]
  readonly rotation?: [number, number, number]
  readonly scale?: [number, number, number]
  readonly damagedSurface?: boolean
}

/** The render list is also used by bounds/resource tests: tests measure the actual model. */
export const SU30_MODEL_PARTS: readonly Su30ModelPart[] = [
  { name: 'nose', geometry: NOSE, material: SU30_MATERIALS.nose },
  { name: 'centerbody', geometry: CENTERBODY, material: SU30_MATERIALS.upper },
  // One entirely opaque glazed solid, with no seats, interior, or occupant shapes.
  { name: 'canopy', geometry: CANOPY, material: SU30_MATERIALS.canopy },
  { name: 'canopy-frame', geometry: CANOPY_FRAME, material: SU30_MATERIALS.upper },
  { name: 'tail-boom', geometry: TAIL_BOOM, material: SU30_MATERIALS.upper },
  ...([-1, 1] as const).flatMap((side): Su30ModelPart[] => {
    const engine = side === -1 ? SU30_ENGINE_OFFSETS.left : SU30_ENGINE_OFFSETS.right
    const prefix = side === -1 ? 'left' : 'right'
    return [
      { name: `${prefix}-wing-root`, geometry: WING_ROOT, material: SU30_MATERIALS.upper, scale: [side, 1, 1] },
      { name: `${prefix}-wing`, geometry: WING, material: SU30_MATERIALS.upper, scale: [side, 1, 1] },
      { name: `${prefix}-stabilizer`, geometry: STABILIZER, material: SU30_MATERIALS.upper, scale: [side, 1, 1] },
      { name: `${prefix}-fin`, geometry: FIN, material: SU30_MATERIALS.upper, position: [engine.x, -0.75, 0], rotation: [0, 0, Math.PI / 2] },
      { name: `${prefix}-intake`, geometry: BOX, material: SU30_MATERIALS.lower, position: [engine.x, -2.105, -0.35], scale: [1.88, 2.15, 3.5] },
      { name: `${prefix}-intake-opening`, geometry: BOX, material: SU30_MATERIALS.intake, position: [engine.x, -2.08, -2.109], scale: [1.61, 1.76, 0.025] },
      { name: `${prefix}-intake-splitter`, geometry: BOX, material: SU30_MATERIALS.upper, position: [engine.x, -1.27, -2.16], scale: [1.84, 0.08, 0.4] },
      { name: `${prefix}-nacelle`, geometry: NACELLE, material: SU30_MATERIALS.lower, position: [engine.x, engine.y, 0] },
      { name: `${prefix}-aft-nacelle`, geometry: AFT_NACELLE, material: SU30_MATERIALS.engine, position: [engine.x, engine.y, 0], damagedSurface: side === 1 },
      { name: `${prefix}-nozzle`, geometry: NOZZLE, material: SU30_MATERIALS.engine, position: [engine.x, engine.y, engine.z - 0.5], rotation: [Math.PI / 2, 0, 0], damagedSurface: side === 1 },
      { name: `${prefix}-exhaust`, geometry: EXHAUST_DISC, material: SU30_MATERIALS.intake, position: [engine.x, engine.y, engine.z - 0.035] },
    ]
  }),
]

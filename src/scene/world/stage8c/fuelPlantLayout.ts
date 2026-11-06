import { Matrix4, Quaternion, Vector3, type BufferGeometry } from 'three'

import type { WindKind } from '../stage8b/wind'

import { fitLandscapeBase } from '../landscape/groundFit'
import { INDUSTRIAL_FEATURES } from '../stage2/stage2Data'
import { TERRAIN_SURFACE_SPECS } from '../stage2/terrainPresentationSpecs'

interface FuelPlant {
  readonly id: string
  readonly kind: WindKind
  readonly x: number
  readonly z: number
  readonly scale: number
  readonly yaw: number
}

// Two loose gravel verges between the central and south containment berms.
// This local group is independent of the reserved ordinary landscape layout.
export const FUEL_PLANTS = [
  { id: 'near-upright', kind: 'upright', x: -495.5, z: 1805.7, scale: 9.2, yaw: 0.35 },
  { id: 'near-wind', kind: 'wind', x: -473, z: 1804.9, scale: 8.5, yaw: -0.75 },
  { id: 'near-grass-west', kind: 'grass', x: -501.5, z: 1805.6, scale: 1.45, yaw: 0.3 },
  { id: 'near-grass-east', kind: 'grass', x: -478.5, z: 1803.8, scale: 1.25, yaw: 1.5 },
  { id: 'near-grass-low', kind: 'grass', x: -489.7, z: 1803.2, scale: 1.25, yaw: -0.6 },
  { id: 'near-scrub-west', kind: 'scrub', x: -499.5, z: 1807.3, scale: 1.85, yaw: 0.7 },
  { id: 'near-scrub-east', kind: 'scrub', x: -465.3, z: 1805, scale: 1.55, yaw: -0.9 },
  { id: 'far-upright', kind: 'upright', x: -217, z: 1806.6, scale: 9, yaw: 0.85 },
  { id: 'far-wind', kind: 'wind', x: -196, z: 1806.4, scale: 8.8, yaw: -0.5 },
  { id: 'far-grass-west', kind: 'grass', x: -197.6, z: 1804.1, scale: 1.45, yaw: 1.3 },
  { id: 'far-grass-east', kind: 'grass', x: -187.9, z: 1804.5, scale: 1.35, yaw: 1.8 },
  { id: 'far-grass-low', kind: 'grass', x: -193.8, z: 1802.6, scale: 1.3, yaw: -0.2 },
  { id: 'far-scrub-west', kind: 'scrub', x: -192, z: 1809.4, scale: 1.7, yaw: 0.7 },
  { id: 'far-scrub-east', kind: 'scrub', x: -189.5, z: 1805, scale: 1.75, yaw: -1.2 },
] as const satisfies readonly FuelPlant[]

const GRAVEL_OFFSET_M = TERRAIN_SURFACE_SPECS.find(({ points }) => points === INDUSTRIAL_FEATURES.fuelCompound)!.offset
const UP = new Vector3(0, 1, 0)
const PEAK_HEIGHT_FRACTION = { grass: 0.79, scrub: 0.63, upright: 0.49, wind: 0.49 }

export function fullStrengthTipM({ kind, scale }: FuelPlant) {
  return PEAK_HEIGHT_FRACTION[kind] * scale
}

export function fitFuelPlant(geometry: BufferGeometry, { kind, x, z, scale, yaw }: FuelPlant) {
  const width = kind === 'upright' || kind === 'wind' ? 0.84 * scale : scale
  const base = new Matrix4().compose(new Vector3(x, 0, z), new Quaternion().setFromAxisAngle(UP, yaw), new Vector3(width, scale, width))
  const { matrix } = fitLandscapeBase(geometry, base, 0.1)
  matrix.elements[13]! += GRAVEL_OFFSET_M
  return matrix
}

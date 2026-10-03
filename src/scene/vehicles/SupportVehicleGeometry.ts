import * as THREE from 'three'

import type { SupportSubtype } from '@/simulation/supportConvoyTypes'

import { SUPPORT_DIMENSIONS, SUPPORT_WHEEL_RADIUS_METERS } from '@/simulation/supportConvoy'

export const BOX = new THREE.BoxGeometry(1, 1, 1)
export const TIRE = new THREE.CylinderGeometry(SUPPORT_WHEEL_RADIUS_METERS, SUPPORT_WHEEL_RADIUS_METERS, 0.3, 16)
export const HUB = new THREE.CylinderGeometry(0.24, 0.24, 0.315, 12)
const REEL = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 12)
export const SUPPORT_MATERIALS = {
  fire: new THREE.MeshStandardMaterial({ color: '#913c31', roughness: 0.78, metalness: 0.18 }),
  engineering: new THREE.MeshStandardMaterial({ color: '#8b805b', roughness: 0.84, metalness: 0.16 }),
  recovery: new THREE.MeshStandardMaterial({ color: '#64704f', roughness: 0.85, metalness: 0.2 }),
  logistics: new THREE.MeshStandardMaterial({ color: '#6c765b', roughness: 0.85, metalness: 0.14 }),
  tarp: new THREE.MeshStandardMaterial({ color: '#84785b', roughness: 0.98, metalness: 0.01 }),
  tarpAlternate: new THREE.MeshStandardMaterial({ color: '#555e50', roughness: 0.97, metalness: 0.01 }),
  chassis: new THREE.MeshStandardMaterial({ color: '#292e2b', roughness: 0.81, metalness: 0.36 }),
  equipment: new THREE.MeshStandardMaterial({ color: '#888d83', roughness: 0.74, metalness: 0.52 }),
  tire: new THREE.MeshStandardMaterial({ color: '#161a18', roughness: 0.98 }),
  // Solid reflective glazing: sealed cab, no interior or occupants.
  glass: new THREE.MeshStandardMaterial({ color: '#101e26', roughness: 0.12, metalness: 0.88 }),
} as const

interface Part {
  name: string
  position: [number, number, number]
  scale: [number, number, number]
  material: THREE.Material
  geometry?: THREE.BufferGeometry
  rotation?: [number, number, number]
}

/** Bottom-relative dimensions converted once to the shared centered model origin. */
export function supportModelParts(subtype: SupportSubtype, alternateLoad = false): readonly Part[] {
  const { length, width, height } = SUPPORT_DIMENSIONS[subtype]
  const body = subtype === 'fire_engine' ? SUPPORT_MATERIALS.fire : subtype === 'engineering_truck' ? SUPPORT_MATERIALS.engineering : subtype === 'recovery_vehicle' ? SUPPORT_MATERIALS.recovery : SUPPORT_MATERIALS.logistics
  const front = -length / 2
  const parts: Part[] = [
    { name: 'chassis', position: [0, 0.78, 0], scale: [width - 0.45, 0.32, length - 0.25], material: SUPPORT_MATERIALS.chassis },
    { name: 'sealed-cab', position: [0, 1.9, front + 1.28], scale: [width - 0.2, 1.95, 2.45], material: body },
    { name: 'opaque-windshield', position: [0, 2.21, front + 0.043], scale: [width - 0.47, 0.72, 0.024], material: SUPPORT_MATERIALS.glass },
    { name: 'grille', position: [0, 1.44, front + 0.04], scale: [1.35, 0.35, 0.03], material: SUPPORT_MATERIALS.chassis },
    { name: 'front-bumper', position: [0, 0.9, front + 0.12], scale: [width - 0.08, 0.24, 0.24], material: SUPPORT_MATERIALS.equipment },
    { name: 'rear-bumper', position: [0, 0.85, length / 2 - 0.12], scale: [width - 0.08, 0.22, 0.24], material: SUPPORT_MATERIALS.chassis },
    ...([-1, 1] as const).map((side): Part => ({ name: `opaque-side-window-${side}`, position: [side * (width / 2 - 0.091), 2.24, front + 1], scale: [0.025, 0.68, 1.38], material: SUPPORT_MATERIALS.glass })),
  ]
  if (subtype === 'fire_engine') {
    parts.push({ name: 'equipment-body', position: [0, 1.96, 1.25], scale: [width - 0.15, 1.83, length - 2.65], material: body })
    for (const side of [-1, 1]) for (const z of [-0.7, 0.7, 2.1, 3.2]) parts.push({ name: `closed-compartment-${side}-${z}`, position: [side * (width / 2 - 0.068), 1.87, z], scale: [0.025, 1.22, 1.08], material: SUPPORT_MATERIALS.equipment })
    parts.push({ name: 'stowed-hose-reel', position: [0, 3.02, 1.1], scale: [1, 1, 1], geometry: REEL, rotation: [0, 0, Math.PI / 2], material: SUPPORT_MATERIALS.chassis }, { name: 'stowed-roof-monitor', position: [0, 3.05, 2.65], scale: [0.25, 0.17, 0.75], material: SUPPORT_MATERIALS.equipment })
  } else if (subtype === 'engineering_truck') {
    parts.push(
      { name: 'closed-tool-body', position: [0, 1.54, 1.25], scale: [width - 0.15, 1.12, length - 2.65], material: body },
      { name: 'stowed-crane-pedestal', position: [0, 2.34, -0.48], scale: [0.65, 0.9, 0.7], material: SUPPORT_MATERIALS.chassis },
      { name: 'folded-engineering-boom', position: [0, 2.77, 1.15], scale: [0.43, 0.32, 3.7], material: body },
      { name: 'tool-rack', position: [-0.72, 2.15, 2.3], scale: [0.45, 0.13, 2], material: SUPPORT_MATERIALS.equipment },
    )
  } else if (subtype === 'recovery_vehicle') {
    parts.push(
      { name: 'recovery-bed', position: [0, 1.17, 1.3], scale: [width - 0.15, 0.43, length - 2.7], material: body },
      { name: 'winch-housing', position: [0, 1.68, -0.1], scale: [1.45, 0.67, 1.05], material: SUPPORT_MATERIALS.chassis },
      { name: 'folded-tow-boom', position: [0, 2.28, 1.55], scale: [0.5, 0.42, 4.2], material: body },
      { name: 'rear-tow-frame', position: [0, 1.25, length / 2 - 0.48], scale: [1.8, 0.32, 0.66], material: SUPPORT_MATERIALS.equipment },
    )
    for (const side of [-1, 1]) parts.push({ name: `recovery-frame-${side}`, position: [side * 0.65, 1.95, 0.6], scale: [0.2, 1.35, 0.3], material: body })
  } else {
    parts.push({ name: 'cargo-bed', position: [0, 1.15, 1.25], scale: [width - 0.1, 0.35, length - 2.65], material: body }, { name: 'sealed-tarp-load', position: [0, 2.13, 1.25], scale: [width - 0.22, 1.65, length - 2.75], material: alternateLoad ? SUPPORT_MATERIALS.tarpAlternate : SUPPORT_MATERIALS.tarp })
    for (const z of [-0.85, 0.45, 1.75, 3.05]) parts.push({ name: `cargo-strap-${z}`, position: [0, 2.97, z], scale: [width - 0.18, 0.025, 0.045], material: SUPPORT_MATERIALS.chassis })
  }
  return parts.map((part) => ({ ...part, position: [part.position[0], part.position[1] - height / 2, part.position[2]] }))
}

export const MODEL_PARTS = Object.fromEntries(Object.keys(SUPPORT_DIMENSIONS).map((subtype) => [subtype, supportModelParts(subtype as SupportSubtype)])) as Record<SupportSubtype, readonly Part[]>
export const ALTERNATE_CARGO_PARTS = supportModelParts('logistics_truck', true)
export const SUPPORT_AXLE_Z = [-2.6, 1.25, 2.6] as const

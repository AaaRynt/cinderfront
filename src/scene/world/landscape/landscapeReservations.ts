import type { XZPoint } from '../worldData'

import { finishConstruction, runConstruction, type Construction, type ConstructionOptions } from '../../../initialization/cooperative'
import { deriveBtr80GroupState, deriveT72GroupState, BTR80_DIMENSIONS_METERS, T72_DIMENSIONS_METERS } from '../../../simulation/groundVehicles'
import { deriveLandingWorldState } from '../../../simulation/landingCraft'
import { deriveSecondaryPantsirState } from '../../../simulation/secondaryPantsir'
import { deriveSupportConvoyState, SUPPORT_DIMENSIONS } from '../../../simulation/supportConvoy'
import { LANDING_RESERVATIONS, createLandingRegionalLayout, createLandingServiceLayout } from '../landing/landingReservations'
import { createEnvironmentResponseGroup } from '../stage2/environment/responseGroups'
import { ROAD_DEFINITIONS } from '../stage2/stage2Data'
import { getTerrainHeight } from '../stage2/terrainModel'
import { intersectsReservation, isDecorationAllowed, reservePath, type Reservation } from '../stage4c/spatialReservations'
import { createLegacyRockLayout } from './legacyRocks'
import { createLegacyVegetationLayouts } from './legacyVegetation'

export const LANDSCAPE_SWEEP_STEP = 0.25
// Orientation-independent, full horizontal radii, including guns, wheels,
// suspension/cant and cargo + the complete deployed panel, plus >= 1 m margin.
export const LANDSCAPE_ACTOR_RADII = { lcac: 23, lav: 6.2, pantsir: 9 } as const
let completedSweeps: readonly Reservation[] | undefined
function* landscapeMovementWork(): Construction<readonly Reservation[]> {
  const tracks = new Map<string, { points: XZPoint[]; radius: number }>()
  function append(id: string, x: number, z: number, radius: number) {
    let track = tracks.get(id)
    if (!track) {
      track = { points: [], radius }
      tracks.set(id, track)
    }
    const previous = track.points.at(-1)
    if (!previous || Math.hypot(x - previous[0], z - previous[1]) > 0.005) track.points.push([x, z])
  }
  // Focused actor derivations once at static layout creation. Never derive the
  // complete world from scenery/rendering; the dependency remains one-way.
  for (let tick = 0; tick <= 180 / LANDSCAPE_SWEEP_STEP; tick++) {
    yield
    const t = tick * LANDSCAPE_SWEEP_STEP
    for (const v of Object.values(deriveBtr80GroupState(t, () => 0).vehicles)) {
      const p = v.pose.position
      append(v.id, p.x, p.z, Math.hypot(BTR80_DIMENSIONS_METERS.length, BTR80_DIMENSIONS_METERS.width) / 2 + 2)
    }
    for (const v of Object.values(deriveT72GroupState(t, () => 0).vehicles)) {
      const p = v.pose.position
      append(v.id, p.x, p.z, Math.hypot(T72_DIMENSIONS_METERS.gunForwardLength - T72_DIMENSIONS_METERS.hullLength / 2, T72_DIMENSIONS_METERS.width / 2) + 2)
    }
    for (const v of Object.values(deriveSupportConvoyState(t).convoy.vehicles)) {
      const p = v.pose.position,
        d = SUPPORT_DIMENSIONS[v.subtype]
      append(v.id, p.x, p.z, Math.hypot(d.length, d.width) / 2 + 2)
    }
    const p = deriveSecondaryPantsirState(t)
    append(p.id, p.pose.position.x, p.pose.position.z, LANDSCAPE_ACTOR_RADII.pantsir)
    const landing = deriveLandingWorldState(t)
    for (const c of Object.values(landing.crafts)) append(c.id, c.pose.position.x, c.pose.position.z, LANDSCAPE_ACTOR_RADII.lcac)
    for (const v of Object.values(landing.payload)) append(v.id, v.pose.position.x, v.pose.position.z, LANDSCAPE_ACTOR_RADII.lav)
  }
  return [
    ...Array.from(tracks, ([id, t]) => reservePath(id, t.points, t.radius)),
    ...ROAD_DEFINITIONS.filter((r) => ['road_beach_exit', 'road_beach_access_east'].includes(r.id)).map((r) => reservePath(`6b-full-${r.id}`, r.points, r.widthM / 2 + 7)),
    { id: 'secondary-pantsir-damage', kind: 'circle', center: [5432, -1749.8], radius: 55 },
  ]
}
export function getLandscapeMovementReservations(): readonly Reservation[] {
  return (completedSweeps ??= finishConstruction(landscapeMovementWork()))
}
export async function prepareLandscapeMovementReservations(options: ConstructionOptions) {
  if (completedSweeps) return
  options.onProgress?.({ message: 'Preparing surroundings' })
  const result = await runConstruction(landscapeMovementWork(), options)
  if (options.signal.aborted) throw options.signal.reason
  completedSweeps ??= result
}
export const LEGACY_ROCK_SPECS = [
  ...[
    [2860, 4100, 41],
    [2700, 3450, 53],
    [4770, 3860, 67],
    [4380, 2870, 79],
    [5070, 3310, 91],
  ].map(([x, z, seed], i) => ({ count: 7, id: `radar-rocks-${i + 1}`, position: [x!, getTerrainHeight(x!, z!), z!] as const, radiusM: 24, seed: seed!, responseGroup: createEnvironmentResponseGroup('radar-hill-rocks', 'region_c_radar_hill', 'rock') })),
  ...[
    [3100, -2480, 111],
    [3800, -2500, 125],
    [4470, -2350, 139],
    [5350, -2360, 151],
    [6100, -2500, 167],
    [6450, -2730, 181],
  ].map(([x, z, seed], i) => ({ count: 6, id: `beach-rocks-${i + 1}`, position: [x!, getTerrainHeight(x!, z!), z!] as const, radiusM: 32, seed: seed!, responseGroup: createEnvironmentResponseGroup('beachhead-rocks', 'region_e_remote_beachhead', 'rock') })),
]
export function createExistingLandscapeEnvelopes(): readonly Reservation[] {
  return [
    ...createLegacyVegetationLayouts()
      .flatMap((l) => [...l.grass, ...l.scrub])
      .map((i) => ({ id: i.responseId, kind: 'circle' as const, center: [i.position[0], i.position[2]] as XZPoint, radius: Math.hypot(i.scale[0], i.scale[2]) * 0.5 })),
    ...createLandingRegionalLayout().map((i) => ({ id: i.id, kind: 'circle' as const, center: [i.position[0], i.position[2]] as XZPoint, radius: i.footprintRadius })),
    ...Object.entries(createLandingServiceLayout()).flatMap(([family, ms]) =>
      ms.map((m, i) => ({ id: `equipment:${family}:${i}`, kind: 'circle' as const, center: [m.elements[12]!, m.elements[14]!] as XZPoint, radius: Math.hypot(...[0, 8].map((k) => Math.hypot(m.elements[k]!, m.elements[k + 1]!, m.elements[k + 2]!))) })),
    ),
    ...LEGACY_ROCK_SPECS.flatMap((spec) =>
      createLegacyRockLayout(spec).matrices.map((m, i) => ({ id: `${spec.id}:${i}`, kind: 'circle' as const, center: [spec.position[0] + m.elements[12]!, spec.position[2] + m.elements[14]!] as XZPoint, radius: Math.max(...[0, 4, 8].map((k) => Math.hypot(m.elements[k]!, m.elements[k + 1]!, m.elements[k + 2]!))) })),
    ),
  ]
}
const PRINCIPAL_VIEW_RESERVATIONS = [
  reservePath(
    'radar-view',
    [
      [2280, 2300],
      [3830, 3850],
    ],
    20,
  ),
  reservePath(
    'corridor-view',
    [
      [1850, 520],
      [1050, 1430],
    ],
    20,
  ),
  reservePath(
    'inland-beach-view',
    [
      [4050, -1950],
      [4930, -2980],
    ],
    20,
  ),
  reservePath(
    'offshore-beach-view',
    [
      [4820, -4050],
      [4900, -2740],
    ],
    20,
  ),
]
export function isNewLandscapeAllowed(x: number, z: number, radius: number) {
  return isDecorationAllowed(x, z, radius) && ![...LANDING_RESERVATIONS, ...getLandscapeMovementReservations(), ...PRINCIPAL_VIEW_RESERVATIONS].some((r) => intersectsReservation(x, z, radius, r))
}

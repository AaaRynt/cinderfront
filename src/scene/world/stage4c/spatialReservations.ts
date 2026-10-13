import { T72_SERVICE_YARD_CONNECTOR_POINTS } from '../../../simulation/groundVehicleRoutes'
import { BTR80_DIMENSIONS_METERS, BTR80_VEHICLE_IDS, deriveBtr80GroupState, deriveT72GroupState, T72_DIMENSIONS_METERS, T72_VEHICLE_IDS } from '../../../simulation/groundVehicles'
import { deriveSupportConvoyState, SUPPORT_DIMENSIONS, SUPPORT_VEHICLE_IDS } from '../../../simulation/supportConvoy'
import { AMMUNITION_BUNKERS, AMMUNITION_GATE_SPURS, BEACH_FEATURES, CORRIDOR_FEATURES, FUEL_BUND_CELLS, FUEL_PIPE_DEFINITIONS, HARBOR_FEATURES, INDUSTRIAL_FEATURES, PIPELINE_HARBOR_FUEL_TRUNK, RAIL_DEFINITIONS, ROAD_DEFINITIONS, SECURITY_FENCES } from '../stage2/stage2Data'
import { distanceToPolyline, pointInPolygon } from '../stage2/terrainModel'
import { AAA_SITE, COMMUNICATIONS_MAST_SITE, MAINLAND_POLYGON_XZ, RADAR_SEARCH_SITE, RADAR_SUPPORT_POLYGONS, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS, type XZPoint } from '../worldData'

// Historical Stage 4C seed masks: retain the former raw LCAC routes so seeded
// layouts never reroll. Stage 5B applies its approved smoothed reservations
// afterward in landing/landingReservations.ts; these arrays do not drive actors.
export const FUTURE_LANDING_DIMENSIONS = { lcac: { length: 26.4, width: 14.3 }, lav: { length: 6.39, width: 2.5 } } as const
export const FUTURE_LCAC_APPROACHES: readonly (readonly XZPoint[])[] = [
  [
    [-4200, -3400],
    [-2000, -3600],
    [500, -3800],
    [2500, -3500],
    [3600, -3200],
    [4300, -2920],
  ],
  [
    [-3900, -2500],
    [-1500, -3000],
    [1000, -3500],
    [3200, -3600],
    [5000, -3300],
    [5450, -2860],
  ],
]
export const FUTURE_LAV_CONNECTORS: readonly (readonly XZPoint[])[] = [
  [
    [4675, -2940],
    [4475, -2930],
    [4300, -2920],
  ],
  [
    [5280, -2910],
    [5360, -2890],
    [5450, -2860],
  ],
]

type Bounds = readonly [minX: number, maxX: number, minZ: number, maxZ: number]
export type Reservation =
  | { readonly id: string; readonly kind: 'circle'; readonly center: XZPoint; readonly radius: number }
  | { readonly id: string; readonly kind: 'polygon'; readonly points: readonly XZPoint[]; readonly margin: number; readonly bounds: Bounds }
  | { readonly id: string; readonly kind: 'path'; readonly radius: number; readonly segments: readonly { readonly points: readonly XZPoint[]; readonly bounds: Bounds }[]; readonly bounds: Bounds }

function bounds(points: readonly XZPoint[]): Bounds {
  return [Math.min(...points.map((p) => p[0])), Math.max(...points.map((p) => p[0])), Math.min(...points.map((p) => p[1])), Math.max(...points.map((p) => p[1]))]
}
function nearBounds(x: number, z: number, box: Bounds, radius: number) {
  return x >= box[0] - radius && x <= box[1] + radius && z >= box[2] - radius && z <= box[3] + radius
}
export function reservePolygon(id: string, points: readonly XZPoint[], margin = 4): Reservation {
  return { id, kind: 'polygon', points, margin, bounds: bounds(points) }
}
export function reservePath(id: string, points: readonly XZPoint[], radius: number): Reservation {
  const pairs = points.length === 1 ? [[points[0]!, points[0]!]] : points.slice(1).map((end, i) => [points[i]!, end])
  return { id, kind: 'path', radius, bounds: bounds(points), segments: pairs.map((pair) => ({ points: pair, bounds: bounds(pair) })) }
}
export function intersectsReservation(x: number, z: number, footprintRadius: number, reservation: Reservation) {
  if (reservation.kind === 'circle') return Math.hypot(x - reservation.center[0], z - reservation.center[1]) <= reservation.radius + footprintRadius
  const margin = footprintRadius + (reservation.kind === 'polygon' ? reservation.margin : reservation.radius)
  if (!nearBounds(x, z, reservation.bounds, margin)) return false
  if (reservation.kind === 'polygon') return pointInPolygon(x, z, reservation.points) || distanceToPolyline(x, z, [...reservation.points, reservation.points[0]!]) <= margin
  return reservation.segments.some((segment) => nearBounds(x, z, segment.bounds, margin) && distanceToPolyline(x, z, segment.points) <= margin)
}
const circle = (id: string, center: XZPoint, radius: number): Reservation => ({ id, kind: 'circle', center, radius })

// No new intact vegetation/props in authored response, scorch or wreck areas.
// The existing Stage 3/4A response descriptors and damage geometry retain ownership.
export const DAMAGE_RESERVATIONS: readonly Reservation[] = [
  circle('fuel-response-and-cascade', [-545, 2050], 340),
  reservePolygon('fuel-disaster', INDUSTRIAL_FEATURES.fuelCompound, 45),
  reservePolygon('ammunition-disaster', INDUSTRIAL_FEATURES.ammunitionCompound, 100),
  circle('bridge-obstruction', [3100, -300], 180),
  circle('warehouse-hit', [-3652.5, 4327.5], 170),
  circle('t72-wreck', [6075, 250], 28),
]

const FIXED_RESERVATIONS: readonly Reservation[] = [
  ...HARBOR_FEATURES.warehouses.map((p) => reservePolygon(p.id, p.points, 12)),
  ...[...HARBOR_FEATURES.piers, ...HARBOR_FEATURES.jetties, ...HARBOR_FEATURES.breakwaters, HARBOR_FEATURES.electricalServiceFacility, HARBOR_FEATURES.defenseEmplacement].map((p) => reservePolygon(p.id, p.points, 10)),
  ...FUEL_BUND_CELLS.map((p) => reservePolygon(p.id, p.points, 24)),
  ...AMMUNITION_BUNKERS.map((p) => reservePolygon(p.id, p.berm, 15)),
  ...INDUSTRIAL_FEATURES.utilities.map((p) => reservePolygon(p.id, p.points, 10)),
  ...RADAR_SUPPORT_POLYGONS.map((p, i) => reservePolygon(`radar-building-${i}`, p, 18)),
  ...[RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, ...SAM_PAD_POSITIONS, AAA_SITE].map((p) => circle(p.id, [p.position[0], p.position[2]], p.radiusM + 30)),
  circle('communications-mast', [COMMUNICATIONS_MAST_SITE.position[0], COMMUNICATIONS_MAST_SITE.position[2]], 35),
  reservePolygon(
    'yard-shed',
    [
      [5520, 370],
      [5750, 370],
      [5750, 190],
      [5520, 190],
    ],
    15,
  ),
  reservePolygon('substation', CORRIDOR_FEATURES.substation, 15),
  ...BEACH_FEATURES.defensiveRemains.map((p, i) => reservePolygon(`beach-remains-${i}`, p, 10)),
  reservePolygon('beach-apron', BEACH_FEATURES.exitApron, 18),
  reservePolygon('beach-hardstand', BEACH_FEATURES.inlandHardstand, 18),
  ...ROAD_DEFINITIONS.map((p) => reservePath(p.id, p.points, p.widthM / 2 + 7)),
  ...AMMUNITION_GATE_SPURS.map((p, i) => reservePath(`ammo-gate-${i}`, p, 12)),
  ...RAIL_DEFINITIONS.map((p) => reservePath(p.id, p.points, 9)),
  ...SECURITY_FENCES.map((p, i) => reservePath(`fence-${i}`, p, 9)),
  ...FUEL_PIPE_DEFINITIONS.map((p) => reservePath(p.id, p.points, 5)),
  reservePath('pipeline-trunk', PIPELINE_HARBOR_FUEL_TRUNK, 18),
  reservePath(
    'yard-barrier',
    [
      [5425, 430],
      [6075, 430],
    ],
    6,
  ),
  reservePath('t72-connector', T72_SERVICE_YARD_CONNECTOR_POINTS, 13),
  ...FUTURE_LCAC_APPROACHES.map((p, i) => reservePath(`future-lcac-${i}`, p, Math.hypot(26.4 / 2, 14.3 / 2) + 4)),
  ...FUTURE_LCAC_APPROACHES.map((p, i) => circle(`future-ramp-unloading-${i}`, p.at(-1)!, 65)),
  ...FUTURE_LAV_CONNECTORS.map((p, i) => reservePath(`future-lav-${i}`, p, Math.hypot(6.39 / 2, 2.5 / 2) + 5)),
  ...[
    [-3190, 4190],
    [-3070, 4185],
    [5580, 170],
    [5450, 390],
    [6000, 390],
    [3710, 3570],
    [4390, 3650],
    [4450, 3580],
  ].map((p, i) => circle(`equipment-${i}`, [p[0]!, p[1]!], 15)),
]

let sweptReservations: readonly Reservation[] | undefined
export function getVehicleSweptReservations(): readonly Reservation[] {
  if (sweptReservations) return sweptReservations
  const tracks = new Map<string, { points: XZPoint[]; radius: number }>()
  const append = (id: string, x: number, z: number, length: number, width: number) => {
    let track = tracks.get(id)
    if (!track) {
      track = { points: [], radius: Math.hypot(length / 2, width / 2) + 2 }
      tracks.set(id, track)
    }
    const previous = track.points.at(-1)
    if (!previous || Math.hypot(previous[0] - x, previous[1] - z) > 0.01) track.points.push([x, z])
  }
  // Half-second chords with a 2 m safety margin cover interpolation curvature,
  // lateral offsets and all corners, including BTR turns and rear-truck reverse.
  for (let tick = 0; tick <= 352; tick++) {
    const time = tick / 2
    const btr = deriveBtr80GroupState(time, () => 0)
    const t72 = deriveT72GroupState(time, () => 0)
    const support = deriveSupportConvoyState(time).convoy
    for (const id of BTR80_VEHICLE_IDS) {
      const p = btr.vehicles[id].pose.position
      append(id, p.x, p.z, BTR80_DIMENSIONS_METERS.length, BTR80_DIMENSIONS_METERS.width)
    }
    // The gun extends ahead of a hull-centred origin; use its full forward
    // reach symmetrically rather than half the overall nose-to-tail dimension.
    for (const id of T72_VEHICLE_IDS) {
      const p = t72.vehicles[id].pose.position
      append(id, p.x, p.z, T72_DIMENSIONS_METERS.gunForwardLength * 2 - T72_DIMENSIONS_METERS.hullLength, T72_DIMENSIONS_METERS.width)
    }
    for (const id of SUPPORT_VEHICLE_IDS) {
      const v = support.vehicles[id]
      const d = SUPPORT_DIMENSIONS[v.subtype]
      append(id, v.pose.position.x, v.pose.position.z, d.length, d.width)
    }
  }
  sweptReservations = Array.from(tracks, ([id, track]) => reservePath(id, track.points, track.radius))
  return sweptReservations
}

export function isDecorationAllowed(x: number, z: number, radius: number, purpose: 'growth' | 'equipment' = 'growth') {
  if (!Number.isFinite(x + z + radius) || radius < 0 || !pointInPolygon(x, z, MAINLAND_POLYGON_XZ)) return false
  // Entire footprint must stay on land, including the concave engineered coast.
  if (distanceToPolyline(x, z, [...MAINLAND_POLYGON_XZ, MAINLAND_POLYGON_XZ[0]!]) <= radius + 2) return false
  if ([...FIXED_RESERVATIONS, ...DAMAGE_RESERVATIONS, ...getVehicleSweptReservations()].some((r) => intersectsReservation(x, z, radius, r))) return false
  if (purpose === 'growth') {
    const yards = [...HARBOR_FEATURES.aprons.map((p) => p.points), CORRIDOR_FEATURES.serviceYard, CORRIDOR_FEATURES.pullOffWest, CORRIDOR_FEATURES.pullOffEast]
    if (yards.some((p) => intersectsReservation(x, z, radius, reservePolygon('operational-yard', p, 10)))) return false
  }
  return true
}

export type GroundRoutePoint = readonly [x: number, z: number]

const YARD_ROUTE_START: GroundRoutePoint = [5_967, 250]
const YARD_EXIT: GroundRoutePoint = [6_075, 250]
const EXIT_CONTROL_A: GroundRoutePoint = [6_145, 250]
const EXIT_CONTROL_B: GroundRoutePoint = [6_145, 406.2]
const RESCUE_BRANCH_JOIN: GroundRoutePoint = [6_060, 409.6]

function cubicPoint(start: GroundRoutePoint, controlA: GroundRoutePoint, controlB: GroundRoutePoint, end: GroundRoutePoint, amount: number): GroundRoutePoint {
  const inverse = 1 - amount
  return [inverse ** 3 * start[0] + 3 * inverse * inverse * amount * controlA[0] + 3 * inverse * amount * amount * controlB[0] + amount ** 3 * end[0], inverse ** 3 * start[1] + 3 * inverse * inverse * amount * controlA[1] + 3 * inverse * amount * amount * controlB[1] + amount ** 3 * end[1]]
}

// Keep the polyline fine enough that the path sampler preserves the cubic's
// zero-kink tangent at the yard exit even under 50 ms motion-quality tests.
const EXIT_CURVE = Array.from({ length: 129 }, (_, index) => cubicPoint(YARD_EXIT, EXIT_CONTROL_A, EXIT_CONTROL_B, RESCUE_BRANCH_JOIN, index / 128))

function smoothstepAmount(start: number, end: number, value: number) {
  const amount = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return amount * amount * (3 - 2 * amount)
}

function rescueBranchLaneOffset(stationMeters: number) {
  if (stationMeters < 250) return 0
  if (stationMeters < 360) return -3 * smoothstepAmount(250, 360, stationMeters)
  if (stationMeters < 420) return -3
  if (stationMeters < 480) return -3 + 6 * smoothstepAmount(420, 480, stationMeters)
  if (stationMeters < 650) return 3
  if (stationMeters < 900) return 3 * (1 - smoothstepAmount(650, 900, stationMeters))
  return 0
}

function offsetRescueBranchSegment(start: GroundRoutePoint, end: GroundRoutePoint, spacingMeters: number) {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const length = Math.hypot(dx, dz)
  const tangentX = dx / length
  const tangentZ = dz / length
  const normalX = -tangentZ
  const normalZ = tangentX
  const count = Math.ceil(length / spacingMeters)
  return Array.from({ length: count + 1 }, (_, index): GroundRoutePoint => {
    const amount = index / count
    const station = amount * length
    const offset = rescueBranchLaneOffset(station)
    return [start[0] + dx * amount + normalX * offset, start[1] + dz * amount + normalZ * offset]
  })
}

const OFFSET_RESCUE_BRANCH = offsetRescueBranchSegment(RESCUE_BRANCH_JOIN, [5_050, 450], 20)

/**
 * Minimum rendered connector from the open eastern service yard to the
 * existing rescue-branch road. It bends around the yard barrier endpoint and
 * stays south of the substation.
 */
export const T72_SERVICE_YARD_CONNECTOR_POINTS = [YARD_ROUTE_START, ...EXIT_CURVE] as const satisfies readonly GroundRoutePoint[]

/**
 * Complete authored reinforcement centerline: service yard, rescue branch,
 * eastern trunk, then the inland beach connector. Only the first 108 m is
 * reached during Stage 4B.2A; the remainder preserves a continuous route and
 * its exact reverse fallback without pathfinding.
 */
export const T72_REINFORCEMENT_ROUTE_POINTS = [YARD_ROUTE_START, ...EXIT_CURVE, ...OFFSET_RESCUE_BRANCH.slice(1), [4_050, 100], [3_100, -300], [4_000, -1_100], [5_000, -1_900], [6_050, -1_600], [6_200, -1_830], [6_000, -2_050]] as const satisfies readonly GroundRoutePoint[]

export const T72_AUTHORED_YARD_EXIT = YARD_EXIT

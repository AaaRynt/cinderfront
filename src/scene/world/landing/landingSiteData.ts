import type { XZPoint } from '../worldData'

import { MAINLAND_POLYGON_XZ } from '../worldData'

/** Approved 2026-10-09: local contact corrections only; no global grid edits. */
export const LANDING_SEA_LEVEL = -0.12
export const LANDING_COAST_POINTS = MAINLAND_POLYGON_XZ.slice(5, 11).toReversed()
export const LANDING_GRADE_GRID_METERS = 2
export const LANDING_SITES = [
  { id: 'beach_contact_grade_west', holdingFeatureId: 'lcac_holding_west', gateFeatureId: 'lcac_final_nearshore_west', holding: [4250, -3720], gate: [4300, -3160], beach: [4300, -2920], roadId: 'road_beach_exit', roadNext: [4250, -2700], bounds: [4230, 4390, -3130, -2850], featherMeters: 25, riseMeters: 90 },
  { id: 'beach_contact_grade_east', holdingFeatureId: 'lcac_holding_east', gateFeatureId: 'lcac_final_nearshore_east', holding: [5380, -3740], gate: [5400, -2990], beach: [5450, -2860], roadId: 'road_beach_access_east', roadNext: [5550, -2680], bounds: [5350, 5540, -2970, -2790], featherMeters: 25, riseMeters: 70 },
] as const
export type LandingSite = (typeof LANDING_SITES)[number]
export function inLandingGrade(x: number, z: number, margin = 0) {
  return LANDING_SITES.some(({ bounds: [a, b, c, d] }) => x >= a - margin && x <= b + margin && z >= c - margin && z <= d + margin)
}
export function landingGradePolygon(site: LandingSite): readonly XZPoint[] {
  const [a, b, c, d] = site.bounds
  return [
    [a, c],
    [b, c],
    [b, d],
    [a, d],
  ]
}

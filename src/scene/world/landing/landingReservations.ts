import { LCAC_DIMENSIONS } from '../../../simulation/landingCraftData'
import { LCAC_APPROACHES } from '../../../simulation/landingCraftPaths'
import { createShoreFoamLayout } from '../stage4c/coastalWater'
import { createRegionalLayout } from '../stage4c/regionalLayout'
import { createServiceEquipmentLayout } from '../stage4c/serviceLayout'
import { intersectsReservation, reservePath, reservePolygon } from '../stage4c/spatialReservations'
import { createSurfaceHistory } from '../stage4c/surfaceHistory'
import { LANDING_SITES, landingGradePolygon } from './landingSiteData'

// The old reservations remain the inputs to seeded rejection. Apply this new
// approved mask only AFTER the historical layout is complete, without rerolls.
export const LANDING_RESERVATIONS = [...LCAC_APPROACHES.map((r, i) => reservePath(`approved-lcac-${i + 1}`, r.path.points, Math.hypot(LCAC_DIMENSIONS.length / 2, LCAC_DIMENSIONS.width / 2) + 4)), ...LANDING_SITES.map((s) => reservePolygon(s.id, landingGradePolygon(s), 0))]
export const LANDING_FOAM_RESERVATIONS = LCAC_APPROACHES.map((r, i) => reservePath(`approved-cushion-${i + 1}`, r.path.points, 23))
export function overlapsLanding(x: number, z: number, radius: number) {
  return LANDING_RESERVATIONS.some((r) => intersectsReservation(x, z, radius, r))
}
export function createLandingRegionalLayout() {
  return createRegionalLayout().filter((i) => !overlapsLanding(i.position[0], i.position[2], i.footprintRadius))
}
export function createLandingServiceLayout() {
  const layout = createServiceEquipmentLayout()
  for (const family of Object.keys(layout) as (keyof typeof layout)[])
    layout[family] = layout[family].filter((matrix) => {
      const e = matrix.elements,
        sx = Math.hypot(e[0]!, e[1]!, e[2]!),
        sz = Math.hypot(e[8]!, e[9]!, e[10]!)
      return !overlapsLanding(e[12]!, e[14]!, Math.hypot(sx, sz) * 0.6)
    })
  return layout
}
export function createLandingSurfaceHistory() {
  return createSurfaceHistory().filter((p) => !p.points.some(([x, z]) => overlapsLanding(x, z, 0)))
}
export function createLandingFoamLayout() {
  return createShoreFoamLayout().filter((f) => {
    const x = f.points.reduce((v, p) => v + p[0], 0) / f.points.length,
      z = f.points.reduce((v, p) => v + p[1], 0) / f.points.length
    const radius = Math.max(...f.points.map((p) => Math.hypot(p[0] - x, p[1] - z)))
    return !LANDING_FOAM_RESERVATIONS.some((r) => intersectsReservation(x, z, radius, r))
  })
}

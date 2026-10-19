import { Matrix4, Quaternion, Vector3 } from 'three'

import type { Region } from '../stage4c/regionalLayout'

import { inLandingGrade } from '../landing/landingSiteData'
import { getLandingSupportHeight } from '../landing/landingTerrain'
import { createDeterministicRandom } from '../stage2/environment/seededLayout'
import { pointInPolygon } from '../stage2/terrainModel'
import { REGIONAL_BOUNDS } from '../stage4c/regionalLayout'
import { intersectsReservation } from '../stage4c/spatialReservations'
import { createTreeGeometry, type TreeForm } from './landscapeGeometry'
import { createExistingLandscapeEnvelopes, isNewLandscapeAllowed } from './landscapeReservations'

export interface LandscapeTree {
  readonly id: string
  readonly region: Region
  readonly form: TreeForm
  readonly variant: number
  readonly position: readonly [number, number, number]
  readonly yaw: number
  readonly scale: number
  readonly height: number
  readonly crownSpan: number
  readonly radius: number
  readonly colorMix: number
}
// Sheltered banks/foot slopes and inland dunes. No trees on the exposed crest,
// harbor pavement, firebreaks, industrial compounds or the open strand.
export const TREE_POCKETS = [
  { region: 'corridor', center: [1180, 820], radius: 85, count: 4 },
  { region: 'corridor', center: [1900, 800], radius: 130, count: 4 },
  { region: 'corridor', center: [2180, 640], radius: 100, count: 4 },
  { region: 'corridor', center: [3550, 360], radius: 115, count: 4 },
  { region: 'radar', center: [2630, 2930], radius: 140, count: 4 },
  { region: 'radar', center: [5070, 3120], radius: 140, count: 4 },
  { region: 'beach', center: [3880, -2550], radius: 120, count: 4 },
  { region: 'beach', center: [5900, -2570], radius: 125, count: 4 },
] as const
export function createTreeLayout(seed = 'cinderfront:6a:dryland-trees'): readonly LandscapeTree[] {
  const resources = (['upright', 'wind'] as const).flatMap((form) => [0, 1].map((variant) => ({ form, variant, ...createTreeGeometry(form, variant) })))
  const envelopes = resources.map((r) => {
    const vertices = [r.wood, r.leaves].flatMap((g) => {
      const p = g.getAttribute('position')
      return Array.from({ length: p.count }, (_, i) => new Vector3().fromBufferAttribute(p, i))
    })
    return { radius: Math.max(...vertices.map((v) => Math.hypot(v.x, v.z))), height: Math.max(...vertices.map((v) => v.y)), span: Math.max(...vertices.map((v) => v.x)) - Math.min(...vertices.map((v) => v.x)) }
  })
  const existing = createExistingLandscapeEnvelopes(),
    trees: LandscapeTree[] = []
  for (const [pocketIndex, pocket] of TREE_POCKETS.entries()) {
    const random = createDeterministicRandom(`${seed}:${pocketIndex}`)
    let accepted = 0
    for (let attempt = 0; accepted < pocket.count && attempt < 1200; attempt++) {
      const a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * pocket.radius,
        x = pocket.center[0] + Math.cos(a) * r,
        z = pocket.center[1] + Math.sin(a) * r * 0.65
      const index = Math.floor(random() * 4),
        resource = resources[index]!,
        envelope = envelopes[index]!,
        scale = 3.6 + random() * 2.1,
        radius = envelope.radius * scale + 0.15,
        yaw = random() * Math.PI * 2
      if (!pointInPolygon(x, z, REGIONAL_BOUNDS[pocket.region]) || inLandingGrade(x, z, radius + 10) || !isNewLandscapeAllowed(x, z, radius + 2)) continue
      if (existing.some((e) => intersectsReservation(x, z, radius + 1, e)) || trees.some((t) => Math.hypot(t.position[0] - x, t.position[2] - z) < radius + t.radius + 8)) continue
      const y = getLandingSupportHeight(x, z),
        slope = Math.hypot(getLandingSupportHeight(x + 2, z) - getLandingSupportHeight(x - 2, z), getLandingSupportHeight(x, z + 2) - getLandingSupportHeight(x, z - 2)) / 4
      if (slope > 0.28 || (pocket.region === 'radar' && y > 170) || (pocket.region === 'beach' && z < -2800)) continue
      trees.push({ id: `6a:${pocket.region}:tree:${pocketIndex}:${accepted}`, region: pocket.region, form: resource.form, variant: resource.variant, position: [x, y, z], scale, yaw, radius, height: envelope.height * scale, crownSpan: envelope.span * scale, colorMix: random() })
      accepted++
    }
  }
  resources.forEach((r) => {
    r.wood.dispose()
    r.leaves.dispose()
  })
  return trees
}
export function treeBaseMatrix(tree: LandscapeTree) {
  return new Matrix4().compose(new Vector3(...tree.position), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), tree.yaw), new Vector3(tree.scale, tree.scale, tree.scale))
}

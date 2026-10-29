import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

/** Only these existing paths changed; every other captured source is read live. */
export const STAGE7B_SOURCE_CHANGES: Readonly<Record<string, string>> = {
  'src/scene/world/landing/landingTerrain.ts': 'extract the immutable compact support index and eliminate temporary per-query surface arrays; preserve uploaded geometry and exact surface ordering',
  'src/simulation/lavAftermath.ts': 'share the identical road pose and reuse tire support only for bit-identical centers within one wheel evaluation; preserve all solver iterations and returned snapshots',
  'src/ui/SimulationHud.tsx': 'memoize operational details on every displayed primitive string and isolate the camera menu subscription; preserve the full DOM, controls and display precision',
  'src/scene/vehicles/SupportVehicleModel.tsx': 'reuse the two constant tire/hub/marker child lists inside the live steering and rotation groups; preserve resources and every light input',
  'src/scene/vehicles/LandingModels.tsx': 'extend the finite resource-owned static element lists for machinery, fan housings and ramps while retaining live fans, ramps, deck, skirt and navigation transforms',
  'src/scene/vehicles/Btr80Model.tsx': 'memoize hull sections on all damage/turret inputs and reuse four finite wheel child lists; all moving wheel/root transforms remain live',
  'src/scene/vehicles/T72BModel.tsx': 'reuse four finite road-wheel child lists while retaining exact track, wheel, root and turret movement and existing body memoization',
  'src/scene/installations/RadarInstallations.tsx': 'memoize static lattice/dish and exact AAA inputs; destroyed search radar ignores time only when its timed warning lamp is absent',
  'src/scene/effects/stage4a/FuelDamageAftermath.tsx': 'memoize persistent damage only across identical sides of every actual visibility/collapse/scorch boundary and unchanged surface authority; live smoke/fire remain independent',
  'src/test/stage7aSourceAudit.ts': 'chain exact Stage7B exceptions to fixed completed Stage7A bytes while retaining the original Stage7A exception set, historical source commit and unrelated live checks',
}
const bytes = new Map<string, Buffer>()
export function stage7bHistoricalSource(path: string): Buffer {
  if (!(path in STAGE7B_SOURCE_CHANGES)) return readFileSync(path)
  let source = bytes.get(path)
  if (!source) {
    source = execFileSync('git', ['show', `62edc66:${path}`], { maxBuffer: 32 * 1024 * 1024 })
    bytes.set(path, source)
  }
  return source
}
export const stage7bAuditedSourceHash = (path: string) => createHash('sha256').update(stage7bHistoricalSource(path)).digest('hex')

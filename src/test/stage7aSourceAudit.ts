import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

/** Exact existing-file exceptions, with independent 1bc6bdc byte audits. */
export const STAGE7A_SOURCE_CHANGES: Readonly<Record<string, string>> = {
  'src/simulation/lavAftermath.ts': 'retain one exact immutable terminal payload per LAV only after hold and dust expiry, keyed by actor, carrier pose and slot; moving state and single-time world cache remain unchanged',
  'src/scene/vehicles/PantsirModel.tsx': 'memoize unchanged mechanical subtree on every actual primitive input while retaining the exact live impact-rock rotation on its original parent group',
  'src/scene/vehicles/PantsirModel.test.tsx': 'unwrap the actual memoized mechanical subtree in the existing geometry inspection helper, retaining every original four-pose fingerprint and all wheel, stabilizer, tube and transport assertions',
  'src/simulation/secondaryPantsir.test.ts': 'unwrap the actual memoized model subtree in the existing render inspector; preserve every original wheel, road, cab, gun, blast and weapon-origin assertion and timeout',
  'src/App.tsx': 'gate mouse and keyboard playback and initial time editing on renderer readiness; retain every status, authored value and exact-time snapshot',
  'src/ui/SimulationHud.tsx': 'small truthful preparation status, actual work accounting and retry; accessible disabled playback/time controls until ready',
  'src/scene/BattlefieldScene.tsx': 'mount separate readiness owner and memoize unchanged Wasp model inputs without changing SimulationDriver, quality, live actor root or world',
  'src/scene/effects/BattleEffects.tsx': 'reuse a unit unlit fire cone at the identical radius/height and retain the same inactive missile/tracer resources for actual preparation; preserve all visible formulas and light visibility',
  'src/scene/vehicles/F35BModel.tsx': 'retain immutable airframe and fan blade elements while all absolute-time mechanical transforms and engine values still update',
  'src/scene/vehicles/LandingModels.tsx': 'finite resource-owned immutable body, cabin, tire and blade element trees plus exact visible-wheel prop memo comparison; all roots/transforms preserved',
  'src/scene/vehicles/SupportVehicleModel.tsx': 'reuse immutable module-owned body trees and memoize unchanged wheel assemblies, independently of the exact live wheel and light formulas',
  'src/scene/vehicles/Btr80Group.tsx': 'memoize the existing actual model on all primitive rendered inputs, retaining moving root and every wheel, turret and damage update',
  'src/scene/vehicles/T72BGroup.tsx': 'memoize the existing actual model on all primitive rendered inputs while preserving the live root, track, road wheel, turret and damage transforms',
  'src/scene/vehicles/Su30MkkGroup.tsx': 'memoize the existing static aircraft mesh by actual damage input; preserve both roots and every dynamic attached presentation sample',
  'src/test/inspectModel.ts': 'inspect actual memoized model functions instead of silently dropping their geometry from current render-envelope and wheel tests',
  'src/App.test.tsx': 'existing interface tests explicitly start renderer-ready; separate readiness tests cover preparing, failure, cancellation, retry and keyboard gating',
  'src/test/stage6cSourceAudit.ts': 'chain exact Stage7A exceptions into dated historical audits while retaining all unrelated live byte checks',
}
const bytes = new Map<string, Buffer>()
export function stage7aHistoricalSource(path: string): Buffer {
  if (!(path in STAGE7A_SOURCE_CHANGES)) return readFileSync(path)
  let source = bytes.get(path)
  if (!source) {
    source = execFileSync('git', ['show', `1bc6bdc:${path}`], { maxBuffer: 32 * 1024 * 1024 })
    bytes.set(path, source)
  }
  return source
}
export const stage7aAuditedSourceHash = (path: string) => createHash('sha256').update(stage7aHistoricalSource(path)).digest('hex')

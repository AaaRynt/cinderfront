import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

import { stage6cHistoricalSource } from './stage6cSourceAudit'

/** Exact file-level Stage6B exceptions, never a directory exemption. Historical
 * bytes still come from fixed75bf46a, and active behavior is checked separately. */
export const STAGE6B_SOURCE_CHANGES: Readonly<Record<string, string>> = {
  'src/App.tsx': 'active runtime, keyboard, truthful deployment readouts',
  'src/App.test.tsx': 'Stage6B label and active observation controls',
  'src/ui/SimulationHud.tsx': 'fixed scripted slider and accessible observation seek',
  'src/scene/BattlefieldScene.tsx': 'single runtime world and departed aircraft visibility',
  'src/scene/camera/CameraRig.tsx': 'runtime follow headings',
  'src/scene/vehicles/PantsirModel.tsx': 'bound only late wreck rocking phase to prevent finite runtime overflow; scripted arithmetic preserved',
  'src/scene/vehicles/PantsirModel.test.tsx': 'exact scripted rocking and finite actual rendered wreck transforms through extreme late observations',
  'src/simulation/store.ts': 'one nonnegative observation clock without endpoint pause',
  'src/simulation/store.test.ts': 'active unbounded store assertions',
  'src/simulation/landingCraft.test.ts': 'active store crosses 180 without pausing; retain all finite landing actor and timeline assertions',
  'src/simulation/secondaryPantsir.test.ts': 'active store remains playing at 180; retain exact finite Pantsir boundary, pause, seek and restart assertions',
  'src/simulation/supportConvoy.test.ts': 'omit only additive runtime metadata from exact historical world comparisons and assert continuing playback at 180',
  'src/simulation/scriptedEndpoint.test.ts': 'legacy finite APIs and active runtime handoff',
  'src/simulation/index.ts': 'focused active runtime exports',
  'src/simulation/lavDeployment.ts': 'export unchanged near-craft solver for bounded road handoff',
  'src/simulation/stage6aPreservation.test.ts': 'fixed-Git historical audit for precisely enumerated runtime source changes',
  'src/scene/effects/BattleEffects.tsx': 'bounded periodic phases after180',
  'src/scene/effects/SecondaryPantsirEffects.tsx': 'bounded periodic phases after180',
  'src/scene/effects/Stage3BattleEffects.tsx': 'persistent runtime effects and fixed minor secondary pool',
  'src/scene/effects/Stage4B2AArmoredEffects.tsx': 'recent-contact runtime dust',
  'src/scene/effects/Stage4BGroundVehicleEffects.tsx': 'recent-contact runtime dust',
  'src/scene/effects/SupportConvoyEffects.tsx': 'recent-contact runtime dust',
  'src/scene/effects/stage3/BlastResponseField.tsx': 'bounded periodic ignition phases',
  'src/scene/effects/stage3/BoundedSmoke.tsx': 'finite departure emitter cutoff',
  'src/scene/effects/stage3/PersistentGroundFires.tsx': 'finite departure emitter cutoff and bounded periodic phases',
  'src/scene/effects/stage4a/LayeredFuelFireField.tsx': 'bounded periodic flame phases',
  'src/scene/effects/stage4a/Stage4AFuelDisaster.tsx': 'preserve scripted fuel lighting and bound late periodic light phases before multiplication',
  'src/scene/world/stage2/HarborNavalAssets.tsx': 'runtime Molniya transform/departure and bounded machinery phases',
  'src/scene/world/stage4c/CoastalWater.tsx': 'bounded equivalent GPU water phase',
  'src/scene/world/stage4c/SurfaceHistory.tsx': 'permanent scripted wear survives observation beyond sentinel1000',
}
const historical = new Map<string, string>()
export function stage6bHistoricalSource(path: string): string {
  if (!(path in STAGE6B_SOURCE_CHANGES)) return stage6cHistoricalSource(path).toString()
  let source = historical.get(path)
  if (source === undefined) {
    source = execFileSync('git', ['show', `75bf46a:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    historical.set(path, source)
  }
  return source
}
export const sha256 = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
export function stage6bAuditedSourceHash(path: string): string {
  return path in STAGE6B_SOURCE_CHANGES ? sha256(stage6bHistoricalSource(path)) : sha256(stage6cHistoricalSource(path))
}

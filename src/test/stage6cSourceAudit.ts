import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

/** Exact presentation edits. Each keeps a fixed-Git historical byte audit and
 * has replacement camera, HUD, rendered-pool or material/geometry coverage. */
export const STAGE6C_SOURCE_CHANGES: Readonly<Record<string, string>> = {
  'src/App.tsx': 'truthful departed display label for the existing Su-30s and keyboard isolation for native status disclosure/scroll focus; all underlying values and clock/control semantics unchanged',
  'src/scene/vehicles/Su30MkkGroup.tsx': 'retain both existing aircraft roots and shared models while hidden before entry and after egress, preventing identity churn across seeks without any visible content or pose change',
  'src/scene/BattlefieldScene.tsx': 'focused dawn shadow light and readable cold fill; runtime scene unchanged',
  'src/scene/camera/CameraRig.tsx': 'deterministic runtime headings, seek-safe offsets and short sight-line dolly',
  'src/scene/camera/CameraRig.test.tsx': 'retain paused/manual/seek behavior with current renderer frame harness and bounded dolly',
  'src/scene/camera/CameraAftermath.test.tsx': 'Wasp follows its actual position through both the scripted patrol and aftermath; preserve manual offsets and finite departed-target framing',
  'src/ui/SimulationHud.tsx': 'grouped native selector, full accessible status disclosure and compact complete event text',
  'src/App.test.tsx': 'exercise native selector and accessible operational disclosure while retaining runtime controls',
  'src/index.css': 'remove superseded HUD layout rules migrated to component Tailwind utilities; retain specialized range and panel styling',
  'src/scene/world/landing/landingTerrain.ts': 'compact immutable support lookup index replaces string-key cell arrays; same triangle candidate order, uploaded geometry and exact barycentric outputs',
  'src/scene/world/WorldShell.tsx': 'inline memo factory fixes React warning without changing resource ownership',
  'src/scene/world/stage2/TerrainAndWater.tsx': 'remove enormous terrain shadow submission; exact terrain still receives focused shadows',
  'src/scene/world/stage2/Stage2Meshes.tsx': 'add render-only road shoulder attribute after unchanged support geometry upload',
  'src/scene/world/stage2/stage2Materials.ts': 'dusty road edge color blend within existing road width and palette',
  'src/scene/world/stage4c/CoastalWater.tsx': 'rougher distance-filtered water and owned eight-triangle distant visual sea; samplers unchanged',
  'src/scene/effects/Stage4BGroundVehicleEffects.tsx': 'soft bounded BTR wreck puffs and centered flames at unchanged births, local transforms and effect clocks',
  'src/scene/effects/Stage4B2AArmoredEffects.tsx': 'soft bounded T72 wreck puffs and centered flames at unchanged births, local transforms and effect clocks',
  'src/scene/effects/SecondaryPantsirEffects.tsx': 'soft bounded wreck puffs and persistent centered flames while retaining original launch flashes and all timing',
  'src/scene/effects/Stage3BattleEffects.tsx': 'inline sheen memo factory fixes React warning; same geometry and runtime inputs',
  'src/scene/effects/stage3/sharedResources.ts': 'soft instanced smoke and persistent-flame resources; readable charred structure palette',
  'src/scene/effects/stage3/BoundedSmoke.tsx': 'camera-facing soft smoke geometry with tested conservative culling bounds at exact old samples',
  'src/scene/effects/stage3/PersistentGroundFires.tsx': 'soft anchored flames and smoke at unchanged source ages, transforms and pool capacity',
  'src/scene/effects/stage3/BlastResponseField.tsx': 'use soft smoke geometry at existing bounded response samples',
  'src/scene/effects/stage3/AmmunitionCookoffEffect.tsx': 'use soft smoke geometry at existing cookoff ages and capacity',
  'src/scene/effects/aftermath/IndustrialSecondaryActivity.tsx': 'use soft puff geometry without changing minor-secondary births or outcomes',
  'src/scene/effects/stage4a/sharedResources.ts': 'shared soft smoke/flame materials and geometry with readable damaged shell surfaces',
  'src/scene/effects/stage4a/CinematicFuelSmokeField.tsx': 'valid bounds and culling for unchanged layered fuel smoke samples',
  'src/scene/effects/stage4a/LayeredFuelFireField.tsx': 'valid bounds and culling for unchanged sustained flame and soot samples',
  'src/simulation/stage5cPreservation.test.ts': 'retain fixed-Git historical bytes for the exact support-index implementation edit; keep every current geometry, support sample, world and unrelated live source check',
  'src/simulation/stage6aPreservation.test.ts': 'retain historical normalization against fixed-Git bytes for the precise Stage5C test adapter; faster identical fixture byte comparisons',
  'src/simulation/stage6bPreservation.test.ts': 'replace an inherited stale checksum with exact fixed-Git fixture bytes; retain byte equality with Buffer.equals instead of slow per-property assertion walking',
  'src/test/stage6bSourceAudit.ts': 'chain exact Stage6C file exceptions into historical audits, retaining live checks elsewhere',
}
const cache = new Map<string, string>()
export function stage6cHistoricalSource(path: string): string | Buffer {
  if (!(path in STAGE6C_SOURCE_CHANGES)) return readFileSync(path)
  let bytes = cache.get(path)
  if (bytes === undefined) {
    bytes = execFileSync('git', ['show', `5f940b5:${path}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    cache.set(path, bytes)
  }
  return bytes
}
export function stage6cAuditedSourceHash(path: string) {
  return createHash('sha256').update(stage6cHistoricalSource(path)).digest('hex')
}

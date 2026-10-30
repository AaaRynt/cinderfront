import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const STAGE7C_SOURCE_CHANGES: Readonly<Record<string, string>> = {
  'src/main.tsx': 'mount the lightweight bootstrap shell before deferred scene/simulation imports; retain StrictMode and the existing root',
  'src/scene/world/stage2/terrainGeometry.ts': 'share identical ordered grid/vertex/orientation kernels between synchronous factories and bounded cooperative preparation; preserve all attributes and bounds',
  'src/scene/world/landing/landingTerrain.ts': 'prepare private exact mainland/support/coast resources with cancellation and atomic publication; gate browser consumers and reuse the completed geometry directly',
  'src/scene/world/landing/landingSupportIndex.ts': 'share exact triangle constants and candidate insertion kernels with bounded units; retain ordering, tolerances and all sampler arithmetic',
  'src/scene/world/landscape/landscapeReservations.ts': 'cooperatively prepare the same finite 721 focused reservation samples in original order without ticking or deriving a complete world',
  'src/scene/world/landscape/treeLayout.ts': 'prepare the identical default seeded tree layout with finite reuse and cancellation-safe temporary geometry ownership; retain custom-seed behavior',
  'src/scene/world/stage2/Stage2Meshes.tsx': 'borrow finite fully prepared authored ground meshes only for all matching inputs; keep uncached factories and component-owned disposal for other inputs',
  'src/scene/world/stage2/TerrainAndWater.tsx': 'mount completed CPU-owned terrain/coast directly without duplicate full geometry or stale component disposal; retain ordinary synchronous factory ownership',
  'src/scene/readiness/readinessStore.ts': 'name the existing graphics preparation phase plainly while preserving readiness states, gating, generation and retry behavior',
  'src/scene/readiness/preparation.ts': 'name graphics progress without changing the nine jobs, 12-second cooperative budget, cancellation, disposal or completion rules',
  'src/scene/readiness/SceneReadiness.tsx': 'name the graphics handoff after CPU-complete scene mounting; retain context loss/restoration, latest camera/time and no autoplay',
  'src/ui/SimulationHud.tsx': 'show actual graphics completion as an accessible progress bar instead of implementation counters; retain the complete ready-state DOM and controls',
  'src/test/stage7bSourceAudit.ts': 'chain exact Stage7C path exceptions to fixed completed Stage7B bytes, preserving all older exception sets and every unrelated live source check',
}
const bytes = new Map<string, Buffer>()
export function stage7cHistoricalSource(path: string): Buffer {
  if (!(path in STAGE7C_SOURCE_CHANGES)) return readFileSync(path)
  let source = bytes.get(path)
  if (!source) {
    source = execFileSync('git', ['show', `9c0208b:${path}`], { maxBuffer: 32 * 1024 * 1024 })
    bytes.set(path, source)
  }
  return source
}
export const stage7cAuditedSourceHash = (path: string) => createHash('sha256').update(stage7cHistoricalSource(path)).digest('hex')

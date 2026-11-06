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

// These viewer paths now read cues and handle user input. Use the Stage 8D
// bytes for their historical hash, with the existing camera ID projection below.
const stage9aViewerChanges: Readonly<Record<string, string>> = {
  'src/App.tsx': 'read the clock for guided camera cuts and route explicit highlight previews through playback controls',
  'src/scene/camera/CameraRig.tsx': 'leave the guide on actual orbit, pan or zoom input and retain existing framing',
  'src/scene/camera/cameraStore.ts': 'hold the active cue and issue requests only for cuts or explicit camera actions',
}
const bytes = new Map<string, Buffer>()

function sourceAt(revision: string, path: string): Buffer {
  const key = `${revision}:${path}`
  let source = bytes.get(key)
  if (!source) {
    source = execFileSync('git', ['show', key], { maxBuffer: 32 * 1024 * 1024 })
    bytes.set(key, source)
  }
  return source
}

export function stage7cHistoricalSource(path: string): Buffer {
  const viewerReference = Object.hasOwn(stage9aViewerChanges, path) ? sourceAt('94df448', path) : undefined
  if (path === 'src/scene/world/WorldShell.tsx') {
    // Stage 8B replaces the Stage 8A mount with the local presentation group.
    return Buffer.from(readFileSync(path, 'utf8').replace("import { LocalEnvironmentMotion } from './stage8b/LocalEnvironmentMotion'\n", '').replace('        <LocalEnvironmentMotion />\n', ''))
  }
  if (path === 'src/scene/effects/stage4a/Stage4AFuelDisaster.tsx') {
    // Stage 8C shares the two live front constants with the plants.
    return Buffer.from(readFileSync(path, 'utf8').replace("import { FUEL_SHOCK_DURATION_SECONDS, FUEL_SHOCK_MAX_RADIUS_M } from '../stage3/effectMath.ts'\n", '').replace('durationSeconds={FUEL_SHOCK_DURATION_SECONDS} maximumRadiusM={FUEL_SHOCK_MAX_RADIUS_M}', 'durationSeconds={1.8} maximumRadiusM={620}'))
  }
  // Stage 8D adds three fixed detail choices ahead of the existing framing.
  if (path === 'src/scene/camera/cameraStore.ts' && viewerReference) {
    return Buffer.from(viewerReference.toString('utf8').replace("import type { EnvironmentDetailPreset } from './environmentDetails'\n\n", '').replace('  | EnvironmentDetailPreset\n', ''))
  }
  if (path === 'src/scene/camera/cameraFraming.ts') {
    return Buffer.from(
      readFileSync(path, 'utf8')
        .replace("import { ENVIRONMENT_DETAILS } from './environmentDetails'\n\n", '')
        .replace(
          `  if (preset in ENVIRONMENT_DETAILS) {
    const detail = ENVIRONMENT_DETAILS[preset as keyof typeof ENVIRONMENT_DETAILS]
    const target = new Vector3(...detail.target)
    const position = new Vector3(...detail.position).sub(target).multiplyScalar(viewportScale).add(target)
    return { position, target, anchor: target.clone(), yaw: 0, scale: viewportScale, fov, follows: true }
  }
`,
          '',
        ),
    )
  }
  if (path === 'src/App.test.tsx') {
    return Buffer.from(
      readFileSync(path, 'utf8')
        .replace("screen.getByText('Cinderfront')", "screen.getByText('Cinderfront / Stage 6C')")
        .replace('retains all 24 existing cameras and groups the three environment detail views', 'retains all 22 existing cameras and adds two LAV group presets')
        .replace("    const environment = cameras.getByRole('group', { name: 'Environment details' })\n", '')
        .replace('        .filter((option) => option.parentElement !== environment)\n', '')
        .replace(
          `    expect(
      within(environment)
        .getAllByRole('option')
        .map((option) => [option.getAttribute('value'), option.textContent]),
    ).toEqual([
      ['inspection-bay', 'Inspection bay'],
      ['shore-break', 'Shore break'],
      ['fuel-shock', 'Fuel shock (T+92)'],
    ])
`,
          '',
        ),
    )
  }
  if (viewerReference) return viewerReference
  if (Object.hasOwn(STAGE7C_SOURCE_CHANGES, path)) return sourceAt('9c0208b', path)
  return readFileSync(path)
}
export const stage7cAuditedSourceHash = (path: string) => createHash('sha256').update(stage7cHistoricalSource(path)).digest('hex')

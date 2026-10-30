# Post-Core Stage 7C — Responsive Startup and Deterministic Scene Initialization

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer observes an authored operation and indefinite aftermath through spectator cameras and time controls.

This is an implementation task. Make initial scene construction visibly responsive, give initialization truthful progress and safe ownership, and verify that the completed scene and runtime remain exact. Deliver the implementation and measured acceptance.

## 1. Starting point and purpose

Start from completed Stage 7B commit `9c0208b`. Stages 1–6 and post-core Stages 7A/7B retain their dated completion and explicit limitations.

The recorded starting checks are **739 passing tests across 66 files**, both TypeScript no-emit checks and zero lint errors/warnings. Preserve 51 events, 24 camera IDs, 35 persistent actor roots, 64 LAV wheels and 65 landscape batches.

Stage 7B reduced Fuel scene React P95 by 27.0% at both speeds and moving-Landing world P95 by 32.6%/30.4%. Its 12 accepted busy runs already have 16.8–17.4 ms RAF P95. Do not reopen a general steady-state optimization round or chase a higher frame rate at the same display floor.

The remaining startup problem is separate: synchronous terrain/coast construction still blocks the main thread before renderer preparation can help. The current entry point eagerly imports App, which imports the scene and simulation; the HUD also derives a world on its first render. A loading message added after those imports or calculations may appear too late.

Stage 7B also retained an initial after-context first play with 878/596/549 ms long tasks and no established cause. A later clean context does not invalidate that evidence. Recheck first-use consistency, but do not claim that startup scheduling fixes these playback stalls without attribution.

The primary deliverable is an early usable loading shell and bounded, cancellable construction of the same exact scene. The accepted ready-state appearance, simulation and picture quality remain unchanged.

## 2. Read and trace before editing

Read `AGENTS.md`, `ITERATION_PLAN.md`, `STAGE7B_ACCEPTANCE.md`, `STAGE7A_ACCEPTANCE.md`, `STAGE6C_ACCEPTANCE.md`, the integration summary and relevant changelog records.

Trace the actual startup dependency graph, including:

- `index.html`, `src/main.tsx`, `src/App.tsx`, CSS and barrel imports;
- `src/scene/BattlefieldScene.tsx`, the first HUD/world derivation and camera initialization;
- `src/scene/world/stage2/terrainGeometry.ts`, `terrainModel.ts` and `TerrainAndWater.tsx`;
- `src/scene/world/landing/landingTerrain.ts`, `landingSupportIndex.ts` and their synchronous consumers;
- landscape layout/reservation generation, coast, road, surface-history and instance construction;
- `src/scene/readiness/`, resource disposal and StrictMode lifecycle;
- current geometry/support fingerprints, full-world preservation fixtures and source-audit chain.

Inspect real call stacks before deciding which work to split, defer or reuse. Terrain refinement, index creation, coast generation and deterministic landscape preparation are candidates, not assumed equal contributors.

Optional prior evidence is indexed in `stage7b-review.local/README.md`. Default tests must not depend on ignored evidence.

## 3. Fix a startup comparison before implementation

Create an immutable reference from `9c0208b`, sharing the existing installed dependencies without changing them. Use the same controlled development configuration, StrictMode, visible browser, viewport/drawing buffer, DPR, antialiasing, shadows and recorder on both versions. Use only one visible owned renderer at a time.

Record a pre-edit startup trace that separates:

- navigation/module fetching and evaluation;
- first visible loading interface and its first handled interaction;
- terrain generation/refinement, coast, road/apron and support-index construction;
- deterministic landscape/reservation/layout work;
- first complete scene draw;
- all nine existing renderer preparation jobs;
- ready-to-play time and the first natural playback.

Report wall time, main-thread task distributions, longest attributed application task, progress/heartbeat gaps and CPU-memory/resource peaks. Parent and child timings overlap; do not add them as independent costs.

Before editing, record the selected construction hotspots, exact preservation oracle, work-unit/ownership design and numerical startup goals in a short implementation note. Keep baseline and goals fixed when reporting results.

## 4. Show truthful progress before expensive work

Mount a small accessible loading shell before the selected heavy application imports, first world derivation or scene construction can block it. Trace imports to prove that the shell does not indirectly trigger the same work.

Use plain product language such as “Preparing terrain” and “Preparing graphics.” Reuse the current Tailwind design. Keep implementation counters, cache terminology and profiling details out of the product UI.

Allow the browser to paint the shell before beginning construction. A single deferred callback followed by the original multi-second synchronous job is insufficient.

Progress must reflect completed deterministic work or named phases. Show an indeterminate phase when its total is unknown; do not advance a timer-based percentage or report ready while required work remains.

During initialization, playback and time-editing mouse/keyboard paths must stay gated. Do not derive a full live world just to populate a loading HUD. After ready, retain the existing controls, labels, precision and layout.

Never autoplay or queue an earlier Play intent. Preserve the current selected time/camera on retry or context recovery; initial load stays paused at T+0.

## 5. Construct exact resources in bounded units

Use the simplest measured approach that meets the responsiveness goal. Cooperative deterministic chunking and finite reuse are appropriate. A dedicated worker is optional only if profiling justifies its serialization, memory and ownership cost; no new dependency is authorized.

Split the expensive loops themselves where necessary. Preserve arithmetic, iteration order, vertex/index insertion order, random-stream consumption, clipping/triangulation decisions, Float32 rounding, normals, attributes and bounds.

Yield to actual browser tasks/paint between bounded units. Chained resolved promises alone do not provide a responsive loading interface. Check cancellation/deadlines inside long loops, not only between whole multi-second phases.

Build into private staging storage and publish complete immutable results atomically. Never expose partially built terrain/support data to simulation, camera, layout or rendering consumers.

All synchronous public samplers and geometry APIs must retain their existing ready-state values and behavior. Keep a shared exact construction kernel or another independently checked equivalence path; do not create diverging synchronous and asynchronous terrain authorities.

If work crosses a worker boundary, transfer only owned buffers and preserve typed-array types/order/bytes. Do not detach published buffers, clone the entire scene, or move WebGL ownership without a demonstrated need.

Existing finite deterministic landscape reservation sweeps may be reorganized without changing their sample order, results or simulation-store isolation. Do not add future-world playback rehearsal, simulate the scenario to warm it up, or publish sampled future states.

Account for peak staging memory and disposal. Keep the four immutable support owners and Stage 7B's 15.62 MiB constant-storage tradeoff bounded; do not retain duplicate full geometry/index owners after publication.

## 6. Own cancellation, failure, retry and renderer handoff

Give CPU initialization explicit bounded work, deadline and ownership rules. State its deadline before implementation, report combined bootstrap-to-ready wall time, and retain the renderer preparation's existing **12-second cooperative budget**. Adding a new phase must not hide extra loading time.

Handle StrictMode mount/cleanup/re-entry, unmount during a chunk, failed import/build, timeout and rapid retries. An abandoned generation cannot publish progress, readiness or resources into a newer owner.

Dispose incomplete owned geometry/buffers/listeners and terminate owned workers as applicable. Release each owned resource once. Shared completed immutable data may be reused only under a documented lifetime and cannot be disposed by a stale owner.

Retry must run the failed/invalid work honestly, without reusing a partial result. A deadline cannot interrupt synchronous JavaScript by itself; demonstrate that the selected work actually yields and checks cancellation.

Start renderer preparation only after the complete required scene is mounted. Preserve the existing nine graphics jobs and truthful native program completion. Ready-to-play requires both CPU initialization and the current renderer/context generation to be ready.

Native context loss still pauses playback, cancels invalid graphics work, retains time/latest camera and restores without autoplay. Reuse valid CPU data on graphics-only recovery. Ordinary seeks, restart and camera changes must not rebuild terrain or repeat preparation.

## 7. Exact preservation contract

Preserve every active world value, contact/road/tire result, support-cell candidate order, source/outcome, wheel/suspension/rotation, event boundary, ramp/fan/light/effect schedule and indefinite aftermath behavior.

Keep the fixed-step driver and its cap/overshoot policy byte-identical. Keep the exact-time last-world cache, finite route/support tables, recent-cache bounds and at-most-eight post-hold/post-dust payload records.

Preserve authoritative map/scenario/vehicle files, all historical fixture bytes, landscape/tree placement, 51 events and 24 camera IDs. No new actors, combat, routes, effects, audio or visual assets.

Do not lower resolution/DPR, antialiasing, shadows, geometry, effects, lights or update rates, disable StrictMode, or use a lower-quality/loading proxy as the ready scene.

Never create, render or imply visible humans, crew, occupants, casualties, articulated characters or humanoid silhouettes. Keep glazing sealed/dark as before.

Do not change dependency versions, add dependencies, upgrade frameworks, run production builds or deploy.

Preserve `STAGE6C_ACCEPTANCE.md`, `STAGE7A_ACCEPTANCE.md`, `STAGE7B_ACCEPTANCE.md`, task-start `prompt.md`, `AGENTS.md`, package and lock bytes during implementation.

## 8. Focused tests and exact scene verification

Run the existing full preservation suite, including the 4,963-world golden and Stage 7B's 386-world/242,561-query supplement. Reuse existing captures; add a compact fixed-reference supplement only for uncovered construction outputs.

Compare the completed changed geometry against independently captured `9c0208b` geometry: every typed-array attribute/index byte, groups/draw ranges, bounds and support-index constants/cell ordering. Include mainland, coast, roads/apron and any other changed construction path.

Test several chunk budgets, shuffled/cancelled/retried runs and synchronous-versus-prepared results. Assert that no partial resource is published, old snapshots remain unchanged, disposed generations cannot win, and synchronous consumers cannot accidentally bypass the browser's initialization gate.

Keep source exceptions limited to exact changed paths with reasons and fixed Git references. Do not whitelist whole folders, regenerate historical goldens or relax assertions/timeouts to accommodate changes.

Repeat the 25 full-viewport lossless RGB pairs for all 24 ready-state camera roles plus late Fuel, at the same fixed poses and complete UI. Require bit-identical ready-state images. Loading-shell screenshots are separate evidence, not a mask for ready-state changes.

Repeat the existing 613 rendered checkpoints, 35-root/64-wheel/65-landscape agreement and current paused effects/mechanical clocks. Default tests must pass with optional evidence physically absent.

## 9. Measured startup and first-play acceptance

Use at least **three paired fresh page/WebGL contexts per version**, alternating order and retaining every run. “Fresh context” does not mean a cold driver/module cache; report the actual cache and development-server conditions. Do not clear unrelated browser data.

For each, capture startup and one natural first 1× play from T+0 through T+206 with the same camera schedule, before time rehearsal or warm visits. Keep CPU emulation, visibility, viewport/DPR and diagnostic overhead identical.

Primary startup targets on the matched local setup:

- the loading shell paints before selected heavy work and processes an actual accessible control/input while construction is still running;
- the selected startup workload's P95 uninterrupted application chunk is at most **50 ms**, with no selected application chunk over **100 ms**;
- the longest attributable construction task is at least **75% shorter** than the fresh reference, without dropping or postponing required work until after ready;
- median bootstrap-to-ready time is no more than the reference median plus **the greater of 10% or 500 ms**; report both total CPU and wall-time tradeoffs;
- progress remains truthful, cancellation/retry is observed between bounded chunks, and all exact-output checks pass.

Treat unavoidable native/driver calls separately and retain their durations. Do not call a long selected construction loop “external.” If a target is missed, report it and keep the affected acceptance incomplete.

For first playback, report every RAF mean/P95/max, long task, real/simulated progression, world miss versus hit, scene/HUD React and renderer CPU. Reproduce/attribute any ≥500 ms application stall; no universal all-context fix may be inferred from a clean rerun. If the historical slowdown cannot be reproduced, label its cause unresolved and keep its dated evidence intact.

Use low-overhead recording for acceptance. CPU stacks, screenshots, full inventories and GPU queries run separately. Preserve failed runs and exact exclusion reasons; restarting into a fast context is not an acceptance method.

Check the same five warm windows from Stage 7B at unchanged quality: Fuel 78→104 at 1×/2×, Landing 176→206 at 1×/2×, and 90 real seconds of Fuel aftermath from 360 at 2×. Report three paired repetitions and any material CPU/RAF regression. No new 25% steady-state target is introduced.

## 10. Integration and resource lifetime

Exercise real initialization cancellation/failure/timeout/retry and native WebGL loss/restoration, including loss during graphics preparation and during Play. Verify retained latest camera/time, correct gates and no autoplay.

Check all 24 camera options, all three speeds, paused orbit/pan/zoom/recenter, seek to 7200 and back, restart and native focus/keyboard behavior. Check complete layouts at 1280×720, 1280×540 and 1440×900.

After loading, run one fresh uninterrupted **ten-real-minute 2× aftermath** session and five warmed restart/seek/all-camera cycles. Include repeated initialization cancellation/retry ownership inventories separately.

Preserve resident actor IDs, 910 fixed world uploads, 26 legitimate response buffers, all 231 pool capacities and existing cache bounds. Record any bounded initialization-owner memory cost explicitly. No accumulating workers, staging buffers, geometries, listeners or readiness jobs.

Allowed checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`
- `pnpm exec tsc -p tsconfig.node.json --noEmit`
- `pnpm lint`
- `pnpm test:run --maxWorkers=2`
- `git diff --check`
- the existing development server and actual browser inspection.

Do not run `pnpm build`, `vite build`, `tsc -b`, the combined `pnpm check`, repository-wide formatting, dependency installation or framework upgrades.

## 11. Delivery and completion

Create `STAGE7C_ACCEPTANCE.md` with the fixed reference, selected causes, import/bootstrap trace, ownership/progress design, exact-output checks, all paired startup/first-play/warm results, failed diagnostics, memory/resource bounds, recovery, permitted checks and remaining limits.

Update `ITERATION_PLAN.md`, `STAGE5_INTEGRATION_READINESS.md` and `changelog.md` with the verified result. Preserve earlier dated acceptance. Evidence helpers should be bounded, optional and independent of default checks.

Mark Stage 7C COMPLETE only when responsive-startup, exact scene/runtime preservation and ownership/recovery acceptance pass. An unresolved historical playback slowdown may remain explicitly unresolved; any newly observed first-play application stall still needs an honest account and cannot be silently excluded.

Finish with a concise report of what became responsive, measured startup cost/tradeoffs, validation and remaining limitations. Do not invent Stage 7D, add content/audio, or expand into a general rendering/state-framework rewrite.

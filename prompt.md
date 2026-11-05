# Post-Core Stage 7D — Warm Playback Stability and Regression Recovery

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber and Tailwind CSS. The viewer observes an authored operation and indefinite aftermath through spectator cameras and time controls.

This is a focused implementation and verification task. Establish why measured warm playback varies so widely, correct reproducible application or measurement faults, and verify the result against a fixed current reference. Preserve the responsive startup and the exact accepted scene/runtime.

## 1. Starting point and bounded purpose

Start from completed Stage 7C commit `e817b1c`. Stages 1–6 and post-core Stages 7A/7B/7C retain their dated completion and explicit limitations.

The recorded starting checks are **766 tests across 70 files**, both TypeScript no-emit checks and zero lint errors/warnings. Preserve 51 events, 24 camera IDs, 35 persistent actor roots, 64 LAV wheels and 65 landscape batches.

Stage 7C completed responsive deterministic CPU preparation: selected slices have 8.4–8.7 ms P95 and 31.9 ms maximum, median ready time is 3750.6 ms, and the shell handles input before heavy construction finishes. Keep its shared exact kernels, finite resource ownership, cancellation, retry and graphics handoff.

Its playback evidence remains materially inconsistent:

| Recorded Stage 7C comparison | Fixed 7B reference → completed 7C |
| --- | --- |
| Moving Landing 1× actual-world P95, median of three | 10.3 → 13.4 ms (+30.1%) |
| Moving Landing 1× scene React P95 | 60.9 → 63.3 ms (+3.9%) |
| Moving Landing 1× HUD React P95 | 15.4 → 19.1 ms (+24.0%) |
| Fuel aftermath scene React P95 | 45.7 → 48.1 ms (+5.3%) |
| Changed 600.082-real-second 2× aftermath RAF | 32.72 / 83.30 / 400.10 ms mean/P95/max; 4385 long tasks |

Both sides contain fast and slow contexts. A3 is near the display floor; A1/A2 and several reference windows are slow. These observations establish a problem to investigate, not proof that Stage 7C source changes caused every slowdown. The historical Stage 7B display-floor cohort cannot substitute for a fresh matched reference.

The primary scope is **live playback cost and trustworthy regression recovery**. Residual 510–519 ms initial React mounting and 200–246 ms first-draw work remain recorded but are outside a separate startup rewrite in this round. No new content, scenery, events, audio or quality redesign.

## 2. Read and trace first

Read `AGENTS.md`, `ITERATION_PLAN.md`, `STAGE7C_ACCEPTANCE.md`, `STAGE7B_ACCEPTANCE.md`, `STAGE7A_ACCEPTANCE.md`, `STAGE6C_ACCEPTANCE.md`, the integration summary and relevant changelog records.

Inspect:

- `src/scene/BattlefieldScene.tsx`, `src/App.tsx`, `src/ui/SimulationHud.tsx` and camera subscriptions;
- `src/simulation/runtime.ts`, `lavDeployment.ts`, `lavAftermath.ts`, terrain/support samplers and their exact-input caches;
- active LCAC/LAV/support-wheel models, smoke/fire/effect subtrees, instance updates and renderer submission;
- `src/initialization/`, generator drain paths, terrain/presentation/layout owners and `src/scene/readiness/`;
- the fixed-reference fixture/source-audit chain and current resource-bound diagnostics.

Review the optional `stage7c-review.local/README.md` and actual measurement helpers, especially the controlled Vite runner, probe installation/reset, React/world wrappers and warm-window schedule. Inspect older Stage 7B helpers when comparing the historic evidence. Default checks must remain independent of optional evidence.

## 3. Fix the experiment and audit measurement overhead

Use an immutable archive of **`e817b1c` as the primary before reference**, with the existing installed dependencies. Record the served source identity and exact opt-in transforms for every viewer, including the changed working tree.

Keep the same development/StrictMode setup, browser, visible owned viewer, device, CSS/drawing-buffer size, DPR 1, antialiasing, shadows and schedule. Only one owned renderer may run during measurement. Record actual visibility, CPU emulation, refresh cadence, active profiler state and module/browser/driver-cache conditions per context.

Before implementation:

1. Run an A/A repeat of unchanged `e817b1c` for moving Landing 1× and 90-real-second aftermath to estimate context/recorder variation.
2. Compare a minimal bounded RAF/Long Task recorder with the fuller low-overhead React/world recorder under the same workload. Quantify observer cost. Detailed sampled profiles, native GPU queries, screenshots and full inventories remain separate.
3. Verify single installation/cleanup of wrappers, subscriptions, observers and timers; reset/export ownership and bounded buffers; no hidden per-frame scene traversal, repeated development reload, lingering CPU sampling or accumulating callbacks.
4. Verify that completed CPU preparation has zero active/staging owners and no pending construction channels/tickers, and that graphics jobs are complete throughout warm playback.
5. Use `9c0208b` only as a separately labelled historical-control checkout if needed to test a suspected Stage 7C change. Do not compare new measurements to archived fast numbers as if they were paired.

Freeze the measurement contract, comparison order, selected workload, source/harness hashes and numerical acceptance before changing application code. A harness correction must be applied identically to both primary versions and followed by a new complete fixed cohort; preserve the earlier flawed evidence and its specific defect.

Do not repeatedly create contexts until one is fast, force collection between selected runs, disable StrictMode, reduce recording only on the changed side, clear unrelated browser data or silently omit slow runs.

## 4. Establish causes before selecting fixes

Reproduce the five warm windows:

- Fuel T+78→104 at 1×;
- Landing T+176→206 at 1×;
- Fuel T+78→104 at 2×;
- Landing T+176→206 at 2×;
- Fuel aftermath from T+360 at 2× for 90 real seconds.

Separate actual world cache misses, shared exact-time cache hits, contact/query counts, allocation work, scene/HUD render, commit-effect callbacks, uploads, renderer CPU, native queries and RAF/Long Tasks. World derivation is nested in React; do not add overlapping timings.

The exact-time shared world cache already exists. Measure its callers before alleging duplicate full derivations. The Stage 7B terminal cache is already effective after hold/dust expiry; another settled-only cache does not explain moving Landing.

For slow and fast contexts, compare actual call/render/query/update counts at equal logical samples, not just elapsed totals from different amounts of simulated progress. Record whether the same work becomes slower or additional work appears.

Use a bounded sampled profile in a separate reproduction of the affected window. If a spike does not recur, its cause remains unresolved; stacks from another ordinary interval cannot explain the original complete task.

A regression claim needs a controlled change that reproduces or removes the effect. Test one suspected application/harness/initialization difference at a time. Do not assign OS, GC, thermal, driver or browser causes without evidence. A long RAF gap with no matching task is still an unexplained gap.

## 5. Implement the smallest proven correction

Correct actual defects found in measurement lifecycle or application work. If a recorder defect explains the apparent release regression and clean controls establish that, deliver the corrected optional recorder and evidence without manufacturing an application rewrite.

Where a live application hotspot is established, reduce that work in the existing architecture. Candidates include time-driven scene/HUD invalidation, unchanged model/effect subtrees, allocation-heavy support paths and redundant uploads. Existing memoization and exact support optimizations must be measured before extending them.

Keep comparisons/selectors complete for every visible primitive input, boundary, resource identity and clock dependency. Backward seeks, alternating actors, scene recovery and newly visible views must invalidate correctly. Do not leave stale state behind camera visibility or memo boundaries.

If an existing R3F ref/update path is used, prove same-frame agreement with the logical world and camera. Preserve paused inspection, all mechanical/effect clocks, update ordering and persistent roots. Do not move all rendering into a new imperative framework or spread a broad state-management migration across the app.

Any cache needs finite ownership, complete exact input keys and immutable returned snapshots. Keep route tables, support-cell ordering, finite-radius tire math, suspension iterations, signed wheel travel and station-72 handoff exact. No time quantization, lower update rate, approximate contact math or skipped simulation samples.

For an application optimization, select a named live CPU component before editing and target at least **20% lower median-of-three P95** in its affected window, supported by reduced work/call/allocation counts or an independently verified cheaper exact kernel. Do not relabel a missed target after measuring. A demonstrated measurement-fault correction follows the independent proof path above and is not claimed as an application CPU speedup.

## 6. Preserve accepted startup, state and picture quality

Keep the complete fixed-step driver and cap/overshoot policy byte-identical. Preserve every active actor/weapon/contact/runtime field, event/outcome, route, hold, dust/fade/light schedule, source attribution and observation through 7200/backseeks.

Retain all authoritative files and historical fixtures, tree/landscape layout, geometry/index/attribute/bounds/support bytes, all 51 events and 24 camera IDs. No visible humans, occupants, crew, casualties, articulated characters or humanoid silhouettes.

Keep DPR/resolution, antialiasing, shadow quality, materials, effects, lights, geometry, draw visibility and actor populations. No lower-quality configuration or disabling StrictMode to meet timing targets.

Preserve the early shell, shared deterministic CPU kernels, atomic publication, synchronous ready-state API values, browser sampler gate and finite actual mounted geometry owners. CPU initialization keeps its 20-second deadline and bounded yielding; graphics preparation keeps nine jobs and its 12-second cooperative budget.

Preserve failure/timeout/retry, stale-owner cancellation and graphics-only CPU reuse. Normal camera changes, restart and seeks do not reconstruct the scene or repeat preparation. Actual context loss retains latest time/camera and stays paused after recovery; no autoplay or queued intent.

Do not change dependency versions, add dependencies, upgrade frameworks, build or deploy. Preserve task-start `prompt.md`, `AGENTS.md`, package/lock bytes and all four dated Stage 6C/7A/7B/7C acceptance files during implementation.

## 7. Exact tests and rendered verification

Run all current golden/source/ownership tests with their original assertions and timeouts. Preserve the 4,963-world golden, Stage 7B's 386-world/242,561-query supplement and Stage 7C construction/presentation/source captures.

Add focused tests for the actual corrected fault: wrapper/listener ownership, selector invalidation, retained snapshot mutation, exact hot-kernel equivalence or another demonstrated behavioral risk. Avoid flaky wall-clock performance assertions in default tests.

Use exact file-level source exceptions with reasons and fixed Git references. No folder whitelist, golden regeneration or broad fixture duplication. Capture a compact independent `e817b1c` supplement only for a demonstrated gap.

Repeat **25 complete lossless RGB pairs** at fixed time/camera/viewport, including all 24 ready-state roles and late Fuel. Require pixel identity with no masks or relaxed thresholds. Use the stable complete viewport capture method documented by Stage 7C.

Repeat **613 actual rendered checkpoints** with 35 roots, 64 wheels, 65 landscape batches and the existing mechanical/effect/GPU-clock agreement. Default tests must pass while optional review evidence is physically absent.

## 8. Paired playback acceptance

Collect at least **three alternating paired contexts per primary version**, with no replacement of slow contexts. Use the same warm visits, 24 paused RAF bookends and five-window schedule from Stage 7C.

Each context first completes startup and one natural first **1× T+0→206** playback with the same camera schedule, before rehearsal. Report startup/interface/first-draw/ready times and all first-play gaps. Keep the responsive shell and selected CPU chunk bounds; median ready time must not regress beyond the greater of 10% or 500 ms versus the fresh current reference.

For every warm run report complete RAF mean/P95/max, Long Task count/total/max, real/simulated progression, actual world-miss and scene/HUD/renderer CPU distributions, hit/miss/work counts and recording capacity. Commit-effect callback timings are not total commit wall time.

Primary recovery criteria:

- the claimed application or measurement cause is independently reproduced and its correction verified; an unexplained fast rerun alone does not pass;
- any application optimization meets its predeclared live-component target with exact behavior, and no primary window has a reproducible application CPU regression exceeding the greater of **10% or 1 ms** in world-miss, scene/HUD or renderer P95;
- the moving-Landing and aftermath outcomes are assessed separately; an idle-only or Fuel-only gain cannot close a demonstrated moving-work regression;
- observed variance is reported against A/A controls; overlapping/noisy results are labelled inconclusive rather than proven gains.

The local cadence goal is **RAF P95 ≤33.3 ms** in each controlled warm window and the sustained run. Report every miss, even if aggregate medians pass. Separate CPU, GPU and display cadence; no universal frame-rate or GPU improvement may be inferred.

For any new ≥500 ms application task, retain its surrounding timeline and causal evidence. Historical Stage 7B first-use stalls, the Stage 7C reference 528 ms task and 1949 ms unexplained RAF gap retain their dated unresolved status unless directly explained.

## 9. Sustained playback, resources and recovery

Run a fresh uninterrupted **ten-real-minute 2× aftermath** session after the fixed warm schedule, with no screenshots/full traversal/CPU sampling during pacing. Report simulated progression, per-minute RAF/CPU/Long Task distributions and the complete aggregate; a resource-stable slow run is not a smoothness pass.

Run five warmed equal-time restart/seek/all-24-camera cycles, comparing the same exposure path and endpoint. Preserve 35 resident roots, all 936 world records, 910 fixed uploads, 26 legitimate response buffers and 231 pools/9528 capacity. Record actual finite CPU owners, cache bounds, listener/observer/channel counts and memory tradeoffs.

Exercise CPU cancellation/retry, graphics failure/Retry, actual WebGL loss during Play and during preparation, retained latest camera/time, no autoplay, and complete zero-staging cleanup.

Check all 24 presets, three speeds, paused orbit/pan/zoom/recenter, direct 7200/backward seeks, restart, native focus/keyboard behavior and complete 1280×720, 1280×540 and 1440×900 layouts. No new product-facing diagnostic panel or performance controls.

## 10. Permitted checks and delivery

Allowed checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`
- `pnpm exec tsc -p tsconfig.node.json --noEmit`
- `pnpm lint`
- `pnpm test:run --maxWorkers=2`
- `git diff --check`
- the existing development server and actual browser inspection.

Do not run `pnpm build`, `vite build`, `tsc -b`, the combined `pnpm check`, repository-wide formatting, dependency installation or framework upgrades.

Create `STAGE7D_ACCEPTANCE.md` with the fixed current reference, A/A and recorder-overhead controls, predeclared targets, causal experiments, smallest correction, every primary run, sustained/per-minute results, exact preservation, ownership/recovery and unresolved limits. Keep helpers optional, bounded and reproducible without tracked bulk traces.

Update `ITERATION_PLAN.md`, `STAGE5_INTEGRATION_READINESS.md` and `changelog.md` from verified results. Preserve all dated acceptance and original evidence.

Mark Stage 7D COMPLETE only when causal correction/recovery, exact preservation and ownership acceptance pass. If the cause or a required target remains unresolved, retain an honest partial status instead of treating recorded regressions as resolved.

Finish with a concise report distinguishing verified application gains, measurement corrections, observed cadence and remaining limits. Do not invent Stage 7E, add content/audio, or expand into a new rendering/state framework.

# Post-Core Stage 7B — Busy-Scene CPU Cost and Moving-Vehicle Frame Pacing

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer follows an authored operation and indefinite aftermath through spectator cameras and time controls.

This is an implementation task. Reproduce the remaining busy-scene CPU costs, implement focused optimizations, verify exact runtime/render preservation, and deliver measured before/after results. Do not stop after profiling or repeat an idle-only optimization.

## 1. Starting point and bounded purpose

Stage 7A is complete in commit `62edc66`. Stages 1–6 and the dated Stage 7A acceptance remain complete. This round addresses a specific remaining workload, not a new content/visual phase.

The recorded baseline is **707 passing tests across 62 files**, app/node TypeScript no-emit checks, zero lint errors/warnings, 51 events, 24 camera IDs, 35 persistent actor roots and 64 LAV wheels.

Stage 7A already delivered nine real renderer preparation jobs, bounded readiness/retry/context recovery, reusable owned model subtrees, resident defense resources and at most eight exact terminal LAV payloads. Keep those improvements.

`STAGE7A_ACCEPTANCE.md` records these after-7A warm-window results:

| Interval                                       | Mean / P95 / max RAF ms |
| ---------------------------------------------- | ----------------------- |
| Fuel T+78→104, 1×                              | 20.24 / 49.90 / 83.40   |
| Landing T+176→206, 1×                          | 19.92 / 33.50 / 100.10  |
| Fuel T+78→104, 2×                              | 23.93 / 50.50 / 116.70  |
| Landing T+176→206, 2×                          | 22.79 / 50.00 / 100.90  |
| Fuel aftermath from T+360, 2×, 90 real seconds | 21.08 / 50.00 / 66.80   |

The recorded Fuel outlier includes 84.2 ms combined React render; a late-landing outlier includes 19.4 ms world work and 75.3 ms combined React render. World work is inside React and these durations can overlap; do not add them as independent costs.

First-play P95 is already around 17–18 ms and the ten-minute stationary-aftermath P95 rounds to 33.30 ms. This task must improve measured **busy Fuel and moving/contact Landing** work. Improving only settled vehicles does not meet its purpose.

Initial synchronous terrain/coast construction, the unproven external cause of one 283.4 ms first-play gap, and a general GPU/quality redesign are outside this bounded round. Keep those historical limits explicit.

## 2. Read and inspect first

Read `AGENTS.md`, the current plan, `STAGE7A_ACCEPTANCE.md`, `STAGE6C_ACCEPTANCE.md`, the current integration summary and dated changelog records.

Inspect:

- `src/scene/BattlefieldScene.tsx`, `src/App.tsx`, `src/ui/SimulationHud.tsx`;
- `src/simulation/runtime.ts`, `landingCraft.ts`, `landingAftermath.ts`, `lavDeployment.ts`, `lavAftermath.ts`;
- `src/scene/world/landing/landingTerrain.ts`, its compact support-cell index and actual rendered support contracts;
- `src/scene/vehicles/LandingModels.tsx`, `LandingCrafts.tsx`, `stage7aModelReuse.test.tsx` and the other memoized vehicle/mechanical paths;
- active fuel/ammunition/smoke/fire/effect renderers, instance uploads and bounds updates;
- `src/scene/camera/CameraRig.tsx`, `cameraFraming.ts`, shadow coverage and viewport/follow behavior;
- `src/scene/readiness/`, current caches, source audits and preservation tests;
- package scripts and existing measurement utilities.

Optional profiling/evidence is indexed in `stage7a-review.local/README.md`. Use the accepted visible, isolated, matched-window runs; hidden/competing-viewer diagnostics are not the baseline authority. Default checks must work without ignored evidence.

## 3. Preserve the accepted application

Keep every active-world value exact through scripted and aftermath observations: actor/weapon/effect/runtime fields, all wheel/support/suspension values, event/departure/hold schedules, source attribution and outcomes.

Preserve the 51 events, 24 presets, camera framing/manual offsets, complete Stage 6C visuals, shadows, soft effects, geometry, terrain/support queries, landscape/tree layouts, authorities and historical fixture bytes.

Keep selected resolution, DPR, antialiasing, StrictMode, shadow quality, effect populations, light variants, native controls and runtime labels identical in before/after comparisons.

Do not change the fixed-step driver or its cap/overshoot policy, quantize moving actor time, lower update rates, skip authored samples, approximate contact math or replay fewer events to improve cadence.

Do not introduce new actors, combat, audio, visual assets, dependencies, framework upgrades, quality presets or a new application/state/rendering framework. No production build or deployment is part of the task.

Never create or imply visible humans, crew, occupants, casualties, articulated characters or humanoid silhouettes.

## 4. Reproduce and attribute the actual busy cost

Create a fixed reference from `62edc66`, using the same controlled development configuration, visible browser surface/device, viewport/drawing buffer, DPR and measurement schedule as the changed app. Keep StrictMode enabled on both sides.

Profile the five windows in section 1. Separate:

- active world cache misses versus shared exact-time cache hits;
- moving support/contact/road work and finite table initialization;
- React render versus layout/commit work, component render counts and props;
- HUD versus scene/camera/effect reconciliation;
- instance/bounds/material uploads and renderer CPU submission;
- actual GPU queries where supported, RAF gaps and long tasks.

Do not assume two world consumers perform two complete derivations: the shared exact-time last-result cache already exists. Do not assume creating fewer JSX elements fixes a hotspot without measuring the affected render/commit path.

Use low-overhead timing for accepted runs. Perform detailed CPU/React stacks, screenshots and full scene inventories separately. Mark overlapping parent/child/world timings explicitly instead of double-counting them.

Identify at least one live CPU/reconciliation hotspot in Fuel and one moving/contact hotspot in Landing before selecting changes. Record the baseline call/render/allocation or query counts needed to demonstrate that the work was actually removed.

## 5. Narrow React and render invalidation

Use measured data to reduce updates to unchanged actor, mechanical, status or effect subtrees. Stage 7A already memoizes many exact-input assemblies; extend or refine only the remaining proven paths.

Useful candidates include:

- HUD rows/disclosures whose displayed values have not changed;
- immutable emitter/source descriptors that unnecessarily invalidate shared effect resources;
- vehicle/camera props recreated despite unchanged relevant fields;
- repeated traversal/bounds work and equivalent buffer uploads;
- per-tick reconciliation of hidden or completed subtrees whose relevant rendered inputs are unchanged.

Comparators/selectors must cover every field that affects the rendered result: transforms, wheel rotation/steering/suspension, fans/lights/gear/radar, damage, visibility and effect phase. Never label a moving object unchanged because its ID or parent array is stable.

Keep actor roots/resources resident and stable. Do not unmount actors to reduce React cost or lose readiness/model resource ownership.

If skipping an invisible render update, retain the exact active world and root contracts, and update the model before its first visible draw after any camera/seek/departure change, including paused camera movement. No one-frame stale pose, missing effect or backseek ghost is acceptable.

Display-level memoization may use the existing formatting precision, but do not feed a rounded HUD timestamp back into world derivation or disturb the scene's current snapshot. Every event/count/status boundary still updates correctly.

Avoid broad deep-equality passes, deep-cloning/freezing every world, unsafe hooks/ref mutations, or rewriting the entire scene as an imperative graph. Keep changes focused and lint-clean.

## 6. Optimize exact moving support and shared calculations

Preserve the current finite-radius tire solver, deck/ramp/toe transitions, station-72 road handoff, 0.5 m road support tables, signed wheel integration, quaternion fit, suspension and dust schedules.

Reduce measured redundant work through exact-input reuse, immutable precomputed constants, allocation reduction or more efficient candidate lookup, where useful. Keep the same triangle/candidate ordering, tie-breaking, barycentric arithmetic and full numerical output.

Do not replace live contact with approximate interpolation, coarser samples, a new suspension model, pre-recorded time animation or cached nearest timestamps. Do not change boundary tolerances to excuse differences.

Keep returned world snapshots immutable. Scratch buffers may be reused internally only when no later query changes a previously returned pose/wheel/effect record.

The single exact-time world cache and Stage 7A's at-most-eight terminal payload records remain bounded. A moving payload may not use a terminal cache before its actual hold and final dust expiry.

Any new cache needs explicit keys for all true inputs, finite ownership/capacity and correct behavior on backseek, alternating actors, direct late seeks and context/resource replacement. No unbounded map of worlds/wheels keyed by arbitrary time or position.

If a measured first-visit spike is finite immutable road-table construction, a bounded early preparation job may be justified. Integrate it truthfully with existing readiness accounting/budget and report time-to-ready cost. Do not hide ongoing live computation behind a longer loading phase.

Preserve existing compact support indexes and uploaded terrain attributes. Do not optimize terrain queries by silently changing which surface wins.

## 7. Protect readiness, controls and rendering

The existing nine-job renderer preparation, 12 s cooperative budget, Play/time gating, retry, cancellation and native context recovery already work. Preserve them; do not create another independently ticking store or readiness controller.

No normal seek/restart/preset change may trigger full preparation again. Any added immutable preparation work needs cancellation/generation isolation and bounded resource ownership.

Keep all 35 actor roots, 64 wheels, 65 landscape batches, 910 fixed uploads and 26 legitimate blast-response matrix buffers correctly owned. The 231 instanced pool capacities and route/birth caches remain bounded.

Do not stop dynamic bounds updates unless tested conservative bounds cover the actual complete soft-effect/actor envelope. Camera changes while paused must immediately reveal correct geometry/effects.

Preserve every playback speed, fixed scripted slider, direct observation input, keyboard/text/disclosure isolation, viewport framing, pause/fan/water/fire behavior and context-recovery no-autoplay rule.

A new HUD or stage-label change is unnecessary. Keep the accepted picture and controls while improving the work behind them.

## 8. Exact and visual preservation

Use existing immutable golden captures where they already cover the unchanged core. Add a compact fixed-`62edc66` supplement for uncovered moving/contact/busy boundaries before implementation; do not duplicate large capture suites unnecessarily or regenerate old expected values.

Require full unprojected active-world equality. Include all eight LAV transitions, moving near/road handoffs, every bend/brake/hold, mixed support, active dust and relevant Fuel/ammunition/light/secondary phases through 7200.

Test optimized support helpers against the exact reference over dense moving inputs and adversarial triangle/cell/tie boundaries, not only final holds. Test histories in different orders and retain immutable prior snapshots to expose accidental mutation.

Keep historical fixture/authority bytes and original timeouts. Enumerate only exact intentional source paths/reasons, retain fixed-Git audits and current active-path tests, and preserve unrelated source checks. No directory exemptions or actor/effect field projections.

Repeat the accepted complete fixed-pose RGB comparisons for all 24 roles plus late Fuel, at equal time/camera/DPR/AA/controls state. Keep the full image comparison if output remains deterministic; no broad masks or relaxed thresholds to hide a visual regression.

Verify actual rendered root/quaternion/wheel state at the existing 227 checkpoints, supplemented by changed-path stress samples. Caches and memoization must preserve real rendering, not only JSON snapshots.

## 9. Before/after measurements and completion criteria

Run at least three paired repetitions of each of the five warm windows in section 1. Use the same warm-up visits, 24-frame paused settle, actual Play control, preset schedule and low-overhead recorder on both sides.

Report every run's mean/P95/max RAF, application long-task count/total/max, actual world miss timing, scene/HUD React render/commit cost, renderer CPU and relevant query/update counts. Record real elapsed and simulated time; the inherited driver may not advance at exactly speed × wall time under stalls.

The required improvement is a reproducible reduction in attributable live CPU/reconciliation cost in **both Fuel and moving Landing**, with no state/visual/readiness regression. Working target: at least 25% lower P95 of the measured dominant application CPU component in each workload, and P95 RAF <=33.3 ms where the local pipeline permits it.

Do not complete the round based only on an idle/terminal-world speedup, a single best run, changed instrumentation, or compile-count reductions. Set the comparison/acceptance plan from the fresh baseline before editing and document target misses without moving the goalposts afterward.

Keep no >=500 ms application-attributable stalls and do not regress the already improved first-use path. External/browser gaps remain in raw tables and need concrete attribution; absence of a long task is not proof of a particular OS cause.

Keep GPU, CPU and RAF results separate. Existing mixed GPU measurements are not automatically explained by CPU optimizations, and unchanged calls/triangles do not prove equal GPU execution cost.

## 10. Fresh integration verification

Run permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

No builds, `tsc -b`, combined `pnpm check`, repository-wide formatting, dependency changes or framework upgrades. Keep zero lint errors/warnings without disabling rules.

Run a complete fresh-context first 1× T+0→206 playback on each version, without prior timeline rehearsal, to check readiness/first-use regressions. If preparation changes, additionally compare its startup cost over three fresh contexts; do not reuse a warmed after context as a cold result.

Exercise all 24 cameras, both busy-window speeds, 0.5×, paused camera/effect controls, direct seeks through 7200 and back to 0, restart/recenter, keyboard/text isolation and 1280×720 / 1280×540 / 1440×900 layouts. Keep native failure/retry/context-recovery behavior verified, especially if touched.

Run a new ten-real-minute low-overhead 2× aftermath session and at least five warmed equal-time restart/seek/all-camera resource cycles. Inventory stable roots/static uploads, legitimate response updates, all pool capacities and every new/existing cache bound.

Detailed captures/profiles/inventories run separately from pacing. Use one visible owned test viewer at a time with no competing renderer; do not disable StrictMode, hot-reload during accepted runs, or omit slow intervals. State browser/driver cache conditions.

Diagnostics/evidence are optional, opt-in and bounded under `stage7b-review.local/`. Default tests must not require ignored files or a live GPU. Preserve invalid/interrupted samples as labelled diagnostics rather than acceptance evidence.

## 11. Documentation and handoff

Create a tracked `STAGE7B_ACCEPTANCE.md` recording measured Fuel/Landing causes, focused changes, exact helper/render/state preservation, all paired runs, readiness/startup tradeoffs, resource bounds, fresh checks and remaining limits.

Update `ITERATION_PLAN.md`, append `changelog.md`, and update the current pointer in `STAGE5_INTEGRATION_READINESS.md`. Keep `STAGE6C_ACCEPTANCE.md` and `STAGE7A_ACCEPTANCE.md` byte-identical as dated acceptance; their incomplete aspirations remain historical facts.

Mark Stage 7B COMPLETE only after the busy-scene CPU and preservation acceptance is verified. Stages 1–6 and Stage 7A remain complete. Do not invent another follow-up or add audio in this round.

The final handoff should lead with reproducible Fuel/moving-Landing CPU and cadence results, then fresh tests/browser evidence, report paths, readiness/resource effects and remaining limitations. Do not claim production-build validation, universal frame rates, a GPU speedup without measurements, new combat or visible personnel.

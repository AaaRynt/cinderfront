# Post-Core Stage 7A — First-Use Readiness and Frame Pacing

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer follows an authored operation and indefinite aftermath through spectator cameras and time controls.

This is an implementation task. Establish a reproducible performance baseline, implement focused readiness and frame-pacing improvements, run permitted checks, inspect the actual application, and deliver measured evidence. Do not stop after profiling or merely move all playback stalls into an unbounded loading screen.

## 1. Completed core and reason for this follow-up

Stage 6C is complete in commit `1bc6bdc`. Stages 1–6 remain complete for the agreed visual, scripted and bounded-aftermath scope. This is a separate post-acceptance hardening round, not a reopening of Stage 6.

The recorded Stage 6C baseline is **618 passing tests across 55 files**, both TypeScript no-emit checks, lint with zero errors/warnings, 51 official events and 24 camera IDs. These are inherited results, not fresh checks for this task.

`STAGE6C_ACCEPTANCE.md` explicitly records:

- first-use playback stalls up to 3.35 s, with other >0.5 s gaps near important event boundaries;
- first replay mean/P95 RAF of 21.76/49.0 ms;
- sustained 2× aftermath mean/P95/max RAF of 22.63/64.60/166.70 ms;
- mixed GPU timings despite substantial draw/triangle reductions.

Those observations motivate this round. They do not establish that every stall is shader compilation or that the warm P95 is entirely application work. Measure and attribute the actual causes, including development-server and capture/profiling overhead.

Deliver a responsive, truthful preparation phase and smoother first-use/steady playback at the existing visual quality. Preserve the completed scene, cameras, runtime and exact authored state.

## 2. Read and inspect before editing

Read `AGENTS.md`, `ITERATION_PLAN.md`, `STAGE6C_ACCEPTANCE.md`, the current summary in `STAGE5_INTEGRATION_READINESS.md`, and the Stage 6B/6C `changelog.md` records.

Inspect:

- `src/scene/BattlefieldScene.tsx`: Canvas/renderer setup, fixed-step `SimulationDriver`, environment and dynamic scene;
- `src/simulation/runtime.ts`, `runtimeTime.ts`, `store.ts`, landing/aftermath derivations, caches and preservation tests;
- `src/scene/camera/CameraRig.tsx`, `cameraFraming.ts`, `shadowCoverage.ts` and camera tests;
- `src/App.tsx`, `src/ui/SimulationHud.tsx`, keyboard/control integration and existing UI tests;
- shared effect/model resources, material/light variants, conditional effect mounting, shadow work, geometry uploads and per-frame instance/bounds updates;
- current source-audit helpers and historical fixture byte contracts;
- installed Three.js/React Three Fiber APIs and package scripts before choosing a warm-up mechanism.

Optional accepted evidence is indexed in `stage6c-review.local/README.md`. Its chronology, GPU and sustained reports are historical evidence; default checks must not require those ignored files.

Do not assume repeated calls are duplicate full derivations: `deriveRuntimeWorldState` already retains one shared exact-time result. Measure cache hits, timestamp order and actual work before changing that design.

## 3. Scope and invariants

Implement:

- a bounded, cancellable first-use preparation/readiness lifecycle;
- warm-up or early preparation for the measured costly shader/resource paths;
- focused reduction of measured repeated CPU/React/GPU-submission/allocation work;
- reproducible cold/first-play/warm/sustained measurements;
- exact preservation and actual browser verification.

Keep unchanged:

- every active-world actor/weapon/contact/effect/runtime field through the script and aftermath;
- all 51 events, routes, deaths, holds, fades, unload timing and 24 camera roles/IDs;
- Stage 6C framing/manual controls, visual materials/effect envelopes, shadows, horizon, lighting and HUD information;
- terrain/support/query outputs, all historical layouts, 32 trees, source authorities and fixture bytes;
- selected DPR, antialiasing, resolution, shadow quality, effect populations and visual detail in the comparisons.

Do not add combat, actors, audio, assets, new quality presets, a visual redesign, broad infrastructure, dependencies or framework upgrades.

Never create or imply visible humans, occupants, crew, casualties, articulated characters or humanoid silhouettes. Keep existing sealed vehicle presentation.

Do not run builds or change package/dependency versions. Preserve unrelated user edits.

## 4. Establish an honest baseline

Before implementation, measure fixed commit `1bc6bdc` under the same controlled development-server configuration, browser/device, viewport, DPR and capture policy planned for the after run.

Define four separate intervals:

1. navigation/mount to first usable UI and first rendered scene;
2. mount to declared readiness, including all visible preparation work;
3. first playback after readiness, including first appearances of major actors/effects;
4. warmed playback, seeking/camera changes and sustained aftermath.

For the baseline with no readiness mechanism, identify its equivalent first playable scene explicitly. Do not compare an already warmed after page to a fresh baseline page.

Use a fresh owned test page/WebGL context for each cold application run. State whether browser/HTTP/driver caches were reset or retained; a fresh context is not a claim that every system cache is cold. Do not clear the user's browser data.

Collect low-overhead timing first. Separate screenshot/video/large scene-inventory runs from frame-pacing measurements. Re-run baseline and after with identical instrumentation; do not attribute a lighter recorder's improvement to application changes.

Record frame gaps, long tasks where supported, CPU derivation/render/commit work, shader/program activity, geometry/material uploads and actual GPU timings where available. Correlate gaps with events near 13/36/48/104/121, initial road support creation, camera changes and late effects.

Distinguish application work from dev-server reloads, encoder stalls, background tabs, competing viewers and OS interruption. Exclude invalid runs with a concrete reason rather than silently discarding slow frames.

## 5. Preparation lifecycle and user-facing readiness

Add a small explicit readiness lifecycle separate from authored world state: preparing, ready, and a truthful recoverable failure/cancellation path.

Initial preparation runs with observation paused at T+0. It must not tick, seek, replay the scenario invisibly, emit official events, move actors, change the camera selection, or leave future damage/effects in the visible world.

Show concise preparation status in the existing Tailwind HUD. If progress is displayed, derive it from actual known work units; otherwise use an indeterminate label. No fake percentage or developer dashboard.

Keep the UI responsive and render the available paused scene during preparation. Gate user Play consistently for mouse and keyboard until required initial preparation is ready; explain that state on the control. Do not claim playing while secretly holding the clock, lose a queued intent silently, or auto-start without user intent.

Preserve the existing paused camera/inspection controls wherever safe. Any temporary renderer preparation state must restore the latest user selection/pose, not an obsolete snapshot.

Choose a measured critical warm-up set and a bounded preparation budget. Report time-to-ready and added startup work alongside reduced playback hitches. Preparing every possible thing with a long blocking task is not an acceptable result.

Restart/seek/preset changes on an already ready renderer must not repeat full startup preparation. Preparation is scoped to the actual renderer/resource generation and relevant material configuration.

Cleanly cancel/ignore stale jobs on unmount, renderer replacement or context loss. Dispose temporary owned resources once; do not keep stale ready flags across a new context. Provide a clear retry/fallback status if a necessary preparation operation fails.

## 6. Warm the actual resource and shader paths

Use installed renderer capabilities after inspecting their real API/behavior. Asynchronous compilation and incremental preparation are options, not assumptions of availability or completion.

Warm the actual mounted renderer, material/light/shadow configurations and resources that will be used. Compiling unused clones or a different WebGL context does not establish first-play readiness.

Cover the measured first appearances, including launch/defense, radar/harbor damage, fuel/ammunition effects, reinforcement, Pantsir 02 wreck, landing transfer and aftermath variants. Include transparency/fade and active light/shadow variants where tracing shows they trigger compilation.

Keep work incremental and cancellable; yield between bounded jobs where appropriate. A resolved JavaScript promise is not automatically proof that the costly GPU work has completed. Verify the later first real draws.

Reuse resident resources and fixed-capacity pools. Prefer stable shader/material configuration with uniform updates where appearance is unchanged, rather than repeatedly setting `needsUpdate` or creating variants during playback.

Preparing finite immutable route/support tables is allowed when measured useful, but must remain bounded and preserve exact candidate ordering and numerical output. Do not precompute a world at every future timestamp or introduce an O(runtime) cache.

Any temporary offscreen/staging render must preserve renderer target, viewport/scissor, camera, visibility, shadows, uniforms and visible runtime state. Test restoration under cancellation and overlapping user input. Do not flash future explosions or render them under a loading overlay.

Avoid new textures, external services or a persistent browser-cache scheme. This task should use current application resources and dependencies.

## 7. Reduce the measured steady-state work

Implement focused changes supported by the profiles. Useful areas to inspect include:

- repeated camera-fit projection/allocation when actual actor bounds and viewport are unchanged;
- unnecessary React reconciliation or DOM updates when formatted HUD values did not change;
- repeated bounds calculation, instance uploads or material invalidation despite unchanged data;
- resource construction at first damage/visibility changes;
- duplicate derivation at genuinely different consumer timestamps or avoidable allocation/GC;
- shadow/submission work repeated without an actual changed input.

Preserve the existing exact-time runtime cache semantics. Share a consistent current snapshot where useful; do not quantize actor time, reuse stale worlds, mutate a cached snapshot, or keep an unbounded map keyed by observation time.

Render-only caches need explicit finite ownership/keys, correct viewport/seek invalidation and bounded capacity. Reused vectors/buffers must not mutate previously returned camera frames or historical snapshots.

Do not remove dynamic bounds updates unless a tested conservative bound covers the full current smoke/fire/actor envelope. Culling and low upload counts must not cause missing effects when the camera turns.

Keep 35 persistent actor roots, 64 LAV wheels, response metadata, departure material ownership, soft effect quality and static uploads intact. Per-frame optimizations must match actual rendered transforms and effect phases.

Do not change the 30 Hz fixed-step driver, its existing delta/overshoot policy, playback speeds or absolute-time formulas to make cadence charts look better. Clock-policy redesign is outside this round. Report real wall-time versus simulated-time progression rather than skipping ticks or replay intervals.

Do not reduce resolution, DPR, antialiasing, shadow quality, lighting, smoke populations or scene content. The goal is responsiveness at the accepted presentation.

## 8. Performance targets and acceptance reasoning

Use the same local hardware/environment and representative views as the new baseline. Working targets after declared readiness are:

- no application-attributable >=500 ms first-use playback/camera/seek stall at the prescribed checkpoints;
- aim for worst first-use frame gap <=250 ms;
- aim for warmed and sustained P95 frame interval <=33.3 ms at 1280×720, DPR 1, at both 1× and 2× in the measured busy cases;
- demonstrate lower first-play hitch cost and lower measured dominant steady-state cost without a visual-quality regression.

These are local engineering targets, not a universal 60 fps or cross-device guarantee. Fix or explicitly attribute every remaining threshold miss. If a required hitch/steady-state improvement is unverified or unmet, keep Stage 7A's completion status truthful.

Report startup/preparation time and responsiveness separately. A reduction achieved only by hiding the same work in an excessive pre-Play freeze is insufficient.

If the lightweight baseline already meets a target and earlier acceptance gaps came from capture overhead, report that finding and compare the actual application costs under the same method. Do not invent a speedup. The round still needs a concrete justified readiness/performance improvement to claim implementation completion.

Use GPU queries only when supported/non-disjoint, with controlled ordering and idle comparison pages. GPU, CPU and RAF/long-task metrics answer different questions; report them separately.

## 9. Exact preservation and source-audit treatment

Capture the completed Stage 6C state from `1bc6bdc` before editing, including scripted history and representative aftermath through 7200, all-LAV transfer/handoff/bend/brake/hold and vessel/departure boundaries.

Require full unprojected active-world equality. Readiness/profiling metadata belongs outside the authored world. Preparation must leave time/event/actor state exactly unchanged and cold/warm paths must derive identical values.

Keep historical fixtures and authorities byte-identical, original timeouts and unrelated source checks. Never regenerate old hashes or omit actor/runtime/effect families to make tests pass.

For intentional performance/readiness source changes, enumerate the exact files/reasons, preserve fixed-Git historical byte audits, and add current behavioral/render/resource tests. Do not whitelist directories or validate only an unused legacy derivation.

Preserve Stage 6C visual acceptance: fixed camera transform/time/viewport/DPR/quality scene captures must match, allowing only controlled preparation-status UI differences. Use explicit narrowly justified image tolerances where GPU output is not bit-identical.

Retain current zero lint errors/warnings without disabling rules. Preserve accurate existing warnings/limits in historical records rather than relabeling them.

## 10. Automated and browser verification

Add meaningful coverage for readiness gating/status, actual work accounting, successful completion, failure/retry, cancellation/unmount and stale-job isolation. Test restart/context-generation behavior without requiring ignored browser evidence or a live GPU in ordinary unit tests.

Test full state preservation before/after preparation, exact optimized helper results, cache bounds/invalidation, render restoration, resource disposal and absence of future-event leakage.

Run permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

Do not run builds, `tsc -b`, combined `pnpm check`, repository-wide formatting, dependency changes or framework upgrades. These are development/no-emit results, not production-build verification.

Use at least three independent fresh-context application runs for baseline and after. Report each run, preparation cost, first-play gaps, long-task counts/durations, mean/P95/max RAF and time-to-206 rather than only the best run.

Run the complete first 1× T+0→206 playback after readiness without prior manual timeline rehearsal. Include normal preset requests and all first-use event boundaries. Then measure warmed repeats separately.

Exercise all 24 cameras at representative scripted/aftermath states; pause/orbit/pan/zoom; 0.5×/1×/2×; direct seeks through 7200 and back to 0; restart/recenter; keyboard/text/disclosure isolation; and 1280×720 / 1280×540 / 1440×900 layouts.

Verify actual GPU water/fire/smoke/fan/light pause behavior, 35 actor roots and 64 wheel transforms, scenery identity/upload stability, fixed effect pools and bounded route/birth caches after warm-up.

Run a fresh ten-real-minute low-overhead sustained aftermath session at 2× and at least five warmed equal-time seek/restart/all-camera resource cycles. Capture image/inventory evidence separately so profiling overhead is visible.

No hot reloads, competing viewers or encoder failures may be hidden in accepted timing runs. Chronological logs and sparse frames can substantiate uninterrupted playback; do not claim a partial video is complete.

Save optional local profiling/evidence in `stage7a-review.local/`. Diagnostics must be opt-in and bounded, not a permanently growing production log or a visible profiling dashboard.

## 11. Documentation and handoff

Create a concise tracked `STAGE7A_ACCEPTANCE.md` with:

- actual causes and measurements, distinguishing shader/resource/CPU/React/GPU and capture overhead;
- the readiness lifecycle, real preparation budget and user behavior;
- implemented optimizations and preserved exact/visual contracts;
- all cold first-run and warmed/sustained before/after results under the same settings;
- fresh automated/browser/resource evidence and explicit remaining limitations.

Update `ITERATION_PLAN.md`, append `changelog.md`, and update the current pointer in `STAGE5_INTEGRATION_READINESS.md`. Keep `STAGE6C_ACCEPTANCE.md` and all Stage 1–6 completion records as dated historical acceptance, not rewritten new performance results.

Mark only post-core Stage 7A COMPLETE after its measured readiness/performance and preservation acceptance passes. Do not invent additional roadmap rounds or add audio as part of this task.

The final handoff should lead with first-play/steady-state responsiveness and preparation cost, then fresh verification, report/evidence paths and remaining limits. Do not claim hardware-independent frame rates, production-build validation, deployment, new combat or visible personnel.

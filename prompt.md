# Post-Core Stage 7D Follow-up — Fixture Integrity, Capture Stability and Playback Diagnosis

Continue Stage 7D in the existing Cinderfront repository. Work from the reviewed tree that includes the corrected optional recorder and its 11 tests. Use `e817b1c` as the immutable application reference. Record the working tree and Git index at task start and preserve existing staged changes.

Read `AGENTS.md`, `STAGE7D_ACCEPTANCE.md`, `STAGE7C_ACCEPTANCE.md`, the current plan and `tools/playback-review/README.md`. The November 6 report is the evidence for this handoff. Keep its original runs, exact criteria and dated findings intact.

Stage 7D is **PARTIAL**. The verified work covers recorder attachment, cleanup and snapshot ownership, 613 rendered checkpoints on each side, native controls and recovery, and five warmed resource cycles. The ten-minute run reached T+1560 at **16.8 ms RAF P95** with zero Long Tasks. The remaining work covers the fixture byte guard, capture stability, playback causality and warm non-regression, and startup slice evidence.

## 1. Restore both original fixture captures

The independently captured Stage 7C reference files are available in the local evidence directory. Both have the exact SHA-256 already pinned by `src/initialization/stage7cConstruction.test.ts`.

| Original capture                                   | Tracked fixture                                                | Expected SHA-256                                                   |
| -------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `stage7c-review.local/construction-reference.json` | `src/simulation/fixtures/stage7cConstructionPreservation.json` | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7c-review.local/presentation-reference.json` | `src/simulation/fixtures/stage7cPresentationPreservation.json` | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

A read-only handoff check verified both capture hashes. The tracked versions equal the corresponding `e817b1c` blobs. Each tracked fixture has the same parsed JSON and the same non-whitespace JSON tokens as its original capture. The byte difference is JSON whitespace outside strings.

Recheck these facts before restoring the exact original bytes of both files. Preserve the pinned hashes and every test assertion. Treat the restoration as a provenance repair of the original independent captures. If either original cannot be located or verified, retain the failing guard and record the missing evidence. Use an independently archived copy only if its bytes match the pinned SHA-256.

Run the targeted Stage 7C construction tests, including the presentation hash and subsequent assertions previously hidden by the first failure. Run the full suite with the optional review folders absent and viewers closed. Verify that the restored fixtures are tracked, require no local evidence at test time and still match their pinned hashes after all checks. Keep the fixture diff limited to the verified serialization change.

## 2. Stabilize the full viewport capture

The original 25-pair comparison matched exactly in 21 cases. Preserve those files and the four failed pairs.

| Preset and time        | Changed pixels | Maximum channel difference |
| ---------------------- | -------------: | -------------------------: |
| Overview at T+0        |              3 |                          1 |
| F-35B 02 at T+20.1     |             81 |                          2 |
| Radar Hill at T+36.1   |            222 |                          2 |
| Fuel Storage at T+7200 |              3 |                          1 |

Same-source paused repeats already reproduce several of these differences. Separate viewport capture and compositing from scene rendering before changing application code.

1. Reproduce the four poses in a fixed A/A capture sequence with repeated captures in the same paused context and repeats in a fresh context. Include one previously exact pose as a control.
2. Confirm exact camera, viewport, drawing buffer, DPR, focus, font readiness, simulation time and paused mechanical/effect state. Verify served stylesheet parity. The report records an extra unused generated `.blur` rule in one root, which needs a controlled check before any attribution.
3. Compare the location and bounds of differences in the full screenshot, and use separate canvas and DOM/compositing diagnostics where supported. Keep these diagnostics separate from the full viewport comparison. Test one capture condition at a time.
4. Freeze a repeatable capture method and the designated capture for each pose before the new paired run. Keep native lossless 1280×720, DPR 1, full viewport, complete HUD, the existing antialiasing and shadow configuration, and the verified device-metrics override. Require 25 of 25 exact RGB pairs with zero differing pixels. Preserve every repeat. Masking, tolerance, rescaling and selecting the closest repeat invalidate the exact check.

If A/A remains unstable after the predefined trials, report the reproduced difference and keep exact RGB open. Keep the rendered checkpoint result separate from the screenshot result.

## 3. Separate the two playback observations

In the November cohort, **17 of 30** warm windows exceed the fixed **33.3 ms** RAF P95 goal, with observed misses between **33.4 and 34.3 ms** and zero warm Long Tasks. The older severe slow state also occurred with minimal recording and produced P95 near 100 ms or above with many Long Tasks. Track these as separate observations. The 33.3 ms criterion remains exact at the documented measurement precision.

The November report observes the roughly 33.3 ms median interval before the first WebGL context in several pages. Make that the first causal probe. Use a lightweight RAF-only control and the existing startup-to-ready recorder under matched headed browser conditions. Compare timestamp distributions before WebGL, at ready idle and during live playback. Log focus and visibility, context creation, presentation cadence when available, cumulative thread CPU, actual work counts and Long Tasks. If a page changes cadence within a run, retain the transition and its timeline.

Predeclare a bounded diagnostic sequence and stop rules before measuring. Reuse the corrected recorder with one owned renderer and opt-in instrumentation. Start with moving Landing 1× and the 90-second aftermath window at 2×. Keep measured application code, browser configuration, actual served inputs, instrumentation and exposure matched. Apply one independently observable variable at a time. Use a same-context reversal where feasible to establish whether it reproduces and removes the effect. Preserve all attempts.

For the severe slow state, arm a bounded capture with a predeclared trigger tied to the older slow RAF/Long Task signature. Collect a separate sampled profile only when the trigger occurs. If it never occurs, record the attempt count and leave the original cause unresolved. Reuse the recorded attachment audit and React development diagnostics as evidence with their existing limits. A fast profile from another context cannot attribute the severe state.

Compare world misses, HUD and scene work, and renderer submission at equal logical samples. World CPU overlaps React timing. Use the recorded A/A spread and report reproducible CPU differences greater than the larger of **10% or 1 ms**. Select an application hotspot for correction only when the causal control identifies actionable work. The original **20%** target applies to any selected live component optimization. Record any measurement correction separately from product performance.

## 4. Recheck startup and the affected acceptance

Retain the early loading shell, exact CPU preparation kernels and finite owners, 20-second CPU deadline, nine graphics jobs and 12-second graphics budget. Compare the Stage 7C observed slice distribution of **8.4–8.7 ms P95 and 31.9 ms maximum** with the November observations of **8.6–10.5 ms P95 and 42.6 ms maximum**. Report these observations separately from the original Stage 7C fixed slice targets and Stage 7D ready-time budget. Recheck the November report's open slice criterion against the written contracts and current matched evidence. Keep any unresolved requirement visible.

Use the existing November evidence for passed checks whose inputs and method stay identical. Revalidate the affected checks after each verified correction. A timing or runtime change that warrants a new primary comparison requires the original three alternating paired contexts, natural first 1× play through T+206, five warm windows, and a fresh uninterrupted ten-minute 2× run. Retain every complete and interrupted run. A capture-method correction requires a fresh complete 25-pair comparison. A fixture-only restoration requires the targeted and full default checks.

For any application change, require exact world, geometry, support, construction and source audits, the 613 actual rendered checkpoints and fresh ownership, resource and native recovery checks. Preserve the fixed-step driver, 51 events, 24 cameras, 35 persistent actor roots, 64 LAV wheels, 65 landscape batches, exact ready-state visual quality, and restart, seek and pause behavior. Keep all human-visibility constraints from `AGENTS.md`. Limit scope to the recorded Stage 7D open criteria.

## 5. Checks and reporting

Use the existing development server and installed browser tooling. The permitted automated checks are the two TypeScript no-emit checks, `pnpm lint`, the relevant Vitest tests, `pnpm test:run --maxWorkers=2` and `git diff --check`. Repository rules prohibit builds and dependency-version changes. Keep existing dependencies and framework versions.

Append a dated follow-up to `STAGE7D_ACCEPTANCE.md` with the fixture provenance and test outcome, capture controls, every new timing attempt, causal evidence, and the status of each original open criterion. Preserve earlier acceptance reports and original artifacts. Update the iteration plan, integration notes and changelog from verified results.

Stage 7D may be marked **COMPLETE** only when its outstanding causal, warm cadence and non-regression, exact RGB, startup and fixture criteria are supported. Close any individually verified item and retain **PARTIAL** for unresolved criteria. The next implementation is this Stage 7D follow-up.

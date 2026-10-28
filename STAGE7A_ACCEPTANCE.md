# Stage 7A acceptance — 2026-10-28

**Status: COMPLETE, with the local cadence/GPU limitations below.** Bounded readiness, lower first-play hitch cost, lower dominant steady-state CPU work, exact preservation, recovery and sustained resource acceptance pass. The <=250 ms first-play and <=33.3 ms busy-window aspirations are not met in every interval; they are not presented as passed. Stages 1–6 remain complete; their dated acceptance has not been rewritten.

## Method and attribution

The reference is fixed commit `1bc6bdc`, extracted to `/tmp/cinderfront-stage7a-1bc6bdc`. The fresh-context cohort was recorded on 2026-10-27; remaining verification continued on 2026-10-28. Both sides use the same installed dependencies and controlled Vite development configuration (`hmr: false`, `watch: null`), one owned browser page at a time, 1280×720, DPR 1, antialiasing and the existing 1024 shadow map. Browser, HTTP and driver caches are retained; every first-play run creates an independent page/WebGL context. No user browser data was cleared. These are development/StrictMode measurements, not production-build results.

The opt-in recorder times RAF intervals, actual world derivations/cache hits, renderer CPU submission, React Profiler render durations, native shader/program operations, uploads and supported long tasks. React render duration excludes layout/commit effects. Detailed CPU profiles, actual non-disjoint GPU timer queries, images and scene inventories run separately from accepted low-overhead pacing runs. Initial HUD DOM appearance, first scene draw, readiness, first play and warm repeats are separate timestamps. HUD DOM appearance alone is not a claim that synchronous initial scene construction has finished.

Baseline first-play maxima are 450.0 / 266.7 / 250.1 ms, substantially below the old capture-heavy 3.35 s historical maximum. No speedup is inferred by comparing these methods. The new baseline still shows first-use program activity and sustained CPU/React cost. Separate checkpoint sampling identifies native `getProgramInfoLog` waits, GLSL preparation and resource creation; shader call duration alone undercounts those waits. Initial terrain/coast construction is a separate synchronous startup cost (about 2 s of sampled CPU in the diagnostic startup profile), not a playback shader stall. The steady aftermath profile identifies repeated road-wheel terrain queries after the LAVs stop and reconciliation of unchanged vehicle assemblies. The shared exact-time world cache already hits for the scene and camera consumers; it was retained.

## Implementation and preservation

- Renderer-scoped preparation has preparing/ready/failed/cancelled states, a 12 s cooperative budget, explicit retry and nine actual work units: eight observed point-light configurations and the existing departure transparency variant. Initial observation stays paused at T+0. Mouse/keyboard Play and initial time editing are gated, camera inspection remains available, and readiness never queues or auto-starts playback.
- Compilation uses the mounted renderer and actual mounted/shared geometry and material references, including hidden actor and resident defense-line resources. It polls captured program handles with `KHR_parallel_shader_compile`, then prepares uniforms/attributes. The installed `compileAsync` polls mutable `currentProgram`, which intervening visible frames can replace; polling captured handles avoids declaring the wrong variant ready. Supported non-parallel compilation remains a cooperative fallback. Later real draws are measured; readiness is not a claim of zero subsequent GPU work.
- Temporary staging does not render or change the camera, render target, viewport, visible actors or official events. Departure flags restore synchronously even on failure. Temporary instances dispose once; mounted geometry/material/light ownership is retained. Unmount, renderer replacement, context loss, failed construction, retry and stale asynchronous work are isolated by generation. Restart/seek/preset changes on a ready renderer do not repeat preparation.
- Immutable model element trees follow their existing finite resource ownership. Exact-input memoization skips unchanged vehicle, wheel, gear and mechanical subtrees while retaining live roots, fans, radar, lamps, steering, suspension, damage and impact-rock formulas. The old animated unlit fire cones reuse a unit geometry at the same radii/heights.
- At most eight exact terminal LAV payloads are retained after each hold and final dust expiry, keyed by actor, slot and actual carrier pose. Moving states, dust phases and backward seeks remain live. This removes repeated terrain queries for constant terminal wheels without quantizing time, retaining a per-time world map or changing the single-result world cache.
- The pre-edit fixed-commit capture protects 4,963 complete, unprojected active-world states through 7200, including the earlier transfer/handoff/bend/brake/hold and vessel/departure boundaries. Its SHA-256 is `456e732b6e0989875cfd3e5ac8dc245449bdfe94ea805ae414cc5b4e47e690c6`. Historical fixtures/authorities stay byte-identical. Exact intentional existing-file exceptions and reasons are enumerated in `src/test/stage7aSourceAudit.ts`, chained through fixed-Git historical audits. The complete fixed-step driver is independently byte-compared with `1bc6bdc`.

## Fresh verification

Both TypeScript no-emit checks, lint with zero errors/warnings and **707 tests across 62 files** pass. The full passing test run took 115.87 s with `--maxWorkers=2`. Existing original timeouts remain intact. Earlier loaded runs, including one with 30 timeout/hook failures and 97 skipped tests, are retained as diagnostics; the fixed-reference checks and final full run pass. New memoized model subtrees are traversed by current geometry inspectors, retaining the original Pantsir fingerprints and all existing geometry assertions. No historical hash was regenerated.

All 25 complete fixed-pose decoded RGB captures are bit-identical to the reference at equal time, camera, viewport, DPR, AA and paused speed-control state; no region mask or image tolerance was used. These cover all 24 camera roles plus Fuel/T7200. Optional evidence and reproducibility scripts live in `stage7a-review.local/`; normal checks do not require that directory or a live GPU.

## Fresh-context timing

All six accepted first runs complete the full natural 1× T+0→206 observation, with the same 24-request preset schedule and no prior timeline rehearsal. Each ends at simulated T+206.0333333. Baseline readiness means its equivalent first playable rendered scene. The earlier baseline T+0 setup waits are retained in the raw data; they do not rehearse future effects.

| Run              | HUD / first scene / ready (s) | Added preparation (s) | Mean / P95 / max RAF (ms) | Long tasks: count / total / max (ms) | To T+206 (real s) | Compile/link calls |
| ---------------- | ----------------------------: | --------------------: | ------------------------: | -----------------------------------: | ----------------: | -----------------: |
| baseline-first-1 |         1.257 / 5.161 / 5.165 |                 0.005 |    23.30 / 50.10 / 450.00 |                    664 / 46093 / 444 |          207.5664 |               1944 |
| baseline-first-2 |         0.495 / 5.455 / 5.479 |                 0.024 |    19.07 / 33.40 / 266.70 |                    364 / 21775 / 263 |          206.5339 |               1923 |
| baseline-first-3 |         0.389 / 5.266 / 5.287 |                 0.022 |    19.30 / 48.10 / 250.10 |                    354 / 21186 / 261 |          206.4985 |               1920 |
| after-first-1    |         0.313 / 3.446 / 4.294 |                 0.848 |    16.88 / 17.50 / 283.40 |                          1 / 54 / 54 |          206.2319 |                192 |
| after-first-2    |         0.266 / 3.342 / 4.090 |                 0.748 |     17.03 / 17.40 / 51.00 |                            0 / 0 / 0 |          206.0495 |                198 |
| after-first-3    |         0.292 / 3.982 / 4.917 |                 0.934 |     17.15 / 16.80 / 66.70 |                         8 / 449 / 59 |          206.0495 |                198 |

The first after run's 283.4 ms interval at T+29.2 is retained. It has 0.30 ms measured world work, 1.80 ms render CPU, 2.60 ms React render, no shader/upload activity and no associated JavaScript long task. It is an unresolved browser/compositor/OS scheduling gap, rather than a demonstrated 283 ms application CPU task. Thus the raw <=250 ms aspiration is not met in every run; the >=500 ms application-stall threshold passes. Other after maxima are 51.0 and 66.7 ms. No slow frame is removed from the tables. The precise external cause of that one gap is not established.

Post-scene preparation costs 0.748–0.934 s in the final cohort. Navigation/initial construction is separate: synchronous terrain/coast work remains before the first scene, and browser/server/driver caches affect startup. The shorter after startup is not presented as solely caused by these optimizations. The existing clock's cap/overshoot policy is unchanged; real progression and every run's elapsed time are reported instead of adjusting ticks to improve cadence.

Compile/link API calls during first play fall from 1920–1944 to 192–198 (about 90%). These counts are calls, not unique programs; some programs are released/recreated with transient resources. Preparation warms required live-resource configurations but does not claim that every future draw is free of GPU/resource work. All first-use appearances and subsequent real draws remain included.

## Warmed and sustained timing

The 2026-10-28 continuation uses the same visible-panel presentation and explicit 1280×720 CSS/drawing-buffer metrics on both sides, after an initially resumed hidden panel exhibited a 30 Hz ceiling. The reference context is closed before the changed context opens. An additional local viewer discovered during the first continuation reference pass was temporarily suspended; that pass is retained as `*-competing-viewer.json` and excluded. Prior-day warm data and the hidden-panel sample also remain indexed as diagnostics. No frame is removed from an accepted interval.

Matched busy windows follow warm-up visits to the same Fuel and landing episodes. Each starts paused at its exact time, settles the same preset for 24 frames, and uses the actual Play control and unchanged driver. These are targeted warm repeats, separate from the six complete fresh first plays. The table reports real elapsed time, rather than assuming speed × wall time is exact under the inherited driver cap.

| Warm interval                 | Reference mean / P95 / max RAF (ms) | After mean / P95 / max RAF (ms) | Reference / after real seconds |
| ----------------------------- | ----------------------------------: | ------------------------------: | -----------------------------: |
| Fuel T+78→104, 1×             |            126.69 / 229.30 / 611.90 |           20.24 / 49.90 / 83.40 |                36.973 / 26.033 |
| Landing T+176→206, 1×         |              29.81 / 66.70 / 150.00 |          19.92 / 33.50 / 100.10 |                30.118 / 30.050 |
| Fuel T+78→104, 2×             |              39.71 / 99.50 / 671.00 |          23.93 / 50.50 / 116.70 |                14.200 / 13.050 |
| Landing T+176→206, 2×         |              27.42 / 66.70 / 116.60 |          22.79 / 50.00 / 100.90 |                15.067 / 15.050 |
| Fuel aftermath from T+360, 2× |              29.94 / 66.80 / 150.00 |           21.08 / 50.00 / 66.80 |                90.050 / 90.033 |

All warm intervals have zero compile/link calls. The extreme reference Fuel repeat includes a 515.7 ms combined React-render sample and is retained; it is not the sole basis for claiming improvement. In the matched 90 s aftermath window, actual world-miss mean/P95 drops **3.449/5.10→0.252/0.40 ms**, scene React-render mean/P95 **15.166/54.30→9.596/25.70 ms**, and long tasks **366→62** (total **26357→3309 ms**). Renderer submission mean is **6.631→7.132 ms**; no universal renderer/GPU speedup is claimed. The terminal-wheel cache removes a measured dominant runtime cost while keeping the existing exact-time cache.

The <=33.3 ms warm P95 aspiration remains unmet in these short busy windows. Residual misses correlate with application React/render work, not shader calls: after Fuel 2×'s 116.7 ms interval includes 84.2 ms combined React render; the late landing 100.1 ms interval includes 19.4 ms world and 75.3 ms combined React render. These durations can overlap (world work is inside React), so they are not added as independent costs. Absolute moving-wheel terrain derivation is deliberately preserved. These are remaining development/StrictMode workload limits, not filtered external interruptions or a claim of meeting every cadence target. All after warm maxima remain below 250 ms and the >=500 ms application-stall requirement passes.

A separate fresh sustained session runs **600.0144 real seconds at 2×**, **T+360→1559.9999999999**, with **33597 in-interval RAF samples**, no pause, seek, restart, preset change, reload or recorder truncation. Mean/P95/max RAF is **17.86 / 33.30 / 83.40 ms**; the exact stored P95 is subject to timer precision around 33.3 ms. There are 106 long tasks, total 5974 ms, max 78 ms; compile/link calls remain zero. Mean world miss is 0.189 ms. The full session's P95 meets the local rounded target; it does not erase the short-window misses above.

## Rendered preservation and resources

All **227** rendered checkpoints through T+7200 pass with **35 persistent roots and 64 LAV wheels at every sample**. Maximum root position error is zero, quaternion error 5.162×10⁻⁸ rad and wheel-center error 9.095×10⁻¹³ m. All root/wheel identities and 65 landscape batch identities persist. Actual submitted water/wear uniforms, fan/ramp transforms, navigation and effect matrices agree with the current runtime. Full unprojected automated preservation remains independent of these render checks.

Across the ten-minute session, all **936 world mesh/resource/upload records** are identical. Resources remain **975 geometries / 340 materials / 3 textures / 312 programs / 2827 meshes** at the endpoint inventories; all 35 root identities persist. The wider shader preparation set retains more programs than the unprepared reference; this is a bounded readiness/memory tradeoff, not a leak-free claim based on one count. Four routes/two centerlines retain support counts `[1329,1311,1319,1306]`, wheel-arc counts `[1327,1309,1317,1304]`, at most eight settled payloads and 128 LAV births; the separate ground-dust birth cache is 128. Pools retain their fixed capacities.

The first final-context seek to T+7200 after this run derives the full world in 0.30 ms and returns four rendered frames in **77.6 ms** (worst observed interval 33.4 ms). This is a warmed late seek, not an independent cold-start claim.

After one full warm-up cycle, **five additional** restart/seek/all-24-camera cycles remain exactly **261 calls / 372946 triangles / 986 geometries / 340 materials / 3 textures / 325 programs** at equal T+360/LAV west. All world geometry/material/attribute identities, 35 roots, 64 wheels and 65 landscape batches persist. All 910 fixed mesh upload records remain unchanged; precisely 26 existing blast-response matrix buffers update legitimately on damage seeks. Separate post-context-recovery checks inspect **all 231 instanced pools** over five more cycles: every count stays within its attribute capacity, matrices remain finite and the complete capacity/population profile stays fixed at 9528 allocated slots. There are 183 persistent instance identities; 48 existing conditional effect instances remount across restart, without growing the population. Context restoration clears uploaded GPU resources; its first rewarming cycles are not conflated with the earlier five flat cycles.

## GPU, controls and recovery

Actual non-disjoint timer queries cover six fixed views in forward and reverse order, 45 draws per view (first five discarded). Pose, viewport, DPR, calls and triangles match exactly between versions and between orders. Median GPU milliseconds are:

| Fixed view         | Reference forward / reverse | After forward / reverse |
| ------------------ | --------------------------: | ----------------------: |
| Harbor T+104       |               7.269 / 3.727 |           7.215 / 7.548 |
| Fuel T+240         |               8.555 / 8.782 |           8.494 / 8.816 |
| Ammunition T+240   |               3.546 / 5.204 |           8.260 / 8.431 |
| BTR T+185          |               5.610 / 8.312 |           7.946 / 7.838 |
| Beach inland T+186 |               7.666 / 6.340 |           8.120 / 8.451 |
| Fuel T+7200        |               8.331 / 8.410 |           8.291 / 8.198 |

GPU results are mixed, including higher measured Ammo and Beach costs. Equal visible geometry/submission and exact images do not prove equal driver execution cost; order/driver/cache variability and additional resident prepared programs remain possible contributors, not established explanations. This round demonstrates readiness and CPU/React improvement, not a universal GPU speedup. Both query orders and all raw values are retained.

Actual controls pass all 24 roles, 0.5×/1×/2× Play/Pause, slider Home/End, direct T+7200 and backward/zero seeks, restart, recenter, paused orbit/pan/zoom, background Space/Enter/Home/End/arrows/Shift+arrow, and text/select/disclosure/scroll-focus isolation. Paused camera controls change pose without changing observation time; recenter restores the selected framing after damping settles. At 1280×720, 1280×540 and 1440×900, CSS viewport and drawing buffer match, the full status disclosure scrolls, controls fit without horizontal overflow and Play stays usable.

Actual drawn GPU water time, fire/smoke matrices, fans, navigation and fire lights freeze at equal paused time and change after Play. Permanent wear correctly stays capped at scripted T+180 during aftermath. Full runtime/render expectations pass before and after advancing.

A deliberate one-shot compiler failure produces a truthful failed status, disabled Play/time controls and Retry. Background Space/Right cannot play or seek. Actual Retry returns to ready with the full serialized active world and settled camera exactly unchanged, no autoplay and the original compiler restored. Native `WEBGL_lose_context` during playback pauses immediately and cancels readiness. A camera preset requested while lost remains the latest pose on restoration; a new generation finishes all nine units with unchanged full world/time, all 35 roots/64 wheels and no autoplay. Automated tests additionally cover initial T+0 gating/accounting, overlapping input, unmount/replacement, budget failure, stale jobs, cached pending-program retry and exact one-time disposal/restoration.

The final browser log has **zero JavaScript errors**, with only the inherited Three.js Clock deprecation warnings; intentional context-loss/restoration messages are expected diagnostics. Final app/node no-emit, zero-warning lint and whitespace checks pass against the frozen tested source. `prompt.md`, `AGENTS.md`, package/lock files and `STAGE6C_ACCEPTANCE.md` match their task-start hashes. No build, dependency/framework change, deployment, new combat/content, audio or visible people were introduced.

## Evidence and remaining limits

`stage7a-review.local/README.md` indexes the accepted six fresh runs, all six intermediate first-play iterations, matched warm windows, full 600 s raw trace, CPU profiles, both GPU orders, exact images, 227 rendered checkpoints, repeated resource inventories, actual controls/recovery and check logs. Detailed capture/inventory/profiling is separate from pacing. The third final first-play recorder fills only during later paused idle time; its complete accepted playback interval is retained. No partial video is claimed as complete.

The remaining limits are synchronous initial terrain/coast construction, residual development/StrictMode React and moving-wheel work in short busy intervals, the retained unexplained 283.4 ms first-play scheduling gap, mixed GPU costs and extra bounded shader/material residency. The 12 s preparation deadline is cooperative: JavaScript cannot interrupt a synchronous driver call. Results apply to this local hardware, retained system caches and development configuration; no hardware-independent cadence or production-build validation is claimed.

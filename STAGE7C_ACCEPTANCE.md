# Post-Core Stage 7C — Responsive Startup and Deterministic Scene Initialization

Date: 2026-10-30. Fixed reference: `9c0208bc65ed402fec44c8935d4708505c566f46`.

**Status: COMPLETE for responsive deterministic startup, exact preservation and ownership/recovery acceptance.** The fixed startup targets pass. Residual scene-mount blocking, material warm-window regressions and unresolved playback variability remain explicit below. Stages 1–6 and Stage 7A/7B retain their dated acceptance and limits.

## Fixed comparison and selected causes

The pre-edit implementation note is `stage7c-review.local/implementation-plan.md`. The reference is an immutable Git archive sharing the existing installed dependencies. Both sides retain StrictMode, identical controlled Vite configuration/instrumentation, one visible owned browser renderer, 1280×720 CSS/drawing buffer, DPR 1, antialiasing, shadows, effect populations and the unchanged driver. Development-module/browser/driver caches are warmed; fresh pages/WebGL contexts are not claimed to be cold installations.

The pre-edit trace has HUD DOM at 222.9 ms, first complete draw at 3000.9 ms and ready at 3755.9 ms. A 2506 ms self task starts at 276.5 ms. Selected nested spans are mainland 588.9 ms (including grid 205.4), refinement 614.3 (source triangle records 313.5, emission 162.0), support index 35.7, repeated coast construction 233.0/221.2, and first tree layout 165.3 including the 141.8 ms focused reservation sweep. Parent/child spans overlap and are not added. Separate sampled stacks confirm the corresponding vertex/triangle allocation, terrain math, attribute emission and coast scans. Native graphics calls and subsequent React mounting are reported separately.

Fixed goals: loading shell paints before selected heavy work and handles an actual accessible input while it runs; selected uninterrupted construction P95 ≤50 ms and maximum ≤100 ms; longest attributable construction task at least 75% shorter than the fresh reference; median bootstrap-to-ready no more than reference median + max(10%,500 ms). Target misses leave the affected acceptance incomplete. The CPU deadline is **20,000 ms**, including deferred dependency imports and selected preparation. Existing graphics preparation retains its separate **12,000 ms** cooperative budget and **nine** jobs. Combined bootstrap/scene/graphics/ready cost is measured, not hidden in another phase.

The fixed paired order is **B1,A1 / A2,B2 / B3,A3**. Every context starts at paused zero, records startup and natural 1× playback through 206 with the prior camera schedule, and only afterward rehearses the same warm visits plus 24 paused RAF before its five Stage 7B windows. Three complete repetitions per side are required. CPU stacks, images and full inventories remain separate from pacing. Every failed/partial diagnostic is retained with its actual reason.

## Bootstrap, exact work and ownership

`main.tsx` mounts `Bootstrap` and the existing CSS. The shell imports only React, a lightweight initialization controller and a tiny terrain gate; scene, simulation, Three.js and layout modules are deferred. Two animation-frame opportunities precede the heavy import. The shell uses native indeterminate progress, named product phases, an accessible disclosure, Pause and Retry. It derives no world and cannot queue playback/time input. Ready-state HUD DOM, labels, controls and precision are retained; graphics preparation uses its actual completion in a native progress bar.

Grid clipping, vertex/color generation, orientation, triangle extraction/refinement/emission, support constants/cell insertion and coast scans share the **same generators** with their synchronous APIs. The async driver drains bounded internal units with an **8 ms** target slice, then yields through an owned `MessageChannel` task. It checks cancellation/deadlines inside loops. Synchronous callers drain those identical kernels without introducing a second terrain authority. Original arithmetic, candidate order, rounding, normals, attributes and bounds remain exact.

Private terrain/support/coast staging publishes only complete immutable resources. Browser samplers are gated until that publication. The finite 721-sample focused movement reservation sweep retains its original actor/time order and never ticks the store or derives a complete future world. The default seeded tree layout is prepared with temporary geometry released in `finally`; custom seeds retain the synchronous path.

The 22 authored road and 19 ground-surface resources are prepared in private storage and published together. Borrowing requires every actual input to match its finite authored specification. Other inputs retain normal owned synchronous construction and never enter an arbitrary-input cache. Published geometry is the actual mounted geometry, not a retained duplicate. The mounted mainland and coast likewise borrow the immutable CPU owner. Component cleanup cannot dispose those shared owners; owned fallback geometry still disposes normally. Graphics-only recovery reuses completed CPU data.

Abort, failure, timeout, rapid retry and StrictMode cleanup invalidate the old generation. Abandoned work cannot publish progress, resources or an App. Incomplete iterators close, private geometries dispose once, buffers lose their owners, and pending channels/frame callbacks/listeners/timers release. An import that cannot be interrupted may finish, but an abandoned owner cannot use it. Fully completed immutable data has page lifetime and may be reused; partial data is discarded. App mounting and all required scene resources precede the existing graphics jobs. Readiness gates the actual Play/time controls; no autoplay or queued intent is added.

## Exact preservation and automated checks

Independent fixed-`9c0208b` captures cover every attribute/index byte and typed-array shape, groups/draw range, bounds, support Float64 constants and compact cell/candidate ordering for changed construction, plus reservation/layout/tree outputs. Additional independent fingerprints cover all 41 authored presentation geometries. The source/asset manifest protects 294 fixed files with exact file-level exceptions and reasons in `src/test/stage7cSourceAudit.ts`; older Git audit chains and unrelated live checks remain intact.

- Construction fixture SHA-256: `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8`.
- Presentation fixture SHA-256: `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3`.
- Several slice budgets, cancellation inside refinement, private-publication gates, disposal/retained snapshots, default/custom layout inputs, stale imports, failed work, deadline and StrictMode shell interactions pass.
- The existing 4,963-world and Stage 7B 386-world/242,561-query goldens remain unchanged, with all active fields exact through 7200. The complete fixed-step driver, historical authorities, fixtures and dated acceptance remain byte-protected.
- **766 tests across 70 files pass in 91.10 s** (91.33 s wrapper), with **all ten optional review folders physically absent** and all viewers closed. Original timeouts are unchanged. Both app/node TypeScript no-emit checks, zero-error/zero-warning lint and whitespace checks pass. Final protected-byte checks confirm the task-start prompt, AGENTS, package/lock and dated Stage 6C/7A/7B acceptance remain exact.

## Paired startup and playback results

All six startup captures and all six natural first plays plus thirty warm windows retain the fixed alternating order. No timing context is discarded or replaced. Startup times below are navigation-relative ms.

| Context | First contentful paint | HUD DOM / complete first draw | Ready after nine jobs | Selected chunk P95 / max | Largest startup application task |
| ------- | ---------------------: | ----------------------------: | --------------------: | -----------------------: | -------------------------------: |
| B1      |                    420 |                348.0 / 3206.6 |                4013.0 |              synchronous |                             2558 |
| A1      |                    116 |               2233.3 / 3009.7 |                3706.0 |               8.7 / 31.5 |                              519 |
| A2      |                    108 |               2271.7 / 3087.0 |                3998.6 |               8.6 / 31.8 |                              510 |
| B2      |                    304 |                256.2 / 2995.6 |                3812.3 |              synchronous |                             2476 |
| B3      |                    324 |                262.1 / 3058.2 |                3799.5 |              synchronous |                             2515 |
| A3      |                    108 |               2198.8 / 2973.4 |                3750.6 |               8.4 / 31.9 |                              511 |

Median ready time is **3812.3→3750.6 ms**, 61.7 ms shorter; the fixed upper limit is 4312.3 ms. The largest remaining startup application task is **519 ms versus 2558 ms**, **79.7% shorter** even when the residual React scene mount is included. Selected generator slices have **8.4–8.7 ms P95 and 31.5–31.9 ms maxima**, meeting ≤50/≤100 ms. First selected work starts at 141.1/134.2/131.0 ms, after the shell's content paint in every changed context. A1's actual disclosure input is handled at 261.7 ms, with 8.3 ms event-to-handler latency, while terrain construction is running. A2's wrong locator label and A3's stale native element ID miss the input window; these timing contexts are retained, not replaced. Separate native shell/ownership checks complete the interaction evidence.

Selected work takes **1854.5/1893.8/1846.9 ms** summed application slices, spread across 227/231/225 bounded slices. The union of measured construction/layout spans is **2129.9/2080.1/2104.9 ms before**, **1907.0/1944.3/1897.5 ms after** (median −9.4%). This is measured application work, not a sum of overlapping parent/child costs or all browser-process CPU. Reusing the completed mainland/coast and finite presentation geometry avoids repeated construction and duplicate full owners. No required work is postponed past ready.

The remaining React scene mount is still a **510–519 ms application task**, followed by **200–246 ms first-draw work**. These are reported separately from the selected data kernels and are not called external or unavoidable native work. Startup heartbeat maximum gaps are **2786.7/2693.3/2734.3 ms before**, **730.9/769.2/728.6 ms after**; the latter includes the residual mount/draw handoff. The change does not promise that every startup task is below 100 ms. Existing nine graphics jobs remain intact, costing **806.4/816.7/741.3 ms** after first draw before, **696.3/911.6/777.2 ms** after.

Sampled JS heap peaks are **487256183/460043213/427285087 bytes before**, **398535928/408256239/418426005 after**. Sampling every 25 ms cannot observe the interior peak of a synchronous blocking task, so these are sampled peaks, not guaranteed allocation maxima. Exact retained resource/storage bounds are recorded separately below.

B1's startup export accidentally followed the first-play counter reset. Its original startup RAF/world rows are unavailable; original phases, paint, module, heartbeat, heap, native-context and graphics-job records remain, and startup long tasks were recovered from the browser's buffered Long Task observer. Later startup exports precede the reset. No lost rows are invented or used for CPU counters.

The first responsive prototype handled its disclosure during construction, with first paint at 128 ms and selected slices mostly 8 ms, maximum 31 ms. Remaining React/ground construction was profiled separately. The complete finite-ground preparation prototype, with newly compiled development modules, records 4586.8 ms to ready and is retained as a loading-time diagnostic. Its warmed fresh-page repetition records 3615.2 ms to ready, a 485 ms React scene-mount task and selected slices at most 31.9 ms. Neither is used to erase the other or replace the three-pair acceptance.

An inspection connection reset occurred before the paired cohort; the setup viewer remained paused. Its startup interval is retained, while its later idle recorder reached capacity. No paired playback was interrupted by that reset.

### Complete first-play and warm results

Changed natural first plays have **16.75/16.80/284.30**, **18.00/17.60/250.00** and **16.68/16.80/33.40 ms** mean/P95/max RAF, reaching T+206 in **206.3998/206.9330/206.0331 real seconds**. No changed first-play application long task reaches 500 ms; maxima are 349/231/0 ms. This does not erase historical Stage 7B's 878/596/549 ms stalls or establish their cause.

The new third **reference** first play records a **528 ms self task** near T+113.4, with a 516.9 ms RAF gap. The corresponding recorded React render is 229.5 ms (222.9 scene, 6.6 HUD), commit-effect callbacks 13.2 ms, world 2.6 ms nested inside React, and renderer 10.9 ms; no shader compile/link or native query occurs in that frame. These counters identify substantial application reconciliation, but do not account for the complete task. A separate fresh natural reference replay through T+126, with the same camera schedule and a sampled CPU profile, reaches 126.0333 in 126.7498 real seconds. Its largest application task is 207 ms, so it does **not reproduce the 528 ms task**. Its stacks retain live world/HUD, support-wheel/model, smoke and React work; they cannot explain the unrecorded remainder of the original task. Both traces and the profile remain available. That remainder is not labelled OS, GC or unavoidable driver work. The second reference aftermath also has a **1949 ms RAF gap** without a matching ≥500 ms Long Task; its recorded React/world/renderer CPU is 1.9/0.1/3.5 ms. It remains unexplained and is not removed.

Warm behavior varies materially across contexts on both sides. Median Landing 1× actual-world P95 is **10.3→13.4 ms (+30.1%)**, scene **60.9→63.3 ms (+3.9%)**, HUD **15.4→19.1 ms (+24.0%)**. Median aftermath scene P95 is **45.7→48.1 ms (+5.3%)**. These regressions are retained; a clean A3 does not erase A1/A2. Other windows improve or vary, and all complete per-run measurements follow. This round neither claims a steady-state optimization nor reopens that scope. The newly measured context variability is not attributed to a particular external cause, and the historical 7B display-floor cohort remains a separate dated result.

All durations are ms unless seconds are named. Each M/P95/max uses the complete in-window samples; B is fixed 9c0208b, A is the changed application.

| Run               |       RAF M/P95/max | Long tasks n/total/max |   Real s | Simulated start→end |
| ----------------- | ------------------: | ---------------------: | -------: | ------------------: |
| B-r1-first        |  41.31/99.90/266.70 |        1613/119120/261 | 207.7332 |     0.0000→206.0333 |
| A-r1-first        |  16.75/16.80/284.30 |              4/681/349 | 206.3998 |     0.0000→206.0333 |
| B-r2-first        |   16.70/16.80/50.00 |                  0/0/0 | 206.0495 |     0.0000→206.0333 |
| A-r2-first        |  18.00/17.60/250.00 |          140/11871/231 | 206.9330 |     0.0000→206.0667 |
| B-r3-first        |  31.00/83.60/516.90 |         1126/92703/528 | 211.3497 |     0.0000→206.0667 |
| A-r3-first        |   16.68/16.80/33.40 |                  0/0/0 | 206.0331 |     0.0000→206.0333 |
| B-r1-fuel-1x      | 58.78/100.00/233.30 |          211/17092/225 |  26.4334 |    78.0000→104.0333 |
| A-r1-fuel-1x      |   16.70/16.80/33.40 |                  0/0/0 |  26.0500 |    78.0000→104.0333 |
| B-r2-fuel-1x      |  21.11/50.00/433.00 |            29/3121/343 |  27.4001 |    78.0000→104.0333 |
| A-r2-fuel-1x      | 52.73/100.00/183.30 |          218/16938/199 |  26.3500 |    78.0000→104.1000 |
| B-r3-fuel-1x      | 60.09/100.10/232.70 |          228/18535/210 |  26.7834 |    78.0000→104.0667 |
| A-r3-fuel-1x      |   16.68/16.80/33.30 |                  0/0/0 |  26.0333 |    78.0000→104.0333 |
| B-r1-landing-1x   | 35.76/100.00/166.60 |          176/14595/169 |  30.6676 |   176.0000→206.0333 |
| A-r1-landing-1x   | 32.24/100.00/133.50 |          163/14470/149 |  30.5833 |   176.0000→206.0333 |
| B-r2-landing-1x   |  19.49/33.40/271.70 |               6/330/60 |  30.6849 |   176.0000→206.0333 |
| A-r2-landing-1x   | 62.01/116.70/383.20 |          256/22739/373 |  31.9166 |   176.0000→206.0333 |
| B-r3-landing-1x   | 68.17/116.80/449.90 |          279/24704/450 |  31.7500 |   176.0000→206.0667 |
| A-r3-landing-1x   |   16.73/16.80/33.40 |                  0/0/0 |  30.0504 |   176.0000→206.0333 |
| B-r1-fuel-2x      | 58.81/100.10/183.30 |           111/8957/185 |  13.3160 |    78.0000→104.0667 |
| A-r1-fuel-2x      | 66.19/116.70/216.70 |           111/9665/221 |  13.8167 |    78.0000→104.1333 |
| B-r2-fuel-2x      |  24.83/66.60/249.10 |            40/3235/159 |  13.7166 |    78.0000→104.0667 |
| A-r2-fuel-2x      |  51.21/99.70/183.30 |           110/8382/186 |  13.3500 |    78.0000→104.1333 |
| B-r3-fuel-2x      | 69.02/116.70/216.60 |           111/9819/230 |  13.6333 |    78.0000→104.1333 |
| A-r3-fuel-2x      |   16.67/16.80/17.70 |                  0/0/0 |  13.0333 |    78.0000→104.0667 |
| B-r1-landing-2x   | 62.45/116.60/133.40 |          134/11118/132 |  15.5333 |   176.0000→206.2000 |
| A-r1-landing-2x   | 73.35/116.80/133.40 |          141/12736/140 |  15.9000 |   176.0000→206.0667 |
| B-r2-landing-2x   |  20.74/48.40/238.60 |             14/979/107 |  15.3333 |   176.0000→206.0667 |
| A-r2-landing-2x   | 55.86/116.60/150.10 |            97/8001/152 |  15.3999 |   176.0000→206.0667 |
| B-r3-landing-2x   | 77.07/117.00/150.00 |          153/13596/146 |  15.7831 |   176.0000→206.1333 |
| A-r3-landing-2x   |  17.14/16.80/133.30 |              3/308/136 |  15.0836 |   176.0000→206.0667 |
| B-r1-aftermath-2x |  51.52/99.10/149.20 |          840/62280/154 |  90.0332 |   360.0000→539.6667 |
| A-r1-aftermath-2x |  47.05/83.40/166.70 |          816/59664/171 |  90.0166 |   360.0000→539.2667 |
| B-r2-aftermath-2x | 22.94/51.10/1949.00 |           121/9003/131 |  90.0164 |   360.0000→533.5333 |
| A-r2-aftermath-2x |  52.41/83.50/300.10 |          866/62806/289 |  90.0833 |   360.0000→539.2667 |
| B-r3-aftermath-2x |  26.73/83.30/183.30 |          471/35019/179 |  90.0165 |   360.0000→539.5333 |
| A-r3-aftermath-2x |   16.68/16.80/33.30 |                  0/0/0 |  90.0165 |   360.0000→540.0000 |

| Run               | Actual world misses n; M/P95/max | Shared hits/misses | Scene React M/P95/max | HUD React M/P95/max | Renderer CPU M/P95/max |
| ----------------- | -------------------------------: | -----------------: | --------------------: | ------------------: | ---------------------: |
| B-r1-first        |            4116; 1.51/7.20/55.30 |         16513/4128 |    21.41/57.30/232.10 |    4.06/11.10/58.50 |       9.61/19.30/55.40 |
| A-r1-first        |             6173; 0.54/2.10/7.50 |         24741/6185 |      3.89/11.90/76.00 |     1.08/2.70/11.20 |       2.62/4.40/102.60 |
| B-r2-first        |            6181; 0.54/2.10/14.30 |         24773/6193 |      4.04/12.60/25.80 |     1.10/2.70/14.60 |        2.63/4.60/22.70 |
| A-r2-first        |           5956; 0.89/5.20/130.60 |         23873/5968 |     4.69/12.90/181.40 |    1.53/6.50/139.70 |        3.00/4.90/49.30 |
| B-r3-first        |            4536; 1.29/7.00/30.80 |         18193/4548 |    15.46/57.00/347.30 |    3.05/11.10/37.40 |      5.98/18.30/198.90 |
| A-r3-first        |             6181; 0.51/2.00/8.50 |         24773/6193 |      3.51/11.30/19.90 |      1.02/2.60/9.00 |        2.71/4.50/23.90 |
| B-r1-fuel-1x      |              442; 0.72/1.10/6.20 |           1772/443 |    24.55/54.40/158.00 |     3.60/7.20/80.90 |      18.36/24.80/39.40 |
| A-r1-fuel-1x      |              781; 0.23/0.30/0.50 |           3128/782 |      4.36/11.10/31.50 |      0.78/1.50/2.50 |         4.19/4.80/6.70 |
| B-r2-fuel-1x      |              699; 0.32/0.60/1.50 |           2800/700 |     6.92/17.90/243.80 |     1.19/2.50/11.90 |        5.13/7.50/36.50 |
| A-r2-fuel-1x      |              481; 0.65/1.00/6.00 |           1928/482 |    24.69/56.60/143.60 |     3.31/6.50/21.10 |      15.05/21.10/33.70 |
| B-r3-fuel-1x      |              441; 0.74/1.10/5.40 |           1768/442 |    26.04/55.70/143.90 |     3.66/7.40/31.70 |      18.22/26.30/53.10 |
| A-r3-fuel-1x      |              781; 0.25/0.40/0.60 |           3128/782 |      3.30/11.00/13.70 |      0.72/1.50/2.40 |        4.81/5.90/14.20 |
| B-r1-landing-1x   |            627; 4.31/10.30/38.80 |           2512/628 |    18.64/60.90/126.90 |    6.22/15.40/63.30 |       5.07/11.10/24.60 |
| A-r1-landing-1x   |            611; 4.67/14.00/21.10 |           2448/612 |     17.66/63.30/81.60 |    6.46/19.50/25.20 |       3.96/10.70/17.80 |
| B-r2-landing-1x   |             870; 2.09/4.50/16.00 |           3484/871 |      4.50/14.70/35.30 |     2.64/5.60/17.60 |        2.07/3.30/11.90 |
| A-r2-landing-1x   |           498; 6.95/13.40/110.20 |           1996/499 |    30.86/68.40/317.10 |  10.02/19.10/111.60 |       8.08/12.70/45.40 |
| B-r3-landing-1x   |            447; 7.03/14.80/28.50 |           1792/448 |    33.62/72.00/170.20 |   10.25/20.50/31.00 |       9.21/13.50/36.40 |
| A-r3-landing-1x   |              901; 1.67/2.90/4.60 |           3608/902 |      3.84/12.40/19.50 |      2.16/3.50/5.50 |         2.22/2.90/5.70 |
| B-r1-fuel-2x      |             224; 0.66/1.00/11.90 |            900/225 |    25.14/59.20/116.90 |     3.19/6.50/17.80 |      18.23/25.80/53.90 |
| A-r1-fuel-2x      |              206; 0.79/1.20/5.70 |            828/207 |    29.57/61.30/160.70 |     3.76/7.50/14.10 |      18.79/24.60/65.10 |
| B-r2-fuel-2x      |             324; 0.50/1.20/11.20 |           1300/325 |      8.00/33.90/89.10 |     1.53/5.60/13.60 |       6.98/23.00/36.90 |
| A-r2-fuel-2x      |              248; 0.63/1.00/4.60 |            996/249 |    23.68/52.50/137.10 |     3.19/6.80/17.20 |      14.95/20.10/34.50 |
| B-r3-fuel-2x      |              196; 0.76/1.10/5.60 |            788/197 |    30.95/63.60/149.80 |     3.84/7.90/12.50 |      18.78/24.90/36.20 |
| A-r3-fuel-2x      |              391; 0.24/0.40/0.50 |           1568/392 |      3.27/11.00/13.00 |      0.70/1.50/1.60 |        4.71/5.70/12.40 |
| B-r1-landing-2x   |            242; 7.97/16.50/22.30 |            972/243 |     29.51/69.10/84.50 |   10.91/22.30/31.20 |       8.64/14.10/34.30 |
| A-r1-landing-2x   |            214; 9.28/19.10/24.20 |            860/215 |     35.59/80.20/95.30 |   12.84/23.80/30.50 |       8.88/12.80/22.80 |
| B-r2-landing-2x   |             422; 2.69/7.60/24.90 |           1692/423 |      5.37/17.10/59.30 |     3.35/9.10/27.10 |        2.35/4.40/17.70 |
| A-r2-landing-2x   |            272; 8.34/15.80/30.60 |           1092/273 |    21.44/62.10/106.80 |   10.44/18.70/31.90 |       8.53/12.60/20.60 |
| B-r3-landing-2x   |           200; 10.06/19.70/46.00 |            804/201 |     37.26/69.90/85.50 |   14.00/27.10/52.60 |       9.85/14.20/32.70 |
| A-r3-landing-2x   |             446; 2.04/3.60/14.70 |           1788/447 |      4.57/13.40/31.70 |     2.59/4.30/15.70 |        2.45/3.60/98.70 |
| B-r1-aftermath-2x |             1602; 0.35/0.50/3.90 |          6408/1602 |     25.21/52.00/90.60 |     3.06/6.40/14.10 |      15.26/21.60/46.60 |
| A-r1-aftermath-2x |             1657; 0.37/0.60/4.90 |          6628/1657 |    22.86/48.60/119.70 |     3.00/6.50/17.10 |     14.42/21.80/106.70 |
| B-r2-aftermath-2x |             2242; 0.20/0.50/1.00 |          8968/2242 |      5.71/22.70/74.70 |     1.09/3.30/11.70 |       5.77/18.90/40.90 |
| A-r2-aftermath-2x |             1610; 0.40/0.60/4.60 |          6440/1610 |    24.89/48.10/251.80 |     3.23/6.50/14.10 |      15.96/21.50/60.10 |
| B-r3-aftermath-2x |             2080; 0.24/0.50/3.60 |          8320/2080 |    12.88/45.70/127.70 |     1.79/5.60/14.10 |       7.27/19.90/57.50 |
| A-r3-aftermath-2x |             2700; 0.14/0.20/0.40 |         10800/2700 |       2.86/9.00/13.00 |      0.59/1.40/2.60 |        4.11/5.10/22.50 |

Shared cache counters include the bounded paused start/export bookend; all timed rows above use Play→end. World CPU is nested in React and must not be added to it. React commit/passive-effect rows remain in the raw traces and measure callback time, not total commit wall time.

| First play | Compile/link calls | Native query CPU M/P95/max | Uploaded bytes |
| ---------- | -----------------: | -------------------------: | -------------: |
| B-r1-first |                192 |           3.24/10.70/11.70 |      111860592 |
| A-r1-first |                198 |           5.03/21.30/90.00 |      180142356 |
| B-r2-first |                198 |           3.99/12.30/17.00 |      180214036 |
| A-r2-first |                198 |           3.07/10.00/27.40 |      173204116 |
| B-r3-first |                198 |            2.61/7.80/16.20 |      115469460 |
| A-r3-first |                198 |            2.59/7.90/16.90 |      180214036 |

## Ready-state rendering, native recovery and resource lifetime

All **25 complete lossless 1280×720 RGB pairs are bit-identical**, including all 24 camera roles and late Fuel: zero differing pixels over 23,040,000 pixels, with no mask or tolerance. Both versions also pass **613 actual rendered checkpoints**, retaining 35 actor roots, 64 wheels and 65 landscape batches at every checkpoint, with zero assertion failures.

The initial expanded-viewport capture produced ±1–3 channel differences below row 415. Repeated captures of the same paused changed scene reproduced both pixel patterns; one pattern exactly matched the reference. These diagnostics are retained. Disabling screenshot viewport expansion, while retaining the explicit complete 1280×720 clip, produced repeatable full-size captures and all 25 exact matches. No CSS, geometry, quality or comparison threshold changed. A second reference capture with the same stable method independently confirms all 25 exact matches.

Native controls pass all 24 presets, 0.5×/1×/2× playback, direct 7200 and backward seeks, paused orbit/right-pan/wheel-zoom, recenter, restart, body Space/Home/End/arrows, number-field Home/Enter isolation and native operational disclosure. Paused world time, rendered roots, mechanics and effects remain frozen while the camera moves. Complete 1280×720, 1280×540 and 1440×900 layouts have matching drawing buffers and no controls outside the viewport; the expanded status panel scrolls within each. Loading/ready layout images are separate from the strict pixel oracle.

Deliberate graphics compilation failure gates Play and time editing; native Retry honestly completes all nine jobs. Actual `WEBGL_lose_context` during Play pauses at T+177.0333. Selecting the latest camera during loss, and pressing body Space/Home, cannot play or seek. Restoration retains time/latest camera and stays paused. A second loss occurs during active graphics preparation at **1/9 completed**; the invalid generation cancels, and restoration completes a fresh nine-job generation, retaining T+177.0333 and the newly selected LCAC-west camera. The subsequent actual render audit has zero errors. CPU generation stays **2**, with identical terrain/coast UUIDs and zero active/staging owners through failure, Retry and both losses.

The fresh uninterrupted **600.082-real-second 2×** aftermath run proceeds **T+360→1554.7333**, with one reset version and speed 2 throughout, no seek/pause/restart/reload before the endpoint, no truncation and **18,339 in-window RAF samples**. RAF mean/P95/max is **32.72/83.30/400.10 ms**; 4,385 Long Tasks total 295,442 ms, maximum 395 ms. This is resource-lifetime acceptance, not a smooth-cadence claim. Compile/link and native program-query work are zero. All **936** world mesh/resource/upload records are unchanged at the endpoints, all 35 actor roots remain, all 231 pool identities/capacities remain and CPU resource identities/bounds stay exact. Sampled heap endpoints are 186654610/198346815 bytes without forced collection.

One warm reference cycle and **five repeated equal-time restart/seek/all-camera cycles** stay flat at the chosen T+360/LCAC-east pose: **116 calls / 378334 triangles / 1023 uploaded geometries / 340 materials / 3 textures / 328 programs**. All **910 fixed** upload rows stay unchanged; only the existing **26 damage-response** instance-matrix versions update. All **231 pools / 9528 capacity** retain shape and bounds; **183** resident UUIDs remain and the inherited **48** conditional pools remount on restart. No actor root is replaced. The historical T+360/LAV-west pose still has **261 calls / 372946 triangles** (1020 uploaded geometries and 328 programs in this context). Absolute uploaded geometry/program counts depend on visited views/variants; the repeated equal-path inventories remain flat.

Road caches stay at four routes/two centerlines, support samples [1329,1311,1319,1306] within fixed maxima [1607,1605,1857,1860], 128 birth records, at most eight settled payloads and 128 dust records. CPU support constants remain **16373920 bytes**, compact cell storage **1085844 bytes**, the four owners' geometry **21977160 bytes**, coast **36432 bytes**, and all 41 presentation geometries **1024122 bytes**. The mounted scene borrows completed geometry, avoiding the former **21819456-byte** full-mainland clone. These are finite owners, not an arbitrary-time cache; default tree layout retains 32 trees. Every resource-cycle inventory has CPU active owners 0, terrain staging owners/geometries 0, presentation staging owners 0 and unchanged completed identities.

Native CPU checks pass separately from pacing. The shell handles actual disclosure input during terrain construction in A1 and three additional fresh ownership/failure/unmount contexts, with observed event-to-handler delays at most 8.3 ms. In the repeated-cancellation context, disclosure is handled at 237.2 ms while terrain runs, followed by native Pause during shoreline refinement. The simulation store is still unloaded. Five further native Retry→Pause cycles each observe private construction before cancellation, then zero staging owners/geometries, no support indexes, a closed sampler gate, no App/store and no active CPU owner. **382/382 task channels close**, peak one open. The five instrumented private geometries dispose once each, with unique IDs. Rapid double-click Retry leaves exactly one current owner and completes honestly at paused T+0/Overview, generation 8; **565/565 channels** are then closed. A subsequent attempt to find Retry while that owner was preparing is a retained harness miss, not a failed initialization or replacement timing run.

Actual React-root unmount during shoreline refinement changes one active CPU owner/private geometry to zero, disposes that geometry once, closes **101/101 channels**, leaves the root empty, keeps the sampler gated and never loads the simulation store. The root handle exists only in an opt-in development diagnostic transformation; production entry code does not expose it.

Separate fresh browser cases deliberately fail construction after private base allocation, reject the deferred import, and cross a shortened **120 ms diagnostic work deadline** inside the selected loop. Each shows a truthful failure with no partial indexes/staging/active owner, then native Retry runs the required work and finishes paused at zero/Overview with four support owners, 41 presentation geometries, nine graphics jobs and no open task channel. The primary/production CPU budget remains 20,000 ms. A further real held-import case tests that full deadline: the failure appears at **20080.5 ms navigation time**, approximately 20 seconds after ownership starts. Native Retry completes normally; resolving the abandoned old import afterward changes neither owner generation, terrain/coast identities, storage, readiness, time nor camera. Completed before/after snapshots are equal. Unit tests also cover stale import completion, several slice budgets, retained snapshots and pending-timer cleanup.

Native console captures have zero JavaScript errors; the inherited Three.Clock deprecation is the only warning. All owned viewers and temporary viewport overrides are closed/reset, and development servers are stopped after verification.

## Limits and handoff

The historical Stage 7B first-play slowdown and the complete cause of the new reference B3 528 ms task remain unresolved. The sampled reproduction and primary counters provide the honest account above; a clean changed context does not establish an all-context playback fix. Residual 510–519 ms React mounting, the 30.1% Landing 1× world-P95 regression, other warm variability and sustained 83.3 ms RAF P95 remain explicit limitations. The fixed selected-construction, total-ready-time, exact-output and ownership/recovery targets pass. Native/driver operations, React mounting, application construction, RAF and overlapping world/React timings remain separate observations.

No build/deployment, dependency/version/framework change, new actor/combat/route/effect/audio/asset or visible human/occupant is included. The current plan/integration pointer and changelog record the verified result; no additional stage is invented. Optional evidence remains under `stage7c-review.local/`, independent of default checks.

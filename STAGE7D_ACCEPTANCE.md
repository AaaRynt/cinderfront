# Post-Core Stage 7D acceptance — 2026-11-06

**Status: PARTIAL.** The optional recorder has reproducible ownership defects
corrected and focused tests. The cause of the original very slow playback
contexts remains unresolved. Application source remains the completed Stage 7C
`e817b1c310a792adc24d66e722830d2f6caac44e`; no application CPU speedup is claimed.
The November 5 matched cohort and sustained run are complete. The cause, warm cadence, exact RGB, historical slice bounds and an inherited fixture assertion prevent complete acceptance. See the distinct verified and unresolved outcomes below.

## Reference and scope

The before viewer is an immutable `git archive e817b1c` with the existing
installed dependencies. The after viewer serves the working repository. Both
use the same opt-in Vite transforms, installed headed Chrome, development React
and StrictMode. No application, fixed-step driver, scene quality, event,
camera, vehicle, landscape, material, effect or dependency source is changed.
There is no new content, audio, visible human, build or deployment.

The implementation consists of optional `tools/playback-review/` helpers and
`src/test/playbackRecorder.test.ts`, plus this report and current planning,
integration and changelog updates. Dated Stage 6C/7A/7B/7C acceptance remains
unchanged. The task-start prompt, AGENTS and package/lock bytes are protected.

The served runtime manifest includes source/assets and index/Vite/package/lock
inputs, excluding test/fixture data and the explicitly irrelevant Finder
`.DS_Store` files. Original golden and source audits cover the excluded test
data. Per-viewer manifests record each opt-in transform's input/output hash.
The recorder and server hashes are also embedded in each run. All source and
comparison identities are retained in the optional evidence.

Frozen SHA-256 identities:

| Scope | SHA-256 |
| --- | --- |
| Served application, both roots | `138db72cf2785d7dcf4a1b7eb224c948db3db84b753833ea9d7fad41024a174a` |
| Recorder | `13ce51076a9c4297a25ea7c5a32f24d24fe88c48bcff0cdc11ba9921b2f719e9` |
| Opt-in server/transforms | `92ff0bf3b5785198da63032bea6839c0678c6fa12eb0b7a887750579b30dd5ba` |
| Primary controller | `da2f304baa860fc5284faa37aae1a962aee851c9f9bc06ac415caa2bdf1106da` |

The measured browser is Chrome **156.0.8078.80**, V8 **15.6.75.27**, on the
**Apple M4 ANGLE Metal** renderer (reported Apple driver 27.2). The manifest
records the available hardware/driver data without assigning them as the cause
of a slow context.

All six primary manifests have 156 transformed files. The 155 non-CSS inputs
and outputs match exactly across roots. `src/index.css` has identical raw
source; Tailwind's generated output for the working root additionally contains
one unused `.blur` utility. The decoded served stylesheet diff contains no
other change. The application's `blur` usages are a DOM method and the existing
backdrop filter function; it does not apply that utility class. This generated
distinction is retained in the manifests and is not claimed to explain cadence
or pixel variance.

## A/A and recorder-overhead controls

Before application edits, unchanged `e817b1c` was measured in fixed order
full1 / minimal1 / minimal2 / full2, one fresh context and owned renderer at a
time. Each used the original warm visits and 24 paused RAF bookends, moving
Landing 176→206 at 1×, then Fuel aftermath from 360 at 2× for 90 real seconds.
The minimal recorder retained bounded RAF/Long Tasks and store/camera/renderer
binding without the React/world/native timing wrappers. Detailed profiling,
GPU queries, screenshots and inventories were separate.

| Recorder/context | Landing RAF mean/P95/max ms | Landing Long Tasks | Aftermath RAF mean/P95/max ms | Aftermath Long Tasks |
| --- | --- | ---: | --- | ---: |
| Full 1 | 16.74 / 17.5 / 34.3 | 0 | 16.67 / 16.8 / 17.8 | 0 |
| Minimal 1 | 44.58 / 116.6 / 183.4 | 202 | 58.02 / 100.0 / 350.0 | 863 |
| Minimal 2 | 16.84 / 17.5 / 66.7 | 1 | 16.67 / 17.5 / 17.8 | 0 |
| Full 2 | 16.78 / 16.8 / 33.4 | 0 | 18.75 / 17.6 / 371.7 | 73 |

This range is larger than a clean observer-overhead estimate. In particular,
the slow state also occurs without the full recorder. These samples do not
establish that the full recorder caused the historical release regression, or
that the corrected recorder removes the original fast/slow context difference.
Full 2's low aftermath P95 does not hide its 371.7 ms maximum and 73 tasks.
Minimal 1's Long Tasks total 16,717 ms in Landing and 61,522 ms in aftermath,
with maxima of 165 and 315 ms. All results remain retained.

Thread CPU for full1/minimal1/minimal2/full2 is **13.21/25.98/13.64/13.61 s**
in Landing and **37.76/83.05/40.28/41.24 s** in aftermath. The floor-level
full1/minimal2 differences are −0.43 s and −2.52 s, respectively; the contexts
are independent and the negative sign is not an observer speedup. There is no
separable positive recorder cost estimate within this A/A range.

## Reproduced recorder defects and correction

A deterministic audit of the retained legacy recorder establishes:

- Reattaching one renderer nests timing wrappers: one real render has measured
  work 1 on first attachment and 4 after a second attachment in the controlled
  fake clock. This is double measurement, not extra real renders.
- Exported frames and world-total dictionaries alias live mutable storage.
- There is no disposer. Setting `active=false` leaves native timers running;
  reinstalling schedules two RAFs, two timers, six observers and two click
  listeners in the fake environment.

The new recorder has one installation registry, per-renderer/context WeakSet
attachment guards, owned callback sets and conditional method restoration.
Startup DOM/paint/mutation observation, heartbeat and click recording stop at
ready. Ready idle retains one Long Task observer and no recorder frame, timer
or listener. A run starts exactly one RAF loop and rejects overlap. Completed
buffers transfer once without later writes; ordinary export deep-copies its
snapshot. Per-run buffers have capacities and explicit overflow flags. Startup
telemetry is additionally limited by the controller's 60-second ready wait and
context cleanup; the raw installer is an owned review API, not a permanent
monitor for a manually abandoned failed loading page. Delayed
Long Task delivery from the closing RAF is retained without leaking an entry
into the next run. Construction channels close against their captured owner.

The per-run caps are 60,000 each for frames, actual world misses and render
commits; 120,000 each for effect and passive callbacks; 20,000 Long Tasks; and
10,000 slow native-call rows. No primary or sustained recording exceeds them.

Eleven focused tests cover these risks. Browser smoke tests verify one real
attachment, no active preparation channels, zero recorder callbacks after
disposal and actual 35-root/64-wheel/65-landscape agreement.

This is an independently proven **measurement-lifecycle correction**. It is
not proof that any particular historical page installed twice. Three separate
reference render-census contexts each attach once, and counted real renders
agree with Three's render-frame counter. Their attempted slow-state capture
never reaches its predeclared trigger; no slow sampled profile was obtained.

## Causal experiments and limits

Separate bounded profiles of ordinary reference Landing and aftermath retain
world/contact work, model/React work and renderer submission stacks. They also
observe 317,816 native development `console.createTask` calls in 20 seconds of
Landing and 592,212 in 30 seconds of aftermath. Neither sampled interval
reproduces the original slow state, so those stacks do not explain it.

Two same-context native/bypass/bypass/native experiments change one diagnostic
variable at a time, retaining application/StrictMode, quality and schedules:

1. Forwarding native `console.createTask` versus returning null leaves all
   tested windows near the display floor and provides no sufficient causal
   explanation of the original slowdown.
2. A temporary accessor suppresses only the installed React DEV owner-stack
   quota; native tasks remain enabled. It substantially changes reported scene
   render duration while total thread cost changes much less. Logical component
   entry counts remain comparable. Every branch stays fast, so this also fails
   to reproduce/remove/reintroduce the original slow state.

The console-task forwarding medians are 13.51→13.31 thread CPU seconds in
Landing and 13.25→12.91 in aftermath. The owner-stack control changes the median
reported scene P95 from 15.15→3.6 ms in Landing and 9.5→2.0 ms in aftermath;
thread CPU moves only 14.24→12.20 s and 13.51→12.15 s. In each owner-stack
branch, Landing has 1,806 HUD / 1,802 scene entries and aftermath has 1,804 /
1,800. All remain near the display floor. These controls quantify development
diagnostic work; the temporary bypass is not an application optimization.

These private diagnostic changes are confined to disposable experiment pages.
They are not present in application source, the corrected recorder or primary
cohort. No OS, GC, thermal, driver or browser cause is assigned. The exact-time
world cache already exists; no duplicate full-world derivation is alleged.
No live application optimization is selected and no ≥20% application target is
claimed as achieved.

## Frozen primary contract

Order: **B1,A1 / A2,B2 / B3,A3**, without replacement of slow contexts. Every
context first plays naturally at 1× from 0→206 with the original camera schedule,
before all seeks/rehearsal. Warm visits remain
0,78,92,104,176,185,206,240,360,540,7200; every visit and window uses 24 paused RAF
bookends. The five windows are Fuel 78→104 1×, Landing 176→206 1×, Fuel 2×,
Landing 2× and Fuel 360 2× for 90 real seconds.

One visible owned renderer runs at a time. CSS and drawing buffer are 1280×720,
document and renderer DPR are 1, antialiasing is true and shadows remain enabled
with their original type. CPU emulation is explicitly 1 and CPU sampling is
disabled. Each context records focus/visibility history, module-transfer/cache
conditions, quality and cumulative thread metrics. The browser process/driver
cache is shared across the six fresh contexts, with one closed startup-only
preload per origin. There is no forced collection. Browser command-line
inspection is unavailable in this Chrome session and is recorded as such.

A preliminary attempt found native screenshots at 2560×1440 despite reported
1280×720 CSS/buffer/DPR1. Its completed B1 timings, 25 images, contract and
interruption remain in `initial-capture-contract/`. A controlled setup-page
audit shows that an explicit CDP device-metrics override fixes the native
capture backing. The **complete primary cohort is restarted** with this applied
identically to both sides. Every setup PNG and exact image must be native
1280×720; no resize, crop, mask or tolerance is applied. The earlier failed
browser-command-line setup is also retained separately before any workload.

The numerical criteria remain: independently reproduced causal correction;
application target ≥20% if an application component is edited; no reproducible
world/scene/HUD/renderer P95 regression greater than max(10%,1 ms); ready-time
median regression no greater than max(10%,500 ms); each warm/sustained RAF P95
≤33.3 ms; original 20-second CPU and nine-job/12-second graphics preparation;
exact 25 image pairs and 613 rendered checkpoints; finite resources and native
recovery. World timings are nested inside React and are not added as disjoint
costs. Commit-effect callbacks are not total commit wall time.

## Fresh default checks

With all **11 optional review folders physically absent**, viewers closed and
original assertions/timeouts, `pnpm test:run --maxWorkers=2` completes in 91.22 s:
**776 passed / 1 failed, 777 tests across 71 files**. All eleven new recorder
tests pass. Both TypeScript no-emit checks, zero-warning lint and whitespace
checks pass. All eight protected task-start files and all ten frozen primary
helper hashes are verified byte-identical.

The failing existing test is
`src/initialization/stage7cConstruction.test.ts`, “retains dated acceptance,
original fixture bytes and precise source exceptions”, line 116. It expects
construction fixture SHA `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8`;
both current and immutable `e817b1c` bytes have
`a2fe892ff096d476eee5874f4123d2b32bc868b4f1d9fb2c7e5a241898d28df1`.
The reference test reproduces the same failure (11 of its 12 tests pass) when
run with the repository Git history available. The initial archive-only test
attempt lacked Git metadata and is not treated as baseline test evidence.
The later presentation-byte assertion also differs from the committed fixture
digest, though execution stops at the construction assertion first.

Actual construction/presentation equality checks and the world/query/source
preservation suite otherwise pass. Neither fixtures nor assertions have been
changed to turn this inherited failure green. Its unresolved byte guard is an
additional acceptance limitation.

## Primary startup and natural first plays

All six contexts start paused at zero and complete the same natural first 1× sequence before rehearsal. Times below are milliseconds from navigation; shell is the first observed preparation status, HUD is the first playback control, and first draw is the first completed renderer call. No startup deadline or graphics-job count changes.

| Context | Shell / HUD / first draw / ready ms | Chunk n: mean/P95/max ms | Graphics span ms / jobs | Startup LT n/total/max ms | Scene mount actual ms |
| --- | --- | --- | --- | --- | --- |
| B1 | 59.7 / 2200.4 / 2934.2 / 3637.6 | 222: 8.26/8.60/34.00 | 694.2 / 9 | 10/1265/510 | 399.7 |
| A1 | 78.1 / 3428.4 / 4283.0 / 4950.3 | 358: 8.38/10.30/40.00 | 658.0 / 9 | 9/1304/630 | 434.1 |
| A2 | 82.3 / 3439.6 / 4323.4 / 5011.7 | 359: 8.38/10.50/42.60 | 678.9 / 9 | 10/1428/640 | 443.1 |
| B2 | 65.4 / 3412.6 / 4273.4 / 4990.6 | 359: 8.35/10.30/40.20 | 706.9 / 9 | 10/1377/636 | 438.2 |
| B3 | 82.4 / 3479.7 / 4331.0 / 5021.4 | 363: 8.34/9.40/39.90 | 681.0 / 9 | 9/1310/623 | 429.9 |
| A3 | 70.1 / 2267.0 / 3014.8 / 3785.2 | 227: 8.24/8.90/33.80 | 760.7 / 9 | 10/1344/513 | 398.6 |

Median ready is **4990.6→4950.3 ms** (-40.3 ms), inside the 5490.6 ms limit. CPU ownership retains its 20,000 ms budget and graphics completes nine jobs within 12 seconds. Actual selected slices have **8.6–10.5 ms P95 / 33.8–42.6 ms maximum**; the older 8.4–8.7/31.9 ms observed bounds are not re-established in every new context. This is not claimed as startup improvement.

Every startup has a ≥500 ms task (B1/A1/A2/B2/B3/A3: **510/630/640/636/623/513 ms**). The retained surrounding timeline overlaps initial scene mounting and subsequent first drawing. Scene Profiler mount actual duration alone does not account for the whole task. Complete attribution remains outside a proven startup correction; these costs are retained as limits.

| Context | Real s | Setup→final sim s | RAF mean/P95/max ms | LT n/total/max ms | RAF ≥33.3/50/100/500 ms | World miss n: mean/P95/max | Scene n: mean/P95/max | HUD n: mean/P95/max | Renderer n: mean/P95/max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | 206.033 | 0→206.033333 | 16.68/16.80/33.30 | 0/0/0 | 3/0/0/0 | 6180: 0.53/2.10/6.60 | 6205: 3.54/11.20/27.70 | 6205: 1.03/2.60/7.30 | 12354: 2.81/4.40/24.20 |
| A1 | 206.033 | 0→206.033333 | 33.33/33.40/34.40 | 0/0/0 | 3853/0/0/0 | 5680: 0.82/3.90/8.30 | 5705: 4.18/12.50/22.00 | 5705: 1.41/4.40/8.90 | 6182: 3.51/5.80/10.70 |
| A2 | 206.033 | 0→206.033333 | 33.33/33.40/34.40 | 0/0/0 | 4254/0/0/0 | 5980: 0.85/3.70/7.10 | 6005: 3.96/11.80/21.60 | 6005: 1.40/4.20/7.70 | 6182: 3.56/6.00/10.30 |
| B2 | 206.033 | 0→206.033333 | 33.33/33.40/34.40 | 1/50/50 | 3949/0/0/0 | 5307: 0.92/3.90/8.50 | 5332: 4.24/12.10/34.50 | 5332: 1.52/4.40/8.80 | 6182: 3.50/6.00/24.10 |
| B3 | 206.000 | 0→206.033333 | 17.58/33.30/34.30 | 0/0/0 | 338/0/0/0 | 6051: 0.55/2.10/6.80 | 6075: 4.49/12.40/28.50 | 6076: 1.15/2.80/7.50 | 11718: 2.66/4.30/30.20 |
| A3 | 206.034 | 0→206.033333 | 16.69/17.20/34.10 | 0/0/0 | 10/0/0/0 | 6180: 0.51/2.00/6.70 | 6205: 4.18/12.40/30.20 | 6205: 1.07/2.60/7.30 | 12349: 2.98/4.50/14.20 |

All first-play frame rows and event/camera transitions are retained. First play contains no ≥500 ms task or RAF gap. B2 records one shorter Long Task, included above. Larger initial mount/first-draw gaps belong to startup and are retained separately.

## All thirty warm windows

Statistics are count: mean/P95/max in milliseconds. Renderer values time the synchronous `render()` submission call and can include native driver waits; they are not GPU completion times. World miss time is nested in React. Native upload bytes below are source-view byte accounting, not a bandwidth claim. Native-query and upload elapsed distributions, all misses and complete caller counters are retained in `timing-summary.json` and raw recordings.

| Run | Real s; observed sim start→end | RAF n: mean/P95/max | LT n/total/max | World miss n: mean/P95/max | Scene n: mean/P95/max | HUD n: mean/P95/max | Renderer n: mean/P95/max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 fuel-1x | 26.017; 78.000000→104.033333 | 1561: 16.68/16.80/33.40 | 0/0/0 | 780: 0.21/0.30/0.50 | 780: 3.22/10.60/27.00 | 780: 0.65/1.40/2.10 | 1561: 4.21/4.80/12.60 |
| B1 landing-1x | 30.033; 176.000000→206.033333 | 1799: 16.70/16.80/34.00 | 0/0/0 | 900: 1.83/3.20/4.00 | 900: 3.89/12.60/18.80 | 900: 2.30/3.80/5.20 | 1799: 2.10/2.80/4.30 |
| B1 fuel-2x | 13.033; 78.000000→104.066667 | 733: 17.80/33.30/33.40 | 0/0/0 | 390: 0.21/0.30/0.50 | 390: 3.54/10.70/12.90 | 390: 0.68/1.40/2.50 | 733: 4.24/5.10/6.20 |
| B1 landing-2x | 15.033; 176.066667→206.133333 | 452: 33.33/33.40/34.20 | 0/0/0 | 449: 2.10/3.50/4.30 | 449: 3.97/12.90/26.00 | 449: 2.58/4.10/4.90 | 452: 2.63/3.10/4.20 |
| B1 aftermath-2x | 90.033; 360.000000→540.066667 | 2702: 33.33/33.40/34.30 | 0/0/0 | 2194: 0.14/0.20/0.40 | 2194: 3.66/10.30/14.60 | 2194: 0.71/1.60/2.60 | 2702: 5.23/5.90/7.80 |
| A1 fuel-1x | 26.033; 78.000000→104.033333 | 782: 33.33/33.80/34.40 | 0/0/0 | 634: 0.36/0.50/0.60 | 634: 4.21/11.50/28.00 | 634: 0.94/1.80/2.30 | 782: 5.77/6.50/7.20 |
| A1 landing-1x | 30.033; 176.033333→206.033333 | 902: 33.33/34.30/34.40 | 0/0/0 | 878: 2.98/5.20/6.60 | 878: 4.04/12.10/24.00 | 878: 3.47/5.70/7.90 | 902: 2.79/3.20/5.10 |
| A1 fuel-2x | 13.000; 78.066667→104.066667 | 391: 33.33/34.30/34.40 | 0/0/0 | 321: 0.35/0.50/0.50 | 321: 4.03/11.10/15.60 | 321: 0.89/1.70/2.10 | 391: 5.87/6.60/7.70 |
| A1 landing-2x | 15.032; 176.000000→206.066667 | 452: 33.33/34.30/34.30 | 0/0/0 | 449: 3.29/5.40/6.50 | 449: 4.01/12.60/20.40 | 449: 3.77/6.00/7.00 | 452: 2.69/3.20/4.80 |
| A1 aftermath-2x | 90.033; 360.066667→540.133333 | 2702: 33.33/34.20/34.40 | 0/0/0 | 2640: 0.20/0.30/0.40 | 2640: 3.45/9.40/11.60 | 2640: 0.74/1.60/2.10 | 2702: 5.40/5.90/6.90 |
| A2 fuel-1x | 26.000; 78.033333→104.033333 | 781: 33.33/33.40/34.40 | 0/0/0 | 773: 0.33/0.40/0.50 | 773: 3.60/10.70/15.30 | 773: 0.82/1.60/2.30 | 781: 5.60/6.30/7.40 |
| A2 landing-1x | 30.033; 176.000000→206.033333 | 902: 33.33/33.40/34.30 | 0/0/0 | 897: 2.98/5.30/6.30 | 897: 3.97/12.40/23.90 | 897: 3.46/5.80/7.00 | 902: 2.38/3.10/4.60 |
| A2 fuel-2x | 13.000; 78.066667→104.066667 | 391: 33.33/33.40/34.30 | 0/0/0 | 342: 0.34/0.40/0.70 | 342: 3.93/11.70/26.90 | 342: 0.85/1.70/2.50 | 391: 5.64/6.50/10.90 |
| A2 landing-2x | 15.033; 176.000000→206.066667 | 452: 33.33/33.40/34.20 | 0/0/0 | 446: 3.34/5.60/7.10 | 446: 3.98/12.30/23.20 | 446: 3.82/6.10/8.00 | 452: 2.26/3.00/4.60 |
| A2 aftermath-2x | 90.033; 360.066667→540.133333 | 2702: 33.33/33.40/34.40 | 0/0/0 | 2526: 0.19/0.30/0.40 | 2526: 3.34/9.60/11.90 | 2526: 0.72/1.60/2.10 | 2702: 5.26/6.10/8.90 |
| B2 fuel-1x | 26.000; 78.033333→104.033333 | 781: 33.33/33.40/34.30 | 0/0/0 | 719: 0.35/0.50/0.70 | 719: 3.71/11.00/26.50 | 719: 0.85/1.70/2.30 | 781: 5.52/6.40/7.80 |
| B2 landing-1x | 30.033; 176.000000→206.033333 | 902: 33.33/33.40/33.80 | 0/0/0 | 827: 3.22/5.80/6.90 | 827: 4.51/13.60/28.10 | 827: 3.74/6.20/7.70 | 902: 2.37/3.20/6.40 |
| B2 fuel-2x | 13.033; 78.000000→104.066667 | 392: 33.33/33.40/34.40 | 0/0/0 | 307: 0.35/0.40/0.60 | 307: 4.36/12.00/28.80 | 307: 0.91/1.80/2.10 | 392: 5.64/6.60/7.70 |
| B2 landing-2x | 15.033; 176.066667→206.066667 | 452: 33.33/33.40/34.20 | 0/0/0 | 359: 3.85/6.60/8.90 | 359: 4.56/13.20/19.80 | 359: 4.40/7.50/9.30 | 452: 2.43/3.30/4.60 |
| B2 aftermath-2x | 90.033; 360.000000→540.066667 | 2702: 33.33/33.40/34.30 | 0/0/0 | 2199: 0.20/0.30/0.40 | 2199: 3.87/9.90/12.10 | 2199: 0.79/1.60/2.10 | 2702: 5.34/6.10/8.00 |
| B3 fuel-1x | 26.017; 78.000000→104.033333 | 1561: 16.68/16.80/33.30 | 0/0/0 | 780: 0.21/0.30/1.50 | 780: 4.01/10.80/29.80 | 780: 0.72/1.40/2.60 | 1561: 4.00/4.60/5.50 |
| B3 landing-1x | 30.033; 176.000000→206.033333 | 1796: 16.73/16.80/34.10 | 0/0/0 | 900: 1.80/3.20/5.50 | 900: 3.97/12.80/25.10 | 900: 2.27/3.70/7.80 | 1796: 2.06/2.70/4.80 |
| B3 fuel-2x | 13.017; 78.000000→104.066667 | 782: 16.67/17.10/17.70 | 0/0/0 | 390: 0.23/0.40/0.50 | 390: 3.23/10.60/11.60 | 390: 0.68/1.50/1.80 | 782: 4.27/5.10/9.60 |
| B3 landing-2x | 15.017; 176.000000→206.066667 | 900: 16.70/17.40/33.30 | 0/0/0 | 450: 1.96/3.30/3.90 | 450: 3.90/12.40/22.20 | 450: 2.45/3.90/5.40 | 900: 2.30/3.00/4.10 |
| B3 aftermath-2x | 90.016; 360.000000→540.000000 | 5402: 16.67/17.30/17.80 | 0/0/0 | 2700: 0.12/0.20/0.30 | 2700: 3.35/9.00/13.10 | 2700: 0.63/1.40/2.50 | 5402: 4.32/5.70/17.80 |
| A3 fuel-1x | 26.033; 78.000000→104.033333 | 1562: 16.68/17.30/33.30 | 0/0/0 | 780: 0.22/0.30/0.50 | 780: 3.93/11.00/30.50 | 780: 0.73/1.50/2.30 | 1562: 4.51/6.00/7.80 |
| A3 landing-1x | 30.017; 176.000000→206.033333 | 1801: 16.68/17.40/33.30 | 0/0/0 | 900: 1.73/3.00/4.20 | 900: 3.83/12.30/21.40 | 900: 2.21/3.50/4.80 | 1801: 2.57/3.50/4.60 |
| A3 fuel-2x | 13.033; 78.000000→104.066667 | 783: 16.67/17.30/17.70 | 0/0/0 | 390: 0.21/0.30/0.40 | 390: 3.22/11.00/12.70 | 390: 0.63/1.40/1.70 | 783: 4.59/6.10/7.70 |
| A3 landing-2x | 15.034; 176.000000→206.066667 | 900: 16.72/17.40/33.40 | 0/0/0 | 450: 1.91/3.30/4.50 | 450: 4.53/12.70/18.00 | 450: 2.46/3.90/6.10 | 900: 2.46/3.50/4.20 |
| A3 aftermath-2x | 90.016; 360.000000→540.000000 | 5402: 16.67/17.40/17.80 | 0/0/0 | 2700: 0.13/0.20/0.30 | 2700: 2.89/9.10/11.20 | 2700: 0.57/1.40/2.40 | 5402: 4.42/5.40/6.70 |

**Cadence goal misses: 17/30.** B1 landing-2x (33.4 ms), B1 aftermath-2x (33.4 ms), A1 fuel-1x (33.8 ms), A1 landing-1x (34.3 ms), A1 fuel-2x (34.3 ms), A1 landing-2x (34.3 ms), A1 aftermath-2x (34.2 ms), A2 fuel-1x (33.4 ms), A2 landing-1x (33.4 ms), A2 fuel-2x (33.4 ms), A2 landing-2x (33.4 ms), A2 aftermath-2x (33.4 ms), B2 fuel-1x (33.4 ms), B2 landing-1x (33.4 ms), B2 fuel-2x (33.4 ms), B2 landing-2x (33.4 ms), B2 aftermath-2x (33.4 ms). Native timestamps have 0.1 ms precision; binary subtraction noise below 0.001 ms is not treated as a distinct measurement. All thirty warm windows have zero Long Tasks. No recording is truncated or drops rows.

## CPU comparisons and actual work

| Window | World miss median P95 ms | Scene median P95 ms | HUD median P95 ms | Renderer median P95 ms |
| --- | --- | --- | --- | --- |
| fuel-1x | 0.30→0.40 (+33.3%) | 10.80→11.00 (+1.9%) | 1.40→1.60 (+14.3%) | 4.80→6.30 (+31.3%) |
| landing-1x | 3.20→5.20 (+62.5%) | 12.80→12.30 (-3.9%) | 3.80→5.70 (+50.0%) | 2.80→3.20 (+14.3%) |
| fuel-2x | 0.40→0.40 (+0.0%) | 10.70→11.10 (+3.7%) | 1.50→1.70 (+13.3%) | 5.10→6.50 (+27.5%) |
| landing-2x | 3.50→5.40 (+54.3%) | 12.90→12.60 (-2.3%) | 4.10→6.00 (+46.3%) | 3.10→3.20 (+3.2%) |
| aftermath-2x | 0.20→0.30 (+50.0%) | 9.90→9.40 (-5.1%) | 1.60→1.60 (-0.0%) | 5.90→5.90 (+0.0%) |

The raw medians exceed max(10%,1 ms) for moving-Landing world/HUD and Fuel renderer submission. **Non-regression is unresolved, not passed.** This cannot be attributed to an application source edit: the served application is identical. B1→A1 is slower; B2→A2 has the opposite moving-world direction; B3/A3 are near the display floor. The observations overlap context variation and do not establish a release gain or a recovered regression. Moving Landing and aftermath remain separate outcomes.

| Pair/window | Unique world times before/after | Exact common times | Matched world miss before mean/P95/max ms | After mean/P95/max ms | Duplicate misses at identical time B/A |
| --- | --- | --- | --- | --- | --- |
| B1/A1 fuel-1x | 780/634 | 634 | 0.21/0.30/0.50 | 0.36/0.50/0.60 | 0/0 |
| B1/A1 landing-1x | 900/878 | 878 | 1.85/3.20/4.00 | 2.98/5.20/6.60 | 0/0 |
| B1/A1 fuel-2x | 390/321 | 321 | 0.21/0.30/0.50 | 0.35/0.50/0.50 | 0/0 |
| B1/A1 landing-2x | 449/449 | 448 | 2.10/3.50/4.30 | 3.30/5.40/6.50 | 0/0 |
| B1/A1 aftermath-2x | 2194/2640 | 2138 | 0.14/0.20/0.40 | 0.20/0.30/0.40 | 0/0 |
| B2/A2 fuel-1x | 719/773 | 712 | 0.35/0.50/0.70 | 0.33/0.40/0.50 | 0/0 |
| B2/A2 landing-1x | 827/897 | 824 | 3.23/5.80/6.90 | 3.05/5.30/6.30 | 0/0 |
| B2/A2 fuel-2x | 307/342 | 275 | 0.35/0.50/0.60 | 0.34/0.40/0.70 | 0/0 |
| B2/A2 landing-2x | 359/446 | 355 | 3.84/6.50/8.90 | 3.38/5.80/7.10 | 0/0 |
| B2/A2 aftermath-2x | 2199/2526 | 2065 | 0.20/0.30/0.40 | 0.19/0.30/0.40 | 0/0 |
| B3/A3 fuel-1x | 780/780 | 780 | 0.21/0.30/1.50 | 0.22/0.30/0.50 | 0/0 |
| B3/A3 landing-1x | 900/900 | 900 | 1.80/3.20/5.50 | 1.73/3.00/4.20 | 0/0 |
| B3/A3 fuel-2x | 390/390 | 390 | 0.23/0.40/0.50 | 0.21/0.30/0.40 | 0/0 |
| B3/A3 landing-2x | 450/450 | 450 | 1.96/3.30/3.90 | 1.91/3.30/4.50 | 0/0 |
| B3/A3 aftermath-2x | 2700/2700 | 2700 | 0.12/0.20/0.30 | 0.13/0.20/0.30 | 0/0 |

These intersections use exact unquantized logical times. Every pair has zero repeated full misses at the same time. HUD owns the misses; scene and camera calls reuse the shared exact-time result. At common moving samples B1/A1 work becomes slower without duplicate derivation; B2/A2 reverses that direction. Different counts of React-observed times are retained rather than equated through elapsed totals. Primary contact/allocation counters are not complete, and no original very-slow-state sampled stack exists; neither additional work nor a particular external cause is established.

| Run | World calls / miss buckets / hits | HUD/scene/camera calls (includes paused arm) | Native bufferSubData / shader calls | Upload bytes | Scene/HUD effect-callback P95; passive P95 ms | Thread CPU s |
| --- | --- | --- | --- | --- | --- | --- |
| B1 fuel-1x | 3904/781/3123 | 1562/1562/780 | 20412/0 | 45444864 | 0.20/0.00; 0.10/0.00 | 12.133 |
| B1 landing-1x | 4504/901/3603 | 1802/1802/900 | 24472/0 | 27559680 | 0.40/0.00; 0.10/0.00 | 13.278 |
| B1 fuel-2x | 1954/391/1563 | 782/782/390 | 10200/0 | 23084288 | 0.20/0.00; 0.00/0.00 | 6.279 |
| B1 landing-2x | 2249/450/1799 | 900/900/449 | 12210/0 | 13751680 | 0.40/0.00; 0.10/0.00 | 6.337 |
| B1 aftermath-2x | 10974/2195/8779 | 4390/4390/2194 | 76967/0 | 159859328 | 0.50/0.00; 0.10/0.00 | 31.376 |
| A1 fuel-1x | 3174/635/2539 | 1270/1270/634 | 16584/0 | 37079808 | 0.30/0.00; 0.10/0.10 | 10.624 |
| A1 landing-1x | 4394/879/3515 | 1758/1758/878 | 23892/0 | 26923648 | 0.60/0.00; 0.10/0.00 | 13.228 |
| A1 fuel-2x | 1609/322/1287 | 644/644/321 | 8375/0 | 19061760 | 0.30/0.00; 0.10/0.00 | 5.533 |
| A1 landing-2x | 2249/450/1799 | 900/900/449 | 12210/0 | 13751680 | 0.60/0.00; 0.10/0.00 | 7.043 |
| A1 aftermath-2x | 13204/2641/10563 | 5282/5282/2640 | 92611/0 | 192354688 | 0.70/0.00; 0.10/0.00 | 35.200 |
| A2 fuel-1x | 3869/774/3095 | 1548/1548/773 | 20224/0 | 45027904 | 0.20/0.00; 0.10/0.00 | 10.534 |
| A2 landing-1x | 4489/898/3591 | 1796/1796/897 | 24392/0 | 27470592 | 0.50/0.00; 0.10/0.00 | 12.895 |
| A2 fuel-2x | 1714/343/1371 | 686/686/342 | 8923/0 | 20254016 | 0.20/0.00; 0.10/0.00 | 5.419 |
| A2 landing-2x | 2234/447/1787 | 894/894/446 | 12130/0 | 13662592 | 0.60/0.00; 0.10/0.00 | 6.670 |
| A2 aftermath-2x | 12634/2527/10107 | 5054/5054/2526 | 88613/0 | 184048768 | 0.60/0.00; 0.10/0.00 | 33.207 |
| B2 fuel-1x | 3599/720/2879 | 1440/1440/719 | 18794/0 | 41913600 | 0.20/0.00; 0.10/0.00 | 10.308 |
| B2 landing-1x | 4139/828/3311 | 1656/1656/827 | 22499/0 | 25355008 | 0.60/0.00; 0.10/0.00 | 12.794 |
| B2 fuel-2x | 1539/308/1231 | 616/616/307 | 8049/0 | 18384768 | 0.20/0.00; 0.10/0.00 | 5.319 |
| B2 landing-2x | 1799/360/1439 | 720/720/359 | 9760/0 | 10990720 | 0.60/0.00; 0.10/0.00 | 6.325 |
| B2 aftermath-2x | 10999/2200/8799 | 4400/4400/2199 | 77141/0 | 160223104 | 0.70/0.00; 0.10/0.00 | 32.626 |
| B3 fuel-1x | 3904/781/3123 | 1562/1562/780 | 20412/0 | 45444864 | 0.20/0.00; 0.10/0.00 | 12.423 |
| B3 landing-1x | 4504/901/3603 | 1802/1802/900 | 24472/0 | 27559680 | 0.40/0.00; 0.10/0.00 | 13.355 |
| B3 fuel-2x | 1954/391/1563 | 782/782/390 | 10200/0 | 23084288 | 0.20/0.00; 0.10/0.00 | 6.218 |
| B3 landing-2x | 2254/451/1803 | 902/902/450 | 12236/0 | 13779840 | 0.40/0.00; 0.10/0.00 | 7.039 |
| B3 aftermath-2x | 13500/2700/10800 | 5400/5400/2700 | 94716/0 | 196726528 | 0.40/0.00; 0.10/0.00 | 42.445 |
| A3 fuel-1x | 3904/781/3123 | 1562/1562/780 | 20412/0 | 45444864 | 0.20/0.00; 0.10/0.00 | 13.235 |
| A3 landing-1x | 4504/901/3603 | 1802/1802/900 | 24472/0 | 27559680 | 0.40/0.00; 0.10/0.00 | 14.152 |
| A3 fuel-2x | 1954/391/1563 | 782/782/390 | 10200/0 | 23084288 | 0.20/0.00; 0.10/0.00 | 6.788 |
| A3 landing-2x | 2254/451/1803 | 902/902/450 | 12236/0 | 13779840 | 0.40/0.00; 0.10/0.00 | 7.654 |
| A3 aftermath-2x | 13500/2700/10800 | 5400/5400/2700 | 94716/0 | 196726528 | 0.40/0.00; 0.10/0.00 | 41.620 |

Caller/native totals include the short paused arm-to-Play interval; frame-bucket counts and actual-miss samples use the explicit playing interval. Commit-effect/passive callbacks are not complete commit wall time. Native GPU completion queries and allocation profiling are absent from primary pacing; no GPU or universal frame-rate improvement is inferred.

## Fresh uninterrupted sustained playback

A3 records **600.015800 real seconds**, observed simulation **360.000000→1560.000000**, 36002 playing RAF rows, **16.67/16.80/17.80 ms RAF**, zero Long Tasks and no truncation. World/scene/HUD/render submission P95 is **0.20/9.10/1.40/4.90 ms**. Cumulative thread CPU is 276.972 s. All minutes pass the local 33.3 ms cadence goal; this does not close failed warm runs.

| Minute | Observed sim start→end | RAF n: mean/P95/max ms | LT n/total/max | World miss n: mean/P95/max | Scene n: mean/P95/max | HUD n: mean/P95/max | Renderer n: mean/P95/max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 360.000000→480.000000 | 3601: 16.67/17.30/17.80 | 0/0/0 | 1799: 0.12/0.20/0.40 | 1799: 2.93/9.10/10.90 | 1799: 0.57/1.30/2.40 | 3601: 4.28/5.10/7.00 |
| 2 | 480.000000→600.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.30 | 1800: 2.99/8.90/10.80 | 1800: 0.58/1.40/2.60 | 3600: 4.11/4.80/6.50 |
| 3 | 600.066667→720.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.40 | 1800: 3.64/8.90/10.60 | 1800: 0.65/1.40/2.40 | 3600: 4.09/4.90/6.40 |
| 4 | 720.066667→840.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.40 | 1800: 3.59/9.00/11.30 | 1800: 0.65/1.40/2.50 | 3600: 4.06/4.90/6.30 |
| 5 | 840.000000→960.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.40 | 1800: 3.49/8.90/10.60 | 1800: 0.64/1.40/2.20 | 3600: 4.04/4.80/10.50 |
| 6 | 960.066667→1080.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.40 | 1800: 3.86/9.00/10.60 | 1800: 0.67/1.40/2.50 | 3600: 3.91/4.80/8.20 |
| 7 | 1080.000000→1200.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.40 | 1800: 3.97/9.20/11.00 | 1800: 0.68/1.40/2.40 | 3600: 3.88/4.60/10.50 |
| 8 | 1200.000000→1320.000000 | 3600: 16.67/16.80/17.80 | 0/0/0 | 1800: 0.12/0.20/0.30 | 1800: 4.00/9.40/16.40 | 1800: 0.68/1.40/2.30 | 3600: 4.06/5.00/10.00 |
| 9 | 1320.000000→1440.000000 | 3600: 16.67/16.80/17.70 | 0/0/0 | 1800: 0.12/0.20/0.30 | 1800: 3.98/9.30/14.10 | 1800: 0.69/1.40/2.60 | 3600: 4.19/5.00/10.30 |
| 10 | 1440.000000→1560.000000 | 3601: 16.67/16.80/17.70 | 0/0/0 | 1801: 0.12/0.20/0.30 | 1801: 3.99/9.30/11.10 | 1801: 0.69/1.40/2.20 | 3601: 4.12/4.90/9.20 |

Minute bins are half-open, with the final bin including the actual endpoint. Each sample belongs to one bin. Raw per-minute callback/native distributions and complete surrounding timelines are retained.

## Exact rendered preservation

Both sides pass **613 actual rendered checkpoints**, with identical cross-version canonical mechanical/effect/camera hashes, zero agreement errors, 35 roots, 64 wheels and 65 landscape batches. The existing full-world/contact/construction/presentation values and source audits otherwise pass; the inherited raw-fixture byte guard remains failed as recorded below. No source exceptions or golden regeneration are introduced.

**Exact RGB is 21/25 pairs, not accepted as 25/25.** All PNGs are lossless complete native 1280×720. The four nonidentical pairs are retained without masks or relaxed thresholds:

| Index / preset / time | Changed pixels | Maximum channel difference |
| --- | --- | --- |
| 0 / overview / 0 | 3 | 1 |
| 2 / f35-02 / 20.1 | 81 | 2 |
| 3 / radar-hill / 36.1 | 222 | 2 |
| 24 / fuel-storage / 7200 | 3 | 1 |

The other 21 pairs have zero changed pixels and zero channel error. The small differences do not become a pass by rounding. A separately labelled unchanged-reference capture-stability control is retained; it cannot replace the failed primary images.

In a separate unchanged-reference control, repeated captures in one paused
context at the same time and camera vary at indices 0, 3 and 24. At Radar Hill
(index 3), one repeat differs by the same **222 pixels** in the same header-edge
bounds as the primary pair. At late Fuel, one repeat differs by the same **3
pixels** in the same bounds. At F-35B 02 the three within-context captures match,
but the new reference context differs from the initial reference by 509 pixels.
This independently demonstrates capture variability with unchanged source and
fixed state. It does not isolate the low-level rendering/compositing cause or
replace the original four failed pairs. Every PNG and comparison is retained.

## Sustained resources and five warmed cycles

The uninterrupted Fuel bookends retain all **936 world rows without a changed
row**, all 35 actor UUIDs, the same pool identities/capacities and the same
resident geometry/material/texture identity sets. Both bookends have 1,507
draw calls, 525,663 triangles, 1,020 GPU geometries, 328 programs, 340 materials
and three textures. The sustained recorder observes 631,147 `bufferSubData`
calls, no shader compile/link calls, 18,000 world misses and 36,002 playing RAF
rows. No profiling, full inventory or screenshot occurs during pacing.

Five warmed restart/seek/all-24-camera cycles use the same exposure path and
endpoint (T+360, LAV west). All 35 actor roots, 64 wheels and 65 landscape
batches remain; the full rendered checkpoint files retain one persistent
actor and landscape identity set per context. Each cycle retains all 936 world
rows; across adjacent cycles **910 fixed rows are byte-identical and only the
26 authored response matrix versions change**. All 231 pools keep their 9,528
slots and finite draw counts. There are 183 resident pool identities and 48
expected conditional pool remounts.

| Five-cycle cohort | Calls | Triangles | GPU geometries | Programs | Materials | Textures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Primary A3, every endpoint | 261 | 372,946 | 1,023 | 328 | 340 | 3 |
| Separate native recovery, every endpoint | 261 | 372,946 | 976 | 346 | 340 | 3 |

The initially stricter native checker incorrectly required all transient
geometry/material UUIDs to survive restart. Named scene inventories and disposal
hooks show 60 geometries and 49 materials replaced per cycle, belonging to
existing effects including authored tracers and harbor contamination; every
removed resource is disposed. The repeat verifies both finite counts and
disposal, while retaining exact requirements for fixed rows, actor identities,
landscape and pools. The failed checker attempt is retained separately.

Completed CPU owners retain 21,977,160 terrain geometry bytes, 36,432 coast
bytes, 41/41 presentation geometries (1,024,122 bytes), and four support
indexes (16,373,920 constant bytes and 1,085,844 cell bytes). All active/staging
owners, staging geometries and construction channels return to zero; peak
construction channels is one. All graphics jobs remain complete throughout
normal playback and camera/restart/seek operations. CPU/graphics generation
stays 2/2 in primary cycles and 3/12 after the deliberate native recoveries.

The LAV cache remains four routes, two centerlines, 128 births and eight
settled payloads; support sample lengths are 1329/1311/1319/1306 against
1607/1605/1857/1860 maximums. Dust cache is 128. Unforced JS heap samples at the
five equal endpoints span 205.8–263.4 MB in A3 and 224.3–291.5 MB in the native
cohort. Heap snapshots include temporary objects and do not prove a GC or OS
cause. The bounded indexes and owned prepared resources are retained as the
existing memory tradeoff.

## Native recovery, controls and layout

- Opened the early shell's disclosure, cancelled during shoreline work, and
  verified no store binding, gated sampler, empty support indexes, zero active
  owners/staging/channel counts. Native Retry completed nine jobs and returned
  paused at zero. The 20-second CPU deadline and 12-second graphics budget
  remain byte-identical in source.
- Injected a controlled graphics compile failure outside pacing; native Retry
  completed nine jobs and reused completed CPU resources. Actual `WEBGL_lose_context`
  during Play retained T+360.200 and the latest `lcac-east` preset; gated
  Space/Home caused no queued play or seek. A second actual loss was triggered
  at 2/9 preparation jobs and retained T+360.200 and the latest `support-convoy`
  preset. Both restores reuse CPU terrain/coast identities, finish nine jobs
  and stay paused.
- Native all-24 preset changes, 0.5×/1×/2×, paused orbit/pan/zoom/recenter,
  native T+7200 entry and backward seek, restart, keyboard playback/seek,
  button/input/disclosure focus isolation all pass. The first exact recenter
  assertion ran with residual pan damping; its independent diagnostic retains
  a roughly 1.1 mm target offset. The final check waits 240 paused RAFs before
  requesting recenter and passes its original `1e-8` coordinate bound with
  unchanged paused mechanical/effect state.
- Full viewport and open-details layouts pass at 1280×720, 1280×540 and
  1440×900. All controls are within the visible viewport, there is no document
  overflow and the details panel scrolls to its end. The six full-size PNGs
  retain both layout states at each size.
- Listener counts remain 19 window / 1 document / 5 canvas, with identical
  type counts. Recorder disposal leaves zero frames, timers, observers,
  listeners and channels. No JavaScript page errors occur; one inherited Three
  Clock deprecation warning remains in the final native run.

A final separate paused frame-loop control runs always/never/never/always at
T+360. P95 is **16.8/17.5/17.5/16.8 ms**, with **241/0/0/241** renderer calls.
This fast context does not reproduce the slow state. Stopped-render intervals
are diagnostic only; they do not count toward playback, picture or quality
acceptance.

## Retained limits

The original very slow context has no captured causal stack or controlled
removal/reintroduction. Legacy recorder defects alone do not establish its
cause. The slower cadence is already observable before the first WebGL context
is created: median startup RAF is 33.3 ms in A1/A2/B2/B3 versus 16.7 ms in
B1/A3. B3 later returns to a faster cadence during first play. This rules out
the live scene's renderer submissions as a sufficient explanation for the
whole context difference; it does not identify the cause. Historical Stage 7B
first-use stalls, the Stage 7C reference 528 ms task
and 1949 ms unexplained RAF gap retain their dated unresolved status. Local CPU
and cadence observations imply no universal frame-rate or GPU improvement.

Optional evidence is retained in `stage7d-review.local/`; reusable bounded
primary/integration helpers are in `tools/playback-review/`. No bulk traces or
new golden datasets are added to tracked application files.

# Post-Core Stage 7B — Busy-Scene CPU Cost and Moving-Vehicle Frame Pacing

Date: 2026-10-29. Reference: completed Stage 7A, `62edc66072554c0734928153937f0c98359af62d`.

Status: **COMPLETE for the focused CPU and exact-preservation delivery**, with the pre-edit Landing scene target miss, one slow aftermath repetition and unresolved initial after-context first-use stalls recorded below. Completion does not claim every performance aspiration or every browser context passed. Stages 1–6 and Stage 7A retain their dated acceptance.

## Comparison contract

The pre-edit plan was fixed after collecting a new reference and separate CPU profiles, before changing implementation. It targets at least 25% lower median-of-three P95 scene React render in both busy Fuel and moving Landing at each speed. Reference Fuel medians are 14.8/15.2 ms at 1×/2× (targets 11.10/11.40); Landing medians are 14.1/14.5 ms (targets 10.575/10.875). The secondary actual-world-miss targets are 3.225/3.45 ms from 4.3/4.6. RAF P95 target is ≤33.3 ms. The new reference is already near the 60 Hz cadence floor; equal RAF is not a cadence speedup.

Both sides use the same opt-in controlled Vite development runner, StrictMode, one visible isolated owned IAB viewer, 1280×720 CSS and drawing buffer, DPR 1, antialiasing, shadows and effect populations. No renderer runs alongside the measured viewer. The fixed reference is a Git archive with the existing dependency directory symlinked. The runner disables Vite client reconnect identically on both sides after an initial reference attempt reloaded near T+188. That interrupted attempt has retained metadata/logs; its lost raw timing trace is not claimed as evidence.

Each accepted context first plays naturally from T+0 through 206 at 1× without prior timeline rehearsal, using the same camera schedule. Warm visits are [0,78,92,104,176,185,206,240,360,540,7200], 24 paused RAF each. Each repetition then plays Fuel 78→104 at 1×, Landing 176→206 at 1×, the same two intervals at 2×, and Fuel aftermath from 360 at 2× for 90 real seconds. Actual Play controls start playback. Screenshots, sampled CPU profiles, query timings and full inventories run separately.

World miss times are actual derivations, distinguished from exact-time shared cache hits. World work is inside React render and these numbers overlap. HUD profiler includes the interface/App root; the scene profiler surrounds its separate R3F root. React commit columns measure layout/commit-effect callbacks, not total commit wall time; passive effects are recorded separately. RAF, application CPU and actual GPU timings are separate observations.

## Measured causes and focused changes

Before selection, the 26-second live Fuel 1× count capture recorded 15,680 status-row renders, 3,128 LCAC-model calls, 1,564 lattice/dish/AAA calls each, and 1,564 persistent-damage renders with 6,256 damaged-tank and 6,256 rupture calls. Moving support wheel components and unchanged machinery appear in CPU stacks. Moving Landing 1× recorded 6,471,668 terrain sampler/cell-view queries, 138,656 finite-radius tire solves and 8,666 road poses. Profile stacks place repeated attribute reads, cell-view allocation and terrain sampling under the moving LAV world calculation.

Changes are restricted to these measured paths:

- Operational details compare every displayed primitive status string. The camera menu subscribes independently. All DOM, labels, native controls, observation precision and world timestamps remain unchanged.
- Constant wheel child lists stay resident inside live steering/roll groups. BTR hull sections compare actual damage/turret inputs. LCAC machinery, fan housings and ramp panels follow the existing owned resource set; live fan, navigation, deck, skirt and hinge transforms still update.
- Static radar lattice/dish and exact AAA inputs are memoized. A destroyed search radar can ignore time only while the timed warning lamp is absent; rotation and destruction still compare exactly.
- Persistent fuel damage compares the side of every actual scorch, tank, rupture, rack and bund boundary plus the exact surface authority. Smoke and fire remain live outside that memo boundary. Backseeks invalidate at the same boundaries.
- The compact support-cell index retains candidate insertion order and uploaded attributes. Per-triangle Float64 constants preserve every subtraction, denominator and barycentric operation. Candidate ranges are traversed directly without temporary typed-array views; support-surface evaluation retains its order without map/spread allocation.
- Road pose is evaluated once for both body and wheels. Each wheel reuses a tire solve only when all three center coordinates are bit-identical within its current three-iteration suspension solve and the axis is unchanged. All iterations, finite-radius contact, station-72 handoff, 0.5 m support tables, signed wheel travel, quaternion fit, suspension and dust schedules remain exact. No arbitrary-time/position cache is added.

No fixed-step/cap/update-rate, readiness job, actor, camera, quality, geometry, bounds, upload policy, event, effect population, material, dependency or framework change is included.

## Exact preservation and ownership

A tracked pre-edit supplement from fixed `62edc66` adds 386 previously uncovered full unprojected worlds and 242,561 exact Float64 support queries. SHA-256: `c12fd0aa45d82930cfc334ce7ebac8a6cf75366140044e9dd581a553c78ee3ca`. It covers all eight departures/handoffs, bends/brakes/holds/dust expiry, busy Fuel/ammunition/light boundaries and terrain/cell/vertex epsilons through 7200. It supplements the existing 4,963-world golden without regenerating or duplicating its timestamps.

New active tests compare the immutable capture, shuffled/backward query histories and retained old snapshots, plus dense indexed/non-indexed triangles, degeneracy, shared edges, overlapping surfaces, insertion-order ties and 2 m/64 m boundaries. Exact existing-path exceptions and reasons are enumerated in `src/test/stage7bSourceAudit.ts`; fixed Git audits chain through earlier stages and every unrelated source is still checked live. The full driver, dated Stage 6C/7A acceptances, historical fixtures/authorities and original timeouts remain protected.

## Timing results

Median-of-three P95 results (1× / 2×): Fuel scene React **14.8/15.2→10.8/11.1 ms**, down **27.0%/27.0%**, meeting the pre-edit primary Fuel target. Moving-Landing actual-world misses **4.3/4.6→2.9/3.2 ms**, down **32.6%/30.4%**, meeting the secondary moving-world target in all repetitions. Landing HUD P95 falls **5.4/6.1→3.6/3.9 ms**. These are reductions in active Fuel and moving/contact Landing; terminal caching alone cannot explain them.

The pre-edit primary Landing scene React target is **missed**: medians **14.1/14.5→14.0/13.9 ms**, only **0.7%/4.1%** lower. It is not relabelled as a 25% scene gain. Live scene reconciliation remains substantial. The required moving-work reduction is demonstrated separately by actual world misses and detailed support-query/solver counts, with exact state/render preservation.

All 12 changed busy Fuel/Landing runs have **16.8–17.4 ms RAF P95**, at the same display floor as the reference. The third 90-second aftermath repetition misses the cadence target (**66.6 ms P95, 199.8 ms max**); its slower interval is retained. Median aftermath P95 is 16.8 ms, but that does not erase this run. No primary warm run reaches 500 ms. A separate failed initial after cohort, including >500 ms first-play tasks, is reported below rather than attributed to an unproven external cause.

### Separately counted live work

These captures use detailed counters outside the primary pacing runs. StrictMode is unchanged. Entries are before→after function calls, including the same short paused bookend. Small differences in parent totals reflect endpoint/bookend ticks; they are shown rather than normalized away.

| Window       |   Dynamic scene / HUD | Status rows | Persistent fuel damage | Each primary radar / lattice / tracking dish / AAA |  LCAC model |
| ------------ | --------------------: | ----------: | ---------------------: | -------------------------------------------------: | ----------: |
| Fuel 1×      | 1564→1564 / 1568→1568 |    15680→80 |                1564→22 |                                             1564→0 |   3128→3128 |
| Landing 1×   | 1804→1804 / 1808→1808 |   18080→280 |                 1804→2 |                                             1804→0 |   3608→3608 |
| Fuel 2×      |     780→784 / 784→788 |     7840→80 |                 780→22 |                                              780→0 |   1560→1568 |
| Landing 2×   |     904→904 / 908→908 |    9080→280 |                  904→0 |                                              904→0 |   1808→1808 |
| Aftermath 2× | 5398→5400 / 5402→5404 |     54020→0 |                 5398→0 |                                             5398→0 | 10796→10800 |

| Moving support window | Terrain sample calls | Temporary cell views | Road poses | Road-wheel evaluations | Finite-radius tire solves |
| --------------------- | -------------------: | -------------------: | ---------: | ---------------------: | ------------------------: |
| Landing 1×            |      6471668→5644506 |            6471668→0 |  8666→4333 |              4333→4333 |             138656→120942 |
| Landing 2×            |      3756860→3278000 |            3756860→0 |  5026→2513 |              2513→2513 |               80416→70162 |

Fuel terrain calls remain 1376→1376 at both speeds, with cell views 1376→0; aftermath has zero support queries on both sides. Each damaged-tank/rupture component falls 6256→88 in Fuel 1× and 7216→8 in Landing 1×. Live LCAC parent calls and road-wheel evaluations remain: only constant children and identical internal calculations are reused. Moving tire solves and terrain calls fall about 12.8%, road-pose duplication halves, and per-query cell-view allocation disappears. This supports the moving-world CPU result without a lower update rate or terminal-only explanation.

Sampled CPU stacks are separate diagnostics. Reference sampled segments cover approximately 65.7 and 109 seconds; the after profile covers approximately 145 seconds. Their unadjusted totals are not a matched timing comparison. Remaining live support-model, smoke and scene reconciliation work is visible in the after stacks.

The clean fresh after first play reaches T+206.0333 in **206.0333 real seconds**, with **16.67/16.80/17.80 ms** RAF; the fresh reference is **24.93/83.30/250.00 ms** in **209.3673 s**. UI/first draw/ready are **225.3/3197.6/3947.8 ms** after versus **406.8/3304.7/4002.2 ms** before. Post-scene preparation is **750.2 vs 697.5 ms**; the nine existing jobs and 12 s cooperative budget are unchanged. These are one fresh natural play per accepted context, with warmed development modules/browser-driver caches, not a guaranteed cold-install result. The initial after context's failures remain a first-use limitation.

### All three paired repetitions

All durations are ms; B=fixed reference, A=changed app. Each cell M/P95/max uses the complete in-window samples.

| Run               |      RAF M/P95/max | Long tasks n/total/max |  Real s |     Sim start→end |
| ----------------- | -----------------: | ---------------------: | ------: | ----------------: |
| B-r1-fuel-1x      |  16.75/16.80/33.60 |                  0/0/0 | 26.0333 |  78.0000→104.0333 |
| A-r1-fuel-1x      |  16.67/16.80/17.70 |                  0/0/0 | 26.0500 |  78.0000→104.0333 |
| B-r1-landing-1x   | 16.99/16.80/134.30 |              2/228/124 | 30.1499 | 176.0000→206.0333 |
| A-r1-landing-1x   |  16.69/16.80/66.90 |                  0/0/0 | 30.0333 | 176.0000→206.0333 |
| B-r1-fuel-2x      |  16.67/16.80/17.70 |                  0/0/0 | 13.0333 |  78.0000→104.0667 |
| A-r1-fuel-2x      |  16.67/16.80/17.80 |                  0/0/0 | 13.0332 |  78.0000→104.0667 |
| B-r1-landing-2x   |  16.93/16.80/33.70 |                  0/0/0 | 15.0508 | 176.0000→206.0667 |
| A-r1-landing-2x   |  16.72/16.80/33.30 |                  0/0/0 | 15.0499 | 176.0000→206.0667 |
| B-r1-aftermath-2x |  16.71/16.80/33.80 |                  0/0/0 | 90.0165 | 360.0000→540.0000 |
| A-r1-aftermath-2x |  16.67/16.80/17.70 |                  0/0/0 | 90.0165 | 360.0000→540.0000 |
| B-r2-fuel-1x      |  16.87/16.80/50.00 |                  0/0/0 | 26.0500 |  78.0000→104.0333 |
| A-r2-fuel-1x      |  16.68/16.80/33.30 |                  0/0/0 | 26.0500 |  78.0000→104.0333 |
| B-r2-landing-1x   |  16.80/16.80/33.40 |                  0/0/0 | 30.0333 | 176.0000→206.0333 |
| A-r2-landing-1x   |  16.80/16.80/49.10 |                  0/0/0 | 30.0500 | 176.0000→206.0333 |
| B-r2-fuel-2x      |  16.93/16.80/33.40 |                  0/0/0 | 13.0500 |  78.0000→104.0667 |
| A-r2-fuel-2x      |  17.01/17.40/34.40 |                  0/0/0 | 13.0332 |  78.0000→104.0667 |
| B-r2-landing-2x   |  17.10/16.80/50.00 |                  0/0/0 | 15.0501 | 176.0000→206.0667 |
| A-r2-landing-2x   |  16.76/16.80/33.40 |                  0/0/0 | 15.0333 | 176.0000→206.0667 |
| B-r2-aftermath-2x |  16.67/16.80/33.30 |                  0/0/0 | 90.0165 | 360.0000→540.0000 |
| A-r2-aftermath-2x |  16.68/16.80/33.40 |                  0/0/0 | 90.0165 | 360.0000→540.0000 |
| B-r3-fuel-1x      |  16.88/16.80/33.60 |                  0/0/0 | 26.0499 |  78.0000→104.0333 |
| A-r3-fuel-1x      |  16.68/16.80/33.40 |                  0/0/0 | 26.0499 |  78.0000→104.0333 |
| B-r3-landing-1x   |  16.94/16.80/33.40 |                  0/0/0 | 30.0499 | 176.0000→206.0333 |
| A-r3-landing-1x   |  16.73/16.80/33.40 |                  0/0/0 | 30.0500 | 176.0000→206.0333 |
| B-r3-fuel-2x      |  16.88/16.80/33.40 |                  0/0/0 | 13.0500 |  78.0000→104.0667 |
| A-r3-fuel-2x      |  16.71/16.80/33.40 |                  0/0/0 | 13.0332 |  78.0000→104.0667 |
| B-r3-landing-2x   |  16.83/17.60/33.40 |                  0/0/0 | 15.0332 | 176.0000→206.0667 |
| A-r3-landing-2x   |  16.69/16.80/33.30 |                  0/0/0 | 15.0499 | 176.0000→206.0667 |
| B-r3-aftermath-2x |  16.68/17.30/33.50 |                  0/0/0 | 90.0166 | 360.0000→540.0000 |
| A-r3-aftermath-2x | 23.73/66.60/199.80 |          271/19270/212 | 90.0165 | 360.0000→539.6667 |

| Run               | Actual world misses n; M/P95/max | Shared cache hits/misses | Scene React render M/P95/max | HUD React render M/P95/max |
| ----------------- | -------------------------------: | -----------------------: | ---------------------------: | -------------------------: |
| B-r1-fuel-1x      |              781; 0.23/0.30/0.40 |                 3128/782 |             4.98/15.00/35.80 |             1.00/2.60/2.90 |
| A-r1-fuel-1x      |              781; 0.24/0.30/0.60 |                 3128/782 |             3.59/10.80/12.00 |             0.73/1.50/2.50 |
| B-r1-landing-1x   |             899; 2.40/4.30/13.90 |                 3600/900 |             5.26/16.30/62.20 |            3.30/5.70/50.20 |
| A-r1-landing-1x   |              900; 1.72/2.90/3.50 |                 3604/901 |             3.98/12.70/18.00 |             2.20/3.50/4.90 |
| B-r1-fuel-2x      |              391; 0.22/0.30/0.60 |                 1568/392 |             3.97/15.20/17.40 |             0.87/2.50/4.00 |
| A-r1-fuel-2x      |              391; 0.24/0.30/0.40 |                 1568/392 |             3.20/10.80/17.10 |             0.69/1.50/1.90 |
| B-r1-landing-2x   |              451; 2.65/4.60/9.20 |                 1808/452 |             3.99/14.00/22.40 |            3.36/5.90/14.00 |
| A-r1-landing-2x   |              451; 1.96/3.40/4.10 |                 1808/452 |             4.33/12.70/19.60 |             2.48/4.00/5.40 |
| B-r1-aftermath-2x |             2700; 0.12/0.20/0.80 |               10804/2701 |             3.29/10.60/22.90 |             0.88/2.50/5.60 |
| A-r1-aftermath-2x |             2700; 0.13/0.20/0.30 |               10804/2701 |              3.33/8.80/11.50 |             0.65/1.40/1.90 |
| B-r2-fuel-1x      |              781; 0.21/0.30/0.40 |                 3128/782 |             3.72/14.80/34.70 |             0.85/2.40/2.80 |
| A-r2-fuel-1x      |              781; 0.24/0.30/0.50 |                 3128/782 |             3.63/10.70/27.80 |             0.73/1.50/1.90 |
| B-r2-landing-1x   |              901; 2.41/4.20/5.70 |                 3608/902 |             4.08/14.10/22.00 |             3.14/5.40/6.90 |
| A-r2-landing-1x   |              901; 1.67/2.80/5.80 |                 3608/902 |             4.84/14.40/24.00 |             2.21/3.60/6.10 |
| B-r2-fuel-2x      |              391; 0.22/0.30/0.40 |                 1568/392 |             4.21/15.20/32.90 |             0.92/2.50/2.80 |
| A-r2-fuel-2x      |              391; 0.25/0.40/0.60 |                 1568/392 |             4.67/12.30/28.90 |             0.85/1.60/4.80 |
| B-r2-landing-2x   |              451; 2.70/4.60/5.50 |                 1808/452 |             4.77/15.80/24.70 |             3.56/6.10/7.70 |
| A-r2-landing-2x   |              451; 1.94/3.10/7.10 |                 1808/452 |             4.99/14.10/24.90 |             2.50/3.90/9.80 |
| B-r2-aftermath-2x |             2700; 0.12/0.20/0.30 |               10804/2701 |             3.11/10.60/12.70 |             0.85/2.60/4.10 |
| A-r2-aftermath-2x |             2700; 0.13/0.20/0.30 |               10804/2701 |              3.87/9.10/15.20 |             0.69/1.40/3.40 |
| B-r3-fuel-1x      |              781; 0.21/0.30/0.50 |                 3128/782 |             3.73/14.80/17.90 |             0.86/2.60/3.30 |
| A-r3-fuel-1x      |              781; 0.22/0.30/1.20 |                 3128/782 |             4.34/11.10/26.40 |             0.78/1.50/2.50 |
| B-r3-landing-1x   |              901; 2.42/4.30/6.00 |                 3608/902 |             4.07/13.90/22.20 |             3.16/5.40/9.70 |
| A-r3-landing-1x   |              901; 1.69/2.90/3.80 |                 3608/902 |             4.92/14.00/25.20 |             2.24/3.70/5.70 |
| B-r3-fuel-2x      |              391; 0.21/0.30/0.40 |                 1568/392 |             3.80/15.10/17.20 |             0.86/2.60/2.80 |
| A-r3-fuel-2x      |              391; 0.23/0.30/1.50 |                 1568/392 |             4.46/11.10/31.00 |             0.80/1.50/2.60 |
| B-r3-landing-2x   |              451; 2.75/4.70/6.60 |                 1808/452 |             4.48/14.50/27.70 |             3.55/6.10/9.10 |
| A-r3-landing-2x   |              451; 1.90/3.20/3.90 |                 1808/452 |             4.87/13.90/22.40 |             2.44/3.80/4.90 |
| B-r3-aftermath-2x |             2700; 0.12/0.20/0.30 |               10800/2700 |             3.18/10.70/13.10 |             0.86/2.60/3.80 |
| A-r3-aftermath-2x |             2346; 0.25/0.60/5.50 |                9384/2346 |            8.22/38.50/136.90 |            1.40/5.00/17.90 |

| Run               | Scene commit effects M/P95/max | HUD commit effects M/P95/max | Renderer CPU M/P95/max | Compile/link calls | Buffer data/subdata calls | In-window uploaded bytes |
| ----------------- | -----------------------------: | ---------------------------: | ---------------------: | -----------------: | ------------------------: | -----------------------: |
| B-r1-fuel-1x      |                 0.09/0.20/1.40 |               0.00/0.00/0.00 |        4.15/4.80/11.60 |                  0 |                 184/20462 |                 45444864 |
| A-r1-fuel-1x      |                 0.09/0.20/1.30 |               0.00/0.00/0.00 |         4.27/4.90/7.20 |                  0 |                 184/20462 |                 45444864 |
| B-r1-landing-1x   |                 0.19/0.40/0.90 |               0.00/0.00/0.00 |         1.91/2.70/6.60 |                  0 |                 729/24460 |                 27498752 |
| A-r1-landing-1x   |                 0.20/0.40/0.70 |               0.00/0.00/0.00 |         2.04/2.80/7.10 |                  0 |                 729/24487 |                 27529216 |
| B-r1-fuel-2x      |                 0.09/0.20/1.60 |               0.00/0.00/0.00 |        4.36/5.60/11.30 |                  0 |                 184/10246 |                 23084288 |
| A-r1-fuel-2x      |                 0.10/0.20/1.20 |               0.00/0.00/0.00 |        4.33/4.90/12.60 |                  0 |                 184/10246 |                 23084288 |
| B-r1-landing-2x   |                 0.20/0.40/0.60 |               0.00/0.00/0.00 |         1.79/2.40/5.20 |                  0 |                  24/12292 |                 13779840 |
| A-r1-landing-2x   |                 0.22/0.40/1.40 |               0.00/0.00/0.00 |         1.94/2.70/4.70 |                  0 |                  24/12292 |                 13779840 |
| B-r1-aftermath-2x |                 0.21/0.40/1.50 |               0.00/0.00/0.00 |        3.98/4.70/11.20 |                  0 |                 731/94731 |                196726528 |
| A-r1-aftermath-2x |                 0.21/0.40/0.50 |               0.00/0.00/0.00 |        4.01/4.80/10.50 |                  0 |                 731/94731 |                196726528 |
| B-r2-fuel-1x      |                 0.08/0.20/1.20 |               0.00/0.00/0.00 |         4.22/4.90/6.20 |                  0 |                 184/20462 |                 45444864 |
| A-r2-fuel-1x      |                 0.08/0.20/1.30 |               0.00/0.00/0.00 |         4.27/4.90/6.30 |                  0 |                 184/20462 |                 45444864 |
| B-r2-landing-1x   |                 0.19/0.40/0.50 |               0.00/0.00/0.00 |         2.03/2.70/5.30 |                  0 |                 729/24514 |                 27559680 |
| A-r2-landing-1x   |                 0.19/0.40/0.90 |               0.00/0.00/0.00 |         1.99/2.80/6.50 |                  0 |                 729/24514 |                 27559680 |
| B-r2-fuel-2x      |                 0.09/0.20/1.10 |               0.00/0.00/0.00 |         4.19/4.70/6.10 |                  0 |                 184/10246 |                 23084288 |
| A-r2-fuel-2x      |                 0.11/0.20/1.70 |               0.00/0.00/0.00 |        4.58/6.10/15.50 |                  0 |                 184/10246 |                 23084288 |
| B-r2-landing-2x   |                 0.21/0.40/0.50 |               0.00/0.00/0.00 |         1.99/2.70/5.50 |                  0 |                  24/12292 |                 13779840 |
| A-r2-landing-2x   |                 0.22/0.40/0.50 |               0.00/0.00/0.00 |        1.97/2.70/13.80 |                  0 |                  24/12292 |                 13779840 |
| B-r2-aftermath-2x |                 0.21/0.40/1.40 |               0.00/0.00/0.00 |        4.05/4.80/12.10 |                  0 |                 729/94733 |                196726528 |
| A-r2-aftermath-2x |                 0.21/0.40/1.00 |               0.00/0.00/0.00 |        3.98/4.80/10.60 |                  0 |                 729/94733 |                196653696 |
| B-r3-fuel-1x      |                 0.08/0.20/1.30 |               0.00/0.00/0.00 |         4.17/4.70/6.10 |                  0 |                 184/20462 |                 45444864 |
| A-r3-fuel-1x      |                 0.09/0.20/1.30 |               0.00/0.00/0.00 |        4.23/4.90/10.80 |                  0 |                 184/20462 |                 45444864 |
| B-r3-landing-1x   |                 0.20/0.40/0.50 |               0.00/0.00/0.00 |         2.05/2.70/6.50 |                  0 |                 729/24514 |                 27559680 |
| A-r3-landing-1x   |                 0.18/0.40/0.50 |               0.00/0.00/0.00 |         1.95/2.60/8.50 |                  0 |                 729/24514 |                 27559680 |
| B-r3-fuel-2x      |                 0.09/0.20/1.20 |               0.00/0.00/0.00 |         4.26/5.00/9.40 |                  0 |                 184/10246 |                 23084288 |
| A-r3-fuel-2x      |                 0.10/0.20/1.40 |               0.00/0.00/0.00 |        4.46/5.40/12.50 |                  0 |                 184/10246 |                 23084288 |
| B-r3-landing-2x   |                 0.22/0.40/1.20 |               0.00/0.00/0.00 |         2.01/2.70/5.50 |                  0 |                  24/12292 |                 13779840 |
| A-r3-landing-2x   |                 0.21/0.40/1.40 |               0.00/0.00/0.00 |         1.86/2.50/3.40 |                  0 |                  24/12292 |                 13779840 |
| B-r3-aftermath-2x |                 0.20/0.40/1.60 |               0.00/0.00/0.00 |        3.97/4.60/10.60 |                  0 |                   0/94718 |                196653696 |
| A-r3-aftermath-2x |                0.52/1.60/17.20 |               0.00/0.00/0.00 |       7.69/19.40/64.60 |                  0 |                   0/82302 |                170861696 |

Shared cache/native-call counters include the bounded ≤250 ms paused export bookend; bytes and timing summaries are filtered to Play→end. All warm program/uniform/attribute query counts and measured native query CPU are zero. HUD commit effects are below the 0.1 ms timer resolution. Passive-effect rows and exact cache-hit/miss attribution are retained in the raw captures. Parent/child/world timings overlap and are not added.

### Fresh first plays and retained failed cohorts

All durations are ms; B=fixed reference, A=changed app. Each cell M/P95/max uses the complete in-window samples.

| Run                               |       RAF M/P95/max | Long tasks n/total/max |   Real s |     Sim start→end |
| --------------------------------- | ------------------: | ---------------------: | -------: | ----------------: |
| A-first                           |   16.67/16.80/17.80 |                  0/0/0 | 206.0330 |   0.0000→206.0333 |
| diagnostic-slow-A-first           |  31.61/84.40/883.80 |         1081/89788/878 | 211.2996 |   0.0000→206.1000 |
| diagnostic-slow-A-r1-aftermath-2x |  40.40/83.30/283.30 |          820/53938/301 |  90.0665 | 360.0000→539.4667 |
| diagnostic-slow-A-r1-fuel-1x      | 50.78/100.10/250.00 |          209/16801/216 |  26.9333 |  78.0000→104.0667 |
| diagnostic-slow-A-r1-fuel-2x      | 50.51/100.00/183.30 |           107/8349/182 |  13.2000 |  78.0000→104.0667 |
| diagnostic-slow-A-r1-landing-1x   | 40.86/100.00/150.00 |          223/17490/139 |  30.3832 | 176.0000→206.0333 |
| diagnostic-slow-A-r1-landing-2x   | 62.11/116.60/183.30 |          125/10643/180 |  15.4499 | 176.0000→206.1333 |
| diagnostic-slow-A-r2-fuel-1x      | 62.26/100.10/233.40 |          222/18299/187 |  26.5501 |  78.0000→104.0333 |
| B-first                           |  24.93/83.30/250.00 |          725/63589/246 | 209.3673 |   0.0000→206.0333 |

| Run                               | Actual world misses n; M/P95/max | Shared cache hits/misses | Scene React render M/P95/max | HUD React render M/P95/max |
| --------------------------------- | -------------------------------: | -----------------------: | ---------------------------: | -------------------------: |
| A-first                           |             6181; 0.53/2.10/7.10 |               24777/6194 |             3.76/11.80/17.60 |             1.07/2.60/7.60 |
| diagnostic-slow-A-first           |            4560; 1.31/6.90/55.20 |               18293/4573 |           15.57/57.00/435.40 |           3.20/10.70/96.60 |
| diagnostic-slow-A-r1-aftermath-2x |            1876; 0.33/0.50/11.40 |                7508/1877 |            20.22/45.50/64.80 |            2.74/6.20/22.50 |
| diagnostic-slow-A-r1-fuel-1x      |              476; 0.63/1.10/3.70 |                 1908/477 |           23.74/59.10/152.90 |            3.23/7.20/14.90 |
| diagnostic-slow-A-r1-fuel-2x      |              243; 0.57/0.90/3.50 |                  976/244 |           24.26/59.10/142.30 |             2.99/6.30/8.30 |
| diagnostic-slow-A-r1-landing-1x   |            582; 5.35/12.10/28.20 |                 2332/583 |           22.92/62.00/102.00 |           7.61/16.80/33.50 |
| diagnostic-slow-A-r1-landing-2x   |            243; 8.03/17.50/22.80 |                  976/244 |           28.97/62.80/123.20 |          10.89/23.80/30.20 |
| diagnostic-slow-A-r2-fuel-1x      |              418; 0.66/1.00/4.10 |                 1676/419 |           27.34/58.90/141.50 |            3.40/6.70/10.10 |
| B-first                           |            4988; 0.85/3.20/10.40 |               20005/5001 |           12.36/58.30/208.90 |           2.97/10.00/26.50 |

| Run                               | Scene commit effects M/P95/max | HUD commit effects M/P95/max | Renderer CPU M/P95/max | Compile/link calls | Buffer data/subdata calls | In-window uploaded bytes |
| --------------------------------- | -----------------------------: | ---------------------------: | ---------------------: | -----------------: | ------------------------: | -----------------------: |
| A-first                           |                 0.10/0.20/1.70 |               0.00/0.00/0.00 |        2.56/4.40/20.00 |                198 |              11789/149497 |                180214036 |
| diagnostic-slow-A-first           |                 0.31/0.90/6.10 |               0.00/0.00/0.00 |      6.80/16.90/442.00 |                198 |              11645/103537 |                120734868 |
| diagnostic-slow-A-r1-aftermath-2x |                 0.81/1.70/5.80 |               0.00/0.00/0.00 |     13.71/19.70/255.10 |                  0 |                 731/65827 |                136616576 |
| diagnostic-slow-A-r1-fuel-1x      |                 0.32/0.60/6.00 |               0.00/0.00/0.00 |     16.25/24.30/121.30 |                  0 |                 184/12459 |                 28073152 |
| diagnostic-slow-A-r1-fuel-2x      |                 0.36/0.50/4.90 |               0.00/0.00/0.00 |      14.72/22.80/37.70 |                  0 |                  184/6381 |                 14685248 |
| diagnostic-slow-A-r1-landing-1x   |                 0.63/1.60/2.60 |               0.00/0.00/0.00 |       6.93/11.10/27.70 |                  0 |                 729/15887 |                 17868160 |
| diagnostic-slow-A-r1-landing-2x   |                 0.90/1.70/2.00 |               0.00/0.00/0.00 |       7.55/10.90/13.30 |                  0 |                   24/6637 |                  7404928 |
| diagnostic-slow-A-r2-fuel-1x      |                 0.37/0.60/5.80 |               0.00/0.00/0.00 |      18.80/25.40/49.80 |                  0 |                 184/10961 |                 24668672 |
| B-first                           |                0.18/0.50/11.90 |               0.00/0.00/0.00 |       4.34/14.60/84.80 |                198 |              11161/120651 |                139648692 |

Shared cache/native-call counters include the bounded ≤250 ms paused export bookend; bytes and timing summaries are filtered to Play→end. All warm program/uniform/attribute query counts and measured native query CPU are zero. HUD commit effects are below the 0.1 ms timer resolution. Passive-effect rows and exact cache-hit/miss attribution are retained in the raw captures. Parent/child/world timings overlap and are not added.

## Fresh integration, rendering and resources

Both app/node TypeScript no-emit checks, lint with zero errors/warnings, and **739 tests across 66 files** pass. The full suite took **92.33 s** with the viewer suspended and `stage7b-review.local/` physically absent; no test needs ignored evidence or a GPU. Original timeouts remain unchanged.

All **25 complete fixed-pose RGB pairs are bit-identical**, including all 24 camera roles and Fuel at 7200: zero changed pixels across 23,040,000 pixels, with no mask or relaxed threshold. These are lossless 1280×720 PNGs captured with an explicit full CSS-viewport clip. Capture metadata confirms equal time, camera, controls, drawing buffer and DPR, with unchanged antialiasing configuration; the largest before/after camera-position rounding difference is 1.137×10⁻¹³ m and produces identical pixels. Earlier native-panel JPEGs covered only 659×720 pixels; they are retained as `diagnostic-panel-*`, excluded, and replaced on both sides. The earlier cropped layout screenshots were likewise replaced with full-viewport images.

Actual rendering passes **613 checkpoints per version** (227 existing plus 386 added), with **35 roots, 64 LAV wheels and 65 landscape batches** at every checkpoint. Both sides have zero root-position error, maximum quaternion error **5.162×10⁻⁸ rad** and wheel-center error **9.095×10⁻¹³ m**. Fans, ramps, navigation, visible GPU water/wear clocks and effect matrices pass. The full isolated audit is accepted; an interrupted 176-record after audit is retained separately and not counted.

Moving-world miss attribution remains one derivation per distinct time in the HUD: the scene and camera are exact-time cache hits. For example, reference Fuel 1× has 782 misses among 3,910 calls, with zero scene/camera misses; Landing has 900 among 4,500. After Fuel is identical and Landing is 901 among 4,505. Multiple consumers do not perform multiple complete world derivations.

### Actual GPU queries, separate from CPU/RAF

Each cell is GPU median/P95 ms over 40 queries after discarding five warm-up draws. All 24 captures are non-disjoint. Both query orders retain identical calls/triangles. Results are mixed by view/order; no universal GPU speedup is claimed.

| Order / preset / time         |   Before GPU |    After GPU | Calls / triangles |
| ----------------------------- | -----------: | -----------: | ----------------: |
| forward / overview / 0        | 7.877/10.642 | 6.794/11.795 |       2914/667015 |
| forward / fuel-storage / 78.1 | 9.796/12.421 | 7.844/10.386 |       1740/538485 |
| forward / ammunition / 133    |  7.753/9.950 |  8.868/9.102 |        431/497351 |
| forward / lcac-east / 186     |  5.674/7.342 |  4.604/7.186 |        233/392886 |
| forward / lav-west / 183      |  4.612/8.666 |  6.502/7.447 |        277/342850 |
| forward / fuel-storage / 7200 | 6.667/11.805 | 8.996/12.492 |       1507/525663 |
| reverse / fuel-storage / 7200 | 9.475/11.931 |  7.267/9.149 |       1507/525663 |
| reverse / lav-west / 183      | 7.078/10.481 |  4.373/7.443 |        277/342850 |
| reverse / lcac-east / 186     |  7.064/8.705 |  7.193/7.595 |        233/392886 |
| reverse / ammunition / 133    | 6.390/10.496 |  8.861/9.394 |        431/497351 |
| reverse / fuel-storage / 78.1 | 9.794/11.489 | 8.894/12.256 |       1740/538485 |
| reverse / overview / 0        | 8.459/12.973 | 6.800/12.127 |       2914/667015 |

### Ten real minutes and repeated resource ownership

The new low-overhead 2× session runs uninterrupted for **600.0001 real seconds**, T+360→1559.9999999999, with **35,994 RAF samples**, no pause/seek/restart/reload, one reset version and no recorder truncation. Detailed counters and CPU sampling are disabled; start/end inventories run outside pacing.

| Metric                          |    Mean / P95 / max ms |
| ------------------------------- | ---------------------: |
| RAF                             |  16.67 / 16.80 / 33.70 |
| Actual world miss, 18,000 calls |  0.120 / 0.200 / 1.400 |
| Scene React render              | 3.038 / 8.900 / 18.900 |
| HUD React render                |  0.595 / 1.400 / 3.600 |
| Scene commit effects            |  0.188 / 0.400 / 1.300 |
| Renderer CPU                    | 3.921 / 4.800 / 15.000 |

There are **zero application long tasks**, zero compile/link or program/uniform/attribute query calls, and 1,311,324,160 in-window dynamic-upload bytes. HUD commit effects remain below timer resolution. All **936** world resource/upload rows remain unchanged throughout the endpoint comparison; all 35 actor identities and 231 pool identities/capacities remain exact. Geometries/materials/textures/programs stay **989/340/3/319**, with 2,827 meshes.

Afterward, one warmed reference cycle plus **five additional restart/seek/all-24-camera cycles** return to T+360/LAV west. Every endpoint is **261 calls / 372946 triangles / 989 geometries / 340 materials / 3 textures / 319 programs / 2827 meshes**. All 35 actor-root UUIDs remain resident. All 910 fixed world upload rows remain byte/identity/version exact; only the 26 existing blast-response matrix versions change. Every one of the 231 pool capacities is unchanged, totalling 9,528 slots, with no count exceeding capacity. The 183 resident pool UUIDs remain; 48 conditional effect pools remount across restart, matching the inherited lifecycle rather than being counted as resident actor churn. Their capacities and equal-time resource counts remain flat. Normal operations leave readiness generation at 2, with nine of nine jobs complete.

Existing bounds remain four road routes, two centerlines, support samples **[1329,1311,1319,1306]** within **[1607,1605,1857,1860]**, wheel-arc samples **[1327,1309,1317,1304]**, two recent-birth caches capped at **128** each, and **eight** settled payloads. Exact-time world storage still holds only its last result. Constant wheel lists are finite by authored variant; LCAC element ownership remains keyed to its existing resource set.

The four immutable support-index owners hold **[202032,1049,957,636] triangles**. New Float64 constants occupy **16,373,920 bytes (15.62 MiB)** total; compact cell storage remains **1,085,844 bytes**. This is a finite CPU-memory tradeoff for repeated live arithmetic/attribute reads, with no uploaded geometry change or retained arbitrary query inputs. Bounds and allocated bytes are identical before/after the ten-minute run and in every resource cycle. Reading diagnostics does not initialize another owner. No readiness work was added or moved out of the live world into preparation; the first-play readiness cost is reported above.

### Native controls, layouts and recovery

All 24 native camera options pass while paused; maximum position error from the expected frame is 1.819×10⁻¹² m. Actual orbit, right-drag pan and scroll zoom change the camera at fixed T+186 while wheels, fans, navigation lights, fire/smoke matrices, fire lights and visible water/wear clocks stay frozen. Inspection after the reveal has zero errors. Native recenter restores the exact expected position/target. Every speed (0.5×/1×/2×) advances and pauses correctly. Native direct observation reaches 7200 with the scripted slider pinned at its unchanged maximum of 180, then seeks backward to zero. Restart returns to paused zero.

Canvas keyboard Right/Shift+Right/Left/Home/End produce **1/11/10/0/180** seconds. Space plays and Enter pauses. Home/End/ArrowRight in the observation field leave world time unchanged; its own Enter submits the typed 42. Disclosure, scroll-region and native-selector keys remain isolated. A focused playback button toggles once through its own Space activation. Native slider Home/End/ArrowLeft produce 0 and 179.9, preserving its 0.1-second step.

At **1280×720, 1280×540 and 1440×900**, all interactive bounds fit. Complete operational details scroll to the last Industrial row, with zero horizontal overflow; their content is 700 px high and scrollable view heights are 409/229/589 px. Native recenter and viewport framing remain correct. Full-viewport screenshots are retained, and temporary viewport overrides are cleared afterward.

A deliberate renderer compile failure exposes truthful failed progress (**0/9**), disables Play/slider/observation input, and blocks Space without changing T+186 or camera. The original renderer method is restored; the actual **Retry preparation** button completes **9/9**, retaining time/preset and staying paused. Native `WEBGL_lose_context` during Play pauses at T+186.9333333333 and reports cancelled/context lost. A native selection of LAV east while lost survives restoration. Recovery completes **9/9** at the same time, stays paused, and passes a fresh rendered audit of 35 roots/64 wheels. Subsequent actual Play/Pause succeeds. Console has zero JavaScript errors; only the inherited Clock deprecation and expected context-loss/restoration messages remain. All temporary viewers are closed after capture.

Final validation also preserves task-start `prompt.md`, `AGENTS.md`, package and lock bytes, plus byte-identical dated Stage 6C/7A acceptance. The plan, current integration pointer and changelog are updated separately. No build command, dependency change or framework upgrade was used.

| Permitted check                                | Result                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `pnpm exec tsc -p tsconfig.app.json --noEmit`  | PASS                                                        |
| `pnpm exec tsc -p tsconfig.node.json --noEmit` | PASS                                                        |
| `pnpm lint`                                    | PASS, zero errors/warnings                                  |
| `pnpm test:run --maxWorkers=2`                 | PASS, 739 tests / 66 files, 92.33 s suite / 92.65 s wrapper |
| `git diff --check`                             | PASS                                                        |
| Full-size lossless RGB comparison              | PASS, 25 pairs / 23,040,000 pixels / zero differences       |
| Resource/control/recovery evidence assertions  | PASS, six inventories including five repeated cycles        |
| Protected task-start bytes                     | PASS, prompt/AGENTS/package/lock and Stage 6C/7A acceptance |

## Retained diagnostics and limits

The initial after context failed the intended timing envelope: its first play had 31.61/84.40/883.80 ms mean/P95/max RAF, with 878/596/549 ms long tasks. Its first four warm busy windows also ran substantially slower. All raw complete windows remain under `diagnostic-slow-after-*`, with a separate sampled slowdown profile; the next Fuel window overlaps that profile and is labelled accordingly. Actual viewport/buffer/DPR/AA, visible status and one renderer were verified. A subsequent short fixed-reference check remained near its earlier range. No particular OS, external application or GC cause has been established, and absence of shader compilation does not explain the stalls. A fresh after context with explicit normal CPU emulation is tested separately; the failed cohort is not silently removed or presented as an improvement.

Initial synchronous terrain/coast construction remains outside this bounded optimization. Actual GPU results may vary with order and browser/driver caches. CPU reductions and identical draw counts do not establish universal GPU or frame-rate improvement. No build or deployment is claimed. No new combat, audio, visible humans, occupants or silhouettes were introduced.

Optional bounded raw evidence and measurement helpers are indexed in `stage7b-review.local/README.md`; default checks do not depend on them.

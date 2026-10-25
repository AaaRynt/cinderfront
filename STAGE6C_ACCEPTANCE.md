# Stage 6C acceptance — 2026-10-25

**Status: COMPLETE. Stage 6C and parent Stage 6 are complete for the agreed visual, scripted and bounded-aftermath scope.** Presentation fixes, measured rendering optimization, exact preservation, the complete replay, five warmed resource cycles, the fresh ten-real-minute session and final self-contained checks pass.

## Visible result and scope

The baseline at `5f940b5` showed a terrain-obstructed Beach inland view, broad regional framing, separate dark faceted smoke balls, a finite sea edge, detached/low-detail shadows and large HUD panels with truncated text. Fresh baseline images confirmed these problems before editing.

- Both beach regions now fit the actual two craft/eight vehicle bounds and shore context throughout holding, approach, beaching, unloading, turns and final holds. Industrial covers tanks and magazines; Radar covers the four installations; Harbor and Corridor retain their principal structures. Viewport framing reserves the header/timeline at 1280×720, 1280×540 and 1440×900. All 24 IDs remain.
- Follows use absolute runtime poses/headings. Wasp follows its full scripted patrol as well as aftermath. Direct seeks reconstruct immediately; a requested preset cuts to its safe sight line and settles a 4% dolly over 0.22 s. Manual orbit/pan/zoom remains free while paused and survives playback/seek deltas until recenter.
- Shared camera-facing smoke has feathered procedural core/body/edge shading. Fuel, ammunition, ship damage and BTR/T-72/Pantsir wreck paths retain their existing anchors, slots, ages, transforms and lifetimes. Soft tapered flames retain the original base convention. Smoke uses two triangles per puff instead of 80/96, with an explicitly bounded 1.35×1.65 presentation envelope and conservative culling spheres. Damaged tank materials retain more structure.
- Cold dawn fill and the existing single 1024 shadow map now follow the observation target. Half-width is bounded to 180–2200 m, snapped to shadow texels; normal bias is 0.22 m instead of 18 m. The main terrain still receives shadows; its unnecessary 202,064-triangle shadow submission is removed. Main-view actors remain present.
- Rougher water and distance-filtered visual normals restrain banding. An owned eight-triangle sea extension lies entirely outside the original map rectangle at the same −0.12 m mean level. Road shoulders blend toward soil within the existing width through a render-only attribute. Original positions/normals/indices, coastal harmonics, classification and support queries remain exact.
- A grouped native camera selector, recenter control, visible deployment count and scrollable operational disclosure leave useful scene space. Complete event/status labels wrap. All speeds, the fixed 0–180 slider, observation input, local/runtime labels and keyboard isolation remain. Departed Su-30 display labels are truthful.

No dependency/version/framework, authority asset, landscape layout, actor/event/outcome or human/occupant content was added or changed. No build or deployment was performed.

## Two separate comparison sets

Optional evidence is indexed in [stage6c-review.local/README.md](stage6c-review.local/README.md); tests require none of it.

1. **Fixed baseline poses:** 31 pairs use identical old camera position/target/FOV, observation time, 1280×720 viewport, selected DPR and antialiasing. `before-{slug}.png` pairs with `final-fixed-{slug}.png`; [raw comparison](stage6c-review.local/final-comparison.json). Maximum measured position/target mismatch is 2.274×10⁻¹³ m. The first 28 use DPR 1; the three close views use DPR 1.5. AA remains enabled, exposure 1.12. The original 28 captures precede implementation; the three added close baselines use the immutable `5f940b5` reference checkout.
2. **Revised composition:** the same first 28 old views/times pair with `final-preset-720-{slug}.png`. Separate 540/900 sets cover every original preset at the requested dimensions. [720 contact sheet](stage6c-review.local/final-preset-720-sheet.jpg), [540 sheet](stage6c-review.local/final-preset-540-sheet.jpg), [900 sheet](stage6c-review.local/final-preset-900-sheet.jpg). Changed preset poses are excluded from optimization claims.

Useful direct examples: Beach unloading [before](stage6c-review.local/before-beach-unload.png) / [revised composition](stage6c-review.local/final-preset-720-beach-unload.png); close fuel [before](stage6c-review.local/before-fuel-close-front.png) / [fixed-pose after](stage6c-review.local/final-fixed-fuel-close-front.png); reverse smoke [before](stage6c-review.local/before-fuel-close-reverse.png) / [after](stage6c-review.local/final-fixed-fuel-close-reverse.png); expanded [540 px HUD](stage6c-review.local/final-hud-540-expanded-bottom.png).

### Submitted rendering work at fixed old poses

Counts include main and shadow work, transparent effects and the new sea extension. These are measured submission reductions, independent of changed preset framing.

| Paired slug / T+         | Calls before → after | Triangles before → after |
| ------------------------ | -------------------: | -----------------------: |
| overview / 0             |          2639 → 2095 |          853641 → 620673 |
| harbor / 0               |           1694 → 641 |          740929 → 472405 |
| corridor / 0             |          2446 → 1373 |          728561 → 479161 |
| radar / 0                |           1379 → 271 |          697068 → 451912 |
| beach-hold / 0           |           1645 → 584 |          661072 → 401836 |
| offshore / 0             |          2195 → 1090 |          815200 → 552668 |
| industrial / 0           |          1966 → 1283 |          637415 → 392391 |
| fuel-busy / 109          |          2022 → 1210 |          770965 → 501379 |
| ammo-busy / 132.4        |           1498 → 408 |          764652 → 489820 |
| fuel-late / 600          |          1831 → 1084 |          767507 → 493713 |
| lcac-approach / 140      |           1449 → 297 |          630365 → 335791 |
| lcac-ramp / 156          |           1444 → 292 |          637960 → 343066 |
| lcac-unload / 180        |           1363 → 265 |          684244 → 391494 |
| lav-moving / 250         |           1330 → 247 |          652010 → 358560 |
| lav-hold / 360           |           1386 → 321 |          753303 → 461695 |
| wasp / 600               |            1168 → 60 |          537108 → 240686 |
| molniya / 268            |            1177 → 65 |           340238 → 42964 |
| fuel-close-front / 109   |           1824 → 876 |          761469 → 489395 |
| fuel-close-reverse / 109 |           1513 → 551 |          586271 → 313929 |
| lav-contact / 250        |           1373 → 290 |          667416 → 373966 |

All 31 pairs reduce calls and triangles. Busy Fuel reduces calls **40.16%**; geometry-heavy Harbor reduces triangles **36.24%**. No pair has a >5% submission increase. The largest gains come from regional shadow culling and removing the terrain shadow draw. Soft two-triangle effect geometry plus valid bounds is the second focused rendering optimization. Shared resources and resident hidden Su-30 roots avoid churn. A compact immutable support lookup index reduces initialization allocation while preserving exact candidate order and barycentric results; no CPU speed ratio is claimed.

### Actual GPU measurements and limits

Chrome/ANGLE Metal Apple M4 supports `EXT_disjoint_timer_query_webgl2`. Two opposite-order rounds measured 45 frames per side/view; discard the first five of each round, leaving 80 samples per side. Queries wrap the complete renderer call, including shadows. The other viewer is idle during each measurement. All queries are non-disjoint and poses/DPR match. [Raw first round](stage6c-review.local/final-gpu-timings.json), [reverse-order round](stage6c-review.local/final-gpu-repeat.json), [summary including CPU submission duration](stage6c-review.local/final-gpu-summary.json).

| Fixed view                | Pooled median GPU ms before → after |
| ------------------------- | ----------------------------------: |
| Harbor / 0                |                       4.106 → 4.945 |
| Busy Fuel / 109           |                       6.630 → 6.297 |
| Busy Ammunition / 132.4   |                       6.438 → 4.865 |
| Beach inland / 0          |                       4.377 → 3.509 |
| Late Fuel / 600           |                       7.466 → 7.349 |
| Close Fuel / 109, DPR 1.5 |                       7.905 → 7.610 |

GPU gains are mixed and order-dependent; this is not a universal GPU speedup claim. Harbor's pooled +20.4% was investigated with the reversed order: its after-round medians span 3.602–5.424 ms, while before spans 4.098–4.219 ms. The improved focused shadow coverage and distant water retain visual value, with more concentrated shadow rasterization and fragment work despite fewer submissions. Soft smoke also trades more fragment shading/overlap for feathered edges. These costs are retained explicitly. Display-capped RAF is not used as GPU timing or a cross-device guarantee.

## Camera subject audit

Each ID is inspected at relevant times in all three viewport sets. Framing tests exercise actual landing model bounds, terrain rays, structural footprints and group envelopes with HUD margins. Departed subjects retain finite terminal anchors; their absence is truthful.

| Existing ID       | Subject / relevant observation range                                        |
| ----------------- | --------------------------------------------------------------------------- |
| overview          | Entire coast and all five land regions, 0–7200+                             |
| wasp              | Flight deck and full patrol, 0–7200+                                        |
| harbor            | Basin, both berths and damage, 0–7200+; moving Molniya uses its follow      |
| talwar            | Intact hull, hits, fire, severe list/flooding, 0–7200+                      |
| molniya           | Berth, channel, damaged withdrawal, departure near 266–275, terminal anchor |
| industrial        | Tanks and magazines together, quiet and busy/late aftermath                 |
| fuel-storage      | Tank shells, pool fires and smoke crowns, 0–7200+                           |
| ammunition        | Magazines, 116/132 cookoff and permanent damage                             |
| radar-hill        | Search/tracking/Pantsir/AAA installations, quiet and damaged                |
| search-radar      | Array before/after T+46 and permanent wreck                                 |
| corridor          | Dry-wash bridge, trunk road and service yard                                |
| btr               | Formation, disabled lead context and survivor withdrawal/hold               |
| t72               | Three-vehicle formation, strike, reverse and holds                          |
| beachhead         | Both lanes, holding → approach → ramps/unloading → turns/holds              |
| beach-offshore    | Both lanes from sea, same complete landing phases                           |
| f35-01            | Launch, strikes and finite terminal egress                                  |
| f35-02            | Launch, harbor/industrial strikes and finite terminal egress                |
| su30              | Both separated aircraft, pass, damage/breakaway and egress                  |
| support-convoy    | Six-vehicle convoy, bridge obstruction, withdrawal/holds                    |
| secondary-pantsir | Reserve, relocation, engagement and T+121 wreck                             |
| lcac-west         | West craft, ramp, cargo and settled machinery                               |
| lcac-east         | East craft and late unloads through T+188                                   |
| lav-west          | West lead: deck/ramp/ground transfer, bends and final hold                  |
| lav-east          | East lead: transfer, road continuation and final hold                       |

Close follows emphasize selected subjects; regional views explain the widely separated groups. The Su-30 pair is necessarily smaller when retaining both dispersed aircraft. No preset was added.

## Exact preservation and fresh checks

- The immutable pre-edit `stage6cRuntimePreservation.json` captures **1547 complete active worlds** from fixed `5f940b5`, through the script, quarter-second aftermath samples, transition samples and late times through 7200. SHA-256: `e216deabbe9eb7a923437ec1d9bcf1d66351d783b376c90f7d3a6cfb7517e3a5`.
- A separately labelled **98-sample fixed-commit supplement** adds the exact previous rendered-acceptance transfer/handoff/bend/brake/hold times. It was captured from the immutable reference, not claimed as a pre-edit capture. SHA-256: `431a660dcbcd5fa1754a424ffb3f834b3e051efb837e75a21d698f501340ed8a`.
- A second fixed-commit supplement covers **40 exact active-runtime contact/occupancy transitions**, five for each of all eight LAVs, with **120 samples at ±1 ms and the transition**. The reference capture verifies all 260 original source/asset hashes before deriving them; no existing capture is changed. SHA-256: `a63a7587e5d684babdc8e02ba65a498c048ac944f917e3914f272abfd5c773a4`.
- Full JSON state is compared without projecting away runtime, effects, weapons, actor/contact/wheel or outcome fields. All 51 event records, all authorities, original fixtures, 32 trees, seeds/layouts, 404 wear and 37 foam records remain protected. Historical fixture bytes are unchanged.
- Exactly **32 intentional source paths/reasons** are enumerated in `src/test/stage6cSourceAudit.ts`; their historical bytes are checked from fixed `5f940b5`, and unrelated sources remain live-checked. The inherited stale Stage 6A runtime-fixture checksum now checks exact fixed-Git bytes. No stored world hash is regenerated, directory exempted or timeout raised.
- Fresh permitted validation: **618 tests / 55 files**, both app/node TypeScript no-emit checks, lint **0 errors / 0 warnings** against the inherited 13-warning baseline, and `git diff --check`. A full run during simultaneous browser capture hit two original 5 s limits; the final full run passes in **86.00 s with the review directory absent**, including the added all-LAV contact coverage, with those limits unchanged. [Final test log](stage6c-review.local/final-acceptance-tests.log).
- Replacement coverage includes responsive framing/sight lines, seek-safe paused follows and dolly, native disclosure/input keyboard behavior, actual shared smoke/fire pools and culling bounds, surface geometry identity, resident hidden aircraft roots and the complete active-world comparisons. Tests use tracked inputs only.

## Browser integration and resource lifetime

- An uninterrupted **1× T+0 → 206.033333333** run lasts **215.0484 real seconds**, with **406 chronological samples**, one constant seek/reset epoch and no intervening pause after starting. All 51 events complete; all eight are ashore in the first sampled T+188.0333 state. Camera changes alone review launch/radar/naval/fuel/ammunition/bridge/BTR/T-72/Pantsir/aircraft/landing activity. [Chronology](stage6c-review.local/final-scripted-chronology.json) and `final-scripted-frame-*.png` are accepted evidence; no complete-video claim is made.
- The 1× run records mean/P95 RAF **21.76/49.0 ms**, including first-use shader/resource stalls up to **3.35 s** near T+121; other >0.5 s stalls occur near 13/36/48/104. These are an explicit remaining development-viewer limitation, not hidden by the lower submission counts.
- Across **98 late boundary records plus 120 all-LAV transfer records**, all **35 persistent actor roots** and **64 LAV wheel centers/steering/rolls** agree with active runtime. Maximum root position error is zero, quaternion angle error 5.162×10⁻⁸ rad and wheel-center error 9.095×10⁻¹³ m; steering/roll errors are zero. Identities and all 65 landscape uploads stay fixed across all 218 records. The original 33 persistent roots plus two resident hidden Su-30 roots keep identity through entry, egress, backward seeks and restart. [Numerical summary](stage6c-review.local/final-rendered-summary.json), [late boundaries](stage6c-review.local/final-rendered-boundaries.json), [all transfers](stage6c-review.local/final-rendered-transfers.json), and [owned naval fade checks](stage6c-review.local/final-naval-fade.json). Additional [launch/wreck/departure focus frames](stage6c-review.local/final-extra-subjects.jpg) confirm those subject views.
- Five cycles after warm-up each restart, seek through representative script/aftermath states, visit all 24 presets, and return to **T+360 / LAV west**: **261 calls / 372946 triangles / 982 geometries / 316 materials / 3 textures / 214 programs** every time. All 35 actor and all 936 world mesh/geometry/material identities stay fixed. All **910 fixed world mesh upload records**, including 65 landscape batches, stay exact. The other **26** are the existing blast-responsive fuel pipes and security fences; their matrix upload versions legitimately advance on backward/forward damage seeks, while identities and geometry attributes stay fixed.
- Route/cache bounds remain four routes/two centerlines, support counts `[1329,1311,1319,1306]` within `[1607,1605,1857,1860]`, wheel arcs `[1327,1309,1317,1304]`, and each recent-birth cache ≤128. Fixed pool capacities remain unchanged. [Resource cycles](stage6c-review.local/final-resource-cycles.json).
- Real browser controls cover all speeds across 180; direct 7200/backward seeks; 0–180 slider; Home/End/arrow shortcuts; restart/recenter; native selector/disclosure; complete status scrolling at 540; and paused orbit, right-pan and zoom. GPU water/wear clocks, smoke/fire matrices, fans/navigation and fire-light intensities freeze while camera movement remains free, then advance on Play. GPU inspection only asserts clocks for meshes actually drawn; an offscreen material may retain its last uploaded uniform. [Controls](stage6c-review.local/final-controls.json), [pause proof](stage6c-review.local/final-pause-rendered.json).
- **Fresh sustained aftermath passes:** **605.0074 real seconds** at 2×, T+360→1569.733333333, **1186 chronological samples / 26729 RAFs**, one constant reset epoch, no pause/seek/restart/reload during the run. All 51 events remain capped and all eight vehicles remain ashore. All 35 roots remain present; all **936 world mesh/geometry/material identities and upload records are unchanged**, including the 26 response buffers after damage has settled. Materials/textures/programs stay **316/3/250** from start to finish; lazily uploaded geometries range **1014–1024**, ending 1024. The independent warmed-cycle session above has a different warming history, so its 214-program count is reported separately. All recorded pools stay within capacity; a final full inventory checks **231 instanced pools** without overflow. Both birth caches stay ≤128 and all route tables retain their bounds. Observed mean/P95/max RAF is **22.63/64.60/166.70 ms**, not GPU time. [Raw sustained session](stage6c-review.local/final-sustained-aftermath.json), [summary](stage6c-review.local/final-sustained-summary.json), [initial actual render](stage6c-review.local/final-sustained-start-rendered.json), [final actual render](stage6c-review.local/final-sustained-end-rendered.json), [all instance capacities](stage6c-review.local/final-all-instance-pools.json).
- The first aftermath attempt reloaded during documentation updates and is explicitly excluded. The accepted replacement uses the identical application on a local development server with file watching/automatic reload disabled and a separate dependency cache; it is not a production build. Only camera requests change during playback. The separate page sessions compare identities within each session.

The final fresh browser console has **zero JavaScript errors** and only the existing Three.Clock deprecation warning; no installed dependency is patched. [Console log](stage6c-review.local/final-console.json). All final no-emit/lint/whitespace commands pass.

## Limits

This remains a stylized procedural diorama with inherited contact/model tolerances, finite authored ground routes, truthful departures/holds and bounded aftermath. Detailed hulls, terrain patch boundaries and some procedural faceting remain visible. First-use shader/resource hitches and mixed GPU costs remain explicit. Audio, general combat/physics, visible people, production-build verification, deployment and cross-device performance guarantees are outside this delivery.

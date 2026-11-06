# Stage 8B acceptance — 2026-11-06

**Complete.** The eastern landing flank has a three-cycle surf sample, and both Stage 8A sites have visible, rooted wind. The clearance, cost, phase and preservation checks pass against the archived `81f5c10` viewer. Stage 7D retains its separate partial acceptance. [Stage 7D report](STAGE7D_ACCEPTANCE.md)

## Viewer evidence

[Site map](stage8b-evidence/site-map.svg) · [Frozen comparison contract](stage8b-evidence/comparison-contract.json) · [Measurements and media hashes](stage8b-evidence/measurements.json)

The PNGs and MP4s are local review files under the repository’s existing media ignore rules.

| Before and after at 1×                                                                | View                         | Window    |
| ------------------------------------------------------------------------------------- | ---------------------------- | --------- |
| [Surf during the landing pass](stage8b-evidence/shore-preset-before-after.mp4)        | Beach offshore preset        | T+152–176 |
| [Surf close to the water](stage8b-evidence/shore-low-before-after.mp4)                | Fixed low shoreline view     | T+360–384 |
| [Wind during the rescue-branch pass](stage8b-evidence/corridor-pass-before-after.mp4) | Support convoy preset        | T+53–63   |
| [Quiet wind at the inspection bay](stage8b-evidence/corridor-quiet-before-after.mp4)  | Stage 8A low inspection pose | T+240–250 |
| [Wind during the eastern-track pass](stage8b-evidence/beach-pass-before-after.mp4)    | LAV east preset              | T+220–230 |

| Surf phase at the sample center |   Time | Front relative to the coast | Beach offshore                                                                                                                        | Low shore                                                                                                                       |
| ------------------------------- | -----: | --------------------------: | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Approaching swell               | 154.25 |                    −28.09 m | [Before](stage8b-evidence/stills/shore-preset-approach-before.png) · [After](stage8b-evidence/stills/shore-preset-approach-after.png) | [Before](stage8b-evidence/stills/shore-low-approach-before.png) · [After](stage8b-evidence/stills/shore-low-approach-after.png) |
| Breaking crest                  |    156 |                     −5.48 m | [Before](stage8b-evidence/stills/shore-preset-break-before.png) · [After](stage8b-evidence/stills/shore-preset-break-after.png)       | [Before](stage8b-evidence/stills/shore-low-break-before.png) · [After](stage8b-evidence/stills/shore-low-break-after.png)       |
| Maximum run-up                  |    158 |                    +17.28 m | [Before](stage8b-evidence/stills/shore-preset-runup-before.png) · [After](stage8b-evidence/stills/shore-preset-runup-after.png)       | [Before](stage8b-evidence/stills/shore-low-runup-before.png) · [After](stage8b-evidence/stills/shore-low-runup-after.png)       |
| Retreat and exposed damp sand   |  159.5 |                     +0.72 m | [Before](stage8b-evidence/stills/shore-preset-retreat-before.png) · [After](stage8b-evidence/stills/shore-preset-retreat-after.png)   | [Before](stage8b-evidence/stills/shore-low-retreat-before.png) · [After](stage8b-evidence/stills/shore-low-retreat-after.png)   |

| Additional matched still               | Before                                                      | After                                                     |
| -------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| Inspection bay with the convoy at T+58 | [Before](stage8b-evidence/stills/corridor-low-before.png)   | [After](stage8b-evidence/stills/corridor-low-after.png)   |
| Quiet inspection bay at T+245          | [Before](stage8b-evidence/stills/corridor-quiet-before.png) | [After](stage8b-evidence/stills/corridor-quiet-after.png) |
| Eastern track at T+225                 | [Before](stage8b-evidence/stills/beach-low-before.png)      | [After](stage8b-evidence/stills/beach-low-after.png)      |
| East ramp and wheels at T+170          | [Before](stage8b-evidence/stills/landing-ramp-before.png)   | [After](stage8b-evidence/stills/landing-ramp-after.png)   |

The reference captures and limits preceded the visual edits. Both sides used the headed Chrome development viewer, native HUD and Play controls, 1280 × 720 viewport and drawing buffer, DPR 1, antialiasing, 43° vertical FOV, ACES exposure 1.12 and the original percentage shadows. The browser was Chrome 156.0.8078.80 on Apple M4 ANGLE Metal. All 18 checkpoints match exactly in time, camera position, aim, quaternion and projection. The two served stylesheets match byte for byte.

The shoreline inspection camera is XYZ (5527, 9, −2975), aimed at (5487, 0.3, −2925). The wind inspections reuse the Stage 8A low poses. The quiet clips use settled camera anchors. Each still is an unresized native PNG. Each clip places the two original viewports side by side at 30 fps, using the nearest native screencast timestamp. The largest frame alignment offset was 32.5 ms. Each 24-second surf clip covers three cycles. The low view gives the clearest view of the wash and damp edge. In the wide preset the surf reads as a short moving crest just to the left of LCAC 02.

## Surf fit and landing clearance

The strip follows the mounted east landing coast from **X 5458 to 5515 m** at mean water level. Its cross-shore envelope runs from **54 m seaward to 22 m inland**, with the western edge tapering east by 0.45 m per meter inland to clear the landing lane. The modeled crest reaches at most 19.2 m inland, including the variation along the strip. The outer envelope includes the foam and damp feather. The scene retains the **−0.12 m** mean sea level, original water geometry, coastline and terrain.

An eight-second front advances from offshore, narrows and foams at the break, flattens into a shallow wash on the fitted grade and recedes. Arrival varies along the strip by about 1.2 seconds. The run-up limit and receding front also drive the damp-sand mask. Both meshes fade at the ends. The draft inspection found spikes from sampling exactly on the float32 coastline boundary. The finished mesh uses a sea-level boundary row and samples the mounted grade from its inland side. The low-view captures show the corrected join through all four phases.

| Check                                                                 | Measured result                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------ |
| Base drape and water-sheet fit from 77 mounted ray stations           | 2.53–3.13 cm above the existing visible terrain or sea |
| Full surf envelope to the 23 m buffered approach                      | 4.25 m minimum gap                                     |
| Closest rendered LCAC pass to the surf envelope, with its 23 m radius | 4.25 m at T+157.80                                     |
| Closest ramp tip, including half the ramp width                       | 22.73 m                                                |
| Closest LAV, with the conservative 6.2 m envelope                     | 19.14 m                                                |
| Nearest existing scenery envelope                                     | 17.97 m                                                |

Landing clearance used the full visual strip against poses sampled at 0.05-second intervals. The focused tests also check the full grids against the padded approach, scripted sweeps and local scenery. Separate mounted comparisons at T+155, 162, 170, 176, 180 and 187.6 match all 35 rendered roots, 64 wheels, the ramp transform and the existing effect-clock samples. At T+170 eight wheel records use ramp support. At T+187.6 all eight LAVs are ashore.

## Wind, shadows and phase

The prevailing direction is world XZ **(0.80, 0.60)**. A 10-second gust travels along that vector, with a two-second flutter and position-dependent phase. The three crowns bend by up to 1.38 m, the grass tips by up to 0.62 m and the scrub tips by up to 0.44 m. Roots and lower trunks retain their Stage 8A coordinates. The full displacement is included in frustum and shadow bounds. The shelter, signs, drums, tires, footing and stone batches keep their rigid materials.

The inspection bay has six fixed dust cards in one draw. They drift up to 20 m over the exposed ground using the same direction and gust, with a fade at both ends of each lifetime. An isolated GPU readback at T+241 verifies that the dust contributes visible pixels in the low view. The existing vehicle dust retains its authored simulation and presentation.

The full wind envelopes clear the sampled convoy and LAV passes by **6.59 m** and **7.15 m** respectively. Including the rigid objects, the minimum gaps are the original 6.38 m and 4.95 m. Animated foliage blocked none of the 918 convoy or 612 LAV sight rays. The two tree shadow batches submit the same deformation, profile and clock as their visible crown batches.

The surf, plants and dust share one uniform derived from absolute simulation time. The **40-second wrap** contains whole cycles of all three rates. The legacy coastal clock keeps its own rates. Paused pointer orbit changed the camera while the GPU motion phase held. Backward seek to the same pose and time reproduced the exact canvas regions at all three sites. The native 0.5×, 1× and 2× controls advanced the expected amounts, and each reproduced the same shore readback after seeking back. Visits at 179.9, 180, 180.1, 7199.9, 7200 and 7200.1 submitted the expected reduced time. Restart returned to paused T+0 and retained the same geometry and upload identities.

## Rendering cost, pacing and lifetime

The frozen ceilings per pose were **+40 draws, +10% triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights**. The totals include the shadow pass. Every one of the 18 comparisons meets all limits. The largest increases were **3 draws and 3.59% triangles**, with identical shadow submissions and light counts. The complete per-pose counts are in the measurements file.

| Representative pose         | Submitted draws | Submitted triangles |  Change |
| --------------------------- | --------------: | ------------------: | ------: |
| Beach offshore break, T+156 |       752 → 754 |   548,042 → 562,154 |  +2.57% |
| Low shore break, T+156      |   2,041 → 2,044 |   639,685 → 653,809 |  +2.21% |
| East ramp, T+170            |       311 → 313 |   393,278 → 407,390 |  +3.59% |
| Support convoy, T+58        |       474 → 475 |   420,248 → 420,260 | +0.003% |
| Inspection bay low, T+58    |   1,542 → 1,543 |   547,193 → 547,205 | +0.002% |
| LAV east, T+225             |       280 → 280 |   406,420 → 406,420 |      0% |
| Eastern track low, T+225    |   1,195 → 1,196 |   596,848 → 596,860 | +0.002% |

| Matched 1× pacing window | RAF samples before → after |         RAF mean |        RAF P95 |        RAF max | Long tasks |
| ------------------------ | -------------------------: | ---------------: | -------------: | -------------: | ---------: |
| Beach offshore T+152–164 |                  698 → 706 | 17.24 → 17.05 ms | 17.4 → 17.2 ms | 49.6 → 34.0 ms |      0 → 0 |
| Low shore T+360–372      |                  720 → 723 | 16.67 → 16.60 ms | 17.2 → 16.9 ms | 49.7 → 17.7 ms |      0 → 0 |
| Support convoy T+53–63   |                  605 → 605 | 16.60 → 16.60 ms | 17.1 → 16.9 ms | 17.6 → 17.6 ms |      0 → 0 |
| LAV east T+220–230       |                  603 → 605 | 16.66 → 16.60 ms | 17.2 → 16.9 ms | 33.3 → 17.6 ms |      0 → 0 |

The browser stayed focused and visible. Median RAF was 16.6 ms in every window, near the observed 60 Hz cadence. These short pacing runs were separate from screencast recording. They measure display-side intervals and preserve the observed misses.

The warmed comparison adds three meshes and geometries, seven visible materials and two tree depth materials. The warmed shore checkpoint uses 1,001 → 1,004 GPU geometries, four textures on both sides and 332 → 365 cached programs. All Stage 8A instance and geometry buffers match the reference. A separate five-cycle route measured 1,004 GPU geometries, four textures and 363 programs each time at its common end pose. All 22 local mesh identities stayed fixed. Normal canvas teardown disposed each of the 49 watched geometry, material, depth, texture and instancing owners once.

Every startup reached paused ready at T+0 after nine graphics jobs. The capture pair reached ready in 4.32 → 5.82 seconds. The warm-server repeat in before/after/after/before order recorded 4.22 / 4.11 / 4.27 / 4.55 seconds. Candidate graphics jobs spanned 0.89–0.92 seconds in the repeat. Candidate selected CPU slices had P95 of 9.0–9.2 ms and maximum of 33.5 ms. Direct viewer startup logged the inherited Three.js Clock deprecation. Both capture contexts also logged one generic setup resource 404.

## Separate baseline repair and preservation

Both tracked Stage 7C fixtures at `81f5c10` had the older serialization. Before visual work, the two original captures were verified against the pinned hashes. Parsed JSON values and ordered tokens matched. The restored working files contain the original bytes, and the unchanged targeted construction file passed **12/12**. The final files and Git blob inputs were checked again.

| Fixture                                | Bytes before → restored | Verified SHA-256                                                   |
| -------------------------------------- | ----------------------: | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json` |         49,102 → 53,062 | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json` |         53,891 → 58,811 | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

The existing application changes are the `WorldShell` mount and the Stage 8A vegetation material selection and bounds. The Stage 7C source audit projects out the two exact mount lines for that path and keeps its original hash. The world, contact, source and construction checks preserve the authored terrain, grades, roads, support queries, 51 events, 24 cameras, fixed-step driver, actor and effect histories and authoritative assets. Package and lockfile bytes match the reference.

Both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` (**786/786 across 73 files**) and `git diff --check` pass. Six focused tests cover wrapped motion, the complete shore and wind envelopes, shared shadow deformation and the dust pool. Raw captures and review scripts are retained in `stage8b-review.local/`.

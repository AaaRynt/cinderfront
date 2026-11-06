# Stage 8C acceptance — 2026-11-06

**Complete.** Four dryland trees, six grass tufts and four scrub plants respond to the existing T+92 central fuel cascade. The nearer crowns bend as the front crosses the first verge. The farther pair bends about half a second later. Both groups rebound and settle into the same ambient wind.

## Matched viewer evidence

[Frozen comparison contract](stage8c-evidence/comparison-contract.json) · [Measurements and media hashes](stage8c-evidence/measurements.json)

| Native 1× clip                                                                 | View                         | Window   |
| ------------------------------------------------------------------------------ | ---------------------------- | -------- |
| [Fuel storage before and after](stage8c-evidence/fuel-preset-before-after.mp4) | Existing fuel-storage preset | T+90–101 |
| [Low view before and after](stage8c-evidence/fuel-low-before-after.mp4)        | Fixed low oblique view       | T+90–101 |

In the low view, the nearer trees are on the right and the farther trees are on the left beyond the pipe. The dust advances across both verges. Crown motion is most legible in this view. The distant trees in the wide preset occupy only a few pixels.

The half-speed detail replay enlarges the two verges from the same low-view recording. [0.5× detail replay](stage8c-evidence/fuel-low-detail-replay.mp4)

| Phase                                       |  Time | Fuel storage preset                                                                                                                             | Fixed low view                                                                                                                            |
| ------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Front approaching both verges               | 92.65 | [Before](stage8c-evidence/stills/fuel-preset-before-arrival-before.png) · [After](stage8c-evidence/stills/fuel-preset-before-arrival-after.png) | [Before](stage8c-evidence/stills/fuel-low-before-arrival-before.png) · [After](stage8c-evidence/stills/fuel-low-before-arrival-after.png) |
| Near crowns out, far crowns in ambient wind | 92.95 | [Before](stage8c-evidence/stills/fuel-preset-near-bend-before.png) · [After](stage8c-evidence/stills/fuel-preset-near-bend-after.png)           | [Before](stage8c-evidence/stills/fuel-low-near-bend-before.png) · [After](stage8c-evidence/stills/fuel-low-near-bend-after.png)           |
| Far crowns out                              | 93.44 | [Before](stage8c-evidence/stills/fuel-preset-far-bend-before.png) · [After](stage8c-evidence/stills/fuel-preset-far-bend-after.png)             | [Before](stage8c-evidence/stills/fuel-low-far-bend-before.png) · [After](stage8c-evidence/stills/fuel-low-far-bend-after.png)             |
| Near rebound                                | 93.61 | [Before](stage8c-evidence/stills/fuel-preset-near-rebound-before.png) · [After](stage8c-evidence/stills/fuel-preset-near-rebound-after.png)     | [Before](stage8c-evidence/stills/fuel-low-near-rebound-before.png) · [After](stage8c-evidence/stills/fuel-low-near-rebound-after.png)     |
| Far rebound                                 | 94.13 | [Before](stage8c-evidence/stills/fuel-preset-far-rebound-before.png) · [After](stage8c-evidence/stills/fuel-preset-far-rebound-after.png)       | [Before](stage8c-evidence/stills/fuel-low-far-rebound-before.png) · [After](stage8c-evidence/stills/fuel-low-far-rebound-after.png)       |
| Recovered to ambient wind                   | 98.60 | [Before](stage8c-evidence/stills/fuel-preset-recovery-before.png) · [After](stage8c-evidence/stills/fuel-preset-recovery-after.png)             | [Before](stage8c-evidence/stills/fuel-low-recovery-before.png) · [After](stage8c-evidence/stills/fuel-low-recovery-after.png)             |

The baseline was captured from an archive of `f98e1fc` before changing the scene. Both sides used the focused, headed Chrome development viewer on Apple M4 Metal, native HUD and Play controls, a 1280 × 720 viewport and drawing buffer, DPR 1, 43° vertical FOV, original antialiasing, percentage shadows and ACES exposure 1.12. The preset uses eye XYZ (−2000, 900, 900) and aim (−550, 120, 1950). The low view uses eye (−549, 58, 1709) and aim (−399, 35.5, 1819). Each matched still uses the same simulation time, camera transform and projection. The clips pair the original viewports side by side at 30 fps. The largest snap to a native screencast timestamp was 24.7 ms. The PNGs and MP4s are local evidence under the repository’s existing media ignore rules.

## Site and clearance

The two verges sit in the 16 m opening between the south and central fuel berms. The near pocket spans X −504 to −462 m and the far pocket X −227 to −186 m. Both span Z 1797 to 1813 m. Their substrate is the mounted loose gravel and soil fines between the concrete cell floors. The measured surface is 0.30 m above the underlying terrain. The new group uses that existing surface and a fitted buried base for each plant.

The broad fuel-disaster polygon and both coarse berm buffers overlap these pockets. The near group also overlaps the legacy 340 m response reservation. This is one explicitly placed group. The general reservations and existing seeded vegetation continue to use their original footprints. After the first clearance pass, the tree widths were fitted to 84% of the uniform-scale draft, two near roots were adjusted and several low plants were moved for sight clearance. The cameras, windows, comparison phases and ceilings stayed fixed.

The independent envelope used every mounted vertex, the maximum gust and outward bend, and a conservative reverse bend of 66.4% of peak. The fitted lowest root vertices are 2.2–10.0 cm below the gravel. The envelope fits both its instance batch’s box and sphere and clears mounted obstacles and padded movement routes.

| Nearest checked feature                      | Minimum horizontal gap to full envelope |
| -------------------------------------------- | --------------------------------------: |
| Berm base                                    |                                  0.80 m |
| Concrete bund floor                          |                                 17.80 m |
| Tank or tank fittings                        |                                117.20 m |
| Pipe or support                              |                                 29.00 m |
| Elevated service walk                        |                                 76.92 m |
| Utility footprint                            |                                382.85 m |
| Road or rail                                 |                                494.12 m |
| Persistent scorch                            |                                166.81 m |
| Damaged industrial structure                 |                                121.55 m |
| Existing blast-response plants and equipment |                                  7.50 m |
| Existing response ignition flame             |                                  7.26 m |
| Nearest padded actor sweep                   |                              1,016.54 m |

The mounted audit sampled 20 phases from before ignition through T+7200, including the structure damage thresholds and the front crossing. Of 1,596 low-view sight rays, six met the foreground berm lip at the same near grass base. The grass and scrub tops and the four trees had clear sight lines at all six phases. The full envelopes cleared the 11 existing in-frame tank and hero target rays checked across the two views.

## Arrival, deformation and controls

The mounted front starts at world XZ **(−545, 2050)** at **T+92** and reaches 620 m in 1.8 seconds. Each instance arrives at `92 + distance × 1.8 / 620`. The authored environment marker stays at T+94. The instance stores the normalized horizontal direction away from the source, its arrival offset and the distance-attenuated peak. The 0.22-second rise is followed by a damped rebound and a fade to zero 3.25 seconds after local arrival. The blast falls smoothly to zero at 620 m.

The meshes reuse the Stage 8A dryland shapes and the Stage 8B height-weighted bend. Roots and lower trunks stay fixed. Upper trunk and crown vertices move progressively in world XZ while keeping their height and attachment. The GPU adds the blast displacement to the existing wind. The main and directional shadow programs receive the same vertex code, instance data and clocks.

| Plant                 | World XZ (m)   | Distance (m) | Arrival (T+) | Peak tip travel (m) | Peak low-view travel (px) |
| --------------------- | -------------- | -----------: | -----------: | ------------------: | ------------------------: |
| Near upright tree     | −495.5, 1805.7 |        249.3 |       92.724 |                3.91 |                      25.9 |
| Near wind-shaped tree | −473, 1804.9   |        255.5 |       92.742 |                3.56 |                      23.7 |
| Far upright tree      | −217, 1806.6   |        408.4 |       93.186 |                1.81 |                       4.3 |
| Far wind-shaped tree  | −196, 1806.4   |        425.6 |       93.236 |                1.55 |                       3.4 |
| Near west grass       | −501.5, 1805.6 |        248.2 |       92.721 |                1.00 |                       6.4 |
| Near east grass       | −478.5, 1803.8 |        255.0 |       92.740 |                0.84 |                       5.5 |
| Near low grass        | −489.7, 1803.2 |        252.9 |       92.734 |                0.85 |                       5.6 |
| Far west grass        | −197.6, 1804.1 |        425.6 |       93.236 |                0.41 |                       0.9 |
| Far east grass        | −187.9, 1804.5 |        433.3 |       93.258 |                0.36 |                       0.8 |
| Far low grass         | −193.8, 1802.6 |        429.6 |       93.247 |                0.36 |                       0.8 |
| Near west scrub       | −499.5, 1807.3 |        246.9 |       92.717 |                1.02 |                       6.5 |
| Near east scrub       | −465.3, 1805   |        257.6 |       92.748 |                0.83 |                       5.3 |
| Far west scrub        | −192, 1809.4   |        427.2 |       93.240 |                0.38 |                       0.8 |
| Far east scrub        | −189.5, 1805   |        431.7 |       93.253 |                0.38 |                       0.8 |

Tip travel compares the blast pose with ambient wind at the same time. The pixel column is the maximum projection shift of a deformed vertex in the fixed low view. At T+92.95 the front was at 327.22 m and all seven near plants were moving outward while all seven far plants still matched ambient wind. At T+93.44 the far trees were bending outward and the near trees had started their rebound. At T+94.13 the far trees were rebounding. The whole group matched ambient by T+96.60.

The browser read the linked main and shadow shaders and their submitted uniforms, then ran that vertex code with the mounted attributes through WebGL2 transform feedback. Of 15,852 tested vertices, all 816 anchored vertices matched their ambient positions exactly. The blast shifted only X and Z. Backward seek to T+92.95 reproduced the exact two canvas regions and every plant’s vertex pose. Pointer orbit changed the camera while the paused plant poses and clocks held. Native Restart returned to paused T+0. The blast stayed at zero around T+120 and T+7200 wind wraps, at T+132.95 with the same periodic phase as the near bend, and at T+180.

## Rendering cost, pacing and lifetime

The frozen per-pose ceilings were +40 submitted draws, +10% submitted triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights. All 12 fuel pose pairs add **8 submitted draws, 10,568 submitted triangles, 4 shadow draws and 5,284 shadow triangles**, with zero added lights. The largest triangle increase is **2.19%**. The four reusable instanced batches share the original render path.

| Pose                  | Submitted draws | Submitted triangles | Shadow draws | Shadow triangles |
| --------------------- | --------------: | ------------------: | -----------: | ---------------: |
| Preset before arrival |   1,742 → 1,750 |   539,623 → 550,191 |    518 → 522 |  26,132 → 31,416 |
| Preset at far bend    |   1,739 → 1,747 |   539,507 → 550,075 |    518 → 522 |  26,132 → 31,416 |
| Preset after recovery |   1,638 → 1,646 |   533,961 → 544,529 |    485 → 489 |  25,504 → 30,788 |
| Low before arrival    |       602 → 610 |   484,215 → 494,783 |      74 → 78 |    3,756 → 9,040 |
| Low at far bend       |       599 → 607 |   484,091 → 494,659 |      74 → 78 |    3,756 → 9,040 |
| Low after recovery    |       602 → 610 |   482,625 → 493,193 |      74 → 78 |    3,756 → 9,040 |

| Separate 1× pacing run | RAF samples before → after |             Mean |            P95 |        Maximum | Long Tasks |
| ---------------------- | -------------------------: | ---------------: | -------------: | -------------: | ---------: |
| Preset T+90–101        |                  660 → 662 | 16.73 → 16.68 ms | 16.7 → 17.3 ms | 49.9 → 33.8 ms |      0 → 0 |
| Low T+90–101           |                  663 → 663 | 16.65 → 16.65 ms | 16.7 → 17.5 ms | 33.3 → 33.6 ms |      0 → 0 |

The pacing runs used the same native controls as the clips and ran separately from screencast recording. Both were focused and visible. All nine graphics preparation jobs completed and the capture browsers reached paused Ready at T+0 in 4.42 → 4.37 s. The new group adds four GPU geometries and nine cached programs at the common fuel peak pose, with four textures on each side.

Warm-server startup repeated in reference, candidate, candidate, reference order at 4.34, 4.17, 4.28 and 4.11 s. Candidate graphics preparation spanned 0.87–0.92 s. Five restart and seek cycles measured 1,051 GPU geometries, four textures and 369 programs at their common T+93.44 endpoint. All four new batches retained their identities, buffers and vertex poses. Normal canvas teardown disposed 16 watched instance, geometry, visible and depth owners once each. Direct startup logged the inherited Three.js Clock warning. Capture contexts also logged a generic setup resource 404.

## Preservation and separate fixture repair

The T+156 shore break and T+245 inspection-bay wind checkpoints match `f98e1fc` pixel for pixel. Stage 8A plant and Stage 8B surf, wind and dust inputs match across the measured poses. The mounted fuel district, front, fire and legacy response and ignition instances matched at 11 sampled times. The application diff binds the live dust front to the existing 620 m and 1.8 s constants and mounts the localized group in the existing environment pass. The source audit projects out the one new import and restores the two literal props for that exact path. The timing tests pin both live values. The historical world, construction and contact oracles retain their original assertions. The 51 events, 24 cameras, fixed-step driver, actor history, landing and support geometry, map, scenario and dependency files match the reference.

| Stage 8B checkpoint        | Matched stills                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Eastern shore break, T+156 | [Before](stage8c-evidence/stills/shore-low-break-before.png) · [After](stage8c-evidence/stills/shore-low-break-after.png) |
| Inspection bay wind, T+245 | [Before](stage8c-evidence/stills/corridor-quiet-before.png) · [After](stage8c-evidence/stills/corridor-quiet-after.png)   |

Before editing the scene, both original Stage 7C captures matched the pinned SHA-256 values. Their parsed JSON values and ordered tokens matched the tracked reference. Restoring the original serialization passed all 12 unchanged targeted construction tests. Both files appear in the working Git diff, and the final files and Git blob inputs were verified again.

| Fixture                                | Reference → restored bytes | Restored SHA-256                                                   |
| -------------------------------------- | -------------------------: | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json` |            49,102 → 53,062 | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json` |            53,891 → 58,811 | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

Both TypeScript no-emit checks, lint and `git diff --check` passed. Five new tests cover front arrival, distance falloff, rebound and absolute-time reconstruction, root and berm clearance, and the shared shader. The default two-worker full run passed 790 of 791 tests. The first Stage 7C construction assertion exceeded the five-second timeout at 5.54 seconds. The targeted construction run passed all 12 with the default timeout. The full rerun passed **791/791 across 74 files** with `pnpm test:run --maxWorkers=2 --testTimeout=15000`. The timeout adjustment was local to that invocation. Raw captures and checks are retained in `stage8c-review.local/`.

Stage 7D retains its separate partial acceptance. [Stage 7D follow-up](STAGE7D_ACCEPTANCE.md#stage-7d-follow-up--2026-11-06)

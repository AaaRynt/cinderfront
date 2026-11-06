# Stage 8A acceptance — 2026-11-06

**Complete.** The rescue-branch inspection bay and the eastern beach-track marker pass the matched viewer, clearance, rendering cost and preservation checks. The reference is the archived `ba0abfd` Stage 7D follow-up. [Stage 7D retains its separate acceptance report](STAGE7D_ACCEPTANCE.md).

## Sites and viewer evidence

[Site map and placement boundaries](stage8a-evidence/site-map.svg) · [Frozen comparison contract](stage8a-evidence/comparison-contract.json) · [Measured results](stage8a-evidence/measurements.json)

| Sample and still time        | Existing preset                                                                                             | Low inspection                                                                                        | Native 1× playback                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Rescue branch at T+58        | [Before](stage8a-evidence/corridor-preset-before.png) · [After](stage8a-evidence/corridor-preset-after.png) | [Before](stage8a-evidence/corridor-low-before.png) · [After](stage8a-evidence/corridor-low-after.png) | [T+53–63 before and after](stage8a-evidence/convoy-before-after.mp4)  |
| Eastern beach track at T+225 | [Before](stage8a-evidence/beach-preset-before.png) · [After](stage8a-evidence/beach-preset-after.png)       | [Before](stage8a-evidence/beach-low-before.png) · [After](stage8a-evidence/beach-low-after.png)       | [T+220–230 before and after](stage8a-evidence/beach-before-after.mp4) |

**Rescue branch.** The inspection bay occupies a 103 × 43.5 m strip off the camera-facing shoulder of `road_rescue_branch`, at the road station XZ (4370, 212). The recovery truck passes that station at approximately **T+58.10** at 17 m/s. The `support-convoy` preset shows the six trucks moving past the shelter roof, tree crowns and light gravel strip. In the low view, the WASH RD board marks the worn entrance. The corrugated roof, partial wall, drums, discarded tires and wheel scuffs form one maintenance bay. Amber grass and olive scrub group around stones and three dryland trees with gaps of exposed ground. The dry-wash approach had a damage exclusion, and the authored pull-offs were over 1.5 km from the support convoy at their closest sampled pass.

**Eastern beach track.** The 44 × 26 m sample sits on the sheltered dune side of `road_beach_access_east`, around road station XZ (5574, −2648). The lead eastern LAV passes the station at approximately **T+225.85** at 4.5 m/s. The `lav-east` preset shows the compacted track, feathered sand and shell gravel, low dune cover and the E-2 marker with a service footing behind it. The low view shows the worn enamel and the partly buried footing between the passing vehicles. The sample is inland of the strand, ramp lanes and contact grade.

| Still               | View           | Camera XYZ (m)             | Aim XYZ (m)                |
| ------------------- | -------------- | -------------------------- | -------------------------- |
| Rescue branch T+58  | Support convoy | (4464.76, 181.25, 467.66)  | (4387.84, 46.25, 218.24)   |
| Rescue branch T+58  | Low            | (4397.23, 49.37, 209.88)   | (4358.34, 45.77, 230.17)   |
| Eastern beach T+225 | LAV east       | (5601.09, 27.02, −2648.21) | (5573.09, 14.02, −2652.21) |
| Eastern beach T+225 | Low            | (5567.40, 17.00, −2666.80) | (5562.80, 14.44, −2639.60) |

The frozen contract and baseline captures preceded the visual edits. The Stage 6A wash, plain and landing captures and Stage 7D `12.png` and `20.png` supplied context. The eight new PNGs are unresized native viewport captures. Both sequences come from native Play at 1× in the same development viewer, with the normal HUD and controls. Each MP4 pairs the original 1280 × 720 viewports at 30 fps using screencast timestamps.

All eight measured poses match their reference time, position, aim, quaternion and projection exactly. Chrome 156.0.8078.80 used Apple M4 ANGLE Metal, DPR 1, antialiasing, ACES exposure 1.12, the existing percentage shadow map and a 43° vertical FOV. The two served stylesheets match byte for byte.

The convoy preset rewards a compact roof, tree and gravel silhouette. The low pose carries the small lettering and wear. The LAV preset gives smaller marker and plant groupings comparable screen presence. Use those framing differences to size future samples.

## Grounding and clearance

The samples use the existing seeded vegetation and surface-fitting machinery. There are 212 logical placements at the inspection bay and 132 at the dune. Repeated meshes share resources by type and are instanced within each site. Each site has one feathered terrain drape, and both signs share one enamel atlas. Tree crowns and roofs cast into the existing shadow map. The beach placement uses the top of the mounted east dune veneer, which sits 0.22 m above the mainland terrain there.

The placement test projects every new solid’s geometry, including complete tree crowns, into horizontal envelopes. It checks the authored roads, protected scenery and damage reservations, historical cover and equipment, the scripted sweeps and quarter-second aftermath sweeps through the final LAV hold. The plant and prop bases use the mounted terrain support beneath the relevant site. The drapes are visual surfaces.

| Mounted viewer check                                      |                                  Rescue branch |                              Eastern beach |
| --------------------------------------------------------- | ---------------------------------------------: | -----------------------------------------: |
| Drape clearance above visible surface, 42 rays per site   |                                   2.96–3.58 cm |                               3.45–3.54 cm |
| Lowest sampled roots and prop bases below surface         |                        0.80–3.61 cm, 41 checks |                    0.80–3.55 cm, 22 checks |
| Smallest gap from a solid footprint to authored road edge |                                         7.66 m |                                     7.95 m |
| Closest pass beyond the padded vehicle envelope           | 6.38 m, recovery truck by wash sign at T+57.40 | 4.95 m, LAV 06 by verge gravel at T+228.90 |
| Preset-to-vehicle sight rays blocked by new tall detail   |                                        0 / 918 |                                    0 / 612 |

Clearance minima use the installed instance matrices and sampled actor poses at 0.05 s intervals during both recorded passes. The envelopes include the vehicle safety margins. The viewer test separately raycast the existing asphalt and compacted track at three positions per site.

## Rendering cost and playback

The frozen per-pose ceilings were **+40 submitted draws**, **+10% submitted triangles**, **+6 shadow draws**, **+6,000 shadow triangles** and **zero added lights**. WebGLRenderer totals include shadow submissions. The shadow columns isolate the real shadow pass within those totals.

| Site and pose   | Time |         Draws |         Triangles | Triangle change | Shadow draws | Shadow triangles |
| --------------- | ---: | ------------: | ----------------: | --------------: | -----------: | ---------------: |
| Convoy entry    |   53 |     459 → 475 | 386,352 → 420,378 |          +8.81% |    128 → 132 |    3,480 → 8,046 |
| Convoy preset   |   58 |     458 → 474 | 386,222 → 420,248 |          +8.81% |    128 → 132 |    3,480 → 8,046 |
| Convoy exit     |   63 |     457 → 473 | 385,418 → 419,444 |          +8.83% |    128 → 132 |    3,480 → 8,046 |
| Convoy low      |   58 | 1,526 → 1,542 | 513,167 → 547,193 |          +6.63% |    128 → 132 |    3,480 → 8,046 |
| LAV east entry  |  220 |     272 → 277 | 397,154 → 406,930 |          +2.46% |      48 → 50 |    5,410 → 5,618 |
| LAV east preset |  225 |     271 → 280 | 395,714 → 406,420 |          +2.71% |      48 → 50 |    5,410 → 5,618 |
| LAV east exit   |  230 |     271 → 280 | 395,714 → 406,420 |          +2.71% |      48 → 50 |    5,410 → 5,618 |
| LAV east low    |  225 | 1,174 → 1,195 | 556,682 → 596,848 |          +7.22% |      48 → 50 |    5,410 → 5,618 |

The first draft exceeded the convoy triangle limit and placed the beach drape below the visible dune. The final mesh uses a coarser drape grid, a low-poly gravel batch, fewer canopy triangles and the mounted dune top. The low beach view includes corridor batches in the distance. Its +21 draws are the largest draw increase among the sampled poses.

At T+58, scene meshes went from 2,883 to 2,902, unique geometries from 1,180 to 1,196, materials from 330 to 333 and instance slots from 8,441 to 8,787. At T+225 the same additions take those counts from 2,827 to 2,846, 1,024 to 1,040, 340 to 343 and 9,528 to 9,874. The 346 slots include two separate enamel faces. Light counts match at every checkpoint. The warmed path has 971 → 987 GPU geometries at the presets and beach low view, 1,144 → 1,160 at the convoy low view, 3 → 4 textures and 309 → 327 cached programs.

| 1× window          | RAF samples before → after | RAF mean before → after | RAF P95 before → after | RAF max before → after | Long tasks |
| ------------------ | -------------------------: | ----------------------: | ---------------------: | ---------------------: | ---------: |
| Convoy T+53–63     |                  603 → 602 |        16.67 → 16.67 ms |         17.5 → 16.8 ms |         17.7 → 17.7 ms |      0 → 0 |
| LAV east T+220–230 |                  602 → 602 |        16.69 → 16.69 ms |         17.3 → 16.8 ms |         34.3 → 33.3 ms |      0 → 0 |

The headed browser stayed focused and visible. Both windows ran near the 60 Hz display cadence. These are short RAF observations, with screencasts recorded separately. The native controls checks covered Play, Pause, backward observation seek and Restart in both sites. Pause held its time. Restart returned to paused T+0. Revisits preserved all 19 Stage 8A mesh, geometry and material identities, placement signatures and instance upload versions in the mounted scene.

Both capture contexts reached ready at paused T+0 and completed nine graphics jobs. Capture ready time was 4.03 s for the reference and 4.83 s for the candidate. Four additional fresh contexts over warm development servers ran in before/after/after/before order. Their ready times were 3.93 / 3.88 / 3.89 / 3.92 s. The candidate completed the nine graphics jobs in 0.75–0.81 s and its selected CPU slice P95 was 8.5–8.6 ms, with a 32.6 ms maximum. Direct viewer startup recorded the existing Three.js Clock deprecation. The capture contexts also logged one generic resource 404 each.

## Separate baseline repair and exact preservation

At `ba0abfd`, both tracked Stage 7C fixtures had the older serialization. Before any landscape edits, the archived originals were checked against the pinned SHA-256 hashes, parsed values and ordered JSON tokens. Only whitespace outside strings differed. The original bytes were restored and the existing assertions ran unmodified. The focused construction suite passed **12/12** after restoration. The final working files match both pins.

| Fixture                                | Bytes before → restored | Verified SHA-256                                                   |
| -------------------------------------- | ----------------------: | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json` |         49,102 → 53,062 | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json` |         53,891 → 58,811 | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

The served-source comparison finds one existing application file change, the two-line mount in `WorldShell.tsx`, plus five new Stage 8A modules. The Stage 7C source audit projects only those two exact mount lines out of that one file before applying the original hash. It continues to check every other byte through the original assertions. The world, source, contact and construction tests verify the existing terrain and support geometry, grounding, map and scenario authority, all 51 events, actor outcomes, all 24 cameras and the clock. Package and lockfile bytes match the reference.

Both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` (**780/780 across 72 files**) and `git diff --check` pass. The three focused Stage 8A tests exercise deterministic layout and exact envelope, surface and root checks. Raw viewer captures, timing records and optional review scripts are retained under `stage8a-review.local/`.

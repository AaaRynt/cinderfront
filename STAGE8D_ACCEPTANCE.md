# Stage 8D acceptance — 2026-11-07

**Complete.** The rescue branch now carries roadside detail through the convoy’s approach to the inspection bay and beyond it. The east landing frontage has a longer moving crest beside the original surf pocket. The camera selector offers three fixed Environment details views alongside the 24 existing choices.

## Matched viewer evidence

[Frozen comparison contract](stage8d-evidence/comparison-contract.json) · [Measurements and media hashes](stage8d-evidence/measurements.json)

| Native 1× clip                                                                      | Viewer camera         | Window    |
| ----------------------------------------------------------------------------------- | --------------------- | --------- |
| [Rescue branch before and after](stage8d-evidence/convoy-approach-before-after.mp4) | Support convoy preset | T+45–73   |
| [East frontage before and after](stage8d-evidence/beach-frontage-before-after.mp4)  | Beach offshore preset | T+152–176 |
| [Inspection bay before and after](stage8d-evidence/inspection-bay-before-after.mp4) | Inspection bay        | T+53–63   |
| [Shore break before and after](stage8d-evidence/shore-break-before-after.mp4)       | Shore break           | T+152–176 |
| [Fuel shock before and after](stage8d-evidence/fuel-shock-before-after.mp4)         | Fuel shock (T+92)     | T+90–101  |

| Checkpoint                   |   Time | Reference                                                              | Stage 8D                                                             |
| ---------------------------- | -----: | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Convoy entry                 |     49 | [Before](stage8d-evidence/stills/convoy-approach-entry-before.png)     | [After](stage8d-evidence/stills/convoy-approach-entry-after.png)     |
| Passing the bay              |     58 | [Before](stage8d-evidence/stills/convoy-approach-bay-before.png)       | [After](stage8d-evidence/stills/convoy-approach-bay-after.png)       |
| Convoy exit                  |     67 | [Before](stage8d-evidence/stills/convoy-approach-exit-before.png)      | [After](stage8d-evidence/stills/convoy-approach-exit-after.png)      |
| Surf approach                | 154.25 | [Before](stage8d-evidence/stills/beach-frontage-approach-before.png)   | [After](stage8d-evidence/stills/beach-frontage-approach-after.png)   |
| Original pocket breaking     |    156 | [Before](stage8d-evidence/stills/beach-frontage-old-break-before.png)  | [After](stage8d-evidence/stills/beach-frontage-old-break-after.png)  |
| East frontage breaking       | 157.25 | [Before](stage8d-evidence/stills/beach-frontage-east-break-before.png) | [After](stage8d-evidence/stills/beach-frontage-east-break-after.png) |
| Wash at the bank             |    159 | [Before](stage8d-evidence/stills/beach-frontage-wash-before.png)       | [After](stage8d-evidence/stills/beach-frontage-wash-after.png)       |
| Late landing pass            |  175.5 | [Before](stage8d-evidence/stills/beach-frontage-exit-before.png)       | [After](stage8d-evidence/stills/beach-frontage-exit-after.png)       |
| East crest from the low view | 157.25 | [Before](stage8d-evidence/stills/shore-break-east-break-before.png)    | [After](stage8d-evidence/stills/shore-break-east-break-after.png)    |
| Near fuel group bends first  |  92.95 | [Before](stage8d-evidence/stills/fuel-shock-near-bend-before.png)      | [After](stage8d-evidence/stills/fuel-shock-near-bend-after.png)      |
| Far fuel group bends         |  93.44 | [Before](stage8d-evidence/stills/fuel-shock-far-bend-before.png)       | [After](stage8d-evidence/stills/fuel-shock-far-bend-after.png)       |

The route spans, shoreline bounds, cameras, windows and rendering limits were frozen before capturing the archived `e439bdd` viewer and before editing the scene. The reference detail shots use the manual poses. The candidate uses the new selector entries. All 22 paired checkpoints match time, camera position, aim, quaternion and projection exactly. Both sides used the focused, headed Chrome development viewer on Apple M4 Metal, 1280 × 720 at DPR 1, 43° FOV, antialiasing, percentage shadows and ACES exposure 1.12. The five 30 fps clips pair the native viewports side by side. The largest timestamp alignment offset was 24.7 ms. PNGs and MP4s are local review files under the repository’s existing media ignore rules.

## Rescue branch

The new roadside treatment covers stations **−142 to −51 m** and **+52 to +142 m** from the Stage 8A bay station, XZ (4370, 212), on `road_rescue_branch`. Stations increase eastward along the authored centerline. The T+45–73 clip starts before the lead truck enters the treatment and ends after the last truck clears it. Two groups on the entry side and one on the exit side add **two trees, 44 grass tufts, 13 scrub plants and 16 stones**. Feathered gravel runs beside the pavement and intermittent darker marks suggest a shallow drainage line. Bare patches separate the groups. The shed, WASH RD board and equipment keep the bay as the largest roadside feature.

The road and new drape were raycast separately. The drape sits 3.34–4.21 cm above the mounted ground across 96 stations and its nearest edge is 5.0 cm outside the road. The lowest sampled roots and bases sit 3.32–3.50 cm below the ground. The full plant and rock envelopes include the maximum gust, with matching tree shadow deformation. The spacing pass removed overlaps from the draft while retaining the three groups.

| Closest roadside clearance                    |     Gap |
| --------------------------------------------- | ------: |
| Between conservative base envelopes           |  0.82 m |
| Solid and fully bent foliage to road edge     |  9.31 m |
| New envelope to the original bay detail       | 15.37 m |
| New envelope to earlier landscape scenery     | 23.78 m |
| Padded convoy pass, recovery truck at T+64.80 |  7.26 m |

The closest-pass audit sampled all six trucks at 0.05-second intervals. The full new envelopes clear all 2,538 preset-to-vehicle sight rays through the recorded pass.

## East landing frontage

The added strip follows **X 5515–5680 m** along the actual exposed east coast, beside the original X 5458–5515 m strip. It starts 54 m offshore. A shallow seam has a landward mesh width of up to 14 m. That width tapers to zero by X 5524, where the mounted shoreline becomes a steep bank. The wash reaches the foot of the bank east of the seam. Finer half-metre stations across the seam fit the original grade. The wash and damp sheet sit 2.58–2.68 cm above the underlying surface across 107 ray stations.

The eight-second crest shares the original motion clock. Its phase agrees with the original strip at the seam and varies by about 1.2 seconds along the extension. The existing pocket keeps its 57 m geometry and phase. In the preset the added crest extends left of the original pocket as the landing craft reaches shore. The low view also shows the crest breaking, lace spreading at the toe and the exposed wet edge.

| Closest frontage clearance                      |     Gap |
| ----------------------------------------------- | ------: |
| Approved LCAC approach with 23 m cushion margin | 48.89 m |
| Padded LCAC sweep at T+162                      | 49.01 m |
| Full-width east ramp envelope at T+158.30       | 67.18 m |
| Padded east LAV sweep at T+160.60               | 63.82 m |
| Nearest existing scenery                        |  4.30 m |

The mounted wash footprint was checked through T+147–188 at 0.05-second intervals and against subsequent LAV movement through T+345. It clears the 12,360 sampled sight rays from the two shore cameras to the landing vehicles.

The preset comparisons support keeping the extension at this scale. The additional shoreline is legible as a longer crest in the wide view, where the far eastern end already passes the frame edge. The two new shoulders make the convoy’s entry and exit read around the bay in one pass.

## Camera selector and controls

| Environment details choice | Eye XYZ                  | Aim XYZ                  | Short viewport capture                                         |
| -------------------------- | ------------------------ | ------------------------ | -------------------------------------------------------------- |
| Inspection bay             | (4397.23, 49.37, 209.88) | (4358.34, 45.77, 230.17) | [1024 × 430](stage8d-evidence/stills/short-inspection-bay.png) |
| Shore break                | (5540, 12.5, −2987)      | (5501, 0.3, −2925)       | [1024 × 430](stage8d-evidence/stills/short-shore-break.png)    |
| Fuel shock (T+92)          | (−549, 58, 1709)         | (−399, 35.5, 1819)       | [1024 × 430](stage8d-evidence/stills/short-fuel-shock.png)     |

Inspection bay and Fuel shock reuse the reviewed low poses. Shore break pulls slightly back and east from the Stage 8B pose to include the new break and the east landing craft. The exact positions are in the contract. The normal presets retain their original framing.

Each choice was selected with keyboard typeahead and through the native selector during paused and playing observation. Paused time holds, active playback continues and the speed stays the same. Orbit, pan, zoom and keyboard recenter work in each view. Native observation seeks retain the active choice. At T+7200 the wind and surf uniforms wrap to zero and the fuel blast age remains past its finite response. Restart returns to paused T+0 with the same camera selected. At 1024 × 430 each scene aim stays between the header and timeline. The original 24 labels, IDs and group order match, and all 936 sampled legacy frames match across 13 times and three viewport sizes.

The fuel clip shows the front passing the near group on the right and the far group on the left. All five fuel checkpoints have exact scene RGB in the central viewport crop. The comparison uses the native Fuel shock entry in the candidate.

## Rendering and pacing

The per-pose ceilings were +40 submitted draws, +10% submitted triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights. Across all 22 comparisons the maxima are **+8 draws, +4.58% triangles, +2 shadow draws and +2,196 shadow triangles**, with zero added lights. Totals include shadow submissions.

| Checkpoint               | Submitted draws | Submitted triangles | Shadow draws | Shadow triangles |
| ------------------------ | --------------: | ------------------: | -----------: | ---------------: |
| Convoy entry, T+49       |       476 → 484 |   420,390 → 439,624 |    132 → 134 |   8,046 → 10,242 |
| Convoy at bay, T+58      |       475 → 483 |   420,260 → 439,494 |    132 → 134 |   8,046 → 10,242 |
| Convoy exit, T+67        |       474 → 481 |   419,456 → 437,592 |    132 → 134 |   8,046 → 10,242 |
| Beach offshore, T+157.25 |       758 → 760 |   562,370 → 574,106 |    127 → 127 |  11,820 → 11,820 |
| Inspection bay, T+58     |   1,547 → 1,554 |   552,489 → 570,625 |    132 → 134 |   8,046 → 10,242 |
| Shore break, T+157.25    |   2,061 → 2,069 |   671,365 → 700,139 |      51 → 51 |    6,314 → 6,314 |
| Fuel shock, T+92.95      |       610 → 610 |   494,783 → 494,783 |      78 → 78 |    9,040 → 9,040 |

| Separate 1× pacing run    | RAF samples before → after |             Mean |            P95 |         Maximum | Long tasks |
| ------------------------- | -------------------------: | ---------------: | -------------: | --------------: | ---------: |
| Support convoy, T+45–57   |                  718 → 722 | 16.88 → 16.69 ms | 16.8 → 16.8 ms | 166.6 → 33.3 ms |      1 → 0 |
| Beach offshore, T+152–164 |                  722 → 717 | 16.69 → 16.85 ms | 16.8 → 16.8 ms | 33.3 → 150.0 ms |      0 → 1 |

Both pacing runs stayed focused and visible at a median 16.7 ms display interval. The isolated long gaps are included in the table. The capture viewers reached paused Ready at T+0 in 4.02 → 4.05 s after nine graphics jobs. Five selection and restart cycles retained all 34 local mesh and buffer identities. Their common endpoint held 1,063 GPU geometries, four textures and 386 programs. Canvas teardown disposed each of the 23 watched owners used by the new meshes once. The captures logged the inherited Three.js Clock warning and a generic setup resource 404.

## Preservation and baseline fixture repair

The prior Stage 8A–8C placement and geometry buffers match the reference. The original surf phase matches at 78 samples. At six rendered landing checkpoints the 35 actor roots, 64 wheels, ramp transform, water uniforms and navigation readings match. The 51 events, authored T+94 fuel marker, fixed-step driver, simulation history, map, scenario, landing and support geometry and dependency files retain their reference values. The camera store, fixed detail framing and inventory test have exact source projections for the additions. The older camera and source assertions still run.

Both archived Stage 7C captures match their pinned SHA-256 values. The parsed values and ordered JSON tokens match `e439bdd`. The original serialization was restored before the scene work, and all 12 targeted construction tests passed. The final bytes and Git blob inputs match both pins. The following two paths are **pending commit** in the working Git diff.

| Fixture path                                                                                                                 | Reference → restored bytes | SHA-256                                                            |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------: | ------------------------------------------------------------------ |
| [src/simulation/fixtures/stage7cConstructionPreservation.json](src/simulation/fixtures/stage7cConstructionPreservation.json) |            49,102 → 53,062 | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| [src/simulation/fixtures/stage7cPresentationPreservation.json](src/simulation/fixtures/stage7cPresentationPreservation.json) |            53,891 → 58,811 | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

Both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` (**798/798 across 76 files**) and `git diff --check` passed. Seven focused tests cover the fixed detail frames, selection and restart state, the roadside wind envelope and base spacing, the surf seam and the padded landing clearances. The full suite passed with the default timeout.

Stage 7D retains its separate dated partial acceptance. Raw Stage 8D capture and review records are in `stage8d-review.local/`. [Stage 7D follow-up](STAGE7D_ACCEPTANCE.md#stage-7d-follow-up--2026-11-06)

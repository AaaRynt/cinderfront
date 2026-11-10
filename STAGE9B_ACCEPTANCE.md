# Stage 9B acceptance — 2026-11-10

**Complete.** The two LCACs have rounded segmented skirts, a separate deck edge and machinery housings, deeper fan sleeves with open guards, and framed opaque cabin glazing. The eight LAV-25s have a faceted sloped hull and compact turret, scalloped wheel arches, layered hubs, sealed hatches and opaque optics. The existing east landing guide shows both models from the shallow approach through the last LAV transfer.

[Frozen comparison contract](stage9b-evidence/comparison-contract.json) · [Measurements and media hashes](stage9b-evidence/measurements.json)

## Matched viewer evidence

The reference is a local development viewer archived from `b7ad822`. The 19 poses, two clip windows and five rendering ceilings were fixed before the model edits. Both sides use headed Chrome on Apple M4 Metal, the normal HUD, a 1280 × 720 viewport at DPR 1, antialiasing, the original shadows and ACES exposure. All 19 still pairs match simulation time, camera position, target, quaternion, FOV and projection exactly.

| Paired native 1× clip                                        |        Window | Camera path                             |
| ------------------------------------------------------------ | ------------: | --------------------------------------- |
| [East approach](stage9b-evidence/east-approach-paired.mp4)   | T+151.8–166.3 | Shore break at T+152, LAV east at T+164 |
| [East unloading](stage9b-evidence/east-unloading-paired.mp4) | T+165.7–188.4 | LAV east, then LCAC 02 at T+173         |

The Shore break shot establishes the approach and crest at a distance. The LAV east cut makes the loaded deck and front wheel crossing readable. LCAC 02 shows the emptying deck and the last vehicle leaving the ramp. Each comparison uses two native playback recordings with identical cue transitions. The 30 fps exports pair frames by logged render tick and check the visible clock, event label and preset. For unmatched ticks, the export uses the nearest common pair within 100 ms of the output time. Media is local under the repository’s existing PNG and MP4 ignore rules. Raw captures and timings are in `stage9b-review.local/`.

| Fixed pose                        | Evidence                                                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loaded and moving craft           | [Loaded at T+110](stage9b-evidence/stills/east-loaded.png) · [Shallows at T+152.6](stage9b-evidence/stills/east-shallows.png)                                                                                                                |
| Guided shore and deck views       | [Shore break at T+157.25](stage9b-evidence/stills/east-shore-break.png) · [Deck ready at T+165.2](stage9b-evidence/stills/east-deck-ready.png)                                                                                               |
| Bow ramp transfers                | [East first crossing at T+168.75](stage9b-evidence/stills/east-ramp-first.png) · [East last transfer at T+186.75](stage9b-evidence/stills/east-last-transfer.png) · [West crossing at T+162.75](stage9b-evidence/stills/west-ramp-first.png) |
| Road movement                     | [East at T+207](stage9b-evidence/stills/east-road.png) · [West at T+207](stage9b-evidence/stills/west-road.png)                                                                                                                              |
| Close inspection with fixed poses | [Cabin, deck and ramp](stage9b-evidence/stills/deck-close.png) · [Stern ducts and machinery](stage9b-evidence/stills/stern-close.png) · [LAV armor and running gear](stage9b-evidence/stills/lav-close.png)                                  |

## Geometry and clearance

The LCAC plating wraps the deck edge above the rubber skirt. Inset machinery covers and louvers leave the cargo lane clear. The fan sleeve retains the original ±2.25 m radial and ±0.175 m axial extents. The fixed guard clears the complete moving blade sweep by more than 40 mm. The original platform, skirt anchors, deck and ramp planes retain their geometry and transforms. The four original raised strips retain the 12 mm tire-support step. All new deck and ramp markings are flush material detail.

The LAV hull retains its 6.39 × 2.50 m anchor, 2.69 m overall height, and original centered cannon. Its 64 mounted tires retain their original position, normal, UV and index buffers. New hubs fit inside the previous outer marker reach, and the arch plates clear the full 0.27 m upward suspension bound by at least 39 mm. The armored and glazed surfaces are closed. Both vehicle families share a finite set of geometry, materials and three finish textures.

The complete mounted bounds were checked at 355 times per group, including quarter-second samples from T+140–188.5 and one-second road and hold samples through T+346. The audit includes the complete barrel and wheel bounds. It clips skirt and non-tire triangles to the finite panel when a conservative box alone cannot establish clearance. The original tighter tire, contact, terrain and swept-envelope checks passed with their existing thresholds.

| Minimum measured clearance           |    West |    East |
| ------------------------------------ | ------: | ------: |
| Full LAV envelope to craft machinery | 0.860 m | 0.859 m |
| Between neighboring LAV envelopes    | 0.655 m | 0.646 m |
| Full LAV envelope to ramp side       | 0.829 m | 0.823 m |
| Rounded skirt to ramp underside      | 0.191 m | 0.035 m |
| Non-tire geometry to deck or ramp    | 22.4 mm |  3.6 mm |
| Non-tire bounds to sampled ground    | 84.1 mm | 78.7 mm |
| Full road envelope to shoulder       | 0.661 m | 0.423 m |

The sampled steering extrema were 0.0954 and 0.1230 rad for west and east. The corresponding maximum suspension displacements were 0.1425 and 0.1568 m. Thirty-one native mounted checkpoints matched the reference for the two craft and all eight LAV roots, all 64 wheel transforms, platform, deck, skirt anchors and compression, bow hinge, panel and four strips, stern ramp, fan centers, all twenty blade transforms, rudders and navigation meshes. Maximum wheel-center deviation from the runtime anchors was 9.10 × 10⁻¹³ m.

## Render cost, pacing and lifetime

All 19 checkpoints passed the frozen ceilings of +40 submitted draws, +10% triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights. Draw submissions fell by 15–67. The largest triangle increase was 3.30%, with 1,124 additional shadow triangles, zero extra shadow draws and zero extra lights at every pose. Submitted totals include shadows.

| Pose                         | Draws before → after | Triangles before → after | Shadow draws before → after |
| ---------------------------- | -------------------: | -----------------------: | --------------------------: |
| Loaded east craft, T+110     |            283 → 216 |        299,189 → 309,069 |                     47 → 47 |
| Shore break, T+157.25        |        2,069 → 2,002 |        700,139 → 710,019 |                     51 → 51 |
| East ramp crossing, T+168.75 |            315 → 248 |        412,946 → 422,826 |                     50 → 50 |
| East last transfer, T+186.75 |            239 → 200 |        406,510 → 412,470 |                     50 → 50 |
| East road, T+207             |            268 → 212 |        393,606 → 403,186 |                     50 → 50 |
| West ramp crossing, T+162.75 |            292 → 225 |        343,066 → 352,946 |                     48 → 48 |
| Close stern, T+185.6         |            243 → 201 |        355,919 → 363,687 |                     50 → 50 |

| Separate 1× pacing window     | RAF samples before → after |       Mean ms |      P95 ms |      Max ms | Long tasks |
| ----------------------------- | -------------------------: | ------------: | ----------: | ----------: | ---------: |
| Ramp, T+165.7–176             |                  607 → 606 | 17.04 → 17.07 | 16.7 → 17.1 | 33.3 → 33.7 |      0 → 0 |
| Last transfers, T+179.5–189.5 |                  600 → 596 | 16.74 → 16.85 | 16.7 → 17.3 | 33.2 → 34.2 |      0 → 0 |

These separate runs stayed focused and visible at a median 16.6 ms display interval. Each capture viewer completed nine graphics jobs and reached paused T+0. The existing setup resource 404 and Three.js Clock warning appeared on both sides.

The landing model uses 268 meshes, 14 shared geometries, 16 materials and three textures, compared with 402 meshes, nine geometries, 11 materials and zero model textures in the reference. Each of five warmed restart and seek cycles kept every actor's model mesh and owner identity stable. At the common T+168.75 endpoint, the scene's GPU counts held at 1,037 geometries, seven textures and 405 programs after the change, versus 1,032, four and 389 in the reference. Native context recovery at T+169.05 completed nine graphics jobs, retained LAV east and the paused clock, and reused the same model owners. Canvas teardown disposed all 33 watched geometry, material and texture owners once.

## Preservation and checks

The 31 full runtime snapshots match `b7ad822`. All 51 authored events, T+180 endpoint, 27 camera IDs and groups, ten guide cues, fixed-step clock, routes, support and effect sources retain the reference values. The 34 Stage 8 scene meshes, instance and geometry buffers and submitted motion uniforms matched at six inspection, fuel and shoreline checkpoints. Both pinned Stage 7C fixture files match the committed reference bytes and retain their exact formatter exclusions. The two deliberate model source exceptions use fixed `b7ad822` bytes in the historical audits.

All 55 focused tests and **810 tests across 78 files** in `pnpm test:run --maxWorkers=2` passed. Both TypeScript no-emit checks, lint and `git diff --check` passed. Validation used the development viewer and the installed dependencies.

Stage 7D retains its separate dated partial acceptance. [Stage 7D follow-up](STAGE7D_ACCEPTANCE.md#stage-7d-follow-up--2026-11-06)

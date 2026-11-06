# Stage 9A acceptance — 2026-11-07

**Complete.** Ash Harbor opens in Manual view. **Guided view** selects the shot for the current time. **Play** advances the operation. The four **Highlights** entries pause at their lead-ins in Manual view so the viewer can look around or play the moment.

[Frozen cue sheet](stage9a-evidence/cue-sheet.json) · [Native 1× review clip](stage9a-evidence/guided-review.mp4) · [Measurements and media hashes](stage9a-evidence/measurements.json)

The 23.1-second clip joins T+88.8–99 and T+150.8–163.7 from the continuous 1× run. The HUD stays visible through both cuts. The native 1280 × 720 frames were encoded at 30 fps, with a maximum timestamp alignment offset of 23.5 ms. PNGs and MP4s are local review files under the existing media ignore rules. Raw native evidence is in `stage9a-review.local/`.

## Authored shots

The ten shots were chosen in the archived `94df448` viewer before the guide was implemented. The existing cuts settle along the chosen sight line. The staged lead-ins show the subject before it moves or the effect begins.

|    Cue | Existing preset ID | Subject and reason                                                                                                                          | Native view                                                                                                       |
| -----: | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
|    T+0 | `wasp`             | Establish the carrier and keep the deck in view for the first F-35B launch at T+5. The aircraft is small as it pulls away in the wide view. | [Opening](stage9a-evidence/stills/guided-ready.png) · [First departure](stage9a-evidence/stills/first-launch.png) |
|   T+11 | `f35-02`           | Give the second F-35B two seconds before the T+13 launch and follow its lift off the deck.                                                  | [Second departure](stage9a-evidence/stills/second-launch.png)                                                     |
| T+21.5 | `radar-hill`       | Establish the air-defense sites ahead of the T+24 engagement. The missile trail reads above the hill.                                       | [Radar Hill](stage9a-evidence/stills/radar-engagement.png)                                                        |
|   T+53 | `inspection-bay`   | Hold the low roadside frame on the shed, sign and passing convoy.                                                                           | [Inspection bay](stage9a-evidence/stills/bay-pass.png)                                                            |
|   T+64 | `support-convoy`   | Follow the six trucks as they leave the bay and continue inland.                                                                            | [Convoy follow](stage9a-evidence/stills/convoy-follow.png)                                                        |
|   T+90 | `fuel-shock`       | Give two seconds to locate the trees before the shock front reaches the right-hand near group and then the left-hand far group.             | [Near trees](stage9a-evidence/stills/fuel-near.png) · [Far trees](stage9a-evidence/stills/fuel-far.png)           |
|  T+115 | `ammunition`       | Hold the magazine from the first cook-off pulses through the T+132 bunker detonation.                                                       | [Main blast](stage9a-evidence/stills/ammunition-peak.png)                                                         |
|  T+152 | `shore-break`      | Show the east crest and wash before the landing craft reaches the beach.                                                                    | [Breaking crest](stage9a-evidence/stills/shore-crest.png) · [Landing](stage9a-evidence/stills/shore-landing.png)  |
|  T+164 | `lav-east`         | Show the LAVs aboard before the first transfer, then follow the lead vehicle down the bow ramp.                                             | [Deployment](stage9a-evidence/stills/lav-deployment.png)                                                          |
|  T+173 | `lcac-east`        | Keep the ramp and the last LAVs in view through the T+187.558 transfer and into indefinite observation.                                     | [Last transfer](stage9a-evidence/stills/final-ramp.png) · [All ashore](stage9a-evidence/stills/ashore.png)        |

The guide covers the operation with the available framing. A closer first departure would make the first launch as legible as the second. The full viewing pass and the three Environment details shots support closing this round without another scenery pass.

## Native viewer

- A fresh ready page started paused in Manual view at T+0 and 1×. The native Guided view and Play buttons took it to T+189.07 with the opening request and nine cuts. Each cut landed on the first eligible fixed step. LCAC 02 stayed selected across T+180 and through the final transfer. The run had zero seeks or restarts.
- At 0.5×, T+89.9 crossed to Fuel shock with one request. At 2×, T+151.8 crossed to Shore break with one request. A jump to T+188.2 and a backward seek to T+24.8 each requested only the destination. A T+7200 seek and resumed playback held the last shot. Guided restart selected Wasp at paused T+0. Manual restart kept its selected preset.
- Selecting Harbor during playback kept that camera through T+90. Reentering the guide selected Fuel shock at the live time and kept playback going. A click on the scene kept the guide. Orbit, right-drag pan and wheel zoom moved the camera and returned to Manual view with zero requests. Keyboard Recenter issued one request and kept the active cue.
- Space and Enter activated the native guide, disclosure, preview and playback controls. Tab reached the previews. Escape and preview activation returned focus to Highlights. Inspection bay at T+53, Fuel shock at T+90, Shore break at T+152 and LAV deployment at T+164 each opened paused with one camera request, the same speed and the chosen manual preset. Play and Pause then worked from each preview.
- At 1024 × 430 the four preview aims were at (512, 215), between the header and timeline. All four entries fit in the open menu and the menu ends at y=296.25, above the timeline at y=316. [Short viewport](stage9a-evidence/stills/short-highlights.png)
- The ready pages completed nine graphics jobs and started paused. Native WebGL context loss during guided playback paused at T+92.067 and disabled Play, seek and all four previews. Restoration completed nine jobs and re-enabled the controls with the same Fuel shock cue, time and request count. [Recovered viewer](stage9a-evidence/stills/context-restored.png)

## Rendering and pacing

The archived Stage 8D viewer used its manual preset and Stage 9A used its guided cue for each of 24 paired shots. Time, position, aim, quaternion and projection matched exactly. Both full-frame RGBA signatures from the native 1280 × 720 canvas matched at each pose. In Chrome's composited screenshots, all changes larger than one RGB level fell within the HUD area above y=152. At most 11 pixels below y=155 differed by one level in a pair. The headed Chrome sessions used DPR 1, antialiasing and Apple M4 Metal.

Draw submissions, triangles, shadow submissions, light counts, scene owners, GPU textures and GPU programs matched in all 24 pairs. The final GPU geometry counter reported one fewer geometry in each Stage 9A pose. An earlier capture before the input and short-layout fixes matched the geometry count. Draw totals include shadows.

| Paired pose              | Draws | Triangles | Shadow draws | Lights |
| ------------------------ | ----: | --------: | -----------: | -----: |
| Wasp, T+0                |   151 |   248,440 |           24 |      7 |
| Inspection bay, T+58     | 1,554 |   570,625 |          134 |     10 |
| Fuel shock, T+92.95      |   610 |   494,783 |           78 |     13 |
| Shore break, T+157.25    | 2,069 |   700,139 |           51 |     13 |
| LAV deployment, T+168.75 |   315 |   412,946 |           50 |     13 |
| Final ramp, T+186.75     |   239 |   406,510 |           50 |     13 |

Five warmed restart, mode switch and seek cycles each issued three expected requests. All 34 watched Stage 8 mesh and buffer identities stayed stable. Their common T+92.9 endpoint had 1,064 GPU geometries, four textures and 394 programs on every cycle.

| Separate 1× pacing window | RAF samples before → after |       Mean ms |      P95 ms |  Maximum ms | Long tasks |
| ------------------------- | -------------------------: | ------------: | ----------: | ----------: | ---------: |
| Wasp, T+2–10              |                  478 → 484 | 16.81 → 16.60 | 17.4 → 16.7 | 66.7 → 17.7 |      1 → 0 |
| Fuel shock, T+90–101      |                  664 → 662 | 16.63 → 16.68 | 16.9 → 16.8 | 33.3 → 49.7 |      0 → 0 |

The sessions stayed focused and visible at a 16.6 ms median display interval. The reference Wasp long task and the candidate fuel gap are included. These are short local samples. The shared setup resource 404 and Three.js Clock deprecation were present in both viewers.

## Preservation and fixture repair

All 27 camera IDs, labels and groups matched, with 1,053 exact manual frame samples at 13 times and three viewport sizes. The 51 events and their timing, the T+180 scripted endpoint, 13 runtime snapshots and 78 surf samples matched. Six rendered landing checkpoints matched all 35 actor roots, 64 wheel transforms, ramp transforms and water and navigation values. The fixed-step driver, event labels, scene, terrain, environment, vehicles, support, authoritative assets and dependencies retain the reference bytes. All guide activity uses the existing scenery, machinery and vehicles.

The source audit scopes the viewer changes to the App, rig and camera store and uses their fixed Stage 8D bytes for historical hashes. The HUD already has an exact historical path exception. The badge assertion checks the live Cinderfront label, and its historical projection preserves the original label and all camera assertions. The inherited Stage 8D assertion projection now matches its committed multiline formatting.

Both original captures were checked against their pins and compared with `94df448` for exact parsed values and ordered JSON tokens apart from whitespace before copying. The formatter ignores these two exact paths. The final byte hashes and working-tree Git blob IDs match the archived originals. Both paths are **pending commit** in the Git diff.

| Restored fixture                                                             | Reference → restored bytes | Pinned SHA-256                                                     |
| ---------------------------------------------------------------------------- | -------------------------: | ------------------------------------------------------------------ |
| [Construction](src/simulation/fixtures/stage7cConstructionPreservation.json) |            49,102 → 53,062 | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| [Presentation](src/simulation/fixtures/stage7cPresentationPreservation.json) |            53,891 → 58,811 | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

## Automated checks

The seven focused guidance tests passed. They cover cue boundaries, direct seeks, request counts, manual override, the four paused previews and readiness gating. The restored Stage 7C fixture and source guard passed all 12 tests. Both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` (**805 tests across 77 files**) and `git diff --check` passed.

Stage 7D retains its separate dated partial acceptance. [Stage 7D follow-up](STAGE7D_ACCEPTANCE.md#stage-7d-follow-up--2026-11-06)

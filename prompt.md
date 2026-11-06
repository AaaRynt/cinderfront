# Stage 8B — Shore Waves and Wind

Work in the existing Cinderfront repository. Build one readable surf sample on the remote beachhead and give the two Stage 8A environment samples visible wind. Deliver matched short clips in which a swell approaches, breaks into foam, runs up the beach and retreats, and in which nearby grass and tree crowns move with a shared wind direction.

## 1. Establish the reference

Use the completed Stage 8A commit `81f5c10` as the visual reference. The rescue-branch inspection bay and eastern beach-track marker supply known camera poses and vehicle passes. Read `AGENTS.md`, the Stage 8 roadmap in `ITERATION_PLAN.md`, `STAGE8A_ACCEPTANCE.md`, the relevant map and landing authority, and the Stage 7D findings on capture and display cadence.

Inspect the mounted sea, foam and wet-sand layers in `src/scene/world/stage4c/CoastalWater.tsx` and `coastalWater.ts`, the landing coast and reservations, `src/scene/effects/aftermath/effectClocks.ts`, and the Stage 8A placement, geometry and instancing code. The existing sea uses time-varying surface normals. The existing foam and wet-sand layers supply shoreline context for the new moving front.

The Stage 8A report records a successful local fixture repair and 780 passing tests. Both fixture blobs at `81f5c10` still have the older serialization. Check their byte guards before editing visual code.

| Tracked fixture under `src/simulation/fixtures/` | Original under `stage7c-review.local/` | Pinned SHA-256                                                     |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json`           | `construction-reference.json`          | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json`           | `presentation-reference.json`          | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

When a tracked blob misses its pin, verify the original hash and the equality of parsed values and JSON tokens apart from whitespace. Restore the exact original bytes and run the targeted construction tests with the existing assertions. Keep the restoration in the deliverable as a separate baseline repair. Verify the pinned bytes in the final diff and in any resulting commit. Keep the pins and report the inherited failure if an original is unavailable. Stage 7D retains its own partial acceptance.

## 2. Select and capture the sample

- Select one exposed segment of the rendered beach shoreline. Prefer a segment adjacent to the eastern landing area with readable surf in the existing `beach-offshore`, `beachhead` or `lcac-east` view and a low shoreline view. Use the actual coast and the mounted terrain and record the segment's bounds, run-up envelope and clearance from the LCAC approach, ramp, strand traffic and existing props.
- Reuse the Stage 8A `support-convoy` and `lav-east` views and low inspection angles. Review the rescue-branch bay during T+53–63 and the eastern track during T+220–230. Include a quiet view where the plant movement is easy to see.
- Before editing, capture fixed-pose stills and native 1× clips of the chosen shore and wind views. Freeze the camera poses, time windows, quality settings, display cadence and render budgets for comparison. Plan a surf clip long enough to show at least two complete cycles.

## 3. Make the water motion readable

Give the chosen segment a visible incoming swell and a broken crest that advances toward shore. Show the crest changing shape in shallow water, foam forming at the break, a thinner wash running up the sand, and the water receding and exposing a damp edge. The foam and damp edge should follow the same wave phase. Vary arrival along the shore so the break reads as a traveling wave.

Use the real local coastline and visible slope to fit the surf and wetness, with a smooth transition into the existing offshore water and a gradual fade at the ends of the sample. Keep the foam irregular and attached to the water or sand as appropriate. Inspect the low view for detached sheets, repeated stripes, hard seams and depth flicker. Retain the distinction between exposed shore and sheltered harbor.

Implement a bounded presentation layer with reusable geometry or shaders. Preserve the authoritative mean sea level, shore and terrain geometry, support queries, landing grades, hull poses, wake sources and contact behavior. Keep the ramp and tire contact readable throughout the closest landing pass.

## 4. Give grass, trees and dust a shared wind

Choose and document a prevailing world-space wind direction and a gust envelope. Apply them to Stage 8A grass and scrub at both sites and to the three trees at the rescue-branch bay. Anchor roots and the base of each trunk. Give grass tips, outer branches and crowns more travel than their bases. Let nearby plants share the gust while varying their response by position and shape. The wind should read in the normal camera and look rooted in the low view.

Include one restrained, local dust cue on exposed dry ground. It should drift with the same wind and stay clear of the vehicles and signs. Preserve the existing vehicle dust's births, anchors, lifetimes and simulation state. Use a bounded visual pool or equivalent fixed-cost treatment.

Apply wind only to vegetation and the intended dust. Stage 8A shares a solid material across plants and props, so keep shelters, drums, tires, signs and foundations rigid. Ensure animated tree shadows follow the visible crowns and size culling bounds for the maximum permitted bend. Preserve plant identities, root placement and the vehicle and sight-line clearances through the full motion envelope.

## 5. Keep time, cost and ownership predictable

Derive all new phases from absolute simulation time and stable world positions or seeds. Use bounded periodic phase reduction where required for late observation. Account for the rates used by the new effects before reusing an existing wrapped clock. A fixed timestamp must reproduce the same crest, wetness, bend and dust. Pause must hold them while the camera moves. Backward seek, restart, playback speeds and visits around T+180 and T+7200 must behave consistently.

Keep reusable buffers, materials and any fixed pools bounded. Prefer a small shared time input and static instance data. Keep the fixed-step driver, all 51 events, 24 cameras, actor and effect histories, authoritative assets, and previous scene and support invariants. Follow the complete human-visibility rules in `AGENTS.md`. Stage 8C owns blast-driven vegetation bending.

Predeclare an incremental cost budget against Stage 8A for a shore preset, the low shore view and both wind sites. Use +40 submitted draws, +10% submitted triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights per measured pose as starting ceilings. Record the limits before edits. Measure the same poses and short 1× windows with capture and pacing runs separate. Check startup, graphics readiness, disposal and stable resource counts across repeated seek and restart.

## 6. Verify and hand off

- Deliver matched before-and-after clips for the shore and the rescue-branch wind view, plus an eastern-track wind clip. Pair the existing preset and low shore view with stills at approach, break, maximum run-up and retreat. Use the running viewer and native playback. Make the shore movement and wind direction visible at normal speed.
- Check actual rendering for phase, root and prop stability, shadow alignment, wave seams and clearance during a landing pass. Demonstrate pause with camera movement, backward seek to the same time, restart and late observation. Use focused automated checks for the new deterministic motion and its bounds where existing checks lack coverage.
- Keep the original preservation fixtures and assertions. Use exact path-level source exceptions for deliberate presentation edits and retain the original state, geometry and contact oracles. Judge intentional visual changes with the matched clips and render checks.
- Run the relevant tests, both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` and `git diff --check`. Use installed development tooling and follow the repository prohibition on builds. Keep existing dependency versions and frameworks.

Record the sample location, clips, motion and clearance checks, measured cost and resource lifetime, baseline repair, and any open criteria in `STAGE8B_ACCEPTANCE.md`. Update the iteration plan and changelog from verified results. Close Stage 8B when the wave and wind are both readable and the deterministic, clearance, cost and preservation checks pass.

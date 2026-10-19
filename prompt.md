# Stage 6A — Ground Landscape, Vegetation, Rocks, and Sparse Trees

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer observes an authored scenario through spectator cameras and timeline controls.

This is an implementation task. Inspect the repository and actual application, complete the bounded landscape pass below, run permitted checks, inspect the result in a browser, fix visible defects, and deliver a reviewable result. Do not stop at planning or at adding a few scattered props.

## 1. Starting point and next-round priority

Stage 5C is complete in commit `b49db45`. Parent Stage 5 is complete for the finite T+0–180 scripted operation. Its recorded baseline is 421 passing tests across 37 files, 51 official events, and 24 spectator cameras.

Both LCACs and all eight LAV-25s are implemented. At T+180 there are five LAVs ashore, two transferring, and one still deck-supported. Playback pauses with "Script complete · aftermath pending Stage 6".

The next priority, following the project discussion, is a dedicated ground-landscape pass: more convincing dry grass, scrub, rocks, sparse small trees, and natural ground transitions. Stage 4C already supplies basic cover and placement rules; improve the visible landscape built on that foundation.

Stage 6 is split into:

- **6A:** ground landscape and its rendering efficiency — this task;
- **6B:** indefinite aftermath, continued unloading/inland movement, and clock/seek semantics;
- **6C:** remaining camera, lighting/effects/material polish and final performance integration.

Keep the finite 180-second runtime, all 51 event records, completed actor behavior, and current endpoint semantics unchanged in this round.

## 2. Read and inspect before editing

Read `AGENTS.md`, the Stage 4C/5C/6 sections of `ITERATION_PLAN.md`, the completed Stage 5C section of `STAGE5_INTEGRATION_READINESS.md`, and the corresponding `changelog.md` records.

Inspect:

- `assets/map/map-spec.yaml` and `assets/map/map-layout.svg`, especially climate, vegetation, regions, roads, operational ground, and landing grades;
- `assets/scenario/scenario-spec.yaml` and `scenario-timeline.md` for damage, moving actors, and the future aftermath contract;
- `src/scene/world/stage4c/regionalLayout.ts`, `coverGeometry.ts`, `RegionalCover.tsx`, `spatialReservations.ts`, `surfaceHistory.ts`, and their tests;
- `src/scene/world/stage2/VegetationSystem.tsx` and `environment/SparseVegetation.tsx`, `seededLayout.ts`, `EnvironmentPrimitives.tsx`, and `responseGroups.ts`;
- `src/scene/effects/stage3/BlastResponseField.tsx` and the existing environment-response ownership;
- terrain/material/render integration under `src/scene/world/stage2/`;
- `src/scene/world/landing/landingTerrain.ts`, `landingSiteData.ts`, and `landingReservations.ts`;
- current `lavDeployment.ts`, LCAC contact/path modules, secondary Pantsir and other vehicle motion needed for clearance checks;
- `src/simulation/stage5cPreservation.test.ts`, all historical fixture/projection contracts, and existing coastal/environment tests;
- camera presets, HUD, package scripts, and resource ownership/disposal conventions.

Before implementation, inspect representative wide and close browser views and save matched baseline captures/renderer measurements. Use the current app, not only old screenshots or text descriptions.

## 3. Visual direction

Preserve the authoritative **dry, semi-arid coastal mainland** character: sparse low scrub and dry grass, exposed soil, rocky slopes, gravel, and sandy shore. Dense forest and tropical vegetation are explicitly disallowed by the map.

The deliverable should make the terrain read as a coherent place at three scales:

- close: recognizable blades/twigs, branching trees, fractured rock surfaces, grounded roots/bases;
- medium: irregular patches, varied silhouettes, convincing rock groups and open ground;
- wide: distinct regional character with readable roads, vehicles, facilities, and battle events.

Do not substitute a green carpet, uniformly repeated bushes, spherical tree crowns, rows of identical cones, or random decoration everywhere. Retain broad bare areas and the established restrained diorama style.

Use repository-native procedural geometry and existing Three.js facilities. Inspect any existing reusable landscape assets before creating new ones. No dependency additions, remote asset downloads, purchased asset packs, framework upgrades, or image-generation work is needed.

## 4. Regional composition

| Region           | Required character                                                                                       | Keep clear/readable                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Radar Hill       | exposed layered/fractured rock, dry tufts in pockets, low wind-shaped scrub                              | radar/AAA/SAM pads, antennas, damage and surviving equipment                            |
| Convoy corridor  | uneven dry grass/scrub patches along sheltered ground and wash banks, occasional sparse trees            | complete vehicle/gun sweeps, reverse paths, bridge, service yard, road shoulders        |
| Remote beach     | low dune grass, coastal scrub, embedded weathered rock; only a few trees well inland in sheltered ground | both LCAC approaches, grades, ramps, actual LAV lanes and full inland-road reservations |
| Harbor edges     | sparse growth in unused land pockets and restrained rock/gravel transitions                              | quays, water, working aprons, warehouses, ship silhouettes and access routes            |
| Industrial edges | sparse dry cover and weathered gravel outside operating/firebreak areas                                  | containment, pipes, storage compounds, emergency access, fire/smoke/scorch visibility   |

Use existing region boundaries and suitable terrain/aspect/shelter cues. Avoid placing new trees on exposed radar crests, active industrial ground, harbor paving, open beach strand, or operational landing areas.

## 5. Improve existing grass and scrub

There are two existing vegetation layers: Stage 2 sparse cover with response metadata, and Stage 4C regional cover. Inspect both. Improving only one while leaving conspicuous old cones/faceted blobs beside it is not sufficient.

Replace visibly primitive grass silhouettes with small irregular clumps of tapered/bent blades or stems. Improve scrub with branching structure and broken foliage masses, believable negative space, restrained dry/olive variation, and nonuniform height/lean.

Reuse a small set of meaningful geometric variants and deterministic per-instance color/shape variation. Prefer better silhouettes and placement composition over simply raising polygon counts or population density.

Preserve existing layout IDs, seeds, base transforms, instance ordering, and response metadata. The current Stage 4C layout has 3,574 instances. Do not reroll or relocate those records to obtain a better screenshot.

Account for the different existing geometry-origin conventions: Stage 2 vegetation is positioned using a half-height offset, while Stage 4C cover is rooted around its ground datum. A shared replacement must not float or sink because those conventions were ignored.

New optional infill patches use a separate seed namespace and placement layer. They must avoid existing vegetation overlap and obey the full reservation rules below. Do not alter the historical layout generator to make room.

## 6. Rocks, outcrops, and ground contact

Improve the existing repeated rock forms into a small coherent family: fractured slabs/outcrops, irregular embedded boulders, and lower rubble/gravel groups. Use larger exposed forms on the ridge and smaller weathered forms near the beach.

Inspect both Stage 4C rocks and visible Stage 2 `RockCluster` instances. Preserve their identity, placement contracts, and authored response metadata while improving the rendered geometry/materials within safe bounds.

Give rocks a convincing base and orientation relative to the actual slope. Break repetition through bounded silhouette/aspect changes, mineral/color variation, and grouping. Avoid faceted balls resting on a single point, unsupported overhangs, stretched noise, or a continuous decorative wall.

Keep upgraded geometry inside the existing instance's reserved horizontal footprint. New protrusions require actual envelope checks, not just a smaller nominal radius. Use partially buried bases and terrain-aware render details to seat large forms; do not modify terrain height or actor support to fit a rock.

Sample the actual uploaded surface across each new rock/root footprint, including slopes and grade boundaries. Preserve base layout records; any derived render-only fitting data must be deterministic and separately testable.

## 7. Add sparse small trees

Trees are a required new visual category in this round, not a rename of existing scrub.

Add a limited set of small dryland trees with recognizable trunks, tapered branching, asymmetric crowns, and restrained foliage. Use several silhouette variants across two compatible forms, such as an upright open crown and a wind-shaped low crown. Avoid palms, lush tropical crowns, dense woodland, or excessive dead-tree repetition.

Start with approximately 24–48 trees across eligible inland corridor, sheltered ridge-foot, and inland beach pockets. This is an authoring budget, not a quota to fill unsafe ground. Report final counts, heights, crown spans, regional distribution, and reasons for any substantial reduction. Deliver visible trees at multiple suitable locations.

Use roughly 3–7 m heights as the initial visual range, measured in world meters against existing vehicles. Account for the entire crown/branch/root envelope and any wind displacement when checking clearance and batch bounds.

Keep tree placement deterministic, independent of camera/time, and separate from historical grass/scrub layouts. Trunks must meet the terrain; foliage must not float as disconnected balls or hide the branches completely. Avoid canopies touching one another enough to create a forest.

Do not add tree destruction, falling trees, fire propagation, collisions, or new official events. Place new intact trees outside existing damage/response envelopes.

## 8. Ground transitions without changing terrain geometry

Improve how existing soil, sand, gravel, exposed rock, vegetation bases, and road shoulders meet. Use restrained world-space color/roughness breakup and/or narrowly bounded terrain-draped detail layers.

Preserve all terrain/coast/road positions, indices, normals, existing vertex attributes, grade profiles, height/contact samplers, coastline, water polygons, and sea level. This is a visual material/detail pass, not terrain remodeling.

Do not create displacement, raised collision surfaces, duplicate terrain sheets, invisible support ramps, or modified road heights. Keep both LCAC grades and every LAV support/contact result exact.

New detail overlays must follow the actual triangles, use controlled depth ordering, and avoid z-fighting, dark rectangular stamps, large transparent overlapping sheets, or visible seams. Do not cover existing wear, scorch, wreck contact, wet sand, industrial damage, or water/foam.

Preserve the existing 404 wear records, service equipment, coastal motion values, and 37-record foam layout. Add independent landscape detail only where it is compatible with those layers.

## 9. Reservations and complete movement clearance

Reuse existing fixed/damage/road/landing reservations, but recognize their historical limits:

- Stage 4C vehicle sweeps stop at T+176 and omit later actor families;
- its raw LCAC routes are historical seed masks, not the actual approaches;
- Stage 5B adds actual smoothed-route and grade exclusions;
- Stage 5C now has eight moving LAVs and a full 180-second operation.

Create a focused additional reservation layer for the new landscape using the actual completed actor data through T+180. Include secondary Pantsir, actual LCAC/cargo/ramp envelopes, all eight LAV paths, and the final four seconds of existing vehicle movement.

Keep historical reservation inputs unchanged so existing layouts/fixtures do not reroll. Do not call the complete world derivation repeatedly from rendering or create dependency cycles between environment placement and simulation.

Measure the full moving envelope: wheels, hull, gun/barrel, suspension, payload, deployed ramp, canopy/branches, and any wind reach. Cover turns and transitions with sufficient sampling and conservative interpolation margins.

Reserve both full inland roads and their existing shoulders for future Stage 6B continuation even though current LAV travel covers only their starts. No invented post-180 actor motion or expanded simulation clock is needed to reserve known road corridors.

Protect operational yards, landing sites, pipes, fences, lights, facilities, wrecks, firebreaks, damage response zones, and water edges. Check new scenery against existing cover/equipment too.

Keep key camera views legible without view-dependent spawning: no tree trunk or crown permanently blocking a principal vehicle, landing ramp, radar installation, or major explosion from its existing preset. Small partial occlusion is natural; loss of the subject is not.

## 10. Time, response behavior, and architecture

Most of this landscape is static. Keep placement and resources outside React timeline subscriptions and reconstruct the same world on every mount/seek/restart.

Preserve Stage 2 environment-response group IDs, instance indices, metadata and authored blast/deformation behavior when replacing its rendered geometry. Do not detach legacy vegetation/rocks from the existing blast response or add competing response controllers.

Optional subtle vegetation motion may be added only after static visual goals are met. If used, derive bounded wind from absolute simulation time, use a consistent coastal direction, keep roots anchored, and include maximum displacement in culling/clearance bounds. Pause must freeze it; seeking must reconstruct it. Wall-clock animation and camera-seeded changes are prohibited. Static vegetation is an acceptable documented choice for this round.

Keep new work in focused landscape geometry/layout/material/render modules, reusing existing helpers. Avoid a general biome engine, world editor, terrain framework, new weather system, or changes to simulation state merely to hold static scenery.

No visible humans, occupants, crews, casualties, articulated characters, or humanoid silhouettes may be created or implied.

## 11. Rendering cost and resource ownership

Use shared geometry/materials, regional or spatially bounded instancing, and a small number of material families. Avoid one React component/draw call per grass clump, rock fragment, tree branch, or leaf.

Keep distant detail inexpensive. Use simple bounded geometry and, where measurement justifies it, a small deterministic distance-based LOD strategy. Camera changes may choose render detail but must never regenerate placement, change IDs, or change simulation state. Avoid conspicuous popping and unstable shadows.

Do not make every grass blade or distant canopy cast shadows. Use a limited, measured shadow policy for rocks/trees and preserve existing scene lighting, exposure, water, smoke, and explosion presentation.

Own and dispose new resources explicitly. No per-frame geometry/material creation, repeated shader compilation, unbounded caches, or rebuilding instance matrices during paused camera motion.

Use matched-view performance targets as working budgets: aim for no more than 80 additional submitted draw calls and 15% additional submitted triangles in each agreed baseline view, including existing shadow submissions. These are project targets, not hardware guarantees. If a view exceeds them, first reduce redundant geometry, shadows, or submissions; document any remaining justified exception with actual numbers and visible benefit.

Compare GPU timing only if it can actually be measured. Stable display-capped RAF cadence alone is not evidence that the added scenery is free.

## 12. Preservation contract

Capture a pre-edit Stage 5C baseline through T+180, including full simulation state, all 51 events, LAV deployment/contact/mechanics, environmental metadata/layouts, and relevant source/geometry checks. Historical fixtures stay byte-identical.

Require exact preservation of:

- all existing simulation actor/weapon/event values, including LAV motion and endpoint counts;
- LCAC/vehicle models, trajectories, deployment timing, wheel/contact results, and destruction outcomes;
- terrain/coast/road uploaded attributes and support heights;
- authoritative map/scenario/vehicle files;
- historical cover layout records and Stage 2 response identities/order;
- existing wear/equipment/foam/coastal values;
- all 24 camera IDs and playback, seek, pause, restart, speed, keyboard and endpoint behavior.

Allowed visual differences are improved cover/rock mesh shapes within tested envelopes, landscape materials, separately seeded trees/infill, compatible visual ground detail, and optional bounded vegetation wind. These do not authorize moving protected actors, rewriting terrain, or rerolling seeded history.

Old environment layout hashes must still pass. Test new layers separately. Update only genuinely obsolete assertions about the deliberately changed landscape rendering, keeping identity, grounding, reservations and response guarantees at least as strong. Do not remove whole-world preservation, regenerate historical fixtures, or weaken timeouts to obtain green tests.

Change only the stage label to Stage 6A in the ordinary UI; retain the pending-aftermath endpoint wording and all deployment readouts. Use installed Tailwind utilities for any touched DOM styling. No new camera presets or HUD redesign are needed.

## 13. Verification and visible acceptance

Automated checks should prove deterministic layout/variants, actual generated bounds, nondegenerate finite geometry, root/base grounding, full movement clearances through 180, future road reservations, preserved response metadata, unchanged simulation/terrain/layout baselines, and bounded stable resources. If wind or LOD is added, test the shared inputs/bounds and inspect actual rendered behavior.

Run permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

Do not run builds, `tsc -b`, combined `pnpm check`, or repository-wide formatting. Do not change dependency/framework versions or add dependencies. Keep heavy browser profiling and full tests separate if contention causes timeouts.

Save matched before/after views at the same camera transforms, viewport, DPR and times. Cover all five regions, with at least six close/medium comparisons and wide views showing the surrounding composition.

Required visual acceptance:

- older cone/blob cover no longer dominates inspected foregrounds;
- grass, scrub, rocks and new trees have distinct readable silhouettes;
- roots/rock bases sit naturally on slopes, with no obvious floating or hard overlay seams;
- sparse trees improve regional composition without forming woodland;
- roads, moving vehicles, ramps, major facilities and damage remain visible and unobstructed;
- no obvious doubled vegetation from overlapping Stage 2/4C/new layers;
- landscape appearance is stable under backseek/restart and paused camera movement.

Inspect T+0, radar damage, fuel/ammunition disasters, bridge/T-72/Pantsir reactions, both complete LCAC approaches and both LAV unloading sequences through 180. For unchanged simulation tracks, use focused visual regressions plus the exact automated baseline; replay complete landing/unloading continuously at 1× to check new scenery clearance.

Inspect all 24 cameras, close low-angle terrain contacts, wide regional views, camera movement across any LOD thresholds, all speeds, pause, repeated backward/forward seeks, restart, and 1280×720 / 1280×540 HUDs. Check console output.

Measure representative ridge/corridor/beach views and a busy industrial-disaster view before/after. Record submitted calls/triangles, geometry/material/texture/program counts and observed frame cadence under matched conditions. Run at least five warmed seek/restart/camera cycles and verify flat resource counts and stable actor/resource identities.

Do not claim completion from passing tests or object counts alone. The final paired captures must demonstrate a visible improvement at the intended viewing distances.

## 14. Documentation and handoff

After implementation and fresh verification:

- mark Stage 6A COMPLETE and parent Stage 6 IN PROGRESS;
- keep Stage 6B and Stage 6C PLANNED, and preserve Stage 5 completion records;
- update `ITERATION_PLAN.md` and append an accurate `changelog.md` entry;
- record the landscape variant/count/distribution data, extra reservations, geometry/material changes, actual clearances, optional motion/LOD decisions, measurements, and local comparison artifact paths;
- keep the Stage 5 integration report's completed actor/contact measurements intact; update only a next-stage pointer if needed.

Report the visible regional improvements, tree count/scale, preserved simulation/terrain/layout guarantees, fresh automated/browser results, paired image paths, matched rendering cost and warmed resource stability. Identify remaining visual limits honestly.

Do not claim indefinite aftermath, completed post-180 unloading, terrain remodeling, new combat, a forest biome, or visible personnel.

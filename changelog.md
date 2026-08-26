## Stage 0

init

## Stage 1

Stage 1 is finished: deterministic T+00:00–00:48 runtime, world shell, Wasp/F-35B/Pantsir models, combat sequence, persistent destruction, HUD, and spectator cameras are implemented.

Key implementation:

- Pure time-derived simulation, seek/reset logic, exact event boundaries, and tests in [src/simulation](/src/simulation).
- Integrated battlefield and effects in [BattlefieldScene.tsx](/src/scene/BattlefieldScene.tsx).
- Authoritative coastline, terrain, Radar Hill, roads, and installations in [WorldShell.tsx](/src/scene/world/WorldShell.tsx).
- Procedural Wasp, F-35B, and Pantsir models in [src/scene/vehicles](/src/scene/vehicles).
- Functional timeline, speeds, status display, and six camera presets in [SimulationHud.tsx](/src/ui/SimulationHud.tsx).
- F-35B launch includes deterministic spinning lift fan, opening door, rotating nozzle, vertical lift, forward transition, downwash, and gear retraction.
- Pantsir and radar destruction reconstruct as damaged geometry, fire, smoke, debris, and scorch marks at any post-impact seek time.

Validation passed:

- TypeScript no-emit check
- Oxlint
- 11 Vitest tests
- Browser inspection at launch, engagement, T+36, T+42, T+45, T+48, restart, and paused-camera orbit
- No browser errors; only the installed Three.js stack’s `THREE.Clock` deprecation warning

The production build and formatting were intentionally not run because the repository’s `AGENTS.md` explicitly prohibits both. Remaining Stage 1 limitations are the deliberately low-detail terraced terrain, sparse harbor shell, and simplified procedural smoke/debris. `prompt.md` was read and left untouched.

## Stage 2

Stage 2 is complete in the working tree.

1. **Architecture:** Added modular terrain, water, harbor, industrial, Radar Hill, corridor, beach, utility, vegetation, and naval modules under [stage2](/src/scene/world/stage2). [WorldShell.tsx](/src/scene/world/WorldShell.tsx) now orchestrates the static world separately from timeline-driven combat.

2. **Map regions:** All six theaters are represented: Harbor District, Fuel/Ammunition Storage, Radar Hill, Convoy Corridor, Remote Beachhead, and offshore staging.

3. **Terrain/materials:** Added an exact-coast, shared rendered heightfield; roads, pads, vegetation, and draped hardstands now use that same surface. Added dry soil, rock, sand, gravel, pavement, dunes, drainage, shallow/intertidal/deep water, dawn haze, and a camera-following sky dome.

4. **Harbor/industrial:** Built breakwaters, basin/channel, piers, jetties, berths, warehouses, cranes, cargo, electrical and defensive facilities. Fuel storage now includes varied tanks, bunds, transfer rack, pipe networks, utilities, service areas, rail and power connections. Ammunition storage has separated bermed magazines and loading infrastructure.

5. **Talwar:** [TalwarModel.tsx](/src/scene/vehicles/TalwarModel.tsx) provides a correctly scaled, intact frigate with recognizable hull, gun/VLS, bridge, mast, sensors, funnel, hangar and flight deck, plus future damage/fire/smoke/flooding anchors.

6. **Molniya:** [MolniyaModel.tsx](/src/scene/vehicles/MolniyaModel.tsx) provides the compact fast-attack hull, guns, mast/radar and two four-canister missile banks, with future movement/wake/damage anchors.

   Both ships use minimally adjusted water-side berth polygon centroids because the authoritative berth centerlines intersect their pier/jetty geometry.

7. **Vegetation/props:** Added deterministic instanced grass and scrub with Stage 3-ready response metadata, plus reusable fences, poles, lighting, pipes, barriers, generators, transformers and rock clusters. No blast response or ignition behavior exists yet.

8. **Performance:** Shared geometry/materials, restrained shadows, instanced vegetation, batched district fixtures—about 144 draws reduced to 29—and naval repetition reduced from 24 draws to 5. Static ship subtrees no longer reconcile at simulation frequency, and downwash reuses geometry.

9. **Stage 1 regression:** Browser replay sampled T+00:00, both launches, T+25 engagement, T+36, T+42, T+45 and T+48. Pantsir/radar destruction, persistent effects, double restart, and paused camera switching remained correct. Vitest covers deterministic seeking and reconstruction.

10. **Browser inspection:** Inspected Overview, Harbor, Industrial, Radar Hill, Search Radar, Convoy Corridor, Beach inland, Beach offshore, and Wasp viewpoints. Visual QA directly caught and corrected terrain/pad divergence, buried/floating roads, coastline closure, vegetation coloring, road winding, and the overview sky artifact.

11. **Checks:** TypeScript passed, lint passed, `git diff --check` passed, and all 7 Vitest files passed—25 tests total. No build or format commands were run, no dependencies changed, and the existing staged `prompt.md`/`ITERATION_PLAN.md` changes were preserved.

12. **Before Stage 3:** Models remain procedural rather than CAD-level, and water uses efficient layered surfaces instead of full wave/reflection simulation. The only browser-console item was the existing Three.js `Clock` deprecation warning. No Stage 3 Talwar damage/sinking, Molniya departure, industrial explosions, contamination, vegetation blast response, or other future-stage movement/destruction was implemented. No visible humans or occupants were added.

## Stage 3

Stage 3 is complete through T+172.

1. Air-to-ground weapons now release from the lower bay as dark physical munitions with forward/downward trajectories—no upward lob, glow, flame, point light, or continuous trail.

2. The flat terrain came from inward elevation feathering, heavily flattened normals, missing dune relief, broad facility grading, and weak shadow/low-angle cues.

3. Terrain now preserves authoritative elevations, real normals, Radar Hill relief, dunes, bluffs, dry wash, fitted roads, graded pads, and terrain shadows without global vertical exaggeration.

4. Industrial scale was corrected while retaining exact footprints: tanks gained ribs, shell courses, catwalks and stairs; warehouses gained bays, pilasters and roof details; yards, pumps, rails and bunds now fit the terrain.

5. Talwar progressively takes hits at T+72 and T+115, leaks fuel at T+100, burns, lists, floods, and becomes mission-killed at T+165 using one persistent model.

6. Molniya drops its moorings at T+62, follows the harbor route without teleporting, remains mobile after T+128 damage, produces a wake, and reaches open water at T+172.

7. The fuel sequence includes the T+78 pipeline fire, T+86 tank rupture, T+92 70-meter cascade fireball, linear shock front, deterministic debris, ground fires and persistent smoke.

8. Ammunition cookoff uses one authoritative nine-pulse schedule from T+116, culminating in the T+132 52-meter primary detonation with fragment-heavy debris and persistent compound damage.

9. Nearby vegetation, fences, lights and antennas respond according to shock distance, bending 10–32°, rebounding, settling, and selectively igniting or charring.

10. Harbor pollution includes an expanding irregular fuel sheen, floating debris, surface fires and wind-drifting bounded smoke.

11. Every state derives from absolute simulation time, so direct seeking and restarting reconstruct consistently. Public Stage 1 helpers remain frozen at T+48 while the combined runtime continues to T+172.

12. Browser verification covered overview, Radar Hill, harbor, industrial, corridor and beach terrain, plus representative times T+34, 43, 62, 72, 79, 87, 93, 95, 99, 101, 116, 118, 129, 133, 166 and 172. Restart and resumed playback were also verified; no browser console errors remained.

13. Validation passed: TypeScript `--noEmit`, full oxlint, `git diff --check`, and 62 tests across 10 files. The React review led to stable per-frame refs, authoritative shared schedules, and corrected resource ownership. No build or format command was run, and dependency files are unchanged.

14. Stage 4 content remains intentionally absent: no additional support formations, landing craft, ground-force expansion, Su-30 sequence, T+180 aftermath, audio, automatic camera direction, or visible humans.

Key files: [simulation derivation](/src/simulation/derive.ts), [weapon trajectories](/src/simulation/weapons.ts), [Stage 3 effects](/src/scene/effects/Stage3BattleEffects.tsx), [terrain model](/src/scene/world/stage2/terrainModel.ts), and [naval integration](/src/scene/world/stage2/HarborNavalAssets.tsx).

The pre-existing modification to `prompt.md` was preserved and not edited.

## Stage 4A

1. Terrain relief: rebuilt the mainland, overlays, and roads around one terrain surface. Radar Hill and broad landforms read more strongly; road grounding error is below 0.00055 m. See [terrainModel.ts](/src/scene/world/stage2/terrainModel.ts) and [terrainGeometry.ts](/src/scene/world/stage2/terrainGeometry.ts).

2. Vertical remap: added a monotonic middle-elevation stretch while preserving shoreline elevations through 18 m and authoritative high ground from 120 m upward. Added restrained deterministic microrelief.

3. Fuel scale: restored map-spec tank dimensions—95–125 m radii and 16–24 m heights—and leveled every tank foundation against the terrain.

4. Industrial district: added stronger tank hierarchy, pipe networks, elevated transfer racks, service walks, supports, pump equipment, control structures, blast walls, and permanent damage states. Instancing reduced the new detail pass from roughly 456 draw calls to 21. See [IndustrialDistrict.tsx](/src/scene/world/stage2/IndustrialDistrict.tsx).

5. Fuel escalation: preserved the authoritative T+78, T+86, and T+92 anchors while turning the event into a persistent district-wide sequence.

6. Secondary events: added header and feed-line ruptures, bund ignition, tank flashovers, transfer-rack failure, and later sympathetic tank/header failures through T+109.8. See [fuelDisasterMath.ts](/src/scene/effects/stage4a/fuelDisasterMath.ts).

7. Smoke/fire/blast: added layered smoke columns, 14 spreading pool fires, staged flashes, pressure fronts, deterministic debris, localized fire lighting, scorches, ruptured pipes, collapsed shells, and persistent wreckage. See [Stage4AFuelDisaster.tsx](/src/scene/effects/stage4a/Stage4AFuelDisaster.tsx).

8. F-35 smoothing: replaced point-to-point easing with velocity-continuous cubic flight paths, bounded acceleration, hover pre-rotation, speed-based tangent alignment, and aerodynamic banking. Maximum measured path turn rates are 17.3°/s and 23.7°/s, with under 1° high-speed nose/path error. See [derive.ts](/src/simulation/derive.ts) and [aircraftMotion.test.ts](/src/simulation/aircraftMotion.test.ts).

9. Cameras: retuned the full preset set, improved F-35 follow behavior, and widened Fuel Storage to show both early ignition and the main cascade. Paused orbit, pan, and zoom remain available. See [CameraRig.tsx](/src/scene/camera/CameraRig.tsx).

10. Validation: TypeScript passed, oxlint passed, `git diff --check` passed, and all 83 tests passed across 12 files. Per `AGENTS.md`, no build or format commands were run and dependencies were unchanged.

11. Browser inspection: checked every camera family, corrected roads and shorelines, fuel stages around T+81.6/T+93/T+114, ammunition at T+118/T+133, F-35 launch/turn/strike/departure, backward seeking, restart, 0.5×/1×/2× playback, and paused spectator controls. Final reload had zero console errors; only the existing Three.js `Clock` deprecation warning remains.

12. Limitations: this remains a deterministic cinematic visualization rather than a full flight, ballistics, structural-collapse, or fluid-fire simulator. The later reinforcement, landing, logistics, roster-expansion, and audio stages were intentionally not implemented. No visible humans were introduced.

## Stage 4B

Stage 4B is complete.

1. **Lifecycle architecture:** Added reusable ground-vehicle activity, physical-condition, outcome, pose, motion, grounding, and damage state in [types.ts](/src/simulation/types.ts:320) with absolute-time derivation in [groundVehicles.ts](/src/simulation/groundVehicles.ts:462).

2. **Roster:** Exactly `defender_btr_group_01` containing `defender_btr_01` through `defender_btr_04`, all `island_defender`.

3. **Model:** Added an occupant-free BTR-80 measuring exactly `7.65 × 2.89 × 2.35 m`, with eight wheels, widened middle axle gap, faceted amphibious hull, compact turret/HMG, rear engine deck, closed hatches, and opaque optics in [Btr80Model.tsx](/src/scene/vehicles/Btr80Model.tsx:142).

4. **Route:** Vehicles hold near `[1300,1000]`, travel along the eastern trunk to approximately `[720,1330]`, remain grounded using terrain plus road presentation height, then turn back east along prepared ground and the road.

5. **Timing:** T+75 alert/movement and T+118 arrival remain internal thresholds. Only `btr_01_disabled` at T+133 and `btr_survivors_fallback` at T+136 were added as official events in [timeline.ts](/src/simulation/timeline.ts:220). Duration remains 172 seconds.

6. **Lead loss:** BTR-01 is disabled by delayed secondary debris from the existing T+132 ammunition detonation. It becomes permanently darkened, scorched, smoking, disabled, and lost without a new weapon or attacker.

7. **Survivor reaction:** The three survivors hesitate until T+136, then use smooth 13 m turns and deterministic 0/0.6/1.2-second staggered responses. Their late gaps widen by more than seven metres instead of remaining fixed.

8. **Deterministic presentation:** Position, heading, speed, acceleration, steering, wheel rotation, dust, damage, flash, fire, smoke, and wreck persistence reconstruct solely from absolute simulation time. Effects are implemented in [Stage4BGroundVehicleEffects.tsx](/src/scene/effects/Stage4BGroundVehicleEffects.tsx:171).

9. **Camera:** Retuned `Convoy corridor` and added the single permitted seek-safe `BTR focus` preset. Browser QA confirmed orbit, pan, and zoom remain available while paused.

10. **UI:** Added Stage 4B labeling, official event readouts, and concise BTR group status such as `supporting`, `1 disabled / 3 operational`, and `3 withdrawing / 1 disabled`.

11. **Verification:** TypeScript no-emit passed; all 96 tests across 13 files passed; scoped lint exited with zero errors; whitespace checks passed. Browser inspection covered all required boundaries, the continuous T+132–140 interval at 1×, restart, backward/forward seeks, all playback speeds, camera controls, Stage 4A/harbor regressions, and a clean console with no runtime errors. One existing `THREE.Clock` deprecation warning remains.

12. **Roadmap:** The Stage 4B roadmap section is present and scoped correctly in [ITERATION_PLAN.md](/ITERATION_PLAN.md:386); unrelated roadmap content was preserved.

13. **Remaining scope:** The foundation intentionally supports only this authored BTR group. Additional actor families, support convoys, broader routing/tasking, and later Stage 4B.2/4C/5 work remain excluded.

No builds or formatting commands were run, no dependencies were added or upgraded, and no visible humans were introduced.

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
6. **Molniya:** [MolniyaModel.tsx](/src/scene/vehicles/MolniyaModel.tsx) provides the compact fast-attack hull, guns, mast/radar and two four-canister missile banks, with future movement/wake/damage anchors. Both ships use minimally adjusted water-side berth polygon centroids because the authoritative berth centerlines intersect their pier/jetty geometry.
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

## Stage 4B.2A

Stage 4B.2A is complete.

1. **Architecture:** Refined the shared ground-vehicle state into actor-specific BTR-80 and T-72B shapes over a common base, with discriminated wheeled/tracked drivetrains, explicit signed longitudinal motion, and hull heading that can intentionally oppose translation during reverse. Existing BTR poses, timing, steering, wheels, dust, grounding, damage, and outcomes remain unchanged.
2. **Roster and outcome:** Added exactly `defender_t72_group_01` with `defender_t72_01`, `defender_t72_02`, and `defender_t72_03`, all `island_defender` T-72Bs. The lead is destroyed and lost at T+158; the other two remain operational and become confirmed survivors at T+163.
3. **Route and motion:** The group begins in the open eastern `corridor_service_yard` at `[5967,250]` through `[6030,250]`, uses a minimal rendered connector through the east exit at `[6075,250]`, then joins the rescue branch, eastern trunk, and inland beach connector. T+150 movement accelerates to 9 m/s, the survivors brake to a halt after the strike, then reverse at restrained 4–4.5 m/s with signed road-wheel and track travel. Grounding uses the same rendered road/terrain surface, and a finely sampled yard-exit curve keeps hull yaw continuous.
4. **F-35B strike:** Revised only the late path of existing `attacker_f35_01`, preserving the exact T+90 handoff and all earlier behavior while adding a continuous corridor approach and southwestward departure. The dark unpowered guided bomb releases from the existing lower bay at T+154.5 and reaches the single pose-derived `defender_t72_01` anchor exactly at T+158.
5. **Model and effects:** Added a shared-resource, exact-scale procedural T-72B with a low sloped hull, two tracks, six road wheels per side, low faceted turret, ERA, long centered gun with bore evacuator, broad engine deck, closed hatches, and opaque optics. The medium vehicle kill uses a compact flash/fireball, bounded deterministic sparks/fragments/dust, scorch, local fire, persistent smoke, and the same fixed darkened wreck with its turret attached.
6. **Camera and UI:** Added one seek-safe `T-72 focus` camera based on the absolute group centroid and survivor hull heading, avoiding a 180-degree camera flip during reverse. The HUD now labels Stage 4B.2A, reports the four required T-72 statuses, and exposes the three official events. Browser QA also caught and corrected the camera panel overflow that had placed the preserved F-35 controls beneath the timeline at shorter viewports.
7. **Validation:** TypeScript no-emit, full oxlint, all 107 tests across 14 files, and `git diff --check` pass. Browser inspection covered T+0, every required T+149.9–172 boundary, the uninterrupted T+149–166 sequence at 1×, lower-bay release and impact, braking/reverse, persistent wreck reconstruction, backward/forward seeks, restart, 0.5×/1×/2× playback, paused orbit/pan/zoom, BTR and major camera families, and final console output. There were no runtime errors; only the existing Three.js `Clock` deprecation warning remains.
8. **Remaining scope:** Stage 4B.2B Su-30MKK reaction, Stage 4B.2C support/rescue convoy, Stage 4C environmental realism, and Stage 5 full-operation integration remain planned. No Pantsir 02, LCAC, LAV-25, generalized AI, 180-second operation, aftermath mode, or visible humans were added.

No build command was run, no dependency was added or upgraded, and the staged `prompt.md` change was preserved without edits.

## Stage 4B.2B

Stage 4B.2B is complete.

1. Added a dedicated deterministic Su-30MKK reinforcement state and authored flight-path module. The roster is exactly `defender_su30_01` and `defender_su30_02`, with shared aircraft geometry and separate poses, roles, outcomes, and effects.
2. Both aircraft enter from the northeast at T+104. The first briefly pressures the departing F-35B formation and becomes a damaged survivor breaking away at T+137; the second remains offset in support, performs the T+142 covering pass, and follows the withdrawal. Both cross the southwest air-activity boundary from T+170 onward.
3. Motion is reconstructed from absolute time with bounded speed, acceleration, heading rate, bank, terrain clearance, and inter-aircraft/F-35 separation. No generalized air-combat AI or new F-35 path was introduced.
4. Added one reusable occupant-free Su-30MKK model with the long nose/canopy, separated twin engines, twin fins, closed dark canopy, navigation lights, vapor, exhaust, and shared resources. `defender_su30_01` alone receives the persistent smoke, brief damage flash/sparks, and darkened surface state; neither aircraft is destroyed.
5. Added the four authoritative events `su30_reinforcement_entry`, `su30_01_damaged`, `su30_02_cover_withdrawal`, and `aircraft_egress`, plus the `Su-30 focus` camera and concise Stage 4B.2B HUD status/event readouts. Seeking and restart reconstruct the same aircraft and effect state.
6. Validation passed with TypeScript no-emit checking, full tests (303 passing), lint with existing warnings only, and `git diff --check`. Browser inspection covered entry, pressure/support, damage, covering withdrawal, egress, close model readability, seeking/restart, playback controls, camera controls, and console output; only the existing Three.js `Clock` deprecation warning remains.
7. Remaining work is Stage 4B.2C support/rescue convoy, Stage 4C environmental realism, and Stage 5 integration. No visible humans or occupants were added.

## Stage 4B.2C — 2026-10-04

Stage 4B.2C is complete through T+176.

1. **Architecture and preservation:** Added focused support-convoy types, absolute-time derivation, shared ground-motion helpers, procedural models, and effects. Support vehicles reuse generic motion/grounding/drivetrain state without invented turret, weapon, armor, or combat-damage fields. Immutable whole-world regression hashes preserve every pre-existing state and event field at 13 captured times, including T+172; completed BTR-80, T-72B, F-35B, Su-30MKK, naval, and infrastructure behavior remains intact.
2. **Exact roster and outcome:** `defender_support_convoy_01` contains `defender_support_fire_01` (fire engine), `defender_support_engineering_01` (engineering truck), `defender_support_recovery_01` (recovery vehicle), `defender_support_fire_02` (fire engine), `defender_support_logistics_01` and `defender_support_logistics_02` (logistics trucks), in that order. All six are `island_defender`, present, visible, operational, and confirmed survivors from T+174.
3. **Staging and motion:** The moving T+0 formation starts just beyond the service yard's northwest corner on `road_rescue_branch`, clear of the continuous north barrier, maintenance shed, substation, and reserve tanks. The `path_support_convoy_industrial` contract retains the authoritative yard/branch/eastern-trunk references. Trucks follow the branch with rounded bends, 34 m initial spacing, terrain/road grounding, continuous 17–23 m/s response motion, bounded braking and steering, and signed wheel travel during reverse.
4. **Four official events:** T+75 `rescue_convoy_redirect` accelerates the emergency response and activates beacons. T+108 `rescue_convoy_chokepoint` introduces bounded smoke/dust, staggered braking, a pause, and cautious 4 m/s advance. T+125 `rescue_route_secondary_hit` stops the approach after an unattributed secondary explosion at `dry_wash_bridge`; no shooter or weapon is assigned. T+174 `rescue_convoy_abandon_approach` confirms survival and starts distinct lead-hold, engineering/recovery reposition, and rear withdrawal responses. Only the beginning of withdrawal is visible by T+176.
5. **Models, lighting, and effects:** Shared truck resources provide 7.9–8.8 m long, 2.5–2.6 m wide, 3.1–3.25 m high sealed-cab vehicles with six wheels, opaque reflective glazing, closed fire compartments/hose reel/roof monitor, folded engineering crane/tool rack, recovery winch/tow frame, and two covered cargo variations. Headlights, phased emergency beacons, brake/reverse lights, wheel dust, visibility haze, compact flash/shock/debris, and persistent bridge scorch/rubble/edge damage reconstruct from absolute time. The existing bridge deck remains intact and no vehicle crosses the obstruction.
6. **Camera, HUD, and duration:** Added one seek-safe `Support convoy` preset with smooth group/bridge framing and preserved paused orbit/pan/zoom. The Stage 4B.2C HUD reports convoy phase and operational/survivor counts. Touched ordinary UI uses Tailwind utilities, including responsive panel bounds and compact camera buttons; global CSS was unchanged. The scoped timeline now has 40 events and ends at T+176; F-35B and Molniya movement continues beyond the preserved T+172 handoff without replaying strikes or resurrecting departed Su-30MKK aircraft.
7. **Validation and browser corrections:** Both TypeScript no-emit checks passed, full lint passed with 19 pre-existing warnings, all 315 tests across 20 files passed, and `git diff --check` passed. Tests cover roster/lifecycle, exact events, route/obstacle clearance, dense motion sampling, actual wheel contacts/model bounds, deterministic lighting/effects, all playback speeds, restart/seek, prior-world preservation, and the extended endpoint. Actual browser inspection covered all 19 cameras, close model views, all boundaries, uninterrupted T+70–130 and T+170–176 at 1×, the preserved T-72 strike and aircraft egress, direct/backward seeks, restart, 0.5×/1×/2×, paused spectator controls, and a 540 px high viewport. Inspection corrected sharp route bends, late withdrawal framing, camera-button utility precedence, and short-height HUD bounds. No browser errors remain; only the existing `THREE.Clock` deprecation warning remains.
8. **Remaining scope:** Stage 4C environmental storytelling/coastal realism remains next, followed by Stage 5 full-operation integration. No Pantsir 02, LCAC, LAV-25, T+176 amphibious event, full T+180 operation, aftermath mode, visible personnel, or generalized convoy AI was added. No build command was run, no dependencies were changed, and the pre-existing staged package/lockfile/prompt changes were preserved.

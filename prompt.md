# Stage 6B — Indefinite Aftermath and Continued Movement

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer observes authored events and their aftermath through spectator cameras and time controls.

This is an implementation task. Inspect the current repository, implement the complete bounded continuation contract below, run permitted checks, inspect the actual application in a browser, fix problems found, and deliver a reviewable result. Do not stop after planning or after removing a time clamp.

## 1. Verified starting point

Stage 6A is complete in commit `75bf46a`; Stage 5C is complete in `b49db45`. The recorded Stage 6A baseline is 440 passing tests across 40 files, 51 official events, 24 spectator presets, and a finite T+180 runtime. These are previous results, not fresh validation for this task.

Stage 6A delivered rooted grass/scrub, fitted rocks, 32 static dryland trees, visual surface breakup and movement reservations. Preserve that landscape, its static uploads/resources, all historical layout records and the complete scripted history.

At T+180, five LAV-25s are ashore, two are transferring, and one remains deck-supported. Playback currently pauses with "Script complete · aftermath pending Stage 6".

This round must make T+180 a continuous handoff into **AFTERMATH OBSERVATION**: finish the remaining unloading, continue authored survivor activity and ongoing environmental effects, and allow observation to continue without a fixed runtime endpoint. Stage 6C remains responsible for remaining presentation and final performance refinement.

## 2. Read before editing

Read `AGENTS.md`, `ITERATION_PLAN.md`, the current/historical distinctions in `STAGE5_INTEGRATION_READINESS.md`, and Stage 5C/6A `changelog.md` records.

Read the scenario's T+180 event, aftermath requirements, and narrative chapters 29/30 in `assets/scenario/scenario-spec.yaml` and `scenario-timeline.md`. Read relevant map/vehicle references and the existing roads, boundaries, damage locations, sea level and factions.

Inspect:

- `src/simulation/constants.ts`, `time.ts`, `store.ts`, `derive.ts`, `timeline.ts`, `types.ts`, and endpoint/store/preservation tests;
- `landingCraft.ts`, `landingCraftContact.ts`, `landingCraftPaths.ts`, `landingCraftTypes.ts`, and `lavDeployment.ts`;
- `groundVehicles.ts`, `groundVehicleRoutes.ts`, `supportConvoy.ts`, `secondaryPantsir.ts`, `stage3.ts`, and aircraft derivation;
- `src/scene/world/landing/landingTerrain.ts` and its actual uploaded road/support surfaces;
- `src/scene/world/landscape/`, especially static layouts, fitted models, tree envelopes and completed movement/road reservations;
- all active effect renderers, particle caches/pools, coastal/wear shader uniforms, machinery and navigation lights;
- `src/scene/BattlefieldScene.tsx`, camera derivation/follow logic, playback/keyboard integration, `src/App.tsx`, and `src/ui/SimulationHud.tsx`;
- historical fixture/source-checksum contracts and current package scripts.

Before implementation, capture representative views and the exact T+180 state. Audit every current time consumer rather than assuming changing the store will animate the whole scene.

## 3. Scope and invariants

Implement one coherent aftermath runtime, continued unloading and road travel, surviving vehicle/ship continuation, persistent effects/machinery, direct aftermath seeking, and long-running verification.

Keep:

- the scripted duration exactly 180 seconds;
- all 51 official event records unchanged and reached exactly once;
- all existing actor identities, ownership, survival/destruction outcomes and model dimensions;
- exact scripted actor/weapon/contact histories through T+180;
- all 24 camera IDs, free spectator controls, and the completed Stage 6A landscape;
- authoritative map/scenario/vehicle assets, terrain/coast/road geometry, support heights and historical fixture bytes.

Do not add new major strikes, combat AI, weapons, actors, losses, aircraft sorties, pathfinding, fluid/rigid-body simulation, audio, vegetation changes or a general timeline framework.

Never create, model, render, animate, or imply visible humans, occupants, crews, casualties, articulated bodies, or humanoid silhouettes. Hatches and glazing remain closed/opaque.

Do not run build commands, change dependency versions, add dependencies, or upgrade frameworks. Preserve unrelated user changes.

## 4. Time model: one running clock and capped scripted progress

Use one authoritative nonnegative observation/runtime clock. Derive:

- scripted progress = min(runtime, 180);
- aftermath elapsed = max(runtime - 180, 0);
- phase = scripted before 180, aftermath from 180 onward.

This requires distinct meanings, not two independently ticking stores. Rendering, HUD, cameras, effects and controls must read the same runtime.

During playback, crossing 180 must neither pause nor lose the part of a tick beyond 180. A tick from 179.9 to 180.4 must yield runtime 180.4 and aftermath elapsed 0.4 at the selected playback speed.

The event list remains capped at the completed 51 records. No new official event, replay of old events, repeated endpoint emission or event-handler-driven actor spawning is needed.

Keep `SCRIPTED_DURATION_SECONDS = 180`, historical constants, and explicitly bounded legacy derivation/time APIs. Add a focused runtime derivation/time layer instead of redefining every historical helper as unbounded. Names such as `deriveRuntimeWorldState` and runtime-specific normalization/formatting are suitable; inspect the existing interfaces first.

For runtime <= 180, the active runtime-derived world must reproduce every existing scripted actor/weapon field exactly. Historical finite APIs can remain compatible, but the application's active path must also be tested against the complete baseline.

Preserve pose, velocity, heading, signed wheel travel, effect ages, damage and machinery phase at the handoff. Do not map post-180 time back into the opening scenario or rebuild the world at 180.

Runtime/local labels continue beyond T+03:00; local clock formatting wraps the day correctly. Only periodic phases may be reduced modulo their period for numerical stability. Never modulo the overall runtime to replay the scenario.

Normalize invalid time inputs deliberately: negative finite seeks clamp to zero; nonfinite seek/tick inputs must not corrupt state or jump to infinity. Document and test the runtime policy separately from unchanged legacy finite-time behavior.

## 5. Playback, seeking and user interface

Use these concrete semantics:

- Play continues naturally into aftermath; Play at runtime 180 or later resumes observation.
- Pause freezes actor motion, wheels, fans, radar animation, water, smoke, fire, particles and lights while spectator movement remains free.
- Restart returns to paused T+0 and clears transient observation state without rerolling scenery.
- Direct seek reconstructs any supported finite observation time without simulating every intervening frame.
- Seeking backward from aftermath restores the original scripted world, cargo attachments and event coverage.
- In-range seek preserves the user's current playing/paused state.

Keep the existing scripted slider at 0–180. Its displayed value pins at 180 during aftermath; dragging it seeks back into the scripted interval. Do not continually rescale its historical event markers or pass an out-of-range runtime as its value.

Provide a compact accessible observation-time input, in seconds with 0.1 s resolution, to seek directly beyond 180. Arrow-key time stepping uses runtime; Home seeks 0 and End seeks the scripted boundary 180. Keep Space/playback shortcuts and text-input editing from interfering with each other.

Show `AFTERMATH OBSERVATION`, elapsed aftermath time, and the continuing observation/local time. Replace the pending-aftermath message with truthful active phase and deployment readouts. The last official event remains `scripted_phase_complete`.

Use existing Tailwind utilities and visual style. Preserve a usable 1280×540 layout. No debug panel, HUD redesign, or additional camera preset is required.

## 6. Complete the existing unloading

Reuse the eight persistent IDs, manifests, departure offsets [0,3,6,9], current two ramp lanes, finite-radius tire support, full quaternion poses, suspension, wheel travel and bounded ground dust.

At exactly 180 retain 1 aboard / 2 transferring / 5 ashore. Continue vehicles 04/07/08 smoothly from their actual deck/ramp states.

The previous schedule estimated full clearance at approximately:

- `attacker_lav_04`: 181.591;
- `attacker_lav_07`: 184.558;
- `attacker_lav_08`: 187.558.

These were estimates beyond the former endpoint. Preserve the established ramp pace and measure the actual new results. By roughly 188, all eight should be fully ashore if those profiles are retained. Report exact measured clearance and attachment/occupancy transitions.

Keep both LCACs at their completed shoreline poses with open grounded ramps and closed stern ramps. Navigation/fan activity can continue; cushion spray/dust must settle once its authored births end. Do not relaunch or move the craft to avoid a contact problem.

Each LAV remains visible exactly once throughout unloading and continuation. Keep origin carrier/group identity separate from current attachment. Do not reset wheels, hide vehicles at the handoff, duplicate deck/ground models, or claim ashore status from a center-point test alone.

## 7. Extend LAV road/support coverage correctly

The current deployment solver is a carrier-forward straight profile with fixed support coverage from -12 to 90 m. Its height/arc lookup clamps outside that range. Removing the global time clamp would eventually continue straight off the actual road and misreport tire travel.

Retain that exact near-craft solution through the scripted interval and remaining ramp transfer. Introduce a measured handoff safely inside its valid support range, including wheel-radius, axle and chassis-filter look-ahead. A station near 70–75 m is a useful starting candidate; choose and verify the exact station.

Join continuously to each actual road:

- west `road_beach_exit`: [4300,-2920] → [4250,-2700] → [4200,-2480] → [4200,-2280] → [4100,-2080];
- east `road_beach_access_east`: [5450,-2860] → [5550,-2680] → [5700,-2480] → [5750,-2280] → [6000,-2050].

Use the complete rendered road/support geometry, not an extended straight ray or flat height sampled at station 90. Author smooth turns contained within the existing 10 m roads and reserved shoulders.

Keep two offset lanes where they fit safely. Match position, orientation, speed, wheel phase and support at the handoff, with continuous velocity/heading and bounded pitch/roll/steering/suspension. Verify every tire and the full hull/barrel at bends and changes of grade.

Continue near the proven 4.5 m/s inland pace, with measured acceleration/braking/turn-rate limits. No rush to finish both approximately 875/1,002 m roads. Maintain same-lane following distance through turns and terminal braking without generalized traffic AI.

Author safe terminal formation holds before the ends/junctions of the known roads, staggered by lane/order. Brake smoothly, set speed and wheel travel consistently, and let dust expire. Do not loop land vehicles back onto the beach, teleport to another road, drive indefinitely beyond known terrain, or keep spinning wheels against a clamped position.

Indefinite observation does not require every vehicle to travel forever. A finished finite route can end in a truthful deployed/holding state while other battlefield activity continues. Use focused runtime metadata/types if a new terminal activity is needed, without changing historical payload fields.

## 8. Other survivors and bounded route completion

Build an explicit continuation table for the existing actor families, recording their T+180 anchor/velocity, permitted activity, path or hold, terminal behavior, and effect-clock source.

Required behavior:

| Family                      | Aftermath contract                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Wasp                        | Continues underway on a bounded safe offshore patrol, with wake and machinery                                                     |
| Molniya                     | Continues damaged withdrawal toward open water; may depart beyond the observation boundary as a survivor                          |
| Talwar                      | Remains heavily listed, partially flooded and burning; no further sinking, new strike or resurrection                             |
| BTR/T-72 survivors          | Continue the established withdrawal along known clear routes, then brake to safe holds or a verified departure                    |
| Support convoy              | Lead retains its hold; engineering/recovery complete limited reposition; rear vehicles continue a bounded safe reverse withdrawal |
| Radar/air-defense survivors | Wrecks remain fixed; surviving equipment/antennas may keep their established machinery activity                                   |
| LCACs/LAVs                  | Open grounded craft, completed unloading and authored inland travel/holds                                                         |
| Aircraft                    | Already departed aircraft remain departed; no re-entry, new strike or repeated sortie                                             |

Preserve the specific existing roster/outcomes. The destroyed primary/secondary Pantsir, disabled BTR, destroyed T-72 and radar/infrastructure damage remain fixed.

Wasp's old polyline is closed in position but has different start/end tangents. Do not use runtime % 180 to make it snap or turn instantly at the loop seam. Anchor a continuous safe post-180 path to its existing final pose/velocity, and verify the complete hull stays offshore and clear of the map/other vessels. A repeatable patrol is permitted only with a continuous seam.

For Molniya, use an explicitly bounded outgoing water segment and a measured full-hull boundary crossing. If it leaves the observation area, fade/render departure coherently, retain its survivor identity/outcome and a finite terminal pose, stop new wake/smoke births there, and never respawn it. Cameras must retain a valid target/final framing.

For ground survivors, do not blindly extrapolate existing station/reverse formulas forever. Validate route ends, braking, spacing, buildings, bridge obstruction, roads and the completed landscape before committing continuation. Vehicles may hold when their authored movement is complete.

## 9. Persistent effects, water and small secondary activity

Audit all time consumers: some currently receive clamped derived-world time, while others read the store directly. The active runtime must reach ongoing shader uniforms, smoke/fire ages, lights, fans, water and machinery.

Keep irreversible scripted state and cutoffs based on capped scripted progress. Use runtime for continuing periodic motion and bounded effect birth/age reconstruction. Preserve the original major effects through 180.

Existing major explosions, shockwaves, debris launches and weapon releases must not restart. Continue persistent fuel/ammunition/vehicle/ship fire and smoke, harbor sheen/burning fuel/debris, and appropriate surviving machinery/water motion from their existing phases.

Reuse fixed-capacity pools and analytic/cyclic presentations where suitable. Dust depends on actual moving ground contacts, follows the extended road paths, and fades when vehicles stop. Old trails must not remain as immortal particles.

Include the source's occasional minor industrial secondary detonations as sparse deterministic site/cycle-indexed small flashes/puffs in existing damaged areas. Begin after 180, leave quiet intervals of tens of seconds, and use short lifetimes and fixed slots with at most one active burst per site. They add no official event, attribution, actor loss, major hero explosion, global shock or fire-propagation system. Test birth/lifetime boundaries and direct-seek reconstruction.

Do not accumulate emission history, retain every birth forever, or integrate every frame from zero on direct seek. Bound caches by finite route tables or fixed recent windows. Runtime 7200 should cost about as much to derive/render as another comparable active view, not depend on having played the preceding two hours.

Use bounded/modular shader phase inputs where long runtimes would lose precision, preserving visible continuity and the original scripted output. Do not use wall-clock time or uncontrolled randomness.

## 10. Landscape, contact and post-180 clearances

Keep all 32 trees, 3,574 historical regional records, legacy response identities, fitted rock/plant geometry, materials, instance uploads, wear/equipment/foam, terrain/coast/roads and sea level unchanged.

Stage 6A protected motion through 180 and reserved both full LAV roads. These are useful inputs, not proof that every post-180 patrol/reverse route is clear.

Add focused continuation-envelope tests against existing scenery, infrastructure and actors. Include wheels/guns, full hulls, suspension, open ramps and tree crowns. Keep paths inside verified clear space; do not reroll/delete scenery to gain room.

Do not feed newly unbounded derivations into Stage 6A's historical static placement loops. Preserve one-way dependencies, cached static reservations and fixed layout identities. New verification/route data belongs in focused aftermath modules.

The complete grounded road and ramp geometry stays the support authority. No contact-height rewrite, invisible bridge, terrain smoothing, map rescaling or authoritative reference edit is needed.

## 11. Architecture and exact scripted preservation

Add focused runtime clock/derivation, continuation data/path, ongoing effects and tests. Avoid putting the entire aftermath into `derive.ts`, `store.ts`, or a monolithic render component.

There must be one active world/time source. Update the scene, HUD, follow cameras, keyboard controls, store selectors and render-time readers together. Do not leave a finite historical store driving effects while a second unbounded store drives the HUD.

Before editing, capture a Stage 6A baseline from `75bf46a` through 180, including complete actor/weapon/event/contact state, landscape layouts/resources and relevant render inputs. Keep all historical fixture bytes and stored world hashes unchanged.

Test both:

1. historical bounded APIs retain their defined behavior;
2. the actual runtime derivation, projected only to omit genuinely additive runtime metadata, matches every old actor/weapon/event/contact field through 180.

Do not compare only an unused frozen API or discard whole actor families from the active comparison. At exactly 180 the five/two/one LAV state and all mechanical values remain exact. The intended changes there are playback continuation and UI phase, not actor teleportation.

Existing preservation tests include whole-file hashes for runtime/store/type/test sources that this round may legitimately need to edit. Handle those conflicts explicitly: enumerate the exact files and reasons; retain the captured historical bytes/hash audit against its fixed Git baseline; and add stronger current-source behavioral comparisons for the active runtime. Preserve unrelated source checks.

Do not update historical fixture contents to bless changes, whitelist entire directories, normalize arbitrary edits, replace historical checks with hashes generated from current files, or weaken assertion coverage/timeouts. If refactoring an existing pure helper is necessary, its old-domain output still needs exact preservation tests.

Update finite-endpoint active-store/UI assertions to the new semantics and retain finite behavior only where the legacy contract actually applies. No source change is allowed to silently alter scripted movement, damage, effects or landscape.

## 12. Camera/HUD and resource ownership

Preserve all 24 preset IDs and paused orbit/pan/zoom. Existing LAV and vehicle follows must track the runtime poses through extended routes and safe holds. Retain stable framing if a survivor leaves the view; never target NaN/infinite coordinates or reset the spectator unexpectedly at 180.

Use Stage 6B labeling, active aftermath/readout semantics from section 5, and accurate payload counts. Avoid broader visual redesign.

Share existing geometry/materials and keep actor roots stable across the handoff and seeks. Fixed route/support tables may be precomputed or lazily cached with explicit finite bounds. Direct late seeks must not allocate a new persistent copy per visited time.

Maintain explicit ownership/disposal and stable warmed shader/resource counts. Time advancement can update dynamic buffers/uniforms, but static landscape uploads must stay unchanged. Separate active-timestamp count differences from actual resource growth.

## 13. Automated verification

Add meaningful tests for:

- exact 180 boundary/overshoot at 0.5×/1×/2×, pause/resume/restart, finite-input normalization and one-clock synchronization;
- runtime/scripted/aftermath formatting, local-day rollover, scripted slider and accessible observation-time seeking;
- all 51 event records unchanged with no replay/duplicate endpoint after arbitrary seeks;
- full active scripted preservation through 180 and the continuous immediate post-180 handoff;
- actual 04/07/08 clearance, stable IDs/attachments/counts and eight operational ashore vehicles afterward;
- old-profile/new-road support handoffs, all wheels/belly/barrel at every road bend, continuous signed wheel travel/steering, speed/turn/braking and terminal formation spacing;
- bounded ship patrol/departure and ground survivor routes, valid terminal poses/headings/visibility and fixed wreck outcomes;
- fixed-capacity deterministic smoke/fire/dust/secondary effects, no reborn major explosions and stable static scenery;
- direct seeks in different orders to 180/188/240/360/600/1800/3600/7200, repeated identical results, and bounded route/effect caches;
- continuing motion/effect variation at late times, with finite state/resources rather than a global late freeze;
- actual rendered transforms, camera targets, shader time inputs and unchanged landscape geometry/uploads.

Retain the original timeout limits; avoid concurrent heavy browser profiling and full tests if contention causes timeouts.

Run:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

Do not run builds, `tsc -b`, combined `pnpm check`, repository-wide formatting, dependency/version changes or framework upgrades.

## 14. Actual browser and long-running acceptance

Capture the unchanged scripted views before editing. Verify matched scripted appearance after implementation at the same transforms/times/viewport/DPR.

Watch an uninterrupted 1× crossing from before 180 through all three remaining ramp clearances and into road travel. Inspect low-angle hinge/toe support, 179.9/180/180.1, measured 04/07/08 clearance boundaries and the old/new road-profile handoffs.

Inspect both groups at their first bends, later bends, terminal braking and holds, plus every continued survivor family. Use close ground/vehicle and wide scene views. Confirm actual rendered positions/wheels agree with runtime state.

Run one complete T+0–180 playback that continues into aftermath without user intervention. Replay representative older radar, fuel/ammunition, bridge/T-72/Pantsir, aircraft/naval and landing sequences.

Check direct observation seeks to 240/360/600/1800/3600/7200 and backward to 179/160/0; pause while moving the camera; restart; all speeds; keyboard/text-input behavior; all 24 presets; 1280×720 and 1280×540 layouts; and the console.

Run at least ten real minutes of uninterrupted aftermath playback, at 2× if useful, with resource snapshots at intervals. In addition, compare equal warmed late timestamps across at least five seek/restart/camera cycles. Very late direct seeks do not replace sustained-playback evidence.

Measure matched scripted views and busy aftermath views: renderer calls/triangles, geometry/material/texture/program counts, dynamic pool/cache bounds, stable actor roots and static landscape upload versions. Confirm no growth tied to elapsed playback, number of seeks or number of emitted particles.

Check actual GPU water time and representative fire/smoke/fan/light motion: they advance during aftermath and freeze under Pause. Do not infer active observation from a changing text clock alone, or a GPU improvement from display-capped RAF cadence.

Save local captures, continuous recordings/chronological frames, raw measurements and logs. Report only checks actually performed and explain any measured limitation.

## 15. Documentation and final handoff

After implementation and fresh verification:

- mark Stage 6B COMPLETE, parent Stage 6 IN PROGRESS, and Stage 6C PLANNED;
- preserve completed Stage 4/5/6A history;
- update `ITERATION_PLAN.md`, `STAGE5_INTEGRATION_READINESS.md`, and `changelog.md` with the actual runtime contract, continuation/terminal table, unloading/road results and evidence;
- distinguish historical finite T+180 measurements from current post-180 results;
- record any narrowly changed source-checksum assertions and their replacement behavioral coverage;
- state remaining Stage 6C presentation/performance work without claiming the entire project is finished.

Report the clock/controls contract, exact late unloading times, all survivor paths/holds/departures, road-support/clearance measurements, effect/cache bounds, scripted preservation, camera/HUD changes, fresh tests/browser results, artifact paths and sustained resource measurements.

Do not claim an endless road network, physical ocean/vehicle simulation, new combat or visible personnel. The deliverable is deterministic indefinite observation with bounded authored continuation and persistent battlefield activity.

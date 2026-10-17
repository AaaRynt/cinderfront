# Stage 5C — LAV Deployment and Full Timeline Integration

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer follows authored events with spectator cameras, playback, pause, restart, speed controls, and direct seeking.

This is an implementation task. Inspect the current repository, implement the bounded Stage 5C slice, run permitted checks, inspect the actual application in a browser, fix issues found, and deliver a reviewable result. Do not stop after planning.

## 1. Starting point and intended result

Stage 5B is complete in commit `2a3fffc`, following Stage 5A in `4c89a93`. Its documented validation baseline is 393 passing tests across 32 files, 47 official events, 22 cameras, and a T+176 runtime. These are recorded previous results; report your own validation separately.

The two LCACs already approach, beach, settle, and lower their ramps. All eight LAV-25s already exist as persistent embarked payloads. Extend these existing actors into staggered unloading, grounded beach travel, and initial advance along the two inland roads.

Finish the four remaining official events and the complete T+0–180 scripted timeline. Stage 6 still owns indefinite aftermath.

The human's 2026-10-09 nearer-staging/local-grading decision has been implemented and verified. Preserve that completed solution; do not reopen its approval or rebuild the LCAC approaches.

## 2. Read before editing

Read `AGENTS.md`, `ITERATION_PLAN.md`, `STAGE5_INTEGRATION_READINESS.md`, and the Stage 5A/5B records in `changelog.md`. Distinguish the readiness report's historical feasibility estimates from its measured Stage 5B completion data.

Read the relevant authoritative inputs:

- `assets/scenario/scenario-spec.yaml` and `assets/scenario/scenario-timeline.md`, including LAV groups, both inland paths, all four outstanding events, and the eventual aftermath contract;
- `assets/map/map-spec.yaml` and `assets/map/map-layout.svg`, including both landing grades, roads, apron, and reservations;
- `assets/vehicle/Belligerents.yaml`, the LCAC and LAV-25 dimension files, and their visual references.

Inspect the actual implementation before choosing interfaces:

- `src/simulation/landingCraftTypes.ts`, `landingCraftData.ts`, `landingCraft.ts`, `landingCraftPaths.ts`, and `landingCraftContact.ts`;
- `src/scene/vehicles/LandingCrafts.tsx`, `LandingModels.tsx`, and `landingModelResources.ts`;
- `src/scene/world/landing/landingSiteData.ts`, `landingTerrain.ts`, and `landingReservations.ts`;
- `src/simulation/groundMotion.ts` and the existing grounded vehicle implementations;
- `constants.ts`, `time.ts`, `store.ts`, `timeline.ts`, `types.ts`, and `derive.ts` under `src/simulation/`;
- existing preservation fixtures/projections and landing, reference, model, terrain, timeline, store, camera, and UI tests;
- `src/scene/camera/CameraRig.tsx`, `cameraStore.ts`, `src/App.tsx`, and `src/ui/SimulationHud.tsx`;
- package scripts and resource ownership conventions.

Use existing architecture and dependencies. Keep changes focused on this delivery.

## 3. Scope and hard constraints

Implement:

- staggered unloading of the existing eight LAV-25s;
- continuous deck → ramp → beach → road motion, wheel contact, wheel rotation, restrained steering/suspension, and bounded dust;
- two group deployment states and direct joins to their respective inland roads;
- exactly four additional official events, bringing coverage from 47 to 51;
- a 180-second scripted runtime with an explicit pending-aftermath endpoint;
- concise group/payload HUD status and at most two LAV group follow cameras;
- regression preservation, actual browser inspection, and updated documentation.

Do not add new actors, combat, losses, weapons, audio, general vehicle AI, pathfinding, rigid-body simulation, broad terrain changes, or a new rendering framework. Do not implement indefinite aftermath in this round.

Never create, model, render, animate, or imply visible humans, occupants, crew, casualties, articulated bodies, or humanoid silhouettes. Hatches stay closed and glazing stays opaque/dark. Vehicles, machinery, and effects represent all activity.

Do not run build commands. Do not change dependency versions, add dependencies, or upgrade frameworks. Preserve unrelated user changes.

## 4. Preserve the existing roster and LCAC behavior

All ten actors remain operational and belong to `landings_attacker`.

| Carrier            | Group                   | Persistent LAV IDs                  | Unloading begins | Inland road              |
| ------------------ | ----------------------- | ----------------------------------- | ---------------- | ------------------------ |
| `attacker_lcac_01` | `attacker_lav_group_01` | `attacker_lav_01`–`attacker_lav_04` | T+160            | `road_beach_exit`        |
| `attacker_lcac_02` | `attacker_lav_group_02` | `attacker_lav_05`–`attacker_lav_08` | T+166            | `road_beach_access_east` |

The current slot order is front-left, front-right, rear-left, rear-right, at carrier-local [X,Z] = [-1.8,-4], [1.8,-4], [-1.8,4], [1.8,4]. Preserve each ID's slot, group, faction, model, and origin carrier.

Keep the completed LCAC routes, five event records, contact grades, settling, ramp motion, effects, and model dimensions exact through T+176. Extend their settled pose/open-ramp and absolute-time machinery behavior coherently through T+180.

Existing bow ramps begin lowering at T+155/T+162 and finish at T+158.8/T+165.2. Unloading must wait for actual ramp readiness. Do not retime the official unloading events or animate vehicles through a partly raised panel.

Distinguish an immutable manifest/origin carrier from current physical attachment. A LAV may still belong to its original four-vehicle group after it leaves the carrier. Counts must reflect actual deck/ramp/ground occupancy, not the fixed manifest length.

## 5. Event contract

Add exactly these source events, preserving every ID, timestamp, local time, code, group/path reference, and chronological order:

| T+  | Local time | ID                        | Source event code                                        |
| --- | ---------- | ------------------------- | -------------------------------------------------------- |
| 160 | 05:29:40   | `lav_group_01_disembark`  | `begin_disembarkation`                                   |
| 166 | 05:29:46   | `lav_group_02_disembark`  | `begin_disembarkation`                                   |
| 176 | 05:29:56   | `lav_inland_spread`       | `first_lav_vehicles_spread_into_two_inland_access_paths` |
| 180 | 05:30:00   | `scripted_phase_complete` | `enter_aftermath_observation`                            |

Use focused Stage 5C event types and existing adapter conventions. The first two records target their group and `path_lav_inland_west` / `path_lav_inland_east`; the spread event retains both groups and both paths. The endpoint belongs to the environment track and has no invented vehicle target.

The disembark events begin a staggered sequence. They do not mean that four vehicles instantly arrive on land. T+176 means the first vehicles begin spreading into both inland routes, while others may still be unloading.

All 51 official IDs/times must now be represented exactly once. Preserve the previously documented adapter wording differences rather than renaming unrelated events to make a new test pass.

## 6. Unloading choreography and timing

Use per-group departure offsets [0, 3, 6, 9] seconds as the initial authoring schedule, in the existing slot order. This yields west starts at 160/163/166/169 and east starts at 166/169/172/175.

Start each vehicle smoothly from rest. Use roughly 2 m/s deck/ramp travel, at most 2.5 m/s there, and restrained beach travel up to 5 m/s after the vehicle fully clears the ramp. Bound acceleration/braking and turning, measure them, and document the final values.

Small adjustments to non-official trailing-vehicle offsets are permitted if actual clearance requires them. Keep each group leader's departure at exactly 160/166, retain the visible stagger, and preserve the T+176 event.

Keep both cargo lanes through the ramp. The 8.2 m opening and existing two-column packing allow this; an immediate centerline merge is unnecessary. Maintain measured same-lane separation, side clearance, and full hull/wheel/barrel sweeps. If a later merge is useful, author it only after complete ramp clearance and verify it.

At T+176, at least the lead vehicle from each group must be completely clear of its ramp and visibly begin inland advance along its own road alignment. Earlier short beachhead travel may already align with that road. Make this an observable progression, not just a HUD label or an instantaneous yaw/position change.

The historical ramp-clear estimates were about eight seconds for front-row vehicles and twelve for rear-row vehicles after their own starts. Recompute them from the current -10.08 m hinge, actual wheel/hull geometry, contact solution, and chosen speed profile.

Report actual per-vehicle state and clearance times at 176 and 180. Vehicles may remain on deck or on a ramp at 180. Do not accelerate them to finish the approximately 875 m / 1,002 m inland roads within this short interval.

## 7. Direct beach-to-road routing and reference clarification

Use short unloading paths that join the existing roads directly:

- west: from the actual west ramp lanes toward `road_beach_exit`, beginning [4300,-2920] → [4250,-2700];
- east: from the actual east ramp lanes toward `road_beach_access_east`, beginning [5450,-2860] → [5550,-2680].

The craft already align with these initial road directions: approximately 12.804° west of north / 29.055° east of north. The road origin lies underneath each landed craft, so join at the forward ramp/road station; do not drive back through the craft to reach waypoint zero.

Both roads are 10 m wide. Derive short lane offsets and smooth joins from actual settled transforms and rendered road geometry. Keep initial fanning inside the existing landing reservations and road shoulders. Later road bends can remain future continuation data; this round only needs the distance actually reached by 180.

The existing `connector_waypoints_xz_m` run apron → beach:
west [4675,-2940] → [4475,-2930] → [4300,-2920];
east [5280,-2910] → [5360,-2890] → [5450,-2860].

These are not valid forward road-entry sequences. Reversing them leads toward the apron, not onto the named road.

This round includes a narrow reference clarification: within the two LAV path blocks, explicitly distinguish the optional apron/service connectors from the scripted direct ramp-to-road traversal. Retain the original connector coordinates and identify their direction/purpose; add the direct-join strategy, correct road association, and only the local path data needed to reproduce it. Keep both path IDs and all four event records unchanged.

Update the corresponding landing narrative and document this clarification. Do not describe it as a new human-approved map redesign. No map geometry, LCAC routes, landing grades, water polygons, global terrain, or unrelated source records need to change.

Update reference-preservation comparisons by normalizing only these two explicitly identified path-block changes and the affected landing narrative sections back to their captured baseline. Keep fixture bytes unchanged and add positive assertions for the new direct-join contract. Do not relax whole-file coverage or rewrite fixture hashes.

## 8. Continuous support and wheel contact

Use the actual completed Stage 5B surfaces:

- cargo deck top, which settles from local Y 1.75 to 1.20 m;
- the 6 × 8.2 × 0.12 m bow panel, hinged at local Z -10.08;
- the current carrier YXZ transform and settled ramp angle;
- `getLandingSupportHeight` and the uploaded graded mainland/road geometry.

`landingRampPoint` defaults to the underside. Tire support must use the top surface explicitly, with the same hinge transform and thickness as the rendered panel.

The existing ramp underside ends about 3 mm above terrain; its top has approximately the panel thickness above that contact. A center-height lookup alone can make wheels snap at this edge. Account for the finite 0.49 m wheel radius as tires roll over the actual hinge/toe geometry. Do not disguise the lip by changing the ramp dimensions, raising invisible terrain, or blending to an unrelated ground height.

When a vehicle spans deck/ramp or ramp/ground, solve body pitch/roll and bounded per-wheel visual suspension from all actual support contacts. Four axles cannot all fit a single plane across a surface kink. Keep this a small deterministic kinematic solution, not a physics engine.

Test every wheel, actual belly/hull clearance, ramp side edges, and the complete forward barrel envelope. A grounded center point is insufficient. Measure tolerances against generated geometry and verify them closely in the browser.

Keep world pose continuous at departure, first ramp contact, last deck contact, first ground contact, full ramp clearance, and road entry. Compose full rotations; copying yaw or adding Euler angles is not a correct carrier transform.

Use a single authoritative pose and render each LAV exactly once at every timestamp. The current renderer nests cargo under each LCAC; refactor attachment/render placement carefully so a vehicle is neither duplicated nor briefly hidden when it becomes ground-supported. Stable IDs and shared resource identities must survive seeks and transitions.

## 9. Vehicle state, wheel mechanics, and effects

Extend the existing payload state with focused deployment/activity, support/attachment, path distance, speed, wheel mechanics, and dust state. Keep condition/outcome separate; every vehicle remains operational.

Useful activity distinctions include embarked, deck transit, ramp transit, beach clearance, and inland advance. Define per-group embarked/transferring/ashore counts with mutually exclusive membership summing to four, and totals summing to eight. State exactly what marks a vehicle fully ashore.

Before an individual departure, preserve its completed carrier-relative pose and zero relative wheel travel/rotation/dust. Carrier motion must never turn cargo wheels.

After departure, derive signed travel along the supporting surfaces and apply wheel rotation about the actual axle. Use restrained front-axle steering where the authored path bends, with suspension defaults that reproduce the existing static model. Keep turrets and cannons stowed; do not add combat animation.

Dust begins only when wheels actually contact the beach/road and move. A mixed ramp/ground vehicle can emit at its grounded wheels; deck-only travel must not produce beach dust. Use actual wheel/contact origins, surface masks, fixed bounded slots, deterministic births/ages, and finite lifetimes.

Reconstruct motion and effects solely from absolute simulation time. Direct seek, backseek, restart, and all playback speeds must produce identical results at a given timestamp. No wall-clock phase, accumulated trails, unseeded randomness, event-handler-driven spawning, or mount-history state.

Reuse the shared LAV/LCAC geometry and materials. Keep persistent resource ownership/disposal explicit and avoid per-frame geometry/material creation or a global static-world timeline subscription.

## 10. Full scripted runtime and Stage 6 boundary

Introduce a clear 180-second active scripted-duration constant. Keep historical stage duration constants and any explicitly frozen legacy derivation APIs intact.

Update active clamping, store tick/seek/play behavior, quantization, labels, slider bounds, keyboard seeking, event selection, and endpoint tests together. T+176 is now an ordinary in-range timestamp, not the end of playback.

For this round, use the existing finite playback model: playback pauses at exactly 180 and direct seeks clamp there. Display a concise endpoint status such as "Script complete · aftermath pending Stage 6". Free spectator controls and backward seeking remain available.

Keep the authoritative `scripted_phase_complete` / `enter_aftermath_observation` event intact. Clearly document that continuing world motion after 180 is the remaining Stage 6 implementation; do not rewrite the source's eventual no-freeze requirement or label a paused scene as active aftermath.

Do not add a second runtime clock, loop events, remove all clamps, or silently implement indefinite continuation.

Extend the existing surviving actors/effects coherently through the new 176–180 interval. Preserve established damage, deaths, visibility, and source attribution; do not replay attacks or resurrect departed actors. Audit existing extrapolations before adding new ones.

Check endpoint tangent/look-ahead calculations explicitly. In particular, Wasp's existing patrol reaches its final point at 180: sampling the same point twice must not reset its heading. Preserve all prior poses through 176 and use a valid terminal tangent. Check aircraft/Molniya continuation, support withdrawal, fires, smoke, water, fans, and open ramps through the final four seconds.

## 11. Regression preservation and allowed differences

Before editing, capture a baseline from the completed Stage 5B implementation at dense relevant timestamps through 176, including the full landing state, all 47 event records, existing actors/weapons, geometry/contact samples, and environmental layouts. Existing historical fixtures remain byte-identical.

Preserve exactly:

- every pre-existing non-LAV actor/weapon value through T+176, including secondary Pantsir and the support convoy;
- the two LCAC state histories, five LCAC events, model/ramp/contact behavior, and approved approach references;
- each LAV's existing roster, model identity, static dimensions, and pre-departure pose/mechanics;
- Stage 5B terrain/road geometry, grade bounds, original exterior terrain, broad coastal samples, cover, equipment, wear, and the established 37-record foam layout.

Allowed differences are the four additive events, new deployment/group state, LAV motion/mechanics/effects from each departure onward, derived occupancy counts, active endpoint/UI changes, the specified path/narrative clarification, and coherent behavior in the newly admitted 176–180 interval.

Do not exclude the entire `landing` object from the new Stage 5B preservation comparison. Compare LCACs throughout; compare payloads before their own departure and their immutable fields afterward. New fields can be projected out explicitly, but old craft behavior must remain protected.

Older projections may omit new events/state for historical checks, composing narrowly with the current Stage 5B projection. Retain all old event records and fixture bytes. Do not forge old LAV poses into a projection to make a whole-world hash pass.

Replace obsolete "all eight embarked through 176", 47-event, and 176-endpoint assertions with precise tests of the new behavior and retained pre-departure guarantees. Keep all unrelated assertions and original timeout limits.

Reference changes need the targeted source-normalization assertions in section 7. No new scenery/terrain exception is planned: existing landing and road reservations should accommodate the short travel. Adjust authored paths inside those clearances before considering environmental changes.

## 12. Camera and HUD

Preserve all 22 current presets, their IDs, and paused orbit/pan/zoom. Keep both LCAC cameras useful as their decks empty.

Add at most two group follow presets, such as west/east LAV deployment. Before unloading, target the corresponding embarked group. During unloading, use stable lead/progress framing so the camera does not jump when membership changes or a moving centroid separates from cargo.

Show concise per-group deployment phase and embarked/transferring/ashore counts, plus the operational total. Counts must come from state. Replace the Stage 5B "all embarked" and 47-event/T+176 messaging, and label the delivery Stage 5C.

Use the installed Tailwind utilities for touched ordinary DOM layout, spacing, typography, colors, focus, and responsive sizing. Keep the established visual style and existing specialized CSS. No broad HUD rewrite or debug dashboard.

## 13. Validation and browser evidence

Automated coverage must include:

- stable two-craft/eight-LAV identity and group membership with no duplicate rendered vehicles;
- exact four new event records and all 51 unique IDs/times in source order;
- dense contact-boundary pose, wheel, belly, barrel, ramp-side, and same-lane clearance measurements;
- per-vehicle stagger, ramp-ready gates, bounded motion/turning, wheel travel, and surface-correct dust;
- leading vehicles clear and beginning inland advance in both groups at 176, plus truthful individual states at 180;
- direct-road route/reference consistency and unchanged optional apron connector coordinates;
- exact pre-departure/LCAC/older-world preservation and unchanged environment;
- time input edge cases, exact 176/180 boundaries, playback overshoot at every speed, pause, restart, and backward/repeated seek;
- finite continuous actor/effect/camera states across the new final interval and valid endpoint headings;
- bounded resource use and meaningful assertions against data actually used by rendering.

Run the permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

Do not run `pnpm build`, `tsc -b`, combined `pnpm check`, or repository-wide formatting. Stage 5B had load-related test timeouts; avoid competing heavy validation runs, retain assertions/timeouts, and report any actual failure accurately.

Capture representative before views before changing the implementation. Afterward inspect:

- holding/approach and ramp readiness, proving the completed LCAC behavior remains intact;
- 159.9/160/160.1, 165.9/166/166.1, and every individual departure;
- the measured first/last wheel contacts at both hinges and ramp tips, with close low-angle views;
- 175.9/176/176.1 and 179.9/180, including both groups and every remaining deck/ramp vehicle;
- backward seeks from 180 to before unloading, repeated direct seeks, restart, and all speeds;
- paused wheel/dust/water/fan behavior, all camera presets, keyboard controls, and 1280×720 / 1280×540 HUDs.

Watch the complete unloading interval at 1× for each group; boundary screenshots alone do not prove continuous support. Also run one uninterrupted T+0–180 playback and replay representative older fuel, bridge, T-72, aircraft, naval, and Pantsir sequences.

Save local close-up/comparison captures and actual measurements. Compare matched-view renderer calls/triangles/resources, including a busy late-disaster view, and repeat seek/restart/camera cycles after warm-up. Verify stable shared resources and exactly eight LAV instances across attachment changes. Do not infer GPU improvements from display-capped RAF cadence.

Use applicable browser/React skill workflows when available. Report only validation actually performed; do not copy Stage 5B results as fresh evidence.

## 14. Documentation and handoff

After implementation and successful verification:

- mark Stage 5C COMPLETE and parent Stage 5 COMPLETE for scripted operation through T+180;
- leave Stage 6 PLANNED and explicitly retain indefinite aftermath as outstanding;
- update `ITERATION_PLAN.md`, `STAGE5_INTEGRATION_READINESS.md`, and `changelog.md` with actual deployment measurements, event coverage, source clarifications, endpoint behavior, and evidence;
- preserve completed Stage 4/5A/5B history, and remove stale present-tense claims that Pantsir 02, LCAC integration, or embarked LAV models are still missing.

The final handoff should report the eight IDs' departure/clearance/road-entry timings and states at 176/180; measured support and vehicle clearances; reference edits; preserved behavior; the 51-event/180-second endpoint; camera/HUD changes; fresh automated/browser results and artifact paths; resource measurements; and remaining Stage 6 work.

Do not claim that all LAVs complete unloading or traverse the full inland roads by 180 unless measured motion actually demonstrates it. Do not claim active indefinite aftermath, general physics, new combat, or visible personnel.

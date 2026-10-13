# Stage 5B — LCAC Approach, Beaching, and Embarked Payload

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer observes an authored scenario through spectator cameras, playback, pause, restart, speed controls, and direct seeking.

This is an implementation task. Inspect the repository, implement the complete bounded landing-craft slice below, run all permitted checks, inspect the actual application in a browser, fix issues found during inspection, and deliver a coherent, reviewable result. Do not stop after planning.

## 1. Verified starting point

Stage 5A is complete in commit `4c89a93`. The documented baseline is 365 tests across 27 files, 42 scoped events, 20 camera presets, and a T+176 endpoint.

The secondary Pantsir's T+112 relocation, T+119/T+119.6 defensive misses, and T+121 terminal strike are complete. All earlier ground, aircraft, naval, destruction, and Stage 4C environmental behavior remains regression-critical.

Stage 5B must implement exactly two LCACs carrying exactly eight recognizable, persistently identified LAV-25s. Show holding, departure, distinct coastal approaches, continuous shore contact, beaching, settling, and bow-ramp lowering. Payload remains embarked throughout this stage.

Stage 5C owns unloading, independent LAV movement, T+176 inland spread, and full T+180 integration. Stage 6 owns indefinite aftermath.

## 2. Human-approved landing decision

On 2026-10-09, the human user explicitly approved:

**Use nearer offshore staging, revise the final approaches and local shore grades, and preserve the key event times.**

This approval resolves the pending design choice recorded by Stage 5A in `STAGE5_INTEGRATION_READINESS.md`. Do not ask again for approval of this same choice.

The existing 8.6/9.7 km approaches require aircraft-like speeds and the current shore has a roughly 4.6–4.8 m vertical edge. Implement the approved correction transparently.

Authorization is limited to:

- the two LCAC initial staging descriptions, region/feature references, and approach paths;
- clarification of their T+140/T+148 events as final nearshore-approach thresholds;
- two local beach-contact grades and their consistent rendered/grounded surfaces;
- associated landing reservations, local visual masks, and matching map/scenario documentation.

Preserve all event IDs and times, original beaching-center XZ coordinates, vehicle dimensions, existing actors/paths, broad water-region polygons, mean sea level, and unrelated map/scenario content.

Technical refinements within this approved package are ordinary implementation choices. Record their exact coordinates, geometry, bounds, and measured motion. Do not use this approval to redesign the whole map, retime combat, or rewrite completed stages.

## 3. Read before editing

Read completely:

- `AGENTS.md`, `ITERATION_PLAN.md`, `changelog.md`;
- `STAGE5_INTEGRATION_READINESS.md`, including its approved-decision update;
- `assets/map/map-spec.yaml`, `assets/map/map-layout.svg`;
- `assets/scenario/scenario-spec.yaml`, `assets/scenario/scenario-timeline.md`;
- `assets/vehicle/Belligerents.yaml`;
- `assets/vehicle/LCAC/lcac.yaml` and `LCAC.jpeg`;
- `assets/vehicle/LAV-25/lav-25.yaml` and both reference images;
- current ground-motion helpers, terrain grid/mesh sampling, coast skirt, roads, and beach surfaces;
- Stage 4C water, regional layouts, masks, resource ownership, and spatial reservations;
- Stage 5A state, model, effects, camera, and preservation tests;
- current timeline, time/store APIs, HUD, and package scripts.

Relevant entry points include:

- `src/simulation/groundMotion.ts`, `derive.ts`, `types.ts`, `timeline.ts`, and `constants.ts`;
- `src/simulation/stage5aPreservation.test.ts`;
- `src/simulation/fixtures/stage5aPreservationProjection.ts` and existing fixtures;
- `src/scene/world/stage2/terrainModel.ts`, `terrainGeometry.ts`, and `stage2Data.ts`;
- `src/scene/world/stage2/BeachheadEnvironment.tsx`;
- `src/scene/world/stage4c/spatialReservations.ts`, `coastalWater.ts`, and associated render/test modules;
- `src/scene/BattlefieldScene.tsx`;
- `src/scene/camera/CameraRig.tsx`;
- `src/ui/SimulationHud.tsx` and `src/App.test.tsx`.

Repository constraints and the hard human-visibility policy take precedence. The approved landing corrections are explicit, narrow exceptions to the prior reference-preservation rule.

## 4. Scope and hard boundaries

Implement:

- exactly two LCAC actors with focused deterministic types/state;
- one shared procedural LCAC model with fan, skirt, and ramp mechanics;
- exactly eight shared-model LAV-25 payload actors with stable IDs and carrier-local transforms;
- approved nearer staging and revised approaches;
- continuous water-to-land contact using two local graded landing footprints;
- bounded wake, spray, cushion disturbance, sand/dust, and ramp effects;
- five authoritative departure/nearshore/beaching events;
- at most two LCAC follow presets;
- concise HUD status and Stage 5B labeling;
- tests, immutable actor preservation, browser inspection, performance/resource checks, and updated references/documentation.

Keep duration exactly 176 seconds. Event coverage becomes 47: the existing 42 plus five LCAC events.

Do not implement:

- LAV unloading, autonomous movement, beach/road travel, or turret combat;
- `lav_group_01_disembark`, `lav_group_02_disembark`, `lav_inland_spread`, or `scripted_phase_complete`;
- the T+180 endpoint or aftermath runtime;
- new combat, losses, aircraft, ships, ground reinforcements, or audio;
- general buoyancy, fluid, rigid-body, traffic, pathfinding, or collision-avoidance systems;
- broad terrain, atmosphere, environment, or HUD rewrites.

Be truthful that payload stays embarked even after the future T+160/T+166 unloading timestamps. Do not expose those excluded events or claim the full operation is complete.

### No visible humans

Never create, model, render, animate, or imply personnel, crew, occupants, casualties, articulated bodies, or humanoid silhouettes. LCAC cabins use opaque/dark glazing; LAV hatches remain closed. Open cargo decks contain vehicles and machinery only.

## 5. Exact actor and payload roster

LCACs, faction `landings_attacker`:

- `attacker_lcac_01`, carrying `attacker_lav_group_01`;
- `attacker_lcac_02`, carrying `attacker_lav_group_02`.

Assign these persistent payload IDs now and reuse them in Stage 5C:

- group 01 / LCAC 01: `attacker_lav_01` through `attacker_lav_04`;
- group 02 / LCAC 02: `attacker_lav_05` through `attacker_lav_08`.

Every craft and payload vehicle remains operational. No landing losses are authored.

Payload activity is `embarked`, with a carrier ID, local pose, world pose, and zero travel relative to the deck. Do not count carrier world movement as LAV wheel travel or dust emission. Each LAV must exist exactly once before, during, and after beaching.

## 6. Revised staging and route contract

Use region `region_e_remote_beachhead` for the new nearshore staging references. Remove the inaccurate claim that these LCACs are holding near Wasp or relative to its current pose. Wasp remains unchanged in its established offshore theater.

Add distinct map features for the two holding points and final-nearshore gates, with consistent scenario references and SVG representation where required by map conventions.

The following seed routes are concrete starting designs in world XZ meters:

### West / LCAC 01

- holding point: [4250, -3720];
- route knots: [[4250, -3720], [4260, -3530], [4290, -3330], [4300, -3160], [4320, -3050], [4310, -2970], [4300, -2920]];
- final-nearshore gate: [4300, -3160] at T+140;
- unchanged beaching center: [4300, -2920] at T+155.

The raw candidate is approximately 806.210 m: 562.794 m before the nearshore gate and 243.416 m afterward. Phase means are about 18.760 and 16.228 m/s.

### East / LCAC 02

- holding point: [5380, -3740];
- route knots: [[5380, -3740], [5370, -3540], [5360, -3300], [5390, -3120], [5400, -2990], [5421, -2912], [5450, -2860]];
- final-nearshore gate: [5400, -2990] at T+148;
- unchanged beaching center: [5450, -2860] at T+162.

The raw candidate is approximately 893.642 m: 753.325 m before the nearshore gate and 140.317 m afterward. Phase means are about 19.824 and 10.023 m/s.

These are seed polylines, not permission to use corner-snapping motion. Smooth the route and solve event-constrained distance/velocity profiles against its actual measured length.

You may make small local knot/gate refinements for curvature, full-craft clearance, and contact geometry. Keep them in the same nearshore corridors, retain the beaching centers and event times, update the references to match, and report the final values. No return to multi-kilometer transit or coordinate scaling.

Use a bounded presentation envelope: speed at most 30 m/s, acceleration/braking magnitude at most 4.5 m/s², continuous velocity, modest turn rates, and clearly slower final contact/settling. These are authored visualization limits, not a claim of a full naval dynamics model.

Before T+110, both craft hold at their new starting positions with restrained machinery activity. No hidden pre-event travel. At T+110, both begin departure; their routes, phases, and arrival times differ.

### Terminal headings

Align the final craft heading with the initial inland-road direction:

- west: toward [4250, -2700] from [4300, -2920], approximately 12.804 degrees west of north;
- east: toward [5550, -2680] from [5450, -2860], approximately 29.055 degrees east of north.

Use the project's negative-Z forward convention and established heading transform. Provide a continuous terminal tangent/heading; do not rotate the craft in place instantly when it stops or lowers its ramp.

## 7. Nearshore semantics and reference synchronization

Add exactly:

| Time  | Event ID                | Meaning                                               |
| ----- | ----------------------- | ----------------------------------------------------- |
| T+110 | `lcac_departure`        | Both craft leave nearer offshore holding points       |
| T+140 | `lcac_01_shallow_water` | West craft reaches its final-nearshore gate           |
| T+148 | `lcac_02_shallow_water` | East craft reaches its final-nearshore gate           |
| T+155 | `lcac_01_beach`         | West craft stops/beaches and begins lowering its ramp |
| T+162 | `lcac_02_beach`         | East craft stops/beaches and begins lowering its ramp |

The nearshore route starts in or near the broad coastal-water regions. T+140/T+148 no longer mean first geometric entry into `surface_beach_shallows`.

Keep those event IDs/timestamps but explicitly update their authoritative event code to `enter_final_nearshore_approach`, and update the narrative/adapter descriptions accordingly. Record the semantic revision in the readiness report and changelog. Derive actual water-region classification independently of event phase; do not pretend earlier shallow/intertidal crossings occur at the new gates.

Synchronize only affected sections of scenario YAML, scenario narrative, map YAML/SVG, and runtime route/reservation data. Preserve all unrelated authoritative content, event ordering, faction mappings, vehicle dimensions, and the four excluded Stage 5C events.

Use domain-specific Stage 5B event types, including a focused `pathIds` adapter for the departure event. Do not overload older combat event types or rename existing event fields wholesale.

## 8. Local shore grading and continuous contact

Resolve the approved 4.6–4.8 m water/land edge physically in the rendered surface. Do not hide it with spray, float the craft through the coast wall, or lerp to an unrelated land height.

Create two narrowly bounded graded contact footprints around the west/east shoreline crossings and their final approach sweeps. Preserve mainland XZ coastline, mean sea level -0.12 m, beaching-center XZ, and terrain/road heights outside those footprints.

Use explicit map features/profile data for the grade footprints, feathering, and elevation transition. Sample the actual coastline and final smoothed path before fixing bounds.

Requirements:

- a continuous rise from the water contact edge into the existing beach;
- enough width for rotated skirt/craft corners with a tested safety margin;
- no vertical lip, hidden duplicate terrain, missing triangles, or intersecting coast skirt;
- the visible mesh, contact/height sampler, road/apron surfaces, wet-sand treatment, and future LAV grounding agree;
- retained exact terrain values outside the declared footprint;
- no movement of existing actors, infrastructure, dunes, or global terrain bands.

The existing terrain grid is roughly 75 m and already has immutable grounding regressions. Do not globally insert grid axes or retessellate unrelated terrain: that can change far-away interpolation. Use local refinement/patching with explicit support bounds, and test outside-footprint equality.

Update the coast skirt only where it intersects a grade footprint. Preserve the rest of the shore and engineered harbor edges.

Derive craft vertical pose and bounded pitch/roll from shared graded support samples. Keep a readable cushion gap during transit, then continuous skirt compression/settling. Do not jump from sea height to terrain height at one event.

Tests must sample actual rotated lower-skirt/hull geometry against rendered contact surfaces across first-corner contact, the full crossing, and the final stop. Avoid a fit that grounds the center while the bow penetrates terrain.

Review local foam/wet-sand/wear and decoration masks against the approved swept footprints. Retain stable IDs/layout values outside them; do not reroll whole regions or remove scenery globally.

## 9. LCAC model and machinery

Build one reusable procedural model based on the authoritative references:

- overall on-cushion envelope: 26.4 × 14.3 × 7.2 m;
- central cargo deck: 20.4 × 8.2 m;
- broad rectangular platform, substantial dark perimeter skirt;
- unobstructed center deck and wide bow ramp;
- narrower stern ramp, kept closed in this stage;
- low side machinery, forward starboard control cabin with sealed glazing;
- two large, separate ducted stern propulsion fans;
- restrained support frames, rudders, and lights.

Do not model a narrow boat hull or fill the deck with permanent superstructure.

Fan blades/ducts, propulsive posture, lights, skirt compression, and any small vibration derive from absolute simulation time. Machinery may turn while the craft holds; it freezes when simulation pauses.

Use shared geometry/materials and correct resource ownership. Test actual model bounds in transit and settled configurations, excluding effects and the legitimately extended lowered ramp when comparing the closed overall-length reference.

## 10. Embarked LAV model and packing

Use one shared LAV-25 model for all eight payloads:

- hull scale anchor: 6.39 × 2.50 × 2.69 m;
- low long hull, sharply sloped front, four wheels per side;
- compact central turret and thin centered forward cannon;
- closed hatches and opaque optics.

Do not reskin BTR geometry without correcting the recognizable hull, turret, axle spacing, and dimensions.

Start with two-by-two cargo centers at LCAC-local X = ±1.8 m, Z = ±4.0 m, all facing local negative Z. Solve local Y from actual wheel/deck contact.

The report's provisional 3.0 m wheel envelope and 0.8 m forward barrel allowance are design budgets, not reference dimensions. Verify actual wheels, barrel, turret, machinery, fan, ramp-swing, and inter-vehicle clearance at every relevant craft/mechanical pose.

World payload pose must use the carrier transform multiplied by the cargo-local transform, including pitch/roll. Keep those transforms stable through approach and settling. Payload wheels remain stationary relative to the deck.

Expose focused carrier/deck geometry and attachment data for Stage 5C reuse. Do not implement its transfer to ramp/ground yet.

## 11. Bow ramp

Use a measurable hinged panel and solve its contact angle against the settled pose and actual graded terrain.

A useful starting design is a 6 m panel with an 8.2 m clear opening, hinge at local Z = -10.2 m, and settled deck about 1.2 m above support ground. Refine this against the generated model and skirt profile.

Keep the closed ramp within the referenced on-cushion envelope. The lowered panel may extend beyond the bow; report its deployed bounds separately.

Begin west/east lowering at T+155/T+162. Make the west ramp fully ready before T+160 and the east before T+166, using continuous absolute-time hinge motion. The event initiates a transition rather than forcing an instantaneous angle change.

Test the full ramp swing against payload and side machinery, the tip's terrain contact, usable lane width, and its slope/height. No penetration or floating tip. All vehicles stay aboard after the ramp opens in this stage.

## 12. Motion effects, architecture, and absolute time

Separate activity, condition, outcome, pose/motion, fan/skirt/ramp mechanics, cargo attachment, and visual-effect state.

Keep new derivation in focused modules such as landing-craft types, authored paths, and pure motion/contact samplers. Do not place the whole sequence in `derive.ts` or create a general physics/vehicle framework.

Derive all authoritative values and effects from absolute simulation time:

- continuous pose, heading, speed, acceleration, path distance;
- region/phase, shore contact, compression, ramp hinge;
- fan rotation and restrained vibration;
- carrier-local/world payload poses;
- wake/spray/dust births, ages, positions, and opacity;
- camera/HUD state.

Wake presentation must suit hovercraft: a broad cushion disturbance and trailing churn/spray, not an enormous narrow ship wake. Offshore/coastal water effects diminish/change during shore contact; sand/dust begins where the cushion reaches land. Use region/contact masks and fixed bounded particle lifetimes.

No accumulated particle trails, wall-clock animation, frame-dependent phase, uncontrolled randomness, duplicate craft, or mount-dependent state. Seeking before departure removes future trails; seeking to any later timestamp reconstructs bounded effects exactly.

Preserve Stage 4C sea normals/roughness sampler, mean level, naval wakes, pollution, surface fire, smoke layering, and pause behavior. Do not subscribe the entire static world to every timeline tick.

## 13. Regression and local-change contract

Capture a pre-edit Stage 5A baseline, including secondary-Pantsir state, all 42 old event records, every old actor/weapon field, and the environment layouts/contact heights needed for local comparisons.

Keep existing fixture files byte-identical. Adjust old-world projections only to omit added landing/payload state and five new events. The secondary Pantsir and support convoy must remain in the preserved projection.

All old actor/weapon numerical values through T+176 must remain exact. Broad coastal sampler values remain exact.

The approved local grading/mask changes may intentionally alter environmental geometry/placements within their declared footprints. Handle this explicitly:

- retain the original fixture bytes and historical baseline;
- identify each affected stable instance/overlay/shore record and measured height change;
- add before/after comparisons proving exact equality outside the fixed approved footprint;
- replace a whole-layout hash assertion only with a stronger scoped comparison plus explicit allowed local-difference assertions;
- do not suppress all environment preservation tests, whitelist whole regions, or regenerate old fixtures.

Retain old raw-route reservations if needed to preserve existing seeded layouts, then add approved-route reservations without re-randomizing unrelated placements. Verify actual local overlaps rather than assuming the former four-meter path margin protects smoothed craft.

Update only stage-label, additive shape/event-count, approved reference, and narrowly identified local-contact test expectations. Duration remains 176.

## 14. Camera, HUD, and browser verification

Add at most two stable craft-follow presets, one per LCAC. Frame holding, approach, first contact, beach stop, ramp lowering, and deck cargo without abrupt cuts or clipping.

Preserve all existing 20 presets and free paused orbit/pan/zoom. Use concise craft phase and embarked-count readouts; show Stage 5B and the five added events.

Use installed Tailwind utilities for touched ordinary DOM layout/spacing/type/colors/focus/responsive sizing. Keep specialized CSS where appropriate; no broad HUD migration or debug panels.

Before editing, capture representative beach/shore and preserved combat views. After implementation:

- inspect T+0/T+109.9 holding, real scale, packing, dark glazing, and no future effects;
- inspect T+110 departure and continuous acceleration;
- inspect actual broad-shallow/intertidal crossings separately from T+140/T+148 final-nearshore gates;
- inspect first rotated-corner contact and the full graded crossing closely;
- inspect T+155 west stop/ramp, T+159.9 west readiness, T+162 east stop/ramp, T+165.9 east readiness;
- inspect T+172/T+174/T+176: both landed craft, open ramps, exactly eight still-embarked payloads, preserved older outcomes;
- seek backward/forward across departure/contact/ramp, restart, and test all speeds;
- pause and confirm machinery, water, effects, and cargo freeze while camera controls work;
- inspect all presets, 1280×720 and a short-height viewport, accessible timeline/keyboard controls, and console.

Watch both approaches continuously at 1x through contact/ramp readiness. Boundary screenshots alone do not prove contact continuity or packing clearance.

Replay representative fuel, bridge, T-72, aircraft, naval, and Stage 5A Pantsir sequences. Save close inspection and comparison artifacts locally.

Measure matched-view renderer calls/triangles/resources before and after, plus a busy late-disaster view. Verify warmed stability across repeated seek/restart/camera cycles. Report actual measurements and limitations, not unverified performance claims.

## 15. Automated checks and repository rules

Add meaningful tests for:

- exact two-craft/eight-payload roster, faction, group/carrier IDs, dimensions, packing;
- five event IDs/times, 47 total, 176-second scope, absent Stage 5C events;
- all phase boundaries and dense smoothed path speed/acceleration/heading sampling;
- actual water-region classification and exact final-nearshore gates;
- full rotated hull/skirt/cargo/fan/ramp clearance and simultaneous craft separation;
- shared rendered/contact grade geometry, continuous shore pose, and exact exterior terrain preservation;
- ramp swing/tip contact/readiness and payload wheel/deck support;
- unchanged cargo-relative wheel phase during carrier motion;
- bounded deterministic wake/spray/dust and absence of future effects;
- pause, restart, repeated seek, all speeds, and additive/local regression rules.

Test data actually used by rendering. For shader effects, test shared inputs/bounds and inspect real visual output.

Run permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

The reduced test parallelism follows Stage 5A's verified setup; do not weaken assertions or increase timeouts to hide failures.

Do not run build commands, `pnpm build`, `tsc -b`, combined `pnpm check`, or repository-wide formatting commands. Do not change dependency versions, add dependencies, or upgrade frameworks. Preserve unrelated user changes.

Use applicable browser and React skill workflows when available. Report only checks actually performed.

## 16. Documentation and final handoff

After successful implementation and validation:

- mark Stage 5B COMPLETE, parent Stage 5 IN PROGRESS, and Stage 5C/Stage 6 PLANNED;
- preserve all completed Stage 4/5A records;
- update `STAGE5_INTEGRATION_READINESS.md` with actual approved-route/contact/model/ramp measurements and remaining Stage 5C work;
- append a Stage 5B changelog entry, including the approved reference changes and precise local preservation exceptions;
- retain source/runtime/map/narrative consistency and document the four outstanding events.

Report:

1. exact craft/payload IDs, model dimensions, packing, and operational outcomes;
2. the recorded human decision and exact reference changes made;
3. final route/gate coordinates, lengths, speed/acceleration/turn envelopes, terminal headings;
4. local grade bounds, shared contact geometry, measured skirt/ramp clearance, and readiness times;
5. absolute-time machinery/effects/carrier transforms;
6. preserved actor/weapon/coastal values and precisely scoped environmental differences;
7. camera/HUD changes, automated/browser results, artifact paths, and resource measurements;
8. the remaining Stage 5C unloading/inland/full-timeline and Stage 6 aftermath work.

Do not claim LAV disembarkation, all 51 events, T+180 completion, indefinite aftermath, physical ocean/hovercraft simulation, or visible personnel.

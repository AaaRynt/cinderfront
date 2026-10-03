# Stage 4B.2C — Support and Rescue Convoy

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. It is not a conventional player-controlled game. The viewer observes an authored military scenario through spectator cameras, timeline playback, pause, restart, playback-speed controls, and direct seeking.

This is an implementation task. Do not stop after planning. Inspect the current repository, implement the complete scoped vertical slice below, run every validation permitted by repository rules, perform browser inspection, fix issues discovered during inspection, and leave the repository in a coherent working state.

## 1. Stage goal

Stages 4B, 4B.2A, and 4B.2B are complete. They established deterministic wheeled and tracked ground-vehicle lifecycles, reverse movement, an authored F-35B ground-support strike, and a two-aircraft Su-30MKK defender reaction.

Stage 4B.2C must now add a small defender support-and-rescue system and prove a complete failed-response lifecycle:

1. exactly six support vehicles begin in motion from the industrial service-yard area;
2. at T+75, the convoy redirects toward the industrial emergency;
3. at T+108, smoke, dust, and reduced visibility cause a staggered chokepoint hesitation;
4. at T+125, an unattributed secondary explosion damages and blocks the dry-wash bridge approach;
5. the lead response vehicle is forced to stop while the convoy assesses the failed route;
6. at T+174, the convoy abandons the approach and begins a partial withdrawal;
7. the response remains visibly incomplete: one fire engine may hold near the obstruction, engineering and recovery assets may reposition locally, and rear vehicles begin turning or reversing;
8. all convoy state, motion, effects, damage, lights, and outcomes reconstruct deterministically after pause, restart, direct seeking, and playback-speed changes.

The dramatic point is not destruction. A real support system exists, mobilizes, encounters worsening conditions, and fails to reach the main fire because its route becomes unusable.

## 2. Read before implementation

Read these files completely before changing source code:

1. `AGENTS.md`
2. `ITERATION_PLAN.md`
3. `changelog.md`
4. `assets/map/map-spec.yaml`
5. `assets/map/map-layout.svg`
6. `assets/scenario/scenario-spec.yaml`
7. `assets/scenario/scenario-timeline.md`
8. the support-vehicle and generic-vehicle reference files, if present
9. the current BTR-80 and T-72B types, routes, motion derivation, rendering, tests, effects, UI, and camera code
10. the current F-35B and Su-30MKK implementation and regression tests
11. the current unified timeline and event-type implementation
12. `src/index.css` and the current Tailwind/Vite configuration

The authoritative map, scenario, and vehicle files are design references. Do not rewrite those reference assets during this task.

If implementation details conflict, use this order of authority:

1. `AGENTS.md` and the hard human-visibility constraint;
2. this Stage 4B.2C prompt and its explicit scope;
3. authoritative scenario, map, and vehicle references;
4. completed-stage behavior documented in `changelog.md`;
5. existing implementation details.

## 3. Hard product constraints

Do not introduce:

- player-controlled units;
- scoring;
- mission success or failure gameplay loops;
- multiplayer;
- generalized autonomous AI agents;
- autonomous route planning;
- generalized collision avoidance;
- nondeterministic outcomes;
- visible humans;
- drivers;
- firefighters;
- engineers;
- rescue personnel;
- ground crews;
- casualties;
- humanoid silhouettes;
- visible vehicle occupants;
- people represented behind windshields or inside open compartments.

All convoy activity must be communicated through vehicles, spacing, braking, steering, reversing, emergency beacons, headlights, brake lights, dust, smoke, doors or equipment that do not expose people, route obstruction, bridge damage, and infrastructure.

Every cab window and windshield must remain dark, opaque, or strongly reflective. Do not model seats, faces, helmets, bodies, or occupant silhouettes.

## 4. Explicit stage boundary

Implement only:

- the minimum support-vehicle state architecture required for this convoy;
- exactly six support vehicles in one authored group;
- the existing `path_support_convoy_industrial` route, with only the focused implementation detail needed to connect it cleanly to rendered roads;
- the T+75 redirect;
- the T+108 visibility/chokepoint hesitation;
- the T+125 dry-wash bridge secondary explosion and persistent obstruction;
- the T+174 abandoned approach and partial withdrawal;
- simple procedural support-vehicle models;
- the minimum effects, bridge-damage presentation, camera, UI, timeline, and tests required to read the sequence;
- a bounded simulation-duration extension from 172 seconds to 176 seconds so the T+174 response is visible.

Do not implement:

- a second Pantsir-S1 relocation, engagement, or destruction sequence;
- LCAC movement, beaching, or ramps;
- LAV-25 deployment;
- the T+176 amphibious event;
- the complete amphibious operation;
- personnel, hoses operated by people, rescue teams, or dismounted crews;
- generalized traffic AI;
- generalized route finding;
- generalized convoy AI;
- generalized vehicle damage simulation;
- firefighting-fluid simulation;
- a dynamic bridge-destruction system;
- new aircraft;
- additional weapon events;
- environmental-realism expansion;
- vegetation, coastal-wave, weathering, or broad clutter passes;
- audio;
- a broad Tailwind migration of the whole application.

Do not add placeholder implementations for excluded actors.

The simulation may end at T+176, but the event scheduled at T+176 for a later stage must not be implemented, displayed, or claimed. Treat this stage's endpoint as the final visible moment of the convoy response, not as completion of the authoritative T+180 scenario.

## 5. Preserve all completed behavior

Before changing ground-vehicle architecture, understand the existing completed behavior and tests in the relevant files, including:

- `src/simulation/derive.ts`;
- `src/simulation/groundVehicles.ts`;
- `src/simulation/groundVehicleRoutes.ts`;
- current ground-vehicle motion and timeline tests;
- current aircraft motion and weapon tests;
- `src/simulation/types.ts`;
- `src/scene/BattlefieldScene.tsx`;
- current ground-vehicle and aircraft model components;
- `src/scene/camera/CameraRig.tsx`;
- `src/ui/SimulationHud.tsx`.

Preserve:

- all Stage 4B BTR-80 states, paths, damage outcomes, spacing, cameras, and timing;
- all Stage 4B.2A T-72B states, paths, reverse semantics, strike effects, cameras, and timing;
- all completed F-35B launch, flight, weapon, impact, and support-pass behavior;
- both Stage 4B.2B Su-30MKK paths, roles, damage state, covering withdrawal, and T+170 egress behavior;
- Molniya open-water behavior at T+172;
- all harbor, industrial, naval, radar, beach, and infrastructure behavior;
- deterministic results at every previously tested timestamp, especially T+172.

Do not move existing T-72Bs merely to make the support convoy easier to stage. Author the convoy around the completed reserve-tank placement and motion.

Do not teleport BTR-80s into a close escort formation. Preserve their completed routes. The support convoy can exist within the broader defender security context without forcing unrelated vehicles into physical proximity.

Refactor only where the support convoy genuinely requires it.

## 6. Exact convoy roster

Create exactly one support group:

- group ID: `defender_support_convoy_01`;
- faction: defender / `island_defender`;
- group role: `generic_support_convoy` or an equivalently precise existing type;
- initial broad state: moving;
- initial area: the industrial service-yard / rescue-corridor area.

Create exactly these six stable vehicle IDs:

1. `defender_support_fire_01`
2. `defender_support_engineering_01`
3. `defender_support_recovery_01`
4. `defender_support_fire_02`
5. `defender_support_logistics_01`
6. `defender_support_logistics_02`

Use the order above as the default authored convoy order unless existing map geometry proves that a small order adjustment is required for safe staging. If the order changes, keep all six IDs and document the reason in code and tests.

Composition must remain exactly:

- two fire engines;
- one engineering truck;
- one recovery vehicle;
- two logistics trucks.

Do not create additional escort, ambulance, command, civilian, or personnel-carrier vehicles.

## 7. Support-vehicle architecture requirements

### 7.1 Do not force support trucks into BTR-80 or T-72B state

The current ground-vehicle domain contains combat-specific fields for BTR-80 and T-72B behavior. Do not assign meaningless turret, weapon, track, armor, or combat-role values to support vehicles merely to fit an existing interface.

Prefer a small discriminated design with:

- genuinely shared ground-motion and transform data;
- BTR-80-specific state;
- T-72B-specific state;
- support-vehicle state with subtype, activity, condition, outcome, lighting, and convoy-role data.

Exact type names may differ, but the result must remain type-safe, narrow, and readable.

Do not build an entity-component system, universal vehicle framework, behavior tree, traffic simulator, or route-planning engine.

### 7.2 Keep lifecycle dimensions separate

The support-vehicle implementation must distinguish at least:

#### Activity phase

- routine transit;
- emergency response;
- smoke or visibility hesitation;
- cautious advance;
- obstruction stop;
- route assessment;
- limited reposition;
- abandoning approach;
- turning or reversing;
- holding.

Exact names may differ if a clearer actor-specific union is used.

#### Physical condition

Use `operational` for all six support vehicles unless the implementation has a narrowly justified non-destructive mechanical state. The T+125 event blocks the route; it does not require a support vehicle to be destroyed or visibly wrecked.

#### Outcome

- `active` before the final response;
- `survived` once the stage outcome is known.

All six vehicles survive this stage.

#### Visibility or map presence

State must clearly represent whether each vehicle is present and renderable. Do not use React mounting history or effect history as simulation state.

### 7.3 Domain-specific event types

Do not continue expanding a BTR/T-72 ground-combat event type with unrelated rescue-convoy fields.

Add a dedicated Stage 4B.2C event ID and event shape, or an equivalently clear domain-specific structure, for:

- `rescue_convoy_redirect` at T+75;
- `rescue_convoy_chokepoint` at T+108;
- `rescue_route_secondary_hit` at T+125;
- `rescue_convoy_abandon_approach` at T+174.

Integrate these events into the unified chronological event list without changing completed event IDs or times.

The T+125 event has no authoritative source actor. Do not invent a shooter, aircraft, artillery unit, munition identity, targeter, kill credit, or causal explanation.

### 7.4 Keep derivation modular

Do not place the entire support-convoy lifecycle inside the already large general derivation files.

Prefer a focused pure module such as `supportConvoy.ts` for:

- roster and authored offsets;
- route/path sampling;
- per-vehicle lifecycle derivation;
- steering, speed, braking, reversing, and wheel rotation;
- group state and counts;
- test-facing route sampling where useful.

Reuse genuinely shared route and transform helpers from `groundVehicleRoutes.ts` or a small focused shared module. Do not duplicate a large path sampler, but do not over-generalize unrelated actor types either.

### 7.5 Absolute-time reconstruction

Every support-convoy property must derive from absolute simulation time and authored data, including:

- visibility;
- activity phase;
- condition;
- outcome;
- position;
- heading;
- velocity or scalar speed;
- acceleration and braking state;
- steering state;
- forward-versus-reverse motion direction;
- wheel rotation;
- inter-vehicle spacing;
- headlights, brake lights, and emergency beacons;
- dust emission;
- T+125 bridge effect visibility;
- persistent bridge damage and obstruction;
- group counts and final response state.

Do not advance authoritative state through render-frame accumulation, component-local elapsed time, uncontrolled timers, random values, or one-shot mount effects.

Direct seeking to a timestamp must produce the same state as uninterrupted playback to that timestamp.

## 8. Route and spatial contract

Use the authoritative route:

- path ID: `path_support_convoy_industrial`;
- relevant features: `corridor_service_yard`, `road_rescue_branch`, and `road_eastern_trunk`;
- connector waypoints: `[5750, 250]`, `[6075, 250]`, `[6300, 400]`.

Relevant authoritative map geometry includes:

- service-yard center: `[5750, 250]`;
- service-yard size: `[650, 360]`;
- service-yard polygon: `[[5425, 430], [6075, 430], [6075, 70], [5425, 70]]`;
- rescue-branch polyline: `[[3100, -300], [4050, 100], [5050, 450], [6300, 400]]`;
- eastern-trunk polyline: `[[600, 1400], [1300, 1000], [2200, 400], [3100, -300], [4000, -1100], [5000, -1900], [6050, -1600]]`;
- dry-wash bridge center: `[3100, -300]`;
- dry-wash bridge size: `[145, 34]`;
- dry-wash bridge rotation: approximately -38 degrees;
- dry-wash bridge footprint: `[[3167, -331], [3147, -357], [3033, -269], [3053, -243]]`.

Use the project’s established world-coordinate conversion and terrain sampling. Do not assume the YAML coordinates can be copied directly into Three.js coordinates without following the existing map transform.

### 8.1 Initial staging

The authoritative initial state is moving. Do not present six parked vehicles waiting motionless for T+75.

Stage the convoy from the service-yard north exit and/or already onto the rescue branch at T+0, with rear vehicles still reading as connected to the operational yard. This is allowed because the group is already in motion when the modeled interval begins.

Avoid the east-yard connector area occupied by the completed T-72B reserve group. Do not overlap or clip:

- the T-72Bs;
- the maintenance shed;
- the service-yard barriers;
- the generator or yard lights;
- the substation;
- other static industrial structures.

Do not move those completed assets to make space.

### 8.2 Route timing and scale

The map distance between the yard and bridge is substantial. Do not teleport the convoy or require every vehicle to reach the bridge at T+125.

Use plausible heavy-vehicle speeds and authored starting positions. A useful envelope is:

- routine motion around 15–20 m/s where the road permits;
- emergency response no faster than 28 m/s;
- smooth acceleration and decisive but physically readable braking;
- slower motion during smoke, turns, assessment, and reverse movement.

At T+125, the secondary explosion may occur ahead of the convoy at the bridge. The lead vehicle can then approach the obstruction cautiously and stop short. The event does not need to occur beneath a convoy vehicle.

### 8.3 Convoy spacing and collision avoidance

Use authored lane offsets and time/distance offsets so that:

- the vehicles read as one response group;
- long trucks do not overlap on curves;
- staggered braking propagates rearward;
- no two vehicles share the same position at a timestamp;
- vehicles do not cut visibly across terrain outside the rendered road;
- no vehicle clips the bridge, guardrails, yard structures, T-72Bs, or another convoy vehicle.

Do not implement dynamic collision AI. Author and test safe trajectories.

### 8.4 Reverse and turn semantics

At T+174, rear vehicles must visibly begin a withdrawal instead of merely changing a status string.

Support at least the minimum distinction between:

- vehicle facing direction;
- direction of travel;
- reverse motion;
- a turning maneuver where space permits.

Reuse completed T-72B reverse semantics where they are genuinely shared. Wheels must rotate in the correct direction during reverse motion.

## 9. Exact event choreography

### Before T+75 — routine movement

- the convoy is already moving from the service-yard/rescue-corridor area;
- emergency beacons are not yet in the full response presentation;
- spacing is orderly and speed is moderate;
- there are no personnel or open occupied cabs;
- existing T-72B yard behavior remains untouched.

### T+75 — `rescue_convoy_redirect`

- the group redirects toward the industrial emergency on `path_support_convoy_industrial`;
- acceleration and/or a readable turn communicates escalation;
- emergency beacons activate deterministically from this time;
- headlights or marker lights may support readability but must not substitute for motion;
- the group remains a single convoy with authored spacing;
- no siren audio is added.

### T+108 — `rescue_convoy_chokepoint`

- smoke and dust reduce the apparent visibility on the route;
- lead vehicles hesitate, brake, or make a small cautious steering adjustment;
- braking propagates rearward with authored delays;
- spacing temporarily increases or compresses in a controlled, collision-free way;
- the group may pause briefly to search for a viable approach;
- the behavior must read differently from ordinary waypoint motion.

Do not turn this into generalized perception, pathfinding, or obstacle AI. It is an authored response to a known event.

### T+125 — `rescue_route_secondary_hit`

- a compact secondary explosion occurs at the dry-wash bridge / roadside approach;
- the source remains unattributed;
- use a restrained flash, dust pulse, limited debris, and a compact shock presentation;
- create persistent scorch, damaged road edge or guardrail detail, and a clear physical obstruction;
- do not destroy the entire bridge;
- do not use a hero-scale fireball;
- do not destroy any convoy vehicle;
- the lead response vehicle brakes and stops short of the unusable approach;
- following vehicles remain separated and transition into assessment/cautious states;
- seeking to before T+125 removes the blast and bridge damage;
- seeking back to or after T+125 reconstructs them exactly.

### T+125 to T+173.9 — failed approach

- the lead fire engine may hold closest to the obstruction;
- engineering and recovery vehicles may move forward only as far as safe authored space permits;
- the second fire engine and logistics trucks remain farther back;
- limited repositioning must not imply that the bridge has been cleared;
- emergency beacons continue;
- dust and smoke remain bounded and do not accumulate indefinitely;
- no vehicle crosses the blocked bridge;
- no invented detour succeeds;
- the convoy remains unable to reach the main fire.

### T+174 — `rescue_convoy_abandon_approach`

- the convoy stops advancing and begins partial withdrawal;
- `defender_support_fire_01` may remain closest to the obstruction in a holding state;
- engineering and recovery vehicles may perform only limited local repositioning;
- `defender_support_fire_02` and the two logistics trucks must begin a physically readable turn or reverse withdrawal;
- not every vehicle needs to execute the same maneuver at the same instant;
- no vehicle is destroyed;
- no vehicle teleports, snaps heading, or disappears;
- final group state reads as `withdrawal_in_progress` or an equivalently precise value.

The interval from T+174 to T+176 is intentionally short. Show the onset of the maneuver clearly; do not compress an unrealistic complete convoy retreat into two seconds.

## 10. Vehicle model contract

These are simple procedural support vehicles, not hero assets. Reuse common cab, chassis, wheels, glass, lights, and material primitives where appropriate, then differentiate subtypes through focused attachments.

Use real-meter dimensions and verify the final scale in scene.

### Fire engines

Both fire engines should read as the same operational family, with small variation allowed.

Use approximately:

- length: 8–9 meters;
- width: 2.4–2.7 meters;
- height: 3.0–3.4 meters.

Include a readable box cab, equipment-compartment body, wheels, bumpers, dark windows, mirrors or lights where useful, and a roof beacon. A stowed hose reel or compact roof monitor is acceptable if it does not imply visible personnel or animated hose operation.

Use a restrained industrial red rather than toy-like saturated plastic.

### Engineering truck

Use approximately 7.5–9 meters in length. It should read as an olive, tan, or industrial utility truck with tool/storage body and one restrained engineering cue such as a stowed small crane, folded boom, compact blade, or equipment rack.

Do not create articulated worker controls or open occupied operating stations.

### Recovery vehicle

Use approximately 8–9 meters in length. It should read through a winch, towing assembly, folded boom, recovery frame, or related stowed equipment.

The equipment must remain stable during ordinary motion and must not clip through the cab or road.

### Logistics trucks

Use approximately 7–8.5 meters in length. Each should have a cab plus cargo bed, restrained tarp body, or container-like load. Small material or load variation is allowed, but both remain generic support vehicles.

### Shared presentation

All six vehicles require:

- grounded wheels with believable diameter and placement;
- visible wheel rotation tied to absolute-time distance traveled;
- front and rear lighting cues;
- brake lights tied to authored braking state;
- emergency beacons where appropriate for the response;
- dark or reflective glazing;
- no visible occupants;
- no open crew compartments;
- restrained roughness and color variation;
- readable silhouettes at overview-camera distance.

Do not add a new dependency for modeling or effects.

## 11. Emergency lighting and motion presentation

Emergency beacon state must be deterministic from absolute time. Do not use local intervals, random flashing, or render-frame counters.

Use phase offsets between vehicles so the convoy does not flash as one synchronized object. The same timestamp must always produce the same beacon state.

Brake lights must correspond to authored deceleration windows, especially near T+108, T+125, and T+174.

Dust should follow wheel contact and motion intensity, remain subtle on paved surfaces, and become more readable near shoulders or damaged ground. Do not allow particles to accumulate without a bounded lifetime.

## 12. Bridge strike and persistent obstruction

Implement the T+125 bridge event as a focused authored effect:

- exact location derived from authoritative bridge geometry;
- compact flash;
- dust and limited debris;
- small persistent scorch/crater or damaged road-edge treatment;
- a persistent obstruction that visually explains why the convoy cannot proceed;
- optional restrained guardrail or bridge-edge damage.

The obstruction must be visible enough from the convoy camera and overview camera to explain the stop, but it must not rewrite the authoritative map into a collapsed canyon or fully destroyed bridge.

The effect must be seek-safe:

- no residue before T+125;
- active blast only in a bounded window after T+125;
- persistent damage at later times;
- no duplicate effects after repeated seeks;
- no dependence on how many render frames elapsed.

Do not assign the hit to any existing aircraft, ship, launcher, or ground unit.

## 13. Terrain, road, and physical alignment

Every vehicle must remain grounded using the project’s established terrain-height approach.

Verify:

- no floating wheels;
- no chassis sinking into the terrain;
- no abrupt vertical jumps at polyline joins;
- no extreme pitch or roll;
- readable steering through curves;
- correct heading during forward motion;
- correct facing/travel distinction during reverse;
- bridge approach alignment;
- safe clearance from road edges and static assets.

Do not add a general suspension or rigid-body physics system.

## 14. Camera requirements

Add at most one focused convoy camera preset, named clearly such as `Support convoy` or `Rescue convoy`.

The camera must derive from absolute simulation time and should:

- frame the moving group before T+75;
- show the redirect and emergency-light transition at T+75;
- show staggered braking and reduced visibility at T+108;
- frame both the bridge blast and lead vehicle response at T+125;
- show the separated assessment posture after T+125;
- show the split hold/reposition/withdrawal response at T+174;
- avoid clipping through truck geometry, terrain, structures, or effects;
- avoid abrupt camera cuts within the preset;
- remain stable while paused;
- reconstruct correctly after direct seeking.

Preserve every existing camera preset and paused-camera behavior. Do not add multiple per-vehicle convoy cameras.

## 15. HUD and Tailwind CSS policy

Update the HUD only enough to communicate:

- Stage 4B.2C / support-convoy status;
- active convoy phase;
- concise vehicle/group counts or outcomes where the existing UI pattern supports them;
- the four new timeline events;
- the extended T+176 endpoint.

Keep the UI compact and preserve the existing visual language.

### Tailwind requirement for touched UI

Tailwind CSS is already installed and connected. Use it deliberately for new or modified ordinary DOM UI in this stage.

For UI markup touched by this task, prefer Tailwind utility classes for:

- layout;
- flex/grid behavior;
- spacing;
- width and height constraints;
- typography;
- borders, radii, and colors;
- overflow behavior;
- responsive adjustments;
- focus and hover states.

Do not add new simple semantic selectors to `src/index.css` when the styling can be expressed clearly with existing Tailwind utilities.

Keep handwritten CSS where it is genuinely more appropriate, including:

- global document or canvas rules;
- complex pseudo-elements;
- range-input internals;
- reusable reticle or tactical-display drawing;
- specialized animations or selectors that would become unreadable as utilities.

Do not perform a wholesale migration of the existing HUD in this logic-focused stage. Do not churn untouched markup merely to raise a Tailwind class count. Apply Tailwind consistently to the new/modified UI surface, preserve visual parity, and leave broader stylesheet consolidation for a dedicated later pass.

Do not add a UI library or change Tailwind/package versions.

Verify the HUD at both a normal desktop viewport and a shorter-height viewport. It must not obscure the scene, lose timeline controls, or introduce unintended page scrolling.

## 16. Timeline and duration contract

Extend the deterministic simulation duration from 172 seconds to exactly 176 seconds.

Add exactly these authoritative convoy events:

- T+75 — `rescue_convoy_redirect`;
- T+108 — `rescue_convoy_chokepoint`;
- T+125 — `rescue_route_secondary_hit`;
- T+174 — `rescue_convoy_abandon_approach`.

Preserve every completed event ID, timestamp, label, and ordering.

Do not implement an amphibious or LAV event at T+176. If event inclusion uses a boundary convention, make the Stage 4B.2C cutoff explicit and test it so the later-stage T+176 event remains absent.

Existing actors must remain correct after T+172 through T+176:

- actors that should persist continue from their established state;
- actors that have exited do not reappear;
- completed survivor and destruction outcomes do not reset;
- Molniya remains in its valid open-water continuation state;
- aircraft continuation or exit remains deterministic;
- no completed weapon or damage effect is replayed.

Do not weaken exact T+172 regression assertions. Update only assertions whose sole purpose was to encode the old global duration, and add explicit tests for the new endpoint.

## 17. Deterministic testing requirements

Add focused tests for the support-convoy domain and update integration tests only where required.

At minimum, cover:

### Roster and composition

- exact group ID;
- exact six vehicle IDs;
- exactly two fire engines, one engineering truck, one recovery vehicle, and two logistics trucks;
- stable subtype and convoy-order assignment;
- all six survive.

### Event boundaries

Test immediately before, at, and after important boundaries, including:

- T+0;
- T+74.9, T+75, T+75.1;
- T+107.9, T+108, T+108.1;
- T+124.9, T+125, T+125.1;
- T+171.9 and T+172;
- T+173.9, T+174, T+174.1;
- T+176.

### Motion and route behavior

- initial movement is real and deterministic;
- redirect follows the authored support-convoy path;
- speed remains at or below 28 m/s;
- acceleration and braking stay within believable tested envelopes;
- heading follows route tangents during forward motion;
- reverse direction is represented correctly after T+174;
- wheel rotation direction matches forward/reverse distance;
- vehicles maintain safe spacing;
- vehicles do not overlap one another;
- vehicles avoid completed T-72B positions and static yard infrastructure;
- vehicles remain terrain-grounded;
- no vehicle crosses the blocked bridge.

### Lighting and effects

- emergency beacons activate from T+75 and are deterministic at a timestamp;
- vehicle phase offsets are stable;
- brake lights match authored braking windows;
- bridge blast is absent before T+125;
- the active blast is bounded;
- persistent bridge damage and obstruction exist after T+125;
- repeated seeks do not duplicate residue;
- seeking backward removes future damage/effects.

### Lifecycle and group outcome

- routine movement before T+75;
- emergency response after T+75;
- hesitation at T+108;
- obstruction response at T+125;
- route assessment before T+174;
- partial withdrawal begins at T+174;
- lead-hold, limited-reposition, and rear-withdrawal roles are distinct;
- final group state is withdrawal in progress;
- all six vehicles remain survivors.

### Regression and duration

- full deterministic equality for repeated derivation at the same timestamp;
- direct seek equals uninterrupted-time derivation;
- all existing exact actor states at T+172 remain unchanged;
- completed BTR, T-72B, F-35B, Su-30MKK, naval, and infrastructure behavior remains correct;
- duration is exactly 176 seconds;
- the excluded T+176 amphibious/LAV event is absent;
- actor continuation from T+172 to T+176 is deterministic.

Do not replace strong exact assertions with vague truthiness checks merely to make regressions pass.

## 18. Browser validation

Use the actual application in a browser after implementation. Do not rely only on unit tests.

Inspect at least:

### T+0

- all six vehicles exist exactly once;
- the convoy is already in motion;
- initial yard/road placement is believable;
- no overlap with T-72Bs or infrastructure;
- scale, wheels, windows, and subtype silhouettes read correctly;
- no visible occupants appear.

### T+75

- redirect/acceleration is readable;
- emergency beacons activate;
- the convoy remains orderly;
- no vehicle snaps or teleports.

### T+108

- smoke/dust and reduced visibility are visible but not opaque;
- staggered braking is readable;
- vehicles remain separated;
- the reaction differs from ordinary route following.

### T+125

- the bridge event is correctly located;
- effect scale is restrained;
- no source actor is implied;
- lead braking is readable;
- no support vehicle is destroyed;
- persistent obstruction explains the route failure.

### T+126 to T+150

- convoy assessment and limited repositioning remain coherent;
- no vehicle crosses the obstruction;
- existing T-72B strike sequence remains fully readable at T+150 to T+166;
- new effects do not obscure completed events.

### T+170 to T+176

- completed aircraft egress remains correct;
- T+172 completed states remain correct;
- T+174 partial withdrawal visibly begins;
- lead-hold, engineering/recovery reposition, and rear withdrawal read as distinct responses;
- motion continues naturally to T+176;
- no LAV, LCAC, or excluded event appears.

### Seek and controls

- seek backward from T+176 to before T+125, then forward again;
- seek directly to T+75, T+108, T+125, T+174, and T+176;
- restart;
- test pause and play;
- test 0.5x, 1x, and 2x playback;
- orbit, pan, and zoom while paused;
- inspect the new convoy camera and every existing camera preset;
- verify timeline controls at the new endpoint;
- inspect the HUD at a shorter viewport height;
- inspect the final browser console for errors and warnings caused by this work.

Watch the complete T+70 to T+130 convoy sequence continuously at 1x at least once. Boundary screenshots alone are insufficient to judge redirect motion, staggered braking, spacing, bridge impact, and stop behavior.

Also watch T+170 to T+176 continuously at 1x to verify the partial-withdrawal onset and old-to-new duration transition.

Fix obvious issues discovered during inspection.

## 19. Documentation updates after implementation

Update only the relevant roadmap and changelog sections after implementation is complete and validated.

### `ITERATION_PLAN.md`

Preserve:

- Stage 4B — `COMPLETE`;
- Stage 4B.2A — `COMPLETE`;
- Stage 4B.2B — `COMPLETE`.

Update:

#### Stage 4B.2C — Support and Rescue Convoy

- status `COMPLETE` only after implementation and validation succeed;
- exact six-vehicle composition;
- T+75 redirect;
- T+108 chokepoint hesitation;
- T+125 bridge obstruction;
- T+174 abandoned approach and partial withdrawal;
- deterministic support-vehicle, lighting, motion, and effect validation;
- bounded extension to T+176;
- no visible personnel;
- no generalized convoy AI.

Keep Stage 4C, Stage 5, Stage 6, and unrelated completed-stage descriptions intact. Stage 4C remains the next planned stage unless repository documentation defines a narrower follow-up.

### `changelog.md`

Append a concise Stage 4B.2C completion record covering:

- support-vehicle architecture;
- exact roster and final outcomes;
- route and initial staging;
- T+75, T+108, T+125, and T+174 behavior;
- vehicle model contract;
- emergency lights, braking, dust, bridge effects, and persistent obstruction;
- camera and HUD changes;
- bounded Tailwind usage for touched UI;
- duration extension to T+176;
- automated validation and browser inspection;
- remaining Stage 4C and Stage 5 limitations.

Do not claim completion before validation succeeds.

## 20. Validation under repository rules

Before finishing, run the permitted non-build checks appropriate to the repository, including:

- TypeScript no-emit checking without invoking a build command;
- lint;
- the complete test suite;
- `git diff --check`;
- actual browser inspection.

Do not run build commands.

Do not use a combined project check command if it invokes a prohibited build step.

Do not modify existing dependency versions.

Do not add new dependencies unless the reason is explicitly explained and genuinely necessary. No new dependency should be necessary for this stage.

Do not automatically upgrade framework versions.

Avoid unrelated formatting churn, stylesheet rewrites, or broad refactors.

## 21. Final response requirements

When complete, report:

1. the support-vehicle state architecture and focused modules added;
2. how all completed BTR-80, T-72B, F-35B, Su-30MKK, naval, and infrastructure behavior was preserved;
3. the exact group ID, six vehicle IDs, subtypes, conditions, and final outcomes;
4. how initial staging avoids the reserve T-72Bs and service-yard infrastructure;
5. how the authoritative rescue path, vehicle spacing, speed, braking, steering, wheel motion, and reverse semantics were implemented;
6. the exact T+75, T+108, T+125, and T+174 event behavior;
7. how the unattributed bridge strike and persistent obstruction reconstruct after seeking;
8. procedural model scale and distinguishing details for every support subtype;
9. emergency beacons, headlights, brake lights, dust, smoke, and deterministic effect behavior;
10. camera and HUD changes;
11. how Tailwind was used in new or modified UI and why any remaining touched CSS could not be expressed cleanly as utilities;
12. the T+176 duration extension and the preserved T+172 regression state;
13. timeline, `ITERATION_PLAN.md`, and `changelog.md` changes;
14. TypeScript, lint, test, and whitespace-check results;
15. browser inspections performed and issues corrected;
16. remaining limitations before Stage 4C and Stage 5.

Do not claim a source, shooter, or weapon for `rescue_route_secondary_hit`.

Do not claim that Pantsir 02, LCAC, LAV-25, the T+176 amphibious event, environmental realism, the full T+180 operation, aftermath mode, visible response personnel, or generalized convoy AI has been implemented.

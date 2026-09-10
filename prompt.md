# Stage 4B.2A — Deterministic Armored Reinforcement Attempt

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, and React Three Fiber. It is not a conventional player-controlled game. The viewer observes an authored military scenario through spectator cameras, timeline playback, pause, restart, and direct seeking.

This is an implementation task. Do not stop after planning. Inspect the current repository, implement the complete scoped vertical slice below, run every validation permitted by repository rules, perform browser inspection, fix issues discovered during inspection, and leave the repository in a coherent working state.

## 1. Stage goal

Stage 4B proved one deterministic wheeled-vehicle lifecycle through the four-vehicle BTR-80 group.

Stage 4B.2A must prove that the same architectural principles can support a second ground-vehicle family with different motion and reaction requirements.

Implement one complete armored reinforcement attempt:

1. exactly three T-72B tanks begin in reserve at the Convoy Corridor service yard;
2. they begin moving toward the inland beach approach at T+150;
3. the existing `attacker_f35_01` performs a coherent late support pass;
4. the lead T-72B is destroyed by that aircraft at T+158;
5. the two surviving tanks visibly react, reverse or turn away, and begin withdrawing behind terrain at T+163;
6. the complete result reconstructs deterministically after pause, restart, direct seeking, and playback-speed changes.

This stage is a second narrow vertical slice. Its purpose is to validate reusable ground-vehicle state, tracked-vehicle motion, reverse movement, event causality, and one aircraft-to-moving-vehicle strike. It is not a general battlefield-expansion milestone.

## 2. Read before implementation

Read these files completely before changing source code:

1. `AGENTS.md`
2. `ITERATION_PLAN.md`
3. `changelog.md`
4. `assets/map/map-spec.yaml`
5. `assets/map/map-layout.svg`
6. `assets/scenario/scenario-spec.yaml`
7. `assets/scenario/scenario-timeline.md`
8. `assets/vehicle/T-72b/t-72b.yaml`
9. `assets/vehicle/T-72b/T-72b.jpeg`
10. `assets/vehicle/F-35B/f-35b.yaml`
11. the F-35B reference images relevant to the existing model
12. the current Stage 4B ground-vehicle types, derivation, rendering, effects, tests, UI, and camera implementation
13. the current aircraft motion and air-to-ground weapon implementation
14. the current terrain, rendered-road, service-yard, and Convoy Corridor implementation

The authoritative map, scenario, and vehicle files are design references. Do not rewrite those reference assets during this task.

If implementation details conflict, use this order of authority:

1. `AGENTS.md` and the hard human-visibility constraint;
2. this Stage 4B.2A prompt and its explicit scope;
3. the authoritative scenario, map, and vehicle references;
4. completed-stage behavior documented in `changelog.md`;
5. existing implementation details.

## 3. Hard product constraints

Do not introduce:

- player-controlled units;
- scoring;
- mission success or failure gameplay loops;
- multiplayer;
- generalized autonomous AI agents;
- nondeterministic combat outcomes;
- visible humans;
- infantry;
- pilots;
- tank crews;
- ground crews;
- casualties;
- humanoid silhouettes;
- visible cockpit or hatch occupants;
- ejection or parachuting sequences.

All activity must be communicated through vehicles, machinery, movement, tracks, dust, lights, weapons, damage, smoke, wrecks, infrastructure, and environmental response.

All T-72B hatches must remain closed. Optics and vision devices must remain dark, opaque, or reflective. The existing F-35B cockpit must not reveal an occupant.

## 4. Explicit stage boundary

Implement only:

- the minimum ground-vehicle architecture refinement required for tracked vehicles and reverse movement;
- exactly one three-vehicle T-72B group;
- the T+150 reinforcement movement;
- one deterministic weapon release from the existing `attacker_f35_01`;
- the T+158 lead-tank destruction;
- the T+163 two-tank withdrawal response;
- the minimum camera and UI changes needed to read this sequence;
- deterministic tests and browser verification for this sequence.

Do not implement:

- Su-30MKK aircraft;
- the support or rescue convoy;
- fire engines, engineering trucks, recovery vehicles, or logistics trucks;
- a second Pantsir-S1 relocation, engagement, or destruction sequence;
- LCAC movement, beaching, or ramps;
- LAV-25 deployment;
- the complete amphibious operation;
- additional BTR-80 vehicles;
- additional T-72B vehicles;
- generalized vehicle AI;
- pathfinding;
- traffic simulation;
- collision-avoidance AI;
- autonomous target selection;
- a general ballistics or armor-penetration simulation;
- environmental realism expansion;
- vegetation expansion;
- coastal wave work;
- weathering or clutter passes;
- audio.

Do not add placeholder implementations for excluded actors.

Do not extend the current 172-second simulation duration. The surviving tanks may still be withdrawing when the current timeline ends.

## 5. Preserve Stage 4B before generalizing it

Stage 4B is complete even though `ITERATION_PLAN.md` still labels it `CURRENT`.

Before changing the ground-vehicle architecture, understand the existing behavior and tests in:

- `src/simulation/groundVehicles.ts`;
- `src/simulation/groundVehicles.test.ts`;
- `src/simulation/types.ts`;
- `src/scene/vehicles/Btr80Model.tsx`;
- `src/scene/vehicles/Btr80Group.tsx`;
- `src/scene/effects/Stage4BGroundVehicleEffects.tsx`.

Refactor only where the new tracked-vehicle behavior genuinely requires it.

Requirements:

- all existing BTR-80 event boundaries remain exact;
- all existing BTR-80 poses and final outcomes remain stable unless a change is strictly required and explicitly justified;
- BTR-80 wheel rotation, steering, dust, damage, and grounding remain deterministic;
- the BTR-80 disabled hull remains persistent;
- the three BTR-80 survivors continue their existing withdrawal;
- existing public Stage 1 helper behavior remains frozen where already required;
- existing Stage 1, Stage 2, Stage 3, Stage 4A, and Stage 4B tests remain green.

Do not copy the entire BTR implementation into a second T-72-specific version if a small shared primitive is appropriate. Also do not build an entity-component system, universal behavior tree, generic pathfinding layer, or broad autonomous-agent framework.

Prefer a small shared base plus actor-specific authored derivation.

## 6. Vehicle-state architecture requirements

### 6.1 Preserve separate state dimensions

Continue to distinguish:

#### Activity phase

The T-72B sequence needs phases equivalent to:

- `stationary-reserve`;
- `moving-to-reinforce`;
- `halted-after-strike`;
- `reversing-to-cover`;
- `turning-to-withdraw`;
- `withdrawing`;
- `movement-complete`.

Exact names may differ if the existing type structure supports a clearer actor-specific representation.

Do not force inappropriate T-72B activity into BTR-specific names such as `security-hold` or `moving-to-support` merely to avoid extending the type system.

#### Physical condition

- `operational`;
- `damaged`;
- `disabled`;
- `destroyed`.

#### Outcome

- `active`;
- `lost`;
- `survived`.

The lead tank becomes `destroyed` and `lost` at T+158. The other two remain operational and become confirmed survivors when they begin the T+163 withdrawal.

### 6.2 Support tracked and wheeled motion without optional-field sprawl

The shared state must distinguish wheeled and tracked presentation where their requirements differ.

The design should support:

- BTR-80 wheel rotation and steering;
- T-72B road-wheel rotation and track travel;
- forward movement;
- reverse movement;
- hull heading that may intentionally oppose the motion tangent while reversing;
- signed or explicitly classified longitudinal movement;
- actor-specific turret orientation;
- common position, condition, outcome, grounding, dust, and damage concepts.

Prefer a discriminated drivetrain or motion-presentation shape over a collection of unrelated optional properties on every vehicle.

Do not fake reverse movement by instantly rotating the hull 180 degrees at T+163. During a reverse-first response, the hull may remain oriented toward the threat while the vehicle moves backward. The state representation and tests must understand that this is intentional rather than treating it as a heading error.

### 6.3 Absolute-time reconstruction

Every T-72B property must be reconstructed from absolute simulation time and authored data.

This includes:

- activity phase;
- physical condition;
- outcome;
- position;
- hull heading;
- motion direction;
- signed speed or reverse state;
- acceleration and braking;
- road-wheel rotation;
- track travel;
- turret orientation;
- dust intensity;
- damage visibility;
- flash, sparks, fire, and smoke intensity;
- wreck pose and persistence.

Requirements:

- direct seeking backward and forward reconstructs the identical result;
- restart reconstructs the original reserve state;
- playback speed does not change the outcome;
- no behavior depends on rendered-frame count;
- no mutable vehicle AI state accumulates across frames;
- no random outcome is introduced;
- any procedural visual variation uses fixed deterministic seeds;
- no transient strike effect survives after seeking to a time before its event;
- the destroyed tank reappears identically after seeking away and back.

## 7. T-72B model contract

Create one reusable procedural T-72B visual component based on `assets/vehicle/T-72b/t-72b.yaml` and `assets/vehicle/T-72b/T-72b.jpeg`.

Use real map scale:

- hull length: `6.86 m`;
- width: `3.59 m`;
- height to turret roof: `2.23 m`;
- overall length with gun forward: approximately `9.53 m`;
- forward axis: negative Z;
- up axis: positive Y;
- centered origin.

The recognizable silhouette must include:

- a very low, wide tracked hull;
- a strongly sloped front glacis;
- two continuous track assemblies;
- exactly six large road wheels per side;
- a low rounded or carefully faceted central turret;
- restrained angular armor blocks around the turret front and sides;
- a long centered main gun;
- a visibly thicker bore-evacuator section on the barrel;
- a broad flat rear engine deck;
- simple side skirts above the tracks.

Avoid:

- a tall rectangular hull;
- a tall box-like western-tank turret;
- fewer or more than six large road wheels per side;
- using the 9.53 m gun-forward length as the hull length;
- a short or uniformly thick gun barrel;
- an offset main gun;
- oversized gaps above the road wheels;
- a wheeled-vehicle silhouette;
- exposed crew spaces or open occupied hatches.

Use shared geometry and materials across all three tanks. Repeated road wheels, track elements, armor blocks, and other repeated components must not create unnecessary unique GPU resources.

The model should remain recognizable from the `Convoy Corridor` and proposed T-72 focus views without becoming a CAD-level asset project.

## 8. Authoritative T-72B group contract

Implement exactly one group:

- group ID: `defender_t72_group_01`;
- faction: `island_defender`;
- vehicle type: `T-72B`;
- count: `3`.

Use stable authored vehicle IDs:

1. `defender_t72_01` — lead tank, destroyed and lost at T+158;
2. `defender_t72_02` — operational survivor, withdraws from T+163;
3. `defender_t72_03` — operational survivor, withdraws from T+163.

Do not add randomized identities, replacements, respawns, or extra tanks.

The group begins in `corridor_service_yard`, whose authoritative footprint is:

- center: `[5750, 250]`;
- size: `[650, 360]`;
- polygon: `[[5425,430], [6075,430], [6075,70], [5425,70]]`.

The initial formation must:

- fit inside or immediately at the operational exit of the service-yard footprint;
- avoid the maintenance shed and other static infrastructure;
- maintain believable tank spacing;
- read as a stationary reserve rather than a parade formation;
- remain grounded on the rendered presentation surface;
- keep all hatches closed.

## 9. Route and spatial contract

The authoritative movement references are:

- `path_defender_armored_reinforcement`;
- `corridor_service_yard`;
- `road_eastern_trunk`;
- `road_beach_inland_connector`;
- `path_defender_armored_fallback`, defined as the reverse of the reinforcement path.

The map references describe the intended route but do not provide a completely continuous tank centerline from every parking position in the service yard.

Requirements:

- inspect the rendered road and service-yard geometry before authoring the route;
- use the service-yard exit and existing corridor network;
- add only the minimum explicit connector points needed for continuous motion;
- do not alter `map-spec.yaml` to make implementation easier;
- do not cut through the maintenance shed, substation, fences, bridge structure, or unrelated industrial geometry;
- do not teleport from the service yard to the eastern trunk;
- do not use pathfinding;
- do not make the tanks reach the remote beach during this stage;
- keep the T+158 wreck on or immediately beside the authored traveled route so it reads as an obstruction.

The tanks only have eight seconds of movement before the strike. Preserve believable speed and acceleration rather than forcing them to cover a large fraction of the map.

The existing BTR-80 survivors are already withdrawing elsewhere in the same broad road system. Preserve their authored route and speed. Do not teleport or accelerate them merely to stage a close encounter with the T-72Bs.

Communicate opposing battlefield movement through coherent direction, camera composition, and corridor context where possible. Do not create literal vehicle intersections that contradict the map scale or current timing.

Use authored lane or lateral offsets and fixed stagger timing where needed. Do not add collision-avoidance AI.

## 10. Exact event and state contract

Use these official scenario events and exact boundaries.

### Before T+150

- all three T-72Bs are stationary in reserve;
- all three are operational;
- all three outcomes are active;
- no T-72 dust, strike flash, fire, or smoke is visible;
- the returning F-35 support pass has not produced a T-72 weapon release.

### T+150 — `defender_armored_reinforcement_move`

- group: `defender_t72_group_01`;
- event: `move_toward_inland_beach_approach`;
- path: `path_defender_armored_reinforcement`;
- all three tanks begin the authored reinforcement movement;
- acceleration is smooth and formation motion is staggered only enough to remain readable and safe.

The exact event boundary must be deterministic. T+149.9 is reserve; T+150 has reached the movement event.

### T+150 to T+158

- the three tanks move out of reserve toward the inland approach;
- tracks and road wheels respond to traveled distance;
- dust builds with motion and surface type;
- the formation remains readable and does not overlap;
- the existing `attacker_f35_01` approaches on a coherent late support pass;
- one weapon is released from that aircraft's lower bay at the deterministic internal time defined in Section 11.

### T+158 — `t72_lead_destroyed`

- actor group: `defender_t72_group_01`;
- target actor: `defender_t72_01`;
- source actor: `attacker_f35_01`;
- event: `lead_vehicle_destroyed_by_supporting_air_strike`;
- effect profile: `vehicle_kill_medium`;
- `defender_t72_01` becomes destroyed and lost;
- its movement stops permanently at the impact pose;
- the hull remains as a persistent road obstruction;
- `defender_t72_02` and `defender_t72_03` begin braking or halting rather than continuing blindly through the strike.

At T+157.9, the lead tank must still be operational. At T+158, the official destruction state and initial impact effect begin.

### T+158 to T+163

- the lead wreck remains fixed;
- the two survivors visibly decelerate, stop, hesitate, or begin a restrained preparatory response;
- they do not pass through the wreck;
- they do not continue toward the same threat as if nothing happened;
- their response may be slightly staggered but must remain deterministic;
- no official withdrawal state begins before T+163.

### T+163 — `t72_survivors_withdraw`

- group: `defender_t72_group_01`;
- event: `two_surviving_vehicles_reverse_and_withdraw_behind_terrain`;
- path: `path_defender_armored_fallback`;
- resulting state: `one_destroyed_two_withdrawing`;
- `defender_t72_02` and `defender_t72_03` become confirmed survivors;
- both begin a readable fallback response.

At least one survivor must demonstrate a genuine reverse-first maneuver so the architecture proves that hull heading and movement direction can differ. The other may reverse with a different delay or make a smooth turn-away maneuver if that produces clearer spacing.

Do not snap either tank through 180 degrees.

### T+163 to T+172

- the lead wreck remains fixed and burning or smoking at a restrained persistent level;
- the two survivors continue withdrawing toward cover or the service-yard / inland-ridge side of the authored fallback route;
- reverse and turn transitions remain smooth;
- track travel and road-wheel rotation remain consistent with signed movement;
- tank spacing remains coherent;
- existing BTR-80, naval, industrial, and aircraft systems continue their prior behavior;
- the T-72 survivors may still be withdrawing when the timeline ends.

## 11. Returning F-35B support strike

Use the existing `attacker_f35_01`. Do not spawn a third F-35B or duplicate the model.

The current late `attacker_f35_01` path is an egress path and does not naturally support the authoritative T+158 strike near the Convoy Corridor. Adjust only the late portion required to create a coherent return pass.

Requirements:

- preserve all completed early and mid-scenario F-35 behavior and weapon events;
- preserve continuity at the handoff into the revised late path;
- use the existing velocity-continuous authored flight-path approach;
- keep speed, acceleration, heading rate, bank, and pose/path alignment within the established Stage 4A quality envelope;
- make the aircraft visibly approach the corridor, release, pass through, and depart southwestward;
- do not teleport, reverse instantly, or hide a path kink with yaw smoothing;
- leave `attacker_f35_02` unchanged unless a minimal shared refactor is required;
- do not add Su-30MKK aircraft or imply an unimplemented air engagement;
- do not implement the excluded T+121 second-Pantsir sequence as part of this pass;
- do not require the F-35B to reach the off-map boundary by T+172 if that would demand implausible speed;
- it is sufficient for the aircraft to be clearly outbound from the immediate battlefield by the end of the current timeline.

Create one new deterministic air-to-ground strike definition:

- strike/event ID: `t72_lead_destroyed`;
- source aircraft: `attacker_f35_01`;
- target actor: `defender_t72_01`;
- internal release time: T+154.5;
- impact time: T+158;
- release origin: the existing lower weapons bay attachment;
- munition character: the same dark, unpowered guided-bomb language already established;
- impact position: the exact derived T+158 lead-tank impact anchor.

The target position must have one clear source of truth. Avoid circular imports between aircraft weapons and tank derivation. A shared authored strike contract or equivalent small data module is acceptable if it genuinely improves dependency direction.

The weapon must:

- begin below the aircraft;
- initially travel forward and downward;
- never lob upward;
- have no rocket flame, glow, point light, or continuous tracer trail;
- be visible in flight when viewed from an appropriate camera;
- reach the exact lead-tank impact anchor at T+158;
- disappear correctly when seeking before release or after impact.

Do not add a generalized moving-target weapon or targeting system. This is one authored strike against one deterministic target pose.

## 12. T-72B movement presentation

### 12.1 Speed and acceleration

Use restrained heavy tracked-vehicle movement.

Targets:

- ordinary reinforcement speed should remain approximately `4–12 m/s`;
- absolute maximum should remain below `16 m/s`;
- acceleration and braking should be gradual and visibly heavier than the BTR-80;
- reversing should be slower than forward movement;
- no position discontinuity may occur at T+150, T+158, or T+163.

Derive actual numerical bounds from the authored route and test them.

### 12.2 Hull heading and reverse movement

During forward travel, the visible hull should align closely with the actual path tangent.

During reverse travel:

- the state must explicitly identify reverse motion;
- the hull may face opposite the motion tangent;
- road wheels and track travel must use the correct sign;
- the vehicle must not visually slide sideways;
- the eventual transition from reverse to a forward withdrawal turn, if used, must be smooth.

### 12.3 Tracks and road wheels

Represent motion clearly without simulating individual track-link physics.

At minimum:

- all twelve large road wheels rotate consistently with longitudinal travel;
- track presentation communicates forward versus reverse movement;
- stopped and destroyed tanks do not continue animating their running gear;
- direct seeks produce the exact same running-gear orientation or track phase.

### 12.4 Terrain grounding

Use the rendered presentation surface, not an unrelated flat Y value.

Requirements:

- no sinking or floating at the service yard, connector, road, wreck point, or fallback path;
- pitch and roll follow restrained terrain samples;
- the long gun and low hull do not intersect the terrain during normal travel;
- the destroyed tank may settle slightly, but the effect must be deterministic and physically restrained;
- the presentation transform must not double-apply terrain elevation.

### 12.5 Turret behavior

Turret orientation must be authored, restrained, and time-derived.

- no autonomous target search;
- no randomized scanning;
- no ground-weapon firing in this stage;
- the lead turret and gun remain attached after destruction;
- a small deterministic post-impact offset is acceptable;
- do not launch the complete turret into the air.

### 12.6 Dust

Dust must:

- appear only while a tank is moving on a dust-producing surface;
- scale with speed and surface character;
- trail from the track area rather than the turret;
- stop when a vehicle stops or is destroyed;
- reconstruct after direct seeking;
- remain visually subordinate to the T+158 strike.

## 13. Destruction and persistent wreck contract

The T+158 event is a medium vehicle kill, not a hero industrial explosion.

Use a compact layered effect:

- intense local flash;
- compact fireball;
- short sparks;
- restrained deterministic fragments;
- local dust kick;
- brief localized illumination;
- darkening and scorch damage on the tank;
- persistent hull or engine fire;
- persistent dark smoke;
- optional small ground scorch at the exact impact point.

Avoid:

- a fuel-storage-scale fireball;
- a large pressure front;
- hundreds of fragments;
- complete hull disappearance;
- exaggerated turret launch;
- damage appearing on all three tanks;
- a second unexplained impact;
- random destruction outcomes.

After transient effects expire:

- the same lead hull remains visible;
- the final pose remains fixed;
- fire and smoke settle to a restrained persistent state;
- direct seeking to any later time reconstructs the same wreck;
- seeking to T+157.9 restores the intact moving lead tank with no strike residue.

## 14. Camera requirements

Preserve all existing spectator controls and presets.

Retune the existing `Convoy Corridor` preset if necessary so the service-yard departure, strike, wreck, and withdrawal are legible without losing district context.

Add at most one new preset:

- label: `T-72 focus` or an equally concise name;
- before T+150: frame the reserve group;
- T+150 to T+158: follow the formation anchor;
- around T+158: keep the lead vehicle, weapon impact, and at least one survivor readable;
- after T+163: frame the wreck and withdrawing survivors where possible;
- derive the target from absolute state, not an accumulated camera track.

Do not add automatic cinematic cuts.

Free orbit, pan, and zoom must remain usable while paused.

The existing BTR, F-35, harbor, industrial, Radar Hill, beach, Wasp, and Molniya views must remain functional.

## 15. UI and timeline requirements

Add only the minimum UI required to communicate the new sequence.

Requirements:

- add the three official T-72 events to the unified timeline in chronological order;
- keep the total duration at 172 seconds;
- display the current milestone as `Stage 4B.2A` or `Armored reinforcement`;
- expose concise T-72 group status without overwhelming the HUD;
- represent states such as `reserve`, `3 reinforcing`, `1 destroyed / 2 halted`, and `2 withdrawing / 1 destroyed`;
- do not falsely claim that Su-30MKK, support convoy, Pantsir 02, LCAC, LAV-25, or the full operation is implemented;
- preserve existing BTR group status and official event readouts;
- preserve play, pause, restart, seek, and playback-speed controls.

Use the exact official event IDs:

- `defender_armored_reinforcement_move` at T+150;
- `t72_lead_destroyed` at T+158;
- `t72_survivors_withdraw` at T+163.

## 16. Performance and resource rules

This stage adds only three tanks and one bounded destruction event, but it must still follow the existing performance discipline.

Requirements:

- share T-72 geometry and materials across all three instances;
- reuse existing effect primitives and bounded pools where practical;
- do not allocate new Three.js geometry or materials every frame;
- avoid simulation-frequency React reconciliation for static model subtrees;
- dispose only resources owned by the component that created them;
- do not globally cache disposable scene-owned resources without a clear ownership model;
- keep shadows restrained and intentional;
- do not add a new dependency for modeling, motion, effects, or state management.

## 17. Preserve existing systems

Do not regress:

- deterministic pause, play, restart, and direct seeking;
- 0.5×, 1×, and 2× playback;
- Stage 1 launch and Radar Hill engagement;
- Stage 2 terrain, harbor, industrial, corridor, beach, and naval construction;
- Stage 3 Talwar damage and flooding;
- Stage 3 Molniya departure, damage, wake, and open-water state;
- Stage 3 industrial and ammunition destruction;
- Stage 4A terrain remap and fuel disaster;
- Stage 4A F-35 motion quality before the new late support pass;
- Stage 4B BTR support, loss, withdrawal, model, effects, camera, and HUD behavior;
- persistent damage reconstruction;
- spectator camera control while paused;
- the hard prohibition on visible humans.

Do not rewrite completed effects merely for stylistic consistency with the new tank effect.

## 18. Required tests

Add focused tests for Stage 4B.2A and preserve the existing suite.

### 18.1 Roster and model data

Verify:

- group ID is `defender_t72_group_01`;
- there are exactly three tanks;
- stable IDs are `defender_t72_01`, `defender_t72_02`, and `defender_t72_03`;
- all belong to `island_defender`;
- all use vehicle type `T-72B`;
- dimensions match the authoritative specification;
- initial formation fits the authored service-yard / exit contract with safe spacing.

### 18.2 Exact state boundaries

Test at least:

- T+149.9;
- T+150;
- T+150.1;
- T+154.4;
- T+154.5;
- T+157.9;
- T+158;
- T+158.1;
- T+162.9;
- T+163;
- T+163.1;
- T+172.

Verify the exact movement, release, loss, reaction, and withdrawal boundaries.

### 18.3 Final outcomes

At and after the relevant thresholds:

- `defender_t72_01` is destroyed and lost;
- `defender_t72_02` is operational and survived after withdrawal begins;
- `defender_t72_03` is operational and survived after withdrawal begins;
- the destroyed tank never resumes movement;
- the two survivors do not continue along the original threat-facing route after T+163.

### 18.4 Deterministic reconstruction

Verify:

- repeated derivation at the same time is identical;
- late-to-early-to-late seeking reconstructs identical state;
- restart restores all three intact reserve tanks;
- 0.5×, 1×, and 2× playback reach identical state at the same absolute time;
- weapon, flash, fragments, dust, fire, smoke, and wreck state do not leak backward through time.

### 18.5 Motion quality

Sample densely across T+149 to T+172 and verify:

- position continuity at all boundaries;
- bounded forward speed;
- lower bounded reverse speed;
- bounded acceleration and braking;
- bounded hull yaw rate;
- no sideways sliding;
- correct forward heading/path alignment;
- intentional reverse heading/motion opposition;
- correct signed road-wheel and track travel;
- safe spacing within the T-72 group;
- no overlap with the destroyed lead tank;
- no collision with service-yard structures or road fixtures along the authored route.

### 18.6 Grounding

Test representative positions during:

- reserve hold;
- yard departure;
- forward movement;
- the T+158 wreck pose;
- reverse movement;
- turn-away movement;
- final withdrawal.

Verify model origins, terrain pitch/roll, and explicit ground clearance against the same rendered presentation surface.

### 18.7 Aircraft and weapon integration

Verify:

- `attacker_f35_01` remains continuous into and out of the late support pass;
- speed, acceleration, turn rate, bank, and pose/path alignment remain bounded;
- completed earlier F-35 weapon releases retain their exact origins, targets, and impact times;
- the new weapon releases at T+154.5 from the lower bay;
- its initial tangent is forward and downward;
- it never travels above its release height because of an upward lob;
- it impacts the exact T+158 lead-tank anchor;
- the strike state is identical after arbitrary direct seeks.

### 18.8 Timeline and regression

Verify:

- the three new events are present exactly once;
- the unified event list remains chronologically sorted;
- the simulation duration remains 172 seconds;
- all existing Stage 1 through Stage 4B tests remain green;
- no excluded future actor is added to the world state or scene.

Do not weaken existing assertions simply to make a refactor pass.

## 19. Browser inspection matrix

Use an actual browser against the running development application. Do not rely only on unit tests or source inspection.

Inspect at minimum:

### T+0

- three T-72Bs are visible in the service-yard reserve position;
- the group does not overlap buildings, fences, or itself;
- scale and silhouette are recognizable;
- no humans or occupants are visible;
- no future strike residue is present.

### T+149.9

- tanks remain stationary;
- running gear and dust remain inactive;
- BTR and completed-stage systems remain correct.

### T+150 to T+154.4

- tanks depart smoothly;
- spacing is readable;
- heavy tracked motion differs visually from BTR motion;
- grounding, pitch, roll, track motion, and dust remain coherent.

### T+154.5 to T+157.9

- the returning F-35B pass is continuous and physically readable;
- the weapon originates below the aircraft and follows a believable forward/downward path;
- the lead tank remains operational until impact;
- the camera can show the relationship between aircraft, weapon, and target without an automatic cut.

### T+158

- the impact is centered on `defender_t72_01`;
- the effect reads as a medium vehicle kill;
- the wreck remains visible;
- the two survivors are not destroyed by the same event;
- no excessive hero-scale blast or turret launch occurs.

### T+158 to T+162.9

- the survivors brake, halt, or hesitate visibly;
- they do not drive through the wreck;
- persistent lead-tank damage develops coherently;
- transient effects decay without disappearing all persistent state.

### T+163 to T+172

- both survivors begin withdrawal at the official boundary;
- at least one performs a readable reverse-first maneuver;
- reverse track and road-wheel motion are correct;
- any turn-away maneuver is smooth;
- the wreck remains fixed;
- the F-35B is outbound;
- the group may still be withdrawing at timeline end.

### Seek and control checks

- seek from T+170 back to T+149.9;
- seek to T+154.5, T+157.9, T+158, and T+163;
- seek away from and back to the persistent wreck;
- restart;
- test pause and play;
- test 0.5×, 1×, and 2× playback;
- orbit, pan, and zoom while paused;
- inspect the BTR focus and all major existing camera families;
- inspect the final browser console for errors.

Also watch the complete T+149 to T+166 sequence continuously at 1× at least once. Boundary screenshots alone are insufficient to judge braking, reverse motion, the air strike, and reaction timing.

Fix obvious issues discovered during inspection.

## 20. Update project documentation

Update only the relevant roadmap and changelog sections after the implementation is complete and validated.

### `ITERATION_PLAN.md`

Correct the stale Stage 4B status:

- Stage 4B — status `COMPLETE`.

Split the next work clearly:

#### Stage 4B.2A — Deterministic Armored Reinforcement Attempt

- status `COMPLETE` only after this task and its validation are finished;
- three T-72B reinforcement movement;
- returning F-35B support strike;
- one persistent lead-tank loss;
- two-tank reverse / fallback response;
- tracked-motion and deterministic reconstruction validation.

#### Stage 4B.2B — Limited Airborne Defender Reaction

- status `PLANNED`;
- two Su-30MKK aircraft;
- brief defensive appearance;
- one damaged withdrawal;
- one covering withdrawal;
- no generalized air-combat AI.

#### Stage 4B.2C — Support and Rescue Convoy

- status `PLANNED`;
- six simple support vehicles;
- firefighting, engineering, recovery, and logistics response;
- obstruction, failed approach, and partial withdrawal;
- no visible personnel.

Keep Stage 4C, Stage 5, Stage 6, and unrelated completed-stage descriptions intact.

### `changelog.md`

Append a concise Stage 4B.2A completion record covering:

- architecture changes;
- exact roster and outcomes;
- route and timing;
- F-35B late support pass and weapon integration;
- tracked and reverse motion;
- destruction and persistent wreck presentation;
- camera and UI changes;
- validation and browser inspection;
- remaining Stage 4B.2B, Stage 4B.2C, Stage 4C, and Stage 5 limitations.

Do not claim completion before validation succeeds.

## 21. Validation under repository rules

Before finishing, run the permitted non-build checks appropriate to the repository, including:

- TypeScript no-emit checking without invoking a build command;
- lint;
- the complete test suite;
- `git diff --check`;
- actual browser inspection.

Do not run build commands.

Do not use `pnpm check` if it invokes the prohibited TypeScript build mode.

Do not modify existing dependency versions.

Do not add new dependencies unless the reason is explicitly explained and genuinely necessary. No new dependency should be necessary for this stage.

Do not automatically upgrade framework versions.

Avoid unrelated formatting churn or refactors.

## 22. Final response requirements

When complete, report:

1. the ground-vehicle architecture changes made for tracked and reverse motion;
2. how Stage 4B BTR behavior was preserved;
3. the exact three T-72B IDs and final outcomes;
4. the authored reserve position and route used;
5. forward, braking, reverse, turning, track, road-wheel, dust, and grounding behavior;
6. the exact T+150, T+158, and T+163 event implementation;
7. how the existing F-35B late path was changed without regressing earlier behavior;
8. how the T+154.5 weapon release reaches the T+158 lead-tank pose;
9. the destruction effect and persistent wreck behavior;
10. camera and UI changes;
11. timeline, `ITERATION_PLAN.md`, and `changelog.md` changes;
12. TypeScript, lint, test, and whitespace-check results;
13. browser inspections performed and issues corrected;
14. remaining limitations before Stage 4B.2B, Stage 4B.2C, Stage 4C, and Stage 5.

Do not claim that Su-30MKK, the support convoy, Pantsir 02, LCAC, LAV-25, environmental realism, the full 180-second operation, or aftermath mode has been implemented.

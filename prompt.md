# Stage 4B — Deterministic Battlefield Reaction Vertical Slice

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, and React Three Fiber. It is not a conventional player-controlled game. The viewer observes an authored military scenario through spectator cameras, timeline playback, pause, restart, and direct seeking.

This task is an implementation task. Do not stop after planning. Inspect the current repository, implement the complete scoped vertical slice below, validate it under repository rules, perform browser inspection, fix issues discovered during inspection, and leave the project in a coherent working state.

## 1. Stage goal

Stage 4B must prove one reusable deterministic ground-vehicle reaction workflow before the project adds more unit families.

Implement:

1. a small, reusable deterministic ground-vehicle lifecycle foundation;
2. one complete four-vehicle BTR-80 reaction sequence;
3. road-following movement, support positioning, one persistent vehicle loss, and survivor withdrawal;
4. deterministic reconstruction through pause, restart, and direct seeking;
5. camera readability and regression coverage for the complete sequence.

The purpose is not to add many units. The purpose is to establish a reliable authored pattern that later stages can reuse for T-72B, support vehicles, and other ground actors.

## 2. Read before implementation

Read these files completely before changing source code:

1. `AGENTS.md`
2. `ITERATION_PLAN.md`
3. `assets/map/map-spec.yaml`
4. `assets/scenario/scenario-spec.yaml`
5. `assets/scenario/scenario-timeline.md`
6. `assets/vehicle/BTR-80/btr-80.yaml`
7. the BTR-80 reference image in `assets/vehicle/BTR-80/`
8. the current simulation, timeline, terrain, camera, world, vehicle, and effect implementations relevant to this task

The authoritative map and scenario files are design references. Do not rewrite those reference assets during this task.

If implementation details conflict, use this order of authority:

1. `AGENTS.md` and the hard human-visibility constraint;
2. this Stage 4B prompt and its explicit scope;
3. authoritative scenario and map references;
4. existing implementation details.

## 3. Hard product constraints

Do not introduce:

- player-controlled units;
- scoring;
- mission success/failure gameplay loops;
- multiplayer;
- generalized autonomous AI agents;
- nondeterministic combat outcomes;
- visible humans;
- infantry;
- pilots;
- crews;
- humanoid silhouettes;
- visible cockpit occupants;
- ejection or parachuting sequences.

All activity must be communicated through vehicles, machinery, movement, lights, dust, damage, smoke, wrecks, infrastructure, and environmental response.

Vehicle windows, vision blocks, and optical surfaces must remain dark, opaque, or reflective. They must never reveal occupants.

## 4. Explicit stage boundary

This stage implements only the BTR-80 vertical slice and the minimum reusable foundation required for it.

Do not implement any of the following in Stage 4B:

- T-72B reinforcement movement;
- T-72B destruction or fallback;
- Su-30MKK entry, combat, damage, or withdrawal;
- a second Pantsir-S1;
- the support/rescue convoy;
- fire engines, engineering trucks, recovery vehicles, or logistics trucks;
- LCAC movement or landing;
- LAV-25 deployment;
- the full amphibious operation;
- new aircraft combat systems;
- full weapon simulation for ground vehicles;
- generalized vehicle AI;
- traffic simulation;
- collision avoidance AI;
- pathfinding;
- environmental realism or clutter expansion;
- vegetation expansion;
- coastal wave work;
- weathering pass;
- audio.

Do not add placeholder implementations for excluded units.

Do not add extra BTR-80 vehicles beyond the four specified below.

Do not extend the current implemented simulation duration during this stage. The surviving vehicles may still be withdrawing when the current timeline ends.

## 5. Deterministic vehicle-state foundation

Create only the abstraction needed to support authored ground-vehicle timelines. Do not build a universal entity-component framework or a generic autonomous-agent system.

### 5.1 Separate activity from physical condition

Do not represent every concept in one mutually exclusive state enum.

The design must distinguish at least:

#### Activity phase

- `security-hold`
- `alerted`
- `moving-to-support`
- `supporting`
- `turning-to-withdraw`
- `withdrawing`
- `movement-complete`

Actor-specific activity phases are allowed. Do not force aircraft, ships, and every future vehicle to share inappropriate ground-vehicle phases.

#### Physical condition

- `operational`
- `damaged`
- `disabled`
- `destroyed`

#### Outcome

- `active`
- `lost`
- `survived`

A vehicle must be able to combine concepts. For example, a surviving BTR may be both `withdrawing` and `operational`, while the lost BTR is `supporting`, `disabled`, and `lost` after the damage threshold.

### 5.2 Absolute-time derivation

Every vehicle property must be reconstructed from absolute simulation time and authored data.

This includes:

- activity phase;
- physical condition;
- outcome;
- position;
- heading;
- speed;
- steering/turning presentation;
- wheel rotation;
- turret orientation;
- dust intensity;
- damage visibility;
- smoke/fire intensity;
- wreck persistence.

Requirements:

- direct seeking backward and forward reconstructs the identical result;
- restart reconstructs the original result;
- playback speed does not change the outcome;
- no behavior depends on the number of rendered frames;
- no accumulated mutable vehicle AI state;
- no random result without a fixed deterministic seed;
- no transient object may survive after seeking to a time before its event.

### 5.3 Authored road motion

Create or reuse a deterministic timed-path sampler suitable for ground vehicles.

It should support:

- explicit timed path segments or keyframes;
- smooth position interpolation;
- heading derived from the road/path tangent;
- bounded steering changes;
- bounded acceleration and deceleration;
- terrain-aware vertical placement;
- deterministic distance traveled for wheel rotation;
- vehicle spacing without frame-history simulation.

Do not add pathfinding. Use the authored road network and the exact route contract below.

Do not hide a sharp path kink by smoothing only the rendered vehicle yaw. The actual movement path and the visible heading must remain reasonably aligned.

## 6. BTR-80 model contract

Create one reusable BTR-80 visual component based on `assets/vehicle/BTR-80/btr-80.yaml` and its reference image.

Use real map scale:

- length: `7.65 m`;
- width: `2.89 m`;
- height: `2.35 m`;
- forward axis: negative Z;
- up axis: positive Y;
- centered origin.

The silhouette must clearly include:

- a long, low, boat-shaped armored hull;
- a pointed and strongly sloped front;
- angled upper side plates;
- four wheels per side;
- a visibly larger gap between the second and third axles;
- a small central turret;
- a short forward heavy-machine-gun barrel;
- a raised rear engine deck.

Avoid:

- tracks;
- fewer than eight wheels;
- evenly spaced axles;
- a tall rectangular truck-like hull;
- a large autocannon turret;
- an LAV-25-like silhouette;
- visible occupants or interior spaces.

Use shared geometry and materials across all four vehicles. Repeated elements such as wheels should not create unnecessary unique resources.

Wheel rotation must be derived from deterministic traveled distance. It must reconstruct correctly after direct seeking.

The turret may orient toward the industrial threat while supporting, but this stage does not require firing or projectile simulation.

## 7. Authoritative BTR group contract

Implement exactly one group:

- group ID: `defender_btr_group_01`;
- vehicle IDs: `defender_btr_01`, `defender_btr_02`, `defender_btr_03`, `defender_btr_04`;
- faction: `island_defender`;
- count: exactly `4`;
- planned loss: `defender_btr_01` becomes disabled and remains as a persistent wreck;
- survivors: `defender_btr_02`, `defender_btr_03`, and `defender_btr_04` begin withdrawal and survive the implemented timeline.

The four vehicles must not share one identical transform. Give them authored longitudinal spacing and small restrained lateral variation while keeping them on the road or adjacent prepared hard ground.

Maintain a safe visual spacing. Vehicles must not overlap during holds, turns, or withdrawal.

## 8. Route and spatial contract

Use the existing map features:

- `road_eastern_trunk`;
- `road_rescue_branch` only as the later intended fallback connection;
- `path_defender_convoy_fallback` as the authoritative long-term withdrawal route concept;
- the industrial perimeter near `gate_fuel_eastern_trunk`;
- the Convoy Corridor region.

The relevant eastern trunk centerline includes:

- `[600, 1400]`;
- `[1300, 1000]`;
- `[2200, 400]`;
- `[3100, -300]`;
- later eastern waypoints beyond the scope of this stage.

### Initial security hold

Before T+75, place the group in an authored roadside security hold centered around the `[1300, 1000]` eastern-trunk waypoint.

- `defender_btr_01` is the lead vehicle, facing toward the industrial district and `[600, 1400]`;
- the other three vehicles trail toward the `[2200, 400]` side of the road;
- use approximately `18–24 m` longitudinal spacing;
- use only small lateral offsets that remain within the road/pull-off envelope;
- all four vehicles are operational.

### Movement to support

From T+75 to T+118, move the group toward the industrial perimeter along `road_eastern_trunk`, from the `[1300, 1000]` area toward `[600, 1400]`.

The lead support position should be near `[720, 1330]`, with the other vehicles holding behind it along the same road direction.

Use the road centerline and terrain sampling rather than a straight off-road shortcut.

### Withdrawal

After T+136, the three surviving vehicles must turn away from the industrial district and withdraw eastward along the reverse road direction.

Within the current implemented timeline they should progress back toward the `[1300, 1000]` area. They do not need to reach `road_rescue_branch` or `corridor_service_yard` before the timeline ends.

The long-term path may point toward the rescue branch and service yard, but do not teleport vehicles there and do not extend the timeline merely to complete that journey.

## 9. Exact event and state contract

Use the following thresholds. Do not invent additional official BTR timeline events.

| Simulation time       | Required BTR behavior                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| T+0 to before T+75    | Four operational vehicles in `security-hold`                                                                         |
| T+75                  | Internal authored transition to `alerted`; this is not a new official scenario event                                 |
| T+75 to T+118         | `moving-to-support` along `road_eastern_trunk`                                                                       |
| T+118 to before T+133 | `supporting` near the industrial perimeter                                                                           |
| T+132                 | Existing ammunition primary detonation occurs; do not duplicate or replace it                                        |
| T+133                 | Official event `btr_01_disabled`: `defender_btr_01` becomes disabled/lost and remains in place                       |
| T+133 to before T+136 | Three survivors remain operational, react to the loss, and prepare to withdraw                                       |
| T+136                 | Official event `btr_survivors_fallback`: the three survivors begin a readable turn away from the industrial district |
| T+136 to timeline end | Three survivors are `withdrawing`; the disabled vehicle remains persistent                                           |

Add only these two official Stage 4B scenario events to the implemented timeline:

1. `btr_01_disabled` at T+133;
2. `btr_survivors_fallback` at T+136.

Do not add the excluded Su-30MKK, T-72B, LCAC, LAV-25, support-convoy, or second-Pantsir events to the implemented timeline during this task.

The T+75 alert and T+118 support arrival are actor-internal authored phase thresholds, not new top-level official events.

## 10. Damage and causality contract

The loss must have one clear cause:

- the existing ammunition-storage primary detonation occurs at T+132;
- approximately one second later, secondary blast/debris effects disable `defender_btr_01` at T+133.

Do not add a new aircraft strike, missile, bomb, attacker, or weapon system for this loss.

The BTR damage language must remain smaller and more localized than the ammunition hero explosion.

Use a restrained combination of:

- a compact local flash;
- sparks or a small number of fragments;
- a dust kick;
- visible hull damage or darkened materials;
- limited local fire if visually useful;
- a persistent dark smoke source;
- a permanently disabled hull.

Do not launch the complete vehicle or turret unrealistically.

Do not imply crew escape, casualties, bodies, hatches opening for people, or rescue personnel.

The surviving vehicles must visibly react to the loss. They must not continue blindly toward the same threat.

Their reaction should include:

1. a short hesitation or deceleration;
2. spacing adjustment;
3. a smooth authored turn away;
4. deterministic withdrawal.

## 11. Movement presentation

### Speed and acceleration

Keep the BTR road movement cinematic but plausible.

- target moving speed should remain at or below approximately `22 m/s`;
- acceleration/deceleration should remain bounded and visually gradual;
- vehicles must not teleport at phase boundaries;
- vehicles must not snap into large heading changes;
- all three survivors must follow the authored route with individual spacing rather than one shared position.

### Grounding

Vehicles must remain correctly grounded on the Stage 4A terrain presentation surface.

- derive Y from the authoritative terrain-height function plus an explicit model clearance;
- do not use a single constant world Y for the entire route;
- avoid visible floating or wheel burial;
- preserve road and terrain coherence after direct seeks.

### Dust

Add a restrained deterministic movement indication for moving BTRs.

- dust should appear only when speed and surface conditions justify it;
- use bounded reusable resources or instancing;
- dust must reconstruct from absolute time;
- seeking backward before movement must remove later dust;
- do not create a large smoke cloud that obscures the vehicles;
- do not add persistent tire tracks unless they can be reconstructed deterministically and remain within scope.

## 12. Camera requirements

Do not create many new cameras and do not add forced cutscenes.

First attempt to make the sequence readable through the existing `Convoy corridor` preset and free spectator controls.

You may retune that preset if necessary so it communicates:

- the moving group;
- the industrial support position;
- the T+133 loss;
- the beginning of withdrawal.

Add at most one new BTR follow preset only if the existing preset and spectator controls cannot adequately inspect movement quality. If a follow preset is added, it must remain seek-safe and must not remove orbit, pan, or zoom freedom while paused.

Do not add separate presets for each BTR or each phase.

## 13. UI and status readability

Keep UI changes minimal.

If the operational-status panel is extended, show the group or lead vehicle with concise state language such as:

- security hold;
- moving to support;
- supporting;
- one disabled / three operational;
- withdrawing.

Do not add a tactical command interface, unit-selection UI, health bars, scores, or player controls.

Timeline labels must use the two official event IDs and times defined above.

## 14. Preserve existing systems

Do not break or replace:

- the Stage 1 opening sequence;
- deterministic playback;
- pause/play/restart;
- 0.5×, 1×, and 2× playback;
- direct timeline seeking;
- F-35B launch and flight smoothing;
- Radar Hill engagement;
- Pantsir-S1 destruction;
- Harbor and Talwar events;
- Molniya movement and damage;
- the Stage 4A fuel disaster;
- ammunition cook-off and primary detonation;
- persistent destruction reconstruction;
- terrain relief and road grounding;
- camera orbit, pan, and zoom;
- the limited active battlefield roster outside this stage.

Do not modify dependency versions or add dependencies unless explicitly authorized under repository rules.

## 15. Required tests

Add focused regression coverage for the new vehicle foundation and BTR sequence.

At minimum, test:

1. exactly four BTR vehicles exist;
2. vehicle IDs and faction are correct;
3. all four are operational before T+133;
4. only `defender_btr_01` becomes disabled/lost at T+133;
5. exactly three survivors begin withdrawal at T+136;
6. the disabled BTR remains persistent at later times;
7. backward seeking before T+133 restores all four to operational condition;
8. direct seeks reconstruct identical state;
9. restart reconstructs the initial security hold;
10. playback speed does not change outcomes;
11. no position jump occurs at T+75, T+118, T+133, or T+136;
12. speed and acceleration remain bounded;
13. visible heading remains aligned with the actual route tangent;
14. vehicle spacing prevents overlap;
15. road/terrain grounding remains within a small explicit tolerance;
16. wheel rotation is deterministic after direct seek;
17. dust and damage effects disappear when seeking to a time before their thresholds;
18. existing Stage 1, Stage 3, and Stage 4A tests remain green.

Use boundary samples around at least:

- T+74.9 / T+75.0;
- T+117.9 / T+118.0;
- T+132.9 / T+133.0;
- T+135.9 / T+136.0;
- a late withdrawal time near T+160 or the current timeline end.

Tests must verify actual motion-path continuity, not only smoothed model rotation.

## 16. Browser inspection matrix

Run the application and inspect the implementation in the browser.

At minimum inspect:

### T+0 to T+74

- four BTRs are present in the security hold;
- silhouettes, scale, eight-wheel layout, spacing, and grounding read correctly;
- no occupants or humanoid shapes are visible.

### T+75 to T+118

- support movement is visible;
- starts and stops are smooth;
- vehicles follow the road;
- heading follows the actual route;
- wheel rotation and dust are readable but restrained;
- vehicles do not overlap or move identically.

### T+118 to T+132

- the support hold is readable;
- vehicles are positioned on the road or prepared hard ground;
- the group does not interfere visually with the existing ammunition sequence.

### T+132 to T+140

- watch this interval continuously at 1× speed;
- verify the ammunition detonation remains the dominant hero event;
- verify the BTR loss occurs as a delayed localized consequence;
- verify the wreck persists;
- verify the survivors hesitate, turn, and begin withdrawal without snapping.

### T+140 to timeline end

- survivors continue withdrawing;
- spacing and grounding remain coherent;
- the lost BTR remains in place;
- no excluded future units appear.

### Seek and control checks

- seek from a late withdrawal time back to T+120;
- seek forward to T+133 and T+136;
- restart;
- test pause/play;
- test 0.5×, 1×, and 2× playback;
- orbit, pan, and zoom while paused;
- inspect the final browser console for errors.

Fix obvious issues discovered during inspection.

## 17. Update `ITERATION_PLAN.md`

Update only the relevant roadmap section. Do not rewrite unrelated completed stages.

Use this structure:

### Stage 4A — Cinematic Enhancement

- status: completed;
- preserve the existing completed description.

### Stage 4B — Deterministic Battlefield Reaction Vertical Slice

- status: current;
- deterministic ground-vehicle lifecycle foundation;
- four-vehicle BTR-80 support movement;
- one persistent BTR-80 loss;
- three-vehicle withdrawal;
- seek/restart/path/camera validation.

### Stage 4B.2 — Deterministic Actor Expansion

- status: planned;
- T-72B reinforcement, lead loss, and fallback;
- limited Su-30MKK defensive appearance and withdrawal;
- support/rescue convoy only after the Stage 4B lifecycle foundation is proven;
- no generalized AI.

### Stage 4C — Environmental Storytelling and Coastal Realism

Keep the planned environmental scope here:

- vegetation improvement;
- surface history;
- industrial wear;
- functional clutter;
- waves and shoreline foam;
- coastal atmosphere;
- weathering.

### Stage 5 — Full Operation Integration

Keep the full operation work here:

- LCAC approach and landing;
- LAV-25 deployment;
- complete amphibious timeline;
- broader battlefield integration only after prior foundations are validated.

## 18. Validation under repository rules

Before finishing, run the permitted non-build checks required by the repository, including:

- TypeScript no-emit checking;
- lint;
- the complete test suite;
- `git diff --check`;
- browser inspection.

Do not run build commands.

Do not run format commands.

Do not modify existing dependency versions.

Do not add new dependencies unless the reason is explicitly explained and permitted.

Do not automatically upgrade framework versions.

## 19. Final response requirements

When complete, report:

1. the deterministic vehicle-state structure implemented;
2. how activity, physical condition, and outcome are represented;
3. the exact four BTR vehicle IDs and final outcomes;
4. how authored road movement, steering, speed, and wheel rotation work;
5. how terrain grounding was preserved;
6. how the T+133 loss is causally connected to the existing ammunition detonation;
7. how the T+136 survivor reaction and withdrawal were implemented;
8. dust, damage, smoke, and persistent wreck presentation;
9. camera or preset changes;
10. timeline and `ITERATION_PLAN.md` changes;
11. validation results;
12. browser inspections performed;
13. remaining limitations before Stage 4B.2, Stage 4C, and Stage 5.

Do not claim that T-72B, Su-30MKK, the support convoy, LCAC, LAV-25, environmental realism, or the full operation has been implemented.

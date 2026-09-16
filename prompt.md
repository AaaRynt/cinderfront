# Stage 4B.2B — Limited Airborne Defender Reaction

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, and React Three Fiber. It is not a conventional player-controlled game. The viewer observes an authored military scenario through spectator cameras, timeline playback, pause, restart, and direct seeking.

This is an implementation task. Do not stop after planning. Inspect the current repository, implement the complete scoped vertical slice below, run every validation permitted by repository rules, perform browser inspection, fix issues discovered during inspection, and leave the repository in a coherent working state.

## 1. Stage goal

Stage 4B established a deterministic wheeled-vehicle lifecycle through the BTR-80 group. Stage 4B.2A extended that foundation to tracked vehicles, reverse movement, and one authored F-35B ground-support strike against the T-72B group.

Stage 4B.2B must now prove a compact deterministic airborne-reinforcement lifecycle for a second aircraft family.

Implement one complete defender-aircraft reaction sequence:

1. exactly two Su-30MKK aircraft enter from the northeast at T+104;
2. `defender_su30_01` briefly pressures the departing F-35B formation;
3. `defender_su30_02` remains offset in a supporting position;
4. `defender_su30_01` takes non-catastrophic damage at T+137 and breaks away;
5. `defender_su30_02` performs a brief covering pass at T+142 and then follows the damaged aircraft out;
6. the main air activity transitions to egress at T+170;
7. the entire sequence reconstructs deterministically after pause, restart, direct seeking, and playback-speed changes.

The purpose is not to create a dogfighting game. The purpose is to establish a reusable authored pattern for aircraft entry, role differentiation, non-fatal damage, covering behavior, coordinated withdrawal, visibility at map boundaries, and persistent-in-time but non-persistent-in-space effects.

## 2. Read before implementation

Read these files completely before changing source code:

1. `AGENTS.md`
2. `ITERATION_PLAN.md`
3. `changelog.md`
4. `assets/map/map-spec.yaml`
5. `assets/map/map-layout.svg`
6. `assets/scenario/scenario-spec.yaml`
7. `assets/scenario/scenario-timeline.md`
8. `assets/vehicle/Su-30MKK/su-30mkk.yaml`
9. `assets/vehicle/Su-30MKK/Sukhoi_Su-30_3-view_line_drawing.svg`
10. `assets/vehicle/Su-30MKK/HA9554-list-1-01.jpg`
11. `assets/vehicle/F-35B/f-35b.yaml`
12. the existing F-35B reference images relevant to the current model
13. the current aircraft types, absolute-time derivation, authored flight paths, motion tests, rendering, effects, UI, and camera code
14. the complete Stage 4B and Stage 4B.2A ground-vehicle implementation and tests
15. the current unified timeline and event-type implementation

The authoritative map, scenario, and vehicle files are design references. Do not rewrite those reference assets during this task.

If implementation details conflict, use this order of authority:

1. `AGENTS.md` and the hard human-visibility constraint;
2. this Stage 4B.2B prompt and its explicit scope;
3. authoritative scenario, map, and vehicle references;
4. completed-stage behavior documented in `changelog.md`;
5. existing implementation details.

## 3. Hard product constraints

Do not introduce:

- player-controlled aircraft;
- scoring;
- mission success or failure gameplay loops;
- multiplayer;
- generalized autonomous AI agents;
- dogfight AI;
- autonomous target selection;
- nondeterministic combat outcomes;
- visible humans;
- pilots;
- ground crews;
- ejection sequences;
- parachuting personnel;
- casualties;
- humanoid silhouettes;
- visible cockpit occupants.

All activity must be communicated through aircraft, formation geometry, relative motion, control surfaces where appropriate, navigation lights, engine presentation, vapor, smoke, sparks, damage, terrain, infrastructure, and existing battlefield effects.

Both Su-30MKK canopies must remain dark, opaque, or strongly reflective. They must never reveal seats, faces, helmets, bodies, or occupant silhouettes.

## 4. Explicit stage boundary

Implement only:

- the minimum aircraft-state architecture required for a second aircraft family;
- exactly two Su-30MKK aircraft;
- their T+104 entry;
- a brief authored pressure/support interaction with the existing F-35B formation;
- the T+137 non-catastrophic damage and breakaway of `defender_su30_01`;
- the T+142 covering pass and withdrawal of `defender_su30_02`;
- the T+170 air-activity egress transition;
- the minimum effects, camera, UI, timeline, and tests required to read this sequence.

Do not implement:

- the support or rescue convoy;
- fire engines, engineering trucks, recovery vehicles, or logistics trucks;
- a second Pantsir-S1 relocation, engagement, or destruction sequence;
- LCAC movement, beaching, or ramps;
- LAV-25 deployment;
- the complete amphibious operation;
- additional Su-30MKK aircraft;
- additional F-35B aircraft;
- new ground vehicles;
- generalized air-combat AI;
- a generalized aircraft mission planner;
- pursuit or interception pathfinding;
- generalized weapon employment;
- a full radar or sensor simulation;
- a full aerodynamic or flight-control simulation;
- environmental realism expansion;
- vegetation, coastal-wave, weathering, or clutter passes;
- audio.

Do not add placeholder implementations for excluded actors.

Do not extend the current 172-second simulation duration. The authoritative scenario continues to T+180, but that extension belongs to a later integration stage.

## 5. Preserve completed aircraft behavior before extending it

Stage 4B.2A is complete in commit history and in `changelog.md`.

Before changing aircraft architecture, understand the existing behavior and tests in:

- `src/simulation/derive.ts`;
- `src/simulation/aircraftMotion.test.ts`;
- `src/simulation/weapons.ts`;
- `src/simulation/weapons.test.ts`;
- `src/simulation/types.ts`;
- `src/scene/vehicles/F35BModel.tsx`;
- `src/scene/BattlefieldScene.tsx`;
- `src/scene/camera/CameraRig.tsx`;
- `src/ui/SimulationHud.tsx`.

Preserve:

- both F-35B STOVL launch sequences;
- every completed F-35B weapon release and impact;
- the exact Stage 4B.2A T+90 primary-F-35 handoff;
- the T+154.5 lower-bay release and T+158 T-72B impact;
- the completed late primary-F-35 support pass;
- the existing secondary-F-35 path;
- current F-35 speed, acceleration, turn-rate, bank, and pose/path-alignment test envelopes;
- all F-35 camera presets and paused-camera behavior.

Do not move an existing F-35 merely to make the Su-30MKK choreography easier. Author the defender paths around the completed F-35 tracks.

Refactor only where the second aircraft family genuinely requires it.

## 6. Aircraft architecture requirements

### 6.1 Avoid forcing Su-30MKK into F-35B-specific state

The current aircraft state was designed around carrier-launched F-35Bs and includes STOVL-specific concepts such as:

- launch time;
- on-deck state;
- lift-fan doors;
- rear-nozzle deflection;
- landing-gear retraction;
- downwash.

Do not assign meaningless STOVL values to the Su-30MKK merely to fit the current interface.

Prefer a small discriminated aircraft-state design, for example:

- a common airborne-motion base;
- an F-35B state containing existing STOVL mechanics;
- a Su-30MKK state containing entry, role, condition, outcome, visibility, engine, and damage presentation.

Exact type names may differ, but the result must remain type-safe and readable.

Do not build a universal aircraft framework, entity-component system, mission-planning engine, or behavior tree.

### 6.2 Keep actor-specific lifecycle dimensions separate

The Su-30MKK implementation must distinguish at least:

#### Activity phase

- `off-map`;
- `entering`;
- `pressuring`;
- `supporting`;
- `damaged-breakaway`;
- `covering-withdrawal`;
- `withdrawing`;
- `egressing`;
- `exited`.

Exact names may differ if a clearer actor-specific type is used.

#### Physical condition

- `operational`;
- `damaged`.

Do not imply that either Su-30MKK is destroyed.

#### Outcome

- `active`;
- `survived`.

`defender_su30_01` survives in a damaged condition. `defender_su30_02` survives intact.

#### Visibility or map-presence state

The state must clearly represent whether an aircraft is:

- outside the modeled scene;
- crossing the map boundary;
- active over the modeled battlefield;
- leaving the immediate battlefield;
- beyond the renderable area.

Do not use object mounting history to decide visibility.

### 6.3 Domain-specific event types

Do not keep expanding a ground-vehicle event type with unrelated air-reinforcement fields.

Add a dedicated Stage 4B.2B event ID and event shape, or an equivalently clear domain-specific structure, for:

- `su30_reinforcement_entry`;
- `su30_01_damaged`;
- `su30_02_cover_withdrawal`;
- `aircraft_egress`.

Integrate those events into the unified chronological event list without changing completed event IDs or times.

### 6.4 Keep new derivation modular

Do not place the entire Su-30MKK lifecycle inside the already large general `derive.ts` file.

Prefer a focused pure module for:

- authored Su-30 paths;
- flight sampling;
- per-aircraft lifecycle derivation;
- damage derivation;
- group state and counts;
- test-facing path sampling where useful.

The top-level simulation derivation may integrate the result, but it should not become the home for all Su-30-specific data and logic.

### 6.5 Absolute-time reconstruction

Every Su-30MKK property must derive from absolute simulation time and authored data.

This includes:

- visibility;
- activity phase;
- physical condition;
- outcome;
- position;
- velocity;
- heading;
- pitch;
- bank;
- speed;
- acceleration;
- turn rate;
- formation role and offset;
- engine presentation;
- navigation-light state;
- vapor intensity;
- damage flash and sparks;
- smoke intensity and trail position;
- exit state.

Requirements:

- direct seeking backward and forward reconstructs identical state;
- restart returns both aircraft to the invisible off-map state;
- playback speed does not change any outcome;
- no behavior depends on rendered-frame count;
- no mutable pursuit or flight AI state accumulates across frames;
- no random outcome is introduced;
- any procedural visual variation uses a fixed deterministic seed;
- no smoke, sparks, vapor, or damage survives after seeking before its event;
- both aircraft reconstruct identically after seeking away and back.

## 7. Su-30MKK model contract

Create one reusable procedural Su-30MKK visual component based on `assets/vehicle/Su-30MKK/su-30mkk.yaml` and its two reference images.

Use real map scale:

- length: `21.94 m`;
- wingspan: `14.7 m`;
- height: `6.36 m`;
- forward axis: negative Z;
- up axis: positive Y;
- centered origin.

The recognizable silhouette must include:

- a long pointed nose;
- an elongated dark two-seat canopy;
- a broad blended centerbody and wing-root area;
- two large swept trapezoidal wings;
- two box-like underslung intake openings;
- two widely separated engine nacelles;
- two distinct rear exhausts;
- a visible central channel between the engines;
- a central tail boom extending behind the exhausts;
- two near-vertical tail fins;
- two broad horizontal stabilizers.

Avoid:

- a compact F-35-like silhouette;
- a single centerline engine or exhaust;
- engine nacelles merged without a central gap;
- a single vertical tail;
- strongly outward-canted stealth-fighter tails;
- canards ahead of the main wings;
- ending the airframe at the engine exhausts;
- an open or transparent occupied cockpit;
- visible pilots or crew silhouettes.

The Su-30MKK is substantially larger and longer than the F-35B. This difference must be readable in comparable camera views.

Use shared geometry and materials across both aircraft. Mirrored wings, intakes, engines, stabilizers, and tails must not create unnecessary unique resources.

The model should be recognizable from the air-reinforcement focus view without becoming a CAD-level asset project.

## 8. Authoritative roster contract

Implement exactly two aircraft:

1. `defender_su30_01`
   - faction: `island_defender`;
   - vehicle type: `Su-30MKK`;
   - role: late defensive support and brief interception pressure;
   - final state: damaged and withdrawing or exited;
   - outcome: survived.

2. `defender_su30_02`
   - faction: `island_defender`;
   - vehicle type: `Su-30MKK`;
   - role: supporting position followed by covering withdrawal;
   - final state: intact and withdrawing or exited;
   - outcome: survived.

Do not add randomized callsigns, replacements, respawns, or extra aircraft.

Both aircraft begin outside the modeled northeast airspace and use the authoritative entry reference:

- off-map zone: `offmap_defender_air_northeast`;
- entry point XZ: `[7000, 4200]`;
- inbound heading: `225°`;
- entry path: `path_defender_air_entry`.

Their withdrawal uses:

- path: `path_air_egress_southwest`;
- intended off-map exit point XZ: `[-7000, -4200]`;
- outbound heading: `225°`.

## 9. Authored flight-path contract

### 9.1 Entry path

Use the authoritative entry XZ waypoints:

1. `[7000, 4200]`;
2. `[5500, 3500]`;
3. `[3500, 3000]`;
4. `[2000, 2500]`.

Choose restrained explicit altitude and timing keyframes that:

- keep the aircraft clearly airborne above terrain and infrastructure;
- make the entry visible but not dominant over the active industrial destruction;
- preserve plausible fighter speeds;
- avoid identical formation paths;
- avoid collision or near-overlap between the two Su-30MKK aircraft;
- avoid collision or implausibly close intersection with either F-35B;
- lead naturally into the brief pressure/support roles.

### 9.2 Role differentiation

Do not render the two Su-30MKK aircraft as one rigid duplicated formation.

`defender_su30_01` must:

- take the more forward and assertive path;
- briefly pressure the departing F-35B formation;
- remain close enough in composition for the interaction to read;
- avoid a prolonged tail chase or orbit;
- transition naturally into the T+137 breakaway.

`defender_su30_02` must:

- remain laterally and vertically offset;
- support rather than mirror the first aircraft;
- avoid synchronized turns and identical timing;
- retain enough spatial position to perform the T+142 covering pass;
- follow the damaged aircraft out rather than continue fighting alone.

Use authored paths and timed keyframes. Do not add pursuit AI.

### 9.3 Egress path

Use the authoritative southwest egress XZ waypoints as the intended route:

1. `[2000, 2000]`;
2. `[0, 0]`;
3. `[-3000, -2000]`;
4. `[-7000, -4200]`.

The damaged aircraft should lead the withdrawal after T+137. The intact aircraft should cross into a covering position at T+142, then settle into a separated escorting or trailing relationship.

The two paths must not be identical. Use restrained offset, altitude, and timing differences while maintaining a coherent common direction.

The aircraft may become invisible only after they cross a clearly defined render boundary or complete an authored exit transition. Do not simply remove them at T+137, T+142, or T+170.

### 9.4 Motion quality

Use or extract the existing velocity-continuous authored-flight-path approach.

Requirements:

- actual position paths must be continuous;
- velocity must not jump at event boundaries;
- visible heading must follow the true path tangent;
- bank must respond to authored turn direction;
- pitch must remain restrained and coherent with climb or descent;
- speed, acceleration, turn rate, and bank must be bounded and tested;
- do not hide a sharp path kink by smoothing only the rendered yaw;
- do not teleport at the map boundary;
- do not let either aircraft fly backward or slide sideways;
- direct seeking must reconstruct the identical pose and kinematics.

Target a plausible cinematic fighter envelope rather than a flight simulator. Document and test the actual limits selected. As a starting range:

- ordinary speed: approximately `170–330 m/s`;
- bank: generally below `50°`;
- heading rate: generally below `30°/s`;
- altitude: high enough to clear all terrain with a comfortable deterministic margin.

These are upper guidance values, not permission to maximize every maneuver.

## 10. Exact event and state contract

Use these official scenario events and exact boundaries.

### Before T+104

- both Su-30MKK aircraft are outside the modeled scene;
- neither aircraft is rendered over Ash Harbor;
- no Su-30 engine glow, navigation light, vapor, smoke, spark, or damage effect is visible;
- both are operational, with active authored outcomes not yet resolved;
- existing F-35B, naval, industrial, BTR-80, and T-72B behavior remains unchanged.

### T+104 — `su30_reinforcement_entry`

- entities: `defender_su30_01` and `defender_su30_02`;
- event: `enter_map_from_defending_airspace`;
- path: `path_defender_air_entry`;
- both cross into the modeled northeast airspace;
- the entry reads as a functioning external defender response;
- no runway or airfield is added to the map.

T+103.9 must remain pre-entry. T+104 has reached the official entry event.

### T+104 to T+137

- `defender_su30_01` moves into a brief pressure/interception role;
- `defender_su30_02` remains in a supporting offset position;
- their paths remain distinct;
- they do not begin a prolonged dogfight;
- they do not orbit indefinitely;
- no new official weapon event is invented;
- F-35B paths and completed strikes remain unchanged.

The interaction should be readable through relative geometry, direction, bank, spacing, and timing rather than through autonomous combat logic.

### T+137 — `su30_01_damaged`

- entity: `defender_su30_01`;
- event: `take_damage_and_begin_withdrawal`;
- path: `path_air_egress_southwest`;
- resulting state: `damaged_and_egressing`;
- physical condition becomes damaged;
- outcome becomes survived;
- the aircraft stops pressing the F-35B formation;
- it performs a forceful but continuous break toward the southwest egress route;
- it begins trailing light damage smoke;
- it does not explode, crash, eject, or disappear.

T+136.9 must show the aircraft operational with no damage residue. T+137 begins the official damage and breakaway state.

### T+137 to T+142

- `defender_su30_01` continues its damaged withdrawal;
- `defender_su30_02` repositions to cover the withdrawal;
- the intact aircraft does not remain in a passive duplicated formation;
- spacing remains safe and visually legible;
- smoke from the damaged aircraft remains light enough that the model silhouette is visible.

### T+142 — `su30_02_cover_withdrawal`

- entity: `defender_su30_02`;
- target/covered entity: `defender_su30_01`;
- event: `brief_covering_pass_for_defender_su30_01`;
- path: `path_air_egress_southwest`;
- the intact aircraft performs one brief authored covering maneuver;
- it then turns away and follows the damaged aircraft out;
- it does not continue fighting alone;
- its condition remains operational;
- its outcome becomes survived.

T+141.9 remains pre-cover. T+142 begins the official covering-withdrawal behavior.

### T+142 to T+170

- both Su-30MKK aircraft withdraw southwest;
- the damaged aircraft retains light smoke and restrained asymmetric engine/damage presentation;
- the intact aircraft maintains a distinct covering or trailing offset;
- neither aircraft returns to combat;
- no additional weapon, hit, or explosion is introduced;
- existing ground and naval events continue underneath the air withdrawal.

### T+170 — `aircraft_egress`

- entities include both existing F-35Bs and both Su-30MKK aircraft;
- event: `main_air_combat_activity_exits_scene`;
- the official event communicates the end of the primary air activity;
- both Su-30MKK aircraft are already withdrawing or crossing out of the immediate battlefield;
- the F-35B paths remain those completed in Stage 4B.2A;
- do not snap any aircraft to the southwest boundary at this event;
- do not require all four aircraft to share one exact exit point if their completed paths do not support it;
- the event may mark an egress phase while physical motion continues through T+172.

### T+170 to T+172

- primary air activity visibly recedes;
- both Su-30MKK aircraft continue outbound or become hidden only after a real authored boundary crossing;
- `defender_su30_01` remains damaged and survived;
- `defender_su30_02` remains operational and survived;
- no crash or ejection occurs;
- no global freeze occurs at T+172.

## 11. Damage causality and presentation

The authoritative `su30_01_damaged` event deliberately does not name a source actor, weapon, or projectile.

Do not invent an official shooter, missile launch, kill credit, or additional timeline event.

Stage the existing F-35B and Su-30MKK paths so the damage is understandable as the result of the brief airborne engagement, but keep the formal cause unspecified.

At T+137, use a restrained non-catastrophic damage onset:

- a compact contact flash on or near one engine/nacelle area;
- a short burst of sparks;
- a small number of deterministic fragments if needed;
- a brief localized glow;
- a forceful but continuous attitude break;
- light gray-to-dark smoke from one aft engine area;
- subtle asymmetric exhaust intensity or minor surface damage;
- no large fireball;
- no detached wing;
- no engine separation;
- no uncontrolled spin;
- no terrain impact;
- no ejection.

The damage effect must be actor-attached and reconstructed from the aircraft's absolute T+137 pose and later path.

Smoke must trail in world space behind the moving aircraft. It must not rotate as a rigid solid tube with the model, accumulate forever, or remain at future positions after a backward seek.

After the brief flash and sparks expire, the damaged condition must remain readable through smoke, surface darkening, asymmetric exhaust, and flight behavior.

## 12. Engine, vapor, and aircraft presentation

### 12.1 Engine presentation

Both Su-30MKK aircraft have two distinct engines.

Requirements:

- two separate exhaust locations;
- restrained engine glow appropriate to dawn;
- bounded heat-haze or exhaust presentation;
- no oversized science-fiction afterburner flames;
- damage may reduce or alter one exhaust after T+137;
- engine effects derive from absolute state and do not create per-frame resources.

### 12.2 Navigation and formation readability

Restrained navigation or anti-collision lights may help reveal formation geometry at dawn.

If used:

- keep them small and physically attached;
- derive blink phase from absolute time;
- do not use random timers;
- do not overpower the aircraft silhouette;
- remove them correctly when the aircraft is off-map or exited.

### 12.3 Vapor

Use vapor only where it improves motion readability.

Acceptable examples:

- brief wing-root vapor during stronger turns;
- short condensation wisps during the covering maneuver;
- restrained high-altitude trails if appropriate.

Do not create persistent white ribbons across the whole map. Vapor must be bounded, deterministic, and subordinate to the aircraft.

## 13. Formation and interaction readability

The airborne reinforcement should read as purposeful but short-lived.

Requirements:

- the two Su-30MKK aircraft enter with clear separation;
- their roles differ before T+137;
- the damaged aircraft visibly abandons pressure after T+137;
- the second aircraft crosses or banks into a cover position around T+142;
- both subsequently commit to withdrawal;
- the covering maneuver does not resemble a collision course;
- the sequence does not become a circling dogfight;
- aircraft remain large enough in at least one camera view to identify their silhouettes;
- wide views should still preserve the scale of Ash Harbor.

Do not fake interaction using only HUD text. The relative aircraft movement must communicate the event visually.

## 14. Camera requirements

Preserve all existing spectator controls and camera presets.

Add at most one new preset:

- label: `Air reinforcement` or `Su-30 focus`;
- before T+104: frame the northeast entry boundary without showing nonexistent aircraft;
- T+104 to T+137: follow a stable group anchor that keeps both Su-30MKK aircraft readable when possible;
- around T+137: keep the damaged aircraft and at least part of the interaction geometry visible;
- around T+142: show the covering pass without a sudden target jump;
- after T+142: follow a stable withdrawal anchor or the damaged aircraft while retaining the intact escort where practical;
- derive camera targets from absolute state rather than accumulated camera history.

The camera must not jump when the group changes from entry to damage to withdrawal.

Do not add automatic cinematic cuts.

Free orbit, pan, and zoom must remain usable while paused.

The existing F-35B, BTR, T-72B, harbor, industrial, Radar Hill, beach, Wasp, Talwar, and Molniya views must remain functional.

## 15. UI and timeline requirements

Add only the minimum UI required to communicate the new airborne sequence.

Requirements:

- add the four official air events to the unified timeline in chronological order;
- keep total duration at 172 seconds;
- label the current milestone as `Stage 4B.2B` or `Airborne defender reaction`;
- display concise status for both Su-30MKK aircraft or their group;
- preserve existing F-35B, BTR-80, and T-72B status;
- preserve play, pause, restart, seek, and playback-speed controls;
- avoid making the HUD taller than common viewport heights;
- preserve the Stage 4B.2A camera-panel overflow fix;
- do not claim that Pantsir 02, the support convoy, LCAC, LAV-25, the full operation, or aftermath mode is implemented.

Useful status language includes:

- `off-map`;
- `2 entering`;
- `1 pressuring / 1 supporting`;
- `1 damaged withdrawing / 1 covering`;
- `2 withdrawing`;
- `2 egressing` or `2 exited`.

Use the exact official event IDs and times:

- `su30_reinforcement_entry` at T+104;
- `su30_01_damaged` at T+137;
- `su30_02_cover_withdrawal` at T+142;
- `aircraft_egress` at T+170.

## 16. Performance and resource rules

This stage adds two aircraft and bounded attached effects. Preserve the existing browser-performance discipline.

Requirements:

- share Su-30MKK geometry and materials across both aircraft;
- reuse bounded effect primitives where appropriate;
- do not allocate new Three.js geometry or materials every frame;
- do not append unbounded smoke or trail history;
- calculate trail samples analytically from absolute time over a bounded time window;
- avoid simulation-frequency React reconciliation for static model subtrees;
- dispose only resources owned by the component that created them;
- keep shadows restrained and intentional;
- do not add a dependency for modeling, flight paths, state, or effects.

## 17. Preserve existing systems

Do not regress:

- deterministic pause, play, restart, and direct seeking;
- 0.5×, 1×, and 2× playback;
- Stage 1 F-35B launch and Radar Hill engagement;
- Stage 2 terrain, harbor, industrial, corridor, beach, and naval construction;
- Stage 3 Talwar damage, flooding, and persistent harbor effects;
- Stage 3 Molniya departure, damage, wake, and open-water state;
- Stage 3 industrial and ammunition destruction;
- Stage 4A terrain remap, fuel disaster, and F-35 motion quality;
- Stage 4B BTR support, loss, and withdrawal;
- Stage 4B.2A T-72B reinforcement, lead loss, reverse withdrawal, effects, camera, and UI;
- the T+154.5 F-35B weapon release and T+158 impact;
- persistent damage reconstruction;
- spectator camera control while paused;
- the hard prohibition on visible humans.

Do not rewrite completed ground, naval, industrial, or F-35 effects merely for stylistic consistency with the new aircraft effects.

## 18. Required tests

Add focused tests for Stage 4B.2B and preserve the complete existing suite.

### 18.1 Roster and model data

Verify:

- exactly two Su-30MKK aircraft exist;
- IDs are `defender_su30_01` and `defender_su30_02`;
- both belong to `island_defender`;
- both use vehicle type `Su-30MKK`;
- dimensions match the authoritative specification;
- final authored outcomes are damaged survivor and intact survivor respectively;
- no third Su-30MKK exists.

### 18.2 Exact state boundaries

Test at least:

- T+0;
- T+103.9;
- T+104;
- T+104.1;
- T+120;
- T+136.9;
- T+137;
- T+137.1;
- T+141.9;
- T+142;
- T+142.1;
- T+169.9;
- T+170;
- T+170.1;
- T+172.

Verify exact entry, damage, covering-withdrawal, and egress boundaries.

### 18.3 Lifecycle and outcomes

Verify:

- both aircraft are off-map and not rendered before T+104;
- the first aircraft presses while the second supports before damage;
- only `defender_su30_01` becomes damaged at T+137;
- `defender_su30_01` stops pressing and begins withdrawal at T+137;
- `defender_su30_02` begins covering withdrawal at T+142;
- both are withdrawing or egressing by T+170;
- neither is destroyed;
- no crash or ejection state exists;
- off-map or exited visibility is deterministic.

### 18.4 Deterministic reconstruction

Verify:

- repeated derivation at the same time is identical;
- late-to-early-to-late seeking reconstructs identical state;
- restart restores both aircraft to the off-map undamaged state;
- 0.5×, 1×, and 2× playback reach identical state at the same absolute time;
- flash, sparks, vapor, smoke, damage, and trail state do not leak backward through time;
- the damage trail reconstructs identically without stored frame history.

### 18.5 Motion quality

Sample densely across T+103 to T+172 and verify:

- continuous position and velocity at every authored keyframe and event boundary;
- bounded speed;
- bounded acceleration;
- bounded heading rate;
- bounded bank;
- visible heading aligned with the true path tangent;
- restrained pitch aligned with climb or descent;
- no backward flight or sideways sliding;
- safe separation between both Su-30MKK aircraft;
- safe separation from both F-35Bs;
- role paths are visibly different rather than fixed duplicates;
- terrain-clearance margin remains positive throughout;
- both egress paths progress southwest after their respective withdrawal transitions.

### 18.6 Damage presentation

Verify:

- damage intensity is zero at T+136.9;
- initial flash and sparks begin at T+137;
- transient damage effects decay over bounded durations;
- light smoke persists while the damaged aircraft remains present;
- smoke originates from the correct aft engine area;
- only `defender_su30_01` receives the damaged material/exhaust state;
- no future smoke samples appear after a backward seek;
- the damaged aircraft remains controllable and follows the egress path.

### 18.7 Timeline integration

Verify:

- all four Stage 4B.2B events exist exactly once;
- the unified event list remains chronologically sorted;
- `aircraft_egress` includes both F-35Bs and both Su-30MKK aircraft without changing completed F-35 poses;
- the simulation duration remains 172 seconds;
- existing Stage 1 through Stage 4B.2A event IDs and times remain unchanged.

### 18.8 Regression

Verify:

- all existing tests remain green;
- completed F-35 path samples remain unchanged;
- completed F-35 weapon release and impact positions remain unchanged;
- BTR-80 and T-72B states remain unchanged at representative times;
- no excluded actor is added to the world state or scene.

Do not weaken existing assertions merely to make an architectural refactor pass.

## 19. Browser inspection matrix

Use an actual browser against the running development application. Do not rely only on unit tests or source inspection.

Inspect at minimum:

### T+0 and T+103.9

- no Su-30MKK is visible over the modeled battlefield;
- no Su-30 effect residue exists;
- all completed systems remain correct;
- the air-reinforcement camera frames an empty entry sector without exposing invalid geometry.

### T+104 to T+115

- both aircraft cross the northeast boundary continuously;
- scale and silhouette are recognizable;
- engines, twin tails, twin nacelles, and central tail boom read correctly;
- canopies reveal no occupants;
- formation spacing and role offsets are clear;
- entry remains subordinate to major existing events.

### T+115 to T+136.9

- `defender_su30_01` visibly pressures the departing F-35B formation;
- `defender_su30_02` remains supportively offset;
- no prolonged dogfight or repeated orbit appears;
- there are no aircraft collisions or implausibly close passes;
- F-35B paths and completed weapon events remain correct.

### T+137

- damage onset is attached to `defender_su30_01`;
- the flash and sparks are compact;
- there is no large explosion;
- no wing or engine detaches;
- no pilot or ejection appears;
- the aircraft begins a forceful but continuous breakaway;
- `defender_su30_02` remains intact.

### T+137 to T+141.9

- the damaged aircraft continues withdrawing with light smoke;
- the smoke follows the moving aircraft correctly;
- the intact aircraft repositions to cover;
- silhouettes remain visible through the effects.

### T+142

- the covering pass is visually distinct from prior supporting flight;
- the camera does not jump between aircraft;
- the second aircraft does not remain to fight alone;
- both paths transition toward coherent withdrawal.

### T+142 to T+169.9

- both aircraft withdraw southwest with distinct offsets;
- light damage smoke persists without becoming an unbounded ribbon;
- the damaged aircraft remains under control;
- no new engagement or weapon effect appears;
- ground, industrial, naval, BTR, and T-72 events continue correctly.

### T+170 to T+172

- primary air activity visibly recedes;
- egress occurs through continuous physical motion;
- no aircraft teleports or disappears in the middle of the map;
- aircraft become hidden only after a real authored exit boundary if reached;
- final damaged/intact survivor states are correct.

### Seek and control checks

- seek from T+170 back to T+103.9;
- seek forward to T+104, T+137, T+142, and T+170;
- seek away from and back to the damaged smoke trail;
- restart;
- test pause and play;
- test 0.5×, 1×, and 2× playback;
- orbit, pan, and zoom while paused;
- inspect all aircraft follow views;
- inspect BTR, T-72B, harbor, industrial, Radar Hill, beach, Wasp, Talwar, and Molniya views;
- verify the HUD and camera panel fit at a shorter viewport height;
- inspect the final browser console for errors.

Watch the complete T+103 to T+150 airborne sequence continuously at 1× at least once. Boundary screenshots alone are insufficient to judge formation roles, damage breakaway, covering motion, and smoke behavior.

Also watch T+149 to T+166 once to verify that the new air activity does not obscure or regress the completed T-72B sequence.

Fix obvious issues discovered during inspection.

## 20. Update project documentation

Update only the relevant roadmap and changelog sections after implementation is complete and validated.

### `ITERATION_PLAN.md`

Preserve:

- Stage 4B — `COMPLETE`;
- Stage 4B.2A — `COMPLETE`.

Update:

#### Stage 4B.2B — Limited Airborne Defender Reaction

- status `COMPLETE` only after this task and validation succeed;
- two Su-30MKK aircraft;
- T+104 entry;
- brief pressure and support roles;
- T+137 damaged survivor breakaway;
- T+142 covering withdrawal;
- T+170 air-activity egress;
- deterministic aircraft-state and visual validation;
- no generalized air-combat AI.

Keep planned:

#### Stage 4B.2C — Support and Rescue Convoy

- six simple support vehicles;
- firefighting, engineering, recovery, and logistics response;
- obstruction, failed approach, and partial withdrawal;
- no visible personnel.

Keep Stage 4C, Stage 5, Stage 6, and unrelated completed-stage descriptions intact.

### `changelog.md`

Append a concise Stage 4B.2B completion record covering:

- aircraft architecture changes;
- exact roster and outcomes;
- entry, role, damage, covering, and egress paths;
- Su-30MKK model contract;
- damage and smoke presentation;
- camera and UI changes;
- validation and browser inspection;
- remaining Stage 4B.2C, Stage 4C, and Stage 5 limitations.

Do not claim completion before validation succeeds.

## 21. Validation under repository rules

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

Avoid unrelated formatting churn or broad refactors.

## 22. Final response requirements

When complete, report:

1. the aircraft-state architecture changes made for the second aircraft family;
2. how all completed F-35B behavior and paths were preserved;
3. the exact two Su-30MKK IDs, roles, conditions, and final outcomes;
4. how the authoritative northeast entry and southwest egress paths were authored;
5. how pressure, support, damaged breakaway, covering withdrawal, and egress are represented;
6. the exact T+104, T+137, T+142, and T+170 event implementation;
7. Su-30MKK model scale and silhouette details;
8. speed, acceleration, heading, pitch, bank, separation, and terrain-clearance behavior;
9. damage flash, sparks, smoke, asymmetric engine presentation, and deterministic reconstruction;
10. camera and UI changes;
11. timeline, `ITERATION_PLAN.md`, and `changelog.md` changes;
12. TypeScript, lint, test, and whitespace-check results;
13. browser inspections performed and issues corrected;
14. remaining limitations before Stage 4B.2C, Stage 4C, and Stage 5.

Do not claim that a shooter or weapon for `su30_01_damaged` was authored unless the authoritative scenario is explicitly revised.

Do not claim that Pantsir 02, the support convoy, LCAC, LAV-25, environmental realism, the full 180-second operation, or aftermath mode has been implemented.

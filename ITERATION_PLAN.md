# Cinderfront — Iteration Plan

## Project Goal

Cinderfront is a deterministic 3D battlefield diorama built with React, TypeScript, and Three.js / React Three Fiber.

The user observes the battlefield through a spectator camera and controls simulation time.

The project is not a player-controlled combat game.

Authoritative project data is maintained separately:

- `AGENTS.md` — repository-level hard constraints and working rules
- `assets/map/map-spec.yaml` — physical world geometry and layout authority
- `assets/map/map-layout.svg` — human-readable technical map reference
- `assets/scenario/scenario-spec.yaml` — scenario state and event authority
- `assets/scenario/scenario-timeline.md` — human-readable scenario narrative
- `assets/vehicle/Belligerents.yaml` — force ownership
- `assets/vehicle/**` — vehicle descriptions and visual references

The scenario and map specifications should not be casually rewritten during implementation stages.

## Current Sequencing Decision

Stages 4B, 4B.2A, 4B.2B, 4B.2C, 4C, 5A, 5B and 5C are COMPLETE. Parent Stage 5 is COMPLETE for the authored T+0–180 operation. Stage 6A landscape and Stage 6B indefinite aftermath are COMPLETE. Stage 6C and parent Stage 6 are COMPLETE for the agreed visual, scripted and bounded-aftermath scope, with fresh automated, visual, preservation and sustained resource acceptance. The 51 events, 24 camera IDs and complete active runtime remain exact. All eight LAVs are ashore by T+187.558071982 and the last formation hold begins at T+344.103063449. Current Stage 6C evidence is in `STAGE6C_ACCEPTANCE.md`; historical Stage 5C/6A/6B measurements remain dated below and in `STAGE5_INTEGRATION_READINESS.md`.

Current post-core delivery — 2026-10-28: **Stage 7A is COMPLETE**, with explicit local cadence/GPU limitations in [STAGE7A_ACCEPTANCE.md](STAGE7A_ACCEPTANCE.md). Bounded renderer preparation, lower first-play hitch/steady CPU cost, 707 passing tests, exact visual/runtime preservation, native context recovery and a fresh 600.0144 s 2× resource run pass. Short busy-window P95 still exceeds 33.3 ms and one unexplained 283.4 ms first-play gap remains; completion does not claim every aspiration passed. Stages 1–6 remain COMPLETE.

Historical preparation — 2026-10-25: the English `prompt.md` targeted **Post-Core Stage 7A — First-Use Readiness and Frame Pacing**, starting from completed Stage 6C commit `1bc6bdc`. Stage 7A was PLANNED. It addressed the explicitly recorded first-use stalls and frame-cadence limits at the accepted visual quality; Stages 1–6 remained COMPLETE. That preparation update changed documentation only and claimed no new performance result.

Historical preparation — 2026-10-24: the English `prompt.md` was prepared from completed Stage 6B commit `5f940b5` for Stage 6C camera framing, usable scene space, cohesive smoke/fire, HUD readability, water/material/contact improvements and measured rendering optimization. That preparation was documentation-only; the implementation and fresh verification are now recorded separately.

The intended sequence is:

1. complete the four-vehicle BTR-80 reaction slice in Stage 4B;
2. reuse the proven lifecycle for a limited set of additional actors in Stage 4B.2;
3. improve environmental storytelling and coastal realism in Stage 4C;
4. integrate the outstanding air-defense, amphibious operation, and full timeline through Stage 5A, Stage 5B, and Stage 5C;
5. refine the ground landscape in Stage 6A, implement indefinite aftermath in Stage 6B, and finish remaining camera/visual/performance work in Stage 6C.
6. harden first-use readiness and frame pacing in the separate post-core Stage 7A, preserving the completed visual/runtime scope.

This sequencing does not authorize generalized vehicle AI, pathfinding, emergent combat simulation, or nondeterministic outcomes. Movement and reactions remain authored and derived from absolute simulation time.

# Stage 1 — Core Runtime + Opening Vertical Slice

**Status:** COMPLETE

## Goal

Prove the complete technical loop before expanding battlefield content.

## Implemented Scope

- deterministic simulation runtime
- direct time seeking
- pause / play / restart
- 0.5× / 1× / 2× playback
- spectator camera
- camera presets
- low-detail Ash Harbor world shell
- Wasp-class ship
- two F-35B aircraft
- F-35B STOVL launch sequence
- Radar Hill
- Pantsir-S1
- fixed air-defense fire
- opening scenario from T+00:00 through T+00:48
- persistent destruction
- smoke, fire, debris, scorch marks
- deterministic reconstruction after seek
- timeline HUD
- simulation tests

## Stage 1 Preservation Rule

Future stages must not break:

- deterministic seeking
- restart correctness
- persistent destruction reconstruction
- camera control while paused
- the existing T+00:00–00:48 sequence

Stage 1 functionality becomes regression-critical infrastructure.

# Stage 2 — Full Ash Harbor World Construction

**Status:** COMPLETE

## Goal

Turn the existing low-detail world shell into the complete physical Ash Harbor battlefield before adding the later destruction sequences.

The completed world should already be visually convincing at T+00:00.

## Primary Scope

### Full terrain

Implement the authoritative 14 km × 10 km map with:

- continuous terrain rather than obvious testing terraces
- coastline
- harbor basin
- shallow and deep coastal water transitions
- Radar Hill ridge and slopes
- dry inland terrain
- dry washes / drainage
- rocky areas
- dunes
- coastal bluff structures
- industrial flatlands
- sparse vegetation

### Harbor District

Construct:

- harbor basin
- breakwaters
- navigation channel
- piers
- jetties
- major berths
- support berths
- warehouses
- maintenance areas
- cranes
- service roads
- pipelines
- utility infrastructure
- lighting infrastructure
- fencing
- small defensive infrastructure

### Fuel Storage District

Construct:

- fuel tanks
- tank groups
- containment berms
- pump infrastructure
- pipe racks
- pipelines
- transfer facilities
- service roads
- firebreak spacing
- utilities
- lighting
- harbor connections

### Ammunition Storage District

Construct:

- separated magazines
- bunkers
- protective berms
- loading areas
- internal roads
- logistics access
- safety spacing
- support structures

Fuel and ammunition areas must remain visually distinct.

### Radar Hill

Upgrade the Stage 1 implementation with:

- natural ridge geometry
- improved slope transitions
- access roads
- equipment platforms
- support structures
- communications infrastructure
- utilities
- fencing
- local vegetation

Preserve all existing Stage 1 radar and destruction behavior.

### Convoy Corridor

Construct:

- principal road
- branch roads
- chokepoint
- bridge / culvert
- dry wash
- service yard
- utility compound
- lay-bys
- roadside details
- sparse industrial remnants or quarry-like terrain where appropriate

### Remote Beachhead

Construct:

- deep-water transition
- shallow water
- intertidal zone
- beach
- dunes
- coastal scrub
- hard beach exit
- inland hardstand
- two distinct inland access paths
- minor abandoned shoreline infrastructure where appropriate

### Offshore Area

Maintain:

- open-water scale
- Wasp reference location
- believable horizon
- coastal haze
- naval staging space

### Naval assets

Create recognizable procedural models for:

- Talwar-class frigate
- Project 12418 Molniya missile boat

At Stage 2 they should remain in their initial scenario states.

Prepare them structurally for later:

- ship movement
- heading changes
- progressive list
- sinking / flooding
- damage attachment points
- fire attachment points
- smoke attachment points
- wake generation

Do not implement their later destruction or withdrawal events yet.

### Environmental vocabulary

Create reusable project-specific environment primitives where useful, such as:

- industrial tanks
- warehouses
- pipe racks
- pipelines
- piers
- jetties
- cranes
- blast berms
- fences
- utility poles
- lights
- road barriers
- rock clusters
- scrub
- dry grass
- bushes
- small trees
- dunes

Do not build a generic universal game-engine abstraction.

### Future environmental response support

Vegetation and lightweight environmental objects should be structured so Stage 3 can later apply localized explosion response.

Future effects will include:

- bending away from shock fronts
- spring-like rebound
- local ignition
- burning vegetation

Stage 2 does not implement those explosion responses yet.

# Stage 3 — Harbor + Industrial Hero Destruction

**Status:** COMPLETE

## Goal

Implement the major visual destruction language of Cinderfront.

## Scope

### Harbor

- Talwar first hit
- progressive deck fire
- second heavy hit
- progressive list
- flooding
- persistent smoke
- fuel leakage
- harbor contamination
- surface fuel fire
- final partially flooded state

### Molniya

- emergency departure
- harbor maneuvering
- acceleration
- nearby damage
- damaged withdrawal
- smoke trail
- survival into open water

### Industrial district

- transfer / pipeline ignition
- initial tank hit
- fuel-storage cascade
- ammunition cook-off
- ammunition primary detonation
- persistent industrial fire
- black smoke
- soot
- ground damage
- contamination

### Hero destruction system

Expand the Stage 1 effects architecture to support:

- ignition flash
- local illumination
- layered fireballs
- pressure / dust front
- ballistic debris
- flaming debris
- ember and flame trails
- local environmental response
- secondary ignition
- persistent ground fire
- persistent smoke
- scorch marks
- destroyed structures
- contamination

### Environmental response

Implement localized authored response around hero explosions:

- vegetation bends away
- vegetation rebounds
- lightweight structures react
- nearby grass / scrub may ignite
- response intensity varies with distance

Do not implement full global rigid-body or combustion simulation.

# Stage 4A — Cinematic Enhancement

**Status:** COMPLETE

## Goal

Improve terrain interpretation, aircraft motion, industrial scale, fuel-disaster presentation, and camera readability without changing Cinderfront's deterministic simulation model.

## Completed Scope

- stronger terrain relief while preserving authoritative shoreline and high-ground elevations
- shared terrain grounding for mainland geometry, overlays, roads, and industrial foundations
- restored authoritative fuel-tank scale
- denser functional industrial infrastructure with controlled draw-call cost
- expanded deterministic fuel-disaster escalation and persistent aftermath
- velocity-continuous F-35 flight paths, bounded turns, and more coherent banking
- retuned camera presets and improved aircraft follow views
- seek, restart, playback-speed, paused-camera, regression, and browser validation

## Stage 4A Preservation Rule

Future work must preserve:

- terrain and road grounding;
- authoritative industrial scale;
- the established T+78, T+86, and T+92 fuel-event anchors;
- persistent Stage 4A destruction;
- deterministic F-35 motion;
- camera control while paused.

# Stage 4B — Deterministic Battlefield Reaction Vertical Slice

**Status:** COMPLETE

## Goal

Prove one reusable deterministic ground-vehicle reaction workflow before adding more unit families.

Stage 4B is deliberately a narrow vertical slice. It prioritizes event causality, lifecycle reconstruction, and readable vehicle behavior over unit count or environmental expansion.

## Scope

- a small authored ground-vehicle lifecycle foundation
- separate activity phase, physical condition, and outcome state
- four BTR-80 vehicles with stable authored identities
- security hold and alert response
- road-following movement to a support position
- one persistent BTR-80 loss at T+133 as a delayed consequence of the existing T+132 ammunition detonation
- survivor reaction and three-vehicle withdrawal beginning at T+136
- deterministic position, heading, speed, wheel rotation, dust, damage, smoke, and wreck reconstruction
- direct-seek, restart, playback-speed, path, terrain-grounding, camera, and regression validation

## Explicit Boundary

Stage 4B does not include:

- T-72B reinforcement or losses;
- Su-30MKK activity;
- the support / rescue convoy;
- a second Pantsir-S1 sequence;
- generalized AI, pathfinding, traffic simulation, or collision-avoidance AI;
- environmental realism expansion;
- LCAC or LAV-25 activity;
- audio.

The surviving BTR-80 vehicles may still be withdrawing when the currently implemented timeline ends. Stage 4B must not extend the timeline merely to finish their route.

# Stage 4B.2A — Deterministic Armored Reinforcement Attempt

**Status:** COMPLETE

## Goal

Validate a second deterministic ground-vehicle family through one bounded armored reinforcement, air-strike loss, and fallback response.

## Completed Scope

- three T-72B reinforcement movement
- returning F-35B support strike
- one persistent lead-tank loss
- two-tank reverse / fallback response
- tracked-motion and deterministic reconstruction validation

# Stage 4B.2B — Limited Airborne Defender Reaction

**Status:** COMPLETE

## Completed Scope

- two Su-30MKK aircraft
- T+104 entry from the northeast on authored, deterministic paths
- brief pressure and support roles before the breakaway
- T+137 damaged survivor breakaway for `defender_su30_01`
- T+142 covering withdrawal for `defender_su30_02`
- T+170 air-activity egress through the southwest boundary
- deterministic aircraft-state, effects, camera, UI, and browser validation
- no generalized air-combat AI

# Stage 4B.2C — Support and Rescue Convoy

**Status:** COMPLETE

## Completed Scope

- exactly `defender_support_convoy_01`, containing `defender_support_fire_01`, `defender_support_engineering_01`, `defender_support_recovery_01`, `defender_support_fire_02`, `defender_support_logistics_01`, and `defender_support_logistics_02`
- two fire engines, one engineering truck, one recovery vehicle, and two logistics trucks; all six remain operational and become confirmed survivors at T+174
- real T+0 movement on the authoritative rescue branch just beyond the service yard's northwest corner, clear of the north barrier, maintenance shed, and reserve T-72Bs
- T+75 emergency redirect with continuous acceleration and deterministic emergency beacons
- T+108 reduced-visibility chokepoint response with staggered braking, separation, hesitation, and cautious restart
- T+125 unattributed secondary bridge hit, bounded effects, persistent scorch/rubble/edge damage, and a stopped approach without destroying the convoy or collapsing the bridge
- T+174 abandoned approach and partial withdrawal: lead holds, engineering/recovery reposition locally, and the rear three begin reversing; no completed retreat by the T+176 endpoint
- absolute-time support lifecycle, grounding, steering, signed wheel motion, lighting, dust, smoke, obstruction, and seek/restart reconstruction
- one support-convoy camera, concise phase/outcome HUD, accessible timeline endpoint, and bounded Tailwind utilities for touched UI
- bounded duration extension to T+176 while preserving the exact completed T+172 world and continuing established aircraft/naval movement
- TypeScript no-emit, full lint, 315 tests across 20 files, whitespace checks, and actual browser validation including continuous T+70–130 and T+170–176 playback at 1×
- no visible personnel or occupants; no generalized convoy AI

This remains an authored scenario. Do not introduce generalized AI or nondeterministic combat outcomes.

# Stage 4C — Environmental Storytelling and Coastal Realism

**Status:** COMPLETE

## Goal

Make Ash Harbor feel like a long-used coastal military and industrial location after the core reaction logic has been proven.

## Implemented Scope

- stable seeded pockets of dry grass, low scrub and grounded rock clumps: exposed Radar Hill outcrops, discontinuous corridor/wash growth, sheltered dune cover, and sparse harbor/industrial boundary growth
- six shared silhouette geometries/materials with regional instance bounds; static arrays remain independent of simulation time and spectator cameras
- batched, terrain-draped pavement repairs, compacted/gravel shoulders, directional tire/runoff marks, ammunition loading dust, old pump/transfer stains, and flat quay-edge salt deposits
- localized seam/streak corrosion and material roughness on intact industrial structures; aged concrete contact staining, with established charred wreck materials retained
- five small functional equipment clusters using shared sealed cabinets, pallets, cable/hose reels, spare pipes, closed bins, spare tires and stowed tow beams; no parked actors or visible personnel
- one continuous opaque sea surface at the unchanged -0.12 m mean level, with northeast harmonic normals, sheltered-harbor attenuation, feathered shallow/deep regional proxies, ragged broken beach foam and a terrain-draped wet sand edge
- water, foam, wetness and destruction-sensitive wear use absolute simulation-time uniforms; paused camera movement freezes phase, backward seeking reconstructs it, and restart reproduces T+0
- cooler ambient sky, directional warm horizon light and restrained coastal haze, retaining clear vehicle/aircraft silhouettes, smoke, fire, ship wakes and harbor pollution
- focused polygon/circle/buffered-path reservations for operational surfaces, complete existing BTR/T-72/support sweeps, bridge obstruction/reverse maneuvers, future LCAC approach/ramp space, both LAV access routes, beach apron and hardstand
- unchanged terrain height/grounding, actor derivations, routes, poses, weapon anchors, 40 scoped events, T+176 duration, 19 camera presets and controls; only the HUD stage label changed

## Validation and Measurements

- both TypeScript no-emit checks, lint (19 pre-existing warnings), all 335 tests across 22 files, and whitespace checks passed; immutable preservation fixtures and authoritative data were unchanged
- inspected all 19 camera presets, close quay/maintenance/yard/bridge/outcrop/dune/shore views, all required event checkpoints including T+172/T+176, desktop and 540 px high viewports, keyboard controls and paused orbit/pan/zoom
- continuously replayed quiet coastal water at 1×, fuel T+73–110, bridge T+123–133 and T-72 T+149–166; tested all three speeds, backward/forward seeks and restart
- actual GPU time stayed fixed during paused camera interaction; T+12 revisit and T+0 restart screenshots matched their reference hashes exactly
- matched before/after captures at 1280×720, DPR 1 on Apple M4/Chrome: Harbor T+0 went from 1,534 to 1,568 calls and 503,235 to 588,719 triangles; fuel T+109 went from 1,864 to 1,896 calls and 540,127 to 621,759 triangles; texture count stayed at 3 and sampled mean RAF intervals stayed near 16.7 ms
- after warmup, six complete camera/seek/restart cycles held at 1,066 geometries, 3 textures, 2,227 meshes and 131 cached shader programs in the same T+0 Harbor view; all 44 new mesh/geometry/material identities stayed stable
- local comparison captures, recordings, raw metrics and inspection scripts are in ignored `stage4c-review.local/`; full measurements and limitations are recorded in `changelog.md`

The water regions approximate visual depth/shelter rather than physical bathymetry. There is no wave displacement, buoyancy, tide, reflection system, vegetation sway or weather simulation. Procedural models/effects and existing terrain faceting remain. RAF measurements are display-capped indicators, not GPU timings; first-time shader compilation in development can briefly stall playback. No build or formatting command was run, and no repository dependencies or framework versions changed.

At Stage 4C delivery, Pantsir 02 and the amphibious/full-timeline slice were recorded as Stage 5 integration gaps. Stages 5A/5B/5C subsequently completed those actors and all 51 events through T+180. Indefinite aftermath remains Stage 6 work.

# Stage 5 — Full Operation Integration

**Status:** COMPLETE — scripted operation through T+180

## Goal

Complete the amphibious theater and integrate the full authoritative 180-second scenario after the ground-actor and environmental foundations are validated.

## Execution Rounds

All three rounds and full-operation verification are complete for the authored scripted operation. Stage 6 proceeds separately: 6A and 6B are complete; 6C remains planned.

### Stage 5A — Secondary Air-Defense Reaction and Landing Readiness

**Status:** COMPLETE

- exactly one new actor, `defender_pantsir_02`, at the corridor reserve
- T+112 short local relocation, stop, deployment/alignment, and brief authored engagement
- T+121 destruction attributed to existing `attacker_f35_01`, followed by persistent wreck/fire/smoke
- preserve all existing actor paths and outcomes, Stage 4C appearance, and the T+176 endpoint
- add the two missing Pantsir events, bringing the scoped event count from 40 to 42
- create `STAGE5_INTEGRATION_READINESS.md` covering event coverage, LCAC route/timing, deck packing, ramp/grounding, unloading, spatial reservations, and the Stage 5/6 endpoint boundary
- deterministic tests, immutable regression preservation, browser inspection, and concise camera/HUD integration

Completed 2026-10-09. `defender_pantsir_02` travels 18.653 m from [5450,-1745] to [5432,-1749.8] inside the existing eastern pull-off beside the trunk. Movement runs T+112–117.2, peaks at 6.726 m/s and 3.983 m/s², then deploys/aligns through T+118.8. Two fixed-sector defensive misses launch at T+119/T+119.6; the authoritative F-35B 01 terminal strike destroys the vehicle at exactly T+121, with the same fixed wreck/scorch/fire/bounded smoke through T+176. This is a local stop, not arrival at the distant junction. No incoming weapon trajectory or new Stage 3 weapon is modeled.

The actor has focused absolute-time state/types, optional shared-model wheel/steering/radar/stabilizer mechanics, a single `Pantsir 02` camera (20 total), and separate primary/secondary HUD status. Dense actual-model grounding/clearance, tube-origin/direction, exact-boundary and seek tests pass. Immutable fixtures retain every completed world field, old weapon and convoy value at 815 timestamps, plus Stage 4C layouts/samplers. Both no-emit TypeScript checks, lint (19 pre-existing warnings), all 365 tests across 27 files with `--maxWorkers=2`, and whitespace checks pass. Actual browser verification includes continuous T+110–124 at 1×, representative older replays, all cameras/speeds/controls, short HUDs and stable warmed resources across six repeated cycles. Review evidence is in ignored `stage5a-review.local/README.md`. No build, dependency change, reference edit or visible human was introduced.

### Stage 5B — LCAC Approach, Beaching, and Embarked Payload

**Status:** COMPLETE

- implement the approved nearer staging, revised final approaches and local shore grading; preserve official IDs and key event times, and measure actual motion/contact before claiming physically credible transit
- two LCACs, distinct approach choreography, deterministic fans/skirt/wake/spray, beach transition, and ramps
- four embarked LAV-25s per craft with stable carrier-local poses and safe deck packing
- add exactly five LCAC events, bringing the count from 42 to 47; retain T+176 and keep all eight LAV-25s embarked throughout this round
- preserve existing combat and environmental behavior

Stage 5A measured original raw waypoint lengths of 8,633.533 m west and 9,657.505 m east, requiring means of 191.856/185.721 m/s before acceleration/braking; route rounding barely changes those values. The original west shallow event also conflicted with the polygon, and the shore had a roughly 4.6–4.8 m vertical water/land edge. On 2026-10-09 the human explicitly approved nearer staging, revised final approaches and local shore slopes, retaining the key event times. The Stage 5B prompt supplied approximately 806.210/893.642 m seed routes and reinterpreted the T+140/T+148 events as final-nearshore gates; actual geometric shallow occupancy is sampled separately. That round's reference changes were limited to the associated staging/path/event wording, two local contact grades, reservations and visual masks. Stage 5B implementation and verification are complete; that choice was not reopened. Unloading and the T+180 endpoint were explicitly deferred to Stage 5C, and indefinite aftermath to Stage 6.

Completed 2026-10-14. Exactly `attacker_lcac_01` / `attacker_lcac_02` carry `attacker_lav_01`–`attacker_lav_08` in two stable four-vehicle groups. Shared procedural models retain 26.4 × 14.3 × 7.2 m LCAC and 6.39 × 2.50 × 2.69 m LAV anchors, safe two-by-two packing, closed hatches and sealed glazing. Smoothed routes measure 806.846 / 894.438 m; peak speeds are 26.468 / 24.541 m/s and acceleration/braking stays below 4.0 m/s². Two 2 m local grades support the complete rotated skirt/platform crossing; ramps start at 155/162 and are ready at 158.8/165.2. Cargo remains embarked through 176 with zero relative wheel travel/dust.

Only the approved staging/path/nearshore-code blocks, six map/SVG features and associated contact/mask treatment change. All prior actor/weapon values including Pantsir 02 and support convoy match the immutable 827-timestamp pre-edit baseline; original fixture bytes, global terrain axes, exterior heights, coastal samples, 3,574 cover instances, equipment and 404 wear records remain exact. One explicitly identified foam fragment is masked (38 → 37). The pre-existing Stage 5A fixture-format checksum mismatch is repaired by protecting both committed bytes and historical encoding without changing the fixture.

All 393 tests across 32 files, app/node no-emit TypeScript checks, lint (the same 19 existing warnings) and whitespace checks pass. Two additive LCAC presets yield 22 cameras; the HUD states that all eight payloads remain embarked. Browser evidence includes complete 1× approaches, close contact/ramp boundaries, pause/seek/restart/all speeds/keyboard/short HUD checks, every preset, representative older replays, matched render measurements and flat warmed resources across six cycles. Detailed evidence is in ignored `stage5b-review.local/README.md`. No build, dependency upgrade, broad source rewrite, new combat, unloading or visible humans were introduced.

### Stage 5C — LAV Deployment and Full Timeline Integration

**Status:** COMPLETE

- reuse the existing eight persistent LAV-25s, with staggered unloading, continuous carrier/ramp/ground transforms, and direct joins to the two inland roads
- T+160/T+166 unloading and T+176 inland-spread events
- complete authoritative event coverage through T+180, including `scripted_phase_complete`
- full three-minute deterministic playback and cross-theater regression/browser validation
- pause scripted playback at exactly T+180 with an explicit pending-Stage-6 aftermath status; retain free spectator controls and backward seeking

The implementation contract was prepared 2026-10-15 against Stage 5B commit `2a3fffc`. Start with per-group departure offsets [0,3,6,9] seconds in the existing front-left/front-right/rear-left/rear-right order. Solve wheel support against the actual deck, 0.12 m thick ramp and graded road surfaces, including finite-radius contact at the ramp toe. Leading vehicles must be clear and beginning inland advance in both groups at T+176; trailing vehicles may still be unloading at T+180. Report measured states rather than forcing all eight to complete the long inland roads.

Use short direct ramp-to-road paths. Clarify only the two LAV path blocks and matching landing narrative: retain the existing apron-to-beach connector coordinates as optional service data, distinguish their direction from the scripted direct joins, and keep all official event records unchanged. Preserve completed LCAC/contact behavior, environmental geometry and seeded layouts. The historical 2026-10-09 approval is not a new map-redesign authorization. Verified delivery on 2026-10-17 completes Stage 5C and parent Stage 5 for scripted operation; Stage 6 remains PLANNED.

Completed 2026-10-17. The original eight IDs retain their slots, group/origin carrier and operational outcome. Unloading uses the exact [0,3,6,9] stagger, two independent ramp lanes and direct joins to the existing 10 m roads. Finite-radius tire support covers the actual deck, hinge, panel top/traction strips, toe and uploaded ground, with full quaternion poses, bounded per-wheel suspension, signed wheel rotation and ground-only bounded dust. Every vehicle has one persistent render root.

| Persistent ID     | Depart T+ | First road tire T+¹ | Full ramp clear / full road entry T+ | At 176      | At 180      |
| ----------------- | --------: | ------------------: | -----------------------------------: | ----------- | ----------- |
| `attacker_lav_01` |       160 |             166.075 |                              168.591 | inland      | inland      |
| `attacker_lav_02` |       163 |             169.075 |                              171.591 | inland      | inland      |
| `attacker_lav_03` |       166 |             176.075 |                              178.591 | ramp        | inland      |
| `attacker_lav_04` |       169 |             179.075 |                              pending | deck        | ramp/ground |
| `attacker_lav_05` |       166 |             172.050 |                              174.558 | inland      | inland      |
| `attacker_lav_06` |       169 |             175.050 |                              177.558 | ramp/ground | inland      |
| `attacker_lav_07` |       172 |             pending |                              pending | deck        | ramp        |
| `attacker_lav_08` |       175 |             pending |                              pending | deck        | deck        |

¹ First/last tire contact samples use a 25 ms grid; full-envelope clearance stations are solved by bisection. A vehicle is ashore only when all eight tires are ground-supported and the complete conservative hull/wheel/cannon envelope is beyond the panel toe. Full road entry uses that same criterion; first tire road contact is shown separately. Pending means it has not occurred by the finite endpoint.

At 176 the state is 3 aboard / 2 transferring / 3 ashore; at 180 it is 1 / 2 / 5. Peak vehicle/transfer speeds are 4.512057 / 2.064587 m/s, world-vector acceleration 1.499844 m/s², heading rate 0.214°/s and suspension travel 0.161119 m. Actual tire support penetration stays below 0.988 mm, faceted contact gap below 6.133 mm, belly clearance above 0.427556 m and cannon clearance above 1.969899 m. Conservative same-lane/column/road-shoulder margins are 1.055 / 0.581820 / 1.662416 m. The complete LCAC/contact/terrain/environment solution remains exact through 176.

Four additive events produce 51 unique official records. Active duration is 180 while historical constants/APIs stay intact. Wasp's terminal tangent is valid, older survivor/effect motion continues through the last four seconds, and the finite endpoint pauses with aftermath explicitly pending. Two LAV group presets produce 24 cameras and the HUD derives phase/occupancy counts from state.

Only the two LAV path blocks and landing chapters 18/23/28 receive the specified direct-join clarification; optional apron-to-beach coordinates, both path IDs, every source event and all map/grade records remain exact. The immutable pre-edit Stage 5B baseline covers 1,554 timestamps, complete LCAC histories, valid payload fields, prior actors/weapons and unchanged environment. Existing fixture bytes and world hashes remain protected.

Fresh app/node no-emit checks, lint (19 existing warnings), 421 tests across 37 files with original timeouts and whitespace checks pass. Actual browser review includes complete 1× unloading windows, close hinge/toe motion, uninterrupted T+0–180 playback, every departure/end boundary, all speeds/cameras/keyboard controls, paused scene/GPU freeze, 720/540 px HUDs and six older sequence replays. Five resource cycles after warm-up remain flat, retaining all ten actor roots and 12 geometry / 14 material identities. The final console has no JavaScript errors. Matched earlier views retain renderer counts; T176 east dust adds one draw and 6,400 submitted triangles. Detailed evidence is in `stage5c-review.local/README.md`. No build, dependency/version change, map redesign, new combat or visible humans were introduced.

## Scope

### LCAC

- two LCAC craft
- offshore departure
- acceleration
- large wakes
- spray
- shallow-water transition
- beach approach
- beaching
- sand / dust transition
- ramp animation

### LAV-25

- eight vehicles total
- four per LCAC
- staggered unloading
- beach movement
- dust
- separation into two groups
- two inland access paths
- continued inland advance

### Integration

Pantsir 02, both LCACs and all eight persistent LAV models/deployment tracks are complete. All 51 events and the finite T+0–180 runtime are integrated, preserving completed older actor values and pre-departure payload state. Stage 6 owns indefinite continuation beyond the explicit pending-aftermath endpoint.

Integrate all scenario tracks from:

`T+00:00` through `T+03:00`

while preserving deterministic:

- seek
- pause
- restart
- playback speed
- damage reconstruction
- vehicle state reconstruction

The complete three-minute scenario plays continuously and pauses at the explicit pending-Stage-6 endpoint.

# Stage 6 — Ground Landscape + Aftermath + Visual Polish + Performance

**Status:** COMPLETE — agreed visual, scripted and bounded-aftermath scope

## Goal

Turn the complete functional battlefield into the final visual experience.

## Execution Rounds

The Stage 6A contract was prepared on 2026-10-17 against completed Stage 5C commit `b49db45`: 421 recorded passing tests across 37 files, 51 events, 24 cameras and a finite T+180 endpoint. Those are inherited baseline results. Stage 6A/6B delivery and verification remain dated below. Current Stage 6C results are in `STAGE6C_ACCEPTANCE.md`; Stage 6C and parent Stage 6 are COMPLETE for the agreed scope. The Stage 6B prompt is preserved in `5f940b5` and the Stage 6C prompt in `1bc6bdc`; the current `prompt.md` targets the separate post-core Stage 7A.

### Stage 6A — Ground Landscape, Vegetation, Rocks, and Sparse Trees

**Status:** COMPLETE

Make a visible improvement to the ground landscape at close, medium and wide viewing distances before implementing indefinite aftermath.

- improve grass and scrub geometry/materials in both the Stage 2 and Stage 4C layers, retaining their distinct root conventions, stable IDs/transforms and authored response metadata
- refine existing rock clusters into grounded slabs, outcrops, boulders and smaller rubble forms appropriate to each region
- add recognizable sparse dryland trees in suitable inland pockets, initially budgeting approximately 24–48 trees around 3–7 m tall; final count/distribution follows actual clearance and visual review
- improve soil/sand/gravel/rock/root and shoulder transitions through visual materials or bounded draped detail, with no terrain displacement or contact-height change
- retain the dry semi-arid, sparse-cover setting; no dense forest, tropical character, visible humans or new combat
- preserve all 3,574 historical Stage 4C cover records, Stage 2 response identities, existing wear/equipment/foam, authoritative assets, and completed simulation values through 180
- add separate deterministic placement/reservations for new scenery, covering actual Stage 5 actors and movement through T+180 without changing historical seed masks
- reserve full inland roads for future continuation, and keep complete hull/gun/wheel/ramp/canopy envelopes clear
- use shared resources, bounded instancing and measured shadow/detail budgets; any optional wind follows absolute simulation time and freezes when paused
- demonstrate the result with matched regional wide/close captures, actual clearance tests and stable warmed resources

Stage 6A retained 51 events, all 24 camera IDs, the finite 180-second runtime and the pending-aftermath endpoint, with only a stage-label change in the HUD. Its scope required no new camera, actor, clock, dependency or authoritative map/scenario rewrite. The landscape implementation prompt and its rendering/preservation contract are preserved in commit `75bf46a`.

### Verified Stage 6A delivery — 2026-10-19

- Replaced regional grass with eleven bent/tapered blades per clump (33 triangles) and scrub with connected twigs and open foliage sprays (62 triangles). Both legacy center-origin geometry and ground-origin cover are supported. Historical IDs, seeds, scales, yaw, ordering and response metadata remain exact. The unmounted legacy Stage 2 vegetation system stays unmounted; its geometry is upgraded and its 1,965 records also protect tree overlap. The active industrial blast-response field uses the same new rooted plant geometry with its original controller, timing, deformation and ignition ownership.
- Two rock families now provide fractured stepped outcrops and embedded weathered boulder/rubble groups (108/132 triangles). All 261 regional rocks and 71 Stage 2 rocks use separate render-only fitting to the actual uploaded surface, including footprint samples at ≤0.75 m. Horizontal matrix rows remain exact; replacement Stage 2 vertices fit inside the original unit-sphere envelope. Recorded base matrices and response addresses are unchanged. Maximum sampled base gap is -0.080 m, maximum burial 1.514 m, and even the lowest exposed top remains 0.225 m above support. Both grade-boundary fitting and root conventions have focused tests.
- Added **32 static dryland trees**, four silhouettes across upright/open and leaning forms, in eight sheltered pockets: **16 corridor / 8 ridge-foot / 8 inland beach**. Actual uploaded/rendered heights are **4.062–6.545 m**, crown spans **2.956–5.045 m**. Full crowns retain ≥8 m separation beyond their enclosing radii. Roots intersect the ground; measured root-cap gap is ≤-0.097 m. Instance-upload error stays below 0.242 mm. No trees occupy exposed radar crests, beach strand, grades, roads, yards, damage envelopes or industrial/harbor operating ground.
- World-space soil/sand/gravel/coast-rock color and roughness breakup adds no textures, geometry, displacement or overlay sheets. All existing terrain/coast/road attributes, contact heights, 404 wear records, equipment, 37 foam records, coastal values and authoritative files remain exact.
- Added independent quarter-second 0–180 reservations for 24 ground/landing actor tracks, plus both full inland roads/shoulders and secondary Pantsir damage. Actual model extrema include wheels, guns, suspension, cargo and the complete ramp. A separate 1,441-time sweep at 0.125 s measures ≤0.026272 m center/chord error, ≥169.224 m tree-to-conservative-actor clearance and ≥146.065 m clearance beyond reserved future road shoulders. Existing cover, legacy vegetation/rocks, equipment, fixed/damage masks, water edges, power corridors, lights and principal view rays are protected without rerolling history or deriving the complete world from rendering.
- Static regional batches own **16 geometries / 9 materials across 65 instance batches**. Legacy rock resources are shared across all eleven clusters. Only ridge rocks and tree branches cast new landscape shadows; grass, scrub, coastal/corridor rocks and foliage do not. Static geometry is sufficiently inexpensive that no wind, infill or LOD is added. Matrices/colors/bounds are uploaded once; seeking, restart and paused camera motion leave buffers and identities exact.
- Exact full-world preservation at **1,588 timestamps** through 180, including all landing mechanics/contact/dust and 51 events, uses a new pre-edit Stage 5C capture. Original fixtures retain their bytes. Fresh validation found an already-stale checksum literal in the committed Stage 5C test; its replacement compares the unchanged fixture bytes directly to `b49db45`. Only those two test-source edits are normalized for the captured source hash; no world-state projection is used.
- **440 tests / 40 files**, both TypeScript no-emit checks, lint with **19 pre-existing warnings**, and whitespace checks pass. A full default run also passes with the optional review directory absent, without requiring or regenerating local evidence. No old timeout is weakened. No build, dependency addition/version change, framework upgrade or repository-wide formatting is performed.
- Browser review covers 17 matched regional/close/busy/landing views, seven additional low views, all 24 cameras, 0.5×/1×/2×, pause/orbit/pan/zoom, keyboard, backward seeks/restart, 720/540 px HUDs and zero JavaScript errors. Both complete approaches/unloads run continuously at 1× from 110 to 180 (west 70.472 s / east 70.750 s wall time, including capture overhead). Radar, fuel, ammunition, bridge, T-72, Pantsir, aircraft and naval replays remain legible. Five cycles after warm-up stay flat at **1,104 geometries/T0 / 975/T180, 3 textures, 192 programs**; all 65 landscape batches, 16 geometry/9 material identities, upload versions and ten landing actor identities remain stable.

| View / T+           | Calls before → after | Triangles before → after |  Change |  Geometries | Materials | Programs |
| ------------------- | -------------------: | -----------------------: | ------: | ----------: | --------: | -------: |
| wide-harbor / 0     |        1,688 → 1,694 |        673,231 → 740,929 | +10.06% | 1053 → 1062 | 230 → 232 |  29 → 33 |
| wide-corridor / 0   |        2,440 → 2,446 |        682,589 → 728,561 |  +6.73% | 1053 → 1062 | 230 → 232 |  29 → 33 |
| wide-radar / 0      |        1,373 → 1,379 |        634,308 → 697,068 |  +9.89% | 1053 → 1062 | 230 → 232 |  29 → 33 |
| wide-beach / 0      |        1,639 → 1,645 |        601,156 → 661,072 |  +9.97% | 1062 → 1071 | 230 → 232 |  30 → 34 |
| wide-offshore / 0   |        2,174 → 2,195 |        725,680 → 815,200 | +12.34% | 1073 → 1082 | 230 → 232 |  30 → 34 |
| wide-industrial / 0 |        1,968 → 1,966 |        620,839 → 637,415 |  +2.67% | 1073 → 1082 | 230 → 232 |  30 → 34 |
| busy-fuel / 109     |        2,016 → 2,022 |        706,271 → 770,965 |  +9.16% | 1013 → 1022 | 315 → 317 |  53 → 61 |
| busy-ammo / 132.4   |        1,488 → 1,498 |        698,834 → 764,652 |  +9.42% |   980 → 989 | 305 → 307 |  72 → 84 |

All 17 matched views stay within +80 calls / +15% triangles: changes range from **-2 to +21 calls** and **+2.63% to +12.38% triangles**. Same camera transforms, time, 1280×720 viewport and DPR 1 use Chrome/ANGLE Metal Apple M4. Unique scene material counts rise by two and matched uploaded geometry counts by nine; textures remain three. Approximately 16.7 ms display-capped RAF observations are not GPU execution timings or proof that the landscape is free.

Paired captures, low views, chronological landing sheets, recordings, console/test logs and raw numbers are indexed in ignored `stage6a-review.local/README.md`; full comparison data is `stage6a-review.local/comparison.json`. The procedural faceting, broad existing preset framing and underlying terrain boundaries remain visible. At the Stage 6A delivery, Stage 6B remained PLANNED for indefinite aftermath/continued unloading and longer road support, and Stage 6C remained PLANNED for remaining presentation and final performance work. That delivery retained the 51-event/180-second endpoint, 5 ashore / 2 transferring / 1 aboard counts and pending-aftermath wording. Stage 6B supersedes that active endpoint behavior below while preserving the scripted state.

### Stage 6B — Indefinite Aftermath and Continued Movement

**Historical delivery status (2026-10-23):** COMPLETE — parent Stage 6 IN PROGRESS; Stage 6C PLANNED

The 2026-10-19 implementation contract starts from completed Stage 6A commit `75bf46a`. Its inherited 440 passing tests across 40 files, 51 events, 24 cameras and finite T+180 endpoint are historical starting measurements. The implementation below supersedes active endpoint behavior without rewriting completed Stage 5C/6A history or claiming parent Stage 6 is finished.

#### Runtime, controls and camera/HUD integration

One authoritative nonnegative observation clock drives the active scene, HUD, cameras and effects. `runtimeTime.ts` derives scripted progress `min(runtime,180)`, aftermath elapsed `max(runtime-180,0)` and aftermath phase from 180; `runtime.ts` combines focused landing/survivor/aircraft continuation anchored to the exact historical boundary. `SCRIPTED_DURATION_SECONDS = 180`, historical finite APIs and all 51 official event records retain their established meanings. No old event or major attack repeats.

Playback crosses 180 without pausing or losing tick overshoot at 0.5×/1×/2×. Pause freezes runtime-driven actors, wheels, radar, fans, water, particles, smoke, fire and lights while spectator controls remain free. Restart returns to paused T+0. Direct finite observation seeking reconstructs state without playing intervening frames, preserves play/pause state, and restores original scripted cargo attachments/events on backward seeks. Negative finite seeks clamp to zero; nonfinite seek/tick inputs retain current store time, overflowing ticks are rejected, and standalone invalid derivation normalizes to zero. Local labels wrap the day; only periodic presentation phases wrap, never runtime itself.

The slider stays 0–180 and pins at 180 during aftermath. A compact accessible observation-seconds input has 0.1 s resolution. Arrow stepping uses observation time, Home seeks zero, End seeks 180, and text inputs isolate playback shortcuts. The Stage 6B HUD reports **AFTERMATH OBSERVATION**, elapsed aftermath/continuing observation/local time, truthful cargo counts, aircraft/naval departures and completed support holds. All 24 camera IDs remain; Wasp's existing view is exact through 180, then translates with patrol displacement while preserving manual offsets. Departed Molniya/F-35 targets keep finite terminal framing.

Only one latest runtime-world result is retained. Finite road/support tables and eviction-only recent effect caches bound direct-seek work independently of elapsed observation or seek count. Historical static landscape placement/reservation loops retain finite derivations and one-way dependencies.

#### Exact late unloading and attachment/occupancy transitions

The original eight IDs, origin groups/carriers, two ramp lanes and offsets `[0,3,6,9]` persist. Each LAV has one visible root. `carrierId` remains its manifest origin; current `attachedToCarrierId` is independent of origin: it is retained only during all-deck support, then clears on the first non-deck contact while occupancy becomes transferring. Last deck contact, all wheels on ground and full-envelope ashore clearance are separate later transitions. First/all tire ground contact is deliberately distinct from full hull/wheel/cannon clearance. All values below are observation seconds.

| LAV             | Departure | First ramp contact | Last deck contact | First ground contact | All wheels ground | Full envelope clear / ashore |
| --------------- | --------: | -----------------: | ----------------: | -------------------: | ----------------: | ---------------------------: |
| attacker_lav_04 |       169 |      176.126953042 |     178.182594074 |        179.070655573 |     181.181001586 |                181.590506511 |
| attacker_lav_07 |       172 |      179.150043384 |     181.179154124 |        182.043905546 |     184.153289922 |                184.558404222 |
| attacker_lav_08 |       175 |      182.150043388 |     184.179154144 |        185.043755404 |     187.152230168 |                187.558071982 |

At exactly 180 counts remain 1 aboard / 2 transferring / 5 ashore. Counts reach 0 / 0 / 8 at T+187.5580719821155. The recorded values are measured continuations, replacing the former beyond-endpoint estimates. Both LCACs remain at their exact grounded shoreline poses, bow ramps open/grounded and stern ramps closed. Fan/navigation phases continue from runtime; settled spray creates no new births.

Raw evidence: `lav-unloading-attacker_lav_{04,07,08}.json`.

#### LAV road coverage, handoff and safe terminal formations

The old near-craft solver remains authoritative through remaining transfer. Road handoff is carrier-forward station **72 m**; its maximum support/filter look-ahead is **76.445 m**, inside the old station-90 limit. The only `lavDeployment.ts` change exports the unchanged near solver. Four finite road/lane contexts use both complete authored roads, two lanes at ±1.8 m, 14 m quintic corner fillets and 0.5 m finite support/arc grids. The unchanged rendered 10 m road remains support authority.

Vehicles retain 4.5 m/s inland pace, signed wheel phase, quaternion support and independent suspension. An 8 s C1 speed ramp brakes over 18 m at approximately 0.84375 m/s² maximum deceleration. Same-lane holds are staggered 22 m and across-lane holds 8 m; they remain at least 140 m west / 270 m east before the finite route ends/junctions. No ground route loops or extends beyond known support.

| LAV | Road handoff T+ | Brake starts T+ |      Holds T+ | Route-relative hold station m | Remaining route m |
| --- | --------------: | --------------: | ------------: | ----------------------------: | ----------------: |
| 01  |   181.328059763 |   324.557600595 | 332.557600595 |                 662.532933745 |               140 |
| 02  |   184.328059173 |   325.587703853 | 333.587703853 |                 653.668401062 |               148 |
| 03  |   191.328059763 |   329.668711706 | 337.668711706 |                 640.532933745 |               162 |
| 04  |   194.328059173 |   330.698814964 | 338.698814964 |                 631.668401062 |               170 |
| 05  |   187.310224568 |   329.513926573 | 337.513926573 |                 657.916659022 |               270 |
| 06  |   190.310039990 |   330.991952338 | 338.991952338 |                 651.068605564 |               278 |
| 07  |   197.310224568 |   334.625037684 | 342.625037684 |                 635.916659022 |               292 |
| 08  |   200.310039990 |   336.103063449 | 344.103063449 |                 629.068605564 |               300 |

Route lengths after station 72 are 802.532933745 / 801.668401062 m west and 927.916659022 / 929.068605564 m east. Every hold lies after the last authored bend; leader last-bend margins are 83.582277173 / 68.630746001 m. Handoff samples at ±0.5 ms differ in position by approximately 0.004500 m, the expected travel over 1 ms. Measured velocity discrepancy is 0.00441870215 m/s west / 0.01433896079 m/s east; this is not a position teleport.

#### Contact, motion and full-model clearance

| Measurement                                                           | Measured Stage 6B result                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Analytic finite-cylinder contact error, all eight LAVs                | maximum 0.00001008575709116 m (about 0.0101 mm)                                                              |
| Wheel-center reconstruction error                                     | maximum 1.01685×10⁻¹² m                                                                                      |
| Faceted rendered tire mesh penetration                                | maximum 0.006109127088155475 m (about 6.109 mm); distinguish polygon faceting from analytic cylinder support |
| Suspension displacement                                               | maximum 0.16101538561427875 m                                                                                |
| Yaw / pitch / roll rate                                               | maximum 0.160103368083 / 0.213832689396 / 0.128193282296 rad/s                                               |
| Steering / steering rate                                              | maximum 0.124435113448 rad / 0.063718648813 rad/s                                                            |
| Motion-sampled belly / barrel clearance                               | minimum 0.372531873184 / 2.061937079475 m                                                                    |
| Full-envelope hull clearance west / east                              | minimum 0.465126635637 / 0.389179983895 m                                                                    |
| Full-envelope barrel clearance west / east                            | minimum 2.082010100858 / 2.061538709699 m                                                                    |
| Same-lane center spacing west / east                                  | minimum 22.0000209945 / 22.0001735267 m                                                                      |
| Conservative all-lane complete vehicle-box separating gap west / east | minimum 1.00091029855 / 0.99372475626 m                                                                      |
| Tire-center road distance                                             | maximum 4.555132597 m within 5 m road half-width; body vertices checked separately                           |

The motion and full-envelope belly/barrel rows use different sample sets. Pitch across motion samples ranges approximately −0.0100071…+0.2367554 rad; roll −0.0975154…+0.0926659 rad.

| Complete-model sweep            |          West |          East |
| ------------------------------- | ------------: | ------------: |
| Vertex samples                  |       758,784 |       784,016 |
| Maximum sampled movement step m |   1.125100696 |   1.128007128 |
| Maximum LAV horizontal radius m |   3.991183127 |   4.094311214 |
| Open grounded LCAC radius m     |  16.501170310 |  16.422098620 |
| Active scenery gap m            |  43.108389934 |   5.616554903 |
| Tree-crown gap m                | 225.369850574 | 151.409832421 |
| Open LCAC/tree gap m            | 485.507007196 | 434.460957546 |
| Infrastructure gap m            | 608.902230426 | 429.273185089 |

The scenery inventory contains 5,748 records: 3,783 active envelopes and 1,965 preserved unmounted legacy vegetation records, with all 32 static trees also retained in the protected inventory. `VegetationSystem` remains unmounted in `WorldShell`; legacy records are preserved rather than treated as rendered obstacles. Static landscape identity/layout was not rerolled.

Raw evidence: per-ID `lav-motion-*`, `lav-handoff-*`, `lav-envelopes-*`, `lav-spacing-{0,1}.json` and `lav-cache-bounds.json`.

#### Existing survivor continuation and terminal behavior

All continuation starts from the exact T+180 state. Coordinates in this table are XZ meters unless identified otherwise. The same runtime drives continuing presentation; capped scripted progress retains irreversible events/outcomes. Full exact per-actor grounded poses, rotations, wheels and terminal fields are in `survivor-motion.json`, with exact grounded anchors and terminal positions in the second table below.

| Family                                                 | T+180 anchor / velocity                                                                           | Permitted aftermath path or hold                                                                                                                                                         | Terminal behavior / effect clock                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wasp                                                   | [−4800,−2700], heading −2.214297435588181 rad; forward [0.8,0.6], 11.219742096979383 m/s          | Tangent-continuous clockwise offshore circle, radius 850 m, center [−4290,−3380], period 476.00982847373035 s                                                                            | Continuous seam and bounded periodic bob/roll/pitch; wake and machinery use runtime                                                                                                   |
| Molniya                                                | [−5670.424269280591,3337.9575730719407], 15.128111600428808 m/s; tangent [−400,−40]/hypot(400,40) | One finite outgoing water segment; conservative fade starts 266.34954649286414 and completes 270.3026501000303                                                                           | Departed presence retains damaged survivor identity; finite terminal at T+274.9692774893056, X=−7100, speed 0; no respawn/new births after cutoff; existing finite smoke tails finish |
| Talwar                                                 | Exact heavily listed, flooded, burning final pose/state                                           | Fixed historical wreck/outcome with periodic presentation                                                                                                                                | No further sinking, strike or resurrection; runtime fire/smoke                                                                                                                        |
| BTR-02/03/04                                           | Existing withdrawing anchors; 16 m/s forward                                                      | Immediate 7.5 s C1 braking along known straight withdrawal; extra 60 m                                                                                                                   | Hold from T+187.5, speed/dust/wheel advance zero; runtime dust expires                                                                                                                |
| Disabled BTR-01                                        | Exact disabled historical pose                                                                    | Fixed                                                                                                                                                                                    | Damage age and persistent effects continue with runtime                                                                                                                               |
| T-72-02/03                                             | Existing reverse anchors; −4.5 / −4 m/s                                                           | Immediate 2 s C1 braking; extra reverse 4.5 / 4 m                                                                                                                                        | Hold from T+182; rear 03 retains 0.908888889 m complete rear-hull route margin; wheels/tracks stop                                                                                    |
| Destroyed T-72-01                                      | Exact destroyed historical pose                                                                   | Fixed wreck                                                                                                                                                                              | Runtime damage age and persistent fire/smoke; no repeated strike                                                                                                                      |
| Support lead fire engine                               | Existing hold, zero speed                                                                         | Exact pose retained                                                                                                                                                                      | Holds throughout; runtime beacons and follow centroid                                                                                                                                 |
| Support engineering/recovery                           | Existing reverse anchors; −0.9 m/s                                                                | 6 s C1 braking; extra reverse 2.7 m                                                                                                                                                      | Hold from T+186; runtime beacons, finite dust tails                                                                                                                                   |
| Support rear fire/logistics vehicles                   | Existing reverse anchors; −3 m/s                                                                  | 38 s reverse cruise then 6 s C1 braking; extra reverse 123 m                                                                                                                             | Hold from T+224, all six convoy vehicles survived; runtime beacons                                                                                                                    |
| Primary/secondary Pantsir, radar/infrastructure wrecks | Exact historical fixed wreck/obstruction state                                                    | Fixed; no new actor or outcome                                                                                                                                                           | Surviving secondary radar phase accelerates smoothly over 2 s to 0.34 rad/s; other established machinery/effects use bounded runtime phases                                           |
| LCACs                                                  | Exact grounded shoreline poses, open grounded bow ramps/closed stern                              | Fixed craft; finish original eight-ID manifest unloading                                                                                                                                 | Runtime fans/nav lights; settled spray has no new births                                                                                                                              |
| LAVs                                                   | Exact 5/2/1 cargo state; unchanged signed wheels and near support                                 | Remaining transfers, finite road/lane handoffs and holds above                                                                                                                           | All eight ashore by 187.558071982; final hold by 344.103063449; dust settles and wheels stop                                                                                          |
| Already departed Su-30s                                | Exact hidden baseline                                                                             | Remain departed                                                                                                                                                                          | No re-entry or new sortie                                                                                                                                                             |
| F-35-01/02                                             | Exact existing final pose and measured velocity retained                                          | Continue existing outgoing vector to finite off-map anchors; F-35-02 was already beyond the former boundary and now continues at least 250 m rather than snapping immediately to speed 0 | Render departure 210.23960396042338 / 180.4; finite camera targets; no new sorties or re-entry                                                                                        |

F-35-01 terminal XYZ = [186.5544554470007,2000.6138613861385,−5200]; F-35-02 = [−7574.754901960785,1268.9705882352941,−5579.411764705883]. Measured full rendered body gaps beyond the map at render departure are 14.153820531 / 377.152764658 m (264 envelope vertices each).

| Actor                             | Exact T+180 XZ                            | T+180 signed speed m/s | Finite terminal/hold XZ                  |
| --------------------------------- | ----------------------------------------- | ---------------------: | ---------------------------------------- |
| `defender_btr_01`                 | [720.6153395068284, 1331.0768424749122]   |                      0 | [720.6153395068284, 1331.0768424749122]  |
| `defender_btr_02`                 | [1105.8650581213433, 1111.8552075831458]  |                     16 | [1157.9596268568878, 1082.0868366458974] |
| `defender_btr_03`                 | [1133.425564527547, 1094.378695155525]    |                     16 | [1185.5201332630913, 1064.6103242182762] |
| `defender_btr_04`                 | [1162.2760336743836, 1079.159614039767]   |                     16 | [1214.370602409928, 1049.3912431025183]  |
| `defender_t72_01`                 | [6075, 250]                               |                      0 | [6075, 250]                              |
| `defender_t72_02`                 | [5997.875, 254.5]                         |                   -4.5 | [5993.375, 254.5]                        |
| `defender_t72_03`                 | [5975.3388888888885, 246.5]               |                     -4 | [5971.3388888888885, 246.5]              |
| `defender_support_fire_01`        | [3241.1862367208355, -240.5531634859688]  |                      0 | [3241.1862367208355, -240.5531634859688] |
| `defender_support_engineering_01` | [3265.5074666638543, -230.52965117446786] |                   -0.9 | [3267.995882176727, -229.48189727431105] |
| `defender_support_recovery_01`    | [3291.692582885277, -219.0703279627522]   |                   -0.9 | [3294.1809983981493, -218.0225740625953] |
| `defender_support_fire_02`        | [3328.5601807114253, -203.92688860673465] |                     -3 | [3441.921331853409, -156.19587759958765] |
| `defender_support_logistics_01`   | [3352.5260959637662, -193.51046858267492] |                     -3 | [3465.88724710575, -145.77945757552786]  |
| `defender_support_logistics_02`   | [3376.6666368661326, -183.50878447742724] |                     -3 | [3490.027788008116, -135.77777347028024] |

#### Survivor route and model measurements

- Ground routes: 353 samples at 0.125 s against 5,748 preserved scenery/tree records, using conservative complete hull/gun/wheel/suspension envelopes plus 2 m. Minimum active scenery clearance is 52.030675733 m overall (BTR 77.698156176 m, T-72 162.743184162 m, support 52.030675733 m). Minimum complete actor-envelope gap is 6.726103719 m; infrastructure gap 25.292433757 m after sweeping buildings, bunds, bridge, substation, radar/equipment, fences/rails, pipes and barriers.
- Maximum wheel/track presentation contact error is 0.103766525059 m, pitch 0.036461668585 rad and roll 0.030607398519 rad. These historical survivor models retain their established support tolerance, independently of the finer LAV cylinder-contact results.
- Actual rendered horizontal model radii: BTR 4.0776985578 m from 368 bounding-box corners; T-72 6.0919221454 m from 976 corners including the memoized turret/body; support 4.6047680202 m from 360 corners. Molniya inspection includes missile instance matrices.
- Maximum ground continuation speed 16 m/s and acceleration 3.375 m/s²; straight-route yaw rate is effectively zero. Finite-difference speed and wheel-integral error is approximately 0.00137109376 m/s.
- Wasp: 1,441 complete-model samples / 264 corners including wake. Minimum coast gap 1,695.635510675 m, map gap 698.325934508 m and other-vessel gap 5,733.317960997 m; maximum yaw rate 0.013199696585 rad/s and analytic speed error 8.31×10⁻⁹ m/s. Periodic finite-state tests extend through `Number.MAX_VALUE`.
- Molniya: 328 complete-model corners. Actual maximum X extent 28.82292577409 m is below conservative 29.75310083021568 m; actual first/full body crossing is T+266.41164552893565 / T+270.24056218654437, inside the conservative fade window. Fade completion and finite terminal anchoring are separate moments.

Raw evidence: `survivor-motion.json`, `survivor-clearance.json`, `survivor-contact.json`, `survivor-model-envelopes.json`, `wasp-clearance.json`, `molniya-clearance.json`, `aircraft-departure.json`.

#### Persistent effects, bounded phases and fixed resource contracts

- Existing fuel/ammunition/vehicle/ship fire and smoke, harbor sheen/burning fuel/debris, water and appropriate fans/navigation/beacon activity use runtime. Major scripted blasts, shockwaves, weapon releases and losses remain capped and never restart.
- Ground dust uses six slots per actor, 0.24 s births, 1.4 s lives, moving ground contacts only and a shared eviction-only cache capped at 128 births. Current renderer rosters provide fixed capacities of 24 BTR, 18 T-72 and 36 support slots, including nonemitting wreck/hold IDs. Legacy dust fades over 180…180.6 as recent-contact runtime dust fades in. Stops leave only finite tails.
- LAV dust uses eight slots per actor, 0.18 s births, 1.35 s lives and a separate eviction-only birth cache capped at 128. It reconstructs a fixed recent window, follows extended road poses and settles after holds. No per-frame emission history is retained.
- Sparse industrial secondary activity uses two existing damaged sites: `fuel-manifold` [400,2025], first cycle 213; `ammunition-remains` [1300,1800], first cycle 261. Site/cycle-index hash, 96 s cycles, 0…7 s deterministic jitter and 25% omission yield short 3.4 s bursts with 0.24 s flash. At most one burst per site uses two fixed flash and six puff slots in total, reusing resources. Quiet-interval tests require at least 37 s after the previous lifetime. These are not official events, attributed strikes, actor losses, global shocks, new debris launches or propagation.
- Molniya stops new wake/smoke births at conservative departure cutoff. Already born particles finish their finite lives; local fire tail is 1.5 s, local smoke tail 5.6 s, and the smoke column remains ten fixed puffs. The cutoff prevents new births while existing finite tails remain visible.
- Water shader time reduces only its equivalent π×200 s period, preserving the established 0.31/0.56/0.92 rad/s phases. Original inputs/arithmetic remain exact through 180. Other ongoing periodic phases are bounded after 180; fuel point lights and Pantsir wreck rocking also remain finite through extreme finite observation times.
- Permanent wear uses capped scripted progress for irreversible cutoffs so the old 1000 sentinel does not erase existing patches during longer observation. Historical terrain/coast/road/sea level/support and static Stage 6A material/layout/upload identities are preserved.
- Finite LAV data: four lane routes, two road centerlines; measured support sample counts `[1329,1311,1319,1306]`, bounded by `[1607,1605,1857,1860]`; wheel-arc sample counts `[1327,1309,1317,1304]`; dust cache 128. These bounds depend on authored route length, not elapsed runtime or seek count.
- Molniya cloned materials have explicit ownership/disposal. Existing geometry/materials are shared and actor roots remain stable; the final warmed-resource and actual-render checks below pass independently of these fixed-capacity contracts.

#### Exact historical preservation and source-checksum treatment

The pre-edit fixture `src/simulation/fixtures/stage6aRuntimePreservation.json` records fixed source commit `75bf46a` and `capturedBeforeStage6B: true`. Its immutable SHA-256 is `edbd3d182f1fe99132ae8201cc7437525dcf813daa8c35d7f1f4adebf89634f1`; tree-layout hash is `433ee4468e8373957bd05bd9ad96e19bee188350f07846522ba5e5fb01eac4ba`. Historical fixture bytes and stored world hashes are unchanged.

`stage6bPreservation.test.ts` compares every captured complete-world hash against both the legacy finite world and the active runtime world, projecting only additive `runtime` metadata. It omits no actor family or existing actor/weapon/event/contact field. It also checks fixture bytes against fixed `75bf46a`, the tree hash, source hashes and the exact reasoned exception list.

`src/test/stage6bSourceAudit.ts` enumerates exactly 30 file-level exceptions below. For only those exact paths the historical checksum audit reads `git show 75bf46a:<path>`; unrelated source checks still hash current working bytes. Current behavior is covered separately by active-runtime full-world comparisons and focused controls/effects/rendered-transform tests. This preserves the historical audit without replacing stored hashes with newly generated current output or exempting a directory. `derive.ts` and `types.ts` are not exceptions.

| Exact changed path                                   | Reason for fixed-Git historical audit / current behavior coverage                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                                        | active runtime, keyboard, truthful deployment readouts                                                            |
| `src/App.test.tsx`                                   | Stage6B label and active observation controls                                                                     |
| `src/ui/SimulationHud.tsx`                           | fixed scripted slider and accessible observation seek                                                             |
| `src/scene/BattlefieldScene.tsx`                     | single runtime world and departed aircraft visibility                                                             |
| `src/scene/camera/CameraRig.tsx`                     | runtime follow headings                                                                                           |
| `src/scene/vehicles/PantsirModel.tsx`                | bound only late wreck rocking phase to prevent finite runtime overflow; scripted arithmetic preserved             |
| `src/scene/vehicles/PantsirModel.test.tsx`           | exact scripted rocking and finite actual rendered wreck transforms through extreme late observations              |
| `src/simulation/store.ts`                            | one nonnegative observation clock without endpoint pause                                                          |
| `src/simulation/store.test.ts`                       | active unbounded store assertions                                                                                 |
| `src/simulation/landingCraft.test.ts`                | active store crosses 180 without pausing; retain all finite landing actor and timeline assertions                 |
| `src/simulation/secondaryPantsir.test.ts`            | active store remains playing at 180; retain exact finite Pantsir boundary, pause, seek and restart assertions     |
| `src/simulation/supportConvoy.test.ts`               | omit only additive runtime metadata from exact historical world comparisons and assert continuing playback at 180 |
| `src/simulation/scriptedEndpoint.test.ts`            | legacy finite APIs and active runtime handoff                                                                     |
| `src/simulation/index.ts`                            | focused active runtime exports                                                                                    |
| `src/simulation/lavDeployment.ts`                    | export unchanged near-craft solver for bounded road handoff                                                       |
| `src/simulation/stage6aPreservation.test.ts`         | fixed-Git historical audit for precisely enumerated runtime source changes                                        |
| `src/scene/effects/BattleEffects.tsx`                | bounded periodic phases after180                                                                                  |
| `src/scene/effects/SecondaryPantsirEffects.tsx`      | bounded periodic phases after180                                                                                  |
| `src/scene/effects/Stage3BattleEffects.tsx`          | persistent runtime effects and fixed minor secondary pool                                                         |
| `src/scene/effects/Stage4B2AArmoredEffects.tsx`      | recent-contact runtime dust                                                                                       |
| `src/scene/effects/Stage4BGroundVehicleEffects.tsx`  | recent-contact runtime dust                                                                                       |
| `src/scene/effects/SupportConvoyEffects.tsx`         | recent-contact runtime dust                                                                                       |
| `src/scene/effects/stage3/BlastResponseField.tsx`    | bounded periodic ignition phases                                                                                  |
| `src/scene/effects/stage3/BoundedSmoke.tsx`          | finite departure emitter cutoff                                                                                   |
| `src/scene/effects/stage3/PersistentGroundFires.tsx` | finite departure emitter cutoff and bounded periodic phases                                                       |
| `src/scene/effects/stage4a/LayeredFuelFireField.tsx` | bounded periodic flame phases                                                                                     |
| `src/scene/effects/stage4a/Stage4AFuelDisaster.tsx`  | preserve scripted fuel lighting and bound late periodic light phases before multiplication                        |
| `src/scene/world/stage2/HarborNavalAssets.tsx`       | runtime Molniya transform/departure and bounded machinery phases                                                  |
| `src/scene/world/stage4c/CoastalWater.tsx`           | bounded equivalent GPU water phase                                                                                |
| `src/scene/world/stage4c/SurfaceHistory.tsx`         | permanent scripted wear survives observation beyond sentinel1000                                                  |

Two inherited checksum literals in `stage6aPreservation.test.ts` were stale: `stage5cPreservation.json` (SHA-256 `c20c6478b832eea94b29b01262ea546e14c51dd8410cdb13f580bff00df39e6e`) and `stage2LandscapePreservation.json` (`7c021356f387a005d96282c13ef7be44b4f481bcc56c2a00227046aa3da61e63`). Both assertions now compare unchanged fixture bytes directly with their fixed `75bf46a` Git blobs. No fixture bytes or stored world hashes were rewritten; the historical byte audit and current behavioral coverage remain intact.

The 32 trees, 3,574 historical regional records, legacy identities, fitted rock/plant geometry, movement reservations, terrain/coast/road surfaces, sea level, wear/equipment/foam and static resource contracts remain protected. No unbounded runtime derivation enters historical landscape placement loops.

#### Browser acceptance recorded during Stage 6B integration — 2026-10-23

- One uninterrupted 1× playback starts with restart/play at T+0 and records 398 chronological samples from T+0.166667 through T+198.033333 in 199.53 s wall time. It crosses 180 automatically, finishes all three late unloads and continues inland. Accepted evidence is `full-playback.json` plus chronological `full-*.png`. The encoder failed to stop after falling more than 500 ms behind, so `full-script-into-aftermath-1x.webm` may be partial and is not a complete recording. An earlier run interrupted by hot reload near T+55.5 is excluded.
- Sustained aftermath runs for **614.178 real seconds** at 2×, from T+286.767 to T+1499.633, with 79 interval snapshots. This is actual uninterrupted playback evidence rather than a substitute based on late direct seeks.
- Seventeen matched scripted views retain identical renderer calls and triangles. Existing scenes and histories remain visually comparable at matched time, camera transform, 1280×720 viewport and DPR.
- Browser controls cover all 24 presets, 0.5×/1×/2×, direct observation seeks through 7200 and backward into the scripted interval, pause/restart/keyboard/text-input behavior, and 1280×720 / 1280×540 HUD layouts.

Fresh final validation passes **544 tests across 50 files** in 91.12 s, both application/node TypeScript no-emit checks, lint with **zero errors / 13 warnings**, and `git diff --check`. The warnings concern React camera/ref patterns and an existing useMemo warning; they are not all characterized as pre-existing. Original test timeout limits remain.

The actual rendered audit covers **98 timestamps, 20 captures and 33 persistent actor IDs**, with zero root-position error and maximum wheel-center error **9.095×10⁻¹³ m**. Actual GPU water and representative fire/smoke/fan/light inputs advance during aftermath and freeze under Pause while spectator controls remain free. Five warmed equal-time seek/restart/camera cycles stay flat at T+360: **1,331 calls, 664,356 triangles, 962 geometries, 302 materials, 3 textures and 127 programs**. Actor roots and static upload identities/versions remain stable. Active route/support cache counts are `[1329,1311,1319,1306]`, wheel-arc counts `[1327,1309,1317,1304]`, four lane routes/two centerlines and 78 cached LAV dust births within the 128-entry bound. No JavaScript errors occur; the existing Three.js Clock warning remains.

Raw measurements, captures and logs are indexed in ignored `stage6b-review.local/README.md`; `docs-draft.md` is working review material rather than acceptance authority. Renderer counts are matched-view/warmed development measurements; display-capped RAF cadence is not GPU execution timing.

#### Historical Stage 6B handoff scope

At the Stage 6B handoff, Stage 6C was PLANNED for remaining presentation, broad preset framing, procedural faceting and final rendering-cost/performance refinement. Stage 6B provides deterministic bounded authored continuation with indefinite observation: finite ground routes truthfully end in holds while other battlefield activity continues. It adds no endless road network, general combat AI, new actor/strike/loss/sortie, physical ocean/rigid-body simulation, audio, vegetation change or visible humans/occupants. Approximate support/model tolerances above remain explicit. No build, dependency/version/framework change, authoritative reference edit or broad formatting is required.

### Stage 6C — Remaining Presentation and Final Performance Integration

**Status:** COMPLETE — parent Stage 6 COMPLETE

Implemented 2026-10-25 against `5f940b5`: all 24 existing cameras have viewport-aware subject framing and seek-safe controls; shared soft smoke/fire replaces hard puff geometry; compact accessible HUDs preserve complete statuses; focused single-map shadows, water/horizon and road-material refinements preserve support data. Two measured rendering optimizations reduce busy Fuel calls 40.16% and Harbor triangles 36.24% at exact old poses/quality. All 31 fixed pairs reduce both submission counts.

Fresh checks pass 618 tests across 55 files, including a full run with the optional review directory absent, app/node no-emit, lint with zero errors/warnings (13-warning starting point), and whitespace checks. Full active-world equality uses the immutable 1547-sample pre-edit capture plus fixed-commit supplements for 98 late samples and 120 samples around all 40 exact LAV contact transitions; exactly 32 presentation-source exceptions retain fixed-Git audits. The complete 1× replay reaches T+206.0333 in 215.0484 real seconds. Five warmed all-camera seek/restart cycles retain 261 calls / 372946 triangles / 982 geometries / 316 materials / 3 textures / 214 programs at T+360/LAV west, all 35 actor identities and all 910 fixed world upload records.

A fresh 605.0074-real-second 2× aftermath session passes at T+360–1569.7333 with 1186 samples, no pause/seek/restart/reload, all 35 actor roots and all 936 world resource/upload records stable. Materials/textures/programs stay 316/3/250; uploaded geometries range 1014–1024. Final self-contained validation passes 618/55 tests in 86.00 s, both no-emit checks, zero lint warnings/errors and whitespace checks. Actual rendered agreement covers 98 late plus 120 all-LAV transfer samples. Only the existing Clock deprecation remains in the browser console. Full paired-view, GPU/cadence, preservation, camera-role and resource details are in [STAGE6C_ACCEPTANCE.md](STAGE6C_ACCEPTANCE.md). Mixed GPU results and first-use shader/resource hitches remain explicit limits; no production build, deployment, audio, new combat/actors or visible people are part of this delivery.

#### Historical prepared contract — 2026-10-24

Refine remaining camera framing/transitions, lighting, atmosphere, water/effect/material presentation and visual hierarchy where browser evidence identifies a need. Preserve the established landscape and aftermath semantics. Add camera presets only for a demonstrated gap in the existing 24, then verify full playback, long-running aftermath, resource lifetime, LOD/shadows and rendering cost together.

Next-round contract prepared 2026-10-24 from Stage 6B commit `5f940b5`. Its recorded starting checks are 544 tests across 50 files, app/node no-emit checks, zero lint errors and 13 current warnings. These are inherited Stage 6B results; Stage 6C requires fresh evidence.

The existing accepted images identify concrete presentation priorities: Beach inland is dominated by foreground terrain with tiny distant craft; some other presets leave excessive sky/empty ground; fuel smoke exposes separate faceted puffs; sea boundaries/bands and abrupt material edges remain visible; long HUD statuses/event labels truncate and panels consume useful scene area. Confirm each issue in the current browser before implementation.

- audit and improve all 24 existing preset roles, target visibility, terrain sight lines and HUD-aware framing at 1280×720, 1280×540 and 1440×900; preserve IDs and manual spectator controls, while allowing intentional camera-parameter changes
- improve cohesive smoke/fire rendering with bounded shared resources while retaining exact emitter/age/lifetime state, chronology and aftermath clocks
- refine dawn lighting, shadow/contact cues and at least one evidenced sea/horizon/material issue without changing terrain/support geometry, actor anchors or coastal query data
- make camera selection, active status and complete event/status information legible and accessible using the existing Tailwind/UI style; retain runtime controls and truthful deployment/departure labels
- profile actual bottlenecks and implement at least two focused rendering optimizations; working targets are approximately 15% fewer calls in a busy fixed view and 10% fewer triangles in a geometry-heavy fixed view, or a documented better measured improvement
- compare rendering cost at identical old camera transforms/time/resolution/DPR/quality, separately from the improved preset-composition images; do not count reframing or reduced resolution as an optimization
- preserve the complete active world through 180 and representative aftermath/contact/route boundaries through 7200, all 51 events, source authorities, fixture bytes, 32 trees and historical environmental layouts
- handle only explicitly identified presentation-source checksum changes with historical fixed-Git audits and stronger active rendering/behavior coverage; keep unrelated checks and timeout limits
- reduce warnings in touched camera/render paths without disabling rules, introduce no new warnings, and report the actual result against the 13-warning baseline
- create fresh paired regional/close/busy views, a complete scripted-to-aftermath playback, ten real minutes of sustained aftermath and at least five warmed equal-time resource cycles

Create `STAGE6C_ACCEPTANCE.md` only during verified implementation, with actual paired-view references, changes, measurements, checks and limitations. The full implementation contract is in `prompt.md`. This preparation update does not claim visual fixes, optimization or new test results.

After all required visual, rendering-cost and integration acceptance passes, mark Stage 6C and parent Stage 6 COMPLETE for the agreed visual/scripted/aftermath scope. Keep status truthful if a required item remains unmet. Audio stays outside the current core plan; no production-build or deployment claim is implied by permitted development/no-emit checks.

## Aftermath Contract — Stage 6B

Implement indefinite:

`AFTERMATH OBSERVATION`

after T+03:00.

Persistent world activity includes:

- fires
- smoke
- damaged infrastructure
- harbor contamination
- partially flooded Talwar
- Molniya withdrawal
- withdrawing island_defender vehicles
- surviving Radar Hill equipment
- LCAC activity
- LAV-25 inland movement
- occasional minor secondary detonations

No global freeze occurs at T+03:00.

## Camera — Stage 6C

Audit and improve the existing presets across these subjects; add a new preset only for a demonstrated gap:

- Overview
- Harbor
- Industrial
- Radar Hill
- Convoy Corridor
- Remote Beachhead
- Wasp
- selected vehicle follow
- selected aircraft follow

Preserve free spectator control.

## Remaining Visual Polish — Stage 6C

Refine:

- lighting
- dawn atmosphere
- haze
- water
- wakes
- smoke layering
- explosion lighting
- materials
- terrain blending
- distant silhouettes
- fire persistence
- debris
- environmental damage
- camera transitions
- UI visual hierarchy

## Performance — Every Stage 6 Round and Final Integration

Profile and optimize:

- draw calls
- instancing
- geometry reuse
- material reuse
- particle pooling
- smoke population
- shadow casters
- shadow range
- LOD
- far-distance simplification
- transient-effect cleanup
- long-running aftermath stability
- repeated seek / restart behavior

# Post-Core Stage 7A — First-Use Readiness and Frame Pacing

**Status:** COMPLETE — 2026-10-28, with documented local cadence/GPU limits

Prepared 2026-10-25 from completed Stage 6C commit `1bc6bdc`. The inherited baseline is 618 tests across 55 files, app/node no-emit checks, zero lint errors/warnings, 51 events and 24 camera IDs. Stage 6 remains complete; this is a bounded follow-up to its documented performance limits, not a new visual/content phase.

`STAGE6C_ACCEPTANCE.md` records first-use gaps up to 3.35 s, first-replay mean/P95 RAF 21.76/49.0 ms and sustained 2× mean/P95/max RAF 22.63/64.60/166.70 ms, alongside mixed actual GPU costs. These are symptoms to attribute, not proof that all delay comes from shaders. Distinguish application work, resource upload/compilation, CPU/React/allocation, GPU cost, development reloads and capture overhead before choosing fixes.

## Goal and Delivery

- implement a bounded, cancellable first-use preparation lifecycle with truthful HUD status, responsive paused scene and consistent Play gating; preparation never advances/rewinds the authored clock or leaks future events/damage into view
- warm the actual mounted renderer/material/light/shadow/resource paths that profiling identifies, using existing installed APIs and incremental work with a measured time-to-ready budget
- preserve ready resources across restart/seek/camera changes; cancel stale work and dispose temporary ownership correctly on unmount or renderer/context replacement
- reduce measured repeated CPU/React/allocation/submission work while retaining exact current-time snapshots, camera framing and correct dynamic bounds/uploads
- respect the existing single-result runtime cache and measure real duplicate work before adding caching; no unbounded per-time world map, stale snapshots or actor-time quantization
- keep the fixed-step driver policy, all runtime/actor/contact/effect values, visual quality, selected DPR/AA/shadows, 32 trees and historical layouts exact
- compare at least three independent fresh-context runs per side, separating first usable UI, preparation/time-to-ready, first playback and warmed/sustained behavior under identical low-overhead instrumentation
- use local working targets of no application-attributable first-use stall >=500 ms after readiness, worst gap <=250 ms where achievable, and warmed/sustained P95 <=33.3 ms at 1280×720/DPR 1; attribute misses honestly and do not trade picture quality or excessive startup delay for a favorable chart
- verify full unprojected state/visual preservation, cold/warm equality, readiness lifecycle/disposal, all controls/presets/viewports, direct late seeks, ten real minutes of low-overhead aftermath and five warmed resource cycles

Delivered 2026-10-28: preparing/ready/failed/cancelled renderer generations, nine actual shader/resource jobs, a 12 s cooperative deadline, truthful gated Play and retry, native context recovery, stable owned model subtrees/resident defense lines and eight bounded exact terminal LAV payloads. Preparation never rehearses future world states and the fixed-step driver remains byte-identical.

Three fresh complete first plays per side reduce compile/link calls about 90% and first-play P95 from 33–50 ms to 17–18 ms, with 0.748–0.934 s added post-scene preparation. The matched aftermath world-miss mean falls 3.449→0.252 ms. All 4,963 full-world states through 7200 and 25 complete RGB images remain exact; 227 rendered checkpoints retain 35 roots/64 wheels. Five warmed all-camera resource cycles stay flat, and a separate 600.0144 real-second 2× run retains all 936 world upload records. Both no-emit checks, zero-warning lint, 707 tests / 62 files and whitespace checks pass. No build ran.

The full English contract remains in `prompt.md`; [STAGE7A_ACCEPTANCE.md](STAGE7A_ACCEPTANCE.md) records every fresh/warm/sustained run, actual causes, recovery, source exceptions and remaining limits. Short busy-window P95 aspirations and one 283.4 ms raw first-play interval remain explicit; actual GPU timings are mixed. `STAGE6C_ACCEPTANCE.md` stays byte-identical as dated core acceptance. The 2026-10-25 preparation itself was documentation only; these are separate fresh delivery results. Audio, production builds/deployment and new gameplay/content remain outside this round.

# Out of Current Core Plan

Audio is intentionally excluded from the current visual implementation roadmap.

Audio may be added after the visual scenario, runtime, effects, and performance are stable.

Do not introduce audio opportunistically during these stages unless the project plan is explicitly revised.

# Stage Execution Rules

For every implementation stage:

1. Read `AGENTS.md`.
2. Read this iteration plan.
3. Read the authoritative map, scenario, belligerent, and relevant vehicle files.
4. Preserve completed-stage behavior unless the current stage explicitly requires a change.
5. Do not silently rewrite authoritative scenario timing or map geometry.
6. Implement only the current stage plus architecture genuinely required by it.
7. Run all validation permitted by repository rules.
8. Perform actual browser visual inspection.
9. Fix visible problems found during inspection.
10. Report remaining limitations rather than hiding them.

Each completed stage should leave the repository in a coherent, reviewable state.

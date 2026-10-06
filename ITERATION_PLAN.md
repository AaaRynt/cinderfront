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

Stages 4B, 4B.2A, 4B.2B, 4B.2C and 4C are complete. The authored ground/air/support reactions and environmental pass are validated through the scoped T+176 endpoint. The next priority is Stage 5 integration of the outstanding authoritative operation tracks.

The intended sequence is:

1. complete the four-vehicle BTR-80 reaction slice in Stage 4B;
2. reuse the proven lifecycle for a limited set of additional actors in Stage 4B.2;
3. improve environmental storytelling and coastal realism in Stage 4C;
4. integrate the amphibious operation and full timeline in Stage 5;
5. perform final aftermath, camera, asset, visual, and performance refinement in Stage 6.

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

Pantsir 02's missing sequence remains an explicit integration gap. Both LCACs, eight LAV-25s, the excluded T+176 inland event and full T+180 timeline remain Stage 5 work; indefinite aftermath remains Stage 6 work. This pass adds none of those actors or events.

# Stage 5 — Full Operation Integration

**Status:** PLANNED

## Goal

Complete the amphibious theater and integrate the full authoritative 180-second scenario after the ground-actor and environmental foundations are validated.

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

Outstanding integration gaps include the missing Pantsir 02 sequence, both LCACs/eight LAV-25s, the excluded T+176 inland event and the remaining full T+180 authoritative timeline. Preserve the completed T+176 scoped operation when integrating these tracks.

Integrate all scenario tracks from:

`T+00:00` through `T+03:00`

while preserving deterministic:

- seek
- pause
- restart
- playback speed
- damage reconstruction
- vehicle state reconstruction

The complete three-minute scenario should now play continuously.

# Stage 6 — Aftermath + Camera Expansion + Visual Polish + Performance

**Status:** PLANNED

## Goal

Turn the complete functional battlefield into the final visual experience.

## Aftermath

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

## Camera

Expand spectator presets to include:

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

## Visual polish

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

## Performance

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

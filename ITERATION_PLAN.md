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

**Status:** NEXT

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

**Status:** PLANNED

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

# Stage 4 — island_defender Reactions, Support, Losses, and Withdrawal

**Status:** PLANNED

## Goal

Make battlefield vehicles visibly respond to changing conditions rather than behave as static props.

## Scope

- second Pantsir-S1 relocation
- secondary engagement
- second Pantsir-S1 destruction
- BTR-80 support movement
- BTR-80 loss
- surviving BTR-80 withdrawal
- T-72B reinforcement movement
- lead T-72B destruction
- surviving T-72B fallback
- support / rescue convoy movement
- firefighting response
- engineering response
- route obstruction
- failed rescue approach
- partial convoy withdrawal
- Su-30MKK reinforcement
- brief defensive air action
- one damaged Su-30MKK withdrawal
- second Su-30MKK covering withdrawal

Important behavioral states include:

- supporting
- repositioning
- damaged
- disabled
- destroyed
- withdrawing
- surviving

Destroyed vehicles remain as persistent wrecks.

# Stage 5 — Amphibious Landing + Full Timeline Integration

**Status:** PLANNED

## Goal

Complete the second major battlefield theater and integrate the full authoritative 180-second scenario.

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

Audio is intentionally excluded from the current six-stage visual implementation plan.

Audio may be added after the visual scenario, runtime, effects, and performance are stable.

Do not introduce audio opportunistically during the six stages unless the project plan is explicitly revised.

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

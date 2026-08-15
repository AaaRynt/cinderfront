# Cinderfront — Stage 1: Core Runtime and Opening Vertical Slice

You are implementing the first production stage of an existing React/TypeScript 3D battlefield project.

Work directly in the current repository.

Do not stop after planning or describing an approach. Inspect the existing project, implement the stage, run validation, fix problems you discover, and leave the repository in a working state.

# 1. Current Authoritative State

The project is named **Cinderfront**.

It is a deterministic, scripted 3D battlefield diorama / simulation.

It is **not** a player-controlled vehicle combat game.

The user controls observation and simulation time, not combat units.

Before implementation, read and treat the following files as authoritative project input:

- `AGENTS.md`
- `assets/map/map-spec.yaml`
- `assets/map/map-layout.svg`
- `assets/scenario/scenario-spec.yaml`
- `assets/scenario/scenario-timeline.md`
- `assets/vehicle/Belligerents.yaml`

For vehicle geometry and visual references used in this stage, inspect:

- `assets/vehicle/Wasp/`
- `assets/vehicle/F-35B/`
- `assets/vehicle/Pantsir-S1/`

Use both the YAML descriptions and the supplied reference images.

Do not rewrite the project setting, battlefield layout, faction definitions, or scenario.

Do not invent a replacement timeline.

The scenario files are authoritative.

Use the exact faction identifiers:

- `landings_attacker`
- `island_defender`

Do not introduce `blue`, `red`, `blue force`, or `red force` terminology.

# 2. AGENTS.md Is Mandatory

Read and obey `AGENTS.md`.

Its human-visibility restriction is a hard project constraint.

Do not modify or weaken it.

Do not create visible human figures for environmental decoration, scale reference, cockpit occupancy, deck activity, rescue activity, or any other purpose.

Cockpit glazing must prevent visible occupants from being required.

All scene activity must be communicated through vehicles, machinery, lights, doors, ramps, weapons, radar systems, ships, aircraft, infrastructure, and environmental effects.

# 3. Overall Iteration Plan

This project will be developed in multiple major stages.

This task implements **Stage 1 only**.

Future stages will separately add:

1. the complete Ash Harbor static environment;
2. the Harbor and Industrial destruction sequences;
3. island_defender reinforcement, support, withdrawal, and vehicle-loss behavior;
4. the LCAC / LAV-25 amphibious landing theater;
5. full 180-second integration;
6. aftermath, camera expansion, visual polish, and performance optimization.

Do not preemptively implement those stages now.

Architect Stage 1 so they can be added cleanly later.

# 4. Scope of This Stage

Implement:

## Stage 1 — Core Runtime + Opening Vertical Slice

The implemented scenario range for this task is:

**T+00:00 through T+00:48**

Use the exact authoritative events from `scenario-spec.yaml` and `scenario-timeline.md` that occur inside this time range.

Do not independently redesign their timing.

The stage must create a complete vertical slice from:

- offshore staging;
- F-35B launch;
- transition into flight;
- Radar Hill detection;
- Pantsir-S1 response;
- fixed air-defense response;
- first strike;
- Pantsir-S1 destruction;
- primary search radar destruction;
- persistent post-impact state.

# 5. Required Technology Direction

Inspect the current `package.json` first.

Keep the existing React / TypeScript / Vite project.

If the required 3D dependencies are not installed, add the smallest justified set needed for this project.

The intended stack is:

- React
- TypeScript
- Vite
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing` only if genuinely useful

Do not add a large general UI framework.

Do not add a heavyweight physics engine for this stage.

Do not introduce a large game engine abstraction.

Prefer deterministic authored motion and lightweight mathematical simulation.

Keep the code modular enough for later stages but do not over-engineer a generic game engine.

# 6. Core Simulation Architecture

This requirement is more important than visual polish.

Implement a deterministic simulation-time architecture.

The visual state of important entities must be derivable from simulation time.

Avoid designing the scenario as a chain of irreversible `setTimeout()` calls.

A user must be able to seek directly from:

`T+00:05`

to:

`T+00:43.2`

and obtain a visually coherent world state.

At T+00:43.2, for example:

- the first F-35B must already be at the correct point on its authored flight path;
- the second F-35B must be at its own correct state;
- the first Pantsir-S1 must already be destroyed;
- its wreck must exist;
- its persistent fire and smoke state must exist;
- the primary radar must still reflect the correct pre-destruction or destruction transition state according to the authoritative timeline;
- all other active machinery must be in an appropriate deterministic state.

Seek correctness does not require reconstructing every historical particle trajectory.

Transient effects may be approximated or regenerated.

Persistent scenario state must be correct.

# 7. Simulation Controls

Implement a compact functional control interface.

Required:

- play;
- pause;
- restart from T+00:00;
- seek timeline;
- `0.5×`;
- `1×`;
- `2×`.

Display:

- relative simulation time, such as `T+00:23`;
- corresponding local time, such as `05:27:23 LOCAL`.

When paused:

- battlefield simulation time must stop;
- the spectator camera must remain fully usable.

When restarted:

- transient debris must clear;
- smoke and fires must reset appropriately;
- destroyed entities must return to their initial states;
- aircraft must return to launch state;
- radar systems must return to initial operation;
- no duplicate transient effects may survive the reset.

# 8. Spectator Camera

Implement a robust spectator / god-view camera.

The user does not pilot any unit.

Required camera capabilities:

- rotate;
- pan;
- zoom;
- free spatial observation appropriate for a large battlefield;
- camera remains active while simulation is paused.

Provide at least these presets:

- `Overview`
- `Wasp`
- `Radar Hill`
- `F-35B 01`

The aircraft preset may follow or track the first F-35B.

Do not create a mandatory automatic cinematic camera.

The observer must retain control.

# 9. World Shell

Use `map-spec.yaml` as the coordinate authority.

For Stage 1, do not build the entire final Ash Harbor environment.

Create a low-detail world shell sufficient to establish:

- total battlefield scale;
- coastline;
- ocean;
- basic terrain mass;
- Radar Hill;
- offshore area containing Wasp.

Other approved map regions should remain spatially recognizable at low detail where useful, but do not spend Stage 1 building their final industrial or harbor assets.

The final map specification must remain compatible with future stages.

Do not redesign the coastline.

Do not change the approved region layout.

# 10. Dawn Environment

Match the scenario environment:

- early dawn;
- cold ambient sky;
- low warm horizon illumination;
- light coastal haze;
- clear enough visibility for long-distance observation;
- no precipitation.

Fire and explosion illumination should be visually meaningful against the dawn environment.

Keep lighting efficient enough for a browser application.

# 11. Wasp-Class Amphibious Assault Ship

Create a recognizable procedural / authored 3D approximation of the Wasp-class ship using the supplied YAML and reference images.

Prioritize:

- silhouette;
- overall proportions;
- long flight deck;
- island superstructure;
- deck edges;
- hull proportions;
- major deck markings or structural hints;
- coherent materials.

Do not attempt CAD-level accuracy.

The ship should be convincing at normal spectator-camera distances.

The Wasp remains underway throughout this vertical slice.

Provide subtle ship motion and wake.

Do not place visible crew on the deck.

# 12. F-35B Modeling

Create two recognizable F-35B aircraft from the supplied reference material.

Prioritize:

- correct overall silhouette;
- nose and fuselage proportions;
- wing planform;
- twin vertical stabilizers;
- intake placement;
- canopy volume;
- landing gear;
- F-35B-specific lift-fan area;
- rear exhaust nozzle.

The aircraft do not need DCS-level geometry.

They must be recognizable and visually convincing at the expected viewing distance.

Use dark or reflective cockpit glazing.

No occupant must be visible.

# 13. F-35B STOVL Launch

The user specifically supplied F-35B vertical-takeoff reference material.

Use it.

Do not fake the launch by translating a completely static aircraft vertically.

The STOVL sequence should visibly communicate the F-35B lift system.

At minimum model and animate:

- lift-fan door opening;
- rear exhaust nozzle rotating downward;
- aircraft vertical lift;
- transition into forward motion;
- rear nozzle gradually returning toward forward-flight orientation;
- landing-gear retraction;
- lift-fan door closing during transition.

Simplification is acceptable.

Mechanical plausibility and readable motion are more important than reproducing every internal component.

Do not spend excessive time building invisible internal engine machinery.

The visible external sequence matters most.

# 14. STOVL Environmental Response

The launch should affect its immediate environment.

Use cinematic approximation rather than CFD.

Possible visible effects include:

- downward exhaust / hot-flow visualization;
- heat distortion;
- deck-adjacent haze;
- light vapor;
- subtle local deck dust or salt-particle response;
- localized ocean-surface disturbance near the ship if visually appropriate.

Keep these effects restrained.

The aircraft launch should feel powerful without covering the entire deck in opaque particles.

# 15. F-35B Flight Paths

Use authored deterministic paths.

Do not implement player flight controls.

Aircraft should:

- depart Wasp;
- transition to forward flight;
- accelerate;
- move toward Radar Hill;
- perform the scenario events defined inside T+00:00–00:48.

The two aircraft should not occupy identical trajectories.

Small differences in:

- launch timing;
- turn direction;
- altitude;
- path curvature;

are desirable as long as the authoritative scenario remains respected.

Do not create a prolonged dogfight.

# 16. Radar Hill

Build enough of Radar Hill to support the opening engagement.

Use the relevant map geometry from `map-spec.yaml`.

Include:

- terrain elevation;
- primary search radar;
- tracking radar or secondary radar equipment;
- primary Pantsir-S1;
- simplified fixed AAA emplacement;
- minimal support structures;
- access-road hints where appropriate.

The hill should read as an elevated military installation rather than a cone with objects placed on top.

# 17. Radar Animation

Before engagement:

- primary radar rotates continuously;
- secondary / tracking equipment has its own lower-intensity motion.

When incoming aircraft are detected:

- radar behavior changes according to the authoritative scenario;
- tracking systems visibly orient toward the threat.

After primary radar destruction:

- the primary radar stops functioning;
- secondary equipment must not automatically become completely dead;
- some surviving activity remains.

# 18. Pantsir-S1

Create a recognizable Pantsir-S1 from its supplied YAML and images.

Prioritize:

- truck chassis;
- turret;
- radar;
- missile-launcher blocks;
- gun barrels;
- recognizable proportions.

Use moving mechanical parts.

Before firing:

- turret / radar tracks appropriately.

During engagement:

- the system visibly fires;
- launcher state changes;
- smoke / exhaust appears;
- missile leaves the vehicle;
- missile trail is visible.

The weapon system should feel mechanical rather than being represented by arbitrary lines emitted from a static truck.

# 19. Fixed AAA

Add a simplified fixed air-defense gun position.

It does not need a dedicated high-detail real-world model in this stage.

Required visual behavior:

- tracking or aiming;
- short controlled firing sequences;
- restrained tracer density.

Do not fill the sky with continuous laser-like tracer lines.

Tracer fire must support the scene rather than dominate it.

# 20. Air-Defense Missiles

Implement visually readable authored missile motion.

Missiles should include:

- launch impulse;
- initial exhaust;
- smoke trail;
- curved interception path;
- finite lifetime.

Do not implement a complete aerodynamic missile simulation.

A deterministic authored interception path is acceptable.

No requirement exists for a successful aircraft kill in Stage 1.

# 21. Initial Strike Effects

Implement a reusable effect foundation suitable for later stages.

Stage 1 needs at least these conceptual capabilities:

- impact flash;
- explosion fireball;
- debris emission;
- selected fragment motion;
- dust burst;
- smoke source;
- persistent fire;
- persistent wreck;
- ground scorch / damage mark;
- simple shockwave visual.

Names and component structure are up to you.

The important requirement is that the implementation can later be extended into much larger industrial hero effects.

Avoid building each explosion as unrelated one-off code.

# 22. Pantsir-S1 Destruction

At the authoritative destruction time inside the Stage 1 window, the primary Pantsir-S1 is destroyed.

It must not:

- disappear;
- instantly swap into an unrelated generic cube;
- vanish beneath particles.

Its destruction should include multiple layers:

1. ignition flash;
2. compact fireball;
3. sparks;
4. several debris fragments;
5. visible chassis response;
6. persistent fire;
7. dark smoke;
8. surviving wreck.

The wreck must remain visible after transient particles fade.

Seeking to a time after the destruction must reconstruct the wrecked state.

# 23. Primary Radar Destruction

The primary search radar is subsequently disabled / destroyed according to the authoritative timeline.

Use:

- bright impact flash;
- medium explosion;
- structural debris;
- dust;
- persistent smoke;
- visible physical damage.

The radar should stop rotating.

Secondary equipment should continue appropriate residual operation.

Do not destroy the entire installation with one explosion.

# 24. Persistent Damage

At the end of T+00:48, the world should preserve evidence of what happened.

Required persistent state:

- destroyed Pantsir-S1 wreck;
- Pantsir fire and smoke;
- damaged / destroyed primary radar;
- persistent radar-site smoke or small fire;
- ground scorch;
- appropriate local debris.

Stage 1 must not visually reset itself after each explosion.

# 25. Effect Performance

This is a browser 3D project.

Use sensible techniques such as:

- object pooling;
- instancing;
- shared geometry;
- shared materials;
- limited shadow casters;
- efficient transient-particle management.

Do not create hundreds of individual React components for tiny particles.

Do not add full-map real-time rigid-body destruction.

Keep the implementation extendable for later hero explosions.

# 26. Explicit Non-Goals

Do NOT implement during this stage:

- the final detailed Harbor District;
- Talwar destruction;
- Molniya withdrawal;
- fuel-storage destruction;
- ammunition-storage destruction;
- full industrial district;
- full Convoy Corridor behavior;
- BTR-80 combat sequence;
- T-72B reinforcement sequence;
- second Pantsir-S1 sequence;
- Su-30MKK sequence;
- LCAC landing;
- LAV-25 deployment;
- complete 180-second timeline;
- aftermath mode beyond what is minimally necessary for the Stage 1 slice;
- audio;
- visible humans;
- infantry;
- cockpit occupants;
- deck crews;
- rescue personnel;
- humanoid silhouettes;
- complex multiplayer or player combat systems;
- full rigid-body destruction physics;
- full aerodynamic aircraft simulation;
- historical lore expansion.

Do not implement these merely because their reference assets exist.

# 27. Asset Policy

Prefer the supplied project references.

Do not replace the provided vehicle references with unrelated downloaded models.

The point of this project is for the generated 3D implementation to interpret the supplied reference material.

Procedural geometry is acceptable.

Simplified modeling is acceptable.

Recognizable silhouettes and mechanical behavior are more important than microscopic detail.

# 28. Code Quality Expectations

Use TypeScript intentionally.

Separate concerns between:

- authoritative scenario data;
- simulation time;
- derived entity state;
- rendering;
- transient effects;
- persistent damage;
- camera controls;
- UI controls.

Avoid a giant `App.tsx`.

Avoid placing the entire simulation into one component.

Do not over-engineer an abstract ECS unless it clearly helps this project.

Prefer understandable project-specific architecture.

# 29. Testing

At minimum add automated tests for deterministic simulation logic where practical.

Important logic to test includes:

- simulation time conversion;
- local-time display;
- event-boundary state;
- destroyed / intact transitions;
- restart state;
- seek state.

Tests do not need to test Three.js rendering pixels.

They should protect the timeline logic that the visual layer depends on.

Run:

- type checking;
- linting;
- unit tests;
- production build.

Fix failures caused by your changes.

Do not report completion while these checks are failing unless the failure is demonstrably unrelated and already existed.

# 30. Browser / Visual Validation

Run the application and inspect it visually.

Do not treat a successful TypeScript build as visual validation.

Inspect several important moments, including approximately:

- T+00:00;
- first F-35B STOVL launch;
- Radar Hill engagement;
- immediately after primary Pantsir-S1 destruction;
- near T+00:48.

Specifically verify:

- Wasp scale is believable;
- F-35B aircraft are recognizable;
- STOVL motion is not simply static vertical translation;
- lift-fan door movement is visible;
- rear-nozzle movement is visible;
- aircraft do not intersect Wasp during launch;
- radar tracking is readable;
- missile and tracer density is restrained;
- explosion effects do not completely hide the affected entity;
- Pantsir wreck persists;
- Radar Hill remains readable;
- camera controls remain usable;
- paused camera movement works;
- seeking backward and forward does not duplicate wrecks, particles, smoke sources, or aircraft.

If you find a visual problem, fix it before finishing.

# 31. Acceptance Criteria

Stage 1 is complete only when all of the following are true.

## Runtime

- The application loads into the 3D battlefield.
- Timeline starts at T+00:00.
- Play works.
- Pause works.
- Restart works.
- 0.5×, 1×, and 2× work.
- Timeline seek works.
- Spectator camera continues moving while simulation is paused.

## Determinism

- Seeking directly to an arbitrary time produces coherent state.
- Restart produces the same initial world every time.
- Replaying does not accumulate duplicate effects.
- Persistent destruction reconstructs correctly after seek.

## World

- Ash Harbor scale is established.
- Wasp exists offshore.
- Radar Hill is visibly elevated.
- Other map regions remain compatible with the authoritative specification.

## F-35B

- Two recognizable F-35B aircraft exist.
- STOVL launch visibly uses the F-35B-specific lift system.
- Lift-fan door moves.
- Rear nozzle rotates.
- Vertical lift transitions into forward flight.
- Landing gear retracts.
- No visible occupant exists.

## Combat

- Radar Hill reacts to incoming aircraft.
- Pantsir-S1 tracks and engages.
- Fixed AAA engages.
- Air-defense missiles and tracers are visually readable.
- First strike occurs.
- Primary Pantsir-S1 is destroyed.
- Primary search radar is subsequently disabled / destroyed.
- Surviving secondary Radar Hill activity remains visible.

## Effects

- Explosions contain multiple effect layers.
- Debris is visible.
- Persistent smoke exists.
- Persistent fire exists.
- Destroyed Pantsir remains as a wreck.
- Ground damage remains visible.
- The effect architecture is reusable for later larger destruction sequences.

## Quality

- No visible human is created anywhere.
- No audio is required.
- Typecheck passes.
- Lint passes.
- Tests pass.
- Production build passes.
- Visual browser inspection has been performed.

# 32. Final Response

When implementation is complete, summarize:

1. architecture created;
2. files added or substantially changed;
3. how deterministic seek / reset works;
4. how the F-35B STOVL sequence was implemented;
5. how destruction persistence works;
6. tests and validation performed;
7. any remaining Stage 1 visual limitations that should be addressed before Stage 2.

Do not claim features from future stages as completed.

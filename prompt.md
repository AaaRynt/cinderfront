# Cinderfront — Stage 2: Full Ash Harbor World Construction

Work directly in the existing Cinderfront repository.

Stage 1 is complete.

This task implements **Stage 2 only**.

Do not stop after producing a plan. Inspect the repository, implement the stage, validate the result under the repository rules, visually inspect the running application, fix issues you discover, and leave the project in a coherent working state.

# 1. Read the Repository Rules First

Before changing code, read:

- `AGENTS.md`
- `ITERATION_PLAN.md`

`AGENTS.md` is authoritative for repository-level constraints and working rules.

Do not weaken, bypass, reinterpret, or overwrite its restrictions.

If `AGENTS.md` prohibits a command such as formatting or production build, do not run that command.

Run every relevant project validation that is permitted by `AGENTS.md`.

Do not invent additional restrictions that are not actually present in the repository.

# 2. Authoritative Project Inputs

Read and use:

- `assets/map/map-spec.yaml`
- `assets/map/map-layout.svg`
- `assets/scenario/scenario-spec.yaml`
- `assets/scenario/scenario-timeline.md`
- `assets/vehicle/Belligerents.yaml`

Also inspect the vehicle reference files required by this stage:

- `assets/vehicle/Wasp/`
- `assets/vehicle/Talwar/`
- `assets/vehicle/Project 12418 Molniya missile boat/`

The YAML map specification is the authoritative spatial source.

The SVG is a human-readable technical reference and should be used to visually cross-check the interpretation of the YAML.

Do not redesign Ash Harbor.

Do not rewrite the authoritative scenario.

Use the faction identifiers already defined by the project.

Do not introduce alternative color-based faction terminology.

# 3. Existing Stage 1 Baseline

Stage 1 already provides:

- deterministic T+00:00–00:48 runtime;
- direct timeline seeking;
- restart;
- pause;
- playback speeds;
- spectator camera;
- camera presets;
- low-detail Ash Harbor world shell;
- Wasp-class ship;
- two F-35B aircraft;
- deterministic F-35B STOVL launch;
- Radar Hill;
- Pantsir-S1;
- fixed air-defense activity;
- opening combat sequence;
- persistent Pantsir and radar destruction;
- HUD;
- automated simulation tests.

Treat these as regression-critical functionality.

Stage 2 must preserve them.

Do not replace the deterministic runtime merely because a different architecture would be convenient for world construction.

Do not rewrite Stage 1 combat timing.

# 4. Stage 2 Goal

Turn the current low-detail Ash Harbor world shell into the complete physical battlefield defined by `map-spec.yaml`.

At T+00:00, before most destruction occurs, a spectator should already be able to travel throughout the entire 14 km × 10 km battlefield and see a coherent, visually differentiated, convincing coastal military-industrial environment.

Stage 2 is primarily about:

- terrain;
- coastline;
- water;
- harbor infrastructure;
- industrial infrastructure;
- roads and utilities;
- Radar Hill visual integration;
- Convoy Corridor physical environment;
- Remote Beachhead;
- environmental detail vocabulary;
- Talwar-class frigate;
- Project 12418 Molniya missile boat.

Do not advance the later battle storyline.

# 5. Preserve the Approved Map

Use the physical geometry from `assets/map/map-spec.yaml`.

Preserve:

- map bounds;
- coordinate system;
- coastline topology;
- Harbor District position;
- Fuel Storage position;
- Ammunition Storage position;
- Radar Hill position;
- Convoy Corridor;
- Remote Beachhead;
- offshore naval staging area;
- approved roads;
- rail;
- pipelines;
- major utilities;
- region separation.

Do not casually move major facilities because another arrangement looks more convenient in 3D.

Minor implementation-level adjustments are acceptable only when required to prevent obvious geometry intersections or rendering defects.

If such an adjustment is required, keep it minimal and report it.

# 6. Terrain Upgrade

The Stage 1 terrain is intentionally simplified.

Replace the obvious low-detail / terraced test appearance with a more convincing continuous landscape while retaining authoritative elevations and world layout.

The terrain should support:

- industrial flatlands;
- harbor shoreline;
- Radar Hill ridge;
- natural slopes;
- dry inland terrain;
- drainage / dry wash geometry;
- coastal bluff transitions;
- dunes;
- remote beach terrain.

Do not make Radar Hill a simple cone.

Do not flatten the entire map into a nearly uniform plane.

The topography should remain readable from both:

- high overview;
- low spectator-camera viewpoints.

Use efficient procedural or authored geometry.

Do not create unnecessary microscopic terrain tessellation across the full 14 × 10 km world.

# 7. Ground Surface Language

Different physical areas should visually read as different surfaces.

Create a restrained but convincing material vocabulary for:

- dry soil;
- rock;
- sparse dry grass;
- scrubland;
- sand;
- compacted beach ground;
- industrial pavement;
- road asphalt;
- gravel or service areas;
- shallow-water transition.

Procedural materials, vertex colors, lightweight noise, or reusable textures are acceptable.

Do not require large high-resolution texture sets merely to create variation.

Avoid making the entire landmass one uniform brown or green material.

# 8. Coastline and Water

Upgrade the coast using the authoritative shoreline geometry.

Support:

- open coastal water;
- harbor water;
- shallow-water transitions;
- Remote Beachhead nearshore water;
- visually appropriate depth / color changes;
- shoreline blending.

The water should be credible at both:

- overview distance;
- moderate low-altitude spectator distance.

Preserve the existing Stage 1 Wasp water interaction.

Improve it where necessary without breaking Stage 1.

Do not implement harbor fuel contamination yet.

That belongs to Stage 3.

# 9. Harbor District

Build the Harbor District as a complete physical environment.

Use the map specification for geometry and placement.

Include where defined or spatially justified by the specification:

- breakwaters;
- harbor entrance;
- navigation channel;
- harbor basin;
- major piers;
- jetties;
- military berths;
- support berths;
- warehouses;
- maintenance areas;
- crane structures;
- harbor service roads;
- industrial hardstands;
- pipe infrastructure;
- utility compounds;
- power distribution infrastructure;
- fences;
- lighting infrastructure;
- small defensive structures.

Prioritize silhouette, spatial coherence, and industrial density.

Do not model every bolt.

Repeated structures should reuse geometry and materials.

The Harbor District must feel capable of supporting the later Talwar damage, Molniya withdrawal, surface fires, and harbor destruction sequence.

Do not implement those destruction events during Stage 2.

# 10. Fuel Storage District

Construct the Fuel Storage Area in full enough detail to support Stage 3 hero destruction.

It must not look like several isolated cylinders placed on empty terrain.

Include:

- multiple fuel tanks;
- size variation where supported;
- tank containment berms;
- firebreak spacing;
- pipe racks;
- pipelines;
- pump / transfer structures;
- valve or junction structures where useful;
- service roads;
- maintenance areas;
- utility structures;
- lighting;
- connection toward the harbor;
- freight or transfer infrastructure defined in the map specification.

The geometry does not need engineering-level precision.

It must read as a connected industrial system.

Prepare large structures so future Stage 3 effects can attach:

- fire sources;
- smoke sources;
- damage marks;
- debris origins.

Do not implement the actual fuel-storage cascade yet.

# 11. Ammunition Storage District

Construct a visually distinct Ammunition Storage Area.

Include:

- individual magazines or bunkers;
- protective earth berms;
- meaningful spacing;
- loading / transfer areas;
- internal access roads;
- logistics access;
- fences or security boundaries;
- support structures where appropriate.

Do not make it visually identical to the fuel district.

A viewer should be able to understand from the geometry alone that these are different industrial / military functions.

Prepare the compound for later:

- local cook-off points;
- primary detonation area;
- persistent wreckage;
- local fire attachment points.

Do not implement the Stage 3 detonation sequence yet.

# 12. Harbor-to-Industrial Connections

Implement major static connections defined by the map:

- pipelines;
- pipe racks;
- service roads;
- freight rail;
- utility connections.

These connections are important environmental storytelling.

The harbor and industrial districts should feel physically related without collapsing into one dense visual cluster.

Use proper ground clearance and support structures where appropriate.

Avoid impossible pipeline jumps or rail segments passing visibly through buildings.

# 13. Radar Hill Upgrade

Preserve all Stage 1 functional behavior.

Improve the visual world around Radar Hill.

Add or refine:

- natural ridge / plateau shape;
- slope transitions;
- access road;
- cut slopes or retaining treatment where useful;
- radar platforms;
- SAM / Pantsir platform;
- fixed AAA platform;
- communications infrastructure;
- support buildings;
- generators or utility infrastructure;
- fencing;
- sparse hill vegetation;
- rock and dirt variation.

Do not break:

- radar tracking;
- Pantsir tracking;
- missile launch;
- fixed AAA;
- T+00:42 Pantsir destruction;
- T+00:45 radar destruction;
- persistent damage reconstruction;
- seeking.

After the upgrade, Stage 1 should look better without behaving differently.

# 14. Convoy Corridor

Build the physical environment needed for the later Stage 4 vehicle behavior.

Include:

- principal road corridor;
- branch roads;
- road width variation where appropriate;
- intersections;
- lay-bys / pull-off areas;
- service or maintenance yard;
- utility compound;
- road chokepoint;
- culvert or bridge;
- dry wash / drainage;
- guardrails or barriers where useful;
- sparse roadside infrastructure;
- optional quarry / abandoned industrial area if already supported by the map specification.

The region should remain relatively open.

Do not turn it into a city.

The roads should provide believable future paths for:

- BTR-80;
- T-72B;
- Pantsir-S1;
- rescue vehicles;
- logistics vehicles.

Do not implement those later vehicle sequences yet.

# 15. D / E Separation

Preserve and visually strengthen the approved separation between:

- Convoy Corridor;
- Remote Beachhead.

Use the map-defined:

- dry wash;
- low ridge;
- bluff;
- barren terrain;
- other separator geometry.

The Remote Beachhead must remain a distinct secondary theater.

A spectator should not perceive the beach exit as immediately merging into the principal defender convoy route.

# 16. Remote Beachhead

Construct the full physical landing environment.

Include:

- deeper coastal water;
- shallow-water transition;
- intertidal area;
- broad beach;
- dunes;
- sparse vegetation;
- coastal scrub;
- low bluff or rocky transition where defined;
- firm beach exit;
- inland hardstand / open ground;
- two distinct inland access paths;
- minimal shoreline military remnants where appropriate.

The environment should clearly be capable of supporting future LCAC beaching and LAV-25 deployment.

Do not create:

- LCAC landing;
- ramps;
- LAV-25 movement;
- landing arrows;
- future event markers.

Those belong to Stage 5.

# 17. Vegetation System

Create an efficient sparse vegetation system appropriate for the dry coastal environment.

Possible categories include:

- dry grass patches;
- scrub;
- bushes;
- occasional small trees;
- coastal vegetation.

Avoid dense forests.

Repeated vegetation should use efficient rendering techniques such as instancing where practical.

Most importantly, structure selected nearby environmental objects so a later Stage 3 local shock-response system can address them.

Future Stage 3 effects will need selected vegetation to support:

- bend away from blast;
- rebound;
- slight overshoot;
- local ignition.

Do not implement the explosion response in Stage 2.

Do not build every grass blade as an individually addressable React component.

Use a practical response-group or instance-data strategy.

# 18. Lightweight Environmental Props

Create reusable project-specific primitives for environmental detail.

Useful examples include:

- fences;
- utility poles;
- light poles;
- road signs;
- pipe supports;
- industrial barriers;
- storage sheds;
- generators;
- transformers;
- rock clusters;
- drainage structures;
- maintenance props.

Prefer reusable primitives with shared geometry and materials.

Do not create a giant generic framework.

The goal is a rich world, not an architecture exercise.

# 19. Talwar-Class Frigate

Use:

- `assets/vehicle/Talwar/talwar.yaml`
- supplied Talwar reference images

Create a recognizable procedural / authored Talwar-class frigate.

Prioritize:

- hull proportions;
- bow shape;
- deck silhouette;
- superstructure;
- mast and radar silhouette;
- main gun;
- missile-area shapes;
- helicopter deck;
- major sensor and antenna structures;
- believable waterline.

Do not attempt CAD-level detail.

It should remain recognizable at normal Harbor spectator distances.

Prepare its internal scene structure for future Stage 3 behavior.

The implementation should make future support practical for:

- progressive list;
- progressive flooding / sinking;
- multiple localized hit points;
- deck fire attachment points;
- smoke attachment points;
- fuel leakage origin;
- reduced defensive activity.

At Stage 2:

- keep it moored;
- keep it intact;
- allow only subtle idle motion if appropriate.

Do not implement its combat damage sequence yet.

# 20. Project 12418 Molniya Missile Boat

Use:

- `assets/vehicle/Project 12418 Molniya missile boat/project-12418-molniya.yaml`
- supplied reference image

Create a recognizable procedural / authored Project 12418 Molniya missile boat.

Prioritize:

- compact fast-attack-craft hull;
- superstructure;
- large anti-ship missile launcher shapes;
- main gun;
- radar;
- mast;
- recognizable silhouette;
- believable waterline.

Prepare it for future:

- departure from berth;
- turning;
- acceleration;
- wake changes;
- damaged movement;
- smoke attachment.

At Stage 2 it remains in its initial scenario state.

Do not implement its emergency departure or damage sequence yet.

# 21. Wasp Preservation

Do not unnecessarily rebuild the Stage 1 Wasp.

Improve its environmental integration if needed.

Preserve:

- scale;
- placement;
- F-35B STOVL compatibility;
- Stage 1 launch behavior.

If ocean / wake improvements require touching the Wasp integration, regression-test both F-35B launches afterward.

# 22. Stage 1 Vehicle Preservation

Do not use Stage 2 as an excuse to rewrite:

- F-35B;
- Pantsir-S1;
- existing missile logic;
- existing destruction architecture;

unless a concrete visual or compatibility problem requires a focused change.

Any change to these systems must preserve deterministic Stage 1 behavior.

# 23. Environmental Motion

The world should not feel perfectly frozen at T+00:00.

Subtle acceptable motion includes:

- ocean movement;
- ship motion;
- radar rotation;
- distant machinery;
- light wind response;
- restrained vegetation motion;
- haze.

Do not add new combat events merely to create activity.

# 24. Performance Architecture

Remember that later stages will add:

- large black smoke columns;
- multiple persistent fires;
- hero explosions;
- flaming debris;
- multiple moving armored vehicles;
- aircraft;
- LCAC wakes and spray.

Stage 2 must therefore leave meaningful rendering headroom.

Use where useful:

- instancing;
- shared materials;
- shared geometry;
- batched repeated props;
- distance simplification;
- LOD;
- restrained shadow casting;
- bounded shadow distance.

Avoid:

- one React component per grass blade;
- unique materials for hundreds of identical props;
- unnecessary high-segment geometry;
- excessive transparent layers;
- tens of thousands of independent scene objects without justification.

Do not optimize blindly.

Use browser inspection and available profiling information to identify obvious problems.

# 25. Architecture

Keep world-building code modular.

Suitable domain-oriented organization may include concepts such as:

- terrain;
- water;
- harbor;
- industrial;
- radar hill;
- roads;
- beach;
- vegetation;
- utilities;
- environment primitives;
- naval vehicles.

Exact filenames and component names are your choice.

Avoid turning `BattlefieldScene.tsx` into a monolithic file containing every structure in Ash Harbor.

Also avoid creating an unnecessarily abstract general-purpose world engine.

Build for Cinderfront.

# 26. Explicit Non-Goals

Do NOT implement during Stage 2:

- Talwar combat damage;
- Talwar sinking;
- harbor fuel fire;
- Molniya emergency departure;
- Molniya combat damage;
- fuel-storage explosion;
- ammunition-storage cook-off;
- hero industrial explosions;
- blast-driven vegetation bending;
- vegetation ignition;
- rescue convoy behavior;
- generic support vehicles;
- BTR-80 Stage 4 behavior;
- T-72B Stage 4 behavior;
- second Pantsir Stage 4 behavior;
- Su-30MKK Stage 4 behavior;
- LCAC landing;
- LAV-25 deployment;
- full 180-second timeline;
- aftermath integration;
- audio;
- automatic cinematic direction;
- player vehicle controls;
- new scenario lore;
- new map geometry replacing the authoritative map.

Do not implement future-stage features simply because their references exist.

# 27. Validation Strategy

Respect `AGENTS.md`.

Run all relevant validation commands permitted by the repository rules.

At minimum, where permitted, validate:

- TypeScript;
- lint;
- existing Vitest suite;
- any new deterministic / geometry logic tests that are practical.

If formatting or build commands are prohibited by `AGENTS.md`, do not run them.

If they are permitted, follow the repository's actual scripts rather than inventing new commands.

Do not claim that a prohibited validation was performed.

# 28. Stage 1 Regression Validation

After Stage 2 world construction, explicitly verify the Stage 1 sequence still works.

Inspect at least:

- T+00:00;
- first F-35B launch;
- second F-35B launch;
- Radar Hill engagement;
- T+00:36;
- T+00:42;
- T+00:45;
- T+00:48.

Verify:

- both F-35B launches remain correct;
- aircraft do not intersect the changed world;
- Pantsir tracks and fires;
- radar tracks;
- Pantsir destruction reconstructs after seek;
- radar destruction reconstructs after seek;
- persistent fire and smoke remain correct;
- restart does not duplicate state;
- camera remains usable while paused.

# 29. Full-World Browser Inspection

Do not validate Stage 2 only from the original Stage 1 camera location.

At T+00:00, pause the scenario and inspect the full battlefield.

Perform visual inspection from at least these areas:

## Overview

Confirm the six physical theaters are spatially readable:

- Harbor District;
- Fuel / Ammunition District;
- Radar Hill;
- Convoy Corridor;
- Remote Beachhead;
- Offshore area.

## Harbor

Verify:

- harbor scale;
- navigable water;
- pier proportions;
- infrastructure density;
- Talwar scale;
- Molniya scale;
- believable ship-to-berth relationships.

## Industrial

Verify:

- fuel and ammunition areas are visually distinct;
- pipe / rail / service connections make physical sense;
- industrial density is convincing without becoming cluttered;
- future destruction attachment areas remain accessible.

## Radar Hill

Verify:

- terrain no longer reads as a crude test terrace;
- the installation fits the topography;
- Stage 1 effects remain readable.

## Convoy Corridor

Verify:

- road network is coherent;
- chokepoint is visually understandable;
- future armored / rescue movement has adequate space.

## Remote Beachhead

Inspect from:

- inland;
- beach level;
- offshore looking toward land.

Verify that the geometry visibly supports future LCAC approach and vehicle unloading.

## Offshore

Verify:

- Wasp scale relative to map and coast;
- adequate open-water staging space;
- horizon and coastal haze are convincing.

Fix significant visual problems found during inspection before finishing.

# 30. Acceptance Criteria

Stage 2 is complete only when:

## World

- the complete Ash Harbor physical layout is represented;
- all six major regions are visually distinguishable;
- the full map no longer reads as a temporary world shell;
- terrain transitions are coherent;
- coastline and water are convincing;
- the approved map layout is preserved.

## Harbor

- major harbor infrastructure exists;
- Talwar is recognizable and correctly scaled;
- Molniya is recognizable and correctly scaled;
- both fit their berths;
- harbor infrastructure supports future Stage 3 damage scenes.

## Industrial

- fuel storage is a coherent connected industrial system;
- ammunition storage is distinct;
- pipelines / roads / rail / utilities provide environmental structure;
- the district is ready for future hero destruction.

## Radar Hill

- Stage 1 functionality remains intact;
- terrain and infrastructure are substantially improved;
- the hill feels physically integrated into the landscape.

## Convoy Corridor

- the road system and chokepoint exist;
- later support and armored movement can be staged without rebuilding the region.

## Remote Beachhead

- water-to-beach terrain transition is complete;
- beach exits and two inland access paths are visible;
- later LCAC / LAV-25 staging can use the completed environment.

## Environment

- sparse vegetation exists;
- repeated vegetation is efficiently rendered;
- selected environmental objects can later support localized blast response;
- world detail uses reusable primitives.

## Regression

- deterministic seek still works;
- restart still works;
- Stage 1 destruction reconstructs correctly;
- spectator camera remains functional;
- no Stage 1 timeline behavior is broken.

## Repository constraints

- `AGENTS.md` has been obeyed;
- no future-stage scenario features were unnecessarily implemented.

# 31. Final Response

When Stage 2 is complete, report:

1. world architecture added or changed;
2. major map regions implemented;
3. terrain and material improvements;
4. Harbor and Industrial construction;
5. Talwar implementation;
6. Molniya implementation;
7. vegetation / reusable world-detail architecture;
8. rendering / performance decisions;
9. Stage 1 regression validation performed;
10. browser viewpoints inspected;
11. repository checks performed under `AGENTS.md`;
12. remaining visual or technical limitations that should be addressed before Stage 3.

Do not claim Stage 3 destruction features are implemented unless they were strictly necessary for Stage 2 infrastructure.

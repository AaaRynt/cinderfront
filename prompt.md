# Stage 4C — Environmental Storytelling and Coastal Realism

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer observes an authored scenario using spectator cameras, playback, pause, restart, speed controls, and direct seeking.

This is an implementation task. Read the repository, implement the scoped stage, complete the permitted checks, inspect the actual application in a browser, fix issues found during inspection, and deliver a coherent, reviewable result. Do not stop after planning.

## 1. Verified starting point and stage goal

Stage 4B.2C is complete in commit `1f91219`, following completed Stages 4B, 4B.2A, and 4B.2B. The current simulation ends at T+176. The latest documented validation baseline is 315 tests across 20 files.

Stage 4C is the next planned stage in `ITERATION_PLAN.md`.

Make Ash Harbor read as a long-used, dry coastal military and industrial site through five connected improvements:

1. region-specific vegetation and rock silhouettes;
2. surface history such as repairs, drainage stains, tire wear, and compacted shoulders;
3. localized industrial corrosion and purposeful maintenance/logistics clutter;
4. restrained sea motion, shoreline foam, wet/dry transitions, and shallow-water variation;
5. coherent early-dawn maritime atmosphere that preserves battlefield readability.

Deliver visible improvements at T+0 as well as after existing destruction events. Prioritize changes that can be seen from the established cameras. A larger object count or a global color adjustment alone does not complete this stage.

## 2. Read before editing

Read:

- `AGENTS.md`, `ITERATION_PLAN.md`, and `changelog.md`;
- `assets/map/map-spec.yaml` and `assets/map/map-layout.svg`;
- `assets/scenario/scenario-spec.yaml` and `assets/scenario/scenario-timeline.md`;
- `assets/vehicle/Belligerents.yaml`;
- authoritative LCAC and LAV-25 dimensions and approach/unloading route data, solely to reserve their future operating space;
- the current terrain, water, world, atmosphere, environmental primitives, deterministic layout, and exclusion-mask implementation;
- existing blast-response, industrial damage, harbor pollution, fire, smoke, and wake rendering;
- ground-vehicle routes and clearance tests, particularly the support convoy and T-72B yard exits;
- the current camera, HUD, Tailwind setup, and regression fixtures;
- `package.json` and the TypeScript configurations to identify permitted validation commands.

Relevant implementation entry points include:

- `src/scene/world/WorldShell.tsx`;
- `src/scene/world/stage2/TerrainAndWater.tsx`;
- `src/scene/world/stage2/VegetationSystem.tsx`;
- `src/scene/world/stage2/environment/`;
- `src/scene/world/stage2/terrainModel.ts` and `terrainGeometry.ts`;
- `src/scene/world/stage2/stage2Materials.ts`;
- `src/scene/world/stage2/HarborDistrict.tsx`, `IndustrialDistrict.tsx`, `ConvoyCorridor.tsx`, and `BeachheadEnvironment.tsx`;
- `src/scene/effects/stage3/BlastResponseField.tsx`;
- `src/scene/effects/stage4a/`;
- `src/scene/effects/SupportConvoyEffects.tsx`;
- `src/scene/BattlefieldScene.tsx`;
- `src/simulation/supportConvoy.test.ts`;
- `src/simulation/fixtures/`;
- `src/scene/camera/CameraRig.tsx`;
- `src/ui/SimulationHud.tsx` and `src/index.css`.

Verify the current implementation rather than treating this file's description as a substitute for inspection.

Repository constraints and the hard human-visibility policy take precedence. Preserve authoritative map/scenario data; this prompt supplies implementation scope and acceptance criteria, not permission to rewrite those references.

## 3. Scope and hard boundaries

Implement the five environmental improvements above using focused modules and existing infrastructure.

Keep:

- the 176-second duration;
- the current 40-event scoped timeline, including every event ID, time, and ordering;
- every actor roster, route, pose, condition, outcome, weapon release, and impact anchor;
- the current terrain-height and road-grounding contract;
- existing spectator controls and camera presets.

Do not add actors, weapons, scenario events, autonomous AI, traffic systems, weather simulation, audio, or aftermath mode.

Pantsir 02, both LCACs, eight LAV-25s, the excluded T+176 inland event, and full T+180 integration remain future work. Do not implement placeholders for them. Record the missing Pantsir 02 sequence as an outstanding integration gap; do not imply that an environmental pass completes it.

Do not redesign the HUD or perform a wholesale CSS/Tailwind migration.

### Absolute prohibition on visible humans

Never create, model, render, animate, or imply visible human characters, including personnel, crews, occupants, casualties, articulated bodies, or humanoid silhouettes.

Use vehicles, sealed machinery, infrastructure, equipment, lights, and environmental traces to communicate activity. Do not add figures behind windows, human-shaped props, mannequins, or crew-operated equipment requiring visible people.

## 4. Preservation contract

Capture representative before screenshots and rendering statistics before changing scene content. Use the same viewport, camera, and timestamp for after comparisons.

All existing simulation tests and immutable preservation fixtures must continue to pass. Do not regenerate old hashes or relax numerical assertions to accommodate visual work.

The preserved sequences include:

- Stage 1 launches, air-defense activity, Pantsir loss, and radar destruction;
- Talwar damage, fire, list, flooding, and mission kill;
- Molniya departure, damaged withdrawal, and open-water continuation;
- fuel ignition, cascade, sympathetic failures, and persistent wreckage;
- ammunition cookoff, primary detonation, and environmental blast response;
- BTR loss and survivor fallback;
- T-72B movement, F-35B strike, persistent lead wreck, and survivor reverse;
- Su-30MKK entry, pressure/support roles, damaged breakaway, covering withdrawal, and egress;
- support-convoy redirect, hesitation, bridge obstruction, and partial withdrawal.

Treat T+172 and T+176 as explicit regression checkpoints.

This stage may change environmental appearance and add deterministic visual samplers, but it must not alter the numerical actor simulation to obtain a more attractive composition.

## 5. Vegetation zoning and rock silhouettes

Follow the map's sparse, semi-arid setting: low scrub and dry grass dominate. Dense forest and tropical vegetation are prohibited.

Create visibly different regional patterns:

- Radar Hill: exposed rock, sparse low shrubs, wind-worn grass, and clear equipment pads;
- convoy corridor: discontinuous roadside growth, dry-wash concentrations, compacted shoulders, and mostly clear service areas;
- remote beach: low coastal scrub behind the wet zone, dune grass in sheltered patches, exposed sand toward the water;
- harbor and industrial districts: small pockets along boundaries and unused edges, with operational yards and firebreaks kept open.

Improve silhouettes through a small number of shared grass/scrub variants, irregular clumps, varied height/orientation, and restrained regional color differences. Avoid a uniformly random carpet of repeated cones.

Add grounded rock groups at selected ridges, dry-wash edges, and coastal outcrops. Represent localized roughness with visual rocks or surface treatment; do not change terrain elevation or grounding functions in this stage.

Reuse seeded layouts, stable instance IDs, shared geometry/materials, and instancing. Keep layouts independent of camera selection, mounting order, and simulation time.

Optional gentle vegetation motion must use absolute simulation time and small bounded displacement. Preserve existing authored blast bending, ignition, charring, and settling. Do not draw intact duplicate vegetation over a charred or destroyed response instance.

## 6. Spatial exclusion and future access

New vegetation, rocks, props, and surface layers must respect:

- mainland versus open-water masks;
- roads, shoulders, bridges, culverts, intersections, and yard entrances;
- building footprints, foundations, berms, tank containment, and firebreaks;
- radar pads and operational sensor clearances;
- piers, berth envelopes, harbor navigation channels, and ship trajectories;
- full existing BTR, T-72B, and support-convoy swept paths;
- the bridge obstruction and rear-convoy reverse maneuvers;
- authoritative LCAC approach, beaching, ramp/unloading space, and both LAV inland routes;
- beach exit apron and inland hardstand.

Use actual vehicle dimensions and swept-path clearance where needed, not only a centerline or a single timestamp. Derive future landing exclusions from authoritative data without creating future vehicles.

Prefer focused circle, polygon, and buffered-polyline exclusion helpers over a generic spatial-planning framework. Test representative accepted and rejected placements.

## 7. Surface history and industrial weathering

Give surfaces a readable history tied to their purpose:

- harbor: quay-edge salt staining, drainage streaks, cargo handling wear, and limited dockside grime;
- fuel storage: restrained rust around seams/supports, drainage/runoff marks, oil stains near pumps and transfer equipment, and worn access surfaces;
- ammunition compound: dusty hardstands, repair patches, berm material variation, and modest loading-area wear;
- service yard/corridor: tire-worn entrances, patched pavement, gravel shoulders, maintenance stains, and a few reused barriers;
- remote beach: wet sand, irregular dry-sand edges, restrained stranded material, and aged existing concrete remains.

Use directional wear, contact-area stains, and material-specific roughness/color variation. Avoid painting every surface uniformly brown or covering the whole map with noisy textures.

Ground overlays against the existing rendered surface. Avoid z-fighting, floating decals, oversized repetition, and interference with wheel contacts.

Keep pre-existing wear separate from timeline-driven destruction. T+0 must not show future explosion craters, bridge rubble, fuel-fire scorch, or ammunition damage. After destruction, new wear and props must respect the established damage presentation instead of looking freshly restored.

Procedural vertex colors, shared material variations, batched overlays, or small locally generated texture resources are acceptable. No external asset pack, new dependency, or full asset pipeline is required.

## 8. Functional clutter

Add a limited set of small equipment clusters at selected useful locations rather than distributing unrelated objects everywhere.

Examples:

- hose reels, closed utility cabinets, pipe spares, and pump-service equipment near industrial maintenance zones;
- pallets, restrained cargo stacks, cable reels, and closed storage bins beside appropriate harbor facilities;
- tools stored in sealed boxes, spare tires, stowed towing equipment, and service materials at the convoy yard;
- modest communications/power fixtures near existing Radar Hill infrastructure;
- a few weathered remnants at the minimally developed beach.

Reuse existing primitives first. Keep stairs, doors, road lanes, tank spacing, loading zones, and future beach exits usable. Do not add decorative parked vehicles, fake combat wrecks, or implied human silhouettes.

Use real-meter scale and shared resource families. Any new prop within an existing destruction footprint must have a coherent post-event appearance, or be placed outside that footprint.

## 9. Deterministic coastal water

Improve the current flat water layers into a restrained coastal surface with:

- low-frequency open-sea variation;
- smaller motion inside the sheltered harbor;
- regional roughness/color differences;
- shallow-to-deep transitions grounded in authoritative water regions;
- localized shoreline foam and wet/dry visual transitions.

Use a compact analytic or shader-based solution with fixed parameters. Derive all wave phases, foam movement, and visual wetness from absolute simulation time.

Requirements:

- pause freezes environmental motion;
- seeking to a timestamp reconstructs the same surface;
- restart reproduces T+0;
- 0.5x, 1x, and 2x playback use the same simulation-time sampling;
- camera movement does not change wave phase;
- no render-clock accumulation, wall-clock animation, uncontrolled randomness, or timer-driven effects.

Keep the established mean sea level and ship poses. Favor normal/roughness variation for broad water motion; any vertical displacement must be small, bounded, masked, and compatible with existing ship-waterline, wake, pollution, and surface-fire geometry.

Do not introduce ship buoyancy or change naval paths to follow waves.

Respect engineered harbor edges, breakwaters, channels, and the exact mainland coastline. Avoid giant waves, ocean flooding onto land, a glowing continuous white border, hard polygon seams, or overlapping transparent sheets that flicker.

Foam must be localized and broken: stronger at exposed beach/rock contacts, quieter within the harbor. Do not render surf through quay walls, across piers, or over inland roads.

Wet/dry transitions are visual treatments near the existing shoreline, not a new tide or changing terrain/water physics system. If approximating coastal distance or depth from polygons, identify it as a visual proxy; do not claim a bathymetric fluid simulation.

Preserve existing Molniya wakes, harbor fuel sheen, floating debris, surface fires, and smoke layering.

## 10. Dawn atmosphere and readability

Honor the authoritative early-dawn setting: cold ambient sky, low warm horizon light, visible industrial lights, high visibility with light coastal haze, and no precipitation. The existing wind is 4.0 m/s toward the northeast, with normalized XZ direction [0.70, 0.71]; keep environmental motion coherent with it without rewriting established smoke trajectories.

Refine horizon, distant contrast, and the balance between sea, land, warm light, and cool sky. Make near, middle, and distant regions distinguishable without concealing the scene.

Preserve the visual hierarchy of:

- dark military vehicle silhouettes;
- localized fire and smoke;
- bridge and convoy reactions;
- aircraft motion;
- terrain ridges, shoreline, and harbor structures.

Do not use heavy fog, excessive bloom, very dark exposure, or saturated teal/orange grading to conceal geometry. Avoid a broad lighting/postprocessing rewrite.

Existing cameras should show the improvement. Only make small camera framing corrections when necessary; preserve preset IDs, follow behavior, pause controls, and smooth transitions. No automatic camera cuts or new camera family is required.

## 11. Architecture, resources, and performance

Keep new regional data, sampling helpers, and rendering in focused modules, for example under `src/scene/world/stage4c/`, integrated through the existing world/scene entry points.

Separate static seeded layouts from time-dependent presentation. Update dynamic uniforms/transforms from the existing simulation time without rebuilding static arrays, materials, geometries, or textures each frame.

Use:

- instancing or batching for repeated vegetation, rocks, overlays, and props;
- shared resource ownership with correct cleanup;
- limited transparent layers and sensible ordering;
- restrained shadow casting;
- existing culling where valid, with bounds that accommodate any visual motion.

Do not allocate a material or draw call per grass blade, stain, or foam fragment. Do not remount the entire static world on each timeline update. Keep dynamic water integration from forcing static districts to re-render at simulation frequency.

Measure baseline and final renderer calls, triangles, geometry/texture counts, and available frame-time indicators at the same viewport, cameras, and timestamps. Include quiet T+0 and a busy late-disaster view. Report actual measurements and limitations rather than claiming performance from object counts alone.

Investigate material slowdowns or persistent resource growth. Repeated restart/seek/camera changes must not keep adding buffers, textures, meshes, or effect instances.

## 12. HUD and Tailwind policy

Update stage labeling to Stage 4C where appropriate. Preserve all actor statuses, timeline controls, camera controls, keyboard behavior, and accessible labels.

Update UI tests that explicitly assert the previous stage label to expect Stage 4C. This label-only adjustment does not authorize changing simulation regression expectations or preservation fixtures.

Use the installed Tailwind utilities for ordinary DOM markup touched by this task: layout, spacing, typography, responsive sizing, colors, borders, overflow, and focus states.

Do not expand `src/index.css` with simple layout selectors already expressible as utilities. Retain specialized global/canvas, pseudo-element, reticle, and range-input CSS where appropriate.

A broad stylesheet migration is outside this stage. No debug panels, new UI library, dependency changes, or Tailwind version changes are required.

## 13. Automated verification

Run the complete existing tests. Add meaningful tests for new environmental behavior rather than snapshots that merely mirror implementation constants.

Cover:

- reproducible seeded layouts and stable IDs;
- regional bounds, land/water masks, and representative exclusion clearances;
- full vehicle/future-landing access envelopes at relevant choke points;
- finite grounded transforms and nondegenerate overlay/shoreline geometry;
- bounded wave/foam sampling and regional attenuation;
- repeated timestamp equality, backward seek, restart, and paused environmental state;
- preservation of existing blast-response and destruction visibility;
- unchanged duration, event list, actor states, weapon anchors, and immutable fixtures.

Test the values used by rendering, not an unused parallel sampler. For shader motion, test shared inputs/analytic bounds and verify actual visual behavior in the browser.

Do not regenerate preservation fixtures or change authoritative data to make tests pass.

## 14. Browser inspection and acceptance

Before editing, capture representative T+0 Harbor, Convoy Corridor, Radar Hill, and Beach views. After implementation, repeat the same views with the same framing and viewport.

Inspect:

- T+0: regional vegetation, grounded rocks, purposeful clutter, surface history, coastal water, and absence of future damage;
- T+42–48: preserved Radar Hill/Pantsir destruction and opening effects;
- T+75, T+92, and T+108: support response, fuel escalation, smoke, and environmental visibility;
- T+125–133: bridge obstruction, ammunition detonation, and vegetation/damage reconstruction;
- T+150–166: preserved T-72B movement/strike/reverse and Talwar deterioration;
- T+170, T+172, T+174, and T+176: aircraft egress, naval continuation, and partial convoy withdrawal.

Check all existing camera presets, with closer inspections of harbor edges, industrial maintenance clusters, the yard exit, the bridge, dunes, and remote beach shallows.

Watch a quiet water/coast segment continuously at 1x and confirm wave/foam motion is restrained. Pause it, orbit the camera, seek backward and forward, restart, and test all playback speeds.

Also replay representative fuel, bridge, and T-72B sequences continuously to check that the new environment does not obscure key motion or effects.

Verify normal desktop and short-height viewports, HUD fit, browser console output, shoreline seams, transparent sorting, z-fighting, and resource stability after repeated seeks/restarts.

Stage 4C is complete only when the regional distinctions, surface wear, functional clutter, coastal motion, and atmosphere are visibly present and verified. Save comparison screenshots to a local artifact location and include their paths in the final report. Explain any browser or profiling limitation precisely.

## 15. Permitted validation and repository rules

Do not run build commands. Do not invoke `pnpm build`, `tsc -b`, or the combined `pnpm check` script, which contains a build-mode TypeScript step.

Use the existing runtime and permitted commands, such as:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run`;
- `git diff --check`;
- the existing development server for actual browser verification.

Do not run repository-wide formatting commands or make unrelated formatting changes.

Do not modify existing dependency versions or upgrade frameworks. No new dependency is expected for this stage. Preserve unrelated user changes, including any package/lockfile modifications already present.

Read applicable browser/React skills before using their workflows when they are available. Verify the actual implementation rather than reporting unperformed checks.

## 16. Documentation and final handoff

After implementation and validation succeed:

- mark Stage 4C COMPLETE in `ITERATION_PLAN.md`, describing what was actually delivered;
- preserve all completed Stage 4B-family records;
- keep Stage 5 and Stage 6 planned;
- append a Stage 4C record to `changelog.md` with visual changes, determinism, preservation, tests, browser comparisons, performance measurements, and limitations;
- retain the outstanding Pantsir 02, amphibious, full-timeline, and aftermath gaps in the documentation.

Do not mark completion if a required verification remains unavailable; state the remaining work accurately.

In the final response, lead with the resulting visual changes and provide:

1. regional vegetation/rock and surface-history improvements;
2. functional clutter and industrial weathering;
3. the water/foam/wetness implementation and absolute-time behavior;
4. dawn atmosphere and preserved battlefield readability;
5. clearance, damage, actor, timeline, and grounding preservation;
6. architecture/resource decisions and baseline-versus-final performance measurements;
7. automated checks, browser inspections, and comparison screenshot paths;
8. remaining limitations before Stage 5.

Do not claim new actors, Pantsir 02, LCAC/LAV deployment, additional events, full T+180 integration, aftermath, visible people, or a physical ocean simulation.

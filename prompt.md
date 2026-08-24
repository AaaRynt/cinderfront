# Cinderfront — Stage 4A: Cinematic Battlefield Enhancement

Work directly in the existing Cinderfront repository.

Stage 1, Stage 2, and Stage 3 have already been implemented.

This task implements a refinement-focused milestone called:

**Stage 4A — Cinematic Battlefield Enhancement**

This is intentionally **not** the old planned “Stage 4 defender reactions / reinforcements / logistics” milestone from the long-term iteration plan.

For this task, do **not** implement the old planned Stage 4 moving-ground-reinforcement features yet.

Instead, improve the battlefield’s cinematic readability, physical scale, terrain relief, hero-destruction escalation, smoke / fire presentation, and F-35 flight behavior while preserving the deterministic runtime and the existing scenario structure.

Do not stop after planning. Inspect the current repository, run the application, reproduce the current visual shortcomings, implement the improvements, validate under repository rules, perform browser inspection, fix issues you discover, and leave the project in a coherent working state.

## 1. Read the authoritative project files first

Before changing code, read:

- `AGENTS.md`
- `ITERATION_PLAN.md`
- `assets/map/map-spec.yaml`
- `assets/map/map-layout.svg`
- `assets/scenario/scenario-spec.yaml`
- `assets/scenario/scenario-timeline.md`
- `assets/vehicle/Belligerents.yaml`

Also inspect relevant vehicle references:

- `assets/vehicle/F-35B/`
- `assets/vehicle/Wasp/`
- `assets/vehicle/Talwar/`
- `assets/vehicle/Project 12418 Molniya missile boat/`
- `assets/vehicle/Pantsir-S1/`

Treat:

- `AGENTS.md` as hard repository policy;
- `map-spec.yaml` as the authoritative physical map source;
- `scenario-spec.yaml` as the authoritative deterministic scenario source;
- `scenario-timeline.md` as the human-readable scenario reference.

Preserve the existing faction identifiers:

- `landings_attacker`
- `island_defender`

Do not introduce color-force terminology.

Do not create visible human characters.

## 2. Preserve existing core runtime behavior

Do not break or replace the current deterministic architecture.

Preserve:

- play;
- pause;
- restart;
- 0.5× / 1× / 2×;
- direct timeline seek;
- spectator camera usability while paused;
- persistent destruction reconstruction;
- Stage 1 opening sequence;
- Stage 3 Harbor / Industrial events already implemented.

Do not replace the deterministic model with ad hoc timeout chains.

All important persistent world state must still reconstruct correctly from arbitrary timeline positions.

## 3. Current known problems to solve

The current implementation has several visible shortcomings that must be addressed in this task.

### 3.1 Terrain relief is still too weak

The battlefield still reads as too flat, especially in wide views.

The map size itself is not necessarily the problem.

The likely issue is that the visual realization of elevation is too conservative or vertically compressed.

### 3.2 Fuel-storage structures still read as too short / too small

Fuel tanks and related industrial structures still look underscaled.

The district does not yet read strongly enough as a large, dangerous petroleum / military-industrial facility.

### 3.3 Fuel-storage destruction is not escalating enough

The current fuel event still feels too localized and not catastrophic enough.

The blast is not yet satisfying enough as a battlefield hero event.

There is not enough clear secondary escalation, sympathetic ignition, or district-wide collapse language.

### 3.4 F-35 flight behavior is too game-like

The F-35 aircraft can still accelerate / decelerate too sharply and turn too abruptly.

Their movement feels too instantaneous and not sufficiently aircraft-like.

This task should improve that behavior without rewriting the whole simulation into a full flight simulator.

## 4. Primary goal of Stage 4A

This task is about making the battlefield feel more like a convincing interactive war-cinema visualization.

Focus on:

- stronger terrain readability;
- more convincing battlefield scale;
- more imposing industrial geometry;
- more satisfying destruction escalation;
- better smoke / fire composition;
- smoother aircraft motion;
- stronger camera readability.

Do not expand the roster of active battlefield units unless a very small amount of static or non-critical support dressing is genuinely needed for scale and readability.

The priority is quality of presentation, not quantity of units.

## 5. Terrain enhancement requirements

### 5.1 Introduce visual vertical exaggeration where needed

Inspect how terrain heights are currently derived from the map data.

If the current world uses a too-literal or visually flattened elevation interpretation, introduce a controlled visual vertical exaggeration strategy.

The purpose is not to falsify the map, but to make its terrain legible in a large battlefield presentation.

Use a restrained but meaningful exaggeration factor or elevation remapping approach so that:

- Radar Hill clearly dominates its surrounding terrain;
- Harbor / Industrial lowlands read distinctly lower;
- the D / E separation is more obvious;
- coastal bluffs / dunes / drainage become visible;
- overview views no longer read as a mostly flat tabletop.

Do not simply multiply every number blindly and break the world.

The exaggeration must remain coherent with roads, pads, facilities, and shoreline.

### 5.2 Preserve physical grounding

After terrain enhancement:

- roads must still sit correctly on terrain;
- pads must not float or bury;
- ships must still relate plausibly to waterline;
- industrial compounds may remain locally graded / flattened where appropriate;
- beach and shoreline transitions must remain believable.

### 5.3 Add micro-relief and terrain articulation

Without changing authoritative region placement, enrich the terrain with better readable shape where appropriate:

- cut slopes;
- berm shaping;
- dune articulation;
- dry wash depression;
- rocky outcrop variation;
- industrial grading edges;
- coastal erosion / bluff hints.

Do not over-noise the entire world.

The goal is cinematic readability, not procedural chaos.

## 6. Industrial scale correction requirements

### 6.1 Fuel district must feel larger and more dangerous

Re-evaluate the physical expression of the fuel district.

Where heights are explicitly defined in YAML, use them.

Where heights are not defined or are too visually weak to communicate scale, improve the rendered scale in a physically believable way.

Make the district read as a major tank farm, not a small utility yard.

Emphasize:

- tank volume;
- tank-to-road proportion;
- tank-to-building proportion;
- bund / containment-wall presence;
- pipe-rack height;
- transfer-station height;
- pump-house scale;
- utility-building scale;
- interconnection density.

### 6.2 Preserve believable industrial scale

Do not turn the district into science-fiction megastructures.

Aim for believable real-world industrial proportions.

The viewer should feel:

- these are very large tanks;
- these are hazardous facilities;
- this place stores massive fuel volume.

### 6.3 Improve vertical layering

Strengthen the perception of scale by using more layered industrial composition:

- elevated pipe racks;
- stairs / service platforms if useful;
- catwalk hints where useful;
- berms;
- utility nodes;
- transfer manifolds;
- fence lines;
- different building masses;
- industrial hardstands.

Do not over-detail every object.

Prioritize readable large shapes and convincing hierarchy.

## 7. Hero-destruction escalation requirements

### 7.1 Fuel-storage disaster must escalate more clearly

The current event needs more dramatic progression.

Do not treat the fuel-storage event as one single explosion and one smoke plume.

Instead, turn it into a multi-stage catastrophic sequence.

The sequence should clearly communicate:

1. initial strike;
2. local ignition;
3. growing fire;
4. neighboring tank / transfer risk;
5. secondary tank failure or sympathetic ignition;
6. larger district-scale blast escalation;
7. heavy black smoke;
8. persistent multi-source fire.

### 7.2 Add secondary events

Use deterministic sub-events to create escalation.

Examples of acceptable sub-events:

- neighboring tank flashover;
- pipe-rack rupture;
- transfer manifold burst;
- containment-bund fire spread;
- delayed tank overpressure event;
- secondary fuel fireball;
- staggered ignitions;
- persistent burning pools;
- follow-on ammunition-area sympathetic activity.

Do not randomize the scenario each run.

The sequence must remain deterministic.

### 7.3 Strengthen visual hierarchy

The fuel-storage disaster should feel like one of the major visual set-pieces of the whole project.

Make sure it clearly outranks:

- minor local impacts;
- small Harbor strikes;
- cook-off pops.

At the same time, do not make it identical to the ammunition-detonation language.

Fuel disaster should emphasize:

- sustained fire;
- thick smoke;
- liquid-fuel burning character;
- multiple industrial ignition points;
- layered heat and fire.

Ammunition should emphasize:

- sharper impulses;
- irregular cook-off;
- fragment violence;
- harder flash punctuation.

### 7.4 Improve debris and aftermath

Increase the sense of destructive consequence through:

- more readable large debris pieces where appropriate;
- more visible burning fragments where appropriate;
- better fragment spacing and timing;
- additional persistent small fires;
- more scorched ground;
- more damaged industrial geometry;
- clearer destruction footprint.

Do not create unbounded particle spam.

## 8. Smoke, fire, and blast composition

### 8.1 Improve black smoke columns

Current smoke should become more cinematic and more layered.

Black smoke should:

- rise strongly;
- have a dense darker core;
- have more broken edges;
- vary over height;
- drift with wind;
- remain visible at long range;
- avoid reading as one repetitive particle stack.

### 8.2 Improve fire layering

Persistent fires should vary in:

- size;
- intensity;
- color temperature;
- smoke density;
- location;
- start time.

Do not let every fire look cloned.

### 8.3 Improve local illumination

Use efficient local lighting / emissive response so that key explosions and sustained fires influence nearby surroundings.

Do not add excessive expensive dynamic lights.

Use just enough lighting to enhance cinematic impact.

### 8.4 Improve blast readability

Hero blasts should feel more forceful through:

- better flash;
- more readable expanding pressure / dust layer;
- stronger but localized environmental response;
- better timing between flash, debris, smoke, and aftermath.

## 9. F-35 cinematic flight smoothing

Do not rebuild the project into a flight simulator.

Instead, improve the current aircraft motion model so it behaves more plausibly in presentation.

### 9.1 Limit abrupt heading changes

The aircraft should no longer snap into sharp-angle turns.

Introduce aircraft-like steering constraints such as:

- turn-rate limit;
- heading smoothing;
- banked turning behavior;
- curvature smoothing.

### 9.2 Limit abrupt acceleration changes

Reduce overly game-like acceleration / deceleration.

The aircraft should carry momentum more convincingly.

Changes in speed should feel smoother and more intentional.

### 9.3 Add readable banking

Where the F-35 changes direction, add visible bank / roll behavior as appropriate.

Keep it cinematic and readable.

Do not aim for a full CFD / aero model.

### 9.4 Preserve existing mission logic

Keep the current scenario logic and strike timing functional.

Weapon release and path logic may be adjusted as needed to match the smoother aircraft motion.

Do not destroy the deterministic timing model.

### 9.5 Keep the roster limited

Do not solve the flight-readability problem by adding many more aircraft.

Continue using the existing two F-35B aircraft.

Improve choreography, not unit count.

## 10. Camera and presentation improvements

The project is now closer to an interactive battlefield visualization than a traditional game scene.

Strengthen camera readability.

### 10.1 Improve presets

Refine existing camera presets so key scenes are easier to appreciate:

- Overview;
- Harbor;
- Talwar;
- Molniya;
- Industrial;
- Fuel storage;
- Ammunition;
- Radar Hill;
- Search radar;
- Convoy corridor;
- Beach inland;
- Beach offshore;
- F-35 01;
- F-35 02.

Presets should frame the battlefield more clearly.

### 10.2 Preserve spectator freedom

Do not replace the experience with forced cinematic cutscenes.

The user must still be able to:

- orbit;
- pan;
- zoom;
- inspect freely while paused.

### 10.3 Improve sense of scale in key viewpoints

Choose preset positions and focal behavior that help the viewer appreciate:

- terrain relief;
- industrial scale;
- ship size;
- smoke columns;
- blast footprint.

## 11. Optional scale cues

Because human figures are prohibited, scale must be communicated through environment and machinery.

You may strengthen scale cues using already appropriate non-human environmental elements such as:

- utility poles;
- barriers;
- road widths;
- fence spacing;
- parked non-animated service objects if already compatible with the map and constraints;
- ladders / catwalk hints;
- cranes;
- pump equipment;
- pipe diameters;
- ship-to-berth relationships.

Do not add visible people.

Do not create crowd, crew, or silhouette hacks.

## 12. Explicit non-goals for Stage 4A

Do not implement in this task:

- the old planned “defender reactions / support / withdrawal” milestone in full;
- large new ground-unit battle choreography;
- BTR-80 active timeline behaviors;
- T-72B active timeline behaviors;
- second Pantsir relocation sequence if not already required;
- Su-30MKK operational air sequence;
- LCAC landing sequence;
- LAV-25 unloading sequence;
- audio;
- visible humans;
- player-controlled combat;
- a full flight-simulation rewrite;
- a new map replacing the current authoritative one.

If a tiny amount of static support dressing is needed for scale, keep it minimal and deterministic.

## 13. Validation requirements

Respect `AGENTS.md`.

Run all repository-permitted validation.

At minimum, where permitted, run:

- TypeScript check;
- lint;
- Vitest suite;
- any new tests you add for smoothing / derived event logic where practical.

Do not claim to run forbidden commands if repository rules prohibit them.

## 14. Browser inspection requirements

You must visually inspect the running application.

Do not rely on tests alone.

### 14.1 Terrain inspection

Inspect from:

- Overview;
- low-altitude Harbor view;
- Industrial view;
- Radar Hill view;
- Convoy Corridor;
- Beach inland;
- Beach offshore.

Confirm:

- terrain relief is more legible;
- D / E separation is more visible;
- industrial zones sit plausibly in lower terrain;
- world no longer reads as overly flat.

### 14.2 Industrial scale inspection

Inspect the fuel district and ammunition district from medium and low viewpoints.

Confirm:

- fuel tanks feel large;
- utility structures are no longer toy-sized;
- bunds / containment walls are visible and meaningful;
- industrial vertical layering is visible;
- buildings do not all read as one-storey boxes.

### 14.3 Hero-event inspection

Inspect timeline moments around:

- first fuel ignition;
- secondary escalation;
- main fuel disaster;
- ammunition cook-off;
- ammunition detonation;
- late aftermath.

Confirm:

- there are multiple stages;
- there is visible secondary escalation;
- smoke composition is improved;
- aftermath is stronger and more satisfying.

### 14.4 F-35 inspection

Inspect:

- a straight flight segment;
- a turn;
- a strike approach;
- a departure.

Confirm:

- speed changes are smoother;
- turns are smoother;
- bank behavior is visible;
- no visibly absurd sharp-angle snapping remains.

Fix obvious issues discovered during inspection.

## 15. Acceptance criteria

Stage 4A is complete only if all of the following are true.

### Terrain and world readability

- terrain relief is visibly stronger and easier to read;
- the world no longer feels excessively flat;
- Radar Hill and other topographic differences are clearer;
- the enhanced terrain remains physically coherent with roads, pads, and shoreline.

### Industrial scale

- the fuel district feels larger and more imposing;
- key tanks and industrial structures are more convincing in scale;
- the industrial district no longer reads as too low / too miniature;
- scale is improved without becoming absurdly exaggerated.

### Destruction quality

- the fuel-storage event has clear staged escalation;
- secondary ignition / sympathetic events exist;
- the fuel disaster feels more catastrophic and satisfying;
- smoke columns are larger, denser, and more layered;
- persistent fires and aftermath are richer;
- the ammunition district remains visually distinct in destruction language.

### Aircraft presentation

- F-35 turning is smoother;
- F-35 speed transitions are smoother;
- F-35 banking is more readable;
- mission timing remains deterministic and functional.

### Presentation

- camera presets better communicate the battlefield;
- the scene reads more like an interactive war visualization and less like a flat technical demo.

### Preservation

- play / pause / restart / seek still work;
- persistent destruction still reconstructs;
- existing major scenario events are preserved;
- no visible humans are introduced.

## 16. Final response

When complete, report:

1. how terrain relief was improved;
2. whether a vertical-exaggeration or elevation-remapping strategy was added;
3. how fuel-district scale was improved;
4. what was changed to make the industrial district feel larger;
5. how the fuel-storage disaster escalation was upgraded;
6. what new secondary events were added;
7. how smoke / fire / blast composition was improved;
8. how the F-35 flight smoothing was implemented;
9. what camera / preset improvements were made;
10. what validation was run under `AGENTS.md`;
11. what browser inspections were performed;
12. what limitations still remain before the later large unit-action stages.

Do not describe future large reinforcement / landing stages as completed.

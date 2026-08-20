# Cinderfront — Stage 3: Combat Language Correction + Harbor and Industrial Hero Destruction

Work directly in the existing Cinderfront repository.

Stage 1 and Stage 2 have been implemented.

This task implements **Stage 3**, but Stage 2 visual inspection has revealed several important problems that must be corrected before Stage 3 destruction work is considered complete.

Do not stop after planning.

Inspect the repository, reproduce the current visual problems in the browser, correct them, implement Stage 3, run all repository-permitted validation, perform browser inspection at important timeline points, fix problems discovered during inspection, and leave the project in a coherent working state.

## 1. Read Authoritative Project Files First

Before changing code, read:

- `AGENTS.md`
- `ITERATION_PLAN.md`
- `assets/map/map-spec.yaml`
- `assets/map/map-layout.svg`
- `assets/scenario/scenario-spec.yaml`
- `assets/scenario/scenario-timeline.md`
- `assets/vehicle/Belligerents.yaml`

Also inspect the relevant vehicle references:

- `assets/vehicle/F-35B/`
- `assets/vehicle/Talwar/`
- `assets/vehicle/Project 12418 Molniya missile boat/`
- `assets/vehicle/Pantsir-S1/`

Treat:

- `map-spec.yaml` as spatial authority;
- `scenario-spec.yaml` as deterministic event/state authority;
- `scenario-timeline.md` as human-readable scenario authority;
- `AGENTS.md` as hard repository policy.

Preserve the faction identifiers:

- `landings_attacker`
- `island_defender`

Do not introduce color-based faction terminology.

## 2. Stage 1 and Stage 2 Preservation

Preserve the existing deterministic simulation architecture.

Do not break:

- play;
- pause;
- restart;
- playback speed;
- arbitrary timeline seek;
- camera movement while paused;
- Stage 1 F-35B launch;
- Radar Hill engagement;
- Pantsir destruction;
- radar destruction;
- persistent damage reconstruction.

Stage 3 adds later scenario events and richer persistent states while continuing to derive important world state deterministically from simulation time.

Do not replace this with irreversible timeout-driven event logic.

## 3. Mandatory Visual Correction Gate

Before considering Stage 3 successful, correct three existing visual problems:

1. incorrect F-35B air-to-ground weapon behavior;
2. insufficient terrain relief / overly flat world appearance;
3. underscaled industrial and harbor structures.

These are mandatory corrections, not optional polish.

Do not proceed under the assumption that Stage 2 visual scale is already approved.

## 4. Correct the F-35B Air-to-Ground Weapon Language

The current implementation visually launches a glowing / fireball-like object from above the F-35B.

The projectile initially moves upward in a lobbed arc and may travel arbitrarily left or right.

This is visually incorrect for the intended air-to-ground strike behavior.

It currently resembles:

- a flare;
- a decoy;
- an arcade projectile;
- or a generic fireball.

Remove this visual language from air-to-ground attacks.

## 5. Air-to-Ground Weapon Spawn Position

Air-to-ground weapons must originate from a plausible lower-fuselage / weapons-bay area.

They must not spawn:

- above the aircraft;
- from the canopy;
- from the dorsal fuselage;
- from arbitrary world-space positions.

Exact internal weapons-bay engineering detail is not required.

A simplified lower-fuselage release point is sufficient.

The important requirement is that the release visually reads as an aircraft weapon leaving the underside / internal bay region.

## 6. Guided Bomb / Glide Weapon Behavior

For bomb-like weapons:

- release from the lower fuselage;
- inherit substantial aircraft forward velocity;
- separate slightly downward;
- continue forward;
- gradually descend toward the assigned target;
- allow restrained guidance correction if desired.

Do not:

- launch upward first;
- draw a high artillery-like parabola;
- randomly throw the weapon left or right;
- give the weapon a continuous flame trail;
- render the weapon itself as a fireball.

A bomb should visually read as a physical dark munition body.

A short aerodynamic condensation effect is optional but not required.

No bright propulsion effect should exist for an unpowered guided bomb.

## 7. Powered Air-to-Ground Weapon Behavior

If a Stage 3 strike uses a powered guided air-to-ground weapon:

1. release from the lower-fuselage / weapons-bay region;
2. perform a clean short separation;
3. ignite the motor after separation;
4. accelerate primarily forward;
5. use a deterministic guided path toward the assigned target.

The path may curve.

The path must remain physically readable as target-directed guidance.

Use:

- a small exhaust plume;
- restrained missile flame;
- optional smoke trail.

Do not render the complete missile as a glowing fireball.

Do not use random left/right launch direction.

## 8. Deterministic Weapon Targeting

Air-to-ground strike weapons must have explicit scenario targets.

Do not select arbitrary random ground positions.

Their paths should be deterministic from simulation time and event definition.

For each strike, separate:

- aircraft path;
- weapon release time;
- weapon target;
- munition trajectory;
- impact effect.

Seeking to a time before release must show no munition.

Seeking into weapon flight must reconstruct a plausible weapon position.

Seeking after impact must reconstruct the persistent damage state without requiring playback from release.

Transient trail history may be approximated after seek.

## 9. Terrain Relief Correction

The current battlefield reads as too flat.

Inspect `map-spec.yaml` and determine whether the Stage 2 terrain implementation is failing to express authoritative elevation data strongly enough.

Honor the map's:

- elevation control points;
- Radar Hill elevation;
- ridges;
- bluffs;
- drainage;
- dry washes;
- dunes;
- coastal transitions;
- terrain regions.

Do not change the approved 2D region layout.

Do not move major facilities.

Improve the vertical terrain realization.

## 10. Terrain Visual Requirements

From high Overview camera distance, the spectator should clearly perceive:

- Radar Hill as major elevated terrain;
- meaningful ridge structure;
- lower terrain around Harbor and Industrial districts;
- D / E physical separation;
- coastal bluff / dune structure;
- drainage or wadi depressions;
- non-uniform inland terrain.

From low spectator altitude, movement across the map should visibly involve:

- climbing;
- descending;
- terrain occlusion;
- ridgelines;
- cuts;
- valleys;
- slopes.

The landscape must no longer read as a nearly flat plane with surface colors applied to it.

## 11. Terrain Implementation Guidance

Do not solve this with extreme global vertical exaggeration unless necessary.

First inspect whether existing elevation inputs are being compressed, normalized incorrectly, or visually flattened.

Where the authoritative map does not specify centimeter-level terrain, locally authored micro-relief is allowed for:

- rocky ground;
- drainage;
- embankments;
- cut slopes;
- dune surfaces;
- berms;
- road shoulders.

Keep large-scale terrain consistent with the map specification.

Industrial compounds may be locally graded / flattened while surrounding terrain retains meaningful relief.

Roads should conform plausibly to terrain rather than floating, burying, or slicing impossibly through slopes.

## 12. Industrial and Harbor Vertical Scale Correction

The current industrial structures read as underscaled and approximately one-storey tall.

Correct their vertical scale.

Use `map-spec.yaml` dimensions where explicitly provided.

Where height is unspecified, use visually plausible real-world-like dimensions appropriate to the physical role.

Use the following as guidance, not inflexible constants:

- major fuel storage tanks: approximately 12–22 m tall;
- major fuel tank diameter: approximately 20–45 m;
- medium storage tanks: approximately 8–15 m tall;
- industrial warehouses: approximately 8–16 m tall;
- harbor warehouses: approximately 10–18 m tall;
- pipe racks: approximately 5–8 m high;
- pump / transfer structures: approximately 6–12 m high;
- ammunition magazines: approximately 4–8 m structural height plus protective berms;
- protective earth berms: several meters high and visibly substantial;
- major harbor cranes: approximately 25–50 m high where appropriate;
- utility poles: approximately 12–20 m;
- major radar / communications structures: scaled to remain visually significant.

Maintain believable relationships between:

- vehicles;
- ships;
- buildings;
- tanks;
- roads;
- terrain.

A Talwar-class frigate beside a harbor warehouse should provide a useful scale reference.

Do not arbitrarily make everything enormous.

The goal is believable physical scale.

## 13. Re-Inspect Stage 2 World After Scale Corrections

Before implementing the major Stage 3 hero effects, visually inspect:

- Overview;
- Harbor;
- Industrial;
- Radar Hill;
- Convoy Corridor;
- Remote Beachhead.

Confirm:

- terrain relief is now legible;
- industrial structures have convincing scale;
- fuel tanks are visually substantial;
- harbor structures do not look miniature;
- roads still fit terrain;
- no major props float or become buried;
- Wasp, Talwar, Molniya, F-35B and Pantsir maintain coherent relative scale.

Fix obvious defects before continuing.

## 14. Stage 3 Scenario Scope

Implement the authoritative Harbor and Industrial events assigned to this stage.

Use the exact event timing from the scenario files.

The Stage 3 focus includes:

- Harbor first strike;
- Molniya emergency departure;
- Talwar first major hit;
- industrial transfer / pipeline ignition;
- initial fuel tank hit;
- fuel-storage cascade;
- Talwar fuel leakage;
- second Talwar heavy hit;
- ammunition cook-off;
- Molniya damage during withdrawal;
- ammunition-storage primary detonation;
- Talwar severe final damage state;
- Molniya reaching open water.

Do not independently rewrite the scenario timing.

## 15. Harbor First Strike

Implement the first Harbor District strike according to the scenario timeline.

Use a physically readable air-to-ground weapon trajectory.

The strike may hit:

- pier infrastructure;
- warehouse;
- service structure;

as defined by the existing scenario interpretation.

The impact should include:

- brief flash;
- local explosion;
- debris;
- dust;
- beginning fire;
- persistent local damage.

This is not a hero explosion.

Do not make it visually larger than the later Talwar or industrial events.

## 16. Molniya Emergency Departure

Implement the Project 12418 Molniya emergency departure.

The ship must:

- leave its berth;
- rotate into the harbor channel;
- accelerate;
- generate a changing wake;
- navigate toward the harbor exit;
- continue toward open water.

Use deterministic authored movement.

The motion must respect:

- harbor geometry;
- berth placement;
- channel shape;
- ship scale.

Do not allow it to:

- move through piers;
- rotate around an obviously incorrect pivot;
- teleport;
- instantly reach full speed.

## 17. Molniya Damage During Withdrawal

Later in the timeline, Molniya receives nearby-impact / fragment damage.

It survives.

Show damage through:

- local flash or fragment impact;
- small local fire if appropriate;
- smoke;
- reduced visual cleanliness;
- continued movement.

Do not turn the vessel into a hero explosion.

The important contrast is:

- Talwar becomes trapped and progressively mission-killed;
- Molniya escapes while damaged.

The Molniya must remain physically visible into open water.

## 18. Talwar Progressive Damage Architecture

Do not implement Talwar damage as a binary intact/destroyed switch.

Create a deterministic progressive damage model derived from scenario time.

Useful states include:

- intact;
- first-hit damage;
- burning;
- second-hit severe damage;
- fuel leakage;
- increasing list;
- flooding;
- mission-killed;
- partially flooded / severe final state.

The model should preserve the same physical vessel.

Do not replace it with an unrelated generic wreck.

## 19. Talwar First Major Hit

At the authoritative event time, implement the first major Talwar hit.

Use a physically readable air-to-ground weapon impact.

Effects should include:

- intense local flash;
- localized fireball;
- sparks;
- fragments;
- local ship response;
- persistent deck fire;
- smoke;
- localized visible structural damage.

The ship remains present and recognizable.

After the first hit it should still show limited continuing mechanical / defensive activity where appropriate.

## 20. Talwar Second Major Hit

The second hit must not simply replay the first effect.

Show escalation.

Possible differences include:

- different impact location;
- stronger structural response;
- additional deck fire;
- heavier smoke;
- loss of more systems;
- more severe list progression;
- flooding onset / increase.

The viewer should understand that the same ship is accumulating damage.

## 21. Talwar List and Flooding

Progressive list must occur smoothly over scenario time.

Avoid an instantaneous rotation snap.

The list should become increasingly obvious between the major hit events and final Stage 3 state.

Flooding may be visually approximated through:

- lower waterline;
- reduced freeboard;
- hull immersion;
- local water effects;
- smoke / steam near damaged areas.

Do not require physically simulated water entering internal compartments.

The visual result matters.

By the final Stage 3 state:

- Talwar should be heavily listed;
- partially flooded;
- still recognizable;
- still above water enough to remain a major aftermath landmark;
- burning;
- producing heavy smoke.

Do not sink it completely.

## 22. Harbor Fuel Leakage

Implement progressive fuel leakage from the damaged Talwar.

Before ignition, it should read as contamination.

Use:

- dark / iridescent surface sheen;
- irregular expanding shape;
- water-relative movement;
- restrained surface distortion.

Do not immediately render it as fire.

Later ignition may create localized harbor surface fire according to scenario timing.

## 23. Harbor Surface Fire

When harbor fuel ignites:

- use irregular surface fire patches;
- avoid a perfect circle;
- avoid one giant flat orange plane;
- allow dark contaminated water to remain visible between flames;
- add drifting smoke;
- preserve floating debris where appropriate.

Fire motion may be scripted / procedural.

Full fluid combustion simulation is not required.

The contamination and fire should remain visible after the initial event.

## 24. Industrial Transfer / Pipeline Ignition

Implement the prelude strike against transfer or pipeline infrastructure.

This event should communicate industrial instability without becoming the main explosion.

Include:

- local impact;
- sparks;
- pipe or equipment damage;
- fuel or vapor ignition;
- persistent local fire;
- growing smoke.

The event should visually prepare the viewer for the fuel-storage cascade.

## 25. Initial Fuel Tank Hit

Implement the first major fuel-tank strike before the hero cascade.

The tank should:

- remain recognizable initially;
- show localized rupture / damage;
- begin intense burning;
- produce a smaller fireball;
- generate thickening smoke.

This is a prelude, not yet the main visual climax.

## 26. Fuel Storage Cascade — Hero Event

The authoritative fuel-storage cascade is one of the highest-priority visual events in the entire project.

Do not represent it as one enlarged Stage 1 explosion emitter.

Build it as a timed layered destruction sequence.

The sequence should include at least:

1. ignition flash;
2. local illumination;
3. expanding non-spherical fireball;
4. debris emission;
5. selected flaming debris;
6. ember / flame trails;
7. pressure / dust front;
8. nearby environmental response;
9. secondary local ignition;
10. ground fire;
11. dense persistent black smoke;
12. scorch / soot;
13. damaged industrial geometry;
14. continuing post-event activity.

## 27. Fuel Explosion Flash and Fireball

Use a very brief intense ignition flash.

The flash should visibly illuminate nearby:

- tanks;
- pipe racks;
- warehouses;
- terrain;
- vehicles or infrastructure where visible.

The main fireball should:

- grow rapidly;
- become vertically turbulent;
- avoid remaining a perfect sphere;
- transition into rising flame and smoke;
- reveal parts of the destroyed industrial site as it clears.

Do not simply scale up an opaque particle sphere.

The effect should retain internal variation.

## 28. Flaming Debris

The hero fuel explosion must include selected large visible debris.

Use approximately the ranges already defined in `scenario-spec.yaml`.

The important visual behavior:

- debris begins near the explosion;
- follows readable ballistic arcs;
- rotates;
- has different mass / trajectory behavior;
- selected fragments burn;
- selected burning fragments carry short flame tails;
- smaller glowing particles may leave ember trails.

Do not make every fragment identical.

Do not make every fragment burn.

Do not create hundreds of individually expensive physics bodies.

Use authored deterministic trajectories, pooled objects, or lightweight analytical ballistic motion.

Some fragments may later create secondary ground-fire ignition points.

## 29. Shock Front

Implement a clearly visible but restrained shock / pressure front.

It may be represented through a combination of:

- expanding dust ring;
- ground haze;
- brief refractive distortion;
- local vegetation response;
- lightweight prop motion.

Avoid a bright science-fiction energy ring.

It should read as moving air / dust pressure.

## 30. Environmental Blast Response

Use the Stage 2 response-ready vegetation / environment data.

Within the local hero-event response radius, selected environmental objects should react according to distance and orientation.

Suitable objects include:

- scrub;
- grass clusters;
- bushes;
- occasional small trees;
- light poles;
- signs;
- lightweight fences;
- small antennas.

The response should approximately follow:

1. shock front approaches;
2. object rapidly bends / deflects away from blast;
3. reaches maximum displacement;
4. springs back;
5. slightly overshoots;
6. settles.

Response amplitude should generally decrease with distance.

Do not animate the entire map.

Do not make every plant bend by the exact same amount at the exact same time.

## 31. Local Ground Ignition

After the hero fuel explosion, create several persistent localized fire patches.

Possible causes:

- burning fragments landing;
- ruptured fuel infrastructure;
- grass / scrub ignition.

The fire patches should:

- begin at different moments;
- vary in size;
- persist;
- produce restrained smoke;
- remain deterministic under seek.

Full wildfire simulation is not required.

Scripted or analytical spread is acceptable.

## 32. Black Smoke Column

The fuel-storage event must produce a large persistent black smoke column.

The smoke should:

- grow quickly;
- have a dense dark core;
- contain lighter turbulent edges;
- drift with the scenario wind;
- bend progressively downwind;
- vary over height;
- remain visible through the rest of the timeline and aftermath.

Avoid:

- one uniform vertical cylinder;
- one flat billboard;
- identical repeated smoke puffs clearly revealing the particle pattern.

Use an efficient browser-friendly approach.

Reserve high density for this hero source.

## 33. Persistent Industrial Damage

After the fuel event, the district must remain visibly changed.

Persistent state should include:

- damaged / ruptured tank geometry;
- scorched ground;
- soot;
- burned scrub;
- broken selected industrial props;
- multiple fires;
- black smoke;
- debris;
- partial utility failure.

Seeking to a later time must reconstruct this state.

## 34. Ammunition Cook-Off

The ammunition district must have a different destruction language from the fuel district.

Do not reuse the same hero explosion with different coordinates.

Before the main detonation, implement irregular cook-off activity:

- small explosions;
- bright internal flashes;
- dust bursts;
- fragment ejection;
- smoke accumulation;
- irregular pauses.

Timing should remain deterministic but should not look mechanically periodic.

The viewer should experience uncertainty about whether the compound is finished detonating.

## 35. Ammunition Primary Detonation

The main ammunition explosion should be:

- sharper;
- faster;
- more violent initially;
- more fragment-heavy;
- less dominated by a sustained liquid-fuel fireball.

Include:

- sharp bright flash;
- compact major fireball;
- dust / pressure front;
- high-arc fragments;
- selected burning fragments;
- multiple damaged magazine structures;
- persistent smaller fires;
- heavy smoke;
- continuing minor secondary detonations.

Make its visual identity clearly different from the fuel-storage cascade.

## 36. Environmental Pollution / Damage Language

Stage 3 should begin establishing the persistent environmental cost of the battle.

Show through objects and environment, not people.

Relevant persistent visuals include:

- harbor oil sheen;
- burning fuel on water;
- black smoke;
- soot-darkened ground;
- damaged industrial facilities;
- burned vegetation;
- localized ground fire;
- floating ship debris;
- industrial haze.

Do not add visible casualties or human figures.

## 37. Lighting Response to Explosions

Hero explosions should affect nearby lighting.

Use efficient temporary local illumination.

Avoid dozens of large shadow-casting dynamic lights.

The main flash and fireball should briefly change the appearance of nearby structures and terrain.

Persistent fire may contribute weaker local illumination.

The dawn environment should make these lighting changes especially visible.

## 38. Persistent Effect Reconstruction

Seeking is a hard requirement.

For each Stage 3 event, distinguish between:

### Transient state

Examples:

- initial flash;
- first fireball;
- airborne debris;
- shock front.

These may be analytically reconstructed, approximated, or omitted when seeking far after the event.

### Persistent state

Examples:

- damaged Talwar;
- ship list;
- smoke source;
- deck fire;
- fuel sheen;
- burning harbor water;
- damaged fuel tank;
- industrial fires;
- soot;
- wreckage;
- damaged ammunition compound.

These must reconstruct correctly at arbitrary timeline positions.

## 39. Restart

Restarting the scenario must fully remove Stage 3 persistent damage and return the world to T+00:00.

Verify reset of:

- Talwar damage;
- Talwar list;
- Talwar flooding;
- harbor contamination;
- harbor fire;
- Molniya movement;
- Molniya damage;
- fuel tank damage;
- ammunition compound damage;
- smoke;
- ground fire;
- debris;
- scorch;
- vegetation blast response;
- damaged lightweight props.

Do not allow repeated replay to accumulate duplicate fires or smoke.

## 40. Stage 3 Performance

Hero effects can be visually dense, but the browser must remain usable.

Prefer:

- pooled transient particles;
- instanced debris where useful;
- analytical trajectories;
- shared smoke geometry / materials;
- bounded effect counts;
- limited local dynamic lights;
- localized environment response;
- persistent damage state rather than permanent particle overload.

Do not create a full rigid-body destruction simulation.

Do not create global fluid simulation.

Do not create global combustion propagation.

The project is a deterministic cinematic battlefield, not a physics research project.

## 41. Explicit Non-Goals for Stage 3

Do not implement:

- BTR-80 support / withdrawal timeline;
- T-72B reinforcement timeline;
- second Pantsir relocation / destruction;
- support / rescue convoy behavior;
- Su-30MKK reinforcement;
- LCAC landing;
- LAV-25 unloading;
- full T+00:00–T+03:00 integration;
- final aftermath mode;
- audio;
- player vehicle controls;
- automatic cinematic camera;
- visible humans.

Do not implement future-stage units just because references exist.

## 42. Browser Validation — Foundation Corrections

Before accepting Stage 3, visually inspect the corrected Stage 2 world.

At T+00:00 verify:

### Overview

- terrain relief is obvious;
- Radar Hill visually dominates its surrounding terrain;
- Harbor and Industrial lowlands are distinct;
- D / E terrain separation is readable.

### Industrial

Inspect from low and medium altitude.

Confirm:

- fuel tanks look genuinely large;
- pipe racks have realistic vertical presence;
- warehouses no longer resemble one-storey sheds unless intentionally small;
- berms are substantial;
- structures have believable scale relative to roads and vehicles.

### Harbor

Confirm:

- Talwar scale;
- Molniya scale;
- warehouses;
- cranes;
- piers;
- terrain / water relationship.

If these still look miniature or flat, continue correcting before declaring Stage 3 complete.

## 43. Browser Validation — Air-to-Ground Weapons

Inspect at least one F-35B ground strike from:

- aircraft-follow view;
- side / distant spectator view;
- target-area view.

Verify:

- weapon originates under the aircraft;
- no projectile originates above the aircraft;
- no upward arcade lob occurs;
- no arbitrary left/right throw occurs;
- physical munition body is visible where practical;
- unpowered weapon has no continuous fire trail;
- powered weapon uses restrained exhaust;
- flight path converges naturally on assigned target;
- impact location matches authoritative target.

Fix the strike system if it still visually resembles flare deployment.

## 44. Browser Validation — Hero Events

Inspect the timeline around:

- industrial transfer ignition;
- initial fuel tank hit;
- fuel-storage cascade;
- ammunition cook-off;
- ammunition primary detonation;
- Talwar first hit;
- Talwar second hit;
- Talwar final Stage 3 condition;
- Molniya departure;
- Molniya damage;
- Molniya open-water withdrawal.

Use multiple viewpoints.

Do not only inspect from Overview.

At minimum inspect hero explosions:

- near-ground but safely offset;
- medium oblique distance;
- high overview.

Verify visual hierarchy remains readable.

## 45. Browser Validation — Shock Response

During the fuel-storage hero event verify:

- shock front visibly propagates;
- nearby vegetation reacts after the blast reaches it;
- vegetation does not react before the front;
- bending direction is generally away from the explosion;
- different objects respond with some variation;
- vegetation rebounds;
- selected ground fires begin afterward;
- distant vegetation remains mostly unaffected.

Fix obvious synchronized or artificial-looking behavior.

## 46. Regression Validation

Re-test the Stage 1 sequence:

- F-35B STOVL;
- Radar Hill tracking;
- Pantsir engagement;
- fixed AAA;
- T+00:42 Pantsir destruction;
- T+00:45 radar destruction;
- seek;
- restart;
- paused-camera control.

Stage 3 must not break earlier functionality.

## 47. Acceptance Criteria

Stage 3 is complete only if all of the following are true.

### Foundation corrections

- F-35B no longer throws fireball-like projectiles from above the aircraft.
- Air-to-ground munitions visually originate from plausible lower-fuselage positions.
- Weapon trajectories look like aircraft-delivered guided weapons rather than upward lobbed arcade projectiles.
- Terrain relief is visibly stronger and coherent.
- Radar Hill and major terrain structure read clearly in 3D.
- Industrial structure heights have believable physical scale.
- Fuel tanks no longer look approximately one-storey tall.

### Harbor

- Molniya visibly performs deterministic emergency departure.
- Molniya can be damaged without being destroyed.
- Molniya reaches open water.
- Talwar damage progresses through multiple visual states.
- Talwar fires and smoke persist.
- Talwar progressively lists.
- Talwar becomes partially flooded but does not disappear.
- Harbor fuel contamination appears.
- Harbor surface fire persists where applicable.

### Industrial

- transfer infrastructure ignites before the main cascade;
- initial fuel tank hit exists;
- fuel-storage cascade is a true layered hero event;
- visible burning debris follows ballistic arcs;
- selected debris carries ember / flame trails;
- shock response affects nearby environment;
- localized grass / scrub fires appear;
- dense black smoke persists;
- ammunition cook-off is irregular;
- ammunition primary detonation has a distinct visual identity;
- industrial damage remains after transient explosions fade.

### Determinism

- arbitrary seek reconstructs correct persistent Stage 3 states;
- restarting removes all Stage 3 damage;
- repeated replay does not duplicate persistent effects;
- Stage 1 deterministic behavior still passes regression.

### Policy

- `AGENTS.md` is fully obeyed.
- No visible human characters exist anywhere.

## 48. Final Response

When finished, report:

1. how the air-to-ground weapon behavior was corrected;
2. what caused or contributed to the previously flat terrain appearance;
3. how terrain relief was improved;
4. how industrial structure scale was corrected;
5. Talwar progressive damage implementation;
6. Molniya departure / withdrawal implementation;
7. fuel-storage hero destruction architecture;
8. ammunition cook-off and detonation implementation;
9. environmental shock-response implementation;
10. persistent pollution / fire / smoke implementation;
11. deterministic seek / restart support for Stage 3;
12. browser viewpoints and timeline moments inspected;
13. automated validation performed under `AGENTS.md`;
14. remaining visual limitations before Stage 4.

Do not describe Stage 4 features as completed.

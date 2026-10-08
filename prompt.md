# Stage 5A — Secondary Air-Defense Reaction and Landing Readiness

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. Viewers observe an authored scenario through spectator cameras, playback, pause, restart, speed controls, and direct seeking.

This is an implementation task. Inspect the current repository, implement the bounded actor sequence below, run every permitted validation, inspect the actual application in a browser, fix issues discovered during inspection, and deliver a coherent, reviewable result. Do not stop after planning.

## 1. Verified starting point and next-iteration goal

Stage 4C is complete in commit `6fb70b6`. The documented baseline is 335 tests across 22 files, 40 scoped events, 19 camera presets, and a T+176 endpoint.

Stage 5 is the next parent milestone. Implement it in bounded rounds:

- Stage 5A, this task: close the missing second-Pantsir sequence and document amphibious integration feasibility;
- Stage 5B: two LCAC approaches, beaching, ramps, and embarked payload presentation after route/timing decisions are settled;
- Stage 5C: eight LAV-25 unloadings, inland movement, and full T+180 operation integration;
- Stage 6: indefinite aftermath and final refinement.

This task must deliver exactly one new combat actor, `defender_pantsir_02`, with a readable lifecycle:

1. operational reserve posture at T+0;
2. relocation begins at T+112;
3. a short local move, stop, weapon alignment/deployment, and brief authored secondary engagement;
4. destruction at exactly T+121, attributed to the existing `attacker_f35_01`;
5. persistent grounded wreck, scorch, local fire, and bounded smoke through T+176;
6. identical reconstruction after seeking, restart, and playback-speed changes.

Also create an English `STAGE5_INTEGRATION_READINESS.md` documenting the remaining amphibious geometry, timing, cargo, unloading, event, and endpoint decisions. That document is preparation for Stage 5B/5C, not permission to implement future actors now.

## 2. Read before editing

Read:

- `AGENTS.md`, `ITERATION_PLAN.md`, and `changelog.md`;
- `assets/map/map-spec.yaml` and `assets/map/map-layout.svg`;
- `assets/scenario/scenario-spec.yaml` and `assets/scenario/scenario-timeline.md`;
- `assets/vehicle/Belligerents.yaml`;
- `assets/vehicle/Pantsir-S1/pantsir-s1.yaml` and its reference images;
- LCAC and LAV-25 dimension/reference files and authoritative route/event data for the readiness report;
- existing primary-Pantsir state, model, air-defense firing, destruction, effects, and tests;
- ground-motion helpers, road/terrain grounding, actor-specific state types, and clearance tests;
- both F-35B paths, weapon definitions, release transforms, impact anchors, and preservation fixtures;
- the complete Stage 4C environment, regional layouts, spatial reservations, water, and weathering integration;
- current cameras, HUD, timeline, store, time clamping, and package scripts.

Relevant files include:

- `src/scene/vehicles/PantsirModel.tsx`;
- `src/scene/BattlefieldScene.tsx`;
- `src/simulation/derive.ts`, `types.ts`, `timeline.ts`, and `weapons.ts`;
- `src/simulation/groundMotion.ts` and `groundVehicleRoutes.ts`;
- `src/simulation/supportConvoy.test.ts`;
- `src/simulation/aircraftPreservation.test.ts` and `src/simulation/fixtures/`;
- `src/scene/world/stage4c/spatialReservations.ts`;
- `src/scene/world/stage2/terrainModel.ts` and `stage2Data.ts`;
- `src/scene/camera/CameraRig.tsx`;
- `src/ui/SimulationHud.tsx` and `src/App.test.tsx`.

Inspect actual implementation before choosing integration points. Repository constraints and the human-visibility policy take precedence. Map geometry, vehicle dimensions, force ownership, and official event timing remain authoritative; do not rewrite reference assets in this task.

## 3. Explicit scope

Implement:

- exactly one secondary Pantsir actor;
- its focused deterministic types, path, lifecycle, and mechanical state;
- only the shared-model extensions needed for wheeled travel, stowed/deployed equipment, and persistent damage;
- two official events, `pantsir_02_relocate` and `pantsir_02_destroyed`;
- one brief authored secondary engagement, represented by internal timing rather than an extra official event;
- compact impact and persistent wreck effects;
- at most one secondary-Pantsir camera preset;
- concise HUD status and Stage 5A labeling;
- focused tests, regression preservation, browser verification, and documentation;
- the landing-readiness report.

Keep simulation duration at exactly 176 seconds. The event list becomes 42 events: the existing 40 plus the two authoritative Pantsir events.

Do not implement LCACs, LAV-25s, visible payload placeholders, amphibious effects, the T+176 inland-spread event, the T+180 endpoint, or aftermath mode in this round.

Do not introduce generalized air-defense AI, target acquisition, radar physics, traffic/pathfinding, collision avoidance, physics simulation, new aircraft, additional losses, audio, or a broad environment/UI rewrite.

## 4. Hard human-visibility constraint

Never create, model, render, animate, or imply visible humans, occupants, crew members, casualties, articulated bodies, or humanoid silhouettes.

Keep cab glazing dark, opaque, or strongly reflective. Use closed machinery, radar/launcher motion, wheels, lights, dust, weapon effects, and persistent wreckage to communicate activity. Do not expose an interior, operator station, driver, or crew animation.

## 5. Preserve completed actor and environment behavior

Preserve every existing actor's numerical state and authored outcomes at all previously validated times through T+176.

In particular, preserve:

- both F-35B launches, complete flight paths, weapon releases, and all existing impacts;
- the primary Pantsir's T+24 engagement and T+42 destruction;
- Radar Hill and fixed air-defense behavior;
- Su-30MKK pressure/support, damage, covering withdrawal, and egress;
- BTR, T-72B, and support-convoy routes, spacing, damage, survivor outcomes, and reverse movement;
- the unattributed T+125 bridge explosion;
- Talwar and Molniya behavior;
- fuel/ammunition destruction, pollution, wakes, fire, and smoke;
- Stage 4C seeded layouts, industrial wear, regional cover, coastal motion, wet sand, and dawn atmosphere;
- existing camera IDs, controls, follow behavior, and paused orbit/pan/zoom.

Do not move an existing F-35B or another actor to make the second Pantsir sequence easier.

Do not assign a source to the existing Su-30 damage or bridge explosion. Do not tie secondary-Pantsir fire to an existing aircraft loss that the authoritative scenario does not attribute to it.

### Immutable regression fixtures

Do not regenerate old hashes or weaken exact numerical assertions.

New actor fields and events will naturally change the combined world shape. Adjust preservation-test projections only to exclude explicitly added Stage 5A state/events and, if applicable, the single added weapon record. Compare every existing field against its unchanged baseline.

Keep Stage 4B.2C state in the preserved projection when verifying this round. Capture a new additive baseline where useful without replacing earlier fixtures.

Update event-count and stage-label assertions to the new scope. Old duration assertions remain valid at 176 seconds.

## 6. Authoritative secondary-Pantsir contract

Actor:

- ID: `defender_pantsir_02`;
- faction: `island_defender`;
- initial feature: `corridor_pull_off_east`;
- initial broad state: operational and mobile;
- role: relocation and secondary air-defense support;
- final condition/outcome: destroyed and lost.

Official events:

| Time  | Event ID               | Required behavior                                                  |
| ----- | ---------------------- | ------------------------------------------------------------------ |
| T+112 | `pantsir_02_relocate`  | Begin relocation on `path_pantsir_relocation`                      |
| T+121 | `pantsir_02_destroyed` | Destroy after brief secondary engagement; source `attacker_f35_01` |

The route references:

- `corridor_pull_off_east`;
- `road_eastern_trunk`;
- `corridor_inland_junction`.

Relevant geometry:

- pull-off center: [5450, -1750];
- pull-off size: 500 × 170 meters;
- pull-off polygon: [[5200, -1665], [5700, -1665], [5700, -1835], [5200, -1835]];
- inland junction: [4000, -1100].

Follow the existing XZ/world transforms and rendered road/terrain height.

### Fit the local action into the nine-second window

The reference path points toward a distant junction; it does not require reaching the entire path's final feature before T+121. The narrative does require a stop and short engagement before destruction.

The pull-off-center-to-junction distance is about 1.6 km. Do not traverse it in nine seconds, teleport, shrink the map, move the event, or drive a heavy truck at aircraft speed.

Author a short relocation from a valid point near the pull-off's road-facing edge to a nearby safe firing position on or beside the route. The firing position should be reached after a modest displacement, leaving time to brake, align/deploy, and engage before T+121.

Use modest truck speed, smooth acceleration, a bounded turn, and readable braking. Select internal move/stop/deployment/engagement times only after checking actual distance and mechanical transition duration.

Document the short local firing stop as an implementation choice. Do not claim arrival at the distant inland junction.

Avoid existing service equipment, vegetation, rocks, barriers, roads used by other actors, and all vehicle sweeps. Prefer existing clear space. If one local exclusion-mask adjustment is unavoidable, document it and preserve unrelated regional layouts.

Do not place this actor on Radar Hill's `sam_platform_02`; the scenario assigns the secondary Pantsir to the corridor reserve.

## 7. Focused state architecture and absolute time

Keep the existing primary-Pantsir API and state unchanged. Add a clear actor-specific module such as `secondaryPantsir.ts` and focused types rather than overloading the opening `world.pantsir` field.

Reuse genuine ground-motion, grounding, and drivetrain helpers. Do not force this actor into BTR/T-72 fields or create a universal vehicle framework.

Keep lifecycle dimensions separate:

- activity: reserve, relocating, braking, deploying/alignment, engaging, destroyed;
- physical condition: operational or destroyed;
- outcome: active or lost;
- mechanical state: wheel motion, steering, stabilizer deployment, radar transport/deployment, radar rotation, turret yaw, launcher elevation, and expended tubes.

Derive every value from absolute simulation time and authored data:

- pose, heading, speed, acceleration, travel distance, wheel rotation;
- mechanical transitions, firing windows, missile/projectile visibility;
- lights and dust;
- destruction onset, fixed wreck pose, scorch, fire, smoke, debris;
- camera target and HUD state.

No render-frame accumulation, wall-clock time, random outcomes, uncontrolled timers, or mount-history-dependent state.

At and after T+121, freeze the vehicle's travel at the impact pose. Wheels, chassis translation, active scanning, and firing cease; bounded settling and persistent fire/smoke can continue.

Repeated timestamp derivation and direct seeking must reconstruct exactly the same state.

## 8. Shared Pantsir model extensions

Reuse the current recognizable Pantsir model and materials where possible.

Preserve the primary actor's appearance and behavior by giving new optional mechanics props defaults equivalent to the existing deployed, stationary presentation.

The secondary model must retain:

- 10.30 m length and approximately 3.30 m deployed width;
- approximately 5.65 m deployed height and a plausible stowed profile near the referenced 4.37 m transport height;
- eight wheels in four mirrored axle pairs;
- boxy forward cab and rear equipment body;
- two six-tube missile banks;
- paired thin guns, tracking radar, raised search radar, and stabilizers;
- dark sealed cab glazing.

During movement, stabilizer pads must be retracted and the radar/weapon posture appropriate for transport. At the firing stop, align/deploy continuously. Do not drag stabilizers through the road or instantly snap a tall radar into position.

Use wheel travel tied to signed distance. Ensure all wheels are grounded and body/gun/radar clearances are safe.

Keep the same intact-to-wreck model identity. Retain a recognizable vehicle silhouette after destruction; avoid full disintegration or a duplicate wreck appearing beside the original.

## 9. Brief authored engagement and T+121 strike

Create a short deterministic secondary engagement after the firing stop and before T+121.

Use one or two compact authored firing actions, fixed tube-exp expenditure, radar/launcher alignment, and bounded flight/effects. Reuse established presentation primitives where appropriate.

Choose a fixed existing attacker-aircraft target or authored air sector consistent with geometry; record the choice. Do not implement target-selection logic or infer an unrecorded hit. Any defensive shots miss or leave the modeled engagement without creating new aircraft damage.

No firing begins before deployment/alignment is ready. Do not continue launching after destruction.

For T+121:

- source attribution is exactly `attacker_f35_01`;
- sample the secondary Pantsir's actual impact-time pose for the hit anchor;
- use a medium vehicle-kill flash, restrained fragments/sparks/dust, fixed wreck, scorch, local fire, and bounded smoke;
- keep scale subordinate to the fuel and ammunition hero effects;
- ensure an exact boundary at T+121 and seek-safe persistence through T+176.

If a full incoming weapon trajectory is included, derive its release from the unchanged F-35B's actual pose at the chosen release time, and verify flight distance, direction, clearance, and duration. Use the established dark, unpowered guided-weapon presentation without artificial upward launch, glow, flame, or a continuous trail.

Do not create an arbitrary release point or rewrite aircraft paths to fake the strike. A compact terminal strike with authoritative source attribution is acceptable if a credible full approach cannot be authored against the preserved flight path; report that visual limitation explicitly.

Do not invent an additional official release or engagement event. Internal choreography can have documented thresholds.

## 10. Camera and HUD

Add at most one `Secondary air defense` or `Pantsir 02` preset.

It should frame the reserve, local move, mechanical alignment, brief engagement, impact, and later wreck with continuous seek-safe targeting. Preserve free spectator control while paused and avoid clipping through machinery, terrain, smoke, or structures.

Update the stage label to Stage 5A and add concise secondary-Pantsir status. Preserve primary-Pantsir status so the two actors are distinguishable.

Expose the two new events in chronological order. Keep the timeline endpoint and controls at 176 seconds.

Use existing Tailwind utilities for touched ordinary DOM layout, spacing, typography, color, responsive sizing, and focus states. Keep specialized CSS where appropriate; do not add simple global selectors or broadly migrate the HUD.

Check normal desktop and short-height viewport fit.

## 11. Stage 5 landing-readiness report

Create `STAGE5_INTEGRATION_READINESS.md` in English after the geometry/timeline audit. Ground it in actual references and implementation, not guesses.

Include:

### Authoritative event coverage

List each currently implemented versus outstanding event ID/time through T+180, mapping authoritative fields to the existing event adapter where names differ.

The current source has 51 official events. After this round, 42 are implemented and nine remain:

- T+110 `lcac_departure`;
- T+140 `lcac_01_shallow_water`;
- T+148 `lcac_02_shallow_water`;
- T+155 `lcac_01_beach`;
- T+160 `lav_group_01_disembark`;
- T+162 `lcac_02_beach`;
- T+166 `lav_group_02_disembark`;
- T+176 `lav_inland_spread`;
- T+180 `scripted_phase_complete`.

Verify the counts against the current files. Do not add these events to runtime during Stage 5A.

### LCAC route/timing conflict

The existing raw waypoint lengths are approximately:

- west: 8,634 m from T+110 departure to T+155 beaching, requiring about 192 m/s mean transit speed;
- east: 9,658 m from T+110 departure to T+162 beaching, requiring about 186 m/s mean transit speed.

Rounded/smoothed paths may change these values slightly; compute the actual candidate lengths. These speeds are not credible ordinary LCAC motion, and acceleration/braking make the peak-speed requirement larger.

Also check the shallow-water waypoints against the T+140/T+148 thresholds and validate that approach segments remain water-side until the intended beach transition.

Describe viable alternatives with consequences:

1. explicit cinematic time compression while retaining reference geometry/times, with clearly acknowledged nonphysical speed;
2. revised nearer staging/approach geometry while retaining key event times;
3. revised departure/transit timing while retaining geometry, identifying any impact on the three-minute scenario.

Recommend one alternative based on scene readability and the project priorities. Distinguish implementation refinements from choices that require changing authoritative data. Do not silently select a reference rewrite or disguise the conflict with teleporting, coordinate scaling, off-map despawning, or implausible speed caps.

Stage 5B must not be described as ready for physically credible motion until this choice is resolved. Stage 5A's completed actor work does not depend on that future decision.

### Cargo and unloading feasibility

Audit:

- exact two-LCAC/eight-LAV roster and four vehicles per craft;
- LCAC dimensions 26.4 × 14.3 × 7.2 m;
- cargo deck 20.4 × 8.2 m;
- LAV-25 dimensions 6.39 × 2.50 × 2.69 m;
- viable two-by-two or alternative authored deck packing, including wheels, turret/barrel envelope, side machinery, and ramp clearance;
- carrier-local-to-world pose continuity during movement and unloading;
- ramp hinge/slope/ground contact, skirt height, beach surface, and wheel grounding;
- staggered unloading from T+160/T+166 through T+176/T+180;
- actual road/connector orientation and safe separation into two inland groups;
- Stage 4C landing/ramp reservations versus full craft, ramp, payload, and vehicle swept envelopes.

Do not assume reference connector lists are already ordered in the movement direction. Check each endpoint against beaching, apron, and inland road geometry.

Document which vehicles can realistically finish unloading or begin inland movement by T+180. Do not require the last craft's four vehicles to complete a long inland route in fourteen seconds.

### Integration and endpoint decisions

Describe focused future types/modules, shared resource reuse, deterministic carrier transitions, impact on event adapters/tests, and expected camera/HUD additions.

Preserve the authoritative T+180 event ID/code while distinguishing completion of the scripted phase from Stage 6's indefinite aftermath runtime. Identify the endpoint behavior needed in Stage 5C; do not claim an active aftermath system already exists.

Include concrete next-round acceptance criteria and unresolved decisions. The report must help the next agent implement Stage 5B without rediscovering these conflicts.

## 12. Meaningful tests

Add focused tests for:

- exact new actor ID/faction, reserve feature, role, condition, and final loss;
- the two event IDs/times and 42-event scope;
- T+0, T+111.9, T+112, T+112.1, all internal move/stop/deploy/fire boundaries, T+120.9, T+121, T+121.1, T+125, T+172, and T+176;
- continuous pose/heading/speed, plausible acceleration/braking, actual wheel contact, signed wheel travel, and safe swept clearance;
- stabilizers/radar in valid transport and firing configurations;
- firing readiness, fixed target/sector, expended tubes, and no launch after destruction;
- impact anchor matching the actual vehicle pose;
- fixed post-impact wreck pose, bounded transients, and persistent scorch/fire/smoke;
- absent future effects when seeking before the hit;
- repeated seeks, restart, pause, and every playback speed;
- unchanged existing actor, weapon, support-convoy, environmental sampler, timeline endpoint, and immutable regression values;
- correct old-world projection when additive state is introduced.

Do not write tests that only mirror implementation constants. Sample dense motion around turns, braking, and impact boundaries, and assert actual geometry/clearance where meaningful.

For the readiness report, calculate route lengths and cargo/clearance inputs from the authoritative data or verified implementation helpers. No placeholder future-actor code is needed.

## 13. Actual browser verification

Capture representative before/after corridor views and inspect the implementation at:

- T+0 and T+111.9: correctly grounded reserve actor, no future wreck/effect, sealed glazing;
- T+112 through the move/stop: real relocation, wheel rotation, safe spacing, modest speed;
- deployment/alignment: stabilizers, radar, launcher posture, and continuous mechanical transitions;
- engagement before T+121: compact visible shots with no new damage;
- T+121: correctly located medium-scale destruction and immediate stop;
- T+121.1, T+125, T+132–133, T+172, and T+176: persistent wreck/effects and unaffected existing scenarios.

Watch the complete T+110–124 sequence continuously at 1x at least once. Boundary screenshots alone cannot validate the nine-second reaction.

Replay representative fuel, bridge, T-72B, and aircraft sequences to ensure the addition does not obscure or regress completed behavior.

Test direct/backward seek, repeated seek/restart, all speeds, all camera presets, and paused orbit/pan/zoom. Check normal and short-height HUD layouts and the final console.

Sample matched-view renderer/resource statistics before and after, including a late disaster view. Repeated seek/restart must not accumulate missiles, wrecks, particles, materials, or geometry.

Save review screenshots locally and report their paths. State any verification limitation precisely.

## 14. Permitted validation and repository rules

Do not run build commands, `pnpm build`, `tsc -b`, or combined `pnpm check`.

Use permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run`;
- `git diff --check`;
- the existing development server for browser inspection.

Do not run repository-wide formatting commands. Preserve unrelated user changes.

Do not change dependency versions, upgrade frameworks, or add dependencies. Existing libraries are sufficient.

Use applicable browser and React skill workflows when available. Report only checks actually performed.

## 15. Documentation and final handoff

After successful implementation and validation:

- mark Stage 5A COMPLETE in `ITERATION_PLAN.md`;
- keep parent Stage 5 incomplete; mark it IN PROGRESS if the roadmap uses that status;
- keep Stage 5B, Stage 5C, and Stage 6 planned, with the LCAC route/timing dependency explicit;
- retain all completed Stage 4-family records;
- append a Stage 5A entry to `changelog.md`;
- deliver `STAGE5_INTEGRATION_READINESS.md` with measured inputs, a recommended future decision, and remaining acceptance criteria.

Do not mark full-operation integration complete just because the second Pantsir exists.

In the final response, report:

1. the exact new actor lifecycle, local route, mechanics, and final outcome;
2. T+112/T+121 behavior, engagement details, source attribution, and any incoming-weapon limitation;
3. preservation of primary Pantsir, F-35B paths, existing actors, Stage 4C, fixtures, and the 176-second endpoint;
4. camera/HUD changes and focused architecture;
5. automated/browser results, review artifact paths, and resource observations;
6. the measured amphibious route/timing conflict, recommended alternative, and remaining decision;
7. documentation changes and the next Stage 5B scope.

Do not claim LCAC/LAV deployment, all 51 events, T+180 integration, indefinite aftermath, visible personnel, or generalized air-defense AI.

# Stage 6C — Camera Framing, Visual Finish, and Final Performance Integration

Work directly in the existing Cinderfront repository.

Cinderfront is a deterministic 3D battlefield visualization built with React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS. The viewer follows an authored operation and indefinite aftermath through spectator cameras and time controls.

This is an implementation task. Inspect the actual application, implement the focused presentation and rendering improvements below, run permitted checks, inspect the final browser result, fix issues found, and deliver measured visual and performance evidence. Do not stop after an audit or a list of recommendations.

## 1. Starting point

Stage 6B is complete in commit `5f940b5`, after Stage 6A `75bf46a` and Stage 5C `b49db45`. Parent Stage 6 is IN PROGRESS; Stage 6C is the remaining planned round.

The documented starting validation is **544 tests across 50 files**, both TypeScript no-emit checks, lint with **zero errors and 13 warnings**, 51 official events and 24 spectator camera IDs. These are inherited results, not fresh verification for this task. The warnings include current React ref/immutability/useMemo issues; do not label them all pre-existing.

The full scripted history through 180 and indefinite aftermath already work. All eight LAVs are ashore by T+187.558071982; the last formation hold begins at T+344.103063449. Ships, survivor holds/departures, fire/smoke, minor secondary activity, water and machinery have bounded authored continuation.

Stage 6A's rooted cover, fitted rocks, 32 sparse dryland trees and visual terrain breakup are complete. Improve how the existing world is viewed and rendered while retaining its simulation and authored composition.

## 2. Read and inspect first

Read `AGENTS.md`, the current sequencing and Stage 6 records in `ITERATION_PLAN.md`, the current Stage 6B section of `STAGE5_INTEGRATION_READINESS.md`, and Stage 6A/6B `changelog.md` records.

Inspect the map/scenario/vehicle authorities and existing visual references relevant to any touched asset. Read current package scripts and project usage documentation.

Relevant implementation areas:

- `src/scene/BattlefieldScene.tsx`: Canvas, lighting, sky/fog, tone mapping and active runtime scene;
- `src/scene/camera/CameraRig.tsx`, `cameraStore.ts`, camera tests and paused controls;
- `src/ui/SimulationHud.tsx`, `src/App.tsx`, `src/index.css` and UI/keyboard tests;
- `src/scene/effects/stage3/`, `stage4a/`, `aftermath/` and their shared geometry/materials;
- `src/scene/world/stage4c/CoastalWater.tsx`, `coastalWater.ts`, terrain/road materials, and landscape rendering;
- static world structures, instancing/batches, shadow casters and resource ownership;
- `src/simulation/runtime.ts`, `runtimeTime.ts`, `store.ts`, aftermath paths/contact and preservation tests;
- `src/test/stage6bSourceAudit.ts`, historical fixture contracts and actual model/render-envelope tests.

When available, inspect `stage6b-review.local/README.md`, `after-wide-beach.png`, `after-busy-fuel.png`, `hud-540-aftermath.png`, fixed-view metrics and rendered-state evidence. These ignored files are optional local evidence, not required test inputs.

Open the current app and establish fresh baseline captures/measurements before editing. Distinguish accepted final evidence from superseded logs or the partial Stage 6B video.

## 3. Concrete presentation problems to solve

Prior accepted images reveal these starting issues; confirm them in the current browser and record the actual views/times:

| Area                   | Observed problem                                                                                          | Required improvement                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Beach overview         | Near terrain occupies much of the image; distant LCACs are tiny and the view does not explain the landing | A clear regional overview plus useful existing LCAC/LAV close follows, with unobstructed shore/action |
| Other regional presets | Large sky/empty-ground areas and broad framing weaken subject readability                                 | Intentional scale, useful terrain context and visible principal subjects                              |
| Fuel/fire aftermath    | Individual dark faceted smoke puffs read as separate balls; small flames and black shapes lose structure  | Cohesive layered smoke/fire with softer edges and readable damaged structures                         |
| Sea/horizon            | Finite sea boundary and broad repetitive surface bands can read as a rectangular sheet                    | Coherent distant sea/sky transition and restrained coastal surface appearance                         |
| Ground/materials       | Abrupt road/terrain color boundaries and flat shading reduce depth/contact                                | Better material transitions, lighting and contact cues without changing support geometry              |
| HUD                    | Panels consume substantial scene area; status/event text truncates at 720/540 px heights                  | Legible compact hierarchy with complete information accessible and useful scene space                 |

This round must visibly improve camera composition, smoke/fire presentation and HUD readability, plus at least one evidenced water/material/contact issue. It must also deliver a measured rendering optimization. Merely changing the stage label, exposure or screenshot angles is insufficient.

Preserve the dry semi-arid coastal diorama style. Refine its deliberate stylization; do not attempt a photorealistic asset replacement.

## 4. Scope and hard boundaries

Allowed changes include camera parameters/transitions, viewport-aware framing, UI layout/readability, lighting/shadows, visual materials, smoke/fire rendering, a cosmetic far-sea/horizon treatment, and measured batching/culling/geometry/material optimizations.

Preserve exactly:

- all 51 event records, scripted timing and active runtime semantics;
- every existing actor/weapon pose, speed, wheel/contact/suspension value, route, damage/outcome, departure/hold/fade schedule and effect-clock meaning;
- actor identities, model dimensions, contact envelopes and established terrain/road/coast/support data;
- landscape/tree positions, seeds, identities and operational reservations;
- authoritative map/scenario/vehicle assets and historical fixture bytes.

Visual effect mesh/material presentation may change, but emitter IDs, authored anchors, birth/age/lifetime state, bounded capacities, chronology and outcomes remain protected.

Do not add new actors, strikes, losses, sorties, weapons, major simulation features, terrain remodeling, vegetation populations, audio, general AI/physics, dependencies or framework upgrades. No deployment, publishing or unrelated refactor is part of this task.

Never create, model, render, animate, or imply visible humans, crew, occupants, casualties, articulated characters, or humanoid silhouettes. Keep hatches closed and glazing dark/opaque.

## 5. Camera composition and transitions

Keep all 24 existing preset IDs and controls. Reframe their position/target/FOV where evidence requires it; exact old camera transforms are intentionally not a preservation requirement for this presentation round.

Retain distinct overview and focus roles. A regional view should explain the geography and action; a focus view should make the selected craft, vehicle, installation or damage state recognizable at useful size.

For every preset, identify its subject and relevant time range. Inspect the rendered subject bounds, terrain sight lines and actual unobscured viewport. Do not assume looking toward a world coordinate makes the subject visible.

Account for HUD occupancy when framing. Keep important subjects, smoke tops, ramps and moving groups out from beneath panels, with sensible margins at 1280×720, 1280×540 and 1440×900. Use a small shared viewport/framing helper if useful, not a general layout engine.

Specifically repair Beach inland's terrain-obstructed/tiny-subject composition. Test both beach presets during holding, approach, beaching, unloading, inland turns and final holds. Keep both landing lanes and enough context visible; use the existing LCAC/LAV follow presets for close inspection.

Inspect fuel/ammunition/harbor/radar/convoy framing before and after damage, and Wasp/Molniya/aircraft framing during movement/departure. Departed targets retain finite useful framing; preset switching must not reset the simulation.

Make requested preset transitions short and controlled, without crossing terrain or ending inside a model. Camera-only easing may use presentation-frame time while paused; world effects still freeze. Direct seeking must immediately produce the correct target, not chase an old position across the map.

Preserve manual orbit/pan/zoom offsets during playback and aftermath until an explicit preset/recenter request. Use deterministic runtime pose/headings for follow targets; avoid movement-history drift and yaw flips at reverse, stop, seek or patrol seams.

Prefer improving the existing presets. Add a preset only if the final audit proves a genuine uncovered subject, retain all existing IDs, and document the reason.

## 6. Smoke, fire and effect readability

Improve the active smoke/fire render paths, including fuel, ammunition, damaged ships and vehicle wrecks where their shared presentation is visibly weak.

Reduce hard polygon/ball edges and disconnected dark puff stacks. Use cohesive core/body/edge treatment, controlled opacity gradients and appropriate overlap at the existing emitter/lifetime samples. Keep smoke anchored above its actual fire source and visible against both sky and terrain.

Use the existing fixed-capacity instancing and shared resources. Procedural shading, better normals or bounded camera-facing/render geometry are appropriate where they materially improve the image. Do not multiply puff counts as the primary solution.

Control transparency sorting, overdraw, depth write/test, render order and near-ground intersections. Smoke must not become a uniform black wall, cover the entire scene, flicker between layers, clip abruptly at the camera, or disappear when viewed from the opposite side.

Keep flames, damaged tank/ship structure and ground contact readable. Preserve the established priority of fuel/ammunition/Talwar hero effects without excessive bloom, white clipping or global exposure pumping.

Do not replay blasts, change source attribution, introduce new damage, or alter active smoke/fire/dust birth schedules. Preserve minor-secondary timing and all aftermath pause/seek/phase behavior.

Any new visual envelope must have valid culling bounds and remain within an explicitly tested presentation budget. Test actual shared render inputs and inspect the real GPU output; pure state tests alone cannot establish smoke quality.

## 7. Dawn lighting, shadows, materials and horizon

Refine cold dawn fill, warm directional light, depth separation and restrained haze. Compare quiet and busy scenes. Vehicles should retain readable volume, wrecks retain structure, and flame highlights should not wash out the scene.

The current single 1024 shadow map spans approximately 15 km × 12 km, with normal bias 18 world meters. Audit its actual benefit/cost and contact artifacts. Improve shadow coverage/bias or use focused inexpensive contact cues with measured bounds. Do not blindly increase global resolution, enable every object as a caster, or alter grounding to fix a detached shadow.

Improve obvious material banding/flatness on the actual inspected ground/roads/rocks/vehicles, retaining the established palette and existing shape/contact anchors. Better normal/material treatment or bounded render-only detail is allowed; do not expand collision silhouettes or rewrite uploaded terrain/support attributes.

Soften road/soil/gravel visual transitions without inventing a different road width/height or obscuring existing wear/scorch. Preserve all 404 wear records, equipment, 37 foam records and permanent damage.

Retain the existing coastal normal field, mean sea level -0.12 m, sampler/query outputs, time phases, water classification and landing contact. Improve perceived banding through material/roughness/color/distance filtering and lighting rather than silently changing physical/support data.

Address the visible finite water edge. If necessary, add a purely visual distant sea/horizon extension outside the existing sea mesh, with coherent fog/color/depth and bounded owned geometry. It must not cover land, change water polygons/support queries, move ships, or create a new simulated ocean.

Use installed rendering facilities and existing assets. Do not add an expensive stack of AO/reflections/DOF/bloom effects without a demonstrated visual benefit and measured cost. No remote asset or texture acquisition is required.

## 8. HUD readability and scene space

Retain the established military-observation visual style, time controls, fixed 0–180 scripted slider, direct observation-time input, all speeds, keyboard/text-input isolation, runtime/local labels and active aftermath phase.

Improve the camera selector and status hierarchy so users can see the action without first collapsing several large panels. Compact/grouped selection and collapsible status details are appropriate; all 24 presets and all status information remain accessible.

Keep the active subject, phase, operational/deployment counts and essential time controls easy to find. Make event names and long statuses readable through layout, concise display labels or accessible expansion. Do not rely on inaccessible ellipsis or tiny text as the solution.

UI display labels may be improved without changing event IDs/codes, faction mappings or underlying values. Keep truthful departed/holding/deployed states and the eight-vehicle count semantics.

Use Tailwind utilities for touched ordinary DOM layout, spacing, type, colors, focus, and responsive sizing. Retain specialized CSS where needed. Do not run a repository-wide CSS migration.

Check keyboard focus, labels, text contrast and pointer reach. No control may be hidden beneath another panel or outside the viewport at 1280×540.

## 9. Profile and implement a real rendering optimization

Profile main/shadow submissions, static meshes, material sharing, transparent overdraw, dynamic buffer work and repeated runtime derivation before choosing changes. Separate CPU/world derivation cost from GPU/rendering cost.

Select and implement at least two focused optimizations justified by the measured bottlenecks. Suitable candidates include static batching/instancing, unnecessary shadow submissions, regional culling/bounds, geometry/material reuse, effect overdraw/detail or duplicate derivation.

Preserve semantic actor roots and actual rendered transforms/contact. Batching must not destroy identity, response metadata, departure fade ownership or useful test hooks. Do not hide distant actors/events merely to lower counts.

Working targets are approximately 15% fewer submitted calls in at least one busy matched view and 10% fewer submitted triangles in a geometry-heavy matched view. If profiling shows another dominant bottleneck, document a better measured improvement instead. No numeric target justifies removing required content or lowering benchmark resolution.

Keep other matched views close to their original cost; investigate increases above 5% and explicitly justify any remaining increase by visible benefit. Include shadow and transparency work and any newly added far-sea/effect rendering.

Use small deterministic LOD/detail policies only where measurement supports them. Keep smooth stable transitions, valid bounds and consistent shadows. Camera movement may select render detail but must not regenerate layouts or change simulation state.

Do not lower DPR, disable antialiasing, remove the HUD, change camera transforms or reduce smoke/fire content in the benchmark to manufacture an improvement. Any optional quality settings must be documented and measured at the same selected setting before/after.

Fix React ref/immutability/useMemo warnings in the touched paths without disabling rules or changing runtime behavior. Introduce no new warnings; report the actual final count against the 13-warning baseline. Do not patch installed dependencies to suppress the existing Clock deprecation message.

## 10. Preservation and source audits

Capture a pre-edit baseline from `5f940b5` covering the full active world through 180 and representative aftermath times through 7200. Include all LAV transfer/handoff/bend/brake/hold boundaries, vessel patrol/departure and survivor/effect samples.

Require exact current active-world state equality at those samples. This is a rendering/presentation round; do not project away actor, weapon, contact, runtime, effect-state or outcome fields.

Keep all historical fixtures byte-identical and all existing terrain/support/layout/sampler guarantees. Camera transforms, visual materials/meshes and intended HUD composition may differ; distinguish these explicit visual changes from simulation changes.

Historical preservation tests hash many render/camera/UI files. Enumerate only the exact intentionally edited presentation files with reasons, retain their fixed-Git historical byte audit, and add current rendering/behavior tests for the replacement. Preserve unrelated live checks.

Do not extend a prior source exception list to exempt whole directories, regenerate fixture/world hashes, normalize arbitrary edits, or validate only an unused legacy derivation. New tests must cover the actual active scene/time/camera path.

Retain actual actor root/wheel/quaternion agreement with runtime data. New render batching and material ownership can change resource counts, but after warm-up their identities/counts must remain stable across playback, seeks and restart.

## 11. Verification and comparisons

Add meaningful tests for revised framing/sight lines and viewport margins, seek-safe follows/transitions/manual offsets, responsive accessible HUD behavior, valid generated render bounds, preserved runtime, fixed pool limits and resource ownership.

Keep exact world/terrain/layout preservation and original timeout limits. Default checks must work without ignored review artifacts or measurement exports.

Run permitted checks:

- `pnpm exec tsc -p tsconfig.app.json --noEmit`;
- `pnpm exec tsc -p tsconfig.node.json --noEmit`;
- `pnpm lint`;
- `pnpm test:run --maxWorkers=2`;
- `git diff --check`;
- the existing development server for actual browser verification.

Do not run builds, `tsc -b`, combined `pnpm check`, repository-wide formatting, dependency/version changes or framework upgrades. Report that these are development/no-emit checks; do not claim production-build verification.

Capture two distinct comparison sets:

1. **Fixed baseline poses:** exact old camera transform, time, viewport, DPR and quality setting before/after, for rendering cost and material/effect comparisons.
2. **Revised preset composition:** old/new preset views at equal scenario time and viewport, showing improved subject framing and HUD space.

Do not mix changed default camera views into a claim of rendering optimization. Separate after-only showcase images from paired evidence.

Cover all five regions, quiet/busy scenes, LCAC approach/ramp/unloading, LAV road movement/holds, Wasp patrol, Molniya departure and late industrial aftermath. Use at least twelve useful paired views, including close smoke/ground contact and a broad sea/horizon.

Inspect all 24 original presets at relevant times and viewport sizes. Watch requested camera transitions while playing and paused; verify actual subjects remain visible and controls do not drift or clip.

Replay T+0 through the scripted/aftermath handoff continuously at 1×, including the late unloads. Review representative radar/fuel/ammunition/bridge/T-72/Pantsir/aircraft/naval events and all revised effect lifetimes.

Check direct seeks through 7200 and back into the script, pause/orbit/pan/zoom, restart, every speed, keyboard/text input, and 1280×720 / 1280×540 / 1440×900 layouts. Confirm actual smoke/fire/water/machinery freezes under Pause while camera movement stays free.

Run a fresh ten-real-minute sustained aftermath session, at 2× if useful, plus at least five warmed equal-time seek/restart/all-camera resource cycles. Rendering changes require fresh stability evidence, not copied Stage 6B results.

Record calls/triangles, geometry/material/texture/program counts, pool/cache bounds, actor root identities, static uploads and actual observed frame cadence. Use GPU timings only if truly measured. Display-capped ~16.7 ms RAF is not proof of GPU speed.

Save optional local evidence in `stage6c-review.local/`: before/after images, original/revised camera values, raw measurements, console/check logs and chronological playback samples. A failed/partial video is not a complete recording; low-overhead chronological samples and frames can substantiate uninterrupted playback.

## 12. Final acceptance and documentation

Create a concise tracked `STAGE6C_ACCEPTANCE.md` recording the starting problems, implemented improvements, paired image references, exact preserved contracts, fresh checks, fixed-view rendering costs, sustained resource results and honest remaining limits. Tests must not depend on its ignored local image/log targets.

Update `ITERATION_PLAN.md`, append `changelog.md`, and update the current pointer in `STAGE5_INTEGRATION_READINESS.md`. Preserve historical measurements rather than rewriting them as current results.

Only after the required visual fixes, measured optimization and full integration acceptance pass, mark Stage 6C and parent Stage 6 COMPLETE for the agreed visual/scripted/aftermath scope. Audio remains outside the current core plan. If a required acceptance item is still unmet, leave its status truthful and identify the exact remaining work.

The handoff should lead with the visible changes and measured rendering benefit, then provide fresh test/browser results, comparison/report paths, resource stability and limitations. Do not claim photorealism, physical ocean/vehicle simulation, cross-device performance guarantees, new combat, visible personnel, production-build verification or deployment.

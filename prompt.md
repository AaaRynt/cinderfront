# Stage 8C — Vegetation Response to the Fuel Blast

Work in the existing Cinderfront repository. Make the existing fuel-storage shock front visibly pass through a small group of rooted dryland trees. Show grass and scrub responding alongside them, with the trunks and crowns bending away from the blast, rebounding and settling into ambient wind. Deliver one short matched sequence in which the viewer can see the front reach the plants.

## 1. Establish the reference

Use `f98e1fc`, the completed Stage 8B commit, as the visual reference. Read `AGENTS.md`, the Stage 8 roadmap, `STAGE8B_ACCEPTANCE.md`, and the relevant map and scenario authority. Trace the live fuel cascade and front in `src/scene/effects/stage4a/Stage4AFuelDisaster.tsx`, the existing local response in `src/scene/effects/Stage3BattleEffects.tsx` and `stage3/BlastResponseField.tsx`, the timing helpers in `stage3/effectMath.ts`, and the rooted wind and shadow deformation in `src/scene/world/stage8b/wind.ts`.

The Stage 8B report records 786 passing tests after a local fixture repair. The two fixture blobs at `f98e1fc` still contain the older JSON serialization. Verify the original captures and restore the pinned bytes as separate baseline work.

| Tracked fixture under `src/simulation/fixtures/` | Original under `stage7c-review.local/` | Pinned SHA-256                                                     |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json`           | `construction-reference.json`          | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json`           | `presentation-reference.json`          | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

Check both source hashes and equality of the parsed values and JSON tokens apart from whitespace before restoring. Keep the pinned assertions and run the targeted construction tests. Verify that both restored files appear in the delivered Git changes. For any resulting commit, read the committed blobs back and verify both pins. Report the inherited failure if an original cannot be verified. Keep Stage 7D's separate partial acceptance in its dated report.

## 2. Choose the sample and freeze the shots

Use the live `central-bund-hero-cascade` at **T+92**, at world XZ **(−545, 2050)**. Its current front reaches **620 m in 1.8 seconds**. The authored T+94 environment marker stays at T+94. Use the front's distance and timing for each arrival. At the reference rate, arrival is T+92 plus horizontal distance multiplied by 1.8 / 620. Preserve the existing grass and scrub response and ignition behavior.

Choose a small set of inspected soil pockets within the existing front's reach. Use two or more distinct distances so the arrival order reads in a low oblique view. Start with the mounted existing grass and scrub and add a few recognizable trees where the actual site allows. If needed, add a small local patch of rooted grass or scrub to make the same event legible in the shot. The distant Stage 8A roadside trees stay under their existing ambient wind.

The broad fuel reservations exclude ordinary landscape placement in this area. Treat new reactive plants as one explicit, bounded fuel-response group. Inspect the mounted surfaces and use a narrowly identified pocket if a broad exclusion mask covers it. Document any permitted coarse-mask overlap and independently verify the entire root, trunk and bent crown envelope against actual tanks, berms, concrete floors, scorch and damage geometry, roads, pipes, utilities, actor routes and camera sight lines. Keep the general reservations in force. If a safe site cannot be proven, report the placement limit with the candidate views and measurements.

Before editing, capture the existing `fuel-storage` preset and a fixed low oblique view that can show the front and the proposed plants. Record placement coordinates, front distances, predicted arrivals, camera poses, viewport, settings and rendering budget. Start with a window around T+90–101 and adjust the end before the comparison if needed to show settling.

## 3. Make the response read as rooted deformation

- Keep the ambient wind before arrival. Drive the blast component from the existing event's absolute time and each plant's distance. Apply an outward horizontal impulse from the source, a fast rise, a readable rebound and a damped return to the same ambient wind. Give the blast component a finite end and keep it zero outside the selected reach.
- Anchor roots and lower trunk vertices. Curve the trunk progressively, with greater movement in upper branches and the crown. Keep the crown attached and the silhouette coherent. Reuse the Stage 8B wind approach and dryland plant geometry where useful. Share the same deformation in visible and shadow passes. Check the complete bounds through peak wind, peak blast and rebound.
- Use a smooth distance falloff and compatible grass, scrub and tree timing. Keep the plant sizes believable for the dry setting. Preserve existing blast, grass and scrub calculations and rendered ownership. New response instances belong to the chosen event and pocket.
- Keep the one-shot impulse on the unwrapped observation timeline. Stage 8B's 40-second clock is suitable for periodic wind. Verify that the blast does not return when that clock wraps or during late observation. Use bounded reusable resources and a deterministic evaluation that can reconstruct each pose directly.

## 4. Verify the rendered event and preserve the operation

- Deliver a matched native 1× clip in the existing fuel preset and a low view where the front reaches the plants and the tree shape changes visibly. Include stills just before the nearer arrival, during the nearer bend while the farther group has yet to respond, at the farther bend, and during rebound and recovery. Report per-plant arrival and maximum visible tip displacement. A slower inspection replay can supplement the normal-speed proof.
- Check actual mounted geometry and shader behavior for rooted bases, radial direction, order of arrival, distance falloff, complete clearance, shadow alignment and return to ambient motion. Reproduce the same deformation after a backward seek. Verify pause while orbiting, restart, a visit at T+180, a later 40-second wrap and a visit around T+7200. Include one unchanged Stage 8B wind and shore checkpoint.
- Preserve the 51 events, all 24 cameras, fixed-step driver, existing fire, smoke, dust front, damage and ignition, actor outcomes, landing and support geometry and authoritative data. Keep the full human-visibility constraint from `AGENTS.md`. Scope Stage 8C to this one visual vegetation response.
- Predeclare and measure a budget in the fuel preset and low view before arrival, near peak and after recovery. Use +40 submitted draws, +10% submitted triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights per pose as starting ceilings. Record matched pacing separately from capture, startup and graphics readiness, and stable resource counts through repeated seeks and restart.
- Add focused automated coverage for the new arrival, falloff, bounded deformation and determinism where the existing tests lack it. Use precise source exceptions for deliberate presentation edits and keep the world, support, construction and historical fixture oracles. Use the installed dev and browser tooling, both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` and `git diff --check`. Repository rules prohibit builds. Keep the existing dependencies and framework versions.

Record the site, timing, matched clips, clearance, measured cost, delivered fixture hashes and validation in `STAGE8C_ACCEPTANCE.md`. Update the plan and changelog from verified results. Close Stage 8C when the tree response reads at normal speed and the timing, root, clearance, resource and preservation checks pass.

# Stage 8D — Scenery Continuity and Detail Views

Work in the existing Cinderfront repository. Integrate the completed Stage 8A–8C samples into ordinary observation. Improve one continuous convoy approach and one exposed beach frontage at their normal viewing distances. Make the three already verified low views selectable from the viewer.

## 1. Establish the reference and fix the shots

Use `e439bdd` as the visual reference. Read `AGENTS.md`, the Stage 8 roadmap, `STAGE8A_ACCEPTANCE.md`, `STAGE8B_ACCEPTANCE.md`, `STAGE8C_ACCEPTANCE.md` and the relevant map and scenario authorities. Inspect the mounted world, Stage 8A placement and ground fitting, Stage 8B shoreline and wind, Stage 8C fuel vegetation, and the existing camera store, framing and selector.

Review the saved native clips and comparison contracts. The inspection bay reads as one compact spot in the convoy view. The east surf is visible along a short strip. The fuel-area trees bend clearly in the low view and occupy only a few pixels in the overview of the tanks. Use these differences to pick work that improves the normal presets and makes the close views discoverable.

Before visual edits, freeze the target route spans, shoreline bounds, camera poses, time windows, viewport, rendering settings and performance limits. Capture the original viewer in the target presets and at the proposed detail poses. Use one complete convoy passage around the existing bay, the east landing interval T+152–176, and the existing fuel low view over T+90–101.

## 2. Verify the baseline fixture bytes

The Stage 8C report verified both Stage 7C fixtures after restoration in its working tree. The blobs in `e439bdd` still have the older serialization. Restore the verified original bytes as a separate baseline repair and keep the repair present in the final Git changes.

| Tracked fixture under `src/simulation/fixtures/` | Original under `stage7c-review.local/` | Pinned SHA-256                                                     |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json`           | `construction-reference.json`          | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json`           | `presentation-reference.json`          | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

Check each original against its pin and confirm identical parsed values and JSON tokens apart from whitespace before copying. Keep the original assertions and exclude these files from formatting. Verify both hashes after all other edits. If a commit is created as part of the workflow, verify the hashes from its Git blobs. If the repair remains in the working tree, identify both paths as pending commit. Report an unverifiable original as an inherited failure. Stage 7D retains its separate dated partial acceptance.

## 3. Extend scenery where viewers already look

- **Rescue branch.** Extend the roadside treatment along a short stretch of the actual convoy route on either side of the Stage 8A inspection bay. Add two or three irregular groups of dry grass, scrub, rocks or small trees and connect them with a believable shoulder and drainage or gravel transition. Keep the existing shed and its props as the anchor. Work within the convoy's sampled view and keep road access, signs and vehicle silhouettes readable. The entry and exit should show intentional ground detail as well as the moment directly opposite the bay.
- **East landing frontage.** Extend the Stage 8B surf to one safe adjacent stretch of exposed coast. Follow the actual shore, fit the wash to the mounted grade and use related phases with variation along the frontage. Make the moving crest and shore texture readable at normal speed in the `beach-offshore` preset and in the low view. Preserve the accepted original strip, sheltered harbor treatment, land/water geometry, landing grades, wakes and contact. Check the full moving envelope against the LCAC and LAV sweeps and ramp clearance.
- Reuse the accepted instanced vegetation, fitting, material and wave logic. Keep intentional bare ground and the dry coastal character. Keep new work within these two stretches. The existing fuel-shock sample supplies the third detail view.

## 4. Make the proven close views reachable

Add an **Environment details** group to the existing camera selector. Add exactly three options using the already reviewed low poses as starting points.

| Choice            | View reference                    | Review interval |
| ----------------- | --------------------------------- | --------------- |
| Inspection bay    | Stage 8A rescue-branch low view   | T+53–63         |
| Shore break       | Stage 8B fixed low shoreline view | T+152–176       |
| Fuel shock (T+92) | Stage 8C fixed low oblique view   | T+90–101        |

Keep all 24 existing IDs, framing and follow behavior. A detail selection changes only the camera and retains the current time and play or pause state. Use the existing camera controls for orbit, pan, zoom and recenter. Keep the new options keyboard accessible and the scene visible in the existing compact HUD at desktop and short viewport heights. The three new options are deliberate additions to camera inventory checks. Keep historical assertions for all existing options.

## 5. Verify the delivered experience

- Deliver matched native 1× clips for the convoy approach and shoreline in the original presets. Use fixed-pose pairs at entry, at the original sample and at exit to demonstrate the added coverage. Capture the three detail views through the actual selector and show the fuel front reaching the two vegetation groups in order. Use the original camera and settings for visual comparisons so the scenery change can be judged at the existing distance.
- Check mounted ground fit, spacing and wind bounds for new plants. Check clearance and sight lines through vehicle passage and landing at the closest points. Verify phase and selection through pause, seek, restart and late observation. Preserve the existing fuel response, simulation clock, 51 events, actors, outcomes, support geometry, placement in previously accepted areas and authoritative data. Follow the complete human-visibility constraint in `AGENTS.md`.
- Predeclare a per-view rendering budget. Use +40 submitted draws, +10% submitted triangles, +6 shadow draws, +6,000 shadow triangles and zero added lights as initial ceilings against `e439bdd`. Measure before and after at matched poses, including manual placement at the new detail poses in the reference. Record a separate short native playback timing sample with display cadence, plus stable resource counts through repeated selection and restart.
- Run the existing construction, contact, world, camera and source checks with precise exceptions for intentional presentation changes. Add focused coverage where the new bounded placement, surf or camera behavior introduces a specific gap. Run both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` and `git diff --check`. Record any test timeout and rerun conditions separately. Use installed development tooling. Repository rules prohibit build commands. Keep existing dependencies and framework versions.

Record both coverage sites, matched stills and clips, the three selector checks, fixture hash status, performance, clearance and preservation results in `STAGE8D_ACCEPTANCE.md`. Update the plan and changelog from verified results. Close Stage 8D when the two normal views show a clear improvement and the new detail views work through ordinary playback. Use the side-by-side viewer evidence to decide whether further expansion is worthwhile.

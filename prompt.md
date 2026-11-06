# Stage 9A — Guided Observation and Highlights

Work in the existing Cinderfront repository. Make the first viewing of Ash Harbor easy to follow. Add an optional guided camera sequence and a compact Highlights control to the existing HUD. A viewer should be able to follow the authored operation from the offshore launch to the landing, or jump directly to a moment such as the fuel shock reaching the trees.

## 1. Establish the reference

Use the completed Stage 8D commit `94df448` as the reference. Read `AGENTS.md`, the iteration plan, the scenario timeline, `STAGE8D_ACCEPTANCE.md`, and the Stage 8A–8C shot evidence. Inspect the real viewer paths in `src/App.tsx`, `src/ui/SimulationHud.tsx`, the camera store and rig, the simulation clock and the readiness gates. The viewer currently offers 27 presets, including the three Environment details views. Use those views and the existing playback controls.

The Stage 8D report records passing fixture guards after restoring two files in its working tree. Both fixture blobs in `94df448` still contain the earlier serialization. Restore the verified original bytes as a separate baseline repair and include both paths in the delivered Git changes.

| Tracked fixture under `src/simulation/fixtures/` | Original under `stage7c-review.local/` | Pinned SHA-256                                                     |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json`           | `construction-reference.json`          | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json`           | `presentation-reference.json`          | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

Before copying, confirm each capture's pin and the equality of parsed values and JSON tokens apart from whitespace. Keep the original assertions. Protect the two paths from formatting. Verify both hashes after the final edits, and verify the actual Git blobs for any authorized commit. Report the working-tree or committed status explicitly. If an original cannot be verified, record the inherited failure and keep its guard. Stage 7D retains its separate dated partial acceptance.

## 2. Choose a short authored shot list

Preview the following beats in the existing viewer. Freeze a chronological cue sheet before implementing the guide. Use at most ten cuts, and record each cue's simulation time, existing camera ID, subject and reason for the cut. Confirm the selected pose is unobstructed and gives enough lead-in to see the event at 1×.

| Beat                                    | Existing camera and starting window                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Offshore opening and aircraft departure | Wasp and the F-35B follow views near T+0–20. The two launches begin at T+5 and T+13.                                          |
| Radar and air defense                   | Radar Hill, search radar or an aircraft follow view around the T+24 engagement.                                               |
| Convoy passing the inspection bay       | Support convoy or Inspection bay over the verified T+53–63 pass.                                                              |
| Fuel cascade and vegetation response    | Fuel shock from about T+90 through the T+92 front and recovery.                                                               |
| Ammunition detonation                   | Ammunition with a lead-in to T+132.                                                                                           |
| Shore approach and landing              | Beach offshore or Shore break around T+152–164.                                                                               |
| Ramp and LAV deployment                 | The existing LCAC and LAV follow views. Finish with a landing view through at least T+188 so the final transfers can be seen. |

Treat these as observation beats. The authoritative timeline, 51 events and T+180 scripted boundary stay exact. Use the existing indefinite observation path after the last cue.

## 3. Integrate guide and highlights into the existing HUD

- Keep manual observation as the initial mode. Let the user explicitly enable **Guided view**. Enabling it chooses the cue for the current time and preserves the current Play or Pause state and speed. The existing Play control advances the simulation. Keep the last guided preset after the final cue while observation continues.
- Derive the active cue from absolute simulation time. Issue a camera request only when the desired cue changes or when the user explicitly requests a recenter or mode change. A seek across several cuts resolves directly to the destination cue. Reuse the existing safe camera transitions and camera framing. The guide can read the simulation clock and request a camera. Keep all clock writes in the existing explicit playback, seek and restart actions.
- A manual preset selection or actual orbit, pan or zoom gesture returns to manual view and keeps the user's camera control. Leaving the guide keeps the last visible view. Reentering applies the cue for the current time. While guided, restart returns to the opening cue at paused T+0, and a backward seek reconstructs its destination cue. Preserve ordinary manual seek and restart semantics.
- Add a compact **Highlights** control with a few named entries drawn from the same cue sheet. Include the inspection-bay pass, fuel shock, shore break and deployment. Show a useful time and subject for each entry. Explicit activation pauses, seeks to the clip's lead-in and selects its camera in manual mode. Leave playback to the user's Play control. Use the existing readiness gates for actions that move the clock, and keep context loss and recovery behavior intact.
- Use the existing native controls and Tailwind HUD style. Keep the scene visible at the standard and 1024 × 430 layouts. Make the active mode, shot and chapter action clear by keyboard. Replace the stale development-stage badge with a stable product label.

## 4. Verify the actual viewing flow

- From a fresh ready page, use the native controls to enable the guide and play through the opening, convoy, blast and landing. Record the cue transitions and a short review clip showing the vegetation response and shoreline at their intended cuts. Use the normal HUD and the real rendering path. Verify all declared subjects are in frame around their cue.
- Use Highlights to preview each destination, then demonstrate Play, Pause, backward seek, restart, manual camera takeover and guide reentry. Check keyboard focus, 0.5× and 2× crossing, playback beyond T+180 and a late seek. Include graphics preparation and native context recovery if the new controller touches readiness or lifecycle.
- Test cue boundaries, deterministic selection after nonadjacent seeks, and one-request-per-transition behavior. Verify that a manual change wins over guide updates and that a highlight preview remains paused. Keep the existing 27 camera IDs and sampled manual frames exact. Keep fixed-step behavior, event labels and counts, runtime snapshots, actors, environment motion, terrain, support, routes and authoritative assets. Follow the full human-visibility constraint in `AGENTS.md`.
- Compare the canvas and render counts with `94df448` at identical times and camera poses. Account separately for intentional HUD pixels. The guide uses the existing scene and resources. Check that matched views add no scene draws, lights or persistent resource owners and that repeated mode switches, seeks and restarts leave stable request and resource counts. Record short separate playback timing samples with the actual display cadence. Keep the historical Stage 7D findings separate.
- Use exact path-level audit exceptions for deliberate viewer changes and retain historical fixtures and assertions. Run focused tests, both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` and `git diff --check`. Use the installed development viewer and browser. Repository rules prohibit builds. Keep dependency and framework versions.

Record the cue sheet, native clips, keyboard and playback evidence, matched camera and render results, fixture hash status and tests in `STAGE9A_ACCEPTANCE.md`. Update the plan and changelog from verified results. Close Stage 9A when a first-time viewer can start the guided sequence and revisit each highlight through the existing viewer. Use that viewing experience to decide whether a later polish round is useful.

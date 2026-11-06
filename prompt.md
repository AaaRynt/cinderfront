# Stage 8A — Ground Detail and Roadside Storytelling

Work in the existing Cinderfront repository. Deliver two small, finished environment samples. The first deliverable is a short before-and-after view of the existing convoy passing a roadside location with readable vegetation, ground transitions and abandoned maintenance equipment. The second sample gives one inland beach exit the same level of attention in a distinct coastal setting.

## 1. Establish the baseline

Read `AGENTS.md`, the relevant Stage 4C and Stage 6A sections of `ITERATION_PLAN.md`, `assets/map/map-spec.yaml`, `assets/scenario/scenario-spec.yaml`, and `STAGE7D_ACCEPTANCE.md`. Inspect the actual mounted world in `src/scene/world/WorldShell.tsx`, the regional cover and service equipment, and the landscape placement, grounding and movement reservations.

The starting reference is `ba0abfd`, the committed Stage 7D follow-up. Its dated report records a successful local restoration of two Stage 7C fixtures. The checked-in copies at `ba0abfd` still have the previous serialization. Verify the two byte guards before environment edits.

| Tracked file under `src/simulation/fixtures/` | Original under `stage7c-review.local/` | Pinned SHA-256                                                     |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `stage7cConstructionPreservation.json`        | `construction-reference.json`          | `8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8` |
| `stage7cPresentationPreservation.json`        | `presentation-reference.json`          | `b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3` |

When a tracked file misses its pin, restore the corresponding exact original bytes after verifying the original hash and confirming the same parsed values and JSON tokens apart from whitespace. Keep the original assertions and report this separately as baseline repair. Run the targeted construction tests and verify the final deliverable still contains the pinned bytes. If the original cannot be verified, record the inherited failure and keep the guard intact. Stage 7D's outstanding playback and capture criteria remain in its dated report.

## 2. Pick and photograph two sites before editing

1. **Convoy corridor.** Choose one existing road approach, junction edge or pull-off visible during an actual convoy pass. Inspect the dry-wash bridge approach, the rescue and service branch, and the authored roadside pull-offs. Pick the site that gives the strongest view from the existing `support-convoy` or `corridor` camera and a safe roadside foreground. Keep operational space clear.
2. **Inland beach exit.** Pick one of the existing `road_beach_exit` or `road_beach_access_east` tracks. Place the sample inland near a sheltered dune or track shoulder and use the corresponding LAV follow camera. Preserve the open strand, ramps, vehicle path and beach contact grades.

Record each site on the map with an approximate boundary, the actual actor passage time, the existing camera, and a low inspection view. Capture a before image at both distances and a short native-playback segment before changing visuals. Fix the time window, camera poses, viewport, rendering settings and cost baseline for the comparison. Use the archived Stage 6A and 7D images as context and the current development viewer for the paired evidence.

## 3. Build a readable landscape and a reason for the objects to be there

Keep Ash Harbor's dry semi-arid character. Shape several irregular pockets of dry grass and low scrub around drainage lines, rocks, road edges and sheltered dunes. Use differences in density, height, color and exposed soil to make the grouping readable at medium distance. Leave deliberate bare ground between pockets. Give a few trees fuller, varied silhouettes that are recognizable in the frame, with natural roots and canopies suited to the location.

Create distinct ground transitions. The corridor should read as pavement, a worn gravel shoulder, and rough dry ground beyond it. The beach exit should read as compacted track, loose sand and sheltered dune cover. Use existing ground surfaces and bounded visual treatments for these transitions.

Give the corridor site one coherent story. Show a disused road maintenance or inspection point with a weathered shelter or remnant, rusted oil drums, discarded tires, and a legible worn directional or warning sign. Compose them as a small working area with a recognizable entrance and traces of use. Use believable scale, contact shadows and worn materials. Vary placement and grouping so the objects look deliberately left or stored there.

Give the beach site a quieter history, such as a faded route marker and a small remnant of an inland service position. Use dune plants, gravel and exposed sand to establish its own character. Keep the two samples visually distinct.

## 4. Integrate the detail with the existing scene

- Reuse existing geometry, materials, terrain fitting and seeded placement where they fit. Keep new instance records in finite local groups with stable IDs. Batch repeated props and plants by type and region.
- Check the full footprints and tree crowns against the actual mounted surface, existing scenery, traffic envelopes, landing ramps, road access, damaged structures and camera sight lines. Include relevant routes from both the scripted operation and aftermath. Sample a vehicle pass at each sample and inspect the closest clearances.
- Keep terrain and support geometry, contact calculations, authored authorities, all 51 events, vehicle outcomes, the 24 cameras and their behavior, and the simulation clock exact. Respect the full human-visibility constraint in `AGENTS.md`, including silhouettes and visible occupants.
- Scope Stage 8A to static ground detail and roadside storytelling at the two sites. Stage 8B is planned for shore waves and wind. Stage 8C is planned for vegetation response to an existing blast.

## 5. Prove the result in the viewer

- Deliver paired images for each site at a normal existing preset and at the low inspection pose. Match pose, time and rendering settings. Deliver a short before-and-after sequence at the convoy site and show a LAV passing the beach detail. Capture through the running viewer with the normal HUD and controls.
- In the normal convoy view, make the roadside cluster, a tree or scrub group, and the road-to-soil transition identifiable during motion. In the beach view, show the road edge, dune vegetation and the route marker or remnant. Use the low views to check plant roots, prop placement, sign scale and materials. Iterate if the intended details still disappear in the target framing.
- Predeclare a draw-call, triangle and shadow budget for the chosen poses. Use +40 submitted draws and +10% submitted triangles per pose as initial ceilings. Record the comparison limits before editing and measure the finished scene against them. Record scene and resource counts at equal points on the same viewing path, plus a short matched 1× playback check with display cadence noted. Use stable shared resources and bounded static placement.
- Run the existing world, contact, source and construction preservation tests. If a source audit needs to recognize a deliberate visual edit, use exact path-level allowances and retain the old baselines and simulation assertions. Preserve fixture provenance. Use matched visual comparison for the intended additions and exact invariants for unaffected state and geometry.
- Check play, pause, backward seek and restart across both sites. Verify that prop and plant placements repeat and that the static additions stay grounded and clear of vehicles. Exercise the existing startup and graphics preparation with the added materials.

Use the installed development and browser tools, both TypeScript no-emit checks, `pnpm lint`, `pnpm test:run --maxWorkers=2` and `git diff --check`. Repository rules prohibit build commands. Keep existing dependencies and framework versions.

Record the two sites, the paired visuals, the measured cost, the fixture-baseline result, and the preservation checks in `STAGE8A_ACCEPTANCE.md`. Update the plan and changelog from verified results. Mark Stage 8A complete when both sample locations meet the visual, clearance, cost and preservation checks. Use the sample comparison to guide any later expansion.

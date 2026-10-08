# Stage 5 Amphibious Integration Readiness

Measurements: 2026-10-08; implementation validation completed 2026-10-09. Stage 5A adds the secondary Pantsir only. The runtime remains scoped to T+176 and 42 official events. Two LCACs, eight LAV-25s, nine remaining events, T+180 integration and indefinite aftermath are future work.

**Stage 5B is not ready for physically credible transit until an explicit route/timing and shore-contact decision is approved.** Rounding the existing routes does not resolve their speed conflict. The recommendation is to re-author nearer staging and final approaches while retaining the three-minute story, with the authoritative changes and shallow-event interpretation listed below. No reference asset is changed by this report.

## Sources and measurement method

### Completed Stage 5A local reaction

The reserve actor starts at [5450,-1745] on the existing pull-off's gravel surface, 0.4 m above the triangulated terrain, and stops at [5432,-1749.8]. Its sampled cubic path is 18.653022 m long, with smooth acceleration/braking over T+112–117.2: measured peak speed 6.725849 m/s, acceleration magnitude 3.982736 m/s² and heading rate 0.137017 rad/s (7.85°/s). This position remains beside the trunk, more than 1.5 km from the distant junction. No local scenery exclusion adjustment was needed: all 13 existing vehicle sweeps are clear; full hull margins to seeded cover, service equipment and the closest light exceed 486/1908/150 m. Actual faceted wheel contact error is at most 0.047821 m; chassis, guns and lowered pads retain tested clearances.

Signed wheel travel and bounded front-axle steering follow that path. Stabilizers and search radar stay retracted during travel, then continuously deploy/align over T+117.2–118.8. The shared model retains its approximately 10.30 × 3.30 m footprint, eight wheels, 12 tubes, paired guns, sealed glazing and 4.37/5.65 m transport/deployed profiles. Two left-bank tubes fire at 119 and 119.6 into the fixed western air sector [4870,160,-1660]. Each modeled outgoing segment is 390 m over 1.15 s, begins at its actual tube cap and leaves the bounded engagement as a miss; no aircraft damage or new official event is inferred.

The exact T+121 impact anchor is [5433.131563,47.648851,-1750.136712], transformed from the vehicle's actual stopped pose. Source is exactly `attacker_f35_01`. A compact terminal strike is modeled with a medium flash, restrained dust/fragments, the same fixed vehicle wreck, terrain-triangle-clipped scorch, local fire and eight bounded smoke slots through 176. Vehicle motion, scanning and launches freeze at 121. The preserved F-35B's actual T+112 bay is 4,637.593 m from that anchor and 104.887° off nose; a nine-second flight would require at least 515.288 m/s. No full incoming trajectory is included. This is a bounded presentation choice, not a claim that an earlier long-glide release on the preserved path is impossible.

Both no-emit TypeScript checks, lint (19 existing warnings), 365 tests across 27 files with reduced test parallelism and whitespace checks passed. An initial concurrent full-suite run timed out in an existing terrain test; no old assertion was changed. Browser evidence covers the full T+110–124 sequence at 1×, lifecycle boundaries through 176, representative fuel/bridge/T-72/aircraft replays, all 20 cameras, all speeds, paused controls, keyboard controls, backward/repeated seek/restart and 1440×900/1280×720/1280×540 HUDs. Paused wheel travel and the actual GPU coastal time uniform stayed fixed. A fresh final browser has no JavaScript errors, only the pre-existing Three.js Clock warning. Matched view measurements add 30 calls and 1,260 triangles; five cycles after warm-up hold identical resource counts and secondary geometry/material identities. Detailed limits, captures and raw measurements are in `stage5a-review.local/README.md`.

### Authoritative inputs

The authority is `assets/scenario/scenario-spec.yaml` (51 events), its derived `scenario-timeline.md`, `assets/map/map-spec.yaml` and matching `map-layout.svg`, `assets/vehicle/Belligerents.yaml`, and the LCAC/LAV-25/Pantsir dimension files and reference images. Source `attacker` maps to runtime `landings_attacker`; source `defender` maps to `island_defender` through `FACTION_ADAPTER`. LCAC and LAV ownership is the attacker. The secondary Pantsir is the defender's corridor reserve, not another Radar Hill emplacement.

Measurements use the actual `createPath`/`samplePath` helpers in `src/simulation/groundMotion.ts`, `pointInPolygon`/`distanceToPolyline`/`getTerrainHeight` in `src/scene/world/stage2/terrainModel.ts`, rendered road definitions and water polygons in `stage2Data.ts`, and Stage 4C reservation/layout modules. Route lengths sum Euclidean XZ segment lengths in world meters. Candidate rounding cuts back 100 m on each side of each internal vertex, capped at 20% of either adjoining segment, then samples the quadratic entry–vertex–exit curve at 64 intervals. Endpoints remain exact. This candidate is an audit calculation, not a committed future actor path.

Region/contact crossings were sampled at 1 m stations and refined with bisection. Full craft corners use the sampled tangent and the 26.4 × 14.3 m rectangle. Heights come from the actual rendered terrain grid, not a separate collision surface. Boundary classification at an exact polygon vertex can differ by floating-point epsilon; reported crossing coordinates describe the boundary approached from each side.

## Official event coverage

All event IDs and official timestamps remain unchanged in the adapter. Existing arrays contain 12 Stage 1, 15 Stage 3, five Stage 4B, four Stage 4B.2B and four Stage 4B.2C events: 40 total. Stage 5A contributes exactly two Pantsir events: **42 implemented, nine outstanding, 51 official**. The T+176 inland event remains outstanding even though 176 is the current endpoint.

| T+ seconds | Official event ID                       | Coverage after Stage 5A  |
| ---------: | --------------------------------------- | ------------------------ |
|          0 | `scenario_begin`                        | Implemented: Stage 1     |
|          1 | `wasp_offshore_underway`                | Implemented: Stage 1     |
|          5 | `f35_01_launch`                         | Implemented: Stage 1     |
|         13 | `f35_02_launch`                         | Implemented: Stage 1     |
|         14 | `radar_alert`                           | Implemented: Stage 1     |
|         20 | `air_defense_tracking`                  | Implemented: Stage 1     |
|         24 | `pantsir_01_engage`                     | Implemented: Stage 1     |
|         29 | `fixed_air_defense_engage`              | Implemented: Stage 1     |
|         36 | `radar_hill_near_hit`                   | Implemented: Stage 1     |
|         42 | `pantsir_01_destroyed`                  | Implemented: Stage 1     |
|         45 | `primary_radar_disabled`                | Implemented: Stage 1     |
|         48 | `harbor_first_hit`                      | Implemented: Stage 1     |
|         52 | `f35_02_harbor_ingress`                 | Implemented: Stage 3     |
|         62 | `molniya_departure`                     | Implemented: Stage 3     |
|         72 | `talwar_first_hit`                      | Implemented: Stage 3     |
|         75 | `rescue_convoy_redirect`                | Implemented: Stage 4B.2C |
|         78 | `industrial_pipeline_hit`               | Implemented: Stage 3     |
|         86 | `fuel_tank_initial_hit`                 | Implemented: Stage 3     |
|         92 | `fuel_storage_cascade`                  | Implemented: Stage 3     |
|         94 | `fuel_shock_environment_response`       | Implemented: Stage 3     |
|         98 | `industrial_blackout`                   | Implemented: Stage 3     |
|        100 | `talwar_fuel_leak`                      | Implemented: Stage 3     |
|        104 | `su30_reinforcement_entry`              | Implemented: Stage 4B.2B |
|        108 | `rescue_convoy_chokepoint`              | Implemented: Stage 4B.2C |
|        110 | `lcac_departure`                        | Outstanding: Stage 5B    |
|        112 | `pantsir_02_relocate`                   | Implemented: Stage 5A    |
|        115 | `talwar_second_hit`                     | Implemented: Stage 3     |
|        116 | `ammunition_cookoff_begin`              | Implemented: Stage 3     |
|        121 | `pantsir_02_destroyed`                  | Implemented: Stage 5A    |
|        125 | `rescue_route_secondary_hit`            | Implemented: Stage 4B.2C |
|        128 | `molniya_fragment_damage`               | Implemented: Stage 3     |
|        132 | `ammunition_storage_primary_detonation` | Implemented: Stage 3     |
|        133 | `btr_01_disabled`                       | Implemented: Stage 4B    |
|        136 | `btr_survivors_fallback`                | Implemented: Stage 4B    |
|        137 | `su30_01_damaged`                       | Implemented: Stage 4B.2B |
|        140 | `lcac_01_shallow_water`                 | Outstanding: Stage 5B    |
|        142 | `su30_02_cover_withdrawal`              | Implemented: Stage 4B.2B |
|        148 | `lcac_02_shallow_water`                 | Outstanding: Stage 5B    |
|        150 | `defender_armored_reinforcement_move`   | Implemented: Stage 4B    |
|        155 | `lcac_01_beach`                         | Outstanding: Stage 5B    |
|        158 | `t72_lead_destroyed`                    | Implemented: Stage 4B    |
|        160 | `lav_group_01_disembark`                | Outstanding: Stage 5C    |
|        162 | `lcac_02_beach`                         | Outstanding: Stage 5B    |
|        163 | `t72_survivors_withdraw`                | Implemented: Stage 4B    |
|        165 | `talwar_severe_list`                    | Implemented: Stage 3     |
|        166 | `lav_group_02_disembark`                | Outstanding: Stage 5C    |
|        170 | `aircraft_egress`                       | Implemented: Stage 4B.2B |
|        172 | `molniya_open_water`                    | Implemented: Stage 3     |
|        174 | `rescue_convoy_abandon_approach`        | Implemented: Stage 4B.2C |
|        176 | `lav_inland_spread`                     | Outstanding: Stage 5C    |
|        180 | `scripted_phase_complete`               | Outstanding: Stage 5C    |

The adapter renames `at_s` → `atSeconds`, `local_time` → `localTime`, `path_id` → `pathId`, `effect_profile` → `effectProfile`, and `resulting_state` → `resultingState`. Source `entity` becomes `actorId` or the actor family's `groupId`; plural `entities` stays `entities`. Source target entity/map feature/map region becomes `targetId`, except support route damage uses `targetFeatureId`. Source attribution is `actorId` for the older strike records, with the damaged source `entity` represented by `targetId`; the T-72 strike instead uses explicit `sourceActorId` and a concrete lead-vehicle `targetId`. Stage 5A uses `actorId: defender_pantsir_02` for the affected vehicle and `sourceAircraftId: attacker_f35_01` for its destruction source. These are adapter conventions, not new official events.

`btr_01_disabled` narrows the source group event to `actorId: defender_btr_01` while retaining `groupId` and the official group target. `t72_lead_destroyed` retains its official group but resolves the destroyed lead to `defender_t72_01`. Support events retain `groupId: defender_support_convoy_01`; their authored phase/result is also derived in convoy state. The bridge explosion and Su-30 damage still have no invented source attribution.

Four existing support event codes differ in wording from the authority; their IDs/times and intended behavior are preserved:

| ID                               | Official code                                        | Current adapter code                                      |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `rescue_convoy_redirect`         | `redirect_toward_industrial_district`                | `redirect_toward_industrial_emergency`                    |
| `rescue_convoy_chokepoint`       | `encounter_reduced_visibility_and_route_obstruction` | `staggered_visibility_hesitation`                         |
| `rescue_route_secondary_hit`     | `roadside_secondary_explosion_blocks_route`          | `unattributed_secondary_explosion_blocks_bridge_approach` |
| `rescue_convoy_abandon_approach` | `stop_advance_and_begin_partial_withdrawal`          | `abandon_approach_and_begin_partial_withdrawal`           |

Future plural `path_ids` needs a focused `pathIds` adapter. Keep the official T+180 ID **`scripted_phase_complete`** and code **`enter_aftermath_observation`** exactly; it is not an actor-destruction or global-freeze event.

## LCAC distance, timing and coastal contact

| Route                           | Raw length m | Rounded candidate m | Transit window | Raw mean m/s | Rounded mean m/s |
| ------------------------------- | -----------: | ------------------: | -------------- | -----------: | ---------------: |
| `path_lcac_beach_approach_west` |    8,633.533 |           8,632.213 | 110–155: 45 s  |      191.856 |          191.827 |
| `path_lcac_beach_approach_east` |    9,657.505 |           9,650.275 | 110–162: 52 s  |      185.721 |          185.582 |

These means are about 691 and 669 km/h. Starting from a hold and braking to a beach stop require greater peaks. Smoothing saves only 1.319/7.230 m and cannot make these ordinary hovercraft transits.

### Shallow thresholds are a separate conflict

The route points are not all timed knots. The official shallow events must be checked against the actual coastal polygons rather than assigning a convenient waypoint index.

| Measurement on raw path                               |              West |              East |
| ----------------------------------------------------- | ----------------: | ----------------: |
| First `surface_beach_shallows` entry station m        |         7,257.696 |         7,003.105 |
| Entry XZ                                              | [3000, -3363.636] | [3000, -3590.909] |
| Entry time under constant total-transit speed         |           147.829 |           147.708 |
| Official shallow event time                           |               140 |               148 |
| Mean speed needed departure → exact shallow entry m/s |           241.923 |           184.292 |
| Mean speed needed shallow entry → beaching m/s        |            91.722 |           189.600 |

At T+140, constant-speed west transit is still at [1527.138, -3645.929], outside both beach shallows and intertidal polygons. At T+148, east transit is [3054.247, -3593.375], just within the shallow polygon. Rounded entry times are 147.829/147.734, so neither diagnosis changes. The west [3600, -3200] waypoint is already north of the shallow polygon's water-side band and within the intertidal band; it is not the first shallow-entry location.

### Water-side and vertical geometry

The original centerlines stay outside mainland until their final segments. First center contact is [3902.941, -3078.824] west and [5388.112, -2920.513] east. The following **427.645/86.556 m** of route is on mainland before the final [4300, -2920]/[5450, -2860] beaching centers. At constant transit speed, center contact occurs at T+152.771/T+161.534; full-craft corners contact 28.636/23.813 m earlier. There is no earlier mainland crossing, but the last segment is already a water-to-land traverse, not pure water until the final point.

Sea is the unchanged -0.12 m plane. Rendered terrain at first contact is 4.633/4.447 m; final centers are 4.492/4.268 m. `createCoastSkirtGeometry` fills the coast vertically down to -3 m. Thus the present beach has a roughly 4.6–4.8 m vertical water/land edge. Normal-only Stage 4C waves provide no physical slope, buoyancy or shore ramp. A craft cannot retain a sea-level skirt and pass through that wall or silently jump to the land sampler. A narrowly scoped approved contact-grade correction, or an explicitly documented nonphysical visual contact bridge, is required before claiming a grounded landing. Preserve existing land elevation/road behavior outside the landing contact footprint.

The LCAC starting waypoints coincide with map reference anchors for a distant support hull (west, 220 m occupancy radius) and northern escort hull (east, 240 m radius). These reference hulls are not current runtime actors, so there is no existing rendered ship collision. They cannot all occupy those positions in a later expanded roster. Current Wasp-to-staging-center distances at T+110 are about 799.936/1,249.947 m, clear of the actual Wasp hull; no Wasp movement is needed.

### Alternatives and recommendation

1. **Explicit cinematic compression:** Keep all reference routes and event times, author event-constrained distance profiles, and acknowledge speeds above 190 m/s. The west shallow event additionally requires the 242/92 m/s phase means above. This is the smallest data change, but it gives aircraft-like motion, huge implied wake speeds and very brief shoreline crossings. It still needs a contact solution and correct full sweeps. It must be labeled nonphysical, not hidden by teleporting, coordinate scaling, off-map disappearance or a false speed cap.
2. **Nearer staging and revised final approaches — recommended:** Retain T+110 departure, T+155/T+162 stops, T+160/T+166 unloading and T+176/T+180 narrative beats, but update initial staging references and LCAC approach geometry explicitly. Illustrative direct approaches from [4200, -4000] via [4300, -3100] to the current west stop, and [5400, -4000] via [5450, -2909.167] to the east stop, are 1,085.539/1,141.145 m: means 24.123/21.945 m/s before acceleration/braking. These are scale estimates, not approved paths. They require terminal heading curves, a shore-contact solution and full-clearance remeasurement. They are no longer staging near Wasp and must not retain that incorrect initial-location contract.
3. **Revised departure/transit timing:** Keep the long geometry and use a chosen presentation cruise speed, then revise departure/arrival/shallow times together. At a 25 m/s illustrative ceiling, distance alone needs at least 345.341/386.300 s. T+110 departure implies earliest beaching about T+455/T+496, before acceleration/braking. Keeping T+155/T+162 arrival instead would require departure before T+0 (about -190/-224). This changes the three-minute sequence or requires a documented pre-script transit whose onscreen state at T+0 is already far along the route. Moving departure alone does not repair the remaining west shallow-to-stop distance in 15 s.

**Required authoritative decision for recommendation 2:** A nearer direct approach crosses the existing broad shallow polygon well before T+140/T+148. Keeping those times must explicitly redefine them as the final nearshore-approach thresholds, or revise the coastal shallow boundaries/event times and route knots together. Do not pretend the existing literal `enter_shallow_water_approach` definition is unchanged. Approved data must settle staging, path points, shallow semantics, beach-contact treatment and terminal headings as one package. Retain the T+180 endpoint ID/code. This recommendation preserves readable craft motion and the established combat chronology; no such rewrite is authorized or applied in Stage 5A.

## Cargo, ramp and unloading feasibility

### Roster and deck packing

The exact authoritative roster is `attacker_lcac_01` carrying `attacker_lav_group_01` (four LAV-25s) and `attacker_lcac_02` carrying `attacker_lav_group_02` (four). That is two craft and eight ground vehicles, with no planned landing losses. Individual future vehicle IDs must be assigned explicitly; the source defines group IDs/counts, not eight individual IDs.

LCAC dimensions are **26.4 × 14.3 × 7.2 m**, with a **20.4 × 8.2 m** open deck. LAV hull dimensions are **6.39 × 2.50 × 2.69 m**; the source width is hull width and the cannon is excluded from the length anchor. Four bare hull footprints use 63.9 m² of the 167.28 m² deck. Area alone does not prove egress.

An auditable two-by-two packing has LCAC-local LAV centers **X = ±1.8 m, Z = ±4.0 m**, all facing local negative Z. Hull-only margins are 1.05 m to each deck side, 1.10 m between columns, 1.61 m between rows, and 3.005 m at each deck end. Side machinery occupies the outer (14.3−8.2)/2 = **3.05 m** strips and must not invade the central deck or ramp lanes. Reference images show the stern fan ducts beside the open deck; keep their actual swept blade/duct bounds outside payload clearance.

A proposed **3.0 m total wheel envelope** and **0.8 m forward barrel allowance** still leave 0.8 m deck-side clearance, 0.6 m between columns, 0.81 m between front/rear envelopes, and 2.205 m before the forward deck edge. These two allowances are design budgets, not dimensions supplied by YAML. Verify actual generated wheels, turret, forward barrel, antenna and every turning pose before accepting them. Stow turrets forward during transport/unloading; a sideways barrel must not cross machinery or another vehicle. Full actual model bounds override these provisional budgets.

Four in one fore-aft column need 25.56 m before gaps and do not fit the 20.4 m deck. Two-by-two is viable if there is a broad clear bow ramp. Prefer staggered departures in the two deck lanes; do not assume both columns can squeeze immediately through an unspecified narrow ramp. A merge inside the deck needs a separately sampled full-body sweep.

### Continuous carrier/ramp/ground transforms

Keep embarked poses in craft-local coordinates. World pose is `carrierWorldMatrix × cargoLocalMatrix`, including carrier pitch/roll and the payload's actual wheel-contact height on the deck. Embarked wheels stay still despite carrier world travel; wheel phase uses the LAV's signed travel relative to its supporting deck/ramp/ground. At the start of unloading, the derived ramp-path pose must equal that transformed pose exactly. Carrier attachment cannot switch to a precomputed land pose with a position/yaw discontinuity. Derive one absolute-time carrier → deck → ramp → beach → road trajectory per vehicle and use it for wheels, body tilt, dust and camera targeting.

The reference does not specify ramp length, hinge height, usable width, on-beach deck height or skirt compression. A measurable provisional design is a 6 m ramp hinged at local Z = -10.2 m, with a settled deck 1.2 m above its contact ground. On level ground the horizontal reach is sqrt(6²−1.2²) = **5.879 m**, slope **11.54°**, and tip extends **2.679 m** beyond the 13.2 m craft half-length. This must be reconciled with the model's side profile and folded ramp bounds rather than extending the 26.4 m closed overall length silently. A broad 8.2 m clear opening accommodates the two proposed 3.0 m wheel lanes.

If the craft settles aligned with the first road segment, actual terrain height drops only 0.015/0.011 m between these candidate hinge/tip footprints, giving approximately 11.7° rather than a large uphill step. Solve the final angle against the actual tip/contact height; do not use a constant angle when terrain or craft pose changes. Each wheel must transition through the same deck/ramp/terrain surface. Keep the skirt's lowest surface seated above the land after compression and out of wheel paths. This local ramp fit does not resolve the earlier vertical coastal edge.

### A conservative stagger that fits the narrative

The official disembark events mean **begin**, not all four instantly unloaded. A candidate per-group launch offset is **0, 3, 6, 9 s**, front-left, front-right, rear-left, rear-right. Use a 1 s acceleration from 0 to 2 m/s, then 2 m/s on deck/ramp. With the packing and provisional ramp above, a front vehicle's rear hull edge clears the tip after about **8.14 s**; a rear-row vehicle needs **12.14 s**. Full wheel/barrel envelopes, slow turning or a longer ramp can increase these times. These are measured candidate completion times, not runtime choreography.

| Group                   | Departure times    | Rear hull clears ramp by       | Clear by T+176 | Clear by T+180 |
| ----------------------- | ------------------ | ------------------------------ | -------------- | -------------- |
| `attacker_lav_group_01` | 160, 163, 166, 169 | 168.14, 171.14, 178.14, 181.14 | First two      | First three    |
| `attacker_lav_group_02` | 166, 169, 172, 175 | 174.14, 177.14, 184.14, 187.14 | First one      | First two      |

Thus T+176 can honestly show the first vehicles spreading into both road heads while remaining vehicles are on the ramps. At T+180, the first group's last vehicle and the second group's rear pair can still be disembarking, consistent with the source aftermath description. Preserve them as visible cargo/moving vehicles through the whole transition. Do not accelerate the late four to finish a kilometre-long inland route in fourteen seconds.

With modest 4–6 m/s beach travel after ramp clearance, early vehicles can begin tens of meters of inland movement. At a 5 m/s illustrative cap, even ignoring acceleration, west/east full road traversal needs **174.97/200.35 s**; neither entire inland road can finish before T+180. The endpoint is initial expansion, not all eight arriving at a remote inland destination.

## Connector direction, terminal heading and reserved space

`path_lav_inland_west.connector_waypoints_xz_m` is **[4675,-2940] → [4475,-2930] → [4300,-2920]**, length **375.535 m**. East is **[5280,-2910] → [5360,-2890] → [5450,-2860]**, length **177.330 m**. Both are stored **apron → beaching point**, opposite unloading movement toward the apron. Reverse them only if choosing that apron-bound movement.

Both actual inland roads begin exactly at the LCAC beaching centers. `road_beach_exit` runs [4300,-2920] toward [4250,-2700] and has length **874.827 m**. `road_beach_access_east` runs [5450,-2860] toward [5550,-2680], length **1,001.774 m**. Both are 10 m wide. The first segments head **12.804° west of north / 29.055° east of north**. The LCAC raw final approach heads **68.199° east of north / 45.644° east of north**, differing by **81.003°/16.589°**. West especially needs a terminal alignment curve or deliberate settled turn before dropping its ramp; otherwise initial unloading points across the road.

The apron-end connector points are 375.533/177.200 m from the closest road centerlines. A reversed connector therefore ends on the apron, not on its named inland road, and following it then teleporting to the road is invalid. Prefer short unloading fans that join each road directly near its start, preserving two groups. If the authoritative apron connectors must be traversed, explicitly author apron-to-road return/join arcs and reserve them; the west connector alone cannot be completed by T+176 at cautious ramp/beach speed. This is an integration choice to settle against the reference feature contract, not an excuse to reorder roads blindly.

The Stage 4C mask currently reserves:

- original LCAC paths with circumscribed half-diagonal **15.012 m + 4 m = 19.012 m** radius;
- a **65 m** circle at each current beaching endpoint for landing, ramp and unloading;
- both LAV connectors with hull half-diagonal **3.431 m + 5 m = 8.431 m** radius;
- both roads plus seven-meter shoulders, the apron/hardstand and abandoned emplacement footprints;
- complete BTR, T-72 gun/hull and support-truck sweeps, damage footprints and fixed facilities.

The provisional settled craft, 6 m ramp and locally fanning LAVs fit comfortably within each 65 m endpoint circle: craft corners reach 15.012 m and ramp tip about 16.079 m from the center before adding payload envelope. This is a decoration exclusion, not a verified collision system or authorization for arbitrary turning/cargo. The two endpoints are **1,151.564 m** apart, giving ample independent staging space; the nearest beach equipment cluster is far west at [3530,-2790]. No landing route should move existing BTR/T-72/support actors to gain room.

The 100 m rounded candidates leave the original centerlines by as much as **5.668 m west / 14.301 m east**, exceeding the four-meter additional craft margin. A conservative rounded-path exclusion would need at least **24.680/33.314 m** radius around the old centerline, including the same four-meter safety margin. Do not assume the original raw-polyline mask automatically protects a smoothed path. Approved new routes, terminal turns, ramp swing, barrel/wheel bounds, unloading fans and any apron-return arcs require full swept-envelope tests against actual cover, service equipment, defensive remnants and other actors. Preserve seeded identities outside any approved local adjustment; rerolling unrelated regions is not acceptable.

Water-side checks must include rotated corners, bow ramp in its raised configuration, spray/wake footprint and both craft at simultaneous times. Stage 4C deliberately suppresses foam along the old approach strips, wet-shore bands near their contacts, and wear inside current landing reservations. New staging/approaches need corresponding narrowly scoped visual-mask review. Keep the water sampler's absolute-time normals and mean level, existing wakes/pollution/render ordering, industrial damage and environmental regression values intact.

## Focused integration and endpoint contract

Stage 5B should introduce focused landing-craft state/types and absolute-time paths, not a generic vehicle/physics framework. State should separate holding/transit/shallow/beaching/ramp activity from physical condition and outcome, with signed travel, fan phase, skirt compression, ramp angle, settled pose and fixed cargo-local transforms. Reuse common path/ground sampling and shared LCAC geometry/materials; one prototype must serve both craft. LAV geometry can also be shared between eight instances. Own and dispose persistent resources, derive particle births/ages from authored time, and avoid per-frame resource creation or mount-history accumulation.

Stage 5C should add explicit eight-vehicle IDs, two group states, carrier attachment/transition, wheel travel and short authored beach-to-road paths. Keep all cargo visible before and during egress. Future camera/HUD additions should cover craft approaches and the two groups with concise phases/counts, preserving all existing camera IDs and paused spectator control. Do not add occupants, crew, figures or humanoid silhouettes; use dark sealed optics, machinery and vehicle motion only.

Adapter progression is **42 → 47** when Stage 5B adds the five departure/shallow/beach events, then **47 → 51** when Stage 5C adds two disembark events, inland spread and endpoint. Stage 5B need not extend the 176-second runtime. Stage 5C must admit `lav_inland_spread` at exactly 176, extend clamping/slider/local-time/event APIs to 180, and test `scripted_phase_complete` at exactly 180. Preserve older stage-specific clamping APIs and immutable fixtures through their old endpoint; project only explicitly additive state/events when comparing them. Add new baselines for completed Stage 4B.2C/4C/5A behavior rather than regenerating old hashes.

Stage 5A's additive preservation contract is concrete: `src/simulation/fixtures/stage4cPreservation.json` records the completed `6fb70b6` world at 815 timestamps before actor integration, all 40 old event records/weapons, Stage 4C seeded layouts and coastal samples. `stage5aPreservationProjection.ts` excludes only the added top-level `secondaryPantsir` state and the two new event IDs; it retains the support convoy and every old weapon. Future rounds must retain those values and capture Stage 5A's actor as another preserved baseline. The new Pantsir's terminal-only T+121 strike is a bounded visual presentation choice with authoritative `attacker_f35_01` attribution, not evidence that every longer preserved-flight-path solution is impossible.

Current `createSimulationStore` stops playback at `SIMULATION_DURATION_SECONDS`, and `clampSimulationTime` clamps derivations there. Stage 5A remains at 176; there is no active indefinite aftermath implementation. Stage 5C must define whether its delivery pauses at 180 with a truthful pending-aftermath status or includes a separately scoped continuous clock handoff. The authority's `enter_aftermath_observation` and “no global freeze” describe the eventual full-operation contract; claiming that behavior requires an actual independent runtime clock with scripted progress capped at 180 while ongoing machinery, smoke, fire, withdrawal and incomplete unloading continue. Indefinite Stage 6 aftermath requires its own deterministic extrapolation, seek/reset behavior and camera/resource acceptance. Do not implement it implicitly by removing every clamp or looping the scripted events.

## Next-round decisions and acceptance gates

Before Stage 5B implementation, record the approved choice among compression, nearer staging, or longer/pre-script transit. Resolve its authoritative staging/route/shallow meanings and coastal contact treatment; keep reference assets unchanged until that approval exists. Set the final craft stop headings, ramp geometry and payload wheel/barrel envelope, then verify the whole route using actual world geometry. Stage 5A actor completion is independent of this future decision.

Stage 5B acceptance:

1. Exactly two correctly owned/dimensioned LCACs, each with exactly four recognizable embarked LAV-25s; no extra losses or visible humans.
2. Approved distance/time profiles with measured peaks, acceleration/braking, turn rate, actual shallow thresholds and water/land corner clearance. Any cinematic compression is explicit.
3. Continuous grounded shore transition and correctly seated skirt/ramp at T+155/T+162; ramp readiness before unloading at 160/166, with no terrain penetration, duplicate craft or position jump.
4. Deck packing, barrel/wheel/side machinery/ramp-swing sweeps and carrier-local continuity tested against actual model bounds; narrowed local decoration changes documented without unrelated seeded-layout changes.
5. Exactly five added official events, total 47, 176-second scope; original paths, damage, source attribution, fixtures, Stage 4C samplers and Stage 5A lifecycle preserved.
6. Continuous 1× approach/beaching inspection, required boundary seeks, pause/orbit/pan/zoom, restart/backseek/all speeds, all cameras/short HUD, matched renderer statistics and repeated resource stability. Report only checks actually performed.

Stage 5C acceptance:

1. Exactly eight persistent vehicle identities, two four-vehicle groups, staggered departure and continuous deck/ramp/beach/road motion with all wheels grounded.
2. T+160/T+166 begin unloading; T+176 visibly begins two-route spread. Report which vehicles remain aboard/on ramps at T+180; do not force all to complete long inland paths.
3. Explicit connector orientation and apron-versus-direct-road joining choice, safe inter-vehicle separation and full turns/sweeps without generalized pathfinding.
4. All 51 IDs/times represented, T+180 `scripted_phase_complete`/`enter_aftermath_observation` retained, complete three-minute playback, and an honest Stage 5/6 endpoint handoff contract.
5. Full automated and actual browser regression/resource verification, with old immutable values preserved and any endpoint-specific new behavior documented separately.

The report contains candidate calculations and acceptance criteria, not deployed LCAC/LAV actors or completed Stage 5B/5C verification.

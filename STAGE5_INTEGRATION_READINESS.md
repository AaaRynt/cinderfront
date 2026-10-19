# Stage 5 Amphibious Integration Readiness

Stages 5A, 5B and 5C are COMPLETE; parent Stage 5 is COMPLETE for the finite T+0–180 scripted operation. The viewer has 51 official events, two operational LCACs, eight operational LAV-25s and 24 cameras. Stage 6 is IN PROGRESS: Stage 6A landscape is complete; Stage 6B indefinite aftermath and Stage 6C remaining presentation/performance integration remain planned. The measured current delivery is recorded first; original Stage 5A feasibility estimates and dated Stage 5B completion data remain as historical records.

**The human approved nearer staging, revised final approaches and local shore grading on 2026-10-09, retaining the key event times.** Rounding the original routes does not resolve their speed conflict. The approved package is now implemented and measured below. Stage 5B reference edits were limited to its recorded staging/approach/nearshore meanings, local contact grades and associated reservations/masks. Stage 5C adds the direct-join clarification recorded separately below; unrelated authoritative content remains exact.

## Completed Stage 5C — 2026-10-17

Stage 5C and parent Stage 5 are **COMPLETE for scripted operation through T+180**. Stage 6 remains **PLANNED**. Exactly two LCACs and the original eight LAV-25s remain operational, with 51 unique official event records and 24 spectator presets. Playback pauses at exactly 180 and the interface says **“Script complete · aftermath pending Stage 6”**. Backward seeking and free spectator controls remain available.

### Deployment, attachment and measured timings

The existing slot order and [0,3,6,9] s offsets are unchanged: west starts at 160/163/166/169 and east at 166/169/172/175. Both fully ready ramps gate departure. The immutable `carrierId` is the origin manifest; `attachedToCarrierId` describes current deck support. Every vehicle has one persistent world-space render root throughout unloading. Counts are mutually exclusive: aboard means all tires are deck-supported, transferring covers ramp/mixed support and a remaining rear overhang, and ashore requires full-envelope clearance. Each group sums to four, and both groups sum to eight. Aggregate support explicitly distinguishes deck, pure ramp, mixed contacts and ground.

| Persistent ID     | Depart T+ | First road tire T+¹ | Full ramp clear / full road entry T+ | At 176      | At 180      |
| ----------------- | --------: | ------------------: | -----------------------------------: | ----------- | ----------- |
| `attacker_lav_01` |       160 |             166.075 |                              168.591 | inland      | inland      |
| `attacker_lav_02` |       163 |             169.075 |                              171.591 | inland      | inland      |
| `attacker_lav_03` |       166 |             176.075 |                              178.591 | ramp        | inland      |
| `attacker_lav_04` |       169 |             179.075 |                              pending | deck        | ramp/ground |
| `attacker_lav_05` |       166 |             172.050 |                              174.558 | inland      | inland      |
| `attacker_lav_06` |       169 |             175.050 |                              177.558 | ramp/ground | inland      |
| `attacker_lav_07` |       172 |             pending |                              pending | deck        | ramp        |
| `attacker_lav_08` |       175 |             pending |                              pending | deck        | deck        |

¹ First/last tire contact samples use a 25 ms grid; full-envelope clearance stations are solved by bisection. A vehicle is ashore only when all eight tires are ground-supported and the complete conservative hull/wheel/cannon envelope is beyond the panel toe. Full road entry uses that same criterion; first tire road contact is shown separately. Pending means it has not occurred by the finite endpoint.

At 176 the totals are **3 aboard / 2 transferring / 3 ashore**. At 180 they are **1 aboard / 2 transferring / 5 ashore**: west has three ashore and vehicle 04 spanning ramp/ground; east has 05/06 ashore, 07 spanning deck/ramp and 08 still deck-supported. All eight remain visible operational actors. Mathematical continuation estimates for 04/07/08 are 181.591/184.558/187.558 s at the authored ramp pace; these are future schedule estimates, not observed post-180 runtime. At 180 the lead vehicles have traveled only 62.024 m west / 35.104 m east from their cargo slots, far short of completing the inland roads.

### Kinematic support and clearances

Tires use the actual settled carrier YXZ transform, 1.20 m deck top, -10.08 m hinge, 6 × 8.2 × 0.12 m panel top, 12 mm traction strips and uploaded graded mainland/road support. Finite 0.49 m circles/cylinders roll over the real deck overhang and toe. Ground strips sample the unchanged triangle support at 0.2 m; a spatially filtered all-axle chassis fit uses bounded independent suspension, with unfiltered finite-edge tire support. Full quaternion composition is used throughout. Wheel travel integrates the supporting profile, independently of carrier travel; wheel rotation is about the actual axle. The scripted road starts are straight, so front steering remains stowed at zero in this short interval.

Measured vehicle speed peaks at **4.512057 m/s**, with **2.064587 m/s** maximum while transferring and **1.499844 m/s²** peak world-vector acceleration. The authored profile smoothly reaches 2 m/s over two seconds, keeps that ramp pace through full clearance, then waits 0.3 s and eases to 4.5 m/s over three seconds. Heading rate stays below **0.214°/s**; pitch/roll rates peak at 8.073°/s and 0.718°/s. Maximum suspension travel is **0.161119 m** within a ±0.27 m bound. A separate 1 ms boundary sweep measures at most 2.639078 m/s wheel-center speed, 2.061831 m/s chassis speed and 0.004497 rad wheel-angle change per sample through contact kinks. The endpoint pauses the clock with movement still authored; it is not a vehicle braking maneuver.

Actual rendered tire meshes penetrate sampled support by at most **0.988 mm**. Their maximum geometric distance from ideal circular contact is **6.133 mm**, including the 20-sided tire faceting. Panel contact-location error is at most **0.175 mm**, and ground contact-location error is at most **1.505 mm** against the uploaded triangles. Dense belly-face and hull checks retain **0.427556 m** minimum clearance; the complete cannon retains **1.969899 m**. Actual tire edges retain **0.831286 m** to ramp sides. Conservative full-model boxes retain **1.055 m** same-lane separation, **0.581820 m** column clearance and **1.662416 m** road shoulder clearance. A 5.2 m sphere enclosing the full rotated model and suspension sweep retains 172.741 m / 740.511 m margins to cover / service equipment. No environmental exclusion or geometry change was needed.

Each LAV has eight bounded dust slots, a 0.18 s birth interval and 1.35 s lifetime. Births use actual ground-contacting tire origins and the existing land mask; deck-only motion emits none. Tire phases, poses, suspension, dust, fans and water reconstruct from absolute time. Shared geometry/materials are owned once and disposed once; static world layouts acquire no timeline subscription.

### Direct joins and preserved history

Both lanes continue from the settled ramps onto the initial 10 m roads: west `road_beach_exit`, [4300,-2920] → [4250,-2700], and east `road_beach_access_east`, [5450,-2860] → [5550,-2680]. The road origins remain under the craft; vehicles enter at the forward ramp station. No immediate centerline merge or apron detour is authored.

Only the two LAV path blocks and landing narrative chapters 18/23/28 are clarified. Original optional apron-to-beach service connectors retain every coordinate and their direction/purpose is explicit. Both path IDs and all four event records remain unchanged. This is the specified Stage 5C reference clarification; the approved 2026-10-09 map/contact solution remains intact.

The immutable pre-edit `stage5bPreservation.json` captures 1,554 timestamps, complete landing snapshots/hashes, all 47 old events, old actors/weapons, support samples, geometry attributes and environmental layouts from commit `2a3fffc`. LCACs are compared in full throughout; every old payload field is compared before its own departure, with immutable identity/faction/model/manifest/condition fields protected afterward. Older projections omit only additive state/events and never forge old LAV poses. Original fixtures and all old terrain/road/coast geometry, cover/equipment/wear and the established 37-record foam layout retain exact bytes or values.

Fresh validation found that the existing Stage 5A capture's literal checksum assertion disagreed with its committed Stage 5B bytes. The fixture itself matches `2a3fffc` exactly. Its test now compares exact bytes to that fixed Git blob; no fixture or captured world/environment hash was rewritten. Reference tests normalize only the specified path blocks/landing chapters back to their captured text and retain whole-file coverage, with positive direct-join assertions.

`SCRIPTED_DURATION_SECONDS = 180` controls active store/clamp/seek/quantization/slider/keyboard/labels. Historical 48/172/176 constants and frozen Stage 1 APIs remain intact. Wasp uses a valid terminal tangent at 180; old poses through 176 stay exact. Existing F-35/Molniya continuation, support withdrawal, losses, fire/smoke, water and machinery remain finite and coherent through the final four seconds. No attack is replayed or departed aircraft resurrected.

### Fresh verification and renderer evidence

Both TypeScript no-emit checks, lint with the same 19 existing warnings, **421 tests across 37 files** at `--maxWorkers=2`, and `git diff --check` pass. Original timeout limits remain. The final default suite also passes with the ignored review directory temporarily absent; optional measurement export is enabled only by `CINDERFRONT_STAGE5C_MEASUREMENTS=1`. Tests/browser work run separately under idle-sleep inhibition. Only touched code was formatted. No build, dependency/version change or framework upgrade ran; the user's prompt and unrelated edits remain preserved.

Actual Chrome review covers both complete unloading intervals at 1×, close low-angle hinge/toe motion, every departure, ready/contact boundaries, 175.9/176/176.1 and 179.9/180, backward/repeated seeks/restart, all speeds and endpoint overshoot, paused orbit/pan/zoom, actual tire/dust/fan/GPU-water freeze, all 24 presets and 1280×720 / 1280×540 HUDs. One uninterrupted 1× T+0–180 run records 706 samples and 184.47 s wall time including development stalls/recording overhead. Older fuel, bridge, T-72, aircraft, naval and Pantsir replays were reviewed. Twenty-five paused seek checks find exact rendered root positions and at most 1.02×10⁻¹² m wheel-center error. The final console has zero JavaScript errors and only the existing Three.js Clock warning.

| Matched camera / T+  | Calls before → after | Triangles before → after | Geometries before → after | Programs before → after |
| -------------------- | -------------------: | -----------------------: | ------------------------: | ----------------------: |
| Beach inland / 0     |        1,639 → 1,639 |        601,156 → 601,156 |               1062 → 1062 |                 30 → 30 |
| Beach offshore / 0   |        2,174 → 2,174 |        725,680 → 725,680 |               1073 → 1073 |                 30 → 30 |
| Pantsir 02 / 125     |        1,339 → 1,339 |        613,715 → 613,715 |                 978 → 978 |                 54 → 54 |
| Fuel storage / 132.4 |        1,912 → 1,912 |        715,865 → 715,865 |                 978 → 978 |                 54 → 54 |
| LCAC 01 / 159.9      |        1,441 → 1,441 |        596,186 → 596,186 |                 978 → 978 |                 55 → 55 |
| LCAC 02 / 165.9      |        1,455 → 1,455 |        629,086 → 629,086 |                 969 → 969 |                 55 → 55 |
| LCAC 02 / 176        |        1,400 → 1,401 |        622,062 → 628,462 |                 969 → 970 |                 55 → 55 |

Measurements use Chrome / ANGLE Metal Apple M4, 1280×720, DPR 1, the same view order and 90 RAF observations per paused view. All views retain three textures. At LCAC 02/T176 the 64-slot dust pool adds one draw, 6,400 submitted triangles and one uploaded geometry; earlier matched views retain their counts. The busy fuel view at 132.4 is unchanged. After-only late fuel views at 176/179.9 both show 1,857 calls, 710,873 triangles, 1,016 geometries, three textures and 196 warmed programs. These late figures have a different shader/upload history from the matched table.

Across six seek/restart/all-camera cycles, five after warm-up remain flat at **1,092 geometries at T0 / 963 at T180**, **3 textures / 195 programs**, with identical ten actor roots and all **12 landing geometry / 14 material identities**. Different active transients explain the two timestamp counts. Similar display-capped ~16.7 ms RAF cadence does not establish a GPU improvement. Local captures, chronological video sheets, recordings, logs and raw measurements are in `stage5c-review.local/README.md`.

Stage 6B owns indefinite world motion, continuing the three late unloads and longer road routes, and aftermath clock/seek semantics. Stage 6A first refines the ground landscape; Stage 6C handles remaining presentation/performance integration. The source's eventual no-freeze aftermath requirement is unchanged. Local support tables span carrier-forward stations -12…90 m; Stage 6B must extend route/support coverage before admitting longer travel. This delivery is a bounded kinematic presentation with finite sampling tolerances and procedural models; it adds no visible humans, new combat, general AI or rigid-body simulation.

### Next-stage pointer — Stage 6B, updated 2026-10-19

Stage 6A is COMPLETE: rooted grass/scrub, fitted fractured/embedded rocks, 32 sparse dryland trees and visual surface breakup, verified with 440 tests and matched browser review. Parent Stage 6 is IN PROGRESS; 6B/6C remain PLANNED. The completed Stage 5 actor/contact measurements and finite 51-event/T+180 behavior above remain exact. Landscape variants, full 0–180/road reservations, counts, clearances, render costs and evidence are recorded in `ITERATION_PLAN.md`, `changelog.md` and ignored `stage6a-review.local/README.md`.

Stage 6B owns indefinite aftermath, continuing the three late unloads and longer road routes, and clock/seek semantics. Extend the existing -12…90 m carrier-forward support coverage before admitting longer travel. Stage 6C owns remaining camera/presentation/performance integration. This pointer does not claim post-180 motion or alter the completed Stage 5 measurements.

## Approved Stage 5B decision — 2026-10-09

The human selected: nearer offshore staging, revised terminal routes and local shoreline slopes, preserving the key event times. This supersedes the pending choice among cinematic compression, nearer staging and longer transit. Do not request that same decision again.

The Stage 5B implementation prompt, preserved in commit `2a3fffc`, defined the authorized package below. The Stage 5C prompt is preserved in `b49db45`; the current `prompt.md` targets Stage 6A.

- replace the LCAC staging descriptions/feature references and approach paths with nearshore holding positions in `region_e_remote_beachhead`;
- preserve departure at T+110, final-nearshore gates at T+140/T+148 and beaching at T+155/T+162, along with all official event IDs and other timestamps;
- explicitly interpret the two existing shallow-event IDs as final-nearshore approach gates, using the now-implemented `enter_final_nearshore_approach` code and synchronized authoritative narrative/adapter wording; actual broad shallow-polygon occupancy remains an independently sampled geometric fact;
- keep beach centers [4300,-2920] and [5450,-2860], sea level, broad water polygons, vehicle dimensions, existing actors and unrelated map/scenario data unchanged;
- grade only the two landing contact footprints, using one consistent rendered/contact surface with continuous approach, skirt seating and ramp contact; review only the associated local reservations and visual masks.

The Stage 5B prompt supplied seed holding positions [4250,-3720] and [5380,-3740], with raw final-route lengths of approximately 806.210 m and 893.642 m. These seed lengths are retained as the approved authoring input; the actual smoothed routes and measured envelopes are recorded in the completion section below. Local grading preserves the original terrain and environmental values outside explicitly bounded landing footprints.

Stage 5B completed two LCACs, eight persistent embarked LAV-25 identities and five events (42 → 47) at its original T+176 endpoint. Stage 5C subsequently completed unloading motion, the four final events and T+180 integration as recorded above. Earlier Stage 5A audit calculations remain historical inputs.

## Completed Stage 5B — 2026-10-14

At the Stage 5B delivery, that round was COMPLETE while parent Stage 5 was IN PROGRESS and Stage 5C/6 were PLANNED. Its recorded 47-event viewer stopped at T+176 with all eight LAV-25s embarked. These are the historical Stage 5B results; current Stage 5C deployment is recorded above.

### Roster, geometry and attachments

`attacker_lcac_01` carries `attacker_lav_group_01` / `attacker_lav_01`–`attacker_lav_04`; `attacker_lcac_02` carries `attacker_lav_group_02` / `attacker_lav_05`–`attacker_lav_08`. All ten actors belong to `landings_attacker`, remain operational and have no authored loss. Each payload exists once, with carrier/group IDs, carrier-local pose, composed world pose, and zero relative wheel travel, wheel rotation and dust.

The shared LCAC model measures 26.4 × 14.3 × 7.2 m with its closed ramp on cushion; its settled closed height is 6.65 m. It has a broad low platform, flexible rounded skirt, 20.4 × 8.2 m cargo deck, sealed forward starboard cabin, side machinery, two separate ducted stern fans, rudders/lights and a narrower closed stern ramp. The low bow platform remains beneath the complete ramp swing. The shared LAV-25 has an actual 6.39 × 2.50 m sloped hull anchor and 2.69 m overall height, eight wheels, compact turret, centered thin cannon, closed hatches and opaque optics. No visible humans or occupants are modeled.

Payload centers remain X ±1.8 / Z ±4.0, facing carrier-local negative Z. Actual wheels/hubs occupy 2.942 m width; the barrel extends 0.555 m beyond the hull. Measured side-deck clearance is 0.829 m, column clearance 0.658 m, row/barrel clearance 1.055 m and bow-hinge clearance at least 2.303 m. Cargo stays clear of the full ramp swing, cabin, side machinery, fans and stern ramp. Deck height compresses from 1.75 to 1.20 m; payload local Y follows that same rendered deck top, preserving its deck-relative transform. World pose is the full carrier YXZ transform multiplied by the local attachment. `landingCraftData.ts`, `landingCraftContact.ts` and the shared model resources expose these attachments/hinge dimensions for Stage 5C.

### Approved reference package and measured movement

Implemented the human's 2026-10-09 decision: nearer offshore holding, revised approaches and two local contact grades, retaining all key event times. The two initial-location blocks now reference region E and separate holding features; their inaccurate Wasp-relative staging fields were removed. Wasp's theater, pose and path remain unchanged. Updated only the two LCAC path blocks, two nearshore event codes, Chapter 18 approach narrative and six additive map/SVG features. Normalized source comparisons reproduce every unrelated original byte, including the four future event records.

Final authored knots (world XZ meters):

- west: `[[4250,-3720],[4260,-3530],[4290,-3330],[4300,-3160],[4320,-3050],[4311.0810828,-2968.7567643],[4300,-2920]]`;
- east: `[[5380,-3740],[5370,-3540],[5360,-3300],[5390,-3120],[5400,-2990],[5420.861424,-2912.4494368],[5450,-2860]]`.

Only the penultimate seed knots were refined to align the terminal road tangent. Cubic Hermite geometry is evaluated at inverted arc length, with smooth absolute-time velocity profiles; dense chords serve reservations without substituting corner-snapping translation. West approach braking reduces speed before first land contact; its final braking uses short continuous jerk ramps around a constant braking segment to fit the unchanged distance/time contract.

| Measurement                                    |            West / LCAC 01 |            East / LCAC 02 |
| ---------------------------------------------- | ------------------------: | ------------------------: |
| Holding                                        |              [4250,-3720] |              [5380,-3740] |
| Gate / time                                    |        [4300,-3160] / 140 |        [5400,-2990] / 148 |
| Stop / time                                    |        [4300,-2920] / 155 |        [5450,-2860] / 162 |
| Smoothed length                                |              806.846092 m |              894.437811 m |
| Distance before / after gate                   | 562.901236 / 243.944856 m | 753.674910 / 140.762900 m |
| Peak speed                                     |             26.468486 m/s |             24.540514 m/s |
| Gate / first-contact speed                     |                    20 m/s |                    14 m/s |
| Peak longitudinal acceleration/braking         |             3.995593 m/s² |             3.067564 m/s² |
| Peak planar world-velocity acceleration        |             3.995593 m/s² |             3.067565 m/s² |
| Peak turn rate                                 |               8.270838°/s |               6.938238°/s |
| First / full skirt land contact, 25 ms samples |         142.375 / 143.925 |         152.350 / 154.925 |
| Terminal direction                             |     12.804° west of north |     29.055° east of north |

Both hold without travel until 110. Their broad water-region classification is geometric: west initially lies in broad shallows, east initially in open water and is already in broad shallows at 130; both gates lie in intertidal water. `lcac_01_shallow_water` and `lcac_02_shallow_water` retain their IDs/times but now use `enter_final_nearshore_approach`, rather than claiming first shallow-polygon entry. Five scoped adapters preserve `lcac_departure` at 110, both gates and both beach events, including the departure's two `pathIds`.

### Contact, ramp and precisely scoped environmental changes

West grade bounds are X [4230,4390], Z [-3130,-2850]; east bounds are X [5350,5540], Z [-2970,-2790]. Local refinement is 2 m, with 25 m edge feathering and 90/70 m coastline rise distances. Coastline XZ, mean sea level -0.12 m, broad water polygons, original global grid axes and exterior terrain values remain unchanged. Mainland triangles are clipped/refined only within these rectangles; every fully exterior original triangle retains its exact position/normal/color attributes. The measured 164,664 → 202,032 triangle change preserves projected area within 0.001 m²; 164,323 original fully exterior triangles remain exact. Coast-skirt changes follow the actual local uploaded shore vertices and preserve unrelated natural/harbor faces.

Craft grounding samples the actual uploaded Float32 triangle surfaces and both graded road starts, fitting the entire rotated lower skirt plus interior support points. Local road clearance eases from zero at the beach center to the existing 0.48 m over 20 m. The support sampler also covers the unchanged portions of both landing roads and the original apron for future reuse. Wet sand is refined against the same surface at its original 0.018 m clearance; original exterior vertices/attributes remain exact. Rotated land-contact samples retain at least 30.65 m to the grade boundary, including the 25 m feather. Transit cushion gap is 0.20 m and settled lower-skirt clearance is at least 0.020 m; actual skirt/platform geometry and ramp underside stations are tested throughout contact. Largest vertical step in 25 ms samples is 0.03815 m west / 0.01736 m east.

The bow panel is 6 × 8.2 × 0.12 m, hinged at Z -10.08. This 0.12 m hinge refinement retains the closed 26.4 m reference envelope while clearing the generated skirt/platform. Lowering starts at exactly 155/162, completes at 158.8/165.2 and stays continuous through settling. Final hinge angles are -10.150635° / -13.093411°, with world lane slopes about 9.523° / 9.062°. Deployed local overall lengths are 29.186087 / 29.124012 m. The underside tip has a tested 3 mm contact allowance, with maximum gap across its width 5.594 mm west / 22.010 mm east. It does not penetrate or hang visibly above the beach; all payload remains aboard.

All 3,574 regional cover instances, every service-equipment matrix and all 404 wear records retain exact values/IDs. Historical raw-route masks remain the seeded-layout inputs; approved smoothed-route/grade reservations are applied afterward. One foam record, phase `5.073432454677445` near [4325.85,-3103.80], is removed because it overlaps the approved west cushion corridor: 38 → 37, with every survivor exact. Terrain sample differences are enumerated in the local artifact; captured land samples change by at most 4.608806 m. The historical bare-terrain field also had offshore values; only the new contact sampler classifies those local offshore samples at sea level. No unrelated actor, dune, infrastructure, broad terrain band or seeded region is moved.

### Absolute time, preservation and verification

Activity, condition/outcome, motion, water classification, contact, fan power/rotation, skirt/deck compression, hinge progress, navigation lights, attachments and particles derive from absolute simulation time. Two fixed 48-slot pools reconstruct births/ages within 3.2 s lifetimes, separating broad water churn/spray from sand effects using the unchanged coast vertices shared with the fragment mask. Seeking before departure removes every future effect. A bounded birth-sample cache and two settled-angle cache entries hold computed values; they do not accumulate trails or determine animation phase. Static world layouts remain outside the timeline subscription.

The immutable pre-edit `stage5aPreservation.json` captures all 42 prior event records, complete old actor/weapon state including Pantsir 02 and support convoy, coastal samples and environmental/contact data at 827 timestamps. `stage5bPreservationProjection.ts` removes only `landing` and the five added events; the older projection composes that operation before removing Stage 5A's additions. Existing fixtures remain byte-identical. The pre-existing Stage 5A checksum failure was a formatting mismatch in its Stage 4C fixture: the test now protects both the committed bytes and the original historical re-encoding hash, without editing or regenerating the fixture.

Both no-emit TypeScript checks, lint with the same 19 existing warnings, all 393 tests across 32 files with `--maxWorkers=2`, and whitespace checks pass. Earlier verification runs hit timeouts; binary exterior-attribute comparisons and separate fine/coarse contact indices retain the full assertions, and the final full run passed under `caffeinate -i` with the original timeout limits. No build, dependency/version change, framework upgrade or repository-wide formatting ran.

Added only `lcac-west` / `lcac-east` follow presets, retaining the original 20 (22 total), Stage 5B labeling, five event readouts and explicit two-craft/eight-embarked status using Tailwind DOM utilities. Actual browser verification includes complete 1× departure-to-ready runs (west 110–159.9, east 110–165.9), chronological frame review, first-corner/full-contact and ramp boundaries, 172/174/176, backward/repeated seeks, restart, all speeds, keyboard timeline/play controls, 1280×720 and 1280×540 layouts and all presets. Fans, ramps, cargo, particle buffers and actual GPU water-time freeze while paused; orbit/pan/zoom remain free. Representative fuel, bridge, T-72, aircraft, naval and Pantsir sequences are replayed. Six cycles retain one copy of each craft/payload and identical new geometry/material/actor identities; five warmed cycles keep geometry/texture/program counts flat. There are no JavaScript errors; the existing Three.js Clock deprecation warning remains. Evidence and renderer/resource measurements are in ignored `stage5b-review.local/README.md`.

### Matched renderer measurements

Chrome / ANGLE Metal Apple M4, 1280×720, DPR 1, same four presets/times and sampling order. Ninety RAF observations per paused view discard the first five intervals. Textures remain 3 in every view. These include main/shadow submissions; program and geometry counts also reflect lazy uploads and shader warm-up.

| Camera / T+          |         Calls | Submitted triangles | Uploaded geometries | Programs |   RAF mean ms |  RAF P95 ms |
| -------------------- | ------------: | ------------------: | ------------------: | -------: | ------------: | ----------: |
| Beach inland / 0     | 1,151 → 1,639 |   497,847 → 601,156 |         1053 → 1062 |  29 → 30 | 16.70 → 16.66 | 17.9 → 17.8 |
| Beach offshore / 0   | 2,084 → 2,174 |   637,755 → 725,680 |         1064 → 1073 |  29 → 30 | 16.68 → 16.70 | 18.5 → 19.1 |
| Pantsir 02 / 125     | 1,247 → 1,339 |   516,894 → 613,715 |           967 → 978 |  52 → 54 | 16.68 → 16.67 | 17.6 → 17.8 |
| Fuel storage / 132.4 | 1,820 → 1,912 |   623,013 → 715,865 |           967 → 978 |  52 → 54 | 16.69 → 16.66 | 18.7 → 18.6 |

Visible landing models increase the beach-inland view by 488 calls / 103,309 triangles. The other three views add 90–92 calls and 87,925–96,821 triangles, including global shadow and local terrain refinement work. This is a measurable rendering cost; similar display-capped RAF cadence does not establish a GPU speed improvement. Across six broader camera/seek/restart cycles, five after warm-up hold 1,087 geometries at T0 / 958 at T176, three textures and 89 programs, with identical ten actor IDs and all 11 new shared geometry / 13 material identities. Different active effects and upload histories explain why these warmed counts are separate from the matched four-view table.

This remains an authored hovercraft presentation envelope with faceted procedural models and planar water contact, rather than a fluid/buoyancy/rigid-body simulation. Renderer counts include submitted main/shadow work; RAF cadence is display-capped development evidence, not GPU timing or a cross-device guarantee. Stage 5B deferred continuous carrier/ramp/ground transfer, independent LAV wheel travel/dust, both inland routes and the four final events to Stage 5C; those items and full-operation verification are now complete above. Stage 6 still owns indefinite aftermath.

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

All event IDs and official timestamps remain unchanged in the adapter. Existing arrays contain 12 Stage 1, 15 Stage 3, five Stage 4B, four Stage 4B.2B and four Stage 4B.2C events: 40 total. Stage 5A contributes two Pantsir events and Stage 5B five LCAC events: **47 implemented at the Stage 5B delivery**. Stage 5C adds the four final records at 160/166/176/180, bringing current coverage to **51 implemented, zero outstanding**; 176 is now in range and 180 is the finite endpoint.

| T+ seconds | Official event ID                       | Coverage after Stage 5C  |
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
|        110 | `lcac_departure`                        | Implemented: Stage 5B    |
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
|        140 | `lcac_01_shallow_water`                 | Implemented: Stage 5B    |
|        142 | `su30_02_cover_withdrawal`              | Implemented: Stage 4B.2B |
|        148 | `lcac_02_shallow_water`                 | Implemented: Stage 5B    |
|        150 | `defender_armored_reinforcement_move`   | Implemented: Stage 4B    |
|        155 | `lcac_01_beach`                         | Implemented: Stage 5B    |
|        158 | `t72_lead_destroyed`                    | Implemented: Stage 4B    |
|        160 | `lav_group_01_disembark`                | Implemented: Stage 5C    |
|        162 | `lcac_02_beach`                         | Implemented: Stage 5B    |
|        163 | `t72_survivors_withdraw`                | Implemented: Stage 4B    |
|        165 | `talwar_severe_list`                    | Implemented: Stage 3     |
|        166 | `lav_group_02_disembark`                | Implemented: Stage 5C    |
|        170 | `aircraft_egress`                       | Implemented: Stage 4B.2B |
|        172 | `molniya_open_water`                    | Implemented: Stage 3     |
|        174 | `rescue_convoy_abandon_approach`        | Implemented: Stage 4B.2C |
|        176 | `lav_inland_spread`                     | Implemented: Stage 5C    |
|        180 | `scripted_phase_complete`               | Implemented: Stage 5C    |

The adapter renames `at_s` → `atSeconds`, `local_time` → `localTime`, `path_id` → `pathId`, `effect_profile` → `effectProfile`, and `resulting_state` → `resultingState`. Source `entity` becomes `actorId` or the actor family's `groupId`; plural `entities` stays `entities`. Source target entity/map feature/map region becomes `targetId`, except support route damage uses `targetFeatureId`. Source attribution is `actorId` for the older strike records, with the damaged source `entity` represented by `targetId`; the T-72 strike instead uses explicit `sourceActorId` and a concrete lead-vehicle `targetId`. Stage 5A uses `actorId: defender_pantsir_02` for the affected vehicle and `sourceAircraftId: attacker_f35_01` for its destruction source. These are adapter conventions, not new official events.

`btr_01_disabled` narrows the source group event to `actorId: defender_btr_01` while retaining `groupId` and the official group target. `t72_lead_destroyed` retains its official group but resolves the destroyed lead to `defender_t72_01`. Support events retain `groupId: defender_support_convoy_01`; their authored phase/result is also derived in convoy state. The bridge explosion and Su-30 damage still have no invented source attribution.

Four existing support event codes differ in wording from the authority; their IDs/times and intended behavior are preserved:

| ID                               | Official code                                        | Current adapter code                                      |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `rescue_convoy_redirect`         | `redirect_toward_industrial_district`                | `redirect_toward_industrial_emergency`                    |
| `rescue_convoy_chokepoint`       | `encounter_reduced_visibility_and_route_obstruction` | `staggered_visibility_hesitation`                         |
| `rescue_route_secondary_hit`     | `roadside_secondary_explosion_blocks_route`          | `unattributed_secondary_explosion_blocks_bridge_approach` |
| `rescue_convoy_abandon_approach` | `stop_advance_and_begin_partial_withdrawal`          | `abandon_approach_and_begin_partial_withdrawal`           |

Plural `path_ids` now uses the focused `pathIds` adapter. Keep the official T+180 ID **`scripted_phase_complete`** and code **`enter_aftermath_observation`** exactly; it is not an actor-destruction or global-freeze event.

## Historical Stage 5A LCAC distance, timing and coastal-contact audit

The following raw-route/vertical-wall estimates describe the pre-approval Stage 5A source. The completed Stage 5B routes, grades and measured contact behavior above supersede those inputs.

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

Sea is the unchanged -0.12 m plane. Rendered terrain at first contact is 4.633/4.447 m; final centers are 4.492/4.268 m. `createCoastSkirtGeometry` fills the coast vertically down to -3 m. Thus the beach at that audit had a roughly 4.6–4.8 m vertical water/land edge. Normal-only Stage 4C waves provide no physical slope, buoyancy or shore ramp. A craft cannot retain a sea-level skirt and pass through that wall or silently jump to the land sampler. A narrowly scoped approved contact-grade correction, or an explicitly documented nonphysical visual contact bridge, is required before claiming a grounded landing. Preserve existing land elevation/road behavior outside the landing contact footprint.

The LCAC starting waypoints coincide with map reference anchors for a distant support hull (west, 220 m occupancy radius) and northern escort hull (east, 240 m radius). These reference hulls are not current runtime actors, so there is no existing rendered ship collision. They cannot all occupy those positions in a later expanded roster. Audit-time Wasp-to-original-staging-center distances at T+110 are about 799.936/1,249.947 m, clear of the actual Wasp hull; no Wasp movement is needed.

### Alternatives and recommendation

1. **Explicit cinematic compression:** Keep all reference routes and event times, author event-constrained distance profiles, and acknowledge speeds above 190 m/s. The west shallow event additionally requires the 242/92 m/s phase means above. This is the smallest data change, but it gives aircraft-like motion, huge implied wake speeds and very brief shoreline crossings. It still needs a contact solution and correct full sweeps. It must be labeled nonphysical, not hidden by teleporting, coordinate scaling, off-map disappearance or a false speed cap.
2. **Nearer staging and revised final approaches — recommended:** Retain T+110 departure, T+155/T+162 stops, T+160/T+166 unloading and T+176/T+180 narrative beats, but update initial staging references and LCAC approach geometry explicitly. Illustrative direct approaches from [4200, -4000] via [4300, -3100] to the current west stop, and [5400, -4000] via [5450, -2909.167] to the east stop, are 1,085.539/1,141.145 m: means 24.123/21.945 m/s before acceleration/braking. These are scale estimates, not approved paths. They require terminal heading curves, a shore-contact solution and full-clearance remeasurement. They are no longer staging near Wasp and must not retain that incorrect initial-location contract.
3. **Revised departure/transit timing:** Keep the long geometry and use a chosen presentation cruise speed, then revise departure/arrival/shallow times together. At a 25 m/s illustrative ceiling, distance alone needs at least 345.341/386.300 s. T+110 departure implies earliest beaching about T+455/T+496, before acceleration/braking. Keeping T+155/T+162 arrival instead would require departure before T+0 (about -190/-224). This changes the three-minute sequence or requires a documented pre-script transit whose onscreen state at T+0 is already far along the route. Moving departure alone does not repair the remaining west shallow-to-stop distance in 15 s.

**Authoritative decision required by the original audit, now resolved above:** A nearer direct approach crosses the existing broad shallow polygon well before T+140/T+148. The approved package preserves those times and explicitly redefines them as final-nearshore approach gates, rather than changing broad water polygons. Do not pretend the original literal `enter_shallow_water_approach` definition is unchanged. Synchronize staging, path points, event semantics, beach-contact treatment and terminal headings as one package. Retain the future T+180 endpoint ID/code. No such rewrite was authorized or applied during Stage 5A; the subsequent human approval permits the scoped Stage 5B revision, which was implemented and verified in Stage 5B.

## Historical Stage 5A cargo, ramp and unloading feasibility

These were candidate feasibility calculations. Final Stage 5B packing/ramp measurements and Stage 5C contact/clearance measurements are recorded in their completion sections above.

### Roster and deck packing

The exact authoritative roster is `attacker_lcac_01` carrying `attacker_lav_group_01` (four LAV-25s) and `attacker_lcac_02` carrying `attacker_lav_group_02` (four). That is two craft and eight ground vehicles, with no planned landing losses. The source defines group IDs/counts, not eight individual IDs. Stage 5B assigned persistent runtime IDs `attacker_lav_01`–`attacker_lav_04` to group 01 and `attacker_lav_05`–`attacker_lav_08` to group 02, reused during the completed Stage 5C unloading.

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

Both actual inland roads begin exactly at the LCAC beaching centers. `road_beach_exit` runs [4300,-2920] toward [4250,-2700] and has length **874.827 m**. `road_beach_access_east` runs [5450,-2860] toward [5550,-2680], length **1,001.774 m**. Both are 10 m wide. The first segments head **12.804° west of north / 29.055° east of north**. The original pre-Stage-5B raw LCAC approaches differed from those directions by **81.003°/16.589°**. Stage 5B resolved that mismatch with continuous terminal tangents aligned to the roads; preserve the completed headings during unloading.

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

## Completed integration and endpoint contract

Focused landing types separate activity from physical condition and outcome. Stage 5B established the two craft and eight persistent payload IDs; Stage 5C reuses them for deterministic deployment, support, signed wheel motion and bounded dust. One shared model resource owner serves the craft/payloads, with explicit particle-pool ownership and disposal. Static world layouts stay outside timeline subscriptions.

Adapter progression is 42 → 47 → **51**. `SCRIPTED_DURATION_SECONDS` admits T+176 inland spread and T+180 `scripted_phase_complete` / `enter_aftermath_observation`. The finite store pauses and seeks clamp at 180. Historical constants and frozen APIs remain intact. The interface explicitly marks aftermath as pending Stage 6, while paused spectator movement and backseek remain available.

All older preservation fixtures remain unchanged. The Stage 5C baseline protects complete LCAC state and each pre-departure payload alongside older actors/weapons; it does not omit the landing object. Geometry/support/environment hashes retain the completed Stage 5B solution. Only additive events/deployment fields, post-departure LAV mechanics, the specified source clarification and the new final interval are admitted.

The authoritative eventual no-freeze aftermath contract remains unchanged. Stage 6 must provide continued world motion and longer routes, with deliberate runtime/scripted-progress clock and seek/reset semantics; removing clamps alone is insufficient.

## Stage 5C decisions and retained acceptance gates

### Historical Stage 5C implementation contract — 2026-10-15

On 2026-10-15, `prompt.md` was prepared for Stage 5C from completed commit `2a3fffc`. This paragraph records that historical preparation-only update; completed implementation and fresh verification are now recorded above. Its starting baseline was 393 recorded passing tests, 47 events, 22 cameras and a T+176 endpoint.

Use the existing eight payload IDs and a candidate per-group departure stagger [0,3,6,9] seconds. Keep leader starts at T+160/T+166, verify ramp readiness at T+158.8/T+165.2, and measure actual clearance times. Both group leaders must be clear and beginning inland advance at T+176. Report individual deck/ramp/ground states at 180; late unloading can continue in Stage 6.

Select direct joins from the two ramp lanes to `road_beach_exit` / `road_beach_access_east`. In the two LAV path blocks and affected landing narrative, distinguish these scripted joins from the existing optional apron/service connectors, retaining those original coordinates and documenting their apron-to-beach direction. This is a scoped Stage 5C reference clarification, not a new human-approved map redesign. Preserve all event records, map geometry, completed LCAC routes/contact grades and environmental layouts; keep historical fixture bytes and normalize only the identified source edits in reference comparisons.

Use actual deck/ramp/ground surfaces and the rendered wheel radius. The 0.12 m panel's underside contact does not make its top flush with the beach: tires need continuous finite-radius hinge/toe contact and bounded suspension while axles span different surfaces. Reuse one visible instance per ID and the shared models; changing attachment must not duplicate, hide or teleport a vehicle. Protect full LCAC histories and each LAV's pre-departure state in a new Stage 5B baseline instead of excluding the entire landing object.

The finite endpoint decision is recorded above. The 2026-10-15 preparation update did not implement deployment. Verified delivery on 2026-10-17 now completes Stage 5C and parent Stage 5 for scripted operation through T+180; Stage 6 remains planned.

### Acceptance records

The nearer-staging/local-grading choice is approved and its narrowly scoped reference package is implemented above, with synchronized staging/route/final-nearshore meanings, measured contact geometry, stop headings and payload/ramp clearance. Do not expand this authorization to unrelated actors, chronology, broad coastlines or map scaling. Stages 5A and 5B are complete. The Stage 5B criteria below are retained as the completed acceptance record; Stage 5C implementation and acceptance are now complete as measured above.

Stage 5B acceptance (completed above):

1. Exactly two correctly owned/dimensioned LCACs, each with exactly four recognizable embarked LAV-25s; no extra losses or visible humans.
2. Approved nearer-staging distance/time profiles with measured peaks, acceleration/braking, turn rate, independently sampled shallow occupancy, exact final-nearshore gates and water/land corner clearance. Do not substitute the unselected cinematic-compression alternative.
3. Continuous grounded shore transition and correctly seated skirt/ramp at T+155/T+162; ramp readiness before unloading at 160/166, with no terrain penetration, duplicate craft or position jump.
4. Deck packing, barrel/wheel/side machinery/ramp-swing sweeps and carrier-local continuity tested against actual model bounds; narrowed local decoration changes documented without unrelated seeded-layout changes.
5. Exactly five added official events, total 47, 176-second scope; existing actor paths, damage, source attribution, fixture bytes, broad Stage 4C coastal samplers and Stage 5A lifecycle preserved. Approved route/contact changes are enumerated, with exact environmental equality outside the fixed local footprints.
6. Continuous 1× approach/beaching inspection, required boundary seeks, pause/orbit/pan/zoom, restart/backseek/all speeds, all cameras/short HUD, matched renderer statistics and repeated resource stability. Report only checks actually performed.

Stage 5C acceptance (completed above):

1. Exactly eight persistent vehicle identities, two four-vehicle groups, staggered departure and continuous deck/ramp/beach/road motion with all wheels grounded.
2. T+160/T+166 begin unloading; T+176 visibly begins two-route spread. Report which vehicles remain aboard/on ramps at T+180; do not force all to complete long inland paths.
3. Direct road joins with explicit source clarification, preserved optional apron connector coordinates, safe inter-vehicle separation and full turns/sweeps without generalized pathfinding.
4. All 51 IDs/times represented, T+180 `scripted_phase_complete`/`enter_aftermath_observation` retained, complete three-minute playback, and an explicitly paused endpoint with indefinite aftermath pending Stage 6.
5. Full automated and actual browser regression/resource verification, with old immutable values preserved and any endpoint-specific new behavior documented separately.

The original candidate calculations and completed Stage 5B verification are retained together. Stage 5C unloading/full-timeline verification is complete; Stage 6 aftermath remains future work.

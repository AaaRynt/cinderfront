# Ash Harbor Map Validation — v1.1

**Status:** PASS

**Validated:** 2026-08-12

**Artifacts:** `map-spec.yaml` and `map-layout.svg`

## Verification evidence

| Check                              | Method and measured evidence                                                                                                                                                                                                                                                                                                                               | Result |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| YAML and XML syntax                | Ruby Psych parsed schema `1.1.0`; REXML parsed the SVG root, namespace, ARIA references, clip path, and `viewBox="0 0 1600 1160"`.                                                                                                                                                                                                                         | PASS   |
| Identifier and reference integrity | 207 YAML IDs, all unique; 0 duplicate YAML keys; 366 foreign-key-style ID references checked and 0 unresolved. The SVG has 168 unique IDs and 0 duplicates.                                                                                                                                                                                                | PASS   |
| Bounds and finite geometry         | 1,058 X/Z coordinate pairs checked against X `[-7000, 7000]`, Z `[-5000, 5000]`; 0 raw points, circle extents, or ellipse extents fall outside the map.                                                                                                                                                                                                    | PASS   |
| Polygon and line integrity         | 113 explicit polygon fields checked with implicit closure; 0 self-intersections. The 63 line strings, including both dry-wash banks, also have 0 self-intersections.                                                                                                                                                                                       | PASS   |
| Land and water coherence           | The refined 48-vertex mainland coast matches the mainland boundary. Land overlays declare mainland clipping; intertidal, shallow, and deep-water overlays declare water clipping. The harbor basin has 0 vertices on mainland.                                                                                                                             | PASS   |
| Harbor navigation and berths       | The channel centerline has 0/404 sampled points outside its channel polygon. All 3 large and 2 support berth envelopes have 0/404 sampled edge points outside either the basin or deep-water core. The 470 m breakwater-head gap exceeds the declared 360 m entrance width and 340 m channel width.                                                        | PASS   |
| Road placement and continuity      | 19 physical road polylines were sampled at no more than 25 m intervals: 1,936 samples and 0 off mainland. Shared junctions connect harbor → fuel → ammunition/eastern trunk, fuel → ridge → hill ring, trunk → rescue branch, and eastern beach access → inland connector.                                                                                 | PASS   |
| Fuel and ammunition systems        | Eight tanks fit three separate containment cells; six magazines retain distinct footprint and berm polygons. The fuel loop clears the north/central/south cells by at least 71.66/133.07/170.43 m at road edge, and clears the firewater reservoir by 105.50 m. Internal ammunition roads and six gate spurs clear the berms.                              | PASS   |
| Pipeline, rail, fences, and power  | Four product-pipe/road crossings match four declared pipe bridges within 0.35 m. Three freight-rail/road crossings match declared grade crossings within 0.47 m. Fuel/ammunition/radar fence crossings are all matched by declared gates or penetrations. Both power systems have 0 solid-building pass-throughs and exact source/branch/end connectivity. | PASS   |
| Radar Hill                         | Search and tracking platforms fit the 175–210 m plateau. Search, tracking, 4 SAM platforms, AAA, 3 support buildings, mast foundation, and hill roads all fit Region C and the 80–220 m ridge envelope. Nested elevation bands use the declared innermost-envelope rule.                                                                                   | PASS   |
| Region separation                  | A–E centroid distance is 11.21 km, A–B is 4.79 km, and A–F is 6.43 km; all exceed declared minima. B1–B2 clearance is 300 m. Regions D and E do not overlap; three bluff segments and two modeled passes form the physical separator, while the main trunk remains inland.                                                                                 | PASS   |
| Remote Beachhead                   | Sand → intertidal → shallow → deep-transition polygons share exact boundary sequences. Dunes, hardstand, and apron have no unintended area overlap; hardstand and apron share only their intended edge. Both access paths cross modeled passes without intersecting bluff polygons.                                                                        | PASS   |
| Offshore references                | All 4 reference anchors are inside Region F, outside mainland, and 1.66–3.27 km from shore. The minimum residual gap between declared anchor clearances is 322 m. Headings are explicit and the SVG uses restrained point/heading marks rather than route arrows.                                                                                          | PASS   |
| SVG correspondence                 | All 104 `prominent` and 39 `subtle` YAML IDs appear in the SVG; none of the 64 `yaml_only` IDs is rendered. Automated comparison found 109 exact point sequences with 0 mismatches; declared grouped/symbolic objects retain their YAML authority.                                                                                                         | PASS   |
| Projection, scale, and readability | World transform `translate(800 580) scale(0.1 -0.1)` is algebraically identical to the YAML projection at 10 m per SVG unit. The 0–2 km bar spans exactly 200 units. A native 1600 × 1160 headless-Chrome render kept coast, roads, terrain bands, infrastructure, labels A–F, legend, north arrow, and scale distinct.                                    | PASS   |
| Content and file scope             | No attack/aircraft/missile routes, landing arrows, mission phases, timing, AI, damage states, controls, or visible human objects are encoded. No additional output files were created.                                                                                                                                                                     | PASS   |

## Geometry inventory

| Category                                  | Count |
| ----------------------------------------- | ----: |
| Stable YAML IDs                           |   207 |
| Explicit polygon fields                   |   113 |
| Line strings / polylines                  |    63 |
| Point-geometry objects                    |    30 |
| Top-level facility records                |    70 |
| ID-bearing facility descendants           |   102 |
| Top-level road systems                    |    14 |
| Road records including six magazine spurs |    20 |
| Physical road segments                    |    80 |
| Terrain-related IDs                       |    36 |
| Polygon-bearing terrain / surface records |    25 |
| Top-level infrastructure systems          |    11 |
| ID-bearing infrastructure descendants     |    29 |
| Offshore placement anchors                |     4 |

## Suitability conclusion

The v1.1 YAML now supplies deterministic terrain, coastal bands, harbor works, facility footprints, transport networks, utility crossings, high-ground controls, beach access, and offshore placement references. The SVG carries the same macro geometry as a clean north-up technical overview. Together they are suitable as the shared physical-world source for the downstream 3D implementation.

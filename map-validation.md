# Ash Harbor Map Validation

**Status:** PASS  
**Validated files:** `map-spec.yaml` and `map-layout.svg`

| Check                       | Method and evidence                                                                                                                                                                                                                         | Result |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| YAML syntax                 | Parsed with Ruby Psych using `YAML.safe_load`; schema version resolved to `1.0.0`.                                                                                                                                                          | PASS   |
| SVG syntax                  | Parsed as XML with REXML and checked as a standalone SVG document.                                                                                                                                                                          | PASS   |
| Identifier integrity        | 94 YAML IDs found; 0 duplicates. All `region_id`, `subregion_id`, and terrain clipping references resolve.                                                                                                                                  | PASS   |
| Coordinate bounds           | 371 XZ coordinate pairs checked against X `[-7000, 7000]` and Z `[-5000, 5000]`; 0 out-of-range pairs. Offshore ellipse extents are X `[-6200, -3200]`, Z `[-3850, -1950]`.                                                                 | PASS   |
| Major polygon integrity     | Major polygon rings use declared implicit closure; automated segment checks found 0 self-intersections.                                                                                                                                     | PASS   |
| Road placement              | The 9 road centerlines were sampled at intervals no greater than 25 m: 1,530 samples checked and 0 fell off `terrain_mainland`. The dry-wash crossing is explicitly represented by `dry_wash_bridge`, and the beach exit remains land-side. | PASS   |
| Region separation           | A–E centroid distance: **11,210 m** (minimum 8,000 m). A–B: **4,794 m** (minimum 2,500 m). A–F: **6,433 m** (minimum 5,000 m). B1–B2 clear gap: **300 m** (minimum 250 m).                                                                  | PASS   |
| Offshore water clearance    | Region F is wholly inside the map bounds; a 72-point perimeter sample found no intersection with the mainland polygon.                                                                                                                      | PASS   |
| Required physical inventory | 6 regions; 3 large berths; 2 support berths; 3 explicit piers; 8 fuel tanks; 6 bermed ammunition bunkers; search and tracking radars; SAM and AAA areas; bridge, junction, pull-offs, beach, shallows, dunes, and exit route.               | PASS   |
| Harbor / beach distinction  | The harbor is a compact engineered northwestern basin; the beachhead is a broad minimally developed southeastern shore. Their centroids are 11.21 km apart and their region envelopes retain 7.44 km of minimum boundary clearance.         | PASS   |
| SVG correspondence          | 108 SVG IDs are unique. Critical YAML-backed region, shoreline, road, terrain, pier, storage, radar, bridge, beach, and naval-area IDs are present. The world transform implements the YAML formula at 10 m per SVG unit.                   | PASS   |
| Diagram readability         | The SVG was rendered at its native 1600 × 1160 view. Coastline, region labels A–F, facilities, contours, roads, north arrow, coordinate ticks, and the exact 0–2 km scale bar remain distinct.                                              | PASS   |
| Content scope               | No mission phases, attack routes, timing, AI, spawn logic, objectives, damage sequence, aircraft/missile routes, visible human objects, or battle-wave graphics are encoded.                                                                | PASS   |
| Deliverable scope           | This task created only `map-spec.yaml`, `map-layout.svg`, and `map-validation.md`; no application, dependency, or configuration files were modified.                                                                                        | PASS   |

## Suitability conclusion

The YAML provides deterministic physical geometry and stable references for later 3D terrain, facility, road, and naval placement. The SVG uses the same coordinate layout as a strict top-down technical reference. Together they are suitable as the shared physical-world source of truth for a future Ash Harbor 3D scene.

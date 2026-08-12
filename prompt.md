Perform a controlled v1.1 refinement of the existing Ash Harbor map.

The current macro layout is approved.

Do NOT redesign the battlefield from scratch.

Preserve:

- the 14 km × 10 km map bounds;
- the overall coastline orientation;
- the six major regions A–F;
- the Harbor District in the northwest;
- the Fuel and Ammunition Storage District in the central-north area;
- Radar Hill in the northeast;
- the Convoy and Rescue Corridor in the east/southeast;
- the Remote Beachhead in the southeast;
- the Blue Offshore Naval Group in the southwest;
- the existing overall visual composition.

The purpose of this revision is to increase the physical and geometric specificity of the map for a downstream Codex workflow that will build a detailed React/Three.js 3D battlefield environment.

Do not increase detail merely by adding prose or labels.

Increase useful machine-readable geometry.

Update:

1. `map-spec.yaml`
2. `map-layout.svg`
3. `map-validation.md`

Do not create additional files.

## Primary goal

The YAML should become detailed enough that a downstream 3D implementation can construct the major terrain, roads, harbor geometry, industrial infrastructure, radar high ground, beach terrain, and offshore staging area without inventing large portions of the world.

The SVG should remain visually clean and technical.

Do not make the SVG cluttered simply because the YAML becomes more detailed.

## Harbor District refinement

Preserve the current Harbor District position and general harbor shape.

Add or refine:

- outer breakwaters;
- harbor entrance geometry;
- navigable channel;
- harbor basin;
- shallow-water zones;
- deep-water zones where appropriate;
- exact major berth polygons;
- exact pier and jetty geometry;
- berth length and orientation;
- support berths;
- warehouse footprints;
- maintenance / service apron;
- crane reference footprints or rails;
- harbor internal roads;
- one utility or electrical-service facility;
- one local defensive emplacement area.

Use stable object IDs.

Do not populate detailed ships yet unless an existing physical reference anchor is already present.

## Fuel Storage Area refinement

Preserve the current fuel-storage location.

Add:

- individual major fuel-tank footprints;
- tank containment / fire berm polygons;
- internal service roads;
- pump station footprint;
- pipe-rack or pipeline polylines;
- transfer area;
- connection toward the Harbor District;
- utility structures;
- clear firebreak / spacing areas.

The fuel area should read as an industrial system, not merely a collection of circles.

## Ammunition Storage Area refinement

Preserve its current location and separation from the fuel area.

Add:

- individual bunker or magazine footprints;
- protective berm polygons;
- internal access roads;
- loading / transfer apron;
- rail or truck logistics access where appropriate;
- safety spacing between storage groups.

Do not merge the fuel and ammunition areas.

## Harbor-to-industrial connections

Add physical infrastructure connecting the harbor and industrial district:

- at least one pipeline / pipe-rack connection from the harbor toward the fuel area;
- one freight rail or industrial transport spur if spatially reasonable;
- service-road continuity.

These are static physical infrastructure only.

Do not add attack or logistics-event scripting.

## Radar Hill refinement

Preserve the current Radar Hill position.

Improve its terrain representation.

Add:

- explicit elevation-control points;
- ridge-line polyline;
- multiple elevation or terrain polygons;
- radar platform footprints;
- SAM platform footprints;
- AAA platform footprint;
- communications-mast footprint;
- support-building footprints;
- access road up the hill;
- slope-character metadata.

Avoid generating a simple cone-shaped hill.

The terrain should read as a natural elevated ridge or plateau.

## Convoy Corridor refinement

Keep the corridor in the east / southeast.

Add modest physical detail so the region is not empty:

- principal road with explicit width;
- branch road with explicit width;
- lay-bys or vehicle pull-off areas;
- maintenance or service yard;
- a small electrical substation or utility compound;
- one road chokepoint;
- a dry-wash / culvert / bridge feature;
- optional old industrial or quarry area if spatially appropriate.

Do not turn this region into a dense city.

## Separate Region D and Region E more strongly

The Convoy Corridor and Remote Beachhead currently read as somewhat spatially connected.

Introduce a natural physical separator between them.

Use one or a combination of:

- dry riverbed / wadi;
- low rocky ridge;
- shallow ravine;
- barren scrubland;
- low bluff system.

The separator should make the regions visually and physically distinct without radically changing their existing positions.

The main convoy road should remain north or inland of this separator.

The beach exit should not immediately merge into the main convoy corridor.

## Remote Beachhead refinement

Preserve the existing remote southeastern beach.

Add explicit physical coastal geometry:

- beach polygon;
- intertidal polygon;
- shallow-water polygon;
- deeper-water transition;
- dune polygons;
- low bluff or coastal terrain where appropriate;
- firm beach-exit area;
- inland hardstand / open-ground area;
- two plausible inland vehicle-access paths.

Do not call them LCAC routes or LAV routes.

They are physical access paths only.

Do not add landing arrows or future-event markers.

## Offshore Naval Reference Area refinement

Preserve Region F.

Keep the main region as open water, but add a small set of neutral physical reference anchors for future 3D placement.

For example:

- amphibious assault ship reference anchor;
- northern escort reference anchor;
- southern escort reference anchor;
- optional distant support-ship reference anchor.

For every anchor provide:

- stable ID;
- X/Z position;
- heading;
- concise physical role;
- sufficient spacing from other anchors and shorelines.

These anchors are static layout references, not movement routes or mission instructions.

The SVG may show them as subtle small reference markers, but should not make them visually dominant.

## Coastline refinement

The current coastline may be refined with additional vertices where useful.

Preserve its overall topology and macro shape.

Avoid excessively long artificial straight coastline segments.

Add moderate local irregularity especially around:

- Harbor District;
- open coastal stretches;
- Remote Beachhead transitions.

Do not generate noisy fractal coastlines.

The geometry must remain practical for procedural 3D terrain construction.

## Additional physical infrastructure

Where appropriate, add:

- freight rail polylines;
- pipeline polylines;
- utility / power-line polylines;
- fences or major security boundaries;
- drainage channels;
- service roads;
- retaining or blast berms.

Only add infrastructure that improves the physical coherence of the environment.

Do not fill empty land merely for visual density.

## YAML geometry requirements

Where meaningful, physical objects should use explicit geometry rather than vague descriptions.

Prefer:

- polygons for facility footprints;
- polygons for terrain regions;
- polylines for roads;
- polylines for rail;
- polylines for pipelines;
- polylines for power lines;
- explicit X/Z points for anchors and terrain controls.

Roads must include declared physical width.

Piers and jetties must include usable width.

Important compounds should have boundary polygons.

Every object should include:

- stable ID;
- region ownership;
- concise physical type;
- geometry;
- relevant dimensions;
- optional diagram visibility metadata.

Use a consistent field such as:

`diagram_visibility`

or an equivalent structure to distinguish:

- geometry that should appear prominently in the technical SVG;
- geometry that should appear subtly;
- geometry that may remain YAML-only.

## SVG detail policy

The SVG is a technical reference map, not a dump of every YAML feature.

Keep the current overall style.

Show:

- coastline;
- major terrain;
- elevation structure;
- harbor geometry;
- major piers;
- major roads;
- railway where useful;
- main pipelines where useful;
- fuel tanks;
- ammunition compounds;
- radar / air-defense platforms;
- Remote Beachhead physical structure;
- Region F reference anchors;
- major utility infrastructure;
- region labels;
- north arrow;
- coordinate frame;
- scale.

Do not label every individual object.

Use a side legend or restrained index if needed.

Do not make important geometry unreadable through excessive annotation.

## Validation

After updating the YAML and SVG, validate:

- YAML syntax;
- all IDs are unique;
- all geometry remains within map bounds;
- polygons do not self-intersect;
- coastline remains valid;
- water and land classification remain coherent;
- harbor berths lie in sensible shoreline / harbor positions;
- road geometry is physically continuous where intended;
- pipelines and rail infrastructure do not make impossible jumps;
- Radar Hill terrain and platforms are internally contained;
- Region D and Region E remain clearly separated;
- Remote Beachhead shallow-water and beach geometry are coherent;
- offshore reference anchors remain in open water;
- SVG geometry matches the YAML;
- the SVG remains readable at native size.

Also report approximate counts for:

- polygons;
- polylines;
- point anchors;
- facilities;
- road segments;
- terrain regions;
- utility infrastructure objects.

## Scope restrictions

Do not add:

- attack routes;
- aircraft routes;
- missile routes;
- scripted explosions;
- mission phases;
- battle timing;
- objective markers;
- damage states;
- AI behavior;
- player controls;
- gameplay logic;
- future implementation architecture.

This remains the authoritative physical-world map.

The downstream 3D Codex will receive both `map-spec.yaml` and `map-layout.svg`.

The YAML should carry the detailed machine-readable physical truth.

The SVG should carry a clean human-readable technical overview.

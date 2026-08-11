Act as a technical world-layout designer.

Create the authoritative shared battlefield map assets for a future 3D front-end project.

Business need:
These files will be consumed by another Codex workflow that will build a React-based 3D battlefield diorama / cinematic simulation. The downstream 3D implementation will use your outputs as the source of truth for world layout, region identity, and major physical landmarks.

Your task in this conversation is only to create the map specification and its technical SVG layout reference.

Create exactly these files:

1. `map-spec.yaml`
2. `map-layout.svg`
3. `map-validation.md`

Do not create any other files.

Do not generate any application code.

## High-level project context

This map is for a fictional war-themed 3D battlefield diorama.

It is not a player-controlled vehicle game.

It will eventually depict a large-scale coastal military and industrial region under sudden heavy attack, with multiple loosely coupled local theatres of action.

However, this current task is only about physical map design and layout reference.

The map must support future 3D scenes such as:

- harbor combat and burning ships;
- a fuel depot and ammunition storage district;
- radar and air-defense positions on higher ground;
- a road corridor with military convoys and rescue vehicles;
- a remote beachhead where LCAC craft can land and deploy LAV-25 vehicles;
- an offshore blue-force naval group.

Do not encode mission logic, attack waves, event timing, gameplay systems, AI, or cinematic sequencing. Only define the physical world.

## Critical artistic and production constraints

- No visible human characters are required anywhere in the map.
- Do not design infantry positions, civilian crowds, or pedestrian activity.
- The world should be readable and visually expressive through terrain, buildings, ships, roads, vehicles, and military infrastructure.
- The downstream 3D workflow needs strong environmental storytelling, but without visible people.

## Setting

Create a fictional coastal military-industrial region, visually inspired by late Cold War / early 1990s war imagery.

The environment should feel like:

- a coastal military harbor;
- industrial fuel and logistics infrastructure;
- radar and air-defense high ground;
- dry or semi-arid terrain;
- a remote landing beach;
- open offshore waters.

Do not reproduce a real city, real harbor, or real military base.

## Map name

Use this map name:

- `Ash Harbor`

You may also include a short subtitle or description, but keep the official map ID and display name consistent.

## Map size and coordinate system

Use a local Cartesian coordinate system.

- Units: meters
- X positive: east
- Y positive: up
- Z positive: north
- North up in diagrams
- East right in diagrams

Map bounds must be:

- X: -7000 to +7000
- Z: -5000 to +5000

Total map size:

- 14 km east-west
- 10 km north-south

Keep all geometry fully inside the map boundary.

## Map structure

The battlefield should be organized into six major physical regions.

These are not gameplay zones. They are physical world regions.

### Region A — Harbor District

Place this in the northwestern coastal bay.

Purpose in the future 3D scene:

- major naval harbor;
- ships at dock;
- harbor facilities;
- likely focal point for naval destruction.

Physical requirements:

- an inward-curving bay or harbor basin;
- 2–3 large military ship berths;
- 1–2 support berths;
- dock structures, piers, or jetties;
- port warehouses;
- cranes;
- local port roads;
- at least one harbor-defense emplacement;
- a navigable exit channel to open water.

The harbor should feel compact enough to read clearly in a technical SVG, but large enough to host multiple major vessels in a later 3D scene.

### Region B — Fuel and Ammunition Storage District

Place this east or east-southeast of the Harbor District, separated by meaningful distance.

Purpose in the future 3D scene:

- major industrial storage zone;
- location for large fire and explosion effects;
- visually distinct from the harbor.

This district must include two sub-areas:

1. Fuel Storage Area

- multiple large cylindrical fuel tanks;
- pipe runs;
- pump or transfer facilities;
- service roads;
- secondary utility structures.

2. Ammunition Storage Area

- separate storage compounds or bunkers;
- blast berms or protective spacing;
- loading or logistics space;
- distinct internal access roads.

The Fuel Area and Ammunition Area must not be merged into one indistinguishable cluster. They should be adjacent but separable.

### Region C — Radar Hill / Air Defense High Ground

Place this in the northern or northeastern elevated terrain.

Purpose in the future 3D scene:

- early warning and air-defense node;
- visually elevated commanding position.

Physical requirements:

- one major search radar site;
- one tracking radar site;
- at least one SAM battery area;
- at least one AAA / gun-defense area;
- support buildings or bunkers;
- communications mast or tower;
- hilltop or ridgeline roads.

This region should sit on clearly higher ground than the harbor and industrial areas.

### Region D — Convoy and Rescue Corridor

Place this along the eastern or southeastern side of the map.

Purpose in the future 3D scene:

- moving military and support vehicle corridor;
- route for fuel trucks, ammunition trucks, engineering vehicles, and rescue vehicles.

Physical requirements:

- one principal road corridor;
- at least one branch route;
- a chokepoint, culvert, bridge, junction, or road bottleneck;
- sufficient roadside space for vehicle stoppage or rerouting in future scenes.

This corridor should physically connect toward the industrial and inland areas, but it does not need to connect every region directly in a perfectly realistic traffic model.

### Region E — Remote Beachhead

Place this in the southeast or south-southeast coastal area, clearly separated from the Harbor District.

Purpose in the future 3D scene:

- remote LCAC landing area;
- deployment area for LAV-25 vehicles;
- separate secondary theatre, not crowded into the main harbor.

Physical requirements:

- a broad beach or landing shore;
- shallow nearshore water;
- a beach exit route inland;
- dunes, low bluffs, or sparse coastal cover;
- minimal built infrastructure compared with the harbor;
- optional small abandoned defensive remains or simple shoreline fortifications.

This must read as a separate remote landing site, not part of the central harbor.

### Region F — Blue Offshore Naval Group

Place this in the southwestern offshore waters.

Purpose in the future 3D scene:

- source area for blue-force naval activity;
- future location of an amphibious assault ship, escorts, and launched craft.

Physical requirements:

- sufficiently open water for a small naval formation;
- no need for built structures;
- enough distance from the shoreline to feel offshore but still within map context.

You do not need to fully populate ship objects in the map itself, but the region must be clearly reserved and identified.

## Terrain and landform guidance

This is not a tropical island map.

Use a coastal mainland or coastal peninsula style.

Terrain should include:

- coastal bay geometry;
- industrialized shoreline;
- inland dry terrain;
- sparse vegetation;
- hill or ridge terrain for the radar site;
- beach terrain in the remote landing zone.

Avoid dense forests and avoid lush tropical geography.

Favor:

- dry ground;
- scrubland;
- rocky terrain;
- industrial pavement;
- sand;
- shallow coastal water transitions.

## Spatial composition guidance

The composition should roughly read like this:

- northwest: Harbor District
- central or east-central: Fuel and Ammunition Storage District
- north or northeast: Radar Hill
- east / southeast: Convoy and Rescue Corridor
- southeast coast: Remote Beachhead
- southwest offshore: Blue Offshore Naval Group

Do not place the Harbor District and the Remote Beachhead too close to each other.

Do not place every major feature in one dense cluster.

The overall design should support multiple simultaneous future viewpoints without each region visually collapsing into one another.

## Deliverable 1: `map-spec.yaml`

Create a machine-readable but human-readable YAML specification.

Write all keys, IDs, labels, and descriptions in English.

The YAML should include at least these top-level sections, or their equivalent:

- `schema_version`
- `metadata`
- `coordinate_system`
- `map_bounds`
- `environment`
- `terrain`
- `regions`
- `shorelines`
- `roads`
- `facilities`
- `naval_reference_areas`
- `diagram_requirements`
- `validation_rules`

Requirements for the YAML:

- Define the six major regions with stable IDs.
- Provide region names and concise descriptions.
- Define major land and coastline polygons or equivalent boundary geometry.
- Define major roads as polylines.
- Define key facility footprints or grouped placement points.
- Distinguish clearly between the Harbor District, Fuel Storage Area, Ammunition Storage Area, Radar Hill, Convoy Corridor, Remote Beachhead, and Blue Offshore Naval Group.
- Include enough spatial detail that another Codex can use it to build a 3D scene.
- Keep it technical and physical. Do not include gameplay logic or event scripting.

Do not include:

- mission phases;
- attack routes;
- AI behavior;
- spawn logic;
- timing scripts;
- objectives;
- victory conditions;
- damage sequences;
- wave systems.

This YAML is a shared physical-world document only.

## Deliverable 2: `map-layout.svg`

Create a technical top-down SVG layout reference from the YAML.

The SVG is meant for downstream 3D front-end creation, so it must be easy to read.

Requirements:

- strict orthographic top-down layout;
- north up, east right;
- equal scale;
- clearly visible coastlines and region separation;
- clean labeling;
- no artistic rendering;
- no perspective;
- no textures;
- no fake 3D effects;
- no decorative gradients beyond minimal technical readability.

The SVG must include:

- map boundary;
- north arrow;
- scale bar;
- labeled major regions A–F or equivalent IDs plus names;
- coastline / shoreline outlines;
- major roads;
- major facility clusters;
- radar high ground;
- industrial district extents;
- harbor district extents;
- remote beachhead;
- blue offshore naval area.

The SVG must not include:

- aircraft routes;
- missile routes;
- landing arrows;
- battle phases;
- time markers;
- explosion icons;
- attack wave graphics.

This is a map layout, not a storyboard.

The SVG should visually prioritize:

1. coastline and landform structure;
2. region identity;
3. roads and major facilities;
4. labels and scale information.

## Deliverable 3: `map-validation.md`

Create a concise validation report.

It should confirm:

- YAML syntax validity;
- uniqueness of IDs;
- major polygons lie within map bounds;
- roads lie within sensible map areas;
- key regions are separated enough to remain visually distinct;
- the Harbor District and Remote Beachhead are not too close;
- the map is suitable for later 3D scene creation;
- the SVG matches the YAML layout.

Keep the report concise but useful.

## Additional guidance

This map should support a future 3D battlefield scene that emphasizes:

- war damage potential;
- naval/industrial/coastal visual density;
- large explosions and fire potential;
- systemic military infrastructure;
- multiple loosely connected theatres.

It should not require visible people to feel alive.

The strongest result will be a map that already suggests:

- a harbor that can burn and sink ships;
- an industrial zone that can suffer catastrophic fire and secondary explosions;
- a radar hill that can be struck and still partially function;
- roads that can carry convoys and rescue vehicles;
- a remote landing beach that can host LCAC deployment;
- offshore waters that can support blue-force presence.

Do not create extra narrative beyond what is needed for physical map design.

Do not create any code.
Do not create any additional files.

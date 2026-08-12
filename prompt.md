Perform a controlled setting-and-language correction pass on the existing Ash Harbor map package.

The physical map layout is already approved.

Do NOT redesign the map.

Do NOT change the macro geography, coastlines, region positions, road network, facility layout, radar hill placement, remote beachhead placement, or offshore reference-area placement.

Keep these files and update them only where needed:

1. `map-spec.yaml`
2. `map-layout.svg`
3. `map-validation.md`

Do not create additional files.

## Purpose of this correction

The current battlefield map should **NOT** be framed as specifically late Cold War or early-1990s only.

That earlier phrasing was too narrow and risks forcing the downstream project into a Gulf War–style historical setting.

This is not the intent.

The map must instead support a fictional near-modern / contemporary regional conflict in which equipment from different generations can coexist.

The downstream 3D project may use aircraft and military systems such as:

- F-35 family aircraft;
- Su-30MKK or similar Flanker-family aircraft;
- imported or license-produced / locally copied air-defense systems;
- imported or mixed-origin armored vehicles;
- mixed naval equipment.

This is acceptable.

## Correct setting to use

Revise the framing so the world is understood as:

- a fictional contemporary or near-modern coastal conflict;
- visually grounded and militarized, but not tied to one exact historical year;
- compatible with mixed-generation equipment;
- compatible with a smaller island or coastal state using imported, license-produced, copied, or mixed equipment;
- compatible with an offshore attacking force that may field newer systems.

A useful framing is:

“A fictional contemporary coastal military-industrial battlespace with mixed-generation imported and locally supported equipment.”

Use wording of that kind.

## Important side / faction guidance

Do not strongly frame the map around “Red force” and “Blue force” language.

Avoid color-coded faction assumptions unless absolutely necessary for neutral map readability.

Prefer neutral wording such as:

- defending coastal state
- local island garrison
- offshore attacking force
- offshore naval group
- remote beachhead
- harbor district
- air-defense high ground
- convoy corridor

Keep side naming minimal and non-stylized.

Do not imply that all facilities must be recolored or visually themed as a rigid red-vs-blue game abstraction.

## What to change

Review all three files and correct any wording, metadata, labels, notes, or validation prose that currently implies one or more of the following:

- specifically late Cold War only;
- specifically early 1990s only;
- Gulf War framing;
- historically narrow force composition;
- a requirement that both sides use same-era equipment;
- unnecessarily rigid red/blue faction framing.

Where such wording exists, revise it.

Examples of acceptable revised wording:

- fictional contemporary conflict
- near-modern coastal battlespace
- mixed-generation equipment environment
- imported / license-produced / mixed-origin equipment
- smaller defending coastal state
- offshore attacking naval force

## What must remain unchanged

Preserve:

- all geometry;
- all coordinates;
- all IDs unless a textual display label truly needs correction;
- all polygons and polylines;
- all region boundaries;
- all physical infrastructure;
- all reference anchors;
- the approved overall SVG composition.

This is not a layout revision.

It is a semantic / descriptive correction only.

## Additional clarification for downstream use

The defending side may plausibly use:

- imported Soviet/Russian-style systems;
- Chinese-style systems;
- local copies or hybrids;
- older but still operational coastal-defense and air-defense equipment;
- mixed vehicle fleets.

The offshore attacking side may plausibly use:

- newer multirole aircraft;
- modern amphibious or escort vessels;
- newer stand-off strike capability.

Such asymmetry is allowed.

Do not attempt to “balance” the setting.

Do not attempt to enforce strict procurement realism.

The map should remain usable for a visually expressive fictional war scenario.

## Deliverable expectations

Update the existing files in place.

`map-validation.md` should mention that:

- the physical layout was preserved;
- the revision was a setting-language correction only;
- the map now supports a fictional contemporary mixed-generation conflict;
- the revised framing is compatible with assets such as F-35-family aircraft and Su-30MKK-type aircraft.

Do not add gameplay logic, timeline logic, or implementation details.

Do not create new narrative lore beyond what is necessary to correct the setting.

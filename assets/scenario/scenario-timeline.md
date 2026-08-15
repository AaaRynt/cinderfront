# Ash Harbor Scenario Timeline

> Derived human-readable view of `scenario-spec.yaml` schema 1.1.0. The YAML event list is authoritative for IDs, timing, sides, map references, paths, and resulting states. During streamed generation, partial Markdown and partial YAML are previews only; a completed, validated YAML snapshot is required before this document is regenerated.

## 1. Scenario Overview

**Local time:** 05:27:00–05:30:00
**Scripted duration:** 180 seconds
**Post-script state:** Indefinite aftermath observation
**Visible humans:** None
**Audio:** Out of scope

Ash Harbor is a deterministic three-minute battlefield sequence built around several loosely coupled theaters.

The sequence is not intended to depict a balanced engagement. The Attacker has a substantial technological and initiative advantage, but the Defender must still behave as an active military system.

**Canonical sides:** `attacker` (display name: Attacker) and `defender` (display name: Defender). Descriptions such as “landing force” and “island defense force” are operational roles, not alternative side IDs.

The Defender should:

- detect and react to incoming aircraft;
- engage with air-defense systems;
- move reserve units;
- attempt local reinforcement;
- dispatch support and rescue vehicles;
- attempt naval withdrawal;
- send airborne reinforcement;
- retreat when positions become untenable;
- leave some surviving forces operating at the end.

The Attacker should:

- launch and reposition aircraft;
- suppress air-defense positions;
- attack harbor and industrial infrastructure;
- provide a later ground-support strike;
- withdraw aircraft after completing the main attack;
- move two LCAC craft toward the remote beach;
- deploy eight LAV-25 vehicles;
- continue expanding inland during the aftermath.

The battlefield should never feel like a set of stationary models waiting for explosions.

# 2. Dramatic Structure

The opening is described as two movements. Sections 3–29 then follow overlapping theater threads, so their section order is thematic rather than strictly chronological. For chronological playback, use the ordered `timeline` array in `scenario-spec.yaml`.

## Movement I — Detection

**T+00:00–00:24**

Ash Harbor is already under military alert.

Radar systems operate, vehicles move through the road network, ships remain active in the harbor, and offshore forces are underway.

Two F-35B aircraft launch from the Attacker's Wasp-class amphibious assault ship.

The Radar Hill search radar detects the incoming aircraft and changes behavior.

The first Pantsir-S1 begins tracking.

The battlefield transitions from tense order into active engagement.

## Movement II — Air-Defense Suppression

**T+00:24–00:48**

The first F-35B approaches Radar Hill.

The primary Pantsir-S1 engages.

Fixed air-defense guns join the engagement.

Tracer fire and missile trails should make the airspace visibly active without filling the entire sky.

At approximately T+00:36, the first strike lands near the radar complex.

The initial hit produces:

- dust;
- fragments;
- sparks;
- a short-lived fireball;
- persistent local smoke.

At T+00:42, the primary Pantsir-S1 is destroyed.

The vehicle should not simply disappear.

The destruction sequence should include:

1. a sharp ignition flash;
2. a local fireball;
3. sparks and selected fragments;
4. suspension or chassis response;
5. persistent engine or equipment fire;
6. a dark smoke source;
7. a permanent wreck remaining in the scene.

At T+00:45, the primary search radar is disabled.

The entire hill must not become inactive.

Secondary radar or communications equipment should continue moving so the location still feels occupied and functional.

# 3. Harbor Response

## T+00:48

The Harbor District receives its first strike at `warehouse_harbor_01`.

The harbor shifts from defensive preparation into emergency response.

## T+00:52

The second F-35B performs a high-speed attack pass across the harbor sector.

The aircraft should remain fast and difficult to visually track.

This is not a dogfight sequence.

## T+01:02

The Project 12418 Molniya missile boat begins emergency departure.

Its movement is important.

The vessel should:

- leave its berth;
- rotate into the harbor channel;
- accelerate toward the harbor entrance;
- create a visible wake;
- continue attempting escape while the harbor deteriorates behind it.

This vessel is not intended to be destroyed during the scripted phase.

Its survival creates contrast with the Talwar-class ship.

## T+01:12

The Talwar-class ship receives its first major hit.

The ship must not instantly transition into a destroyed state.

The first hit produces:

- a bright local flash;
- a localized fireball;
- deck sparks and fragments;
- one or more persistent deck fires;
- darkening smoke;
- visible localized damage.

The ship remains operational enough to continue moving weapon mounts or defensive systems for a short period.

# 4. Emergency Support Begins

## T+01:15

The support convoy receives orders to move toward the industrial district.

The convoy contains simple support vehicles rather than high-detail hero assets:

- two fire engines;
- one engineering vehicle;
- one recovery vehicle;
- two logistics trucks.

Nearby BTR-80 vehicles provide escort and security.

The convoy should visibly change from routine movement into an emergency response.

Vehicles accelerate, turn onto the industrial access route, and begin moving toward the growing fire.

This sequence exists to demonstrate that the Defender is still trying to keep its infrastructure functioning.

# 5. Industrial Strike Prelude

## T+01:18

A strike hits a pipeline or fuel-transfer facility.

The result is not yet the primary explosion.

The impact creates:

- a local fire;
- leaking fuel;
- sparks;
- a rising smoke source;
- burning industrial equipment.

The scene should visibly communicate that the facility is becoming unstable.

## T+01:26

`fuel_tank_05` receives a direct hit.

A smaller fireball and intense fuel fire begin.

The event acts as a six-second warning for the larger cascade.

# 6. Fuel Storage Cascade

## T+01:32

The fuel-storage district produces the first major hero explosion of the scenario.

This event should receive substantially more visual detail than routine weapon impacts.

### Initial flash

The explosion begins with a very short and extremely bright ignition flash.

Nearby surfaces should respond to the flash through temporary illumination.

### Fireball

The fireball rapidly expands during approximately the first 1.4 seconds.

Its approximate maximum visual radius should be in the range of 55–80 meters.

The fireball should not remain a perfect sphere.

It should distort vertically and begin transitioning into rising smoke and turbulent flame.

### Burning debris

Approximately 10–18 large visible debris fragments should be emitted.

Only selected fragments need detailed geometry.

Roughly half may visibly burn.

Important fragments should:

- follow visible ballistic arcs;
- rotate irregularly;
- carry short ember trails;
- carry short flame tails where appropriate;
- remain visible for approximately 3–8 seconds.

The effect should create the impression that parts of industrial structures and tank equipment have been thrown into the air.

### Shock front

A visible pressure or dust front should move away from the explosion.

The front is a cinematic approximation rather than a full physical simulation.

The visible front may expand approximately 500–700 meters before fading.

### Environmental reaction

Objects within the nearer response radius should react immediately.

Suitable objects include:

- scrub;
- sparse trees;
- grass clusters;
- signs;
- lightweight fences;
- lamp posts;
- small antennas.

Vegetation and lightweight objects should bend away from the explosion.

The motion should be fast.

The sequence should approximately follow:

1. rapid bend away from blast;
2. momentary maximum displacement;
3. spring-like return;
4. small overshoot;
5. gradual stabilization.

Not every object on the map needs this behavior.

Only nearby objects need to respond.

### Ground ignition

Approximately 6–14 new localized fire patches may appear around the industrial area.

Some should begin where flaming debris lands.

Others may begin near ruptured pipes or spilled fuel.

The ground fire does not require a full combustion simulation.

Scripted expansion and persistent emitters are sufficient.

### Smoke

A large dense black smoke column begins immediately after the main fireball.

The smoke should:

- grow rapidly;
- become darker toward its core;
- contain varying density;
- drift toward the northeast;
- persist throughout the remainder of the scenario;
- remain visible during the aftermath.

### Persistent damage

After the explosion, the industrial district should retain:

- scorched terrain;
- burning scrub;
- damaged tank structures;
- multiple small fires;
- dark soot;
- smoke haze.

The event must permanently change the visual state of the district.

# 7. Immediate Battlefield Reaction

## T+01:34

The shock front from the fuel explosion crosses nearby terrain.

Support vehicles briefly slow or stop.

Nearby vegetation and lightweight structures respond.

Industrial lights flicker.

Some equipment loses power.

## T+01:38

A larger portion of the industrial district loses electrical power.

Lighting becomes irregular.

The fire becomes the dominant local light source.

## T+01:40

Fuel leaking from the damaged Talwar-class ship reaches the harbor surface.

A dark irregular surface stain begins expanding.

It should initially appear as contamination rather than flame.

# 8. Airborne Reinforcement

## T+01:44

Two Su-30MKK aircraft enter from outside the map.

They represent airborne reinforcement from a defending airfield outside the modeled area.

No runway needs to exist inside Ash Harbor.

Their arrival should be visually significant but brief.

They do not begin a prolonged dogfight.

Their purpose is to show that the Defender still has functioning external forces.

One aircraft attempts to pressure the departing F-35B formation.

The second aircraft remains in a supporting position.

# 9. Support Route Failure

## T+01:48

The rescue convoy approaches the industrial chokepoint.

Visibility is now degraded by smoke and dust.

The convoy must visibly hesitate.

Vehicles may:

- brake;
- increase spacing;
- turn slightly;
- stop temporarily;
- begin searching for another route.

This should feel different from simple waypoint motion.

## T+01:52

The second Pantsir-S1 leaves its reserve position and relocates.

It moves toward a secondary firing position where it can support the remaining defensive network.

This movement should be clearly visible.

The vehicle reaches the firing location, stops, deploys or aligns its weapon system, and begins engaging.

# 10. Second Talwar Hit

## T+01:55

The Talwar-class ship receives another major hit.

This hit should visibly worsen an already damaged ship rather than repeat the first explosion unchanged.

Effects should include:

- another localized flash;
- additional deck fire;
- stronger smoke;
- more visible structural damage;
- increased flooding;
- gradually increasing list.

The ship is now clearly losing the fight to remain afloat.

# 11. Ammunition Storage Cook-Off

## T+01:56–02:12

The ammunition-storage compound enters a progressive failure state.

Unlike the fuel explosion, this sequence should be irregular and violent.

Small detonations begin inside different storage positions.

The pattern should contain:

- intermittent flashes;
- small fireballs;
- dust bursts;
- fragment ejection;
- rapidly accumulating smoke.

The explosions should not occur at perfectly regular intervals.

Several pauses should make the viewer uncertain whether the event has ended.

It has not.

# 12. Secondary Air-Defense Loss

## T+02:01

The relocated Pantsir-S1 is struck after its secondary engagement.

The vehicle is destroyed.

Its wreck remains near the road or firing position.

The Defender air-defense system is now heavily degraded but not represented as completely absent.

# 13. Road Disruption

## T+02:05

A secondary explosion or strike occurs at the `dry_wash_bridge` chokepoint near the rescue route.

The blast damages the roadway or surrounding infrastructure.

One rescue vehicle is forced to stop.

The convoy can no longer use its intended approach.

This event should visibly separate the vehicles.

The lead vehicle may stop near the obstruction while vehicles farther behind attempt to reposition.

# 14. Molniya Withdrawal Under Fire

## T+02:08

The Molniya missile boat is close to the harbor exit.

Fragments or a nearby impact damage the vessel.

The damage should not stop it.

The boat continues accelerating toward open water while trailing smoke.

The event provides an important contrast:

- the Talwar-class ship remains trapped and deteriorates;
- the smaller Molniya escapes, but not cleanly.

# 15. Ammunition Compound Primary Detonation

## T+02:12

`ammo_bunker_04` inside the ammunition-storage compound produces the second major hero explosion.

This explosion should look different from the fuel-storage cascade.

The visual identity should be:

- sharper;
- faster;
- more fragment-heavy;
- more violent in its initial impulse;
- less dominated by one sustained fuel fireball.

### Prelude

The small cook-off detonations rapidly increase.

### Flash

A powerful sharp flash illuminates surrounding buildings and terrain.

### Main detonation

A large fireball forms, approximately 40–65 meters in visual radius.

A dust and shock front expands outward.

### Fragment ejection

Approximately 18–34 visible fragments may be emitted.

Many should climb higher than debris from routine impacts.

Some fragments burn.

Others remain dark silhouettes against the fireball.

### Persistent state

Afterward the compound contains:

- several independent fire sources;
- heavy smoke;
- damaged or destroyed storage structures;
- a visible blast area;
- occasional minor secondary detonations.

# 16. BTR-80 Loss and Withdrawal

## T+02:13

One BTR-80 positioned near the industrial perimeter is disabled or destroyed by the ammunition explosion, secondary debris, or a nearby detonation.

The vehicle should remain as a wreck.

## T+02:16

The three surviving BTR-80 vehicles abandon the forward support position.

They move back along a branch road.

Their movement should communicate urgency.

They should:

- turn away from the industrial district;
- increase spacing;
- use the road or adjacent hard ground;
- continue moving during later events.

The loss should visibly cause a behavioral change.

# 17. Su-30MKK Withdrawal

## T+02:17

One Su-30MKK receives damage during the brief airborne engagement.

The aircraft should not explode spectacularly.

Instead:

- it changes attitude abruptly;
- begins trailing light smoke or visible damage;
- stops pressing the attack;
- turns toward the map boundary.

This preserves the aircraft as a damaged survivor rather than another fireball.

## T+02:22

The second Su-30MKK performs a brief covering pass.

It does not remain to fight alone.

It subsequently turns away and follows the damaged aircraft out of the combat area.

This is a deliberate withdrawal.

# 18. Amphibious Approach

## T+01:50

Two LCAC craft leave the offshore staging area.

The movement begins while the main industrial battle is still occurring.

This secondary theater should initially be easy to miss from distant views.

As the craft accelerate, they create:

- long wakes;
- water spray;
- visible skirt motion or simplified hovercraft vibration;
- strong forward movement.

## T+02:20

The first LCAC enters shallow coastal water.

Spray behavior begins changing.

## T+02:28

The second LCAC enters the same nearshore environment.

The craft should not travel in an identical formation.

Their positions and arrival times should differ slightly.

# 19. Ground Reinforcement Attempt

## T+02:30

Three T-72B tanks leave their reserve position.

They begin moving toward an inland approach leading toward the remote beach area.

Their task is not to reach the beach during the scripted phase.

They are reacting to the developing landing.

Nearby surviving BTR-80 vehicles are already falling back from the industrial district, creating opposing traffic and visual disorder in the road system.

# 20. First LCAC Beaching

## T+02:35

The first LCAC reaches the beach.

The transition from water to land should have strong physical character.

Visual requirements:

- heavy spray;
- wet wake diminishing;
- sand and dust beginning to replace spray;
- hovercraft slowing;
- slight body pitch or suspension-like response;
- dust spreading outward.

The ramp lowers.

The LCAC remains running.

# 21. Ground-Support Strike

## T+02:38

The lead T-72B in the reinforcement column is struck by the returning F-35B support aircraft.

This should be a medium-scale vehicle destruction event rather than another hero explosion.

The tank destruction should include:

- an intense local flash;
- a compact fireball;
- sparks;
- a limited number of fragments;
- dust;
- persistent hull or engine fire;
- a dark smoke source.

The wreck remains on or near the road.

Avoid excessive theatrical destruction such as launching the complete turret hundreds of meters unless the later implementation specifically finds a visually convincing way to do so.

The road obstruction itself is valuable.

# 22. Armored Withdrawal

## T+02:43

The two surviving T-72B tanks react to the loss of the lead vehicle.

They do not continue driving directly toward the same threat.

They:

1. stop or slow;
2. begin reversing or turning away;
3. use terrain as cover;
4. withdraw toward the inland ridge.

This is an important behavioral detail.

Vehicles should appear to react to battlefield events rather than blindly following splines.

# 23. LAV-25 Deployment

## T+02:40

The first four LAV-25 vehicles begin leaving the first LCAC.

They should not emerge simultaneously.

Use a staggered sequence.

Each vehicle should:

- move down the ramp;
- briefly settle onto the beach;
- turn away from the LCAC;
- accelerate toward an inland access path;
- generate dust.

## T+02:42

The second LCAC reaches the beach and lowers its ramp.

## T+02:46

Its four LAV-25 vehicles begin disembarking.

The two groups should not merge into one eight-vehicle line.

The first group uses one inland route.

The second group uses another.

At least some separation between individual vehicles should remain.

# 24. Talwar Final Deterioration

## T+02:45

The Talwar-class ship reaches a severe damage state.

The ship should now have:

- multiple deck fires;
- very dark smoke;
- obvious list;
- partial flooding;
- reduced or absent defensive activity;
- visible contamination around the hull.

It should not disappear below the surface.

The damaged hull remains one of the principal landmarks of the aftermath.

# 25. Air Activity Egress

## T+02:50

The primary air attack ends.

The F-35B aircraft leave the immediate battlefield.

The surviving Su-30MKK aircraft also exit.

This deliberately reduces visual density before the final ten seconds.

The battlefield does not become calm.

Ground fires, smoke, vehicles, ships, LCAC craft, and surviving units remain active.

# 26. Molniya Reaches Open Water

## T+02:52

The Molniya reaches open water.

It continues moving away from the harbor while trailing smoke.

The vessel survives the scripted sequence.

It may continue slowly into the distance during aftermath observation.

# 27. Rescue Attempt Abandoned

## T+02:54

The support convoy gives up its direct approach to the industrial fire.

Some vehicles stop.

Others begin turning around.

A fire engine may remain at the obstruction while an engineering or recovery vehicle attempts a limited reposition.

The important visual statement is:

**the rescue system still exists, but it cannot meaningfully reach the main fire.**

This is more effective than destroying every rescue vehicle.

# 28. LAV-25 Inland Movement

## T+02:56

The first LAV-25 vehicles are now clear of the landing craft.

They begin spreading into the two inland routes.

No infantry appears.

The vehicles themselves represent the expansion of the landing force.

The remaining LAV-25 vehicles continue disembarking.

# 29. Scripted Phase End

## T+03:00 / 05:30:00

No global freeze occurs.

The project enters:

**AFTERMATH OBSERVATION**

The scripted sequence is complete, but the battlefield remains alive.

# 30. Aftermath Observation

## Harbor

The Talwar-class ship remains:

- heavily listed;
- partially flooded;
- burning;
- surrounded by contaminated water.

Fuel burns intermittently on the harbor surface.

Floating debris remains visible.

The Molniya continues its damaged withdrawal farther offshore.

## Industrial District

The industrial district contains the largest long-term visual damage.

Persistent features include:

- a massive black smoke column;
- multiple ground fires;
- damaged fuel tanks;
- destroyed ammunition storage structures;
- scorched terrain;
- burned vegetation;
- intermittent minor secondary detonations;
- soot and haze.

Some flaming debris may continue burning on the ground.

## Radar Hill

The primary radar is destroyed.

The first Pantsir-S1 remains as a burned wreck.

Not every object is inactive.

A surviving secondary radar, antenna, generator, or communications structure may continue operating.

The scene should communicate partial collapse rather than total erasure.

## Convoy Corridor

The road network now shows the history of the battle.

Visible states include:

- one destroyed Pantsir-S1;
- one disabled or destroyed BTR-80;
- one destroyed T-72B;
- surviving BTR-80 vehicles withdrawing;
- two surviving T-72B tanks moving behind terrain;
- rescue vehicles halted, repositioning, or turning back;
- smoke and road obstruction near the chokepoint.

## Remote Beach

Both LCAC craft remain at or near the shoreline.

Their ramps remain lowered.

LAV-25 vehicles continue moving inland.

Some vehicles may still be leaving the second LCAC after T+03:00.

Dust persists behind the moving vehicles.

The landing theater therefore continues visibly after the primary attack has ended.

## Offshore

The Attacker's Wasp-class ship remains underway.

It is not a destroyed objective.

It continues slow formation movement and serves as the offshore visual anchor.

# 31. Destruction Language

The implementation should distinguish several different damage outcomes.

## Destroyed

A destroyed vehicle:

- no longer performs its original role;
- remains as a visible wreck;
- produces persistent fire or smoke where appropriate;
- does not disappear.

## Disabled

A disabled vehicle:

- stops moving;
- may retain limited visual activity;
- may smoke or burn;
- remains physically present.

## Damaged

A damaged vehicle:

- retains mobility;
- shows visual damage;
- may trail smoke;
- may change behavior;
- may withdraw.

## Withdrawing

A withdrawing vehicle:

- actively moves away from the threatened area;
- should not simply despawn at its original position;
- remains visible until reaching the map edge, terrain cover, or an appropriate distant state.

## Supporting

A supporting vehicle visibly changes behavior to assist another part of the battlefield.

Examples include:

- a Pantsir-S1 relocating to a firing position;
- T-72B tanks moving toward a threatened approach;
- BTR-80 vehicles escorting support traffic;
- Su-30MKK aircraft entering from outside the map;
- F-35B aircraft returning for a ground-support strike;
- fire and engineering vehicles attempting to reach the industrial district.

# 32. Hero Explosion Standard

The three highest-priority destruction sequences are:

1. Fuel Storage Cascade at T+01:32
2. Ammunition Storage Primary Detonation at T+02:12
3. Progressive Talwar Damage and Harbor Fuel Fire

These events should receive substantially more visual detail than ordinary impacts.

A hero explosion is not one particle emitter.

It is a timed stack of effects.

A complete hero effect may contain:

1. ignition flash;
2. local illumination;
3. expanding fireball;
4. dust or pressure front;
5. debris emission;
6. selected flaming fragments;
7. ember or flame trails;
8. environmental bending response;
9. terrain or structure damage;
10. new localized fires;
11. persistent smoke;
12. persistent scorch marks;
13. persistent wreckage;
14. secondary delayed activity.

The implementation may fake these effects aggressively.

Visual credibility is more important than full physical simulation.

# 33. Environmental Damage Standard

Environmental damage should accumulate during the three minutes.

The battlefield at T+03:00 must look substantially different from the battlefield at T+00:00.

Persistent changes should include:

- wrecked vehicles;
- damaged ships;
- burning structures;
- black smoke;
- surface contamination;
- ground fires;
- scorched terrain;
- burned scrub;
- craters;
- damaged lightweight infrastructure;
- road obstruction;
- industrial haze.

The environment itself is part of the casualty state of the battle.

# 34. Final Visual Intent

The final view should not communicate:

> everything is destroyed and nothing moves.

It should communicate:

> the original military-industrial system has been violently disrupted, surviving units are withdrawing or repositioning, fires continue spreading through damaged infrastructure, rescue efforts have stalled, one naval vessel is escaping, another is dying in the harbor, and the landing force is still advancing inland.

That continuing motion is essential to the Ash Harbor scenario.

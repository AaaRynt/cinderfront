import type { Mesh } from 'three'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { ACESFilmicToneMapping, BackSide, DoubleSide, RingGeometry } from 'three'

import type { F35AircraftState, SimulationWorldState } from '@/simulation'

import { deriveAircraftState, deriveRuntimeWorldState, simulationStore, useSimulationStore } from '@/simulation'

import type { Vec3 } from './effects/BattleEffects'

import { CameraRig } from './camera/CameraRig'
import { periodicAngle } from './effects/aftermath/effectClocks'
import { ImpactEffect, MissileFlight, StovlExhaust, TracerBurst } from './effects/BattleEffects'
import { Stage3BattleEffects } from './effects/Stage3BattleEffects'
import { Stage4B2AArmoredEffects } from './effects/Stage4B2AArmoredEffects'
import { Stage4BGroundVehicleEffects } from './effects/Stage4BGroundVehicleEffects'
import { SupportConvoyEffects } from './effects/SupportConvoyEffects'
import { FixedAaa, PrimarySearchRadar, TrackingRadar } from './installations/RadarInstallations'
import { Btr80Group, F35BModel, PantsirModel, T72BGroup, WaspModel } from './vehicles'
import { LandingCrafts } from './vehicles/LandingCrafts'
import { SecondaryPantsir } from './vehicles/SecondaryPantsir'
import { Su30MkkGroup } from './vehicles/Su30MkkGroup'
import { SupportConvoyGroup } from './vehicles/SupportConvoyGroup'
import { AAA_SITE, HARBOR_WAREHOUSE_POSITIONS, HarborNavalAssets, SAM_PAD_POSITIONS, WorldShell } from './world'

const NEAR_HIT_POSITION: Vec3 = [3_115, 174, 3_330]
const PANTSIR_IMPACT_POSITION: Vec3 = [3_050, 174, 3_375]
const RADAR_IMPACT_POSITION: Vec3 = [3_550, 216, 4_150]
const HARBOR_IMPACT_POSITION: Vec3 = [HARBOR_WAREHOUSE_POSITIONS[0].centerXZ[0], HARBOR_WAREHOUSE_POSITIONS[0].terrainY + HARBOR_WAREHOUSE_POSITIONS[0].heightM, HARBOR_WAREHOUSE_POSITIONS[0].centerXZ[1]]

const AIR_DEFENSE_LAUNCHES = [
  { launchTime: 24, duration: 5.2, miss: [150, 75, -110] as Vec3 },
  { launchTime: 31.2, duration: 5.4, miss: [-125, 55, 135] as Vec3 },
  { launchTime: 37.4, duration: 5.1, miss: [105, -30, -145] as Vec3 },
] as const

const AAA_BURST_STARTS = [29, 32.2, 35.4, 38.6, 41.8, 45] as const
const SIMULATION_STEP_SECONDS = 1 / 30
const DOWNWASH_RING_GEOMETRY = new RingGeometry(0.9, 1, 32)

const PANTSIR_MISSILE_SOURCE: Vec3 = [SAM_PAD_POSITIONS[0].position[0], SAM_PAD_POSITIONS[0].position[1] + 5.4, SAM_PAD_POSITIONS[0].position[2]]

const AIR_DEFENSE_PATHS = AIR_DEFENSE_LAUNCHES.map((launch, index) => {
  const targetState = deriveAircraftState('attacker_f35_01', launch.launchTime + launch.duration)
  const target = targetState.pose.position
  const end: Vec3 = [target.x + launch.miss[0], target.y + launch.miss[1], target.z + launch.miss[2]]
  const control: Vec3 = [(PANTSIR_MISSILE_SOURCE[0] + end[0]) / 2 + (index - 1) * 130, Math.max(PANTSIR_MISSILE_SOURCE[1], end[1]) + 430 + index * 80, (PANTSIR_MISSILE_SOURCE[2] + end[2]) / 2 - 80 + index * 65]
  return { ...launch, control, end }
})

const FIXED_AAA_SOURCE: Vec3 = [AAA_SITE.position[0], AAA_SITE.position[1] + 7.5, AAA_SITE.position[2]]

const FIXED_AAA_PATHS = AAA_BURST_STARTS.map((start) => {
  const target = deriveAircraftState('attacker_f35_01', Math.min(48, start + 1.15)).pose.position
  const end: Vec3 = [target.x, target.y, target.z]
  return { end, shotTimes: [start, start + 0.2, start + 0.4] as const, start }
})

function vectorTuple(vector: { readonly x: number; readonly y: number; readonly z: number }): Vec3 {
  return [vector.x, vector.y, vector.z]
}

function SimulationDriver() {
  const accumulatedDelta = useRef(0)

  useFrame((_, deltaSeconds) => {
    const state = simulationStore.getState()
    if (!state.isPlaying) {
      accumulatedDelta.current = 0
      return
    }

    accumulatedDelta.current += Math.min(deltaSeconds, 0.1)
    while (accumulatedDelta.current >= SIMULATION_STEP_SECONDS) {
      state.tick(SIMULATION_STEP_SECONDS)
      accumulatedDelta.current -= SIMULATION_STEP_SECONDS
      if (!simulationStore.getState().isPlaying) {
        accumulatedDelta.current = 0
        break
      }
    }
  })
  return null
}

function DawnEnvironment() {
  const camera = useThree((state) => state.camera)
  const sky = useRef<Mesh>(null)

  useFrame(() => {
    sky.current?.position.copy(camera.position)
  })

  return (
    <>
      <color attach="background" args={['#0b1820']} />
      <fog attach="fog" args={['#344852', 7_800, 21_000]} />
      <mesh ref={sky} frustumCulled={false} scale={19_000}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial
          depthWrite={false}
          fragmentShader={`
            varying vec3 vSkyPosition;
            void main() {
              vec3 skyDirection = normalize(vSkyPosition);
              float height = skyDirection.y;
              vec3 horizon = vec3(0.075, 0.115, 0.155);
              vec3 zenith = vec3(0.009, 0.027, 0.052);
              vec3 warm = vec3(0.20, 0.105, 0.038);
              float verticalMix = smoothstep(-0.08, 0.72, height);
              float horizonGlow = exp(-pow((height - 0.015) * 7.0, 2.0));
              float sunward = pow(max(0.0, dot(normalize(skyDirection.xz + vec2(0.0001)), vec2(-0.755, -0.656))), 3.0);
              vec3 color = mix(horizon, zenith, verticalMix) + warm * horizonGlow * (0.08 + sunward * 0.36);
              gl_FragColor = vec4(color, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `}
          side={BackSide}
          vertexShader={`
            varying vec3 vSkyPosition;
            void main() {
              vSkyPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
        />
      </mesh>
      <hemisphereLight color="#b1c8d3" groundColor="#4b514a" intensity={1.08} />
      <ambientLight color="#91adb9" intensity={0.42} />
      <directionalLight castShadow color="#ffd4a3" intensity={2.65} position={[-6_800, 3_900, -5_900]} shadow-bias={-0.00018} shadow-mapSize-height={1_024} shadow-mapSize-width={1_024} shadow-normalBias={18}>
        <orthographicCamera attach="shadow-camera" args={[-7_500, 7_500, 6_000, -6_000, 50, 22_000]} />
      </directionalLight>
      <directionalLight color="#789aaa" intensity={0.48} position={[4_000, 6_000, 2_000]} />
    </>
  )
}

function DownwashDisturbance({ aircraft, time, waspDeckY }: { aircraft: F35AircraftState; time: number; waspDeckY: number }) {
  const strength = aircraft.mechanical.downwashStrength
  if (strength < 0.08 || aircraft.pose.position.y > waspDeckY + 85) return null

  return (
    <group position={[aircraft.pose.position.x, waspDeckY + 0.12, aircraft.pose.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((index) => {
        const progress = (time * 0.58 + index / 3) % 1
        const radius = 3 + progress * 18 * strength
        return (
          <mesh key={index} scale={[radius, radius, 1]}>
            <primitive attach="geometry" object={DOWNWASH_RING_GEOMETRY} />
            <meshBasicMaterial color="#d6e4df" depthWrite={false} opacity={(1 - progress) * 0.09 * strength} side={DoubleSide} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

function AircraftEntity({ aircraft, time, waspDeckY }: { aircraft: F35AircraftState; time: number; waspDeckY: number }) {
  const { mechanical, pose } = aircraft
  const enginePower = aircraft.launched ? Math.max(0.42, mechanical.heatHazeStrength) : 0.12
  const enginePulse = enginePower * (0.97 + Math.sin(periodicAngle(time, 17, aircraft.launchAtSeconds)) * 0.03)

  return (
    <>
      <group name={aircraft.id} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
        <F35BModel enginePower={enginePulse} fanRotationRadians={time <= 180 ? time * enginePulse * 26 : periodicAngle(time, enginePulse * 26)} gearDeployment={1 - mechanical.landingGearRetraction} liftFanDoor={mechanical.liftFanDoor} nozzleDeflection={mechanical.rearNozzleDeflectionDegrees / 90} />
        <StovlExhaust doorOpen={mechanical.liftFanDoor} enginePower={enginePulse} nozzleDeflection={mechanical.rearNozzleDeflectionDegrees / 90} time={time} />
      </group>
      <DownwashDisturbance aircraft={aircraft} time={time} waspDeckY={waspDeckY} />
    </>
  )
}

function WaspEntity({ world }: { world: SimulationWorldState }) {
  const { pose, wakeStrength } = world.wasp
  return (
    <group name="attacker_wasp_01" position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      <WaspModel wakeStrength={wakeStrength} />
    </group>
  )
}

function AirDefenseMissiles({ time }: { time: number }) {
  return (
    <group name="pantsir-authored-missiles">
      {AIR_DEFENSE_PATHS.map((launch) => (
        <MissileFlight key={launch.launchTime} control={launch.control} duration={launch.duration} end={launch.end} launchTime={launch.launchTime} origin={PANTSIR_MISSILE_SOURCE} time={time} />
      ))}
    </group>
  )
}

function FixedAaaTracers({ time }: { time: number }) {
  return (
    <group name="fixed-aaa-tracers">
      {FIXED_AAA_PATHS.map((path) => (
        <TracerBurst key={path.start} end={path.end} origin={FIXED_AAA_SOURCE} shotTimes={path.shotTimes} time={time} />
      ))}
    </group>
  )
}

function RadarHillEngagement({ world }: { world: SimulationWorldState }) {
  const time = world.timeSeconds
  const destroyed = world.pantsir.phase === 'destroyed'
  const launcherElevation = world.pantsir.phase === 'engaging' ? 0.46 : world.pantsir.phase === 'acquiring' ? 0.34 : 0.28

  return (
    <>
      <PrimarySearchRadar destroyed={world.persistent.primaryRadarDestroyed} rotation={world.radar.primaryDishRotationRadians} time={time} />
      <TrackingRadar rotation={world.radar.secondaryDishRotationRadians} tracking={world.radar.secondaryTracking} />
      <group position={SAM_PAD_POSITIONS[0].position}>
        <PantsirModel destroyed={destroyed} destructionAge={Math.max(0, time - 42)} firedTubeCount={world.pantsir.launcherRoundsExpended} launcherElevation={launcherElevation} radarRotation={world.pantsir.radarRotationRadians} turretYaw={world.pantsir.turretYawRadians} />
      </group>
      <FixedAaa firing={world.fixedAaa.isFiring} turretYaw={world.fixedAaa.turretYawRadians} />

      <AirDefenseMissiles time={time} />
      <FixedAaaTracers time={time} />
      <ImpactEffect impactTime={36} position={NEAR_HIT_POSITION} time={time} variant="near-hit" />
      <ImpactEffect impactTime={42} position={PANTSIR_IMPACT_POSITION} time={time} variant="vehicle-kill" />
      <ImpactEffect impactTime={45} position={RADAR_IMPACT_POSITION} time={time} variant="radar-hit" />
      <ImpactEffect impactTime={48} persistent={false} position={HARBOR_IMPACT_POSITION} time={time} variant="boundary-hit" />
    </>
  )
}

function DynamicBattlefield() {
  const time = useSimulationStore((state) => state.timeSeconds)
  const world = useMemo(() => deriveRuntimeWorldState(time), [time])
  const f35Primary = world.aircraft.attacker_f35_01
  const f35Secondary = world.aircraft.attacker_f35_02
  const su30Primary = world.aircraft.defender_su30_01.pose.position
  const su30Secondary = world.aircraft.defender_su30_02.pose.position
  const su30Separation = Math.hypot(su30Primary.x - su30Secondary.x, su30Primary.y - su30Secondary.y, su30Primary.z - su30Secondary.z)
  const deckY = world.wasp.pose.position.y + 13.2
  const t72Vehicles = world.stage4b.t72Group.orderedVehicleIds.map((id) => world.stage4b.t72Group.vehicles[id])
  const t72Position: Vec3 = [t72Vehicles.reduce((sum, vehicle) => sum + vehicle.pose.position.x, 0) / t72Vehicles.length, t72Vehicles.reduce((sum, vehicle) => sum + vehicle.pose.position.y, 0) / t72Vehicles.length, t72Vehicles.reduce((sum, vehicle) => sum + vehicle.pose.position.z, 0) / t72Vehicles.length]

  return (
    <>
      <WaspEntity world={world} />
      <group visible={world.runtime.aircraft?.attacker_f35_01.visible ?? true}>
        <AircraftEntity aircraft={f35Primary} time={time} waspDeckY={deckY} />
      </group>
      <group visible={world.runtime.aircraft?.attacker_f35_02.visible ?? true}>
        <AircraftEntity aircraft={f35Secondary} time={time} waspDeckY={deckY} />
      </group>
      <Su30MkkGroup group={world.stage4b2b} />
      <RadarHillEngagement world={world} />
      <SecondaryPantsir state={world.secondaryPantsir} time={time} />
      <LandingCrafts landing={world.landing} />
      <Btr80Group group={world.stage4b.btrGroup} />
      <T72BGroup group={world.stage4b.t72Group} />
      <SupportConvoyGroup group={world.stage4b2c.convoy} />
      <SupportConvoyEffects state={world.stage4b2c} time={time} />
      <Stage3BattleEffects world={world} />
      <Stage4BGroundVehicleEffects world={world} />
      <Stage4B2AArmoredEffects world={world} />
      <CameraRig
        btrPosition={vectorTuple(world.stage4b.btrGroup.vehicles.defender_btr_03.pose.position)}
        f35Position={vectorTuple(f35Primary.pose.position)}
        f35SecondaryPosition={vectorTuple(f35Secondary.pose.position)}
        molniyaPosition={vectorTuple(world.stage3.molniya.pose.position)}
        su30Position={vectorTuple(world.stage4b2b.anchor.position)}
        su30FramingScale={Math.sqrt(1 + (su30Separation / 310) ** 2)}
        su30YawRadians={world.stage4b2b.anchor.rotation.y}
        t72HullYawRadians={world.stage4b.t72Group.vehicles.defender_t72_02.pose.rotation.y}
        t72Position={t72Position}
        supportPosition={vectorTuple(world.stage4b2c.camera.anchor.position)}
        supportYawRadians={world.stage4b2c.camera.anchor.rotation.y}
        supportFramingScale={world.stage4b2c.camera.framingScale}
        secondaryPantsirPosition={vectorTuple(world.secondaryPantsir.pose.position)}
        secondaryPantsirYawRadians={world.secondaryPantsir.pose.rotation.y}
        lavWestPosition={vectorTuple(world.landing.payload.attacker_lav_01.pose.position)}
        lavWestYawRadians={world.landing.payload.attacker_lav_01.pose.rotation.y}
        lavEastPosition={vectorTuple(world.landing.payload.attacker_lav_05.pose.position)}
        lavEastYawRadians={world.landing.payload.attacker_lav_05.pose.rotation.y}
        lcacWestPosition={vectorTuple(world.landing.crafts.attacker_lcac_01.pose.position)}
        lcacWestYawRadians={world.landing.crafts.attacker_lcac_01.pose.rotation.y}
        lcacEastPosition={vectorTuple(world.landing.crafts.attacker_lcac_02.pose.position)}
        lcacEastYawRadians={world.landing.crafts.attacker_lcac_02.pose.rotation.y}
      />
    </>
  )
}

export function BattlefieldScene() {
  return (
    <div className="battlefield-canvas" data-testid="battlefield-canvas">
      <Canvas
        camera={{ far: 25_000, fov: 43, near: 1, position: [700, 5_000, -7_800] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
        }}
        shadows="percentage"
      >
        <SimulationDriver />
        <DawnEnvironment />
        <WorldShell />
        <HarborNavalAssets />
        <DynamicBattlefield />
      </Canvas>
    </div>
  )
}

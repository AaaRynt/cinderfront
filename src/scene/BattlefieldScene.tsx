import type { Mesh } from 'three'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { ACESFilmicToneMapping, BackSide, DoubleSide, RingGeometry } from 'three'

import type { AircraftState, SimulationWorldState } from '@/simulation'

import { deriveAircraftState, deriveSimulationWorldState, simulationStore, useSimulationStore } from '@/simulation'

import type { Vec3 } from './effects/BattleEffects'

import { CameraRig } from './camera/CameraRig'
import { ImpactEffect, MissileFlight, StovlExhaust, TracerBurst } from './effects/BattleEffects'
import { Stage3BattleEffects } from './effects/Stage3BattleEffects'
import { FixedAaa, PrimarySearchRadar, TrackingRadar } from './installations/RadarInstallations'
import { F35BModel, PantsirModel, WaspModel } from './vehicles'
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
      <fog attach="fog" args={['#17272e', 7_000, 20_500]} />
      <mesh ref={sky} frustumCulled={false} scale={19_000}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial
          depthWrite={false}
          fragmentShader={`
            varying vec3 vSkyPosition;
            void main() {
              float height = normalize(vSkyPosition).y;
              vec3 horizon = vec3(0.25, 0.29, 0.30);
              vec3 zenith = vec3(0.025, 0.075, 0.105);
              vec3 warm = vec3(0.34, 0.16, 0.065);
              float verticalMix = smoothstep(-0.08, 0.72, height);
              float horizonGlow = exp(-pow((height - 0.015) * 7.0, 2.0));
              vec3 color = mix(horizon, zenith, verticalMix) + warm * horizonGlow * 0.42;
              gl_FragColor = vec4(color, 1.0);
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
      <hemisphereLight color="#a7bdc6" groundColor="#453a2e" intensity={0.88} />
      <ambientLight color="#8ba2aa" intensity={0.38} />
      <directionalLight castShadow color="#ffc27e" intensity={3.35} position={[-6_800, 3_900, -5_900]} shadow-bias={-0.00018} shadow-mapSize-height={1_024} shadow-mapSize-width={1_024} shadow-normalBias={18}>
        <orthographicCamera attach="shadow-camera" args={[-7_500, 7_500, 6_000, -6_000, 50, 22_000]} />
      </directionalLight>
      <directionalLight color="#789aaa" intensity={0.48} position={[4_000, 6_000, 2_000]} />
    </>
  )
}

function DownwashDisturbance({ aircraft, time, waspDeckY }: { aircraft: AircraftState; time: number; waspDeckY: number }) {
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

function AircraftEntity({ aircraft, time, waspDeckY }: { aircraft: AircraftState; time: number; waspDeckY: number }) {
  const { mechanical, pose } = aircraft
  const enginePower = aircraft.launched ? Math.max(0.42, mechanical.heatHazeStrength) : 0.12
  const enginePulse = enginePower * (0.97 + Math.sin(time * 17 + aircraft.launchAtSeconds) * 0.03)

  return (
    <>
      <group name={aircraft.id} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
        <F35BModel enginePower={enginePulse} fanRotationRadians={time * enginePulse * 26} gearDeployment={1 - mechanical.landingGearRetraction} liftFanDoor={mechanical.liftFanDoor} nozzleDeflection={mechanical.rearNozzleDeflectionDegrees / 90} />
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
  const world = useMemo(() => deriveSimulationWorldState(time), [time])
  const f35Primary = world.aircraft.attacker_f35_01
  const f35Secondary = world.aircraft.attacker_f35_02
  const deckY = world.wasp.pose.position.y + 13.2

  return (
    <>
      <WaspEntity world={world} />
      <AircraftEntity aircraft={f35Primary} time={time} waspDeckY={deckY} />
      <AircraftEntity aircraft={f35Secondary} time={time} waspDeckY={deckY} />
      <RadarHillEngagement world={world} />
      <Stage3BattleEffects world={world} />
      <CameraRig f35Position={vectorTuple(f35Primary.pose.position)} f35SecondaryPosition={vectorTuple(f35Secondary.pose.position)} molniyaPosition={vectorTuple(world.stage3.molniya.pose.position)} />
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

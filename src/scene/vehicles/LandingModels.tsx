import type { ReactNode } from 'react'

import type { LandingCraftState } from '@/simulation/landingCraftTypes'

import { LCAC_RAMP, LAV_DIMENSIONS } from '@/simulation/landingCraftData'

import type { LandingModelResources } from './landingModelResources'

export function Lav25Model({ resources }: { resources: LandingModelResources }) {
  const { geometry: g, material: m } = resources
  return (
    <group name="lav25-model" dispose={null}>
      <mesh name="lav25-hull" geometry={g.hull} material={m.lav} castShadow receiveShadow />
      <mesh geometry={g.box} material={m.lavDark} position={[0, 0.78, 0]} scale={[2.3, 0.4, 5.55]} />
      <mesh geometry={g.box} material={m.lavDark} position={[0, 1.16, -2.62]} rotation={[-0.7, 0, 0]} scale={[1.9, 0.04, 1.4]} />
      <mesh name="lav25-turret" geometry={g.turret} material={m.lav} position={[0, 2.02, -0.02]} castShadow />
      <mesh geometry={g.box} material={m.lavDark} position={[0, 2.35, -0.45]} scale={[0.48, 0.34, 0.56]} />
      <mesh name="lav25-cannon" geometry={g.cannon} material={m.metal} position={[0, 2.37, -1.85]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh name="lav25-closed-hatch" geometry={g.cylinder} material={m.lavDark} position={[0.25, 2.64, 0.25]} scale={[0.32, 0.1, 0.32]} />
      <mesh name="lav25-opaque-optics" geometry={g.box} material={m.glass} position={[-0.43, 2.38, -0.53]} scale={[0.22, 0.16, 0.13]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh geometry={g.box} material={m.lavDark} position={[side * 1.17, 1.07, 0.3]} scale={[0.15, 0.1, 5.35]} />
          {LAV_DIMENSIONS.axleZ.map((z, axle) => (
            <group key={axle} name={`lav25-wheel-${side}-${axle}`} position={[side * LAV_DIMENSIONS.wheelCentersX, LAV_DIMENSIONS.wheelRadius, z]}>
              <mesh geometry={g.wheel} material={m.tire} rotation={[0, 0, Math.PI / 2]} castShadow />
              <mesh geometry={g.cylinder} material={m.lavDark} rotation={[0, 0, Math.PI / 2]} scale={[0.23, 0.34, 0.23]} />
              <mesh name="lav25-wheel-marker" geometry={g.box} material={m.metal} position={[side * 0.165, 0.27, 0]} scale={[0.012, 0.16, 0.045]} />
            </group>
          ))}
          <mesh geometry={g.box} material={m.glass} position={[side * 0.87, 1.32, -2.65]} scale={[0.21, 0.1, 0.04]} />
        </group>
      ))}
      <mesh geometry={g.box} material={m.lavDark} position={[0.7, 1.69, 1.8]} scale={[0.63, 0.08, 1.45]} />
      <mesh name="lav25-driver-hatch-closed" geometry={g.cylinder} material={m.lavDark} position={[-0.65, 1.7, -1.55]} scale={[0.28, 0.08, 0.28]} />
    </group>
  )
}

export function LcacModel({ mechanics, resources, children }: { mechanics: LandingCraftState['mechanics']; resources: LandingModelResources; children?: ReactNode }) {
  const { geometry: g, material: m } = resources
  const deck = mechanics.deckLocalY
  return (
    <group name="lcac-model" dispose={null}>
      <mesh name="lcac-low-platform" geometry={g.platform} material={m.platform} position={[0, 0.36 - 0.22 * mechanics.skirtCompression, 0]} receiveShadow />
      <mesh name="lcac-flexible-skirt" geometry={g.skirt} material={m.skirt} scale={[1, 1 - mechanics.skirtCompression * 0.4, 1]} receiveShadow />
      <group name="lcac-deck-module" position={[0, deck, 0]}>
        <mesh name="lcac-cargo-deck" geometry={g.box} material={m.deck} position={[0, -0.14, 0]} scale={[8.2, 0.28, 20.4]} receiveShadow />
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh name="lcac-side-machinery" geometry={g.box} material={m.platform} position={[side * 5.55, 0.57, 0.8]} scale={[2.5, 1.35, 18]} castShadow receiveShadow />
            <mesh geometry={g.box} material={m.machinery} position={[side * 5.55, 1.36, 1.8]} scale={[2.3, 0.55, 7.6]} />
            {[-1.4, -0.7, 0, 0.7, 1.4].map((z) => (
              <mesh key={z} geometry={g.box} material={m.metal} position={[side * 5.55, 1.65, 1.8 + z]} scale={[1.8, 0.06, 0.14]} />
            ))}
            <group name={`lcac-fan-${side}`} position={[side * 4.75, 3.2, 10.5]}>
              <mesh name="lcac-fan-duct" geometry={g.fan} material={m.machinery} castShadow />
              <group name="lcac-fan-rotor" rotation={[0, 0, mechanics.fanRotationRadians * side]}>
                {[0, 1, 2, 3, 4].map((blade) => (
                  <group key={blade} rotation={[0, 0, (blade * Math.PI * 2) / 5]}>
                    <mesh geometry={g.box} material={m.metal} position={[0, 1.06, 0]} rotation={[0, 0.15, 0.07]} scale={[0.36, 1.77, 0.1]} />
                  </group>
                ))}
              </group>
              <mesh geometry={g.cylinder} material={m.metal} rotation={[Math.PI / 2, 0, 0]} scale={[0.26, 0.55, 0.26]} />
              <mesh geometry={g.box} material={m.metal} position={[0, -1.67, 0]} scale={[0.16, 1.25, 0.16]} />
              <mesh name="lcac-rudder" geometry={g.box} material={m.platform} position={[0, 0, 0.65]} scale={[0.12, 3.5, 0.85]} />
            </group>
            <mesh geometry={g.box} material={m.platform} position={[side * 5.2, 1.1, 10.25]} scale={[2, 0.7, 1.9]} />
            <mesh name="lcac-navigation-light" geometry={g.box} material={side > 0 ? m.green : m.red} position={[side * 6.82, 1.4, -6.5]} scale={[0.12, 0.2, 0.21]} visible={mechanics.navigationLight > 0.6} />
          </group>
        ))}
        <group name="lcac-sealed-control-cabin" position={[5.55, 1.75, -6.25]}>
          <mesh geometry={g.box} material={m.machinery} scale={[2.45, 2.4, 3.75]} castShadow />
          <mesh name="lcac-opaque-forward-glazing" geometry={g.box} material={m.glass} position={[0, 0.52, -1.885]} scale={[2.05, 0.88, 0.025]} />
          <mesh name="lcac-opaque-side-glazing" geometry={g.box} material={m.glass} position={[1.24, 0.52, -0.65]} scale={[0.025, 0.88, 1.8]} />
          <mesh geometry={g.box} material={m.platform} position={[0, 1.25, 0]} scale={[2.6, 0.1, 3.9]} />
        </group>
        <group name="lcac-bow-ramp-hinge" position={[0, 0, LCAC_RAMP.hingeZ]} rotation={[mechanics.bowRampAngleRadians, 0, 0]}>
          <mesh name="lcac-bow-ramp-panel" geometry={g.box} material={m.platform} position={[0, -LCAC_RAMP.thickness / 2, -LCAC_RAMP.length / 2]} scale={[LCAC_RAMP.width, LCAC_RAMP.thickness, LCAC_RAMP.length]} receiveShadow />
          {[-3, -1, 1, 3].map((x) => (
            <mesh key={x} geometry={g.box} material={m.deck} position={[x, 0.006, -3]} scale={[0.075, 0.012, 5.8]} />
          ))}
        </group>
        <mesh name="lcac-stern-ramp-closed" geometry={g.box} material={m.platform} position={[0, 0.7, 10.5]} rotation={[-Math.PI / 3, 0, 0]} scale={[5.2, 0.12, 1.6]} />
      </group>
      {children}
    </group>
  )
}

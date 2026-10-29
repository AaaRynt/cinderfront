import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { Group, Mesh } from 'three'
import { describe, expect, it } from 'vitest'

import { deriveLandingWorldState } from '@/simulation/landingCraft'
import { appendModel } from '@/test/inspectModel'

import { Btr80Model } from './Btr80Model'
import { createLandingModelResources } from './landingModelResources'
import { LcacModel } from './LandingModels'
import { SupportVehicleModel } from './SupportVehicleModel'
import { T72BModel } from './T72BModel'

const meshes = (element: ReactElement) => {
  const root = new Group()
  appendModel(root, element)
  root.updateMatrixWorld(true)
  const result: Mesh[] = []
  root.traverse((o) => {
    if (o instanceof Mesh) result.push(o)
  })
  return { root, result }
}
describe('Stage7B exact live mechanics with finite static children', () => {
  it('retains every BTR/T72 mesh resource while changing moving wheels, tracks, steering, turret and damage', () => {
    for (const disabled of [false, true]) {
      const a = meshes(<Btr80Model disabled={disabled} damageProgress={0.3} />),
        b = meshes(<Btr80Model disabled={disabled} damageProgress={0.7} wheelRotationRadians={4.2} steeringRadians={0.15} turretYawRadians={0.4} />)
      expect(b.result.map((m) => m.geometry)).toEqual(a.result.map((m) => m.geometry))
      expect(b.result.map((m) => m.material)).toEqual(a.result.map((m) => m.material))
      expect(b.result.filter((m, i) => !m.matrixWorld.equals(a.result[i]!.matrixWorld)).length).toBeGreaterThanOrEqual(24)
      const c = meshes(<T72BModel destroyed={disabled} damageProgress={0.3} />),
        d = meshes(<T72BModel destroyed={disabled} damageProgress={0.7} roadWheelRotationRadians={2.3} trackTravelMeters={0.08} turretYawRadians={0.6} />)
      expect(d.result.map((m) => m.geometry)).toEqual(c.result.map((m) => m.geometry))
      expect(d.result.filter((m, i) => !m.matrixWorld.equals(c.result[i]!.matrixWorld)).length).toBeGreaterThan(36)
    }
  })
  it('preserves LCAC hierarchy, every mechanical input and resource replacement ownership', () => {
    const resources = createLandingModelResources(),
      nextResources = createLandingModelResources(),
      mechanics = deriveLandingWorldState(0).crafts.attacker_lcac_01.mechanics
    const a = meshes(<LcacModel mechanics={mechanics} resources={resources} />),
      b = meshes(<LcacModel mechanics={{ ...mechanics, fanRotationRadians: 2.6, bowRampAngleRadians: -0.4, deckLocalY: mechanics.deckLocalY + 0.12, skirtCompression: 0.4, navigationLight: 0 }} resources={resources} />)
    expect(a.result.map((m) => m.geometry)).toEqual(b.result.map((m) => m.geometry))
    expect(a.root.getObjectByName('lcac-deck-module')!.position.y).not.toBe(b.root.getObjectByName('lcac-deck-module')!.position.y)
    expect(b.root.getObjectByName('lcac-bow-ramp-hinge')!.rotation.x).toBe(-0.4)
    expect(b.root.getObjectByName('lcac-fan--1')!.getObjectByName('lcac-fan-rotor')!.rotation.z).toBe(-2.6)
    const navigation: boolean[] = []
    const inspect = (node: ReactNode) => {
      if (Array.isArray(node)) node.forEach(inspect)
      else if (isValidElement<{ name?: string; visible?: boolean; children?: ReactNode }>(node)) {
        if (node.props.name === 'lcac-navigation-light') navigation.push(node.props.visible!)
        inspect(node.props.children)
      }
    }
    inspect(LcacModel({ resources, mechanics: { ...mechanics, navigationLight: 0 } }))
    expect(navigation).toEqual([false, false])
    const replacement = meshes(<LcacModel mechanics={mechanics} resources={nextResources} />)
    expect(replacement.root.getObjectByName('lcac-side-machinery')).toBeDefined()
    expect(replacement.result[0]!.geometry).not.toBe(a.result[0]!.geometry)
    resources.dispose()
    nextResources.dispose()
  })
  it('retains all support vehicle wheel resources and exact moving steering/rotation transforms', () => {
    const props = { subtype: 'fire_engine' as const, alternateLoad: false, steeringRadians: 0, wheelRotationRadians: 0, lighting: { beaconEnabled: true, beaconPhaseOffsetSeconds: 0, headlights: true, brakeLights: false, reverseLights: false, beaconIntensity: 0 } }
    const a = meshes(<SupportVehicleModel {...props} />),
      b = meshes(<SupportVehicleModel {...props} steeringRadians={0.2} wheelRotationRadians={3.7} />)
    expect(b.result.map((m) => m.geometry)).toEqual(a.result.map((m) => m.geometry))
    expect(b.result.filter((m, i) => !m.matrixWorld.equals(a.result[i]!.matrixWorld))).toHaveLength(18)
  })
})

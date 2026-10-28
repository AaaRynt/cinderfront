import type { ReactElement } from 'react'

import { Group } from 'three'
import { describe, expect, it } from 'vitest'

import { deriveLandingWorldState } from '@/simulation/landingCraft'
import { appendModel } from '@/test/inspectModel'

import { F35BModel } from './F35BModel'
import { createLandingModelResources } from './landingModelResources'
import { LandingPayloadModel, Lav25Model } from './LandingModels'
import { SupportVehicleModel } from './SupportVehicleModel'

type Children = { children: ReactElement[] }
describe('finite immutable model element reuse', () => {
  it('reuses each owned LAV tree and invalidates on resource replacement', () => {
    const a = createLandingModelResources(),
      b = createLandingModelResources()
    const first = Lav25Model({ resources: a }) as ReactElement<Children>,
      same = Lav25Model({ resources: a }) as ReactElement<Children>,
      next = Lav25Model({ resources: b }) as ReactElement<Children>
    expect(same.props.children[0]).toBe(first.props.children[0])
    expect(next.props.children[0]).not.toBe(first.props.children[0])
    a.dispose()
    b.dispose()
  })
  it('compares every visible wheel input exactly without mutating historical wheels', () => {
    const resources = createLandingModelResources(),
      payload = deriveLandingWorldState(0).payload.attacker_lav_01
    const result = LandingPayloadModel({ payload, resources }) as ReactElement<{ children: ReactElement }>
    const compare = (result.props.children.type as unknown as { compare: (a: unknown, b: unknown) => boolean }).compare
    const before = JSON.stringify(payload.wheels),
      a = { resources, wheels: payload.wheels }
    expect(compare(a, { ...a, wheels: payload.wheels.map((w) => ({ ...w })) })).toBe(true)
    for (const field of ['suspensionMeters', 'steeringRadians', 'rotationRadians'] as const) {
      const wheels = payload.wheels.map((wheel, i) => (i === 0 ? { ...wheel, [field]: wheel[field] + 1e-12 } : wheel))
      expect(compare(a, { ...a, wheels }), field).toBe(false)
    }
    const root = new Group()
    appendModel(root, result)
    expect(root.getObjectsByProperty('name', 'lav25-wheel-roll')).toHaveLength(8)
    expect(root.getObjectByName('lav25-hull')).toBeDefined()
    expect(JSON.stringify(payload.wheels)).toBe(before)
    resources.dispose()
  })
  it('retains static airframe/body identity while live mechanics and lighting remain independent', () => {
    const a = F35BModel({ fanRotationRadians: 1, enginePower: 0.2 }) as ReactElement<Children>,
      b = F35BModel({ fanRotationRadians: 2, enginePower: 0.8 }) as ReactElement<Children>
    expect(a.props.children[0]).toBe(b.props.children[0])
    const lighting = { beaconEnabled: true, beaconPhaseOffsetSeconds: 0, headlights: true, brakeLights: false, reverseLights: false, beaconIntensity: 0 }
    const s = { subtype: 'fire_engine' as const, alternateLoad: false, steeringRadians: 0, wheelRotationRadians: 0, lighting }
    const first = SupportVehicleModel(s) as ReactElement<Children>,
      next = SupportVehicleModel({ ...s, wheelRotationRadians: 42, lighting: { ...lighting, beaconIntensity: 1 } }) as ReactElement<Children>
    expect(first.props.children[0]).toBe(next.props.children[0])
  })
})

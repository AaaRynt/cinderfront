import { describe, expect, it } from 'vitest'

import { deriveSimulationWorldState } from './derive'
import { dotVector3, rotateVectorByEulerXYZ, subtractVector3, transformLocalOffsetByPose } from './math'
import { AIR_GROUND_STRIKE_BY_ID, AIR_GROUND_STRIKES, deriveAirGroundWeaponState } from './weapons'

describe('deterministic aircraft-delivered guided bombs', () => {
  it('defines every corrected opening and Stage 3 impact at its exact event time and target', () => {
    expect(AIR_GROUND_STRIKES.map((strike) => [strike.id, strike.impactAtSeconds])).toEqual([
      ['radar_hill_near_hit', 36],
      ['pantsir_01_destroyed', 42],
      ['primary_radar_disabled', 45],
      ['harbor_first_hit', 48],
      ['talwar_first_hit', 72],
      ['industrial_pipeline_hit', 78],
      ['fuel_tank_initial_hit', 86],
      ['talwar_second_hit', 115],
    ])
    expect(AIR_GROUND_STRIKE_BY_ID.industrial_pipeline_hit.targetPosition).toEqual({ x: -1450, y: 26.66, z: 2500 })
  })

  it.each(AIR_GROUND_STRIKES)('$id releases from the transformed lower bay with a forward/downward tangent', (definition) => {
    const sourcePose = deriveSimulationWorldState(definition.releaseAtSeconds).aircraft[definition.sourceAircraftId].pose
    const state = deriveAirGroundWeaponState(definition, definition.releaseAtSeconds, sourcePose)
    const expectedRelease = transformLocalOffsetByPose(sourcePose, definition.lowerBayOffset)
    const aircraftForward = rotateVectorByEulerXYZ({ x: 0, y: 0, z: -1 }, sourcePose.rotation)
    const aircraftDown = rotateVectorByEulerXYZ({ x: 0, y: -1, z: 0 }, sourcePose.rotation)
    const releaseOffset = subtractVector3(state.releasePosition, sourcePose.position)
    const targetDirection = subtractVector3(state.targetPosition, state.releasePosition)

    expect(state.releasePosition).toEqual(expectedRelease)
    expect(dotVector3(releaseOffset, aircraftDown)).toBeGreaterThan(1)
    expect(dotVector3(state.initialTangent, aircraftForward)).toBeGreaterThan(0.8)
    expect(dotVector3(state.initialTangent, aircraftDown)).toBeGreaterThan(0.2)
    expect(state.initialTangent.y).toBeLessThan(-0.1)
    expect(dotVector3(targetDirection, aircraftForward)).toBeGreaterThan(20)
    expect(state.phase).toBe('in-flight')
    expect(state.visible).toBe(true)
    expect(state.powered).toBe(false)
    expect(state.hasContinuousFlame).toBe(false)
    expect(state.bodyColor).toBe('#202522')
  })

  it.each(AIR_GROUND_STRIKES)('$id never rises above release and lands exactly on its target', (definition) => {
    const sourcePose = deriveSimulationWorldState(definition.releaseAtSeconds).aircraft[definition.sourceAircraftId].pose
    const releaseState = deriveAirGroundWeaponState(definition, definition.releaseAtSeconds, sourcePose)
    const samples = Array.from({ length: 21 }, (_, index) => {
      const amount = index / 20
      const time = definition.releaseAtSeconds + (definition.impactAtSeconds - definition.releaseAtSeconds) * amount
      return deriveAirGroundWeaponState(definition, time, sourcePose)
    })
    const impact = samples.at(-1)

    expect(samples.every((sample) => sample.position.y <= releaseState.releasePosition.y + 1e-9)).toBe(true)
    expect(impact?.phase).toBe('impacted')
    expect(impact?.visible).toBe(false)
    expect(impact?.position).toEqual(definition.targetPosition)
    expect(impact?.progress).toBe(1)
  })

  it('reconstructs mid-flight positions identically from arbitrary direct seeks', () => {
    const first = deriveSimulationWorldState(76).stage3.weapons.industrial_pipeline_hit
    const second = deriveSimulationWorldState(76).stage3.weapons.industrial_pipeline_hit
    expect(first).toEqual(second)
    expect(first.phase).toBe('in-flight')
    expect(first.progress).toBe(0.5)
    expect(first.position).not.toEqual(first.releasePosition)
    expect(first.position).not.toEqual(first.targetPosition)
  })
})

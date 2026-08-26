import { describe, expect, it } from 'vitest'

import { BTR80_DIMENSIONS_METERS, BTR80_GROUND_CLEARANCE_METERS, BTR80_VEHICLE_IDS, deriveBtr80GroupState, deriveSimulationWorldState, getBtr80PresentationSurfaceHeight, sampleBtr80MotionPath } from '.'
import { createSimulationStore, getSimulationWorldState } from './store'

function distanceXZ(left: { readonly x: number; readonly z: number }, right: { readonly x: number; readonly z: number }) {
  return Math.hypot(right.x - left.x, right.z - left.z)
}

function angleDifference(left: number, right: number) {
  return Math.abs(Math.atan2(Math.sin(right - left), Math.cos(right - left)))
}

describe('Stage 4B deterministic BTR-80 lifecycle', () => {
  it('creates exactly the authoritative four-vehicle defender group with safe authored hold spacing', () => {
    const group = deriveBtr80GroupState(0)
    expect(group.id).toBe('defender_btr_group_01')
    expect(group.factionId).toBe('island_defender')
    expect(group.orderedVehicleIds).toEqual(BTR80_VEHICLE_IDS)
    expect(Object.keys(group.vehicles)).toHaveLength(4)

    const ordered = group.orderedVehicleIds.map((id) => group.vehicles[id])
    expect(ordered.every((vehicle) => vehicle.factionId === 'island_defender' && vehicle.vehicleType === 'BTR-80')).toBe(true)
    expect(ordered[0]!.pose.position.x).toBeLessThan(ordered[1]!.pose.position.x)
    expect(ordered[0]!.pose.position.z).toBeGreaterThan(ordered[1]!.pose.position.z)
    for (let index = 1; index < ordered.length; index += 1) expect(distanceXZ(ordered[index - 1]!.pose.position, ordered[index]!.pose.position)).toBeGreaterThanOrEqual(22.9)
    expect(distanceXZ(ordered[0]!.pose.position, { x: 1_300, z: 1_000 })).toBeLessThan(3)
  })

  it('uses the exact internal phases and official loss/fallback thresholds', () => {
    expect(deriveBtr80GroupState(74.9).activity).toBe('security-hold')
    expect(deriveBtr80GroupState(75).activity).toBe('alerted')
    expect(deriveBtr80GroupState(75.1).activity).toBe('moving-to-support')
    expect(deriveBtr80GroupState(117.9).activity).toBe('moving-to-support')
    expect(deriveBtr80GroupState(118).activity).toBe('supporting')

    const beforeLoss = deriveBtr80GroupState(132.9)
    expect(beforeLoss.operationalCount).toBe(4)
    expect(beforeLoss.disabledCount).toBe(0)
    expect(beforeLoss.orderedVehicleIds.every((id) => beforeLoss.vehicles[id].outcome === 'active')).toBe(true)

    const loss = deriveBtr80GroupState(133)
    expect(loss.operationalCount).toBe(3)
    expect(loss.disabledCount).toBe(1)
    expect(loss.vehicles.defender_btr_01).toMatchObject({ activity: 'supporting', physicalCondition: 'disabled', outcome: 'lost' })
    expect(loss.vehicles.defender_btr_01.damage.causeEventId).toBe('ammunition_storage_primary_detonation')
    for (const id of BTR80_VEHICLE_IDS.slice(1)) expect(loss.vehicles[id]).toMatchObject({ activity: 'supporting', physicalCondition: 'operational', outcome: 'active' })

    expect(deriveBtr80GroupState(135.9).withdrawingCount).toBe(0)
    const fallback = deriveBtr80GroupState(136)
    expect(fallback.withdrawingCount).toBe(3)
    expect(fallback.vehicles.defender_btr_01.activity).toBe('supporting')
    for (const id of BTR80_VEHICLE_IDS.slice(1)) expect(fallback.vehicles[id]).toMatchObject({ activity: 'turning-to-withdraw', physicalCondition: 'operational', outcome: 'survived' })
    for (const id of BTR80_VEHICLE_IDS.slice(1)) expect(deriveBtr80GroupState(160).vehicles[id].activity).toBe('withdrawing')
  })

  it('keeps the lead wreck fixed and restores it when seeking backward', () => {
    const atLoss = deriveBtr80GroupState(133).vehicles.defender_btr_01
    const late = deriveBtr80GroupState(172).vehicles.defender_btr_01
    expect(late.pose.position).toEqual(atLoss.pose.position)
    expect(late.traveledDistanceMeters).toBe(atLoss.traveledDistanceMeters)
    expect(late.wheelRotationRadians).toBe(atLoss.wheelRotationRadians)
    expect(late.physicalCondition).toBe('disabled')
    expect(late.damage.hullDamageProgress).toBe(1)
    expect(late.damage.smokeIntensity).toBeGreaterThan(0)

    const restored = deriveBtr80GroupState(120).vehicles.defender_btr_01
    expect(restored.physicalCondition).toBe('operational')
    expect(restored.outcome).toBe('active')
    expect(restored.damage.causeEventId).toBeNull()
    expect(restored.damage.flashIntensity).toBe(0)
    expect(restored.damage.smokeIntensity).toBe(0)
  })

  it('reconstructs identical state by direct seek, restart, and playback speed', () => {
    const directSeekStore = createSimulationStore()
    directSeekStore.getState().seek(143.7)
    const firstDirectSeek = getSimulationWorldState(directSeekStore).stage4b
    directSeekStore.getState().seek(160)
    directSeekStore.getState().seek(143.7)
    expect(getSimulationWorldState(directSeekStore).stage4b).toEqual(firstDirectSeek)
    expect(firstDirectSeek).toEqual(deriveSimulationWorldState(143.7).stage4b)

    const store = createSimulationStore()
    store.getState().seek(160)
    store.getState().restart()
    const restarted = getSimulationWorldState(store).stage4b.btrGroup
    expect(restarted.activity).toBe('security-hold')
    expect(restarted.operationalCount).toBe(4)
    expect(restarted.withdrawingCount).toBe(0)

    const outcomes = ([0.5, 1, 2] as const).map((speed) => {
      const speedStore = createSimulationStore({ isPlaying: true, speed })
      speedStore.getState().tick(160 / speed)
      const group = getSimulationWorldState(speedStore).stage4b.btrGroup
      return group.orderedVehicleIds.map((id) => ({ activity: group.vehicles[id].activity, condition: group.vehicles[id].physicalCondition, outcome: group.vehicles[id].outcome, position: group.vehicles[id].pose.position }))
    })
    expect(outcomes[1]).toEqual(outcomes[0])
    expect(outcomes[2]).toEqual(outcomes[0])
  })

  it('keeps the true motion path position-continuous at every authored threshold', () => {
    for (const [before, boundary] of [
      [74.9, 75],
      [117.9, 118],
      [132.9, 133],
      [135.9, 136],
    ] as const) {
      for (const id of BTR80_VEHICLE_IDS) expect(distanceXZ(sampleBtr80MotionPath(id, before), sampleBtr80MotionPath(id, boundary))).toBeLessThan(0.02)
    }
  })

  it('keeps authored speed, acceleration, steering, and actual path derivatives bounded', () => {
    let maximumDerivedSpeed = 0
    let maximumActualSpeed = 0
    let maximumAcceleration = 0
    let maximumSteering = 0
    for (let time = 0; time <= 172; time += 0.1) {
      const group = deriveBtr80GroupState(time)
      for (const id of BTR80_VEHICLE_IDS) {
        const state = group.vehicles[id]
        maximumDerivedSpeed = Math.max(maximumDerivedSpeed, state.speedMetersPerSecond)
        maximumAcceleration = Math.max(maximumAcceleration, Math.abs(state.accelerationMetersPerSecondSquared))
        maximumSteering = Math.max(maximumSteering, Math.abs(state.steeringRadians))
        if (time >= 0.05 && time <= 171.95) {
          const before = sampleBtr80MotionPath(id, time - 0.05)
          const after = sampleBtr80MotionPath(id, time + 0.05)
          maximumActualSpeed = Math.max(maximumActualSpeed, distanceXZ(before, after) / 0.1)
        }
      }
    }
    expect(maximumDerivedSpeed).toBeLessThanOrEqual(22)
    expect(maximumActualSpeed).toBeLessThanOrEqual(22.1)
    expect(maximumAcceleration).toBeLessThanOrEqual(1.8)
    expect(maximumSteering).toBeLessThanOrEqual(0.58)
  })

  it('aligns visible heading with the centered tangent of the actual moving path', () => {
    for (const time of [80, 92, 110, 137.5, 142, 150, 165, 171]) {
      const group = deriveBtr80GroupState(time)
      for (const id of BTR80_VEHICLE_IDS) {
        const state = group.vehicles[id]
        if (state.speedMetersPerSecond < 0.25) continue
        const before = sampleBtr80MotionPath(id, time - 0.02)
        const after = sampleBtr80MotionPath(id, time + 0.02)
        const actualYaw = Math.atan2(-(after.x - before.x), -(after.z - before.z))
        expect(angleDifference(actualYaw, state.pose.rotation.y)).toBeLessThan((2.2 * Math.PI) / 180)
        const visibleForward = { x: -Math.sin(state.pose.rotation.y), z: -Math.cos(state.pose.rotation.y) }
        expect(visibleForward.x * state.routeTangent.x + visibleForward.z * state.routeTangent.z).toBeGreaterThan(0.999)
      }
    }
  })

  it('prevents overlap throughout holds, turns, and withdrawal while visibly adjusting spacing', () => {
    let minimumSeparation = Number.POSITIVE_INFINITY
    for (let time = 0; time <= 172; time += 0.25) {
      const group = deriveBtr80GroupState(time)
      const vehicles = group.orderedVehicleIds.map((id) => group.vehicles[id])
      for (let first = 0; first < vehicles.length; first += 1) {
        for (let second = first + 1; second < vehicles.length; second += 1) minimumSeparation = Math.min(minimumSeparation, distanceXZ(vehicles[first]!.pose.position, vehicles[second]!.pose.position))
      }
    }
    expect(minimumSeparation).toBeGreaterThan(BTR80_DIMENSIONS_METERS.length + 1.5)
    const support = deriveBtr80GroupState(135.9)
    const final = deriveBtr80GroupState(172)
    const supportGap23 = distanceXZ(support.vehicles.defender_btr_02.pose.position, support.vehicles.defender_btr_03.pose.position)
    const supportGap34 = distanceXZ(support.vehicles.defender_btr_03.pose.position, support.vehicles.defender_btr_04.pose.position)
    expect(distanceXZ(final.vehicles.defender_btr_02.pose.position, final.vehicles.defender_btr_03.pose.position)).toBeGreaterThan(supportGap23 + 7)
    expect(distanceXZ(final.vehicles.defender_btr_03.pose.position, final.vehicles.defender_btr_04.pose.position)).toBeGreaterThan(supportGap34 + 7)
  })

  it('grounds the centered model on the rendered road surface with explicit clearance', () => {
    for (const time of [0, 80, 118, 133, 140, 160, 172]) {
      const group = deriveBtr80GroupState(time)
      for (const id of BTR80_VEHICLE_IDS) {
        const position = group.vehicles[id].pose.position
        const expectedOriginY = getBtr80PresentationSurfaceHeight(position.x, position.z) + BTR80_DIMENSIONS_METERS.height / 2 + BTR80_GROUND_CLEARANCE_METERS
        expect(position.y).toBeCloseTo(expectedOriginY, 8)
      }
    }
  })

  it('derives wheel travel, dust, and damage visibility only from absolute time', () => {
    const moving = deriveBtr80GroupState(90).vehicles.defender_btr_03
    expect(moving.dustIntensity).toBeGreaterThan(0)
    expect(moving.wheelRotationRadians).toBeCloseTo(moving.traveledDistanceMeters / BTR80_DIMENSIONS_METERS.wheelRadius, 10)
    expect(deriveBtr80GroupState(90).vehicles.defender_btr_03.wheelRotationRadians).toBe(moving.wheelRotationRadians)
    expect(deriveBtr80GroupState(74.9).vehicles.defender_btr_03.dustIntensity).toBe(0)
    expect(deriveBtr80GroupState(118).vehicles.defender_btr_03.dustIntensity).toBe(0)
    expect(deriveBtr80GroupState(132.9).vehicles.defender_btr_01.damage.flashIntensity).toBe(0)
    expect(deriveBtr80GroupState(133).vehicles.defender_btr_01.damage.flashIntensity).toBe(1)
    expect(deriveBtr80GroupState(120).vehicles.defender_btr_01.damage).toMatchObject({ flashIntensity: 0, smokeIntensity: 0, hullDamageProgress: 0 })
  })

  it('continues the three survivors toward the eastern hold area without extending the timeline', () => {
    const support = deriveBtr80GroupState(136)
    const final = deriveBtr80GroupState(172)
    for (const id of BTR80_VEHICLE_IDS.slice(1)) {
      expect(distanceXZ(final.vehicles[id].pose.position, { x: 1_300, z: 1_000 })).toBeLessThan(distanceXZ(support.vehicles[id].pose.position, { x: 1_300, z: 1_000 }))
      expect(final.vehicles[id]).toMatchObject({ physicalCondition: 'operational', outcome: 'survived' })
    }
    expect(final.withdrawingCount).toBe(3)
  })
})

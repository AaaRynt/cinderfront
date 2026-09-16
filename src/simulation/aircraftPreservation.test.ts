import { describe, expect, it } from 'vitest'

import type { Vector3 } from './types'

import { deriveSimulationWorldState } from './derive'
import { PRESERVED_F35_SAMPLES, PRESERVED_GROUND_SAMPLES, PRESERVED_WEAPON_SAMPLES } from './fixtures/stage4b2aPreservation'
import { AIR_GROUND_STRIKE_BY_ID } from './weapons'

function components(vector: Vector3) {
  return [vector.x, vector.y, vector.z]
}

/** Permit only floating-point roundoff, not a changed authored trajectory. */
function expectGolden(actual: unknown, expected: unknown, context: string): void {
  if (typeof expected === 'number') {
    expect(actual, context).toBeCloseTo(expected, 9)
  } else if (Array.isArray(expected)) {
    expect(Array.isArray(actual), context).toBe(true)
    expect(actual, context).toHaveLength(expected.length)
    expected.forEach((value, index) => expectGolden((actual as unknown[])[index], value, `${context}[${index}]`))
  } else if (expected !== null && typeof expected === 'object') {
    expect(actual, context).toBeTypeOf('object')
    expect(Object.keys(actual as object), context).toEqual(Object.keys(expected))
    for (const [key, value] of Object.entries(expected)) expectGolden((actual as Record<string, unknown>)[key], value, `${context}.${key}`)
  } else {
    expect(actual, context).toBe(expected)
  }
}

describe('immutable Stage 4B.2A behavior across the second-aircraft-family refactor', () => {
  it.each(PRESERVED_F35_SAMPLES)('preserves T+%s %s pose, kinematics, launch phase, and STOVL mechanics', (time, id, phase, launched, onDeck, kinematics, mechanical) => {
    const aircraft = deriveSimulationWorldState(time).aircraft[id]
    expect(aircraft).toMatchObject({ id, factionId: 'landings_attacker', phase, launched, onDeck })
    expectGolden([...components(aircraft.pose.position), ...components(aircraft.pose.rotation), aircraft.speedMetersPerSecond, aircraft.turnRateRadiansPerSecond, aircraft.bankRadians], kinematics, `${id} T+${time} motion`)
    expectGolden([aircraft.mechanical.liftFanDoor, aircraft.mechanical.rearNozzleDeflectionDegrees, aircraft.mechanical.landingGearRetraction, aircraft.mechanical.downwashStrength, aircraft.mechanical.heatHazeStrength], mechanical, `${id} T+${time} mechanics`)
  })

  it.each(PRESERVED_WEAPON_SAMPLES)('preserves %s release, midpoint, impact, and flight tangents', (id, releaseTime, impactTime, releasePosition, midpointPosition, impactPosition, initialTangent, midpointTangent) => {
    expect(AIR_GROUND_STRIKE_BY_ID[id]).toMatchObject({ releaseAtSeconds: releaseTime, impactAtSeconds: impactTime })
    const release = deriveSimulationWorldState(releaseTime).stage3.weapons[id]
    const midpoint = deriveSimulationWorldState((releaseTime + impactTime) / 2).stage3.weapons[id]
    const impact = deriveSimulationWorldState(impactTime).stage3.weapons[id]
    expect(release).toMatchObject({ phase: 'in-flight', visible: true, progress: 0 })
    expect(midpoint).toMatchObject({ phase: 'in-flight', visible: true })
    expect(midpoint.progress).toBeCloseTo(0.5, 12)
    expect(impact).toMatchObject({ phase: 'impacted', visible: false, progress: 1 })
    expectGolden(components(release.releasePosition), releasePosition, `${id} release position`)
    expectGolden(components(release.position), releasePosition, `${id} release origin`)
    expectGolden(components(midpoint.position), midpointPosition, `${id} midpoint position`)
    expectGolden(components(impact.position), impactPosition, `${id} impact position`)
    expectGolden(components(release.initialTangent), initialTangent, `${id} initial tangent`)
    expectGolden(components(midpoint.tangent), midpointTangent, `${id} midpoint tangent`)
  })

  it.each(PRESERVED_GROUND_SAMPLES)('preserves T+%s %s lifecycle, pose, running gear, and damage', (time, id, activity, physicalCondition, outcome, motionDirection, kinematics, drivetrain, damage) => {
    const world = deriveSimulationWorldState(time)
    const vehicle = { ...world.stage4b.btrGroup.vehicles, ...world.stage4b.t72Group.vehicles }[id]
    expect(vehicle).toMatchObject({ id, factionId: 'island_defender', activity, physicalCondition, outcome, motionDirection })
    expectGolden(
      [...components(vehicle.pose.position), ...components(vehicle.pose.rotation), ...components(vehicle.routeTangent), vehicle.speedMetersPerSecond, vehicle.longitudinalSpeedMetersPerSecond, vehicle.accelerationMetersPerSecondSquared, vehicle.turretYawRadians, vehicle.traveledDistanceMeters, vehicle.dustIntensity],
      kinematics,
      `${id} T+${time} motion`,
    )
    expectGolden(vehicle.drivetrain, drivetrain, `${id} T+${time} drivetrain`)
    expectGolden(vehicle.damage, damage, `${id} T+${time} damage`)
  })
})

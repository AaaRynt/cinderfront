/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Euler, Group, Mesh, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { F35BModel } from '../scene/vehicles/F35BModel'
import { MAP_BOUNDS } from '../scene/world/worldData'
import { appendModel } from '../test/inspectModel'
import { deriveRuntimeAircraft } from './aftermathAircraft'
import { deriveSimulationWorldState } from './derive'
import { deriveRuntimeWorldState } from './runtime'

const ids = ['attacker_f35_01', 'attacker_f35_02'] as const
const boundary = deriveSimulationWorldState(180)
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

describe('Stage 6B aircraft egress', () => {
  it('preserves active scripted actors and the exact handoff before continuing the final velocity', () => {
    for (const time of [0, 5, 13, 63, 140, 160, 179, 179.99, 180]) expect(deriveRuntimeWorldState(time).aircraft).toEqual(deriveSimulationWorldState(time).aircraft)
    expect(deriveRuntimeAircraft(180).aircraft).toEqual(boundary.aircraft)
    const prior = deriveSimulationWorldState(179.99),
      epsilon = 0.0001
    for (const id of ids) {
      const anchor = boundary.aircraft[id],
        after = deriveRuntimeAircraft(180 + epsilon).aircraft[id]
      expect(after.mechanical).toEqual(anchor.mechanical)
      expect(after.pose.rotation).toEqual(anchor.pose.rotation)
      expect(after).toMatchObject({ id, factionId: anchor.factionId, launched: true, onDeck: false, phase: anchor.phase, speedMetersPerSecond: anchor.speedMetersPerSecond })
      expect(distance(anchor.pose.position, after.pose.position) / epsilon).toBeCloseTo(distance(anchor.pose.position, prior.aircraft[id].pose.position) / 0.01, 5)
    }
    for (const id of ['defender_su30_01', 'defender_su30_02'] as const)
      for (const time of [180, 240, 360, 600, 1800, 3600, 7200]) {
        const current = deriveRuntimeWorldState(time).aircraft[id]
        expect(current).toEqual(boundary.aircraft[id])
        expect(current.visible).toBe(false)
      }
  })

  it('departs beyond the complete outgoing body boundary and retains finite terminal poses without re-entry', () => {
    const measurements: Record<string, unknown> = {}
    for (const id of ids) {
      const departure = deriveRuntimeAircraft(180).presentation[id].departedAtSeconds
      const root = new Group(),
        mechanical = boundary.aircraft[id].mechanical
      appendModel(root, <F35BModel enginePower={1} fanRotationRadians={0} gearDeployment={1 - mechanical.landingGearRetraction} liftFanDoor={mechanical.liftFanDoor} nozzleDeflection={mechanical.rearNozzleDeflectionDegrees / 90} />)
      root.updateMatrixWorld(true)
      const vertices: Vector3[] = []
      root.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.computeBoundingBox()
          const b = o.geometry.boundingBox!
          for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) vertices.push(new Vector3(x, y, z).applyMatrix4(o.matrixWorld))
        }
      })
      const terminal = deriveRuntimeAircraft(7200).aircraft[id],
        velocity = distance(boundary.aircraft[id].pose.position, deriveSimulationWorldState(179.99).aircraft[id].pose.position) / 0.01
      expect(departure).toBeGreaterThan(180)
      expect(deriveRuntimeAircraft(departure - 0.001).presentation[id]).toMatchObject({ visible: true })
      expect(deriveRuntimeAircraft(departure).presentation[id]).toMatchObject({ visible: false })
      const departed = deriveRuntimeAircraft(departure).aircraft[id],
        p = departed.pose.position,
        r = departed.pose.rotation
      let entireBodyBoundaryGap = Infinity
      for (const local of vertices) {
        const v = local
          .clone()
          .applyEuler(new Euler(r.x, r.y, r.z))
          .add(new Vector3(p.x, p.y, p.z))
        entireBodyBoundaryGap = Math.min(entireBodyBoundaryGap, MAP_BOUNDS.zMin - v.z)
      }
      expect(entireBodyBoundaryGap).toBeGreaterThan(1)
      expect(terminal.pose.position.z).toBeCloseTo(deriveRuntimeAircraft(7200).presentation[id].terminalZ, 8)
      expect(terminal.pose.position.z).toBeLessThanOrEqual(-5200)
      expect(terminal.speedMetersPerSecond).toBe(0)
      for (const time of [240, 360, 600, 1800, 3600, 7200]) {
        const state = deriveRuntimeWorldState(time)
        expect(state.runtime.aircraft?.[id]).toMatchObject({ visible: false })
        expect(state.aircraft[id]).toEqual(terminal)
        expect(Object.values(state.aircraft[id].pose.position).every(Number.isFinite)).toBe(true)
      }
      measurements[id] = { departure, velocityMetersPerSecond: velocity, completeModelEnvelopeVertices: vertices.length, entireBodyBoundaryGap, terminalPose: terminal.pose }
    }
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync('stage6b-review.local/aircraft-departure.json', JSON.stringify(measurements, null, 2))
  })

  it('reconstructs egress deterministically after late and backward seeks', () => {
    const times = [180, 180.01, 181, 182, 188, 240, 360, 600, 1800, 3600, 7200]
    const snapshots = times.map((time) => deriveRuntimeAircraft(time))
    for (const time of [7200, 179, 160, 0]) deriveRuntimeWorldState(time)
    for (const [index, time] of times.entries()) expect(deriveRuntimeAircraft(time)).toEqual(snapshots[index])
  })
})

/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { isValidElement, type ReactNode } from 'react'
import { Euler, Group, InstancedMesh, Matrix4, Mesh, Vector3, type BufferGeometry, type Material, type Object3D } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { Btr80Model } from '../scene/vehicles/Btr80Model'
import { MolniyaModel } from '../scene/vehicles/MolniyaModel'
import { SupportVehicleModel } from '../scene/vehicles/SupportVehicleModel'
import { T72BModel } from '../scene/vehicles/T72BModel'
import { MAP_BOUNDS } from '../scene/world/worldData'
import { deriveRuntimeBtrGroupState, deriveRuntimeMolniyaState, deriveRuntimeSupportConvoyState, deriveRuntimeT72GroupState, SURVIVOR_CONTINUATION_LIMITS } from './aftermathSurvivors'
import { BTR80_DIMENSIONS_METERS, T72_DIMENSIONS_METERS } from './groundVehicles'
import { SUPPORT_DIMENSIONS } from './supportConvoy'

// Inspect these static model trees without a WebGL renderer. Refs and layout
// effects still run in order, so actual missile-bank instance transforms count.
const layout = vi.hoisted(() => ({ effects: [] as (() => void)[] }))
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useRef: (current: unknown) => ({ current }),
  useLayoutEffect: (effect: () => void) => {
    layout.effects.push(effect)
  },
}))
interface Props {
  children?: ReactNode
  args?: [BufferGeometry, Material, number]
  geometry?: BufferGeometry
  material?: Material
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  name?: string
  ref?: { current: Object3D | null }
}
function appendCompleteModel(parent: Object3D, node: ReactNode) {
  if (Array.isArray(node)) {
    node.forEach((n) => appendCompleteModel(parent, n))
    return
  }
  if (!isValidElement<Props>(node)) return
  const type: unknown = node.type
  if (typeof type === 'function') {
    appendCompleteModel(parent, (type as (props: Props) => ReactNode)(node.props))
    return
  }
  if (typeof type === 'object' && type && 'type' in type && typeof type.type === 'function') {
    appendCompleteModel(parent, (type.type as (props: Props) => ReactNode)(node.props))
    return
  }
  if (typeof type !== 'string') {
    appendCompleteModel(parent, node.props.children)
    return
  }
  const p = node.props,
    object = type === 'instancedMesh' ? new InstancedMesh(...p.args!) : type === 'mesh' ? new Mesh(p.geometry, p.material) : new Group()
  object.name = p.name ?? ''
  if (p.position) object.position.fromArray(p.position)
  if (p.rotation) object.rotation.set(...p.rotation)
  if (typeof p.scale === 'number') object.scale.setScalar(p.scale)
  else if (p.scale) object.scale.fromArray(p.scale)
  if (p.ref) p.ref.current = object
  parent.add(object)
  appendCompleteModel(object, p.children)
}
function corners(node: ReactNode) {
  layout.effects.length = 0
  const root = new Group()
  appendCompleteModel(root, node)
  layout.effects.forEach((effect) => effect())
  layout.effects.length = 0
  root.updateMatrixWorld(true)
  const points: Vector3[] = [],
    instance = new Matrix4()
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return
    o.geometry.computeBoundingBox()
    const b = o.geometry.boundingBox!
    for (let i = 0; i < (o instanceof InstancedMesh ? o.count : 1); i++) {
      const transform = o instanceof InstancedMesh ? (o.getMatrixAt(i, instance), new Matrix4().multiplyMatrices(o.matrixWorld, instance)) : o.matrixWorld
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) points.push(new Vector3(x, y, z).applyMatrix4(transform))
    }
  })
  return points
}

describe('Stage 6B complete rendered survivor envelopes', () => {
  it('encloses actual guns, rotating wheels/tracks and all support loads throughout continuation', () => {
    const maxima = { btr: 0, t72: 0, support: 0 },
      counts = { btr: 0, t72: 0, support: 0 }
    for (const time of [180, 180.25, 181, 181.75, 182, 183.75, 186, 187.49, 187.5, 218, 220, 224, 7200]) {
      for (const v of Object.values(deriveRuntimeBtrGroupState(time).vehicles)) {
        const r = v.pose.rotation,
          vertices = corners(<Btr80Model turretYawRadians={v.turretYawRadians} disabled={v.physicalCondition !== 'operational'} damageProgress={v.damage.hullDamageProgress} steeringRadians={v.drivetrain.steeringRadians} wheelRotationRadians={v.drivetrain.wheelRotationRadians} />)
        counts.btr = Math.max(counts.btr, vertices.length)
        for (const local of vertices) {
          const p = local.applyEuler(new Euler(r.x, r.y, r.z, 'YXZ'))
          maxima.btr = Math.max(maxima.btr, Math.hypot(p.x, p.z))
        }
      }
      for (const v of Object.values(deriveRuntimeT72GroupState(time).vehicles)) {
        const r = v.pose.rotation,
          vertices = corners(<T72BModel turretYawRadians={v.turretYawRadians} destroyed={v.physicalCondition !== 'operational'} damageProgress={v.damage.hullDamageProgress} trackTravelMeters={v.drivetrain.trackTravelMeters} roadWheelRotationRadians={v.drivetrain.roadWheelRotationRadians} />)
        counts.t72 = Math.max(counts.t72, vertices.length)
        for (const local of vertices) {
          const p = local.applyEuler(new Euler(r.x, r.y, r.z, 'YXZ'))
          maxima.t72 = Math.max(maxima.t72, Math.hypot(p.x, p.z))
        }
      }
      for (const v of Object.values(deriveRuntimeSupportConvoyState(time).convoy.vehicles)) {
        const r = v.pose.rotation,
          vertices = corners(<SupportVehicleModel subtype={v.subtype} alternateLoad={v.id === 'defender_support_logistics_02'} wheelRotationRadians={v.drivetrain.wheelRotationRadians} steeringRadians={v.drivetrain.steeringRadians} lighting={v.lighting} />)
        counts.support = Math.max(counts.support, vertices.length)
        const d = SUPPORT_DIMENSIONS[v.subtype]
        for (const local of vertices) {
          const p = local.applyEuler(new Euler(r.x, r.y, r.z, 'YXZ'))
          const radius = Math.hypot(p.x, p.z)
          maxima.support = Math.max(maxima.support, radius)
          expect(radius + 1).toBeLessThan(Math.hypot(d.length, d.width) / 2 + 2)
        }
      }
    }
    // The T72 count includes the memoized static turret/body, rather than
    // accidentally inspecting only its track assemblies.
    expect(counts.t72).toBeGreaterThan(900)
    expect(maxima.t72).toBeGreaterThan(5.9)
    expect(maxima.btr + 1).toBeLessThan(Math.hypot(BTR80_DIMENSIONS_METERS.length, BTR80_DIMENSIONS_METERS.width) / 2 + 2)
    expect(maxima.t72 + 1).toBeLessThan(Math.hypot(T72_DIMENSIONS_METERS.gunForwardLength - T72_DIMENSIONS_METERS.hullLength / 2, T72_DIMENSIONS_METERS.width / 2) + 2)
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync('stage6b-review.local/survivor-model-envelopes.json', JSON.stringify({ maxima, counts }, null, 2))
  })

  it('measures all Molniya model parts and instances through the full-hull boundary crossing', () => {
    const vertices = corners(<MolniyaModel />),
      extent = SURVIVOR_CONTINUATION_LIMITS.molniya.xEnvelopeMeters
    let maximumXExtent = 0
    const extrema = (time: number) => {
      const state = deriveRuntimeMolniyaState(time),
        p = state.pose.position,
        r = state.pose.rotation
      // Match the actual rendered bob/roll, including its retained phase.
      const rotation = new Euler(r.x, r.y, r.z + Math.sin(time * 0.31 + 0.2) * 0.0025)
      let min = Infinity,
        max = -Infinity
      for (const local of vertices) {
        const v = local.clone().applyEuler(rotation)
        maximumXExtent = Math.max(maximumXExtent, Math.abs(v.x))
        min = Math.min(min, p.x + v.x)
        max = Math.max(max, p.x + v.x)
      }
      return { min, max }
    }
    for (let tick = 0; tick <= 760; tick++) extrema(180 + tick / 8)
    expect(vertices.length).toBeGreaterThan(300)
    expect(maximumXExtent).toBeLessThan(extent)
    const first = SURVIVOR_CONTINUATION_LIMITS.molniya.firstHullExitSeconds,
      full = SURVIVOR_CONTINUATION_LIMITS.molniya.fullHullExitSeconds
    expect(extrema(first).min).toBeGreaterThan(MAP_BOUNDS.xMin)
    expect(extrema(full).max).toBeLessThan(MAP_BOUNDS.xMin)
    function crossing(which: 'min' | 'max') {
      let low = first - 2,
        high = full + 2
      for (let i = 0; i < 45; i++) {
        const middle = (low + high) / 2
        if (extrema(middle)[which] > MAP_BOUNDS.xMin) low = middle
        else high = middle
      }
      return (low + high) / 2
    }
    const measuredFirstHullExit = crossing('min'),
      measuredFullHullExit = crossing('max')
    expect(measuredFirstHullExit).toBeGreaterThan(first)
    expect(measuredFullHullExit).toBeLessThan(full)
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1')
      writeFileSync('stage6b-review.local/molniya-clearance.json', JSON.stringify({ completeModelEnvelopeVertices: vertices.length, maximumXExtent, conservativeXExtent: extent, measuredFirstHullExit, measuredFullHullExit, fadeStarts: first, emissionEnds: full }, null, 2))
  })
})

/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { afterAll, describe, expect, it, vi } from 'vitest'

import { deriveLandingWorldState } from '@/simulation/landingCraft'
import { landingRampPoint, transformLandingPoint } from '@/simulation/landingCraftContact'
import { LCAC_DIMENSIONS, LCAC_IDS, LCAC_RAMP, LAV_DIMENSIONS } from '@/simulation/landingCraftData'
import { appendModel as append } from '@/test/inspectModel'

import { getLandingSupportHeight } from '../world/landing/landingTerrain'
import { createLandingModelResources } from './landingModelResources'
import { LcacModel, Lav25Model } from './LandingModels'

const resources = createLandingModelResources()
afterAll(() => resources.dispose())
function model(id: (typeof LCAC_IDS)[number], time: number, closed = false, worldPose = false) {
  const state = deriveLandingWorldState(time),
    craft = state.crafts[id],
    root = new THREE.Group()
  const children = craft.payloadIds.map((payloadId) => {
    const payload = state.payload[payloadId],
      p = payload.localPose.position,
      r = payload.localPose.rotation
    return (
      <group key={payloadId} name={payloadId} position={[p.x, p.y, p.z]} rotation={[r.x, r.y, r.z, 'YXZ']}>
        <Lav25Model resources={resources} wheels={payload.wheels} />
      </group>
    )
  })
  append(root, <LcacModel resources={resources} mechanics={closed ? { ...craft.mechanics, bowRampAngleRadians: LCAC_RAMP.closedAngle } : craft.mechanics} />)
  append(root, children)
  if (worldPose) {
    root.position.set(craft.pose.position.x, craft.pose.position.y, craft.pose.position.z)
    root.rotation.set(craft.pose.rotation.x, craft.pose.rotation.y, craft.pose.rotation.z, 'YXZ')
  }
  root.updateMatrixWorld(true)
  return { root, craft, state }
}
const bounds = (object: THREE.Object3D) => new THREE.Box3().setFromObject(object, true)
function meshes(root: THREE.Object3D, name: string) {
  const found: THREE.Object3D[] = []
  root.traverse((o) => {
    if (o.name === name) found.push(o)
  })
  return found
}

describe('LCAC and LAV-25 actual rendered geometry', () => {
  it('uses the reference hull, eight wheels, sloped front, centered barrel and sealed hatches', () => {
    const root = new THREE.Group()
    append(root, <Lav25Model resources={resources} />)
    root.updateMatrixWorld(true)
    const hull = bounds(root.getObjectByName('lav25-hull')!),
      all = bounds(root)
    expect(hull.getSize(new THREE.Vector3()).x).toBeCloseTo(LAV_DIMENSIONS.hullWidth, 6)
    expect(hull.getSize(new THREE.Vector3()).z).toBeCloseTo(LAV_DIMENSIONS.hullLength, 6)
    expect(all.max.y).toBeCloseTo(LAV_DIMENSIONS.height, 6)
    expect(all.min.y).toBeCloseTo(0, 6)
    expect(all.getSize(new THREE.Vector3()).x).toBeLessThan(3)
    expect(-all.min.z - LAV_DIMENSIONS.hullLength / 2).toBeCloseTo(0.555, 6)
    for (const side of [-1, 1]) for (let axle = 0; axle < 4; axle++) expect(bounds(root.getObjectByName(`lav25-wheel-${side}-${axle}`)!).min.y).toBeCloseTo(0, 6)
    expect(root.getObjectByName('lav25-cannon')!.position.x).toBe(0)
    expect(root.getObjectByName('lav25-closed-hatch')).toBeDefined()
    expect(root.getObjectByName('lav25-driver-hatch-closed')).toBeDefined()
    const p = resources.geometry.hull.getAttribute('position'),
      n = resources.geometry.hull.getAttribute('normal')
    expect(Array.from({ length: p.count }, (_, i) => [p.getY(i), n.getY(i)]).some(([y, ny]) => y! > 1.6 && ny! > 0.99)).toBe(true)
    expect(resources.material.glass.transparent).toBe(false)
    expect(resources.material.glass.opacity).toBe(1)
    expect(resources.material.glass.color.getHex()).toBe(0x0f2229)
  })

  it('measures the closed transit and settled envelopes, deck and deployed length', () => {
    const transit = bounds(model(LCAC_IDS[0], 0).root.getObjectByName('lcac-model')!),
      settled = bounds(model(LCAC_IDS[0], 176, true).root.getObjectByName('lcac-model')!)
    expect(transit.getSize(new THREE.Vector3()).x).toBeCloseTo(LCAC_DIMENSIONS.width, 5)
    expect(transit.getSize(new THREE.Vector3()).z).toBeCloseTo(LCAC_DIMENSIONS.length, 5)
    expect(transit.max.y).toBeCloseTo(LCAC_DIMENSIONS.height, 5)
    expect(settled.max.y).toBeCloseTo(6.65, 5)
    for (const id of LCAC_IDS) {
      const { root, craft } = model(id, 176),
        deck = bounds(root.getObjectByName('lcac-cargo-deck')!)
      expect(deck.getSize(new THREE.Vector3()).x).toBeCloseTo(8.2, 6)
      expect(deck.getSize(new THREE.Vector3()).z).toBeCloseTo(20.4, 6)
      expect(deck.max.y).toBeCloseTo(craft.mechanics.deckLocalY, 6)
      expect(bounds(root.getObjectByName('lcac-model')!).getSize(new THREE.Vector3()).z).toBeGreaterThan(29)
      expect(bounds(root.getObjectByName('lcac-model')!).getSize(new THREE.Vector3()).z).toBeLessThan(30)
      expect(root.getObjectByName('lcac-stern-ramp-closed')).toBeDefined()
      expect(meshes(root, 'lcac-fan-duct')).toHaveLength(2)
      expect(meshes(root, 'lcac-fan-rotor')).toHaveLength(2)
    }
  })

  it('keeps all cargo, fans, side machinery and the complete ramp swing clear', () => {
    const measured = []
    for (const id of LCAC_IDS)
      for (const time of [0, 110, 141, 143, 152.4, 154.9, 155, 155.4, 156, 157, 158, 159.9, 162, 162.4, 163, 164, 165.9, 176]) {
        if (time > (id === LCAC_IDS[0] ? 160 : 166)) continue
        const { root, craft } = model(id, time),
          cargo = craft.payloadIds.map((pid) => bounds(root.getObjectByName(pid)!)),
          ramp = bounds(root.getObjectByName('lcac-bow-ramp-panel')!)
        const obstacles = [...meshes(root, 'lcac-side-machinery'), root.getObjectByName('lcac-sealed-control-cabin')!, root.getObjectByName('lcac-stern-ramp-closed')!, ...meshes(root, 'lcac-fan-duct')].map(bounds)
        for (let i = 0; i < cargo.length; i++) {
          const box = cargo[i]!
          expect(box.min.x).toBeGreaterThan(-4.1)
          expect(box.max.x).toBeLessThan(4.1)
          expect(box.min.z).toBeGreaterThan(-10.2)
          expect(box.max.z).toBeLessThan(10.2)
          expect(box.min.y).toBeCloseTo(craft.mechanics.deckLocalY, 6)
          expect(box.intersectsBox(ramp)).toBe(false)
          expect(obstacles.some((o) => box.intersectsBox(o))).toBe(false)
          for (let j = i + 1; j < cargo.length; j++) expect(box.intersectsBox(cargo[j]!)).toBe(false)
        }
        const first = root.getObjectByName(craft.payloadIds[0]!)!,
          deck = root.getObjectByName('lcac-cargo-deck')!
        const actual = first.getWorldPosition(new THREE.Vector3()),
          local = craft.payloadIds.map((pid) => root.getObjectByName(pid)!.position.toArray())
        expect(actual.y).toBeCloseTo(bounds(deck).max.y, 6)
        measured.push({
          id,
          time,
          local,
          cargoWidth: cargo[0]!.getSize(new THREE.Vector3()).x,
          sideDeckGap: 4.1 - cargo[1]!.max.x,
          betweenColumns: cargo[1]!.min.x - cargo[0]!.max.x,
          betweenRows: cargo[2]!.min.z - cargo[0]!.max.z,
          rampNoseGap: cargo[0]!.min.z - ramp.max.z,
          deployedLength: bounds(root.getObjectByName('lcac-model')!).getSize(new THREE.Vector3()).z,
        })
      }
    if (process.env.CINDERFRONT_STAGE5B_MEASUREMENTS === '1') writeFileSync('stage5b-review.local/model-measurements.json', JSON.stringify(measured, null, 2) + '\n')
  })

  it('grounds the actual rotated lower skirt and every ramp underside station through landing', () => {
    for (const id of LCAC_IDS)
      for (let time = 140; time <= 166; time += 0.5) {
        const { root, craft, state } = model(id, time, false, true),
          skirt = root.getObjectByName('lcac-flexible-skirt')! as THREE.Mesh,
          p = skirt.geometry.getAttribute('position')
        for (let i = 0; i < p.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(skirt.matrixWorld)
          expect(v.y - getLandingSupportHeight(v.x, v.z), `${id} skirt ${i} at ${time}`).toBeGreaterThanOrEqual(0.0199)
        }
        const platform = root.getObjectByName('lcac-low-platform')! as THREE.Mesh,
          platformPoints = platform.geometry.getAttribute('position')
        for (let i = 0; i < platformPoints.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(platformPoints, i).applyMatrix4(platform.matrixWorld)
          expect(v.y - getLandingSupportHeight(v.x, v.z), `${id} platform ${i} at ${time}`).toBeGreaterThan(0)
        }
        for (const pid of craft.payloadIds) {
          const actual = root.getObjectByName(pid)!.getWorldPosition(new THREE.Vector3()),
            authored = state.payload[pid].pose.position
          expect(actual.distanceTo(new THREE.Vector3(authored.x, authored.y, authored.z))).toBeLessThan(1e-9)
        }
        for (let station = 0; station <= 6; station += 0.5)
          for (const x of [-4.1, -2.05, 0, 2.05, 4.1]) {
            const point = landingRampPoint(craft.pose, craft.mechanics.deckLocalY, craft.mechanics.bowRampAngleRadians, x, station)
            expect(point.y - getLandingSupportHeight(point.x, point.z), `${id} ramp ${x}:${station} at ${time}`).toBeGreaterThanOrEqual(-0.00001)
          }
        const fan = root.getObjectByName('lcac-fan-1')!,
          fanCenter = fan.getWorldPosition(new THREE.Vector3())
        const expected = transformLandingPoint(craft.pose, { x: 4.75, y: craft.mechanics.deckLocalY + 3.2, z: 10.5 })
        expect(fanCenter.distanceTo(new THREE.Vector3(expected.x, expected.y, expected.z))).toBeLessThan(1e-9)
      }
  })

  it('shares resources and disposes each owned geometry/material once', () => {
    const local = createLandingModelResources(),
      spies = [...Object.values(local.geometry), ...Object.values(local.material)].map((r) => vi.spyOn(r, 'dispose'))
    const root = new THREE.Group()
    append(root, <Lav25Model resources={local} />)
    append(root, <Lav25Model resources={local} />)
    root.updateMatrixWorld(true)
    expect(meshes(root, 'lav25-hull').map((o) => (o as THREE.Mesh).geometry)).toEqual([local.geometry.hull, local.geometry.hull])
    local.dispose()
    expect(spies.every((s) => s.mock.calls.length === 1)).toBe(true)
  })
})

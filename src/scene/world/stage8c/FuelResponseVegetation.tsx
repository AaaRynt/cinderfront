import { useEffect, useMemo } from 'react'
import { DoubleSide, InstancedBufferAttribute, InstancedMesh, MeshDepthMaterial, MeshStandardMaterial, Vector3 } from 'three'

import type { MotionClock } from '../stage8b/motionClock'

import { createDetailPlantGeometry } from '../stage8a/detailGeometry'
import { expandWindBounds, WIND_PROFILES, type WindKind } from '../stage8b/wind'
import { applyFuelBlast, fuelResponseAt } from './fuelBlast'
import { fitFuelPlant, FUEL_PLANTS, fullStrengthTipM } from './fuelPlantLayout'

function createPlantBatch(kind: WindKind, windClock: MotionClock, blastClock: MotionClock) {
  const plants = FUEL_PLANTS.filter((plant) => plant.kind === kind)
  const geometry = createDetailPlantGeometry(kind)
  const material = applyFuelBlast(new MeshStandardMaterial({ vertexColors: true, roughness: 0.94, flatShading: true, side: DoubleSide }), kind, windClock, blastClock)
  const depth = applyFuelBlast(new MeshDepthMaterial(), kind, windClock, blastClock)
  const mesh = new InstancedMesh(geometry, material, plants.length)
  const responses: number[] = []
  const blastBounds = new Vector3()
  let maxPeakM = 0
  for (const [i, plant] of plants.entries()) {
    const { directionX, directionZ, arrivalAge, peakM } = fuelResponseAt(plant.x, plant.z, fullStrengthTipM(plant))
    responses.push(directionX, directionZ, arrivalAge, peakM)
    mesh.setMatrixAt(i, fitFuelPlant(geometry, plant))
    blastBounds.x = Math.max(blastBounds.x, Math.abs(directionX) * peakM)
    blastBounds.z = Math.max(blastBounds.z, Math.abs(directionZ) * peakM)
    maxPeakM = Math.max(maxPeakM, peakM)
  }
  geometry.setAttribute('fuelResponse', new InstancedBufferAttribute(new Float32Array(responses), 4))
  mesh.instanceMatrix.needsUpdate = true
  mesh.name = `8c-fuel-${kind}`
  mesh.userData.detailIds = plants.map(({ id }) => id)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.customDepthMaterial = depth
  mesh.computeBoundingBox()
  mesh.computeBoundingSphere()
  expandWindBounds(mesh, kind)
  // Include both signs of the impulse in main and directional shadow culling.
  mesh.boundingBox!.expandByVector(blastBounds)
  mesh.boundingSphere!.radius += maxPeakM
  return mesh
}

export function FuelResponseVegetation({ windClock, blastClock }: { windClock: MotionClock; blastClock: MotionClock }) {
  const batches = useMemo(() => (Object.keys(WIND_PROFILES) as WindKind[]).map((kind) => createPlantBatch(kind, windClock, blastClock)), [windClock, blastClock])
  useEffect(
    () => () => {
      for (const mesh of batches) {
        mesh.dispose()
        mesh.geometry.dispose()
        mesh.material.dispose()
        mesh.customDepthMaterial!.dispose()
      }
    },
    [batches],
  )
  return (
    <group name="stage8c-fuel-response-vegetation" dispose={null}>
      {batches.map((batch) => (
        <primitive key={batch.name} object={batch} />
      ))}
    </group>
  )
}

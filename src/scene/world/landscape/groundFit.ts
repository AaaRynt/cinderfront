import { Matrix4, Vector3, type BufferGeometry } from 'three'

import { getLandingSupportHeight } from '../landing/landingTerrain'

/** Render-only vertical shear. X/Z rows are byte-identical to the authored
 * matrix: a fitted rock cannot acquire a wider horizontal reservation. Sample
 * the uploaded triangles over the entire projected base at <= 0.75 m spacing,
 * plus every base vertex, rather than relying on a center height/normal. */
export function fitLandscapeBase(geometry: BufferGeometry, base: Matrix4, burial = 0.045) {
  const p = geometry.getAttribute('position'),
    e = base.elements,
    points: Vector3[] = []
  let bottom = Infinity
  for (let i = 0; i < p.count; i++) bottom = Math.min(bottom, p.getY(i))
  for (let i = 0; i < p.count; i++) if (p.getY(i) < bottom + 0.015) points.push(new Vector3(p.getX(i), bottom, p.getZ(i)).applyMatrix4(base))
  if (points.length < 3) points.push(new Vector3(0, bottom, 0).applyMatrix4(base))
  const minX = Math.min(...points.map((v) => v.x)),
    maxX = Math.max(...points.map((v) => v.x)),
    minZ = Math.min(...points.map((v) => v.z)),
    maxZ = Math.max(...points.map((v) => v.z))
  const x = e[12]!,
    z = e[14]!,
    half = Math.max(0.2, Math.min(3, Math.max(maxX - minX, maxZ - minZ) * 0.25))
  const height = getLandingSupportHeight(x, z)
  const slopeX = (getLandingSupportHeight(x + half, z) - getLandingSupportHeight(x - half, z)) / (2 * half)
  const slopeZ = (getLandingSupportHeight(x, z + half) - getLandingSupportHeight(x, z - half)) / (2 * half)
  const nx = Math.max(1, Math.ceil((maxX - minX) / 0.75)),
    nz = Math.max(1, Math.ceil((maxZ - minZ) / 0.75))
  for (let ix = 0; ix <= nx; ix++) for (let iz = 0; iz <= nz; iz++) points.push(new Vector3(minX + ((maxX - minX) * ix) / nx, 0, minZ + ((maxZ - minZ) * iz) / nz))
  let residual = Infinity
  for (const v of points) residual = Math.min(residual, getLandingSupportHeight(v.x, v.z) - height - slopeX * (v.x - x) - slopeZ * (v.z - z))
  const scaleY = Math.hypot(e[4]!, e[5]!, e[6]!),
    matrix = base.clone(),
    m = matrix.elements
  m[1] = slopeX * e[0]! + slopeZ * e[2]!
  m[5] = scaleY + slopeX * e[4]! + slopeZ * e[6]!
  m[9] = slopeX * e[8]! + slopeZ * e[10]!
  m[13] = height + residual - bottom * scaleY - burial
  return { matrix, slopeX, slopeZ, residual, burial, sampleCount: points.length }
}

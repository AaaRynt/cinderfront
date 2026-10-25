import { BufferGeometry, Float32BufferAttribute } from 'three'

/** Eight cosmetic triangles outside the original map rectangle. The actual
 * coastal surface, support queries and -0.12 m sea level are untouched. */
export function createDistantSeaGeometry() {
  const vertices: number[] = []
  const rectangle = (x0: number, z0: number, x1: number, z1: number) => {
    for (const [x, z] of [
      [x0, z0],
      [x0, z1],
      [x1, z1],
      [x0, z0],
      [x1, z1],
      [x1, z0],
    ])
      vertices.push(x!, -0.12, z!)
  }
  rectangle(-60000, -60000, 60000, -5000)
  rectangle(-60000, 5000, 60000, 60000)
  rectangle(-60000, -5000, -7000, 5000)
  rectangle(7000, -5000, 60000, 5000)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('coastalRegion', new Float32BufferAttribute(new Float32Array(vertices.length), 3))
  geometry.setAttribute('coastalAttenuation', new Float32BufferAttribute(new Float32Array(vertices.length / 3).fill(1), 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

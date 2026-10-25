import { BufferGeometry, Color, Float32BufferAttribute, MeshStandardMaterial } from 'three'

import type { XZPoint } from '../worldData'

import { distanceToPolyline } from '../stage2/terrainModel'

/** Add only a render attribute; all support positions, normals and indices keep
 * their bytes. A narrow dusty shoulder blends color inside the existing road. */
export function addRoadShoulder(geometry: BufferGeometry, points: readonly XZPoint[], width: number) {
  const p = geometry.getAttribute('position'),
    edge = new Float32Array(p.count)
  for (let i = 0; i < p.count; i++) edge[i] = Math.min(1, distanceToPolyline(p.getX(i), p.getZ(i), points) / (width * 0.5))
  geometry.setAttribute('roadShoulder', new Float32BufferAttribute(edge, 1))
  return geometry
}
export function applyRoadShoulder(material: MeshStandardMaterial) {
  const compile = material.onBeforeCompile.bind(material),
    key = material.customProgramCacheKey.bind(material)
  material.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer)
    shader.uniforms.uRoadSoil = { value: new Color('#786e57') }
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float roadShoulder; varying float vRoadShoulder;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRoadShoulder=roadShoulder;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRoadSoil; varying float vRoadShoulder;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,uRoadSoil,.64*smoothstep(.72,1.0,vRoadShoulder));')
  }
  material.customProgramCacheKey = () => key() + '-6c-dusty-edge'
  return material
}

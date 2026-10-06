import type { MeshStandardMaterial } from 'three'

/** Local material wear stays attached to the intact structure. Authored wrecks
 * use their existing charred materials; this never restores a failed shell. */
export function applyIndustrialWeathering(material: MeshStandardMaterial, strength = 0.26) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWeatherStrength = { value: strength }
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWeatherPosition;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWeatherPosition = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWeatherPosition;\nuniform float uWeatherStrength;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      float streak = pow(0.5 + 0.5 * sin(vWeatherPosition.x * 0.71 + vWeatherPosition.z * 0.63), 8.0);
      float seam = pow(0.5 + 0.5 * cos(vWeatherPosition.y * 1.56), 18.0);
      float contact = 0.5 + 0.5 * sin(vWeatherPosition.y * 0.27 + vWeatherPosition.x * 0.023);
      float wear = uWeatherStrength * (streak * contact * 0.66 + seam * 0.8);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19, 0.095, 0.044), wear);`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = min(1.0, roughnessFactor + wear * 0.22);')
  }
  // Strength is a uniform; variants can share the compiled shader program.
  material.customProgramCacheKey = () => 'stage4c-local-weathering-v1'
  return material
}

export function applyConcreteHistory(material: MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vConcreteWorld;').replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec4 historyPosition = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        historyPosition = instanceMatrix * historyPosition;
      #endif
      vConcreteWorld = (modelMatrix * historyPosition).xyz;`,
    )
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vConcreteWorld;').replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float drainStreak = pow(0.5 + 0.5 * sin(vConcreteWorld.x * 0.19 + vConcreteWorld.z * 0.23), 10.0);
      float saltContact = (1.0-smoothstep(0.3, 2.4, abs(vConcreteWorld.y-0.7))) * (0.45 + 0.55 * drainStreak);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.33,0.35,0.28), saltContact * 0.32);
      diffuseColor.rgb *= 1.0 - drainStreak * 0.13;`,
    )
  }
  material.customProgramCacheKey = () => 'stage4c-quay-contact-weathering-v1'
  return material
}

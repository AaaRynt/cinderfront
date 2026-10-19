import type { MeshStandardMaterial } from 'three'

/** World-meter breakup on the existing surfaces. Color/roughness only: no
 * displacement, extra terrain sheet, opacity stamp, time or support change. */
export function applyLandscapeSurface(material: MeshStandardMaterial, strength = 0.18) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLandscapeStrength = { value: strength }
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLandscapeWorld;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandscapeWorld=(modelMatrix*vec4(position,1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
      varying vec3 vLandscapeWorld;
      uniform float uLandscapeStrength;
      float landscapeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float landscapeNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(landscapeHash(i),landscapeHash(i+vec2(1,0)),f.x),mix(landscapeHash(i+vec2(0,1)),landscapeHash(i+vec2(1,1)),f.x),f.y);}
    `,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      vec2 groundXZ=vLandscapeWorld.xz;
      float broad=landscapeNoise(groundXZ*.027);
      float pockets=landscapeNoise(groundXZ*.19+vec2(13.2,7.9));
      // Fade sub-meter grit before it aliases in wide spectator views.
      float footprint=max(length(dFdx(groundXZ)),length(dFdy(groundXZ)));
      float grit=mix(landscapeNoise(groundXZ*3.1),.5,smoothstep(.14,.9,footprint));
      float mineral=broad*.52+pockets*.34+grit*.14;
      diffuseColor.rgb*=1.0+uLandscapeStrength*(mineral-.53)*2.0;
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.07,1.04,.94),uLandscapeStrength*pockets);
    `,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(mineral-.4)*uLandscapeStrength*.3,.72,1.0);')
  }
  material.customProgramCacheKey = () => 'stage6a-world-ground-color-roughness-v1'
  return material
}

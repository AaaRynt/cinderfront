import { useEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial } from 'three'

import type { MotionClock } from './motionClock'

import { SURF_GLSL, createEastSurfGeometry } from './surf'

function createWaveMaterial(clock: MotionClock) {
  const material = new MeshStandardMaterial({ transparent: true, depthWrite: false, flatShading: true, roughness: 0.52, metalness: 0.015 })
  const tones = {
    uSwell: { value: new Color('#2d6068') },
    uShallows: { value: new Color('#528579') },
    uFoam: { value: new Color('#d6e1d8') },
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLocalMotionTime = clock
    Object.assign(shader.uniforms, tones)
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${SURF_GLSL}`).replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
        vEastSurf = uv;
        EastSurfState surf = eastSurfState(uv.x);
        float relativeFront = uv.y - surf.front;
        float shoaling = 1.0 - 0.92 * smoothstep(-1.0, 5.0, uv.y);
        float crest = shoaling * surf.swell * eastRidge(relativeFront, surf.breaking) * (0.62 + 0.40 * surf.breaking);
        float film = eastFilm(relativeFront, surf) * mix(0.115, 0.048, smoothstep(0.67, 0.93, surf.phase));
        transformed.y += eastSurfEdge(uv) * (crest + film);
      `,
    )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        ${SURF_GLSL}
        uniform vec3 uSwell;
        uniform vec3 uShallows;
        uniform vec3 uFoam;
        float surfGrain(vec2 p) {
          p = fract(p * vec2(123.34, 345.45));
          p += dot(p, p + 34.345);
          return fract(p.x * p.y);
        }
        float surfNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(p));
          return mix(mix(surfGrain(i), surfGrain(i + vec2(1.0, 0.0)), f.x),
                     mix(surfGrain(i + vec2(0.0, 1.0)), surfGrain(i + vec2(1.0, 1.0)), f.x), f.y);
        }
      `,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        EastSurfState surf = eastSurfState(vEastSurf.x);
        float crossShore = vEastSurf.y;
        float relativeFront = crossShore - surf.front;
        float edge = eastSurfEdge(vEastSurf);
        float crest = surf.swell * eastRidge(relativeFront, surf.breaking);
        float film = eastFilm(relativeFront, surf);
        float along = vEastSurf.x * 57.0;
        float ragged = surfNoise(vec2(along * 0.29, crossShore * 0.41));
        float froth = surfNoise(vec2(along * 0.72 + relativeFront * 0.25, relativeFront * 1.48 - surf.phase * 5.0));
        float face = relativeFront + (ragged - 0.5) * 1.8;
        float lip = 1.0 - smoothstep(0.18, 2.1 + ragged * 1.0, abs(face + 0.14));
        float trailing = smoothstep(-10.0, -1.1, relativeFront) * (1.0 - smoothstep(-0.2, 1.9, relativeFront));
        float lace = smoothstep(0.25, 0.76, froth * 0.64 + ragged * 0.36);
        float spill = surf.wash * (0.88 - 0.47 * smoothstep(0.67, 0.92, surf.phase));
        float foam = clamp(surf.breaking * lip * (0.48 + 0.52 * ragged) + spill * (lip * (0.21 + 0.47 * ragged) + 0.58 * trailing * lace), 0.0, 1.0);
        float shallow = smoothstep(-39.0, 2.0, crossShore);
        vec3 water = mix(uSwell, uShallows, shallow);
        water *= 0.91 + 0.46 * crest + 0.14 * ragged;
        diffuseColor.rgb = mix(water, uFoam, smoothstep(0.05, 0.75, foam));
        diffuseColor.a = edge * clamp(max(0.78 * crest, 0.59 * film) + 0.88 * foam, 0.0, 0.97);
      `,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.48, 0.88, foam);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uFoam * (foam * 0.12 + 0.035 * crest * crest);')
  }
  material.customProgramCacheKey = () => '8b-east-surf-v1'
  return material
}

function createDampMaterial(clock: MotionClock) {
  const material = new MeshStandardMaterial({ color: '#494e41', roughness: 0.58, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLocalMotionTime = clock
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vEastSurf;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvEastSurf = uv;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${SURF_GLSL}`).replace(
      '#include <alphamap_fragment>',
      `#include <alphamap_fragment>
        EastSurfState surf = eastSurfState(vEastSurf.x);
        float d = vEastSurf.y;
        float exposed = smoothstep(surf.front - 0.65, surf.front + 1.65, d);
        float reached = 1.0 - smoothstep(surf.runup - 1.3, surf.runup + 0.9, d);
        float ripples = 0.88 + 0.12 * sin(d * 1.09 + vEastSurf.x * 36.5) * cos(d * 0.65 - vEastSurf.x * 17.0);
        diffuseColor.a *= 0.62 * eastSurfEdge(vEastSurf) * surf.damp * reached * exposed * smoothstep(0.0, 2.8, d) * ripples;
      `,
    )
  }
  material.customProgramCacheKey = () => '8b-east-damp-v1'
  return material
}

export function EasternSurf({ clock }: { clock: MotionClock }) {
  const resources = useMemo(
    () => ({
      wet: { geometry: createEastSurfGeometry(true), material: createDampMaterial(clock) },
      swell: { geometry: createEastSurfGeometry(false), material: createWaveMaterial(clock) },
    }),
    [clock],
  )
  useEffect(
    () => () => {
      for (const { geometry, material } of Object.values(resources)) {
        geometry.dispose()
        material.dispose()
      }
    },
    [resources],
  )
  return (
    <group name="stage8b-eastern-surf" dispose={null}>
      <mesh {...resources.wet} name="8b-east-damp-sand" renderOrder={2} receiveShadow />
      <mesh {...resources.swell} name="8b-east-swell-and-wash" renderOrder={3} receiveShadow />
    </group>
  )
}

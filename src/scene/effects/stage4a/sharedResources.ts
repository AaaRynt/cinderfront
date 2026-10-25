import { AdditiveBlending, BoxGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial } from 'three'

import { STAGE3_GEOMETRIES } from '../stage3/sharedResources.ts'
import { createSoftSmokeMaterial, createSoftFlameMaterial, SOFT_SMOKE_GEOMETRY, SOFT_FLAME_GEOMETRY } from '../stage3/softParticles'

export const STAGE4A_FUEL_GEOMETRIES = {
  beam: new BoxGeometry(1, 1, 1),
  burst: STAGE3_GEOMETRIES.puff,
  debris: STAGE3_GEOMETRIES.debris,
  disc: STAGE3_GEOMETRIES.irregularDisc,
  fire: SOFT_FLAME_GEOMETRY,
  pipe: new CylinderGeometry(1, 1, 1, 9),
  smoke: SOFT_SMOKE_GEOMETRY,
  tankRoof: new CylinderGeometry(1, 1, 1, 20),
  tankShellArc: new CylinderGeometry(1, 1, 1, 28, 1, true, 0.18, 1.88),
} as const

export const STAGE4A_FUEL_MATERIALS = {
  burstHot: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ffe29a', depthWrite: false, opacity: 0.9, toneMapped: false, transparent: true }),
  burstInner: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ff9b35', depthWrite: false, opacity: 0.82, toneMapped: false, transparent: true }),
  burstOuter: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#d94712', depthWrite: false, opacity: 0.68, toneMapped: false, transparent: true }),
  charredMetal: new MeshStandardMaterial({ color: '#5b6258', flatShading: true, metalness: 0.18, roughness: 0.9 }),
  fireInner: createSoftFlameMaterial('#ffd77a', 0.9),
  fireOuter: createSoftFlameMaterial('#e44a12', 0.9),
  flash: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#fff1c6', depthWrite: false, opacity: 0.86, toneMapped: false, transparent: true }),
  hotSoot: createSoftSmokeMaterial('#342b26', 0.32),
  scorch: new MeshBasicMaterial({ color: '#15110e', depthWrite: false, opacity: 0.78, transparent: true }),
  smokeBody: createSoftSmokeMaterial('#2f3638', 0.52),
  smokeCore: createSoftSmokeMaterial('#202628', 0.72),
  smokeEdge: createSoftSmokeMaterial('#485052', 0.26),
} as const

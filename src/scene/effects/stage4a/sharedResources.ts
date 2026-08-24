import { AdditiveBlending, BoxGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial } from 'three'

import { STAGE3_GEOMETRIES } from '../stage3/sharedResources.ts'

export const STAGE4A_FUEL_GEOMETRIES = {
  beam: new BoxGeometry(1, 1, 1),
  burst: STAGE3_GEOMETRIES.puff,
  debris: STAGE3_GEOMETRIES.debris,
  disc: STAGE3_GEOMETRIES.irregularDisc,
  fire: STAGE3_GEOMETRIES.fire,
  pipe: new CylinderGeometry(1, 1, 1, 9),
  smoke: STAGE3_GEOMETRIES.puff,
  tankRoof: new CylinderGeometry(1, 1, 1, 20),
  tankShellArc: new CylinderGeometry(1, 1, 1, 28, 1, true, 0.18, 1.88),
} as const

export const STAGE4A_FUEL_MATERIALS = {
  burstHot: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ffe29a', depthWrite: false, opacity: 0.9, toneMapped: false, transparent: true }),
  burstInner: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ff9b35', depthWrite: false, opacity: 0.82, toneMapped: false, transparent: true }),
  burstOuter: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#d94712', depthWrite: false, opacity: 0.68, toneMapped: false, transparent: true }),
  charredMetal: new MeshStandardMaterial({ color: '#171a19', flatShading: true, metalness: 0.56, roughness: 0.82 }),
  fireInner: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ffd77a', depthWrite: false, opacity: 0.82, toneMapped: false, transparent: true }),
  fireOuter: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#e44a12', depthWrite: false, opacity: 0.72, toneMapped: false, transparent: true }),
  flash: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#fff1c6', depthWrite: false, opacity: 0.86, toneMapped: false, transparent: true }),
  hotSoot: new MeshBasicMaterial({ color: '#2b211c', depthWrite: false, opacity: 0.2, transparent: true }),
  scorch: new MeshBasicMaterial({ color: '#15110e', depthWrite: false, opacity: 0.78, transparent: true }),
  smokeBody: new MeshBasicMaterial({ color: '#171b1b', depthWrite: false, opacity: 0.27, transparent: true }),
  smokeCore: new MeshBasicMaterial({ color: '#080b0c', depthWrite: false, opacity: 0.42, transparent: true }),
  smokeEdge: new MeshBasicMaterial({ color: '#414445', depthWrite: false, opacity: 0.13, transparent: true }),
} as const

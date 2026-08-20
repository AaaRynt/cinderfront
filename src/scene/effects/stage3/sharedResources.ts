import { AdditiveBlending, BoxGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry, Matrix4, MeshBasicMaterial, MeshStandardMaterial, Quaternion, RingGeometry, Shape, ShapeGeometry, Vector3 } from 'three'

import type { Stage3Vec3 } from './types.ts'

const SEGMENT_UP = new Vector3(0, 1, 0)

function baseAnchored<Geometry extends BoxGeometry | ConeGeometry | CylinderGeometry | DodecahedronGeometry>(geometry: Geometry) {
  geometry.translate(0, 0.5, 0)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function createIrregularDiscGeometry() {
  const shape = new Shape()
  const pointCount = 28
  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2
    const radius = 0.82 + Math.sin(index * 2.17 + 0.4) * 0.1 + Math.sin(index * 0.73 + 1.1) * 0.07
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geometry = new ShapeGeometry(shape)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export const STAGE3_GEOMETRIES = {
  antenna: baseAnchored(new CylinderGeometry(0.5, 0.72, 1, 6)),
  bombBody: new CylinderGeometry(0.29, 0.34, 3.4, 10),
  box: new BoxGeometry(1, 1, 1),
  debris: new BoxGeometry(1, 1, 1),
  emberTrail: new CylinderGeometry(0.05, 0.16, 1, 5),
  fence: baseAnchored(new BoxGeometry(1, 1, 1)),
  fire: baseAnchored(new ConeGeometry(0.5, 1, 7)),
  flameTrail: new CylinderGeometry(0.18, 0.62, 1, 6),
  grass: baseAnchored(new ConeGeometry(0.5, 1, 3)),
  irregularDisc: createIrregularDiscGeometry(),
  lightPole: baseAnchored(new CylinderGeometry(0.5, 0.72, 1, 7)),
  puff: new IcosahedronGeometry(1, 1),
  ring: new RingGeometry(0.84, 1, 72),
  scrub: baseAnchored(new DodecahedronGeometry(0.5, 0)),
} as const

export const STAGE3_MATERIALS = {
  antenna: new MeshStandardMaterial({ color: '#4b5451', metalness: 0.52, roughness: 0.58 }),
  bombBody: new MeshStandardMaterial({ color: '#252b2a', metalness: 0.62, roughness: 0.48 }),
  bombFin: new MeshStandardMaterial({ color: '#353c3a', metalness: 0.52, roughness: 0.56 }),
  charred: new MeshStandardMaterial({ color: '#211f1a', metalness: 0.2, roughness: 0.94, flatShading: true }),
  debris: new MeshStandardMaterial({ color: '#2b302e', metalness: 0.42, roughness: 0.72, flatShading: true }),
  dust: new MeshBasicMaterial({ color: '#8f7759', depthWrite: false, opacity: 0.15, transparent: true }),
  ember: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ffc45b', depthWrite: false, opacity: 0.82, toneMapped: false, transparent: true }),
  fence: new MeshStandardMaterial({ color: '#555b57', metalness: 0.38, roughness: 0.7 }),
  fireInner: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ffd067', depthWrite: false, opacity: 0.78, toneMapped: false, transparent: true }),
  fireOuter: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#e74b16', depthWrite: false, opacity: 0.64, toneMapped: false, transparent: true }),
  flame: new MeshBasicMaterial({ blending: AdditiveBlending, color: '#ff641c', depthWrite: false, opacity: 0.72, toneMapped: false, transparent: true }),
  grass: new MeshStandardMaterial({ color: '#8d7b49', flatShading: true, metalness: 0, roughness: 0.98 }),
  lightPole: new MeshStandardMaterial({ color: '#5e6662', metalness: 0.46, roughness: 0.56 }),
  scorch: new MeshBasicMaterial({ color: '#1b1712', depthWrite: false, opacity: 0.74, transparent: true }),
  scrub: new MeshStandardMaterial({ color: '#61613d', flatShading: true, metalness: 0, roughness: 1 }),
  smokeCore: new MeshBasicMaterial({ color: '#101415', depthWrite: false, opacity: 0.28, transparent: true }),
  smokeEdge: new MeshBasicMaterial({ color: '#303638', depthWrite: false, opacity: 0.16, transparent: true }),
  smokeLocal: new MeshBasicMaterial({ color: '#252a29', depthWrite: false, opacity: 0.19, transparent: true }),
} as const

export function setSegmentMatrix(target: Matrix4, start: Stage3Vec3, end: Stage3Vec3, radius: number) {
  const startVector = new Vector3(...start)
  const endVector = new Vector3(...end)
  const direction = endVector.clone().sub(startVector)
  const length = Math.max(0.01, direction.length())
  const midpoint = startVector.add(endVector).multiplyScalar(0.5)
  const quaternion = new Quaternion().setFromUnitVectors(SEGMENT_UP, direction.normalize())
  target.compose(midpoint, quaternion, new Vector3(radius, length, radius))
  return target
}

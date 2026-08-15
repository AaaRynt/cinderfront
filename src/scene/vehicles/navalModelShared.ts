import * as THREE from 'three'

/** One faceted cross-section of a ship hull. All values are raw meters. */
export interface NavalHullSection {
  z: number
  deckHalfWidth: number
  chineHalfWidth: number
  keelHalfWidth: number
  deckY: number
  chineY: number
  keelY: number
}

/**
 * Builds a six-facet naval hull along local Z. The first station is the bow,
 * the last is the transom, and the caller keeps the design waterline at Y=0.
 */
export function createNavalHullGeometry(sections: readonly NavalHullSection[]): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const verticesPerSection = 6

  for (const section of sections) {
    positions.push(section.deckHalfWidth, section.deckY, section.z, -section.deckHalfWidth, section.deckY, section.z, -section.chineHalfWidth, section.chineY, section.z, -section.keelHalfWidth, section.keelY, section.z, section.keelHalfWidth, section.keelY, section.z, section.chineHalfWidth, section.chineY, section.z)
  }

  for (let sectionIndex = 0; sectionIndex < sections.length - 1; sectionIndex += 1) {
    const ringStart = sectionIndex * verticesPerSection
    const nextRingStart = (sectionIndex + 1) * verticesPerSection

    for (let side = 0; side < verticesPerSection; side += 1) {
      const nextSide = (side + 1) % verticesPerSection
      const a = ringStart + side
      const b = ringStart + nextSide
      const c = nextRingStart + nextSide
      const d = nextRingStart + side
      indices.push(a, b, d, b, c, d)
    }
  }

  const bowCenter = positions.length / 3
  const bow = sections[0]
  positions.push(0, (bow.deckY + bow.keelY) / 2, bow.z)
  const sternCenter = positions.length / 3
  const stern = sections[sections.length - 1]
  positions.push(0, (stern.deckY + stern.keelY) / 2, stern.z)

  const sternRingStart = (sections.length - 1) * verticesPerSection
  for (let side = 0; side < verticesPerSection; side += 1) {
    const nextSide = (side + 1) % verticesPerSection
    indices.push(bowCenter, nextSide, side)
    indices.push(sternCenter, sternRingStart + side, sternRingStart + nextSide)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

/** Shared low-poly geometries keep both naval assets inexpensive at harbor scale. */
export const NAVAL_GEOMETRIES = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cylinder12: new THREE.CylinderGeometry(1, 1, 1, 12),
  cylinder18: new THREE.CylinderGeometry(1, 1, 1, 18),
  sphere: new THREE.SphereGeometry(1, 12, 8),
  radarDish: new THREE.CylinderGeometry(1, 1, 0.12, 18),
} as const

/** Shared restrained naval palette; glazing is opaque and contains no occupants. */
export const NAVAL_MATERIALS = {
  hull: new THREE.MeshStandardMaterial({ color: '#829096', roughness: 0.74, metalness: 0.28, flatShading: true }),
  hullDark: new THREE.MeshStandardMaterial({ color: '#4d5a5f', roughness: 0.82, metalness: 0.2, flatShading: true }),
  underwater: new THREE.MeshStandardMaterial({ color: '#3f2929', roughness: 0.9, metalness: 0.12, flatShading: true }),
  deck: new THREE.MeshStandardMaterial({ color: '#364044', roughness: 0.9, metalness: 0.12 }),
  superstructure: new THREE.MeshStandardMaterial({ color: '#99a5a8', roughness: 0.72, metalness: 0.3, flatShading: true }),
  superstructureDark: new THREE.MeshStandardMaterial({ color: '#657277', roughness: 0.78, metalness: 0.28, flatShading: true }),
  metal: new THREE.MeshStandardMaterial({ color: '#263035', roughness: 0.48, metalness: 0.72 }),
  glazing: new THREE.MeshStandardMaterial({ color: '#101c22', roughness: 0.14, metalness: 0.82 }),
  radar: new THREE.MeshStandardMaterial({ color: '#bdc5c3', roughness: 0.66, metalness: 0.34 }),
  launchCap: new THREE.MeshStandardMaterial({ color: '#242d30', roughness: 0.72, metalness: 0.35 }),
  marking: new THREE.MeshBasicMaterial({ color: '#d9d9cf' }),
} as const

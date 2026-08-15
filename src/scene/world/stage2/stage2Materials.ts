import { DoubleSide, MeshStandardMaterial } from 'three'

export function createStage2Materials() {
  const matte = { metalness: 0, roughness: 0.94 } as const
  const structure = { metalness: 0.18, roughness: 0.74 } as const

  return {
    terrain: new MeshStandardMaterial({ flatShading: false, metalness: 0, roughness: 0.96, side: DoubleSide, vertexColors: true }),
    coastRock: new MeshStandardMaterial({ color: '#595244', flatShading: true, ...matte }),
    ocean: new MeshStandardMaterial({ color: '#244e5c', metalness: 0.08, roughness: 0.32, side: DoubleSide }),
    harborWater: new MeshStandardMaterial({ color: '#315c63', metalness: 0.04, opacity: 0.9, roughness: 0.42, transparent: true }),
    shallowWater: new MeshStandardMaterial({ color: '#477b7d', metalness: 0.02, opacity: 0.72, roughness: 0.52, transparent: true }),
    intertidalWater: new MeshStandardMaterial({ color: '#6e8176', metalness: 0.01, opacity: 0.55, roughness: 0.68, transparent: true }),
    sand: new MeshStandardMaterial({ color: '#917e55', ...matte }),
    asphalt: new MeshStandardMaterial({ color: '#3f4543', metalness: 0.02, roughness: 0.88 }),
    gravel: new MeshStandardMaterial({ color: '#746e60', ...matte }),
    hardstand: new MeshStandardMaterial({ color: '#656860', metalness: 0.01, roughness: 0.9 }),
    concrete: new MeshStandardMaterial({ color: '#656861', metalness: 0.01, roughness: 0.86 }),
    weatheredConcrete: new MeshStandardMaterial({ color: '#5a5c55', metalness: 0, roughness: 0.96 }),
    steel: new MeshStandardMaterial({ color: '#4e5757', ...structure }),
    darkSteel: new MeshStandardMaterial({ color: '#343b3c', metalness: 0.24, roughness: 0.68 }),
    paintedSteel: new MeshStandardMaterial({ color: '#626b67', ...structure }),
    warehouseWall: new MeshStandardMaterial({ color: '#4e534e', metalness: 0.08, roughness: 0.82 }),
    warehouseRoof: new MeshStandardMaterial({ color: '#363d3c', metalness: 0.16, roughness: 0.74 }),
    tankWall: new MeshStandardMaterial({ color: '#7c7d70', metalness: 0.16, roughness: 0.73 }),
    tankTop: new MeshStandardMaterial({ color: '#929080', metalness: 0.12, roughness: 0.78 }),
    pipeline: new MeshStandardMaterial({ color: '#655c4b', metalness: 0.27, roughness: 0.68 }),
    rail: new MeshStandardMaterial({ color: '#343737', metalness: 0.55, roughness: 0.48 }),
    tie: new MeshStandardMaterial({ color: '#423c33', ...matte }),
    berm: new MeshStandardMaterial({ color: '#6d644f', flatShading: true, ...matte }),
    bunker: new MeshStandardMaterial({ color: '#4b5049', metalness: 0.03, roughness: 0.93 }),
    fence: new MeshStandardMaterial({ color: '#4d5351', metalness: 0.32, roughness: 0.66 }),
    utilityPole: new MeshStandardMaterial({ color: '#414644', metalness: 0.22, roughness: 0.72 }),
    cable: new MeshStandardMaterial({ color: '#252928', metalness: 0.2, roughness: 0.72 }),
    scrub: new MeshStandardMaterial({ color: '#555a38', flatShading: true, ...matte }),
    grass: new MeshStandardMaterial({ color: '#736b3f', flatShading: true, side: DoubleSide, ...matte }),
    warning: new MeshStandardMaterial({ color: '#a14d30', emissive: '#5f1f10', emissiveIntensity: 0.55, roughness: 0.68 }),
    stripe: new MeshStandardMaterial({ color: '#b49d68', emissive: '#332813', emissiveIntensity: 0.12, roughness: 0.82 }),
  }
}

export type Stage2Materials = ReturnType<typeof createStage2Materials>

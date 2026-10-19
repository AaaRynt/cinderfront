import { LEGACY_VEGETATION_SPECS } from '../landscape/legacyVegetation'
import { SparseVegetationPatch } from './environment/SparseVegetation'

export function VegetationSystem() {
  return (
    <group name="stage2-instanced-sparse-vegetation">
      {LEGACY_VEGETATION_SPECS.map((spec) => (
        <SparseVegetationPatch key={spec.id} {...spec} />
      ))}
    </group>
  )
}

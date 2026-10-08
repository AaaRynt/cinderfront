import type { SimulationWorldState } from '@/simulation'

import { SecondaryPantsirEffects } from '../effects/SecondaryPantsirEffects'
import { PantsirModel } from './PantsirModel'

/** The corridor reserve keeps one model identity through travel, firing and its fixed wreck. */
export function SecondaryPantsir({ state, time }: { state: SimulationWorldState['secondaryPantsir']; time: number }) {
  const { pose, mechanical, destruction } = state
  return (
    <>
      <group name={state.id} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z, 'YXZ']}>
        <PantsirModel
          destroyed={destruction.active}
          destructionAge={destruction.ageSeconds}
          firedTubeCount={mechanical.firedTubeCount}
          launcherElevation={mechanical.launcherElevationRadians}
          radarDeployment={mechanical.radarDeployment}
          radarRotation={mechanical.radarRotationRadians}
          stabilizerDeployment={mechanical.stabilizerDeployment}
          steeringRadians={mechanical.steeringRadians}
          turretYaw={mechanical.turretYawRadians}
          wheelTravelMeters={mechanical.wheelTravelMeters}
        />
      </group>
      <SecondaryPantsirEffects state={state} time={time} />
    </>
  )
}

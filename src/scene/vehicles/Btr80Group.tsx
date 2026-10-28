import { memo } from 'react'

import type { Btr80GroundVehicleGroupState, Btr80GroundVehicleState } from '@/simulation'

import { Btr80Model } from './Btr80Model.tsx'

function Btr80Entity({ vehicle }: { vehicle: Btr80GroundVehicleState }) {
  const { pose } = vehicle
  return (
    <group name={vehicle.id} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      <StableBtr80Model damageProgress={vehicle.damage.hullDamageProgress} disabled={vehicle.physicalCondition === 'disabled'} steeringRadians={vehicle.drivetrain.steeringRadians} turretYawRadians={vehicle.turretYawRadians} wheelRotationRadians={vehicle.drivetrain.wheelRotationRadians} />
    </group>
  )
}

export function Btr80Group({ group }: { group: Btr80GroundVehicleGroupState }) {
  return (
    <group name={group.id}>
      {group.orderedVehicleIds.map((id) => (
        <Btr80Entity key={id} vehicle={group.vehicles[id]} />
      ))}
    </group>
  )
}

const StableBtr80Model = memo(Btr80Model)

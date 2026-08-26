import type { GroundVehicleGroupState, GroundVehicleState } from '@/simulation'

import { Btr80Model } from './Btr80Model.tsx'

function Btr80Entity({ vehicle }: { vehicle: GroundVehicleState }) {
  const { pose } = vehicle
  return (
    <group name={vehicle.id} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      <Btr80Model damageProgress={vehicle.damage.hullDamageProgress} disabled={vehicle.physicalCondition === 'disabled'} steeringRadians={vehicle.steeringRadians} turretYawRadians={vehicle.turretYawRadians} wheelRotationRadians={vehicle.wheelRotationRadians} />
    </group>
  )
}

export function Btr80Group({ group }: { group: GroundVehicleGroupState }) {
  return (
    <group name={group.id}>
      {group.orderedVehicleIds.map((id) => (
        <Btr80Entity key={id} vehicle={group.vehicles[id]} />
      ))}
    </group>
  )
}

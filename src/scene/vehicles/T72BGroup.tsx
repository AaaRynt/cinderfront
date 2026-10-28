import { memo } from 'react'

import type { T72GroundVehicleGroupState, T72GroundVehicleState } from '@/simulation'

import { T72BModel } from './T72BModel.tsx'

function T72BEntity({ vehicle }: { vehicle: T72GroundVehicleState }) {
  const { pose } = vehicle
  return (
    <group name={vehicle.id} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      <StableT72BModel damageProgress={vehicle.damage.hullDamageProgress} destroyed={vehicle.physicalCondition === 'destroyed'} roadWheelRotationRadians={vehicle.drivetrain.roadWheelRotationRadians} trackTravelMeters={vehicle.drivetrain.trackTravelMeters} turretYawRadians={vehicle.turretYawRadians} />
    </group>
  )
}

export function T72BGroup({ group }: { group: T72GroundVehicleGroupState }) {
  return (
    <group name={group.id}>
      {group.orderedVehicleIds.map((id) => (
        <T72BEntity key={id} vehicle={group.vehicles[id]} />
      ))}
    </group>
  )
}

const StableT72BModel = memo(T72BModel)

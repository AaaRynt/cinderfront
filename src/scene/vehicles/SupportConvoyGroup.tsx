import { Euler } from 'three'

import type { SupportConvoyGroupState } from '@/simulation/supportConvoyTypes'

import { SupportVehicleModel } from './SupportVehicleModel'

export function SupportConvoyGroup({ group }: { group: SupportConvoyGroupState }) {
  return (
    <group name={group.id}>
      {group.orderedVehicleIds.map((id) => {
        const vehicle = group.vehicles[id]
        const { position, rotation } = vehicle.pose
        return (
          <group key={id} name={id} visible={vehicle.visible} position={[position.x, position.y, position.z]} rotation={new Euler(rotation.x, rotation.y, rotation.z, 'YXZ')}>
            <SupportVehicleModel subtype={vehicle.subtype} alternateLoad={id === 'defender_support_logistics_02'} lighting={vehicle.lighting} steeringRadians={vehicle.drivetrain.steeringRadians} wheelRotationRadians={vehicle.drivetrain.wheelRotationRadians} />
          </group>
        )
      })}
    </group>
  )
}

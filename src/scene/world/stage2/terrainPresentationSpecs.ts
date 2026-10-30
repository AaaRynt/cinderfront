import type { XZPoint } from '../worldData'

import { T72_SERVICE_YARD_CONNECTOR_POINTS } from '../../../simulation/groundVehicleRoutes'
import { AMMUNITION_GATE_SPURS, BEACH_FEATURES, CORRIDOR_FEATURES, FUEL_BUND_CELLS, HARBOR_FEATURES, INDUSTRIAL_FEATURES, ROAD_DEFINITIONS } from './stage2Data'

export const TERRAIN_ROAD_SPECS: readonly { id: string; points: readonly XZPoint[]; width: number; spacing: number; offset: number }[] = [
  ...ROAD_DEFINITIONS.map((road) => ({ id: road.id, points: road.points, width: road.widthM, spacing: 65, offset: 0.3 })),
  ...AMMUNITION_GATE_SPURS.map((points, i) => ({ id: `ammunition-gate-spur-${i + 1}`, points, width: 7, spacing: 35, offset: 0.3 })),
  { id: 'industrial-drainage-channel', points: INDUSTRIAL_FEATURES.drainage, width: 14, spacing: 75, offset: -0.1 },
  { id: 'convoy-corridor-dry-wash', points: CORRIDOR_FEATURES.dryWash, width: 112, spacing: 55, offset: 0.24 },
  { id: 'armored-service-yard-connector', points: T72_SERVICE_YARD_CONNECTOR_POINTS, width: 14, spacing: 18, offset: 0.3 },
]
export const TERRAIN_SURFACE_SPECS: readonly { points: readonly XZPoint[]; offset: number }[] = [
  ...HARBOR_FEATURES.aprons.map((feature) => ({ points: feature.points, offset: 0.24 })),
  ...FUEL_BUND_CELLS.map((cell) => ({ points: cell.points, offset: 0.16 })),
  { points: INDUSTRIAL_FEATURES.pumpYard, offset: 0.26 },
  { points: INDUSTRIAL_FEATURES.transferRack.points, offset: 0.24 },
  { points: INDUSTRIAL_FEATURES.fuelCompound, offset: 0.3 },
  { points: INDUSTRIAL_FEATURES.ammunitionCompound, offset: 0.32 },
  { points: INDUSTRIAL_FEATURES.ammunitionLoadingYard, offset: 0.24 },
  ...[BEACH_FEATURES.duneWest, BEACH_FEATURES.duneCentral, BEACH_FEATURES.duneEast].map((points) => ({ points, offset: 0.22 })),
  { points: BEACH_FEATURES.exitApron, offset: 0.38 },
  { points: BEACH_FEATURES.inlandHardstand, offset: 0.38 },
  { points: CORRIDOR_FEATURES.pullOffWest, offset: 0.4 },
  { points: CORRIDOR_FEATURES.pullOffEast, offset: 0.4 },
  { points: CORRIDOR_FEATURES.serviceYard, offset: 0.35 },
  { points: CORRIDOR_FEATURES.substation, offset: 0.35 },
]

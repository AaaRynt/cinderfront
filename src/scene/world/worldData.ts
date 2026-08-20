export type XZPoint = readonly [x: number, z: number]
export type WorldPosition = readonly [x: number, y: number, z: number]
export type ElevationRange = readonly [minimum: number, maximum: number]

export const MAP_BOUNDS = {
  xMin: -7000,
  xMax: 7000,
  zMin: -5000,
  zMax: 5000,
} as const

export const WORLD_SIZE_METERS = [14000, 10000] as const

export const TERRAIN_ELEVATION_RANGES = {
  mainland: [2, 220],
  harborLowland: [3, 18],
  industrialPlateau: [22, 46],
  radarRidge: [80, 220],
  radarLowerBench: [80, 125],
  radarMidSlope: [125, 175],
  radarUpperPlateau: [175, 210],
  radarSummitLobe: [205, 220],
  easternPlain: [28, 82],
  beachDunes: [2, 24],
} as const satisfies Record<string, ElevationRange>

/**
 * Representative render surfaces, in authoritative raw meters. Explicit
 * platform elevations remain exact; broad terrain bands use restrained values
 * within their authoritative elevation envelopes.
 */
export const TERRAIN_Y = {
  ocean: 0,
  mainland: 2,
  harborLowland: 8,
  industrialPlateau: 30,
  easternPlain: 28,
  beachSand: 3,
  beachIntertidal: 0.35,
  beachShallows: 0.18,
  radarRidge: 88,
  radarLowerBench: 122,
  radarMidSlope: 170,
  radarUpperPlateau: 190,
  radarSummitLobe: 205,
  searchRadarPlatform: 210,
  trackingRadarPlatform: 195,
} as const

export const WASP_ANCHOR = {
  id: 'naval_anchor_large_hull',
  position: [-4800, TERRAIN_Y.ocean, -2700] as WorldPosition,
  headingDeg: 35,
  clearanceRadiusM: 360,
  reserveCenterXZ: [-4700, -2900] as XZPoint,
  reserveRadiusXM: 1500,
  reserveRadiusZM: 950,
} as const

export const RADAR_SEARCH_SITE = {
  id: 'radar_search_site',
  position: [3550, TERRAIN_Y.searchRadarPlatform, 4150] as WorldPosition,
  radiusM: 220,
} as const

export const RADAR_HILL_CENTER = [3800, TERRAIN_Y.radarMidSlope, 3800] as WorldPosition

export const RADAR_TRACKING_SITE = {
  id: 'radar_tracking_site',
  position: [4325, TERRAIN_Y.trackingRadarPlatform, 4000] as WorldPosition,
  radiusM: 150,
} as const

export const SAM_PAD_POSITIONS = [
  {
    id: 'sam_platform_01',
    position: [3050, 171, 3375] as WorldPosition,
    terrainY: 170,
    radiusM: 70,
  },
  {
    id: 'sam_platform_02',
    // The map specifies this candidate pad's XZ footprint, not an elevation.
    // Seat it into the adjacent middle-slope transition instead of cutting a
    // visually implausible 20 m pit into the restored hill.
    position: [3425, 187, 3450] as WorldPosition,
    terrainY: 186,
    radiusM: 70,
  },
  {
    id: 'sam_platform_03',
    position: [3550, 171, 3150] as WorldPosition,
    terrainY: 170,
    radiusM: 70,
  },
  {
    id: 'sam_platform_04',
    // This footprint straddles the lower-bench/mid-slope shoulder. The source
    // does not mandate Y, so use a modest cut/fill grade rather than a 47 m
    // circular excavation.
    position: [3200, 154, 3025] as WorldPosition,
    terrainY: 153,
    radiusM: 70,
  },
] as const

export const AAA_SITE = {
  id: 'aaa_defense_area',
  position: [4625, 132, 3300] as WorldPosition,
  terrainY: 122,
  radiusM: 130,
} as const

export const COMMUNICATIONS_MAST_SITE = {
  id: 'communications_mast',
  position: [3850, TERRAIN_Y.radarMidSlope, 4550] as WorldPosition,
  heightM: 65,
} as const

/** Exact map centers/footprints; heights are restrained Stage 1 cue heights. */
export const HARBOR_WAREHOUSE_POSITIONS = [
  {
    id: 'warehouse_harbor_01',
    centerXZ: [-3650, 4330] as XZPoint,
    terrainY: TERRAIN_Y.harborLowland,
    heightM: 24,
    footprintM: [620, 220] as const,
  },
  {
    id: 'warehouse_harbor_02',
    centerXZ: [-2850, 2790] as XZPoint,
    terrainY: TERRAIN_Y.harborLowland,
    heightM: 20,
    footprintM: [520, 210] as const,
  },
] as const

export const RADAR_SUPPORT_BUILDINGS = [
  {
    id: 'radar_support_building_01',
    centerXZ: [3950, 3550] as XZPoint,
    terrainY: TERRAIN_Y.radarUpperPlateau,
    heightM: 7,
  },
  {
    id: 'radar_support_building_02',
    centerXZ: [4200, 3500] as XZPoint,
    terrainY: TERRAIN_Y.radarMidSlope,
    heightM: 7,
  },
  {
    id: 'radar_support_building_03',
    centerXZ: [3825, 3325] as XZPoint,
    terrainY: TERRAIN_Y.radarMidSlope,
    heightM: 6,
  },
] as const

export const MAINLAND_POLYGON_XZ = [
  [-4400, 5000],
  [7000, 5000],
  [7000, -3600],
  [6700, -3430],
  [6400, -3300],
  [5980, -3060],
  [5500, -2900],
  [4900, -3010],
  [4300, -3100],
  [3550, -3060],
  [3000, -3000],
  [2400, -2910],
  [1800, -2800],
  [1230, -2680],
  [700, -2500],
  [100, -2380],
  [-500, -2200],
  [-1020, -2050],
  [-1500, -1800],
  [-2010, -1610],
  [-2500, -1400],
  [-3020, -1090],
  [-3500, -700],
  [-3850, -380],
  [-4200, 0],
  [-4530, 420],
  [-4800, 800],
  [-4940, 1230],
  [-5000, 1700],
  [-4820, 2220],
  [-4700, 2600],
  [-4470, 2840],
  [-4200, 3000],
  [-3850, 2920],
  [-3550, 2940],
  [-3200, 2900],
  [-2880, 3220],
  [-2700, 3500],
  [-2810, 3920],
  [-3000, 4200],
  [-3350, 4110],
  [-3700, 4050],
  [-4050, 3950],
  [-4350, 3900],
  [-4620, 4050],
  [-4800, 4150],
  [-4760, 4420],
  [-4700, 4650],
  [-4580, 4780],
] as const satisfies readonly XZPoint[]

export const TERRAIN_POLYGONS = {
  industrialPlateau: [
    [-1900, 3400],
    [2900, 3300],
    [3100, 850],
    [-1700, 850],
  ],
  easternPlain: [
    [800, 2700],
    [7000, 2750],
    [7000, -2500],
    [5400, -2600],
    [2500, -1500],
    [900, 0],
  ],
  radarRidge: [
    [1900, 4850],
    [5350, 4850],
    [5550, 2800],
    [4350, 2200],
    [2150, 2600],
  ],
  radarLowerBench: [
    [2200, 4550],
    [2850, 4820],
    [4300, 4740],
    [5150, 4200],
    [5120, 3050],
    [4250, 2480],
    [2920, 2750],
    [2200, 3450],
  ],
  radarMidSlope: [
    [2780, 4380],
    [3400, 4640],
    [4380, 4470],
    [4820, 3860],
    [4560, 3120],
    [3550, 2880],
    [2780, 3440],
  ],
  radarUpperPlateau: [
    [3250, 4270],
    [3820, 4520],
    [4520, 4200],
    [4550, 3650],
    [3760, 3380],
    [3250, 3720],
  ],
  radarSummitLobe: [
    [3400, 4270],
    [3720, 4400],
    [4040, 4280],
    [4100, 3980],
    [3820, 3790],
    [3470, 3890],
  ],
  harborPavement: [
    [-4450, 4450],
    [-2850, 4450],
    [-2350, 2550],
    [-4550, 2550],
  ],
  storageHardstand: [
    [-1550, 3150],
    [2750, 3000],
    [2800, 1050],
    [-1450, 1050],
  ],
  beachSand: [
    [3000, -3000],
    [3550, -3060],
    [4300, -3100],
    [4900, -3010],
    [5500, -2900],
    [5980, -3060],
    [6400, -3300],
    [6150, -2830],
    [5550, -2550],
    [4900, -2600],
    [4250, -2650],
    [3500, -2580],
    [3150, -2700],
  ],
  beachIntertidal: [
    [3000, -3000],
    [3550, -3060],
    [4300, -3100],
    [4900, -3010],
    [5500, -2900],
    [5980, -3060],
    [6400, -3300],
    [6400, -3450],
    [5980, -3210],
    [5500, -3050],
    [4900, -3160],
    [4300, -3250],
    [3550, -3210],
    [3000, -3150],
  ],
  beachShallows: [
    [3000, -3150],
    [3550, -3210],
    [4300, -3250],
    [4900, -3160],
    [5500, -3050],
    [5980, -3210],
    [6400, -3450],
    [7000, -3750],
    [7000, -4300],
    [6400, -4050],
    [5980, -3810],
    [5500, -3650],
    [4900, -3710],
    [4300, -3800],
    [3550, -3760],
    [3000, -3700],
  ],
} as const satisfies Record<string, readonly XZPoint[]>

export const RADAR_PAD_POLYGONS = {
  search: [
    [3330, 4150],
    [3394, 4306],
    [3550, 4370],
    [3706, 4306],
    [3770, 4150],
    [3706, 3994],
    [3550, 3930],
    [3394, 3994],
  ],
  tracking: [
    [4175, 4000],
    [4219, 4106],
    [4325, 4150],
    [4431, 4106],
    [4475, 4000],
    [4431, 3894],
    [4325, 3850],
    [4219, 3894],
  ],
  sam01: [
    [2980, 3375],
    [3001, 3424],
    [3050, 3445],
    [3099, 3424],
    [3120, 3375],
    [3099, 3326],
    [3050, 3305],
    [3001, 3326],
  ],
  sam02: [
    [3355, 3450],
    [3376, 3499],
    [3425, 3520],
    [3474, 3499],
    [3495, 3450],
    [3474, 3401],
    [3425, 3380],
    [3376, 3401],
  ],
  sam03: [
    [3480, 3150],
    [3501, 3199],
    [3550, 3220],
    [3599, 3199],
    [3620, 3150],
    [3599, 3101],
    [3550, 3080],
    [3501, 3101],
  ],
  sam04: [
    [3130, 3025],
    [3151, 3074],
    [3200, 3095],
    [3249, 3074],
    [3270, 3025],
    [3249, 2976],
    [3200, 2955],
    [3151, 2976],
  ],
  aaa: [
    [4495, 3300],
    [4533, 3392],
    [4625, 3430],
    [4717, 3392],
    [4755, 3300],
    [4717, 3208],
    [4625, 3170],
    [4533, 3208],
  ],
} as const satisfies Record<string, readonly XZPoint[]>

export const RADAR_SUPPORT_POLYGONS = [
  [
    [3865, 3610],
    [4035, 3610],
    [4035, 3490],
    [3865, 3490],
  ],
  [
    [4115, 3560],
    [4285, 3560],
    [4285, 3440],
    [4115, 3440],
  ],
  [
    [3740, 3385],
    [3910, 3385],
    [3910, 3265],
    [3740, 3265],
  ],
] as const satisfies readonly (readonly XZPoint[])[]

export const HARBOR_WAREHOUSE_POLYGONS = [
  [
    [-3975, 4395],
    [-3360, 4480],
    [-3330, 4260],
    [-3945, 4175],
  ],
  [
    [-3110, 2685],
    [-2590, 2705],
    [-2598, 2915],
    [-3118, 2895],
  ],
] as const satisfies readonly (readonly XZPoint[])[]

export const WORLD_ROADS = {
  harborIndustrialLink: {
    widthM: 12,
    points: [
      [-3200, 8.4, 2450],
      [-2850, 8.4, 2400],
      [-2200, 15, 2500],
      [-1700, 26, 2750],
      [-1300, 30.4, 2850],
    ],
  },
  ridgeAccess: {
    widthM: 8,
    points: [
      [300, 30.4, 2950],
      [500, 30.4, 2750],
      [1300, 30.4, 3150],
      [2100, 88.4, 3500],
      [2850, 170.4, 3700],
      [3600, 190.4, 3800],
      [4200, 190.4, 4050],
      [4550, 170.4, 4100],
    ],
  },
  radarRing: {
    widthM: 7,
    points: [
      [3150, 170.4, 4300],
      [3900, 170.4, 4550],
      [4550, 170.4, 4100],
      [4700, 122.4, 3350],
      [3900, 170.4, 3000],
      [3150, 170.4, 3300],
      [2900, 170.4, 3850],
      [3150, 170.4, 4300],
    ],
  },
  easternTrunk: {
    widthM: 14,
    points: [
      [600, 30.4, 1400],
      [1300, 30.4, 1000],
      [2200, 28.4, 400],
      [3100, 28.4, -300],
      [4000, 28.4, -1100],
      [5000, 28.4, -1900],
      [6050, 28.4, -1600],
    ],
  },
  beachExit: {
    widthM: 10,
    points: [
      [4300, 3.4, -2920],
      [4250, 5, -2700],
      [4200, 12, -2480],
      [4200, 22, -2280],
      [4100, 28, -2080],
    ],
  },
  beachAccessEast: {
    widthM: 10,
    points: [
      [5450, 3.4, -2860],
      [5550, 6, -2680],
      [5700, 14, -2480],
      [5750, 22, -2280],
      [6000, 28, -2050],
    ],
  },
} as const satisfies Record<string, { readonly widthM: number; readonly points: readonly WorldPosition[] }>

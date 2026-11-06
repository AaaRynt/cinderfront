type Position = [number, number, number]

export const ENVIRONMENT_DETAILS = {
  'inspection-bay': {
    label: 'Inspection bay',
    position: [4397.230313581159, 49.36963547700952, 209.87631869817645],
    target: [4358.34334929888, 45.76729691853704, 230.16927336004582],
  },
  'shore-break': { label: 'Shore break', position: [5540, 12.5, -2987], target: [5501, 0.3, -2925] },
  'fuel-shock': { label: 'Fuel shock (T+92)', position: [-549, 58, 1709], target: [-399, 35.5, 1819] },
} satisfies Record<string, { label: string; position: Position; target: Position }>

export type EnvironmentDetailPreset = keyof typeof ENVIRONMENT_DETAILS

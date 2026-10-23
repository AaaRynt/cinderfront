import { describe, expect, it, vi } from 'vitest'

import { sampleStage4AFuelFireIntensity, STAGE4A_FUEL_HERO_TIME_SECONDS } from './fuelDisasterMath'
import { Stage4AFuelDisaster } from './Stage4AFuelDisaster'

vi.mock('react', async (importOriginal) => ({ ...(await importOriginal<typeof import('react')>()), useMemo: <T,>(factory: () => T) => factory() }))

function renderedLightIntensities(timeSeconds: number) {
  const result = Stage4AFuelDisaster({ timeSeconds, surfaceHeightAt: () => 0 })
  return result.props.children.filter((child: { type?: string } | null) => child?.type === 'pointLight').map((child: { props: { intensity: number } }) => child.props.intensity) as number[]
}

describe('runtime fuel fire lighting', () => {
  it('preserves exact original light intensities through the scripted interval', () => {
    for (let tick = 0; tick <= 1800; tick++) {
      const time = tick / 10
      expect(renderedLightIntensities(time)).toEqual([520 * sampleStage4AFuelFireIntensity(STAGE4A_FUEL_HERO_TIME_SECONDS + 0.25, time, 0.7), 310 * sampleStage4AFuelFireIntensity(95.32, time, 2.1)])
    }
  })

  it('keeps actual rendered light intensities finite and varying at late finite observations', () => {
    for (const time of [180.0001, 240, 7200, 72000, Number.MAX_VALUE / 2, Number.MAX_VALUE]) {
      const intensities = renderedLightIntensities(time)
      expect(intensities).toHaveLength(2)
      expect(intensities.every((value) => Number.isFinite(value) && value > 0)).toBe(true)
      expect(intensities[0]).toBeLessThanOrEqual(520 * 0.96)
      expect(intensities[1]).toBeLessThanOrEqual(310 * 0.96)
    }
    expect(renderedLightIntensities(7200)).not.toEqual(renderedLightIntensities(7200.1))
  })
})

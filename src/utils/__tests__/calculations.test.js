import { describe, it, expect } from 'vitest'
import {
  parsePositiveNumber,
  roundTo,
  formatMetric,
  formatDoseDisplay,
  calculateReconstitution,
  suggestSyringeSize
} from '../calculations.js'

describe('parsePositiveNumber & numeric formatting', () => {
  it('parses numbers and pt-BR comma strings cleanly', () => {
    expect(parsePositiveNumber(5)).toBe(5)
    expect(parsePositiveNumber('2.5')).toBe(2.5)
    expect(parsePositiveNumber('2,5')).toBe(2.5)
    expect(parsePositiveNumber('  0,25 ')).toBe(0.25)
  })

  it('rejects empty, invalid, zero, and negative inputs', () => {
    expect(parsePositiveNumber(null)).toBeNull()
    expect(parsePositiveNumber(undefined)).toBeNull()
    expect(parsePositiveNumber('')).toBeNull()
    expect(parsePositiveNumber('0')).toBeNull()
    expect(parsePositiveNumber(-3)).toBeNull()
    expect(parsePositiveNumber('2.5mg')).toBeNull()
    expect(parsePositiveNumber(Infinity)).toBeNull()
  })

  it('roundTo never produces NaN on scientific notation values like 1e-7', () => {
    expect(roundTo(1e-7, 3)).toBe(0)
    expect(roundTo(1e-7, 7)).toBe(0.0000001)
    expect(roundTo(-1e-7, 3)).toBe(0)
    expect(roundTo(NaN, 3)).toBe(0)
    expect(roundTo(2.3456, 2)).toBe(2.35)
  })

  it('formatMetric avoids rounding tiny positive values down to 0', () => {
    expect(formatMetric(0, 3)).toBe('0')
    expect(formatMetric(0.0002, 3)).toBe('< 0.001')
    expect(formatMetric(0.005, 2)).toBe('< 0.01')
    expect(formatMetric(2.5, 2)).toBe('2.5')
  })

  it('formatDoseDisplay formats mg, mcg and UI accurately', () => {
    expect(formatDoseDisplay(50, 'UI')).toBe('50 UI')
    expect(formatDoseDisplay(0.1, 'mg', true)).toBe('100 mcg (0.1 mg)')
    expect(formatDoseDisplay(0.05, 'mg', false)).toBe('50 mcg (0.05 mg)')
    expect(formatDoseDisplay(2.5, 'mg', false)).toBe('2.5 mg')
  })
})

describe('calculateReconstitution', () => {
  it('returns ready: false when any required parameter is missing or invalid', () => {
    expect(calculateReconstitution({ vialAmount: 15, diluentMl: 2, syringeMl: 1, doseAmount: null })).toEqual({
      ready: false
    })
    expect(calculateReconstitution({ vialAmount: 0, diluentMl: 2, syringeMl: 1, doseAmount: 2.5 })).toEqual({
      ready: false
    })
  })

  it('computes standard reconstitution metrics accurately', () => {
    const res = calculateReconstitution({
      vialAmount: 15,
      diluentMl: 2,
      syringeMl: 1,
      doseAmount: 2.5,
      unit: 'mg'
    })
    expect(res.ready).toBe(true)
    expect(res.concentration).toBeCloseTo(7.5, 6)
    expect(res.drawVolume).toBeCloseTo(1 / 3, 6)
    expect(res.drawUnits).toBeCloseTo(33.3333, 3)
    expect(res.fullDoses).toBe(6)
    expect(res.leftoverAmount).toBe(0)
    expect(res.exceedsVial).toBe(false)
    expect(res.exceedsSyringe).toBe(false)
    expect(res.isMicroVolume).toBe(false)
    expect(res.status).toBe('normal')
  })

  it('handles floating point 0.3 / 0.1 = 3 without losing a full dose', () => {
    const res = calculateReconstitution({
      vialAmount: 0.3,
      diluentMl: 3,
      syringeMl: 1,
      doseAmount: 0.1,
      unit: 'mg'
    })
    expect(res.fullDoses).toBe(3)
    expect(res.leftoverAmount).toBe(0)
  })

  it('computes leftover vial amount and volume when doses are not an integer multiple', () => {
    const res = calculateReconstitution({
      vialAmount: 10,
      diluentMl: 2,
      syringeMl: 1,
      doseAmount: 3,
      unit: 'mg'
    })
    expect(res.fullDoses).toBe(3)
    expect(res.leftoverAmount).toBe(1)
    expect(res.leftoverVolumeMl).toBe(0.2)
  })

  it('flags critical error when dose exceeds total vial content', () => {
    const res = calculateReconstitution({
      vialAmount: 5,
      diluentMl: 2,
      syringeMl: 1,
      doseAmount: 10,
      unit: 'mg'
    })
    expect(res.exceedsVial).toBe(true)
    expect(res.exceedsSyringe).toBe(false)
    expect(res.status).toBe('critical')
    expect(res.fillPercentage).toBe(0)
  })

  it('flags syringe overflow and recommends larger syringe when possible', () => {
    const res = calculateReconstitution({
      vialAmount: 10,
      diluentMl: 2,
      syringeMl: 0.3,
      doseAmount: 2.5,
      unit: 'mg'
    })
    expect(res.drawVolume).toBeCloseTo(0.5, 6)
    expect(res.exceedsSyringe).toBe(true)
    expect(res.recommendedSyringeMl).toBe(0.5)
    expect(res.requiredSyringes).toBe(2)
    expect(res.status).toBe('danger')
    expect(res.fillPercentage).toBe(100)

    const over1ml = calculateReconstitution({
      vialAmount: 10,
      diluentMl: 4,
      syringeMl: 1,
      doseAmount: 5,
      unit: 'mg'
    })
    expect(over1ml.drawVolume).toBeCloseTo(2, 6)
    expect(over1ml.exceedsSyringe).toBe(true)
    expect(over1ml.recommendedSyringeMl).toBeNull()
    expect(over1ml.requiredSyringes).toBe(2)
  })

  it('flags micro-volume (< 5 U) and suggests 0.3mL syringe when using larger syringes', () => {
    const res = calculateReconstitution({
      vialAmount: 10,
      diluentMl: 1,
      syringeMl: 1,
      doseAmount: 0.25,
      unit: 'mg'
    })
    expect(res.drawUnits).toBeCloseTo(2.5, 6)
    expect(res.isMicroVolume).toBe(true)
    expect(res.suggestSmallerSyringe).toBe(true)
    expect(res.status).toBe('warning')
  })

  it('supports UI unit cleanly', () => {
    const res = calculateReconstitution({
      vialAmount: 500,
      diluentMl: 5,
      syringeMl: 1,
      doseAmount: 50,
      unit: 'UI'
    })
    expect(res.concentration).toBe(100)
    expect(res.drawVolume).toBe(0.5)
    expect(res.drawUnits).toBe(50)
    expect(res.fullDoses).toBe(10)
    expect(res.amountPerUnit).toBe(1)
    expect(res.formattedAmountPerUnit).toBe('1 UI')
  })

  it('computes formattedAmountPerUnit across mcg, sub-mg and mg concentrations', () => {
    const sub100mcg = calculateReconstitution({
      vialAmount: 15,
      diluentMl: 2,
      syringeMl: 1,
      doseAmount: 2.5,
      unit: 'mg'
    })
    expect(sub100mcg.formattedAmountPerUnit).toBe('75 mcg (0.075 mg)')

    const sub1mg = calculateReconstitution({
      vialAmount: 90,
      diluentMl: 2,
      syringeMl: 0.3,
      doseAmount: 1,
      unit: 'mg'
    })
    expect(sub1mg.formattedAmountPerUnit).toBe('0.45 mg (450 mcg)')

    const over1mg = calculateReconstitution({
      vialAmount: 1000,
      diluentMl: 5,
      syringeMl: 1,
      doseAmount: 50,
      unit: 'mg'
    })
    expect(over1mg.formattedAmountPerUnit).toBe('2 mg')
  })

  it('recommends ideal diluent volume for micro-volume and over-1mL overflow alerts', () => {
    const tirz90Micro = calculateReconstitution({
      vialAmount: 90,
      diluentMl: 2,
      syringeMl: 0.3,
      doseAmount: 1,
      unit: 'mg'
    })
    expect(tirz90Micro.isMicroVolume).toBe(true)
    expect(tirz90Micro.recommendedDiluentForMicroVolume).toBe(4.5)
    expect(tirz90Micro.resultingUnitsAtRecommendedDiluent).toBe(5)

    const overflow = calculateReconstitution({
      vialAmount: 10,
      diluentMl: 4,
      syringeMl: 1,
      doseAmount: 5,
      unit: 'mg'
    })
    expect(overflow.exceedsSyringe).toBe(true)
    expect(overflow.recommendedSyringeMl).toBeNull()
    expect(overflow.recommendedDiluentForOverflow).toBe(1)
    expect(overflow.resultingUnitsAtOverflowDiluent).toBe(50)
  })
})

describe('suggestSyringeSize', () => {
  it('returns null suggestion when inputs are incomplete', () => {
    expect(suggestSyringeSize({ vialAmount: 15, diluentMl: 2, doseAmount: null })).toEqual({
      suggestedSyringeMl: null,
      estimatedVolumeMl: null,
      estimatedUnits: null,
      exceedsVial: false,
      exceedsMaxSyringe: false
    })
  })

  it('returns exceedsVial without suggesting a syringe when dose exceeds vial', () => {
    const res = suggestSyringeSize({ vialAmount: 5, diluentMl: 2, doseAmount: 10 })
    expect(res.suggestedSyringeMl).toBeNull()
    expect(res.exceedsVial).toBe(true)
    expect(res.exceedsMaxSyringe).toBe(false)
  })

  it('suggests 0.3mL syringe for volumes <= 0.3mL', () => {
    expect(suggestSyringeSize({ vialAmount: 20, diluentMl: 2, doseAmount: 1.5 }).suggestedSyringeMl).toBe(0.3)
    expect(suggestSyringeSize({ vialAmount: 10, diluentMl: 2, doseAmount: 1.5 }).suggestedSyringeMl).toBe(0.3)
  })

  it('suggests 0.5mL syringe for 0.3mL < volume <= 0.5mL', () => {
    const res1 = suggestSyringeSize({ vialAmount: 15, diluentMl: 2, doseAmount: 2.5 })
    expect(res1.estimatedVolumeMl).toBeCloseTo(1 / 3, 6)
    expect(res1.suggestedSyringeMl).toBe(0.5)

    const res2 = suggestSyringeSize({ vialAmount: 10, diluentMl: 2, doseAmount: 2.5 })
    expect(res2.estimatedVolumeMl).toBeCloseTo(0.5, 6)
    expect(res2.suggestedSyringeMl).toBe(0.5)
  })

  it('suggests 1mL syringe for volumes > 0.5mL and flags > 1mL overflow', () => {
    const res1 = suggestSyringeSize({ vialAmount: 15, diluentMl: 2, doseAmount: 5 })
    expect(res1.suggestedSyringeMl).toBe(1)
    expect(res1.exceedsMaxSyringe).toBe(false)

    const res2 = suggestSyringeSize({ vialAmount: 10, diluentMl: 2, doseAmount: 5 })
    expect(res2.estimatedVolumeMl).toBeCloseTo(1, 6)
    expect(res2.suggestedSyringeMl).toBe(1)
    expect(res2.exceedsMaxSyringe).toBe(false)

    const resOver = suggestSyringeSize({ vialAmount: 10, diluentMl: 3, doseAmount: 5 })
    expect(resOver.estimatedVolumeMl).toBeCloseTo(1.5, 6)
    expect(resOver.suggestedSyringeMl).toBe(1)
    expect(resOver.exceedsMaxSyringe).toBe(true)
  })
})

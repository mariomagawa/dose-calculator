import { describe, it, expect } from 'vitest'
import {
  formatHalfLife,
  calculateAnalyticalSteadyState,
  computeSimulationHorizon,
  simulateProtocolCurve,
  calculateVialDuration,
  formatDuration
} from '../pharmacokinetics.js'

describe('formatHalfLife', () => {
  it('formats minutes, hours and days cleanly', () => {
    expect(formatHalfLife(0.03)).toBe('43min')
    expect(formatHalfLife(0.25)).toBe('6h')
    expect(formatHalfLife(5)).toBe('5d')
    expect(formatHalfLife(0)).toBe('—')
  })
})

describe('calculateAnalyticalSteadyState', () => {
  it('computes exact steady state peak, trough, average and fluctuation for GLP-1 agonists', () => {
    const res = calculateAnalyticalSteadyState(5, 7, 5)
    const decay = Math.pow(0.5, 7 / 5)
    expect(res.peakSteady).toBeCloseTo(5 / (1 - decay), 6)
    expect(res.troughSteady).toBeCloseTo((5 / (1 - decay)) * decay, 6)
    expect(res.averageSteady).toBeCloseTo((5 * 5) / (Math.LN2 * 7), 6)
    expect(res.isCompleteWashout).toBe(false)
    expect(Number.isFinite(res.fluctuationPct)).toBe(true)
  })

  it('prevents Infinity% or NaN fluctuation for ultra-short half-life peptides like CJC without DAC', () => {
    const res = calculateAnalyticalSteadyState(0.1, 1, 0.03)
    expect(res.isCompleteWashout).toBe(true)
    expect(res.fluctuationPct).toBeNull()
    expect(res.peakSteady).toBeCloseTo(0.1, 5)
    expect(Number.isFinite(res.troughSteady)).toBe(true)
  })
})

describe('computeSimulationHorizon & simulateProtocolCurve', () => {
  it('uses shared horizon covering steady-state even for long half-life hormones', () => {
    const horizon = computeSimulationHorizon(8, [3.5, 7])
    expect(horizon).toBeGreaterThanOrEqual(44)
    expect(horizon).toBeLessThanOrEqual(90)
  })

  it('never drops doses across standard and fractional custom intervals and ends at shared horizon', () => {
    const totalDays = computeSimulationHorizon(5, [1.5, 7])
    for (const interval of [0.25, 1.5, 3.5, 7]) {
      const curve = simulateProtocolCurve(2.5, interval, 5, totalDays)
      expect(curve).not.toBeNull()
      expect(curve.totalDays).toBe(totalDays)
      const lastPoint = curve.points[curve.points.length - 1]
      expect(lastPoint.time).toBeCloseTo(totalDays, 4)

      // Check every scheduled dose time tk has a peak jump
      const expectedDoses = Math.floor((totalDays - 1e-6) / interval) + 1
      let jumpCount = 0
      for (let i = 0; i < curve.points.length; i++) {
        const prevLoad = i === 0 ? 0 : curve.points[i - 1].load
        if (curve.points[i].load - prevLoad >= 2.49) {
          jumpCount++
        }
      }
      expect(jumpCount).toBe(expectedDoses)
    }
  })

  it('guards very small intervals (< 0.125d) without hanging or producing huge arrays', () => {
    const curve = simulateProtocolCurve(1, 0.01, 0.5, 14)
    expect(curve.points.length).toBeLessThanOrEqual(1500)
  })
})

describe('calculateVialDuration & formatDuration', () => {
  it('calculates vial duration independently of diluent', () => {
    const res = calculateVialDuration({ vialAmount: 15, dose: 2.5, intervalDays: 7 })
    expect(res).not.toBeNull()
    expect(res.fullDoses).toBe(6)
    expect(res.durationDays).toBe(42)
    expect(res.weeklyConsumption).toBe(2.5)
    expect(res.exceedsVial).toBe(false)
  })

  it('flags exceedsVial when dose exceeds vial content', () => {
    const res = calculateVialDuration({ vialAmount: 5, dose: 10, intervalDays: 7 })
    expect(res.exceedsVial).toBe(true)
  })

  it('formats durations without ever outputting "1 semana e 7 dias"', () => {
    expect(formatDuration(6.96)).toBe('1 semana')
    expect(formatDuration(13.96)).toBe('2 semanas')
    expect(formatDuration(28)).toBe('4 semanas')
    expect(formatDuration(7)).toBe('1 semana')
    expect(formatDuration(1)).toBe('1 dia')
    expect(formatDuration(8)).toBe('1 semana e 1 dia')
    expect(formatDuration(10)).toBe('1 semana e 3 dias')
    expect(formatDuration(0)).toBe('-')
  })
})

import { parsePositiveNumber, roundTo } from './calculations.js'

/**
 * Formata meia-vida em minutos, horas ou dias legíveis.
 */
export function formatHalfLife(halfLifeDays) {
  if (typeof halfLifeDays !== 'number' || !Number.isFinite(halfLifeDays) || halfLifeDays <= 0) {
    return '—'
  }
  if (halfLifeDays < 1) {
    const hours = Math.round(halfLifeDays * 24 * 10) / 10
    if (hours < 1) {
      return `${Math.max(1, Math.round(halfLifeDays * 24 * 60))}min`
    }
    return `${hours}h`
  }
  return `${roundTo(halfLifeDays, 1)}d`
}

/**
 * Calcula valores analíticos exatos em steady-state para decaimento de 1ª ordem.
 */
export function calculateAnalyticalSteadyState(dose, intervalDays, halfLifeDays) {
  const decayFactor = Math.pow(0.5, intervalDays / halfLifeDays)
  const peakSteady = decayFactor >= 1 ? dose : dose / (1 - decayFactor)
  const troughSteady = peakSteady * decayFactor
  const averageSteady = (dose * halfLifeDays) / (Math.LN2 * intervalDays)
  const accumulationRatio = decayFactor >= 1 ? 1 : 1 / (1 - decayFactor)
  const isCompleteWashout = decayFactor < 0.005
  const fluctuationPct =
    isCompleteWashout || troughSteady <= 0
      ? null
      : ((peakSteady - troughSteady) / troughSteady) * 100

  return {
    decayFactor,
    peakSteady,
    troughSteady,
    averageSteady,
    accumulationRatio,
    isCompleteWashout,
    fluctuationPct
  }
}

/**
 * Calcula um horizonte de simulação compartilhado entre protocolos para alinhar o eixo X.
 */
export function computeSimulationHorizon(halfLifeDays, intervals = []) {
  const validIntervals = intervals.filter(v => typeof v === 'number' && Number.isFinite(v) && v > 0)
  const maxInterval = validIntervals.length > 0 ? Math.max(...validIntervals) : 7
  const safeMaxInterval = Math.max(0.25, maxInterval)

  if (halfLifeDays < 0.3) {
    return Math.max(7, Math.min(14, Math.ceil(safeMaxInterval * 6)))
  }
  if (halfLifeDays < 2) {
    return Math.max(14, Math.min(28, Math.ceil(safeMaxInterval * 7)))
  }
  return Math.max(
    35,
    Math.min(90, Math.max(Math.ceil(halfLifeDays * 5.5), Math.ceil(safeMaxInterval * 6)))
  )
}

/**
 * Gera pontos determinísticos (O(N)) para a curva de empilhamento sem drift de ponto flutuante.
 */
export function simulateProtocolCurve(dose, intervalDays, halfLifeDays, totalDays) {
  const safeDose = parsePositiveNumber(dose)
  const rawInterval = parsePositiveNumber(intervalDays)
  const safeHalfLife = parsePositiveNumber(halfLifeDays)
  if (safeDose === null || rawInterval === null || safeHalfLife === null) {
    return null
  }

  const safeInterval = Math.max(rawInterval, 0.125)
  const safeTotalDays =
    typeof totalDays === 'number' && Number.isFinite(totalDays) && totalDays > 0
      ? totalDays
      : computeSimulationHorizon(safeHalfLife, [safeInterval])

  const approxIntervals = Math.max(1, Math.ceil(safeTotalDays / safeInterval))
  const samplesPerInterval = Math.max(1, Math.min(24, Math.floor(1200 / approxIntervals) - 2))

  const points = []
  const intervalDecay = Math.pow(0.5, safeInterval / safeHalfLife)
  let currentPostDoseLoad = 0
  const maxK = Math.floor((safeTotalDays - 1e-6) / safeInterval)

  for (let k = 0; k <= maxK; k++) {
    const tk = k * safeInterval
    let preDoseLoad = 0

    if (k > 0) {
      preDoseLoad = currentPostDoseLoad * intervalDecay
      points.push({
        time: Math.max(0, Number((tk - 1e-5).toFixed(5))),
        load: preDoseLoad
      })
    }

    currentPostDoseLoad = preDoseLoad + safeDose
    points.push({
      time: Number(tk.toFixed(5)),
      load: currentPostDoseLoad
    })

    const nextTk = Math.min((k + 1) * safeInterval, safeTotalDays)
    const span = nextTk - tk
    if (span > 1e-6) {
      for (let s = 1; s <= samplesPerInterval; s++) {
        const frac = s / samplesPerInterval
        if (s < samplesPerInterval) {
          const t = tk + span * frac
          points.push({
            time: Number(t.toFixed(5)),
            load: currentPostDoseLoad * Math.pow(0.5, (t - tk) / safeHalfLife)
          })
        } else if (nextTk < (k + 1) * safeInterval - 1e-6) {
          points.push({
            time: Number(safeTotalDays.toFixed(5)),
            load: currentPostDoseLoad * Math.pow(0.5, (safeTotalDays - tk) / safeHalfLife)
          })
        } else if (k === maxK && Math.abs(nextTk - safeTotalDays) <= 1e-6) {
          points.push({
            time: Number(safeTotalDays.toFixed(5)),
            load: currentPostDoseLoad * Math.pow(0.5, (safeTotalDays - tk) / safeHalfLife)
          })
        }
      }
    }
  }

  const steady = calculateAnalyticalSteadyState(safeDose, safeInterval, safeHalfLife)

  return {
    points,
    totalDays: safeTotalDays,
    dose: safeDose,
    interval: rawInterval,
    effectiveInterval: safeInterval,
    ...steady
  }
}

/**
 * Calcula rendimento e duração estimada do frasco (independe do diluente).
 */
export function calculateVialDuration({ vialAmount, dose, intervalDays }) {
  const vial = parsePositiveNumber(vialAmount)
  const doseVal = parsePositiveNumber(dose)
  const freq = parsePositiveNumber(intervalDays)

  if (vial === null || doseVal === null || freq === null) {
    return null
  }

  const rawDoses = vial / doseVal
  const fullDoses = Math.floor(rawDoses + 1e-9)
  const remainderRatio = rawDoses - fullDoses
  const leftoverFraction = remainderRatio > 0.02 ? remainderRatio : 0
  const leftoverAmount =
    leftoverFraction > 0 ? Math.max(0, roundTo(vial - fullDoses * doseVal, 3)) : 0
  const durationDays = rawDoses * freq
  const fullDosesDurationDays = fullDoses * freq
  const weeklyConsumption = (doseVal / freq) * 7
  const exceedsVial = doseVal > vial + 1e-9

  return {
    rawDoses,
    fullDoses,
    leftoverFraction,
    leftoverAmount,
    durationDays,
    fullDosesDurationDays,
    weeklyConsumption,
    exceedsVial
  }
}

/**
 * Formata uma duração em dias para semanas e dias sem gerar "1 semana e 7 dias".
 */
export function formatDuration(days) {
  if (typeof days !== 'number' || !Number.isFinite(days) || days <= 0) return '-'

  const totalRounded = Math.round(days * 10) / 10
  let weeks = Math.floor(totalRounded / 7)
  let remainingDays = Math.round((totalRounded - weeks * 7) * 10) / 10

  if (remainingDays >= 7) {
    weeks += 1
    remainingDays = 0
  }

  const weekLabel = weeks === 1 ? 'semana' : 'semanas'
  const dayLabel = remainingDays === 1 ? 'dia' : 'dias'

  if (weeks === 0) {
    return `${remainingDays} ${dayLabel}`
  }
  if (remainingDays === 0) {
    return `${weeks} ${weekLabel}`
  }
  return `${weeks} ${weekLabel} e ${remainingDays} ${dayLabel}`
}

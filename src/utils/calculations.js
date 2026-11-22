const SYRINGE_SIZES = [0.3, 0.5, 1]

/**
 * Converte entradas numéricas (inclusive com vírgula pt-BR) em número estritamente positivo.
 * Retorna null para valores vazios, inválidos ou <= 0.
 */
export function parsePositiveNumber(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? val : null
  }
  if (typeof val === 'string') {
    const normalized = val.trim().replace(',', '.')
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

/**
 * Arredonda um número de forma segura (sem quebrar em notação científica como 1e-7).
 */
export function roundTo(num, decimals = 3) {
  if (typeof num !== 'number' || !Number.isFinite(num)) return 0
  const clampedDecimals = Math.max(0, Math.min(10, Math.trunc(decimals)))
  const rounded = Number(num.toFixed(clampedDecimals))
  return Object.is(rounded, -0) ? 0 : rounded
}

/**
 * Formata métricas positivas evitando arredondar valores muito pequenos para "0".
 */
export function formatMetric(num, maxDecimals = 3) {
  if (typeof num !== 'number' || !Number.isFinite(num) || num === 0) return '0'
  const threshold = Math.pow(10, -maxDecimals)
  if (num > 0 && num < threshold) {
    return `< ${threshold.toFixed(maxDecimals)}`
  }
  return String(roundTo(num, maxDecimals))
}

/**
 * Formata a dose exibida conforme a unidade (mg, mcg ou UI).
 */
export function formatDoseDisplay(doseValue, unit = 'mg', preferMcg = false) {
  const num = parsePositiveNumber(doseValue)
  if (num === null) return ''
  if (unit === 'UI') {
    return `${roundTo(num, 2)} UI`
  }
  if (unit === 'mg' && ((preferMcg && num < 1) || num < 0.1)) {
    return `${roundTo(num * 1000, 1)} mcg (${roundTo(num, 4)} mg)`
  }
  return `${roundTo(num, 3)} ${unit}`
}

/**
 * Calcula reconstituição, volume de extração, doses por frasco e alertas clínicos.
 */
export function calculateReconstitution({
  vialAmount,
  diluentMl,
  syringeMl,
  doseAmount,
  unit = 'mg'
}) {
  const vial = parsePositiveNumber(vialAmount)
  const diluent = parsePositiveNumber(diluentMl)
  const syringe = parsePositiveNumber(syringeMl)
  const dose = parsePositiveNumber(doseAmount)

  if (vial === null || diluent === null || syringe === null || dose === null) {
    return { ready: false }
  }

  const concentration = vial / diluent
  const drawVolume = dose / concentration
  const drawUnits = drawVolume * 100
  const rawTotalDoses = vial / dose
  const fullDoses = Math.floor(rawTotalDoses + 1e-9)

  const remainderRatio = rawTotalDoses - fullDoses
  const leftoverFraction = remainderRatio > 0.02 ? remainderRatio : 0
  const leftoverAmount =
    leftoverFraction > 0 ? Math.max(0, roundTo(vial - fullDoses * dose, 3)) : 0
  const leftoverVolumeMl =
    leftoverFraction > 0 && leftoverAmount > 0
      ? roundTo(leftoverAmount / concentration, 3)
      : 0

  const exceedsVial = dose > vial + 1e-9
  const exceedsSyringe = !exceedsVial && drawVolume > syringe + 1e-9

  const recommendedSyringeMl = exceedsSyringe
    ? SYRINGE_SIZES.find(size => size >= drawVolume - 1e-9) ?? null
    : null

  const requiredSyringes = exceedsSyringe
    ? Math.ceil((drawVolume - 1e-9) / syringe)
    : 1

  const isMicroVolume =
    !exceedsVial && !exceedsSyringe && drawUnits > 0 && drawUnits < 5
  const suggestSmallerSyringe = isMicroVolume && syringe > 0.3

  const fillPercentage = exceedsVial
    ? 0
    : Math.min(100, Math.max(0, (drawVolume / syringe) * 100))

  const amountPerUnit = concentration / 100
  let formattedAmountPerUnit = ''
  if (unit === 'UI') {
    formattedAmountPerUnit = `${formatMetric(amountPerUnit, 2)} UI`
  } else if (unit === 'mg' && amountPerUnit < 0.1) {
    formattedAmountPerUnit = `${formatMetric(amountPerUnit * 1000, 1)} mcg (${formatMetric(amountPerUnit, 4)} mg)`
  } else if (unit === 'mg' && amountPerUnit < 1) {
    formattedAmountPerUnit = `${formatMetric(amountPerUnit, 3)} mg (${formatMetric(amountPerUnit * 1000, 0)} mcg)`
  } else {
    formattedAmountPerUnit = `${formatMetric(amountPerUnit, 2)} ${unit}`
  }

  let recommendedDiluentForMicroVolume = null
  let resultingUnitsAtRecommendedDiluent = null
  if (isMicroVolume) {
    const minDiluentFor5U = roundTo((vial * 0.05) / dose, 1)
    const minDiluentFor10U = roundTo((vial * 0.1) / dose, 1)
    if (minDiluentFor10U <= 4 && minDiluentFor10U > diluent) {
      recommendedDiluentForMicroVolume = minDiluentFor10U
    } else if (minDiluentFor5U <= 5 && minDiluentFor5U > diluent) {
      recommendedDiluentForMicroVolume = minDiluentFor5U
    }
    if (recommendedDiluentForMicroVolume !== null) {
      resultingUnitsAtRecommendedDiluent = roundTo(
        (dose / (vial / recommendedDiluentForMicroVolume)) * 100,
        1
      )
    }
  }

  let recommendedDiluentForOverflow = null
  let resultingUnitsAtOverflowDiluent = null
  if (exceedsSyringe && !recommendedSyringeMl) {
    const idealDiluentFor50U = roundTo((vial * 0.5) / dose, 1)
    const maxDiluentFor100U = roundTo((vial * 1.0) / dose, 1)
    if (idealDiluentFor50U >= 0.5 && idealDiluentFor50U < diluent) {
      recommendedDiluentForOverflow = idealDiluentFor50U
    } else if (maxDiluentFor100U >= 0.5 && maxDiluentFor100U < diluent) {
      recommendedDiluentForOverflow = maxDiluentFor100U
    }
    if (recommendedDiluentForOverflow !== null) {
      resultingUnitsAtOverflowDiluent = roundTo(
        (dose / (vial / recommendedDiluentForOverflow)) * 100,
        1
      )
    }
  }

  let status = 'normal'
  if (exceedsVial) status = 'critical'
  else if (exceedsSyringe) status = 'danger'
  else if (isMicroVolume) status = 'warning'

  return {
    ready: true,
    unit,
    vialAmount: vial,
    diluentMl: diluent,
    syringeMl: syringe,
    doseAmount: dose,
    concentration,
    amountPerUnit,
    formattedAmountPerUnit,
    drawVolume,
    drawUnits,
    rawTotalDoses,
    fullDoses,
    leftoverFraction,
    leftoverAmount,
    leftoverVolumeMl,
    exceedsVial,
    exceedsSyringe,
    recommendedSyringeMl,
    requiredSyringes,
    isMicroVolume,
    suggestSmallerSyringe,
    recommendedDiluentForMicroVolume,
    resultingUnitsAtRecommendedDiluent,
    recommendedDiluentForOverflow,
    resultingUnitsAtOverflowDiluent,
    fillPercentage,
    status
  }
}

/**
 * Sugere o menor tamanho de seringa U-100 compatível com base em frasco, diluente e dose.
 */
export function suggestSyringeSize({ vialAmount, diluentMl, doseAmount }) {
  const vial = parsePositiveNumber(vialAmount)
  const diluent = parsePositiveNumber(diluentMl)
  const dose = parsePositiveNumber(doseAmount)

  if (vial === null || diluent === null || dose === null) {
    return {
      suggestedSyringeMl: null,
      estimatedVolumeMl: null,
      estimatedUnits: null,
      exceedsVial: false,
      exceedsMaxSyringe: false
    }
  }

  if (dose > vial + 1e-9) {
    return {
      suggestedSyringeMl: null,
      estimatedVolumeMl: null,
      estimatedUnits: null,
      exceedsVial: true,
      exceedsMaxSyringe: false
    }
  }

  const concentration = vial / diluent
  const estimatedVolumeMl = dose / concentration
  const estimatedUnits = estimatedVolumeMl * 100

  let suggestedSyringeMl = 1
  if (estimatedVolumeMl <= 0.3 + 1e-9) {
    suggestedSyringeMl = 0.3
  } else if (estimatedVolumeMl <= 0.5 + 1e-9) {
    suggestedSyringeMl = 0.5
  }

  const exceedsMaxSyringe = estimatedVolumeMl > 1 + 1e-9

  return {
    suggestedSyringeMl,
    estimatedVolumeMl,
    estimatedUnits,
    exceedsVial: false,
    exceedsMaxSyringe
  }
}

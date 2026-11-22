<template>
  <div class="frequency-view">
    <!-- Configuration Panel -->
    <section class="config-panel card-panel">
      <div class="config-header">
        <div class="title-wrap">
          <span class="step-badge step-zero">
            <FlaskConicalIcon :size="16" />
          </span>
          <div>
            <h3>Simulação Farmacocinética</h3>
            <p class="config-subtitle">
              Configure até dois protocolos para comparar empilhamento, steady-state e flutuação plasmática.
            </p>
          </div>
        </div>
      </div>

      <!-- Medication Selector (+ Custom Half-life if Modo Livre) -->
      <div class="med-controls-grid">
        <div class="config-section">
          <label class="config-label" for="med-select">
            <PillIcon :size="15" />
            <span>Medicamento / Peptídeo</span>
          </label>
          <div class="select-wrap">
            <select
              id="med-select"
              v-model="freqState.selectedMedication"
              class="custom-select"
              @change="handleMedicationChange"
            >
              <optgroup v-for="group in medicationGroups" :key="group.label" :label="group.label">
                <option v-for="med in group.items" :key="med.name" :value="med.name">
                  {{ med.name }} ({{ med.isCustom ? `t½ = ${formatHalfLife(freqState.customHalfLifeDays)}` : `t½ = ${formatHalfLife(med.halfLife)}` }})
                </option>
              </optgroup>
            </select>
            <ChevronDownIcon :size="16" class="select-chevron" />
          </div>
        </div>

        <div v-if="isCustomMedication" class="config-section custom-hl-section">
          <label class="config-label" for="custom-hl-input">
            <span>Meia-vida (dias)</span>
          </label>
          <input
            id="custom-hl-input"
            type="number"
            v-model.number="freqState.customHalfLifeDays"
            min="0.02"
            step="0.5"
            class="field-input mono-num"
          />
        </div>
      </div>

      <!-- Protocols Grid -->
      <div class="protocols-grid">
        <!-- Protocol A -->
        <div class="protocol-card protocol-a">
          <div class="protocol-header">
            <div class="protocol-dot dot-a"></div>
            <input
              type="text"
              v-model="freqState.protocolA.label"
              class="protocol-label-input"
              maxlength="22"
              aria-label="Nome do protocolo A"
            />
            <span class="protocol-style">Tracejado</span>
          </div>

          <div class="protocol-field">
            <div class="field-label-row">
              <label for="dose-a">
                Dose ({{ activeUnit === 'UI' ? 'UI' : freqState.protocolA.doseUnit }})
              </label>
              <div class="field-label-actions">
                <button
                  v-if="showCalcSyncA"
                  type="button"
                  class="btn-sync-calc"
                  @click="syncCalcDose('protocolA')"
                >
                  Usar {{ formatDoseDisplay(state.doseAmount, activeUnit, freqState.protocolA.doseUnit === 'mcg') }} da Calculadora
                </button>
                <div
                  v-if="activeUnit === 'mg'"
                  class="dose-unit-toggle"
                  role="group"
                  aria-label="Unidade da dose do Protocolo A"
                >
                  <button
                    type="button"
                    class="unit-toggle-btn"
                    :class="{ active: freqState.protocolA.doseUnit === 'mg' }"
                    @click="setProtocolDoseUnit('protocolA', 'mg')"
                  >
                    mg
                  </button>
                  <button
                    type="button"
                    class="unit-toggle-btn"
                    :class="{ active: freqState.protocolA.doseUnit === 'mcg' }"
                    @click="setProtocolDoseUnit('protocolA', 'mcg')"
                  >
                    mcg
                  </button>
                </div>
              </div>
            </div>
            <input
              id="dose-a"
              ref="doseInputARef"
              type="text"
              inputmode="decimal"
              :value="doseTextA"
              :placeholder="getDosePlaceholder('protocolA', '5')"
              class="field-input mono-num"
              @input="onDoseInput('protocolA', $event)"
              @blur="onDoseBlur('protocolA')"
            />
          </div>

          <div class="protocol-field">
            <label>Frequência (dias)</label>
            <div class="freq-buttons">
              <button
                v-for="freq in frequencyOptions"
                :key="'a-' + freq.value"
                type="button"
                class="freq-btn mono-num"
                :class="{ selected: freqState.protocolA.freq === freq.value && !freqState.protocolA.customActive }"
                @click="setFreq('protocolA', freq.value)"
              >
                {{ freq.label }}
              </button>
              <div class="freq-custom" :class="{ active: freqState.protocolA.customActive }">
                <input
                  type="number"
                  v-model.number="freqState.protocolA.freqCustom"
                  min="0.125"
                  step="0.25"
                  placeholder="..."
                  aria-label="Frequência personalizada protocolo A"
                  class="freq-custom-input mono-num"
                  @focus="freqState.protocolA.customActive = true"
                  @input="onCustomInput('protocolA')"
                  @blur="onCustomBlur('protocolA')"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Protocol B -->
        <div class="protocol-card protocol-b">
          <div class="protocol-header">
            <div class="protocol-dot dot-b"></div>
            <input
              type="text"
              v-model="freqState.protocolB.label"
              class="protocol-label-input"
              maxlength="22"
              aria-label="Nome do protocolo B"
            />
            <span class="protocol-style">Sólido</span>
          </div>

          <div class="protocol-field">
            <div class="field-label-row">
              <label for="dose-b">
                Dose ({{ activeUnit === 'UI' ? 'UI' : freqState.protocolB.doseUnit }})
              </label>
              <div class="field-label-actions">
                <button
                  v-if="showCalcSyncB"
                  type="button"
                  class="btn-sync-calc"
                  @click="syncCalcDose('protocolB')"
                >
                  Usar {{ formatDoseDisplay(state.doseAmount, activeUnit, freqState.protocolB.doseUnit === 'mcg') }} da Calculadora
                </button>
                <div
                  v-if="activeUnit === 'mg'"
                  class="dose-unit-toggle"
                  role="group"
                  aria-label="Unidade da dose do Protocolo B"
                >
                  <button
                    type="button"
                    class="unit-toggle-btn"
                    :class="{ active: freqState.protocolB.doseUnit === 'mg' }"
                    @click="setProtocolDoseUnit('protocolB', 'mg')"
                  >
                    mg
                  </button>
                  <button
                    type="button"
                    class="unit-toggle-btn"
                    :class="{ active: freqState.protocolB.doseUnit === 'mcg' }"
                    @click="setProtocolDoseUnit('protocolB', 'mcg')"
                  >
                    mcg
                  </button>
                </div>
              </div>
            </div>
            <input
              id="dose-b"
              ref="doseInputBRef"
              type="text"
              inputmode="decimal"
              :value="doseTextB"
              :placeholder="getDosePlaceholder('protocolB', '2.5')"
              class="field-input mono-num"
              @input="onDoseInput('protocolB', $event)"
              @blur="onDoseBlur('protocolB')"
            />
          </div>

          <div class="protocol-field">
            <label>Frequência (dias)</label>
            <div class="freq-buttons">
              <button
                v-for="freq in frequencyOptions"
                :key="'b-' + freq.value"
                type="button"
                class="freq-btn mono-num"
                :class="{ selected: freqState.protocolB.freq === freq.value && !freqState.protocolB.customActive }"
                @click="setFreq('protocolB', freq.value)"
              >
                {{ freq.label }}
              </button>
              <div class="freq-custom" :class="{ active: freqState.protocolB.customActive }">
                <input
                  type="number"
                  v-model.number="freqState.protocolB.freqCustom"
                  min="0.125"
                  step="0.25"
                  placeholder="..."
                  aria-label="Frequência personalizada protocolo B"
                  class="freq-custom-input mono-num"
                  @focus="freqState.protocolB.customActive = true"
                  @input="onCustomInput('protocolB')"
                  @blur="onCustomBlur('protocolB')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <transition name="fade">
        <div v-if="chartDataA || chartDataB" class="summary-stats">
          <div v-if="chartDataA" class="summary-col summary-a">
            <span class="summary-title">
              <span class="protocol-dot dot-a"></span>
              {{ chartDataA.label }}
            </span>
            <div class="summary-row">
              <span>Pico (steady-state)</span>
              <strong class="mono-num">~{{ formatMetric(chartDataA.peakSteady, 2) }}{{ activeUnit }}</strong>
            </div>
            <div class="summary-row">
              <span>Vale (steady-state)</span>
              <strong class="mono-num">
                {{ chartDataA.isCompleteWashout ? `~0${activeUnit}` : `~${formatMetric(chartDataA.troughSteady, 2)}${activeUnit}` }}
              </strong>
            </div>
            <div class="summary-row">
              <span>Média no ciclo</span>
              <strong class="mono-num">~{{ formatMetric(chartDataA.averageSteady, 2) }}{{ activeUnit }}</strong>
            </div>
            <div class="summary-row">
              <span>Acúmulo</span>
              <strong class="mono-num">{{ formatMetric(chartDataA.accumulationRatio, 2) }}×</strong>
            </div>
            <div class="summary-row">
              <span>Flutuação</span>
              <span v-if="chartDataA.isCompleteWashout" class="washout-badge">Sem acúmulo</span>
              <strong v-else class="mono-num">{{ Math.round(chartDataA.fluctuationPct) }}%</strong>
            </div>
          </div>

          <div v-if="chartDataA && chartDataB" class="summary-divider"></div>

          <div v-if="chartDataB" class="summary-col summary-b">
            <span class="summary-title">
              <span class="protocol-dot dot-b"></span>
              {{ chartDataB.label }}
            </span>
            <div class="summary-row">
              <span>Pico (steady-state)</span>
              <strong class="mono-num">~{{ formatMetric(chartDataB.peakSteady, 2) }}{{ activeUnit }}</strong>
            </div>
            <div class="summary-row">
              <span>Vale (steady-state)</span>
              <strong class="mono-num">
                {{ chartDataB.isCompleteWashout ? `~0${activeUnit}` : `~${formatMetric(chartDataB.troughSteady, 2)}${activeUnit}` }}
              </strong>
            </div>
            <div class="summary-row">
              <span>Média no ciclo</span>
              <strong class="mono-num">~{{ formatMetric(chartDataB.averageSteady, 2) }}{{ activeUnit }}</strong>
            </div>
            <div class="summary-row">
              <span>Acúmulo</span>
              <strong class="mono-num">{{ formatMetric(chartDataB.accumulationRatio, 2) }}×</strong>
            </div>
            <div class="summary-row">
              <span>Flutuação</span>
              <span v-if="chartDataB.isCompleteWashout" class="washout-badge">Sem acúmulo</span>
              <strong v-else class="mono-num">{{ Math.round(chartDataB.fluctuationPct) }}%</strong>
            </div>
          </div>
        </div>
      </transition>
    </section>

    <!-- Chart Panel -->
    <section class="chart-panel card-panel">
      <div v-if="!chartDataA && !chartDataB" class="chart-placeholder">
        <div class="placeholder-icon-wrapper">
          <LineChartIcon :size="36" class="placeholder-icon" />
        </div>
        <p>Preencha a dose e a frequência de pelo menos um protocolo para gerar o gráfico de empilhamento.</p>
      </div>

      <StackingChart
        v-else
        :protocol-a="chartDataA"
        :protocol-b="chartDataB"
        :medication="freqState.selectedMedication"
        :unit="activeUnit"
        :theme="state.theme"
      />
    </section>

    <!-- Vial Duration Simulation Panel -->
    <section class="vial-simulation-panel card-panel">
      <div class="sim-header">
        <div class="title-wrap">
          <span class="step-badge">
            <HourglassIcon :size="16" />
          </span>
          <div>
            <h3>Simulação de Duração do Frasco</h3>
            <p class="sim-subtitle">Compare quanto tempo dura o frasco configurado na Calculadora em cada frequência.</p>
          </div>
        </div>
      </div>

      <!-- Vial Info Row (with quick vial selector; diluentMl is optional) -->
      <div class="sim-vial-info-row">
        <div class="quick-vial-selector">
          <div class="quick-vial-header">
            <span class="pill-label">Tamanho do Frasco ({{ activeUnit }})</span>
            <span v-if="!isVialConfigured" class="quick-vial-hint">
              Selecione um frasco abaixo ou na
              <button type="button" class="link-tab" @click="goToCalculator">Calculadora</button>
            </span>
          </div>

          <div class="quick-vial-pills">
            <button
              v-for="v in selectedMedVials"
              :key="'qv-' + v"
              type="button"
              class="quick-vial-btn mono-num"
              :class="{ active: isVialSelected(v) }"
              @click="state.vialAmount = v"
            >
              {{ v }}{{ activeUnit }}
            </button>
            <div class="quick-vial-custom">
              <input
                type="number"
                v-model.number="state.vialAmount"
                min="0.1"
                step="any"
                placeholder="Outro"
                aria-label="Frasco personalizado na simulação"
                class="quick-vial-input mono-num"
              />
              <span class="mono-num">{{ activeUnit }}</span>
            </div>
          </div>
        </div>

        <div v-if="isVialConfigured" class="vial-info-pill-container">
          <div class="vial-info-pill">
            <span class="pill-label">Conteúdo do Frasco</span>
            <strong class="pill-value mono-num">{{ state.vialAmount }}{{ activeUnit }}</strong>
          </div>

          <template v-if="isDiluentConfigured">
            <div class="vial-info-pill">
              <span class="pill-label">Diluente</span>
              <strong class="pill-value mono-num">{{ state.diluentMl }}mL</strong>
            </div>
            <div class="vial-info-pill">
              <span class="pill-label">Concentração</span>
              <strong class="pill-value mono-num">{{ formatMetric(concentration, 2) }}{{ activeUnit }}/mL</strong>
            </div>
          </template>
          <div v-else class="vial-info-pill info-optional">
            <span class="pill-label">Diluente</span>
            <span class="pill-hint">
              Opcional para duração · <button type="button" class="link-tab" @click="goToCalculator">Definir na Calculadora</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Simulation Results Cards -->
      <div class="sim-results-grid">
        <!-- Protocol A Result -->
        <div class="sim-card protocol-a-card" :class="{ disabled: !vialDurationA }">
          <div class="sim-card-header">
            <span class="protocol-title">
              <span class="protocol-dot dot-a"></span>
              {{ freqState.protocolA.label || 'Protocolo A' }}
            </span>
            <span v-if="vialDurationA" class="protocol-summary-badge mono-num">
              {{ formatDoseDisplay(freqState.protocolA.dose, activeUnit, freqState.protocolA.doseUnit === 'mcg') }} / {{ effectiveFreqA }}d
            </span>
          </div>

          <div v-if="vialDurationA" class="sim-card-content">
            <div v-if="vialDurationA.exceedsVial" class="sim-vial-alert">
              <AlertTriangleIcon :size="16" />
              <span>Dose ({{ freqState.protocolA.dose }}{{ activeUnit }}) excede o frasco ({{ state.vialAmount }}{{ activeUnit }}).</span>
            </div>

            <template v-else>
              <div class="main-duration">
                <span class="duration-value">{{ formatDuration(vialDurationA.durationDays) }}</span>
                <span class="duration-label">Duração Estimada</span>
              </div>

              <div class="sim-details">
                <div class="sim-detail-row">
                  <span>Rendimento</span>
                  <strong class="mono-num">
                    {{ vialDurationA.fullDoses }} {{ vialDurationA.fullDoses === 1 ? 'dose' : 'doses' }}
                    <small v-if="vialDurationA.leftoverAmount > 0" class="leftover-note">
                      (+ sobra {{ formatMetric(vialDurationA.leftoverAmount, 2) }}{{ activeUnit }})
                    </small>
                  </strong>
                </div>
                <div class="sim-detail-row">
                  <span>Consumo semanal</span>
                  <strong class="mono-num">{{ formatMetric(vialDurationA.weeklyConsumption, 2) }} {{ activeUnit }}/sem</strong>
                </div>
                <div class="sim-detail-row">
                  <span>Total de dias</span>
                  <strong class="mono-num">{{ Math.round(vialDurationA.durationDays) }} dias</strong>
                </div>
              </div>
            </template>
          </div>
          <div v-else class="sim-card-placeholder">
            <p v-if="!isVialConfigured">
              Defina o frasco na aba <button type="button" class="link-tab" @click="goToCalculator">Calculadora</button> primeiro.
            </p>
            <p v-else>
              Configure a dose e a frequência de {{ freqState.protocolA.label || 'Protocolo A' }} acima.
            </p>
          </div>
        </div>

        <!-- Protocol B Result -->
        <div class="sim-card protocol-b-card" :class="{ disabled: !vialDurationB }">
          <div class="sim-card-header">
            <span class="protocol-title">
              <span class="protocol-dot dot-b"></span>
              {{ freqState.protocolB.label || 'Protocolo B' }}
            </span>
            <span v-if="vialDurationB" class="protocol-summary-badge mono-num">
              {{ formatDoseDisplay(freqState.protocolB.dose, activeUnit, freqState.protocolB.doseUnit === 'mcg') }} / {{ effectiveFreqB }}d
            </span>
          </div>

          <div v-if="vialDurationB" class="sim-card-content">
            <div v-if="vialDurationB.exceedsVial" class="sim-vial-alert">
              <AlertTriangleIcon :size="16" />
              <span>Dose ({{ freqState.protocolB.dose }}{{ activeUnit }}) excede o frasco ({{ state.vialAmount }}{{ activeUnit }}).</span>
            </div>

            <template v-else>
              <div class="main-duration">
                <span class="duration-value">{{ formatDuration(vialDurationB.durationDays) }}</span>
                <span class="duration-label">Duração Estimada</span>
              </div>

              <div class="sim-details">
                <div class="sim-detail-row">
                  <span>Rendimento</span>
                  <strong class="mono-num">
                    {{ vialDurationB.fullDoses }} {{ vialDurationB.fullDoses === 1 ? 'dose' : 'doses' }}
                    <small v-if="vialDurationB.leftoverAmount > 0" class="leftover-note">
                      (+ sobra {{ formatMetric(vialDurationB.leftoverAmount, 2) }}{{ activeUnit }})
                    </small>
                  </strong>
                </div>
                <div class="sim-detail-row">
                  <span>Consumo semanal</span>
                  <strong class="mono-num">{{ formatMetric(vialDurationB.weeklyConsumption, 2) }} {{ activeUnit }}/sem</strong>
                </div>
                <div class="sim-detail-row">
                  <span>Total de dias</span>
                  <strong class="mono-num">{{ Math.round(vialDurationB.durationDays) }} dias</strong>
                </div>
              </div>
            </template>
          </div>
          <div v-else class="sim-card-placeholder">
            <p v-if="!isVialConfigured">
              Defina o frasco na aba <button type="button" class="link-tab" @click="goToCalculator">Calculadora</button> primeiro.
            </p>
            <p v-else>
              Configure a dose e a frequência de {{ freqState.protocolB.label || 'Protocolo B' }} acima.
            </p>
          </div>
        </div>
      </div>

      <!-- Comparison Banner (neutral/winning protocol colors, never error red!) -->
      <transition name="fade">
        <div
          v-if="canCompareVialDuration"
          class="sim-comparison-banner"
          :class="comparisonClass"
        >
          <div class="comparison-icon-wrap">
            <CheckCircleIcon v-if="Math.abs(differenceDays) < 0.01" :size="18" />
            <SparklesIcon v-else :size="18" />
          </div>
          <div class="comparison-text">
            <h4 v-if="differenceDays > 0.01">
              O protocolo <strong class="highlight-b">{{ freqState.protocolB.label || 'Protocolo B' }}</strong> dura mais!
            </h4>
            <h4 v-else-if="differenceDays < -0.01">
              O protocolo <strong class="highlight-a">{{ freqState.protocolA.label || 'Protocolo A' }}</strong> dura mais!
            </h4>
            <h4 v-else>
              Ambos duram exatamente o mesmo tempo!
            </h4>
            <p>{{ comparisonMessage }}</p>
          </div>
        </div>
      </transition>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  FlaskConical as FlaskConicalIcon,
  Pill as PillIcon,
  ChevronDown as ChevronDownIcon,
  LineChart as LineChartIcon,
  Hourglass as HourglassIcon,
  Sparkles as SparklesIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon
} from 'lucide-vue-next'
import { state } from '../state.js'
import {
  PEPTIDES,
  ADDITIONAL_HORMONES,
  DEFAULT_VIAL_SIZES,
  DEFAULT_UI_VIAL_SIZES
} from '../data/peptides.js'
import {
  parsePositiveNumber,
  roundTo,
  formatMetric,
  formatDoseDisplay
} from '../utils/calculations.js'
import {
  formatHalfLife,
  computeSimulationHorizon,
  simulateProtocolCurve,
  calculateVialDuration,
  formatDuration
} from '../utils/pharmacokinetics.js'
import StackingChart from './StackingChart.vue'

const CUSTOM_MED_NAME = 'Personalizado (Modo Livre)'

const freqState = state.frequency

const medications = [
  ...PEPTIDES.map(p => ({
    id: p.id,
    name: p.name,
    halfLife: p.halfLifeDays,
    category: p.categoryLabel,
    unit: p.unit || 'mg',
    doseUnit: p.doseUnit || 'mg',
    defaultFrequencyDays: p.defaultFrequencyDays || 7,
    vials: p.vials || DEFAULT_VIAL_SIZES,
    isCustom: false
  })),
  ...ADDITIONAL_HORMONES.map(h => ({
    name: h.name,
    halfLife: h.halfLifeDays,
    category: h.categoryLabel,
    unit: h.unit || 'mg',
    doseUnit: 'mg',
    defaultFrequencyDays: 7,
    vials: DEFAULT_VIAL_SIZES,
    isCustom: false
  })),
  {
    id: 'custom',
    name: CUSTOM_MED_NAME,
    halfLife: 5.0,
    category: 'Personalizado',
    unit: 'mg',
    doseUnit: 'mg',
    defaultFrequencyDays: 7,
    vials: DEFAULT_VIAL_SIZES,
    isCustom: true
  }
]

const medicationGroups = computed(() => {
  const groups = {}
  for (const med of medications) {
    if (!groups[med.category]) groups[med.category] = []
    groups[med.category].push(med)
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }))
})

// Sync selected peptide from Calculator -> Frequency
watch(
  () => state.selectedPeptideId,
  (pepId) => {
    if (pepId === 'custom') {
      freqState.selectedMedication = CUSTOM_MED_NAME
      return
    }
    const match = PEPTIDES.find(p => p.id === pepId)
    if (match) {
      freqState.selectedMedication = match.name
    }
  },
  { immediate: true }
)

// Pre-fill Protocol A dose from Calculator once if still empty
watch(
  () => state.doseAmount,
  (val) => {
    if (val && freqState.protocolA.dose === null) {
      freqState.protocolA.dose = val
    }
  },
  { immediate: true }
)

const selectedMedObj = computed(() => {
  return medications.find(m => m.name === freqState.selectedMedication) || medications[0]
})

const isCustomMedication = computed(() => Boolean(selectedMedObj.value?.isCustom))

const activeUnit = computed(() => {
  if (isCustomMedication.value) {
    return state.unit === 'UI' ? 'UI' : 'mg'
  }
  return selectedMedObj.value?.unit || 'mg'
})

const selectedMedVials = computed(() => {
  if (activeUnit.value === 'UI') {
    return DEFAULT_UI_VIAL_SIZES
  }
  return selectedMedObj.value?.vials || DEFAULT_VIAL_SIZES
})

const isVialSelected = (vialVal) => {
  const current = parsePositiveNumber(state.vialAmount)
  return current !== null && Math.abs(current - vialVal) < 1e-9
}

const currentHalfLife = computed(() => {
  if (isCustomMedication.value) {
    return parsePositiveNumber(freqState.customHalfLifeDays) || 5.0
  }
  return selectedMedObj.value?.halfLife || 5.0
})

function handleMedicationChange() {
  const med = selectedMedObj.value
  if (!med) return
  const prefUnit = med.doseUnit === 'mcg' ? 'mcg' : 'mg'
  freqState.protocolA.doseUnit = prefUnit
  freqState.protocolB.doseUnit = prefUnit
  if (freqState.protocolA.freq === null) {
    freqState.protocolA.freq = med.defaultFrequencyDays || 7
  }
}

const doseInputARef = ref(null)
const doseInputBRef = ref(null)
const doseTextA = ref('')
const doseTextB = ref('')

function formatProtocolDoseText(protocolKey) {
  const d = parsePositiveNumber(freqState[protocolKey].dose)
  if (d === null) return ''
  if (activeUnit.value === 'mg' && freqState[protocolKey].doseUnit === 'mcg') {
    return String(roundTo(d * 1000, 3))
  }
  return String(roundTo(d, 4))
}

function getDosePlaceholder(protocolKey, defaultMgPlaceholder) {
  if (activeUnit.value === 'UI') {
    return protocolKey === 'protocolA' ? '50' : '25'
  }
  if (freqState[protocolKey].doseUnit === 'mcg') {
    return protocolKey === 'protocolA' ? '200' : '100'
  }
  return defaultMgPlaceholder
}

function setProtocolDoseUnit(protocolKey, nextUnit) {
  if (activeUnit.value !== 'mg' || freqState[protocolKey].doseUnit === nextUnit) return
  freqState[protocolKey].doseUnit = nextUnit
  const formatted = formatProtocolDoseText(protocolKey)
  if (protocolKey === 'protocolA') {
    doseTextA.value = formatted
  } else {
    doseTextB.value = formatted
  }
}

function onDoseInput(protocolKey, event) {
  const raw = event.target.value
  if (protocolKey === 'protocolA') {
    doseTextA.value = raw
  } else {
    doseTextB.value = raw
  }

  const parsed = parsePositiveNumber(raw)
  if (parsed === null) {
    freqState[protocolKey].dose = null
    return
  }

  freqState[protocolKey].dose =
    activeUnit.value === 'mg' && freqState[protocolKey].doseUnit === 'mcg'
      ? roundTo(parsed / 1000, 6)
      : parsed
}

function onDoseBlur(protocolKey) {
  const textRef = protocolKey === 'protocolA' ? doseTextA : doseTextB
  if (parsePositiveNumber(textRef.value) === null) {
    textRef.value = ''
  }
}

function syncCalcDose(protocolKey) {
  const parsed = parsePositiveNumber(state.doseAmount)
  if (parsed === null) return
  if (activeUnit.value === 'mg' && parsed < 0.1) {
    freqState[protocolKey].doseUnit = 'mcg'
  }
  freqState[protocolKey].dose = parsed
  const formatted = formatProtocolDoseText(protocolKey)
  if (protocolKey === 'protocolA') {
    doseTextA.value = formatted
  } else {
    doseTextB.value = formatted
  }
}

watch(
  [() => freqState.protocolA.dose, () => freqState.protocolA.doseUnit, activeUnit],
  () => {
    const isFocused =
      typeof document !== 'undefined' && document.activeElement === doseInputARef.value
    if (!isFocused) {
      doseTextA.value = formatProtocolDoseText('protocolA')
    }
  },
  { immediate: true }
)

watch(
  [() => freqState.protocolB.dose, () => freqState.protocolB.doseUnit, activeUnit],
  () => {
    const isFocused =
      typeof document !== 'undefined' && document.activeElement === doseInputBRef.value
    if (!isFocused) {
      doseTextB.value = formatProtocolDoseText('protocolB')
    }
  },
  { immediate: true }
)

const frequencyOptions = [
  { value: 7, label: '7d' },
  { value: 3.5, label: '3.5d' },
  { value: 2, label: '2d' },
  { value: 1, label: '1d' },
  { value: 0.5, label: '12h' }
]

function setFreq(protocolKey, val) {
  freqState[protocolKey].freq = val
  freqState[protocolKey].customActive = false
  freqState[protocolKey].freqCustom = null
}

function onCustomInput(protocolKey) {
  const customVal = parsePositiveNumber(freqState[protocolKey].freqCustom)
  if (customVal !== null) {
    freqState[protocolKey].freq = customVal
    freqState[protocolKey].customActive = true
  }
}

function onCustomBlur(protocolKey) {
  if (parsePositiveNumber(freqState[protocolKey].freqCustom) === null) {
    freqState[protocolKey].customActive = false
  }
}

function getEffectiveFreq(protocol) {
  if (protocol.customActive) {
    return parsePositiveNumber(protocol.freqCustom)
  }
  return parsePositiveNumber(protocol.freq)
}

const effectiveFreqA = computed(() => getEffectiveFreq(freqState.protocolA))
const effectiveFreqB = computed(() => getEffectiveFreq(freqState.protocolB))

const showCalcSyncA = computed(() => {
  const calcDose = parsePositiveNumber(state.doseAmount)
  const doseA = parsePositiveNumber(freqState.protocolA.dose)
  return calcDose !== null && (doseA === null || Math.abs(calcDose - doseA) > 1e-9)
})

const showCalcSyncB = computed(() => {
  const calcDose = parsePositiveNumber(state.doseAmount)
  const doseB = parsePositiveNumber(freqState.protocolB.dose)
  return calcDose !== null && (doseB === null || Math.abs(calcDose - doseB) > 1e-9)
})

// Shared simulation horizon so Protocol A and Protocol B always align on X axis
const sharedHorizonDays = computed(() => {
  const intervals = [effectiveFreqA.value, effectiveFreqB.value].filter(Boolean)
  return computeSimulationHorizon(currentHalfLife.value, intervals)
})

const chartDataA = computed(() => {
  const dose = parsePositiveNumber(freqState.protocolA.dose)
  const freq = effectiveFreqA.value
  if (dose === null || freq === null) return null
  const curve = simulateProtocolCurve(dose, freq, currentHalfLife.value, sharedHorizonDays.value)
  if (!curve) return null
  return {
    label: freqState.protocolA.label || 'Protocolo A',
    ...curve
  }
})

const chartDataB = computed(() => {
  const dose = parsePositiveNumber(freqState.protocolB.dose)
  const freq = effectiveFreqB.value
  if (dose === null || freq === null) return null
  const curve = simulateProtocolCurve(dose, freq, currentHalfLife.value, sharedHorizonDays.value)
  if (!curve) return null
  return {
    label: freqState.protocolB.label || 'Protocolo B',
    ...curve
  }
})

// Vial Duration Simulation
function goToCalculator() {
  state.activeTab = 'calculator'
}

const isVialConfigured = computed(() => parsePositiveNumber(state.vialAmount) !== null)
const isDiluentConfigured = computed(() => parsePositiveNumber(state.diluentMl) !== null)

const concentration = computed(() => {
  const v = parsePositiveNumber(state.vialAmount)
  const d = parsePositiveNumber(state.diluentMl)
  return v && d ? v / d : 0
})

const vialDurationA = computed(() => {
  if (!isVialConfigured.value) return null
  return calculateVialDuration({
    vialAmount: state.vialAmount,
    dose: freqState.protocolA.dose,
    intervalDays: effectiveFreqA.value
  })
})

const vialDurationB = computed(() => {
  if (!isVialConfigured.value) return null
  return calculateVialDuration({
    vialAmount: state.vialAmount,
    dose: freqState.protocolB.dose,
    intervalDays: effectiveFreqB.value
  })
})

const canCompareVialDuration = computed(() => {
  return Boolean(
    vialDurationA.value &&
      vialDurationB.value &&
      !vialDurationA.value.exceedsVial &&
      !vialDurationB.value.exceedsVial
  )
})

const differenceDays = computed(() => {
  if (!canCompareVialDuration.value) return 0
  return vialDurationB.value.durationDays - vialDurationA.value.durationDays
})

const comparisonClass = computed(() => {
  if (differenceDays.value > 0.01) return 'winner-b'
  if (differenceDays.value < -0.01) return 'winner-a'
  return 'equal'
})

const comparisonMessage = computed(() => {
  if (!canCompareVialDuration.value) return ''
  const diff = Math.abs(differenceDays.value)
  const labelA = freqState.protocolA.label || 'Protocolo A'
  const labelB = freqState.protocolB.label || 'Protocolo B'

  if (diff < 0.01) {
    return `Ambos os protocolos consomem o frasco de ${state.vialAmount}${activeUnit.value} em cerca de ${Math.round(vialDurationA.value.durationDays)} dias.`
  }
  const formattedDiff = formatDuration(diff)
  if (differenceDays.value > 0) {
    return `O frasco dura ${formattedDiff} (${Math.round(diff)} dias) a mais no protocolo ${labelB} em comparação ao ${labelA}.`
  }
  return `O frasco dura ${formattedDiff} (${Math.round(diff)} dias) a mais no protocolo ${labelA} em comparação ao ${labelB}.`
})
</script>

<style scoped>
.frequency-view {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.config-panel,
.chart-panel,
.vial-simulation-panel {
  padding: 1.5rem;
}

.config-panel,
.vial-simulation-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.config-header h3,
.sim-header h3 {
  font-size: 1.12rem;
}

.config-subtitle,
.sim-subtitle {
  color: var(--text-secondary);
  font-size: 0.84rem;
  margin-top: 0.15rem;
}

.med-controls-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.config-section {
  flex: 1 1 260px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.custom-hl-section {
  flex: 0 0 180px;
}

.config-label {
  font-size: 0.76rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.select-wrap {
  position: relative;
}

.custom-select {
  width: 100%;
  padding: 0.68rem 2.5rem 0.68rem 0.9rem;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.custom-select:hover {
  border-color: var(--border-strong);
}

.custom-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.select-chevron {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

/* Protocols Grid */
.protocols-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.protocol-card {
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.protocol-a {
  border-top: 2px solid var(--protocol-a);
}

.protocol-b {
  border-top: 2px solid var(--protocol-b);
}

.protocol-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.protocol-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-a {
  background: var(--protocol-a);
}

.dot-b {
  background: var(--protocol-b);
}

.protocol-label-input {
  background: transparent;
  border: none;
  border-bottom: 1px dashed var(--border-strong);
  color: var(--text-primary);
  font-size: 0.98rem;
  font-weight: 700;
  padding: 0.15rem 0;
  width: 100%;
  outline: none;
}

.protocol-label-input:focus {
  border-bottom-color: var(--accent);
}

.protocol-style {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  flex-shrink: 0;
}

.protocol-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.field-label-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.dose-unit-toggle {
  display: inline-flex;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.unit-toggle-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.16rem 0.45rem;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all 0.15s ease;
}

.unit-toggle-btn.active {
  background: var(--accent);
  color: #ffffff;
}

.protocol-field label {
  font-size: 0.74rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.btn-sync-calc {
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  color: var(--accent-strong);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-sync-calc:hover {
  background: var(--accent);
  color: #ffffff;
}

.field-input {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.98rem;
  font-weight: 600;
  width: 100%;
  outline: none;
}

.field-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field-input::-webkit-outer-spin-button,
.field-input::-webkit-inner-spin-button,
.freq-custom-input::-webkit-outer-spin-button,
.freq-custom-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.field-input[type='number'],
.freq-custom-input[type='number'] {
  -moz-appearance: textfield;
}

.freq-buttons {
  display: flex;
  gap: 0.38rem;
  flex-wrap: wrap;
}

.freq-btn {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.42rem 0.72rem;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
}

.freq-btn:hover {
  background: var(--surface-3);
  color: var(--text-primary);
}

.freq-btn.selected {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.freq-custom {
  display: flex;
  align-items: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-1);
}

.freq-custom.active {
  border-color: var(--accent);
  border-style: solid;
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.freq-custom-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  outline: none;
  padding: 0.42rem 0.45rem;
  width: 56px;
  text-align: center;
}

/* Summary Stats */
.summary-stats {
  display: flex;
  gap: 1.25rem;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.1rem 1.25rem;
}

.summary-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
}

.summary-divider {
  width: 1px;
  background: var(--border-subtle);
  align-self: stretch;
}

.summary-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.2rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.84rem;
}

.summary-row > span:first-child {
  color: var(--text-secondary);
}

.summary-row strong {
  color: var(--text-primary);
}

.washout-badge {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--emerald);
  background: var(--emerald-soft);
  padding: 0.14rem 0.5rem;
  border-radius: var(--radius-full);
}

/* Chart Panel */
.chart-panel {
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
  gap: 1rem;
  padding: 2rem 1rem;
}

.placeholder-icon-wrapper {
  background: var(--surface-2);
  padding: 1.25rem;
  border-radius: 50%;
  border: 1px dashed var(--border-strong);
}

.placeholder-icon {
  color: var(--accent);
  opacity: 0.7;
}

.chart-placeholder p {
  max-width: 320px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Vial Simulation Panel */
.sim-vial-info-row {
  background: var(--surface-2);
  padding: 0.95rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.quick-vial-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-vial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.quick-vial-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.quick-vial-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.quick-vial-btn {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.36rem 0.7rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s ease;
}

.quick-vial-btn:hover {
  background: var(--surface-3);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.quick-vial-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.quick-vial-custom {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--surface-1);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.55rem;
}

.quick-vial-input {
  width: 58px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  outline: none;
}

.quick-vial-custom span {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.quick-vial-input::-webkit-outer-spin-button,
.quick-vial-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.quick-vial-input[type='number'] {
  -moz-appearance: textfield;
}

.vial-info-pill-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.vial-info-pill {
  flex: 1 1 150px;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pill-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.pill-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.pill-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.vial-info-warning {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--amber);
  font-size: 0.88rem;
}

.warning-icon {
  flex-shrink: 0;
}

.link-tab {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent-strong);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
  font-size: inherit;
}

.sim-results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.sim-card {
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sim-card.disabled {
  opacity: 0.65;
  border-style: dashed;
}

.sim-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.65rem;
}

.sim-card-header .protocol-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
  font-size: 0.96rem;
}

.protocol-summary-badge {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  padding: 0.18rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.sim-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.sim-vial-alert {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: var(--danger-soft);
  border: 1px solid color-mix(in srgb, var(--danger) 40%, transparent);
  color: var(--danger);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  font-weight: 600;
}

.main-duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.9rem;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  text-align: center;
}

.duration-value {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-primary);
}

.protocol-a-card .duration-value {
  color: var(--protocol-a);
}

.protocol-b-card .duration-value {
  color: var(--protocol-b);
}

.duration-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-top: 0.2rem;
}

.sim-details {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.sim-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.84rem;
}

.sim-detail-row span {
  color: var(--text-secondary);
}

.sim-detail-row strong {
  color: var(--text-primary);
}

.leftover-note {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.sim-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 110px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 0.5rem;
}

/* Comparison Banner */
.sim-comparison-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-radius: var(--radius-md);
  border: 1px solid;
}

.sim-comparison-banner.winner-b {
  background: var(--protocol-b-soft);
  border-color: color-mix(in srgb, var(--protocol-b) 35%, transparent);
}

.sim-comparison-banner.winner-b .comparison-icon-wrap {
  color: var(--protocol-b);
  background: var(--surface-1);
}

.sim-comparison-banner.winner-a {
  background: var(--protocol-a-soft);
  border-color: color-mix(in srgb, var(--protocol-a) 35%, transparent);
}

.sim-comparison-banner.winner-a .comparison-icon-wrap {
  color: var(--protocol-a);
  background: var(--surface-1);
}

.sim-comparison-banner.equal {
  background: var(--emerald-soft);
  border-color: color-mix(in srgb, var(--emerald) 35%, transparent);
}

.sim-comparison-banner.equal .comparison-icon-wrap {
  color: var(--emerald);
  background: var(--surface-1);
}

.comparison-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.comparison-text h4 {
  font-size: 0.94rem;
}

.comparison-text p {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.highlight-a {
  color: var(--protocol-a);
}

.highlight-b {
  color: var(--protocol-b);
}

@media (max-width: 768px) {
  .protocols-grid,
  .sim-results-grid {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    flex-direction: column;
  }

  .summary-divider {
    width: 100%;
    height: 1px;
  }

  .custom-hl-section {
    flex: 1 1 100%;
  }
}

@media (max-width: 640px) {
  .config-panel,
  .chart-panel,
  .vial-simulation-panel {
    padding: 1.1rem;
  }
}
</style>

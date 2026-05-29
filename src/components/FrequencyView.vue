<template>
  <div class="frequency-view">
    <!-- Configuration Panel -->
    <div class="config-panel glass-panel">
      <div class="config-header">
        <div class="title-wrap">
          <span class="step-badge"><FlaskConicalIcon :size="16" /></span>
          <h3>Simulação Farmacocinética</h3>
        </div>
        <p class="config-subtitle">Configure dois protocolos para comparar o empilhamento da droga no sangue.</p>
      </div>

      <!-- Medication Selector -->
      <div class="config-section">
        <label class="config-label">
          <PillIcon :size="16" />
          Medicamento
        </label>
        <div class="select-wrap">
          <select v-model="selectedMedication" class="custom-select">
            <optgroup v-for="group in medicationGroups" :key="group.label" :label="group.label">
              <option v-for="med in group.items" :key="med.name" :value="med.name">
                {{ med.name }} (t½ = {{ med.halfLife }}d)
              </option>
            </optgroup>
          </select>
          <ChevronDownIcon :size="16" class="select-chevron" />
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
              v-model="protocolALabel"
              class="protocol-label-input"
              maxlength="20"
            />
            <span class="protocol-style">Tracejado</span>
          </div>

          <div class="protocol-field">
            <label>Dose (mg)</label>
            <input
              type="number"
              v-model.number="protocolADose"
              min="0.1"
              step="0.5"
              placeholder="5"
              class="field-input"
            />
          </div>

          <div class="protocol-field">
            <label>Frequência (dias)</label>
            <div class="freq-buttons">
              <button
                v-for="freq in frequencyOptions"
                :key="'a-' + freq"
                class="freq-btn"
                :class="{ selected: protocolAFreq === freq && !customAActive }"
                @click="setFreqA(freq)"
              >
                {{ freq }}d
              </button>
              <div class="freq-custom" :class="{ active: customAActive }">
                <input
                  type="number"
                  v-model.number="protocolAFreqCustom"
                  min="0.5"
                  step="0.5"
                  placeholder="..."
                  class="freq-custom-input"
                  @focus="customAActive = true"
                  @input="onCustomAInput"
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
              v-model="protocolBLabel"
              class="protocol-label-input"
              maxlength="20"
            />
            <span class="protocol-style">Sólido</span>
          </div>

          <div class="protocol-field">
            <label>Dose (mg)</label>
            <input
              type="number"
              v-model.number="protocolBDose"
              min="0.1"
              step="0.5"
              placeholder="3"
              class="field-input"
            />
          </div>

          <div class="protocol-field">
            <label>Frequência (dias)</label>
            <div class="freq-buttons">
              <button
                v-for="freq in frequencyOptions"
                :key="'b-' + freq"
                class="freq-btn"
                :class="{ selected: protocolBFreq === freq && !customBActive }"
                @click="setFreqB(freq)"
              >
                {{ freq }}d
              </button>
              <div class="freq-custom" :class="{ active: customBActive }">
                <input
                  type="number"
                  v-model.number="protocolBFreqCustom"
                  min="0.5"
                  step="0.5"
                  placeholder="..."
                  class="freq-custom-input"
                  @focus="customBActive = true"
                  @input="onCustomBInput"
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
              <span class="protocol-dot dot-a" style="width:8px;height:8px;"></span>
              {{ protocolALabel }}
            </span>
            <div class="summary-row">
              <span>Pico (steady-state)</span>
              <strong>~{{ chartDataA.peakSteady.toFixed(1) }}mg</strong>
            </div>
            <div class="summary-row">
              <span>Vale (steady-state)</span>
              <strong>~{{ chartDataA.troughSteady.toFixed(1) }}mg</strong>
            </div>
            <div class="summary-row">
              <span>Flutuação</span>
              <strong>{{ ((chartDataA.peakSteady - chartDataA.troughSteady) / chartDataA.troughSteady * 100).toFixed(0) }}%</strong>
            </div>
          </div>
          <div class="summary-divider"></div>
          <div v-if="chartDataB" class="summary-col summary-b">
            <span class="summary-title">
              <span class="protocol-dot dot-b" style="width:8px;height:8px;"></span>
              {{ protocolBLabel }}
            </span>
            <div class="summary-row">
              <span>Pico (steady-state)</span>
              <strong>~{{ chartDataB.peakSteady.toFixed(1) }}mg</strong>
            </div>
            <div class="summary-row">
              <span>Vale (steady-state)</span>
              <strong>~{{ chartDataB.troughSteady.toFixed(1) }}mg</strong>
            </div>
            <div class="summary-row">
              <span>Flutuação</span>
              <strong>{{ ((chartDataB.peakSteady - chartDataB.troughSteady) / chartDataB.troughSteady * 100).toFixed(0) }}%</strong>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Chart Panel -->
    <div class="chart-panel glass-panel">
      <transition name="fade" mode="out-in">
        <div v-if="!chartDataA && !chartDataB" class="chart-placeholder" key="empty">
          <div class="placeholder-icon-wrapper">
            <LineChartIcon :size="40" class="placeholder-icon" />
          </div>
          <p>Preencha a dose e a frequência de pelo menos um protocolo para gerar o gráfico de empilhamento.</p>
        </div>

        <StackingChart
          v-else
          :key="chartKey"
          :protocol-a="chartDataA"
          :protocol-b="chartDataB"
          :medication="selectedMedication"
        />
      </transition>
    </div>

    <!-- Vial Duration Simulation Panel -->
    <div class="vial-simulation-panel glass-panel">
      <div class="sim-header">
        <div class="title-wrap">
          <span class="step-badge"><HourglassIcon :size="16" /></span>
          <h3>Simulação de Duração do Frasco</h3>
        </div>
        <p class="sim-subtitle">Compare quanto tempo dura um frasco de medicamento em cada frequência e veja o rendimento.</p>
      </div>

      <!-- Informações do Frasco (Somente Leitura - Configuradas na Calculadora) -->
      <div class="sim-vial-info-row">
        <div v-if="isCalculatorConfigured" class="vial-info-pill-container">
          <div class="vial-info-pill">
            <span class="pill-label">Conteúdo do Frasco</span>
            <strong class="pill-value text-gradient">{{ state.vialMg }}mg</strong>
          </div>
          <div class="vial-info-pill">
            <span class="pill-label">Quantidade de Diluente</span>
            <strong class="pill-value">{{ state.diluentMl }}mL</strong>
          </div>
          <div class="vial-info-pill">
            <span class="pill-label">Concentração</span>
            <strong class="pill-value">{{ formatNumber(concentration, 2) }}mg/mL</strong>
          </div>
        </div>
        <div v-else class="vial-info-warning">
          <AlertCircleIcon :size="18" class="warning-icon" />
          <span>Defina o <strong>Conteúdo do Frasco</strong> e o <strong>Diluente</strong> na aba <a class="link-tab" @click="goToCalculator">Calculadora</a> para visualizar a simulação.</span>
        </div>
      </div>

      <!-- Simulation Results Cards -->
      <div class="sim-results-grid">
        <!-- Protocol A Result -->
        <div class="sim-card protocol-a-card" :class="{ disabled: !hasProtocolA }">
          <div class="sim-card-header">
            <span class="protocol-title">
              <span class="protocol-dot dot-a"></span>
              {{ protocolALabel }}
            </span>
            <span class="protocol-summary-badge" v-if="hasProtocolA">{{ protocolADose }}mg a cada {{ effectiveFreqA }}d</span>
          </div>

          <div v-if="hasProtocolA" class="sim-card-content">
            <div class="main-duration">
              <span class="duration-value">{{ formatDuration(durationDaysA) }}</span>
              <span class="duration-label">Duração Estimada</span>
            </div>
            
            <div class="sim-details">
              <div class="sim-detail-row">
                <span>Rendimento total</span>
                <strong>{{ formatNumber(dosesPerVialA, 1) }} doses</strong>
              </div>
              <div class="sim-detail-row">
                <span>Consumo semanal</span>
                <strong>{{ formatNumber(weeklyConsumptionA, 2) }} mg/sem</strong>
              </div>
              <div class="sim-detail-row">
                <span>Total de dias</span>
                <strong>{{ Math.round(durationDaysA) }} dias</strong>
              </div>
            </div>
          </div>
          <div v-else class="sim-card-placeholder">
            <p v-if="!isCalculatorConfigured">
              Defina o frasco e o diluente na aba <a class="link-tab" @click="goToCalculator">Calculadora</a> primeiro.
            </p>
            <p v-else>
              Configure a dose e a frequência do protocolo {{ protocolALabel }} acima para ver a simulação.
            </p>
          </div>
        </div>

        <!-- Protocol B Result -->
        <div class="sim-card protocol-b-card" :class="{ disabled: !hasProtocolB }">
          <div class="sim-card-header">
            <span class="protocol-title">
              <span class="protocol-dot dot-b"></span>
              {{ protocolBLabel }}
            </span>
            <span class="protocol-summary-badge" v-if="hasProtocolB">{{ protocolBDose }}mg a cada {{ effectiveFreqB }}d</span>
          </div>

          <div v-if="hasProtocolB" class="sim-card-content">
            <div class="main-duration">
              <span class="duration-value">{{ formatDuration(durationDaysB) }}</span>
              <span class="duration-label">Duração Estimada</span>
            </div>
            
            <div class="sim-details">
              <div class="sim-detail-row">
                <span>Rendimento total</span>
                <strong>{{ formatNumber(dosesPerVialB, 1) }} doses</strong>
              </div>
              <div class="sim-detail-row">
                <span>Consumo semanal</span>
                <strong>{{ formatNumber(weeklyConsumptionB, 2) }} mg/sem</strong>
              </div>
              <div class="sim-detail-row">
                <span>Total de dias</span>
                <strong>{{ Math.round(durationDaysB) }} dias</strong>
              </div>
            </div>
          </div>
          <div v-else class="sim-card-placeholder">
            <p v-if="!isCalculatorConfigured">
              Defina o frasco e o diluente na aba <a class="link-tab" @click="goToCalculator">Calculadora</a> primeiro.
            </p>
            <p v-else>
              Configure a dose e a frequência do protocolo {{ protocolBLabel }} acima para ver a simulação.
            </p>
          </div>
        </div>
      </div>

      <!-- Comparison Banner -->
      <transition name="fade">
        <div v-if="hasProtocolA && hasProtocolB" class="sim-comparison-banner" :class="comparisonClass">
          <div class="comparison-icon-wrap">
            <SparklesIcon v-if="differenceDays > 0" :size="20" />
            <AlertCircleIcon v-else-if="differenceDays < 0" :size="20" />
            <CheckCircleIcon v-else :size="20" />
          </div>
          <div class="comparison-text">
            <h4 v-if="differenceDays > 0">
              O protocolo <strong class="highlight-b">{{ protocolBLabel }}</strong> dura mais!
            </h4>
            <h4 v-else-if="differenceDays < 0">
              O protocolo <strong class="highlight-a">{{ protocolALabel }}</strong> dura mais!
            </h4>
            <h4 v-else>
              Ambos duram exatamente o mesmo tempo!
            </h4>
            <p>{{ comparisonMessage }}</p>
          </div>
        </div>
      </transition>
    </div>
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
  Database as DatabaseIcon,
  Sparkles as SparklesIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
} from 'lucide-vue-next'
import { state } from '../state.js'
import StackingChart from './StackingChart.vue'

// ───── Medication Database ─────
const medications = [
  { name: 'Tirzepatida',             halfLife: 5.0,  category: 'Agonistas GLP-1 / GIP' },
  { name: 'Semaglutida',             halfLife: 7.0,  category: 'Agonistas GLP-1 / GIP' },
  { name: 'Retatrutida',             halfLife: 6.0,  category: 'Agonistas GLP-1 / GIP' },
  { name: 'Testosterona Cipionato',  halfLife: 8.0,  category: 'Hormônios' },
  { name: 'Testosterona Enantato',   halfLife: 4.5,  category: 'Hormônios' },
  { name: 'Nandrolona Decanoato',    halfLife: 6.0,  category: 'Hormônios' },
  { name: 'CJC-1295 + DAC',         halfLife: 6.0,  category: 'Secretagogos GH' },
]

// Group medications by category for the optgroup select
const medicationGroups = computed(() => {
  const groups = {}
  for (const med of medications) {
    if (!groups[med.category]) groups[med.category] = []
    groups[med.category].push(med)
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }))
})

const selectedMedication = ref('Tirzepatida')

const currentHalfLife = computed(() => {
  const med = medications.find(m => m.name === selectedMedication.value)
  return med ? med.halfLife : 5
})

// ───── Frequency Options ─────
const frequencyOptions = [7, 3.5, 2]

// ───── Protocol A ─────
const protocolALabel = ref('Antigo')
const protocolADose = ref(null)
const protocolAFreq = ref(null)
const protocolAFreqCustom = ref(null)
const customAActive = ref(false)

// Pre-fill dose from calculator if available
watch(() => state.doseMg, (val) => {
  if (val && protocolADose.value === null) {
    protocolADose.value = val
  }
}, { immediate: true })

function setFreqA(freq) {
  protocolAFreq.value = freq
  customAActive.value = false
  protocolAFreqCustom.value = null
}

function onCustomAInput() {
  if (protocolAFreqCustom.value > 0) {
    protocolAFreq.value = protocolAFreqCustom.value
    customAActive.value = true
  }
}

const effectiveFreqA = computed(() => {
  if (customAActive.value && protocolAFreqCustom.value > 0) return protocolAFreqCustom.value
  return protocolAFreq.value
})

// ───── Protocol B ─────
const protocolBLabel = ref('Novo')
const protocolBDose = ref(null)
const protocolBFreq = ref(null)
const protocolBFreqCustom = ref(null)
const customBActive = ref(false)

function setFreqB(freq) {
  protocolBFreq.value = freq
  customBActive.value = false
  protocolBFreqCustom.value = null
}

function onCustomBInput() {
  if (protocolBFreqCustom.value > 0) {
    protocolBFreq.value = protocolBFreqCustom.value
    customBActive.value = true
  }
}

const effectiveFreqB = computed(() => {
  if (customBActive.value && protocolBFreqCustom.value > 0) return protocolBFreqCustom.value
  return protocolBFreq.value
})

// ───── Pharmacokinetic Simulation Engine ─────
function simulateProtocol(doseMg, intervalDays, halfLifeDays, totalDays = 35, resolution = 0.05) {
  const points = []
  const activeDoses = [] // { time: number, amount: number }

  for (let t = 0; t <= totalDays; t += resolution) {
    // Check if it's time for a new dose (at t=0, intervalDays, 2*intervalDays, etc.)
    const doseIndex = Math.round(t / intervalDays)
    const doseTime = doseIndex * intervalDays

    // Add dose at the right time (within resolution tolerance)
    if (Math.abs(t - doseTime) < resolution / 2 && !activeDoses.some(d => Math.abs(d.time - doseTime) < resolution / 2)) {
      activeDoses.push({ time: doseTime, amount: doseMg })
    }

    // Calculate total load: sum of all doses with exponential decay
    let totalLoad = 0
    for (const dose of activeDoses) {
      const elapsed = t - dose.time
      if (elapsed >= 0) {
        totalLoad += dose.amount * Math.pow(0.5, elapsed / halfLifeDays)
      }
    }

    points.push({ time: Math.round(t * 1000) / 1000, load: totalLoad })
  }

  return points
}

function findSteadyStatePeakTrough(points, intervalDays) {
  // Look at the last few cycles for steady-state values
  const totalTime = points[points.length - 1]?.time || 35
  const lookbackStart = Math.max(0, totalTime - intervalDays * 2.5)

  const steadyPoints = points.filter(p => p.time >= lookbackStart)

  const peak = Math.max(...steadyPoints.map(p => p.load))
  const trough = Math.min(...steadyPoints.map(p => p.load))

  return { peak, trough }
}

// ───── Computed Chart Data ─────
function parseNum(val) {
  if (val === null || val === undefined || val === '') return NaN
  const n = typeof val === 'number' ? val : parseFloat(val)
  return isNaN(n) || n <= 0 ? NaN : n
}

const chartDataA = computed(() => {
  const dose = parseNum(protocolADose.value)
  const freq = parseNum(effectiveFreqA.value)
  if (isNaN(dose) || isNaN(freq)) return null

  const points = simulateProtocol(dose, freq, currentHalfLife.value)
  const { peak, trough } = findSteadyStatePeakTrough(points, freq)

  return {
    label: protocolALabel.value || 'A',
    points,
    dose,
    interval: freq,
    peakSteady: peak,
    troughSteady: trough,
  }
})

const chartDataB = computed(() => {
  const dose = parseNum(protocolBDose.value)
  const freq = parseNum(effectiveFreqB.value)
  if (isNaN(dose) || isNaN(freq)) return null

  const points = simulateProtocol(dose, freq, currentHalfLife.value)
  const { peak, trough } = findSteadyStatePeakTrough(points, freq)

  return {
    label: protocolBLabel.value || 'B',
    points,
    dose,
    interval: freq,
    peakSteady: peak,
    troughSteady: trough,
  }
})

// Dynamic key to force StackingChart re-creation when protocols appear/disappear
const chartKey = computed(() => {
  const a = chartDataA.value ? `A${chartDataA.value.dose}-${chartDataA.value.interval}` : 'noA'
  const b = chartDataB.value ? `B${chartDataB.value.dose}-${chartDataB.value.interval}` : 'noB'
  return `chart-${a}-${b}`
})

// ───── Vial Duration Simulation ─────
function goToCalculator() {
  state.activeTab = 'calculator'
}

const isCalculatorConfigured = computed(() => {
  const v = parseNum(state.vialMg)
  const d = parseNum(state.diluentMl)
  return !isNaN(v) && !isNaN(d)
})

const concentration = computed(() => {
  const v = parseNum(state.vialMg)
  const d = parseNum(state.diluentMl)
  return v && d ? v / d : 0
})

const hasProtocolA = computed(() => {
  const dose = parseNum(protocolADose.value)
  const freq = parseNum(effectiveFreqA.value)
  return isCalculatorConfigured.value && !isNaN(dose) && !isNaN(freq)
})

const hasProtocolB = computed(() => {
  const dose = parseNum(protocolBDose.value)
  const freq = parseNum(effectiveFreqB.value)
  return isCalculatorConfigured.value && !isNaN(dose) && !isNaN(freq)
})

const dosesPerVialA = computed(() => {
  const v = parseNum(state.vialMg)
  const d = parseNum(protocolADose.value)
  return v && d ? v / d : 0
})

const durationDaysA = computed(() => {
  const doses = dosesPerVialA.value
  const f = parseNum(effectiveFreqA.value)
  return doses && f ? doses * f : 0
})

const weeklyConsumptionA = computed(() => {
  const d = parseNum(protocolADose.value)
  const f = parseNum(effectiveFreqA.value)
  return d && f ? (d / f) * 7 : 0
})

const dosesPerVialB = computed(() => {
  const v = parseNum(state.vialMg)
  const d = parseNum(protocolBDose.value)
  return v && d ? v / d : 0
})

const durationDaysB = computed(() => {
  const doses = dosesPerVialB.value
  const f = parseNum(effectiveFreqB.value)
  return doses && f ? doses * f : 0
})

const weeklyConsumptionB = computed(() => {
  const d = parseNum(protocolBDose.value)
  const f = parseNum(effectiveFreqB.value)
  return d && f ? (d / f) * 7 : 0
})

const differenceDays = computed(() => {
  if (!hasProtocolA.value || !hasProtocolB.value) return 0
  return durationDaysB.value - durationDaysA.value
})

const comparisonClass = computed(() => {
  if (differenceDays.value > 0) return 'better-b'
  if (differenceDays.value < 0) return 'better-a'
  return 'equal'
})

const comparisonMessage = computed(() => {
  const diff = Math.abs(differenceDays.value)
  if (diff < 0.01) {
    return `Ambos os protocolos consumirão o mesmo frasco de ${state.vialMg}mg em exatamente ${Math.round(durationDaysA.value)} dias.`
  }
  const formattedDiff = formatDuration(diff)
  if (differenceDays.value > 0) {
    return `O frasco durará ${formattedDiff} (${Math.round(diff)} dias) a mais com o protocolo ${protocolBLabel.value} em relação ao ${protocolALabel.value}.`
  } else {
    return `O frasco durará ${formattedDiff} (${Math.round(diff)} dias) a mais com o protocolo ${protocolALabel.value} em relação ao ${protocolBLabel.value}.`
  }
})

function formatDuration(days) {
  if (isNaN(days) || days <= 0 || !isFinite(days)) return '-'
  
  const weeks = Math.floor(days / 7)
  const remainingDays = Math.round((days % 7) * 10) / 10
  
  if (weeks === 0) {
    return `${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`
  } else if (remainingDays === 0) {
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  } else {
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} e ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`
  }
}

const formatNumber = (num, decimals = 1) => {
  if (isNaN(num) || !isFinite(num)) return '0'
  return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals)
}
</script>

<style scoped>
.frequency-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Config Panel */
.config-panel {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.config-header .title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.config-header .step-badge {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(59, 130, 246, 0.2));
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-hover);
}

.config-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
}

.config-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-left: calc(16px + 1rem + 0.75rem);
}

/* Medication Selector */
.config-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-wrap {
  position: relative;
}

.custom-select {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition: all 0.2s;
  outline: none;
}

.custom-select:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.custom-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--surface-active);
}

.select-chevron {
  position: absolute;
  right: 0.75rem;
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
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: border-color 0.3s;
}

.protocol-a {
  border-top: 2px solid rgba(248, 113, 113, 0.5);
}

.protocol-b {
  border-top: 2px solid rgba(96, 165, 250, 0.5);
}

.protocol-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.protocol-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-a {
  background: #f87171;
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.4);
}

.dot-b {
  background: #60a5fa;
  box-shadow: 0 0 6px rgba(96, 165, 250, 0.4);
}

.protocol-label-input {
  background: transparent;
  border: none;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  outline: none;
  padding: 0.2rem 0;
  width: 100%;
  transition: border-color 0.2s;
}

.protocol-label-input:focus {
  border-bottom-color: var(--primary);
}

.protocol-style {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  opacity: 0.7;
}

.protocol-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.protocol-field label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.field-input {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  font-weight: 600;
  outline: none;
  transition: all 0.2s;
  width: 100%;
}

.field-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--surface-active);
}

/* Chrome, Safari, Edge, Opera */
.field-input::-webkit-outer-spin-button,
.field-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.field-input[type=number] {
  -moz-appearance: textfield;
}

/* Frequency Buttons */
.freq-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.freq-btn {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid var(--surface-border);
  color: var(--text-secondary);
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: inherit;
}

.freq-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.freq-btn.selected {
  background: var(--primary);
  border-color: var(--primary-hover);
  color: #fff;
  box-shadow: 0 2px 8px var(--primary-glow);
  transform: translateY(-1px);
}

.freq-custom {
  display: flex;
  align-items: center;
  border: 1px dashed var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  min-width: 50px;
}

.freq-custom.active {
  border-color: var(--primary);
  border-style: solid;
  box-shadow: 0 0 0 2px var(--surface-active);
}

.freq-custom-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  outline: none;
  padding: 0.45rem 0.5rem;
  width: 50px;
  text-align: center;
}

.freq-custom-input::-webkit-outer-spin-button,
.freq-custom-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.freq-custom-input[type=number] {
  -moz-appearance: textfield;
}

/* Summary Stats */
.summary-stats {
  display: flex;
  gap: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.summary-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-divider {
  width: 1px;
  background: var(--surface-border);
  align-self: stretch;
}

.summary-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.summary-row span {
  color: var(--text-muted);
}

.summary-row strong {
  color: var(--text-primary);
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

/* Chart Panel */
.chart-panel {
  padding: 1.5rem;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
  gap: 1.5rem;
  padding: 2rem;
}

.chart-placeholder .placeholder-icon-wrapper {
  background: rgba(30, 41, 59, 0.4);
  padding: 1.5rem;
  border-radius: 50%;
  border: 1px dashed var(--surface-border);
}

.chart-placeholder .placeholder-icon {
  opacity: 0.4;
  color: var(--primary);
}

.chart-placeholder p {
  max-width: 300px;
  line-height: 1.5;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .protocols-grid {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    flex-direction: column;
  }

  .summary-divider {
    width: 100%;
    height: 1px;
  }

  .config-subtitle {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .config-panel {
    padding: 1.25rem;
  }

  .chart-panel {
    padding: 1rem;
  }
}

/* Vial Simulation Panel */
.vial-simulation-panel {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.sim-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sim-header .title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sim-vial-info-row {
  background: rgba(15, 23, 42, 0.2);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.vial-info-pill-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.vial-info-pill {
  flex: 1;
  min-width: 140px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid var(--surface-border);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  transition: border-color 0.2s;
}

.vial-info-pill:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.vial-info-pill .pill-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.vial-info-pill .pill-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.vial-info-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fca5a5;
  font-size: 0.9rem;
  line-height: 1.5;
}

.vial-info-warning .warning-icon {
  color: #f87171;
  flex-shrink: 0;
}

.link-tab {
  color: var(--primary-hover);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

.link-tab:hover {
  color: var(--text-primary);
}
.sim-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
}

.sim-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-left: calc(16px + 1rem + 0.75rem);
}


/* Results grid */
.sim-results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.sim-card {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: opacity 0.3s, transform 0.3s;
}

.sim-card.disabled {
  opacity: 0.5;
  background: rgba(15, 23, 42, 0.2);
  border-style: dashed;
}

.sim-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.75rem;
}

.sim-card-header .protocol-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
}

.protocol-summary-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.sim-card-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.main-duration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.5);
  border-radius: var(--radius-md);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.duration-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #fff 30%, var(--text-secondary) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.25rem;
}

.protocol-a-card .duration-value {
  background: linear-gradient(135deg, #fff 40%, #fca5a5 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.protocol-b-card .duration-value {
  background: linear-gradient(135deg, #fff 40%, #93c5fd 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.duration-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.sim-details {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sim-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.sim-detail-row span {
  color: var(--text-muted);
}

.sim-detail-row strong {
  color: var(--text-primary);
  font-feature-settings: "tnum";
}

.sim-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 1rem;
}

/* Comparison Banner */
.sim-comparison-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid;
  transition: all 0.3s;
}

.sim-comparison-banner.better-b {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
}

.sim-comparison-banner.better-b .comparison-icon-wrap {
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
}

.sim-comparison-banner.better-a {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
}

.sim-comparison-banner.better-a .comparison-icon-wrap {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
}

.sim-comparison-banner.equal {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.sim-comparison-banner.equal .comparison-icon-wrap {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
}

.comparison-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.comparison-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.comparison-text h4 {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.comparison-text p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.highlight-a {
  color: #f87171;
}

.highlight-b {
  color: #60a5fa;
}

/* Responsive adjustment for sim grid */
@media (max-width: 768px) {
  .sim-results-grid {
    grid-template-columns: 1fr;
  }
  
  .sim-subtitle {
    margin-left: 0;
  }
}
</style>

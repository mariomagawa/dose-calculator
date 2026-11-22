<template>
  <div class="app-container">
    <header class="app-header card-panel">
      <div class="header-content">
        <div class="logo-box" aria-hidden="true">
          <ActivityIcon class="logo-icon" :size="24" stroke-width="2.4" />
        </div>
        <div class="brand-text">
          <h1>Calculadora de Dose</h1>
          <p>Reconstituição Precisa &amp; Farmacocinética de Peptídeos</p>
        </div>
      </div>

      <div class="header-actions">
        <nav class="tab-nav" role="tablist" aria-label="Modo da aplicação">
          <button
            type="button"
            role="tab"
            :aria-selected="state.activeTab === 'calculator'"
            class="tab-btn"
            :class="{ active: state.activeTab === 'calculator' }"
            @click="state.activeTab = 'calculator'"
          >
            <CalculatorIcon :size="17" />
            <span class="tab-label">Calculadora</span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="state.activeTab === 'frequency'"
            class="tab-btn"
            :class="{ active: state.activeTab === 'frequency' }"
            @click="state.activeTab = 'frequency'"
          >
            <LineChartIcon :size="17" />
            <span class="tab-label">Frequência</span>
          </button>
        </nav>

        <button
          type="button"
          class="theme-toggle-btn"
          :aria-label="state.theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
          :title="state.theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'"
          @click="toggleTheme"
        >
          <SunIcon v-if="state.theme === 'dark'" :size="18" />
          <MoonIcon v-else :size="18" />
        </button>
      </div>
    </header>

    <transition name="fade" mode="out-in">
      <!-- Calculator View -->
      <main v-if="state.activeTab === 'calculator'" class="main-layout" key="calculator">
        <!-- Left Column: Inputs (Steps) -->
        <div class="configuration-section">
          <!-- Step 0: Peptide Selector -->
          <PeptideSelector
            v-model="state.selectedPeptideId"
            :unit="currentUnit"
            @peptide-selected="handlePeptideSelected"
            @switch-free="resetToGeneric"
            @update:unit="handleUnitChange"
          />

          <!-- Step 1: Vial Content -->
          <OptionGroup
            :step-number="1"
            :title="`Conteúdo do Frasco (${currentUnit})`"
            :subtitle="`Quantidade total liofilizada no frasco (${currentUnit})`"
            :options="vialOptions"
            v-model="state.vialAmount"
            :is-completed="isStepDone(state.vialAmount)"
            :reset-key="state.resetCounter"
            allow-custom
            :custom-placeholder="currentUnit === 'UI' ? '500' : '50'"
            :custom-unit="currentUnit"
          />

          <!-- Step 2: Diluent -->
          <OptionGroup
            :step-number="2"
            title="Quantidade de Diluente"
            subtitle="Água Bacteriostática / Diluente Estéril (mL)"
            :options="DILUENT_OPTIONS"
            v-model="state.diluentMl"
            :is-completed="isStepDone(state.diluentMl)"
            :reset-key="state.resetCounter"
            allow-custom
            custom-placeholder="3"
            custom-unit="mL"
          />

          <!-- Step 3: Desired Dose -->
          <OptionGroup
            :step-number="3"
            :title="`Dose Desejada (${currentUnit})`"
            :subtitle="doseSubtitle"
            :options="doseOptions"
            v-model="state.doseAmount"
            :is-completed="isStepDone(state.doseAmount)"
            :reset-key="state.resetCounter"
            allow-custom
            :allow-mcg-toggle="currentUnit === 'mg'"
            :default-custom-unit="currentPeptide?.doseUnit === 'mcg' ? 'mcg' : 'mg'"
            :custom-placeholder="currentUnit === 'UI' ? '50' : '2.5'"
            :custom-unit="currentUnit"
            is-compact
          />

          <!-- Step 4: Syringe -->
          <OptionGroup
            :step-number="4"
            title="Tamanho da Seringa"
            :subtitle="syringeSubtitle"
            :options="SYRINGE_OPTIONS"
            v-model="state.syringeMl"
            :suggested-value="syringeSuggestion.suggestedSyringeMl"
            :is-completed="isStepDone(state.syringeMl)"
            :reset-key="state.resetCounter"
          />
        </div>

        <!-- Right Column: Results (Sticky) -->
        <aside class="results-section" ref="resultsSectionRef">
          <div class="results-panel card-panel sticky-panel">
            <div class="results-header">
              <div class="results-title-group">
                <h2>Resultados</h2>
                <span class="progress-badge mono-num" :class="{ ready: calc.ready }">
                  {{ completedStepsCount }}/4 etapas
                </span>
              </div>
              <button
                v-if="hasAnyInput"
                type="button"
                class="btn-ghost"
                @click="handleReset"
              >
                <RefreshCwIcon :size="15" />
                <span>Limpar</span>
              </button>
            </div>

            <transition name="fade" mode="out-in">
              <!-- Empty / Incomplete Checklist State -->
              <div v-if="!calc.ready" class="placeholder-state" key="placeholder">
                <div class="placeholder-icon-wrapper">
                  <BeakerIcon :size="34" class="placeholder-icon" />
                </div>
                <p>Preencha as 4 etapas ao lado para calcular a extração exata na seringa.</p>

                <ul class="steps-checklist">
                  <li :class="{ done: isStepDone(state.vialAmount) }">
                    <CheckCircle2Icon v-if="isStepDone(state.vialAmount)" :size="16" />
                    <CircleIcon v-else :size="16" />
                    <span>1. Conteúdo do frasco</span>
                  </li>
                  <li :class="{ done: isStepDone(state.diluentMl) }">
                    <CheckCircle2Icon v-if="isStepDone(state.diluentMl)" :size="16" />
                    <CircleIcon v-else :size="16" />
                    <span>2. Volume de diluente</span>
                  </li>
                  <li :class="{ done: isStepDone(state.doseAmount) }">
                    <CheckCircle2Icon v-if="isStepDone(state.doseAmount)" :size="16" />
                    <CircleIcon v-else :size="16" />
                    <span>3. Dose desejada</span>
                  </li>
                  <li :class="{ done: isStepDone(state.syringeMl) }">
                    <CheckCircle2Icon v-if="isStepDone(state.syringeMl)" :size="16" />
                    <CircleIcon v-else :size="16" />
                    <span>4. Tamanho da seringa</span>
                  </li>
                </ul>
              </div>

              <!-- Critical Error: Dose exceeds Vial Content -->
              <div v-else-if="calc.exceedsVial" class="critical-error-state" role="alert" key="critical">
                <div class="critical-icon-wrap">
                  <AlertOctagonIcon :size="32" />
                </div>
                <h3>Dose excede o frasco</h3>
                <p>
                  A dose solicitada (<strong>{{ formattedDoseDisplay }}</strong>) é maior que o conteúdo total do frasco
                  (<strong>{{ state.vialAmount }}{{ currentUnit }}</strong>). Ajuste a dose ou selecione um frasco maior.
                </p>
                <button type="button" class="btn-danger-action" @click="state.doseAmount = null">
                  Ajustar dose
                </button>
              </div>

              <!-- Valid Calculation Results -->
              <div v-else class="results-content" key="results">
                <div class="primary-result">
                  <span class="result-kicker">Para uma dose de</span>
                  <strong class="dose-highlight">{{ formattedDoseDisplay }}</strong>
                  <span class="result-kicker">puxe na seringa U-100 até:</span>

                  <div class="draw-amounts">
                    <div class="amount-box primary" :class="statusBoxClass">
                      <span class="value mono-num">{{ formatMetric(calc.drawUnits, 1) }}</span>
                      <span class="unit">Unidades (U-100)</span>
                    </div>
                    <div class="divider" aria-hidden="true">ou</div>
                    <div class="amount-box">
                      <span class="value mono-num">{{ formatMetric(calc.drawVolume, 3) }}</span>
                      <span class="unit">Volume (mL)</span>
                    </div>
                  </div>
                </div>

                <!-- Precision SVG Syringe -->
                <SyringeVisual
                  :syringe-ml="state.syringeMl"
                  :draw-volume="calc.drawVolume"
                  :draw-units="calc.drawUnits"
                  :status="calc.status"
                />

                <!-- Clinical Alerts -->
                <div v-if="calc.exceedsSyringe" class="clinical-alert alert-danger" role="alert">
                  <AlertTriangleIcon :size="18" class="alert-icon" />
                  <div class="alert-body">
                    <strong>Capacidade da seringa excedida</strong>
                    <p>
                      O volume de <span class="mono-num">{{ formatMetric(calc.drawVolume, 2) }}mL</span>
                      (<span class="mono-num">{{ formatMetric(calc.drawUnits, 1) }} U</span>) ultrapassa a seringa de
                      <span class="mono-num">{{ state.syringeMl }}mL</span>.
                      <template v-if="!calc.recommendedSyringeMl">
                        Seriam necessárias <strong class="mono-num">{{ calc.requiredSyringes }}</strong> seringas ou menos diluente.
                      </template>
                    </p>
                    <div class="alert-actions-row">
                      <button
                        v-if="calc.recommendedSyringeMl"
                        type="button"
                        class="alert-action-btn"
                        @click="state.syringeMl = calc.recommendedSyringeMl"
                      >
                        Trocar para seringa de {{ calc.recommendedSyringeMl }}mL ({{ Math.round(calc.recommendedSyringeMl * 100) }} U)
                      </button>
                      <button
                        v-if="!calc.recommendedSyringeMl && calc.recommendedDiluentForOverflow"
                        type="button"
                        class="alert-action-btn"
                        @click="state.diluentMl = calc.recommendedDiluentForOverflow"
                      >
                        Reduzir diluente para {{ calc.recommendedDiluentForOverflow }}mL ({{ calc.resultingUnitsAtOverflowDiluent }} U por dose)
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else-if="calc.isMicroVolume" class="clinical-alert alert-warning" role="status">
                  <AlertCircleIcon :size="18" class="alert-icon" />
                  <div class="alert-body">
                    <strong>Micro-volume (&lt; 5 Unidades)</strong>
                    <p>
                      Leitura de <span class="mono-num">{{ formatMetric(calc.drawUnits, 1) }} U</span> oferece menor margem de precisão visual.
                      Considere usar mais diluente para ampliar o volume de leitura.
                    </p>
                    <div class="alert-actions-row">
                      <button
                        v-if="calc.suggestSmallerSyringe"
                        type="button"
                        class="alert-action-btn warning"
                        @click="state.syringeMl = 0.3"
                      >
                        Usar seringa de 0.3mL (30 U)
                      </button>
                      <button
                        v-if="calc.recommendedDiluentForMicroVolume"
                        type="button"
                        class="alert-action-btn warning"
                        @click="state.diluentMl = calc.recommendedDiluentForMicroVolume"
                      >
                        Ajustar diluente para {{ calc.recommendedDiluentForMicroVolume }}mL ({{ calc.resultingUnitsAtRecommendedDiluent }} U por dose)
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Secondary Metrics -->
                <div class="secondary-results">
                  <div class="stat-item">
                    <DropletIcon :size="18" class="stat-icon" />
                    <div class="stat-info">
                      <span class="label">Concentração</span>
                      <strong class="value mono-num">
                        {{ formatMetric(calc.concentration, 2) }} <small>{{ currentUnit }}/mL</small>
                      </strong>
                    </div>
                  </div>

                  <div class="stat-item">
                    <ActivityIcon :size="18" class="stat-icon" />
                    <div class="stat-info">
                      <span class="label">Por Unidade (1 U)</span>
                      <strong class="value mono-num">
                        {{ calc.formattedAmountPerUnit }}
                      </strong>
                    </div>
                  </div>

                  <div class="stat-item">
                    <LayersIcon :size="18" class="stat-icon" />
                    <div class="stat-info">
                      <span class="label">Rendimento do Frasco</span>
                      <strong class="value mono-num">
                        {{ calc.fullDoses }} <small>{{ calc.fullDoses === 1 ? 'dose' : 'doses' }}</small>
                      </strong>
                      <span v-if="calc.leftoverAmount > 0" class="leftover-subtext mono-num">
                        + sobra de {{ formatMetric(calc.leftoverAmount, 2) }}{{ currentUnit }} ({{ formatMetric(calc.leftoverVolumeMl, 2) }}mL)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Shortcut to Frequency -->
                <button
                  type="button"
                  class="btn-freq-link"
                  @click="openFrequencySimulation"
                >
                  <LineChartIcon :size="16" />
                  <span>Simular Empilhamento &amp; Duração do Frasco</span>
                </button>
              </div>
            </transition>
          </div>
        </aside>
      </main>

      <!-- Frequency View -->
      <main v-else-if="state.activeTab === 'frequency'" class="frequency-layout" key="frequency">
        <FrequencyView />
      </main>
    </transition>

    <!-- Mobile Floating Summary Bar -->
    <div
      v-if="state.activeTab === 'calculator' && calc.ready && !calc.exceedsVial"
      class="mobile-floating-bar"
    >
      <div class="mfb-info">
        <span class="mfb-dose">Dose {{ formattedDoseDisplay }}</span>
        <strong class="mfb-draw mono-num">
          Puxar {{ formatMetric(calc.drawUnits, 1) }} U
          <span class="mfb-vol">({{ formatMetric(calc.drawVolume, 3) }} mL)</span>
        </strong>
      </div>
      <button type="button" class="mfb-btn" @click="scrollToResults">
        Ver seringa
      </button>
    </div>

    <footer class="app-footer">
      <p>
        Ferramenta de apoio matemático e educacional. Confira sempre a rotulagem do frasco, a graduação da seringa e valide o protocolo com um profissional de saúde habilitado.
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Activity as ActivityIcon,
  RefreshCw as RefreshCwIcon,
  Beaker as BeakerIcon,
  Droplet as DropletIcon,
  Layers as LayersIcon,
  Calculator as CalculatorIcon,
  LineChart as LineChartIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  CheckCircle2 as CheckCircle2Icon,
  Circle as CircleIcon,
  AlertTriangle as AlertTriangleIcon,
  AlertCircle as AlertCircleIcon,
  AlertOctagon as AlertOctagonIcon
} from 'lucide-vue-next'
import { state, toggleTheme } from './state.js'
import {
  PEPTIDES,
  GENERIC_PEPTIDE,
  DILUENT_OPTIONS,
  SYRINGE_OPTIONS,
  DEFAULT_VIAL_SIZES,
  DEFAULT_UI_VIAL_SIZES,
  DEFAULT_UI_DOSE_VALUES
} from './data/peptides.js'
import {
  parsePositiveNumber,
  formatMetric,
  formatDoseDisplay,
  calculateReconstitution,
  suggestSyringeSize
} from './utils/calculations.js'
import PeptideSelector from './components/PeptideSelector.vue'
import OptionGroup from './components/OptionGroup.vue'
import SyringeVisual from './components/SyringeVisual.vue'
import FrequencyView from './components/FrequencyView.vue'

const currentPeptide = computed(() => {
  const found = PEPTIDES.find(p => p.id === state.selectedPeptideId)
  return found || GENERIC_PEPTIDE
})

const currentUnit = computed(() => {
  if (state.selectedPeptideId === 'custom' || !state.selectedPeptideId) {
    return state.unit === 'UI' ? 'UI' : 'mg'
  }
  return currentPeptide.value?.unit || 'mg'
})

const doseSubtitle = computed(() => {
  if (currentUnit.value === 'UI') return 'Unidades Internacionais prescritas (UI)'
  if (currentPeptide.value?.doseUnit === 'mcg') return 'Dose em microgramas (mcg) ou miligramas (mg)'
  return `Dose prescrita em ${currentUnit.value}`
})

const vialOptions = computed(() => {
  const unit = currentUnit.value
  let list = currentPeptide.value?.vials || DEFAULT_VIAL_SIZES
  if ((state.selectedPeptideId === 'custom' || !state.selectedPeptideId) && unit === 'UI') {
    list = DEFAULT_UI_VIAL_SIZES
  }
  return list.map(v => ({
    value: v,
    label: `${v}${unit}`
  }))
})

const doseOptions = computed(() => {
  const unit = currentUnit.value
  if ((state.selectedPeptideId === 'custom' || !state.selectedPeptideId) && unit === 'UI') {
    return DEFAULT_UI_DOSE_VALUES.map(v => ({
      value: v,
      label: `${v} UI`
    }))
  }
  if (currentPeptide.value?.doses?.length) {
    return currentPeptide.value.doses
  }
  return GENERIC_PEPTIDE.doses
})

// Sugestão dinâmica exclusiva para o Tamanho da Seringa (Passo 4)
const syringeSuggestion = computed(() =>
  suggestSyringeSize({
    vialAmount: state.vialAmount,
    diluentMl: state.diluentMl,
    doseAmount: state.doseAmount
  })
)

const syringeSubtitle = computed(() => {
  const s = syringeSuggestion.value
  if (s.exceedsVial) {
    return 'Seringa de Insulina U-100 · Ajuste a dose (excede o conteúdo do frasco)'
  }
  if (s.suggestedSyringeMl === null) {
    return 'Seringa de Insulina U-100 · Preencha os passos 1 a 3 para ver a sugestão ideal'
  }
  if (s.exceedsMaxSyringe) {
    return `Volume estimado: ${formatMetric(s.estimatedVolumeMl, 2)}mL (${formatMetric(s.estimatedUnits, 1)} U) · Excede 1mL (sugerida: 1mL com divisão)`
  }
  return `Volume estimado: ${formatMetric(s.estimatedVolumeMl, 3)}mL (${formatMetric(s.estimatedUnits, 1)} U) · Sugerida: ${s.suggestedSyringeMl}mL (${Math.round(s.suggestedSyringeMl * 100)} U)`
})

const isStepDone = (val) => parsePositiveNumber(val) !== null

const completedStepsCount = computed(() => {
  return [state.vialAmount, state.diluentMl, state.syringeMl, state.doseAmount].filter(isStepDone).length
})

const hasAnyInput = computed(() => {
  return Boolean(
    isStepDone(state.vialAmount) ||
      isStepDone(state.diluentMl) ||
      isStepDone(state.syringeMl) ||
      isStepDone(state.doseAmount)
  )
})

const calc = computed(() =>
  calculateReconstitution({
    vialAmount: state.vialAmount,
    diluentMl: state.diluentMl,
    syringeMl: state.syringeMl,
    doseAmount: state.doseAmount,
    unit: currentUnit.value
  })
)

const formattedDoseDisplay = computed(() => {
  return formatDoseDisplay(
    state.doseAmount,
    currentUnit.value,
    currentPeptide.value?.doseUnit === 'mcg'
  )
})

const statusBoxClass = computed(() => {
  if (!calc.value.ready) return ''
  if (calc.value.status === 'danger') return 'is-danger'
  if (calc.value.status === 'warning') return 'is-warning'
  return ''
})

const resultsSectionRef = ref(null)

const scrollToResults = () => {
  resultsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Auto-recolhe o Passo 0 em Modo Livre se o usuário iniciar diretamente pelos Passos 1–4
watch(
  [() => state.vialAmount, () => state.diluentMl, () => state.doseAmount, () => state.syringeMl],
  ([vial, diluent, dose, syringe]) => {
    if (
      state.selectedPeptideId === null &&
      (vial !== null || diluent !== null || dose !== null || syringe !== null)
    ) {
      state.selectedPeptideId = 'custom'
    }
  }
)

// Sincroniza a dose escolhida na Calculadora com o Protocolo A da aba Frequência
watch(
  () => state.doseAmount,
  (newDose) => {
    const parsed = parsePositiveNumber(newDose)
    if (parsed !== null) {
      state.frequency.protocolA.dose = parsed
      if (state.frequency.protocolA.freq === null) {
        state.frequency.protocolA.freq = currentPeptide.value?.defaultFrequencyDays || 7
      }
    }
  }
)

// Handlers
const handlePeptideSelected = (peptide) => {
  state.selectedPeptideId = peptide.id
  state.unit = peptide.unit || 'mg'
  // Manter parâmetros vazios para escolha consciente de cada passo
  state.vialAmount = null
  state.diluentMl = null
  state.syringeMl = null
  state.doseAmount = null
  state.resetCounter++

  state.frequency.selectedMedication =
    peptide.id === 'custom' ? 'Personalizado (Modo Livre)' : peptide.name
  state.frequency.protocolA.freq = peptide.defaultFrequencyDays || 7
  state.frequency.protocolA.customActive = false
  state.frequency.protocolA.freqCustom = null
  state.frequency.protocolA.dose = null

  const prefUnit = peptide.doseUnit === 'mcg' ? 'mcg' : 'mg'
  state.frequency.protocolA.doseUnit = prefUnit
  state.frequency.protocolB.doseUnit = prefUnit
}

const resetToGeneric = () => {
  state.selectedPeptideId = 'custom'
  state.unit = 'mg'
  state.vialAmount = null
  state.diluentMl = null
  state.syringeMl = null
  state.doseAmount = null
  state.resetCounter++

  state.frequency.selectedMedication = 'Personalizado (Modo Livre)'
  state.frequency.protocolA.freq = 7
  state.frequency.protocolA.customActive = false
  state.frequency.protocolA.freqCustom = null
  state.frequency.protocolA.dose = null
  state.frequency.protocolA.doseUnit = 'mg'
  state.frequency.protocolB.doseUnit = 'mg'
}

const handleUnitChange = (newUnit) => {
  if (state.unit === newUnit) return
  state.unit = newUnit
  state.vialAmount = null
  state.doseAmount = null
  state.resetCounter++
}

const handleReset = () => {
  state.vialAmount = null
  state.diluentMl = null
  state.syringeMl = null
  state.doseAmount = null
  state.resetCounter++
}

const openFrequencySimulation = () => {
  const parsedDose = parsePositiveNumber(state.doseAmount)
  if (parsedDose !== null) {
    state.frequency.protocolA.dose = parsedDose
  }
  if (state.frequency.protocolA.freq === null) {
    state.frequency.protocolA.freq = currentPeptide.value?.defaultFrequencyDays || 7
  }
  state.activeTab = 'frequency'
}
</script>

<style scoped>
.app-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.35rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.95rem;
  min-width: 0;
}

.logo-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon {
  color: var(--accent-strong);
}

.brand-text h1 {
  font-size: 1.45rem;
  line-height: 1.2;
}

.brand-text p {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.12rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.tab-nav {
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 3px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.52rem 0.95rem;
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-md) - 3px);
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--surface-3);
}

.tab-btn.active {
  color: #ffffff;
  background: var(--accent);
  box-shadow: 0 2px 8px var(--accent-glow);
}

.theme-toggle-btn {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
}

.theme-toggle-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
  background: var(--surface-3);
}

/* Main Calculator Two-Column Layout */
.main-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 1.5rem;
  align-items: start;
  width: 100%;
}

.frequency-layout {
  width: 100%;
}

.configuration-section {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  min-width: 0;
}

.results-section {
  min-width: 0;
}

.sticky-panel {
  position: sticky;
  top: 1.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 460px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--border-subtle);
}

.results-title-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.results-header h2 {
  font-size: 1.15rem;
}

.progress-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.progress-badge.ready {
  background: var(--emerald-soft);
  color: var(--emerald);
  border-color: color-mix(in srgb, var(--emerald) 35%, transparent);
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-sm);
  transition: all 0.18s ease;
}

.btn-ghost:hover {
  background: var(--surface-2);
  color: var(--text-primary);
}

/* Placeholder Checklist State */
.placeholder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  gap: 1.1rem;
  padding: 1.25rem 0.5rem;
}

.placeholder-icon-wrapper {
  background: var(--surface-2);
  padding: 1.15rem;
  border-radius: 50%;
  border: 1px dashed var(--border-strong);
}

.placeholder-icon {
  color: var(--accent);
  opacity: 0.7;
}

.placeholder-state p {
  max-width: 280px;
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.steps-checklist {
  list-style: none;
  width: 100%;
  max-width: 270px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  margin-top: 0.25rem;
}

.steps-checklist li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.84rem;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  padding: 0.48rem 0.75rem;
  border-radius: var(--radius-sm);
}

.steps-checklist li.done {
  color: var(--emerald);
  border-color: color-mix(in srgb, var(--emerald) 35%, transparent);
  background: var(--emerald-soft);
  font-weight: 600;
}

/* Critical Vial Error */
.critical-error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.9rem;
  padding: 1.5rem 1rem;
  background: var(--danger-soft);
  border: 1px solid color-mix(in srgb, var(--danger) 40%, transparent);
  border-radius: var(--radius-md);
}

.critical-icon-wrap {
  color: var(--danger);
}

.critical-error-state h3 {
  color: var(--danger);
  font-size: 1.12rem;
}

.critical-error-state p {
  font-size: 0.88rem;
  color: var(--text-primary);
  max-width: 340px;
}

.btn-danger-action {
  background: var(--danger);
  color: #ffffff;
  border: none;
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
}

/* Results Content */
.results-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.primary-result {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.result-kicker {
  font-size: 0.86rem;
  color: var(--text-secondary);
}

.dose-highlight {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--accent-strong);
  line-height: 1.2;
}

.draw-amounts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.amount-box {
  flex: 1;
  background: var(--surface-2);
  padding: 0.95rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-box.primary {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.amount-box.primary.is-warning {
  background: var(--amber-soft);
  border-color: color-mix(in srgb, var(--amber) 45%, transparent);
}

.amount-box.primary.is-danger {
  background: var(--danger-soft);
  border-color: color-mix(in srgb, var(--danger) 45%, transparent);
}

.amount-box .value {
  font-size: 2.1rem;
  font-weight: 700;
  line-height: 1.05;
  color: var(--text-primary);
}

.amount-box.primary .value {
  color: var(--accent-strong);
}

.amount-box.primary.is-warning .value {
  color: var(--amber);
}

.amount-box.primary.is-danger .value {
  color: var(--danger);
}

.amount-box .unit {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.divider {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* Clinical Alerts */
.clinical-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid;
  font-size: 0.83rem;
}

.clinical-alert.alert-danger {
  background: var(--danger-soft);
  border-color: color-mix(in srgb, var(--danger) 40%, transparent);
  color: var(--text-primary);
}

.clinical-alert.alert-danger .alert-icon {
  color: var(--danger);
}

.clinical-alert.alert-warning {
  background: var(--amber-soft);
  border-color: color-mix(in srgb, var(--amber) 40%, transparent);
  color: var(--text-primary);
}

.clinical-alert.alert-warning .alert-icon {
  color: var(--amber);
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.alert-body p {
  color: var(--text-secondary);
  line-height: 1.4;
}

.alert-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.25rem;
}

.alert-action-btn {
  align-self: flex-start;
  background: var(--danger);
  color: #ffffff;
  border: none;
  padding: 0.38rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.alert-action-btn.warning {
  background: var(--amber);
  color: #090d16;
}

/* Secondary Results */
.secondary-results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  background: var(--surface-2);
  padding: 0.95rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.stat-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  min-width: 0;
}

.stat-icon {
  color: var(--emerald);
  flex-shrink: 0;
  margin-top: 2px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.stat-info .label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.stat-info .value {
  font-size: 0.98rem;
  color: var(--text-primary);
  word-break: break-word;
}

.stat-info small {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.leftover-subtext {
  font-size: 0.74rem;
  color: var(--text-secondary);
}

/* Frequency Shortcut */
.btn-freq-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--surface-2);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border-subtle));
  color: var(--accent-strong);
  padding: 0.72rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-freq-link:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}

/* Footer Disclaimer */
.app-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  text-align: center;
}

.app-footer p {
  font-size: 0.76rem;
  color: var(--text-muted);
  max-width: 780px;
  margin: 0 auto;
  line-height: 1.45;
}

/* Mobile Floating Summary Bar */
.mobile-floating-bar {
  display: none;
}

@media (max-width: 992px) {
  .app-container {
    padding-bottom: 5.5rem;
  }
  .main-layout {
    grid-template-columns: 1fr;
  }
  .sticky-panel {
    position: relative;
    top: 0;
    min-height: auto;
  }
  .mobile-floating-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    position: fixed;
    bottom: 0.75rem;
    left: 0.85rem;
    right: 0.85rem;
    z-index: 40;
    background: var(--surface-elevated);
    border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border-strong));
    border-radius: var(--radius-lg);
    padding: 0.7rem 0.95rem;
    box-shadow: var(--shadow-elevated);
  }
  .mfb-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }
  .mfb-dose {
    font-size: 0.72rem;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .mfb-draw {
    font-size: 0.96rem;
    color: var(--accent-strong);
  }
  .mfb-vol {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .mfb-btn {
    background: var(--accent);
    border: none;
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.48rem 0.85rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    flex-shrink: 0;
  }
}

@media (max-width: 720px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: space-between;
  }
  .tab-nav {
    flex: 1;
  }
  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 0.5rem 0.65rem;
    font-size: 0.84rem;
  }
}

@media (max-width: 540px) {
  .app-container {
    padding: 1rem 0.85rem 5.5rem;
  }
  .draw-amounts {
    flex-direction: column;
    gap: 0.45rem;
  }
  .amount-box {
    width: 100%;
  }
  .secondary-results {
    grid-template-columns: 1fr;
  }
}
</style>

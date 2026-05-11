<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-box">
          <ActivityIcon class="logo-icon" :size="28" stroke-width="2.5" />
        </div>
        <div>
          <h1 class="text-gradient">Calculadora de Dose</h1>
          <p>Precisão para Reconstituição de Peptídeos</p>
        </div>
      </div>
      <button class="btn-icon" @click="handlePrint" title="Imprimir" aria-label="Imprimir dosagem">
        <PrinterIcon :size="20" />
      </button>
    </header>

    <main class="main-layout">
      <!-- Left Column: Inputs (Steps) -->
      <div class="configuration-section">
        <OptionGroup
          :step-number="1"
          title="Conteúdo do Frasco"
          subtitle="(mg)"
          :options="vialOptions"
          v-model="state.vialMg"
          allow-custom
          custom-placeholder="50"
          custom-unit="mg"
        />

        <OptionGroup
          :step-number="2"
          title="Quantidade de Diluente"
          subtitle="(Água Bacteriostática / NaCl)"
          :options="diluentOptions"
          v-model="state.diluentMl"
          allow-custom
          custom-placeholder="4"
          custom-unit="mL"
        />

        <OptionGroup
          :step-number="3"
          title="Tamanho da Seringa"
          subtitle="(U-100)"
          :options="syringeOptions"
          v-model="state.syringeMl"
        />

        <OptionGroup
          :step-number="4"
          title="Dose Desejada"
          subtitle="(mg)"
          :options="doseOptions"
          v-model="state.doseMg"
          allow-custom
          custom-placeholder="3"
          custom-unit="mg"
          is-compact
        />
      </div>

      <!-- Right Column: Results (Sticky) -->
      <div class="results-section">
        <div class="results-panel glass-panel sticky-panel">
          <div class="results-header">
            <h2>Resultados</h2>
            <button class="btn-ghost" @click="handleReset" v-if="hasAnyInput">
              <RefreshCwIcon :size="16" /> Limpar
            </button>
          </div>

          <transition name="fade" mode="out-in">
            <div v-if="!isReady" class="placeholder-state" key="placeholder">
              <div class="placeholder-icon-wrapper">
                <BeakerIcon :size="40" class="placeholder-icon" />
              </div>
              <p>Conclua todas as etapas para visualizar a extração e informações da sua dose.</p>
            </div>

            <div v-else class="results-content" key="results">
              <div class="primary-result">
                <span>Para uma dose de</span>
                <strong class="highlight text-gradient">{{ formatNumber(state.doseMg) }}mg</strong>
                <span>puxe na seringa até:</span>
                
                <div class="draw-amounts">
                  <div class="amount-box">
                    <span class="value">{{ formatNumber(drawVolume) }}</span>
                    <span class="unit">mL</span>
                  </div>
                  <div class="divider">
                    <span>ou</span>
                  </div>
                  <div class="amount-box primary">
                    <span class="value">{{ formatNumber(drawUnits) }}</span>
                    <span class="unit">Unidades</span>
                  </div>
                </div>
              </div>

              <div class="visual-container">
                <SyringeVisual :syringe-ml="state.syringeMl" :draw-volume="drawVolume" />
              </div>

              <div class="secondary-results">
                <div class="stat-item">
                  <DropletIcon :size="18" class="stat-icon" />
                  <div class="stat-info">
                    <span class="label">Concentração</span>
                    <strong class="value">{{ formatNumber(concentration) }} <small>mg/mL</small></strong>
                  </div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <LayersIcon :size="18" class="stat-icon" />
                  <div class="stat-info">
                    <span class="label">O frasco renderá</span>
                    <strong class="value">{{ Math.floor(totalDoses) }} <small>doses</small></strong>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { 
  Activity as ActivityIcon, 
  Printer as PrinterIcon, 
  RefreshCw as RefreshCwIcon,
  Beaker as BeakerIcon,
  Droplet as DropletIcon,
  Layers as LayersIcon
} from 'lucide-vue-next';
import OptionGroup from './components/OptionGroup.vue';
import SyringeVisual from './components/SyringeVisual.vue';

// State
const state = reactive({
  vialMg: null,
  diluentMl: null,
  syringeMl: null,
  doseMg: null
});

// Options data
const vialOptions = [
  { value: 5, label: '5mg' },
  { value: 10, label: '10mg' },
  { value: 15, label: '15mg' },
  { value: 20, label: '20mg' },
  { value: 30, label: '30mg' },
  { value: 60, label: '60mg' }
];

const diluentOptions = [
  { value: 0.5, label: '0.5mL' },
  { value: 1, label: '1mL' },
  { value: 2, label: '2mL' },
  { value: 2.4, label: '2.4mL' },
  { value: 2.5, label: '2.5mL' },
  { value: 4, label: '4mL' }
];

const syringeOptions = [
  { value: 0.3, ml: '0.3mL', units: '(30 U)' },
  { value: 0.5, ml: '0.5mL', units: '(50 U)' },
  { value: 1, ml: '1mL', units: '(100 U)' }
];

const doseOptions = [
  0.25, 0.5, 1, 1.7, 2, 2.4, 2.5, 4, 5, 7.5, 10, 12, 12.5, 15, 17.5, 20, 25, 30
].map(v => ({ value: v, label: `${v}mg` }));

// Computed
const hasAnyInput = computed(() => state.vialMg || state.diluentMl || state.syringeMl || state.doseMg);
const isReady = computed(() => state.vialMg && state.diluentMl && state.syringeMl && state.doseMg);

const concentration = computed(() => state.vialMg / state.diluentMl);
const drawVolume = computed(() => state.doseMg / concentration.value);
const drawUnits = computed(() => drawVolume.value * 100);
const totalDoses = computed(() => state.vialMg / state.doseMg);

// Methods
const formatNumber = (num, decimals = 3) => {
  return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
};

const handleReset = () => {
  state.vialMg = null;
  state.diluentMl = null;
  state.syringeMl = null;
  state.doseMg = null;
};

const handlePrint = () => {
  window.print();
};
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  width: 100%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding: 1rem;
  background: var(--surface-color);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--surface-border);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.logo-box {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(167, 139, 250, 0.2));
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  color: var(--primary-hover);
}

.app-header h1 {
  font-size: 1.75rem;
  line-height: 1.2;
}

.app-header p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 0.2rem;
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--surface-border);
  color: var(--text-secondary);
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--surface-hover);
  color: var(--primary-hover);
  border-color: rgba(255,255,255,0.2);
}

/* Two-column layout */
.main-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.configuration-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Sticky Results Panel */
.sticky-panel {
  position: sticky;
  top: 2rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.results-header h2 {
  font-size: 1.25rem;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.placeholder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: var(--text-muted);
  gap: 1.5rem;
  padding: 2rem;
}

.placeholder-icon-wrapper {
  background: rgba(30, 41, 59, 0.4);
  padding: 1.5rem;
  border-radius: 50%;
  border: 1px dashed var(--surface-border);
}

.placeholder-icon {
  opacity: 0.4;
  color: var(--primary);
}

.placeholder-state p {
  max-width: 250px;
  line-height: 1.5;
  font-size: 0.95rem;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  flex: 1;
}

.primary-result {
  text-align: center;
  font-size: 1rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.primary-result .highlight {
  font-size: 2rem;
  line-height: 1;
}

.draw-amounts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.amount-box {
  background: rgba(15, 23, 42, 0.6);
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 140px;
}

.amount-box.primary {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.05);
}

.amount-box .value {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  color: var(--text-primary);
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

.amount-box.primary .value {
  color: var(--primary-hover);
}

.amount-box .unit {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--surface-color);
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  border: 1px solid var(--surface-border);
}

.visual-container {
  padding: 1.5rem 0;
}

.secondary-results {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(15, 23, 42, 0.4);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-border);
  margin-top: auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--surface-border);
}

.stat-icon {
  color: var(--secondary);
  opacity: 0.8;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-info .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-info .value {
  font-size: 1.15rem;
  color: var(--text-primary);
}

.stat-info small {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 400;
}

@media print {
  body { background: white; color: black; }
  .glass-panel { background: none; border: 1px solid #ccc; box-shadow: none; filter: none !important; }
  .btn-icon, .btn-ghost { display: none; }
  .app-container { padding: 0; }
  .text-gradient { background: none; -webkit-text-fill-color: black; color: black; }
  .syringe-liquid { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .main-layout { display: block; }
  .configuration-section { display: none; /* Hide inputs on print, just show results */ }
  body::before, body::after { display: none; }
}

@media (max-width: 992px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .sticky-panel {
    position: relative;
    top: 0;
    min-height: auto;
  }
  body::before, body::after {
    width: 300px;
    height: 300px;
  }
}

@media (max-width: 640px) {
  .draw-amounts { flex-direction: column; gap: 1rem; }
  .amount-box { width: 100%; }
  .divider { margin: -0.5rem 0; z-index: 1; }
  .secondary-results { flex-direction: column; gap: 1.5rem; align-items: flex-start; }
  .stat-divider { width: 100%; height: 1px; }
  .app-header { flex-direction: column; text-align: center; gap: 1rem; }
}
</style>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <ActivityIcon class="logo-icon" :size="32" />
        <div>
          <h1 class="text-gradient">Calculadora de Dose</h1>
          <p>Reconstituição & Dosagem de Peptídeos</p>
        </div>
      </div>
      <button class="btn-icon" @click="handlePrint" title="Imprimir">
        <PrinterIcon :size="20" />
      </button>
    </header>

    <main class="main-content">
      <div class="cards-grid">
        <OptionGroup
          title="Conteúdo do Frasco"
          subtitle="(mg)"
          :options="vialOptions"
          v-model="state.vialMg"
          allow-custom
          custom-placeholder="Ex: 50"
          custom-unit="mg"
        />

        <OptionGroup
          title="Quantidade de Diluente"
          subtitle="(Água Bacteriostática / NaCl)"
          :options="diluentOptions"
          v-model="state.diluentMl"
          allow-custom
          custom-placeholder="Ex: 4"
          custom-unit="mL"
        />

        <OptionGroup
          title="Tamanho da Seringa"
          subtitle="(U-100)"
          :options="syringeOptions"
          v-model="state.syringeMl"
        />

        <OptionGroup
          title="Dose Desejada"
          subtitle="(mg)"
          :options="doseOptions"
          v-model="state.doseMg"
          allow-custom
          custom-placeholder="Ex: 3"
          custom-unit="mg"
          is-compact
        />
      </div>

      <div class="results-panel glass-panel">
        <div class="results-header">
          <h2>Resultados</h2>
          <button class="btn-ghost" @click="handleReset" v-if="hasAnyInput">
            <RefreshCwIcon :size="16" /> Limpar
          </button>
        </div>

        <transition name="fade" mode="out-in">
          <div v-if="!isReady" class="placeholder-state" key="placeholder">
            <InfoIcon :size="48" class="placeholder-icon" />
            <p>Selecione todos os parâmetros acima para visualizar o cálculo de dosagem.</p>
          </div>

          <div v-else class="results-content" key="results">
            <div class="primary-result">
              Para uma dose de <strong class="highlight">{{ formatNumber(state.doseMg) }}mg</strong>, puxe na seringa até:
              <div class="draw-amounts">
                <div class="amount-box">
                  <span class="value">{{ formatNumber(drawVolume) }}</span>
                  <span class="unit">mL</span>
                </div>
                <span class="divider">ou</span>
                <div class="amount-box primary">
                  <span class="value">{{ formatNumber(drawUnits) }}</span>
                  <span class="unit">Unidades</span>
                </div>
              </div>
            </div>

            <SyringeVisual :syringe-ml="state.syringeMl" :draw-volume="drawVolume" />

            <div class="secondary-results">
              <div class="stat-card">
                <DropletIcon :size="20" class="stat-icon" />
                <div class="stat-info">
                  <span class="label">Concentração</span>
                  <span class="value">{{ formatNumber(concentration) }} mg/mL</span>
                </div>
              </div>
              <div class="stat-card">
                <LayersIcon :size="20" class="stat-icon" />
                <div class="stat-info">
                  <span class="label">O frasco renderá</span>
                  <span class="value">{{ Math.floor(totalDoses) }} doses</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
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
  Info as InfoIcon,
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
  { value: 0.3, ml: '0.3mL', units: '(30 Unidades)' },
  { value: 0.5, ml: '0.5mL', units: '(50 Unidades)' },
  { value: 1, ml: '1mL', units: '(100 Unidades)' }
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  color: var(--primary);
}

.app-header h1 {
  font-size: 2rem;
  line-height: 1.2;
}

.app-header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.btn-icon {
  background: var(--surface-color);
  border: 1px solid var(--surface-border);
  color: var(--text-primary);
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
  color: var(--primary);
  transform: translateY(-2px);
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.results-panel {
  padding: 2rem;
  margin-top: 1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
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
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
  gap: 1rem;
}

.placeholder-icon {
  opacity: 0.5;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.primary-result {
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.highlight {
  color: var(--text-primary);
  font-size: 1.2rem;
}

.draw-amounts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.amount-box {
  background: var(--surface-color);
  padding: 1rem 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amount-box.primary {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.amount-box .value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.amount-box.primary .value {
  color: var(--primary);
}

.amount-box .unit {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.divider {
  font-style: italic;
  color: var(--text-muted);
}

.secondary-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-icon {
  color: var(--secondary);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-info .label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-info .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

@media print {
  body { background: white; color: black; }
  .glass-panel { background: none; border: 1px solid #ccc; box-shadow: none; }
  .btn-icon, .btn-ghost { display: none; }
  .app-container { padding: 0; }
  .text-gradient { background: none; -webkit-text-fill-color: black; color: black; }
  .syringe-liquid { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

@media (max-width: 768px) {
  .app-container { padding: 1rem; }
  .cards-grid { grid-template-columns: 1fr; }
  .draw-amounts { flex-direction: column; gap: 1rem; }
  .amount-box { width: 100%; }
}
</style>

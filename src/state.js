import { reactive } from 'vue'

const THEME_STORAGE_KEY = 'dose-calc-theme'

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // ignore storage access errors
  }
  return 'dark'
}

export function applyTheme(theme) {
  const normalized = theme === 'light' ? 'light' : 'dark'
  state.theme = normalized
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = normalized
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized)
    } catch {
      // ignore storage access errors
    }
  }
}

export function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark')
}

export const state = reactive({
  theme: getInitialTheme(),

  // Peptídeo selecionado no Passo 0 (inicia sem seleção prévia)
  selectedPeptideId: null,
  unit: 'mg', // 'mg' | 'UI'

  // Calculadora principal - iniciam vazios até escolha do usuário
  vialAmount: null,
  diluentMl: null,
  syringeMl: null,
  doseAmount: null,
  resetCounter: 0,

  // Navegação
  activeTab: 'calculator', // 'calculator' | 'frequency'

  // Estado preservado da aba Frequência
  frequency: {
    selectedMedication: 'Tirzepatida',
    customHalfLifeDays: 5.0,
    protocolA: {
      label: 'Protocolo A',
      dose: null,
      doseUnit: 'mg',
      freq: 7,
      freqCustom: null,
      customActive: false
    },
    protocolB: {
      label: 'Protocolo B',
      dose: null,
      doseUnit: 'mg',
      freq: null,
      freqCustom: null,
      customActive: false
    }
  }
})

import { reactive } from 'vue'

export const state = reactive({
  // Calculadora principal
  vialMg: null,
  diluentMl: null,
  syringeMl: null,
  doseMg: null,

  // Navegação
  activeTab: 'calculator', // 'calculator' | 'frequency'
})

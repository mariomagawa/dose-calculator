// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../../App.vue'
import { state, applyTheme } from '../../state.js'

function resetGlobalState() {
  localStorage.clear()
  applyTheme('dark')
  state.selectedPeptideId = null
  state.unit = 'mg'
  state.vialAmount = null
  state.diluentMl = null
  state.syringeMl = null
  state.doseAmount = null
  state.resetCounter = 0
  state.activeTab = 'calculator'
  state.frequency.selectedMedication = 'Tirzepatida'
  state.frequency.customHalfLifeDays = 5.0
  state.frequency.protocolA = {
    label: 'Protocolo A',
    dose: null,
    doseUnit: 'mg',
    freq: 7,
    freqCustom: null,
    customActive: false
  }
  state.frequency.protocolB = {
    label: 'Protocolo B',
    dose: null,
    doseUnit: 'mg',
    freq: null,
    freqCustom: null,
    customActive: false
  }
}

async function clickOptionInGroup(wrapper, groupIndex, matchText) {
  const groups = wrapper.findAll('.option-group')
  const btn = groups[groupIndex]
    .findAll('.opt-btn')
    .find(b => b.find('.primary-text')?.text().trim() === matchText)
  expect(btn, `Option "${matchText}" not found in group ${groupIndex}`).toBeTruthy()
  await btn.trigger('click')
}

describe('App.vue Integration Suite', () => {
  let consoleErrorSpy

  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 800
      }
    })

    Element.prototype.getBoundingClientRect = function () {
      return {
        left: 0,
        top: 0,
        width: 800,
        height: 340,
        right: 800,
        bottom: 340,
        x: 0,
        y: 0,
        toJSON: () => {}
      }
    }
  })

  beforeEach(() => {
    resetGlobalState()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('renders expanded Step 0 and 0/4 checklist on initial load', () => {
    const wrapper = mount(App)
    expect(wrapper.find('.expanded-selector').exists()).toBe(true)
    expect(wrapper.find('.progress-badge').text()).toBe('0/4 etapas')
    expect(wrapper.findAll('.steps-checklist li')).toHaveLength(4)
  })

  it('auto-collapses Step 0 into Modo Livre on direct Step 1 interaction and resets invalid custom inputs on Limpar', async () => {
    const wrapper = mount(App)
    expect(wrapper.find('.expanded-selector').exists()).toBe(true)

    // Interact directly with Step 1 without picking a peptide first
    await clickOptionInGroup(wrapper, 0, '15mg')
    await nextTick()
    expect(state.selectedPeptideId).toBe('custom')
    expect(wrapper.find('.compact-summary').exists()).toBe(true)
    expect(wrapper.find('.compact-name').text()).toContain('Outro / Personalizado')

    // Type invalid '0' in Step 2 custom input then click Limpar
    const diluentGroup = wrapper.findAll('.option-group')[1]
    await diluentGroup.find('.custom-trigger').trigger('click')
    await diluentGroup.find('input[aria-label="Valor personalizado"]').setValue('0')
    expect(diluentGroup.find('.custom-error-hint').exists()).toBe(true)

    await wrapper.find('.results-header .btn-ghost').trigger('click')
    await nextTick()
    expect(wrapper.findAll('.option-group')[1].find('input[aria-label="Valor personalizado"]').exists()).toBe(false)
    expect(wrapper.find('.custom-error-hint').exists()).toBe(false)
  })

  it('includes 90mg vial and 1mg/1.5mg/2mg subdoses for Tirzepatida, shows scale resolution, 1U equivalence, diluent fix, and syncs directly to Frequency chart', async () => {
    const wrapper = mount(App)

    const searchInput = wrapper.find('input[aria-label="Buscar peptídeo ou código"]')
    await searchInput.setValue('zzzznotfound')
    expect(wrapper.find('.empty-search-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Limpar busca')
    expect(wrapper.text()).toContain('Usar Modo Livre')

    await wrapper.find('.empty-search-state button').trigger('click')
    expect(wrapper.findAll('.peptide-card').length).toBeGreaterThan(10)

    const tirzCard = wrapper
      .findAll('.peptide-card')
      .find(card => card.find('.pep-name').text().trim() === 'Tirzepatida')
    await tirzCard.trigger('click')

    // Collapses without "Aplicar sugestão padrão" button and with no suggestions on Steps 1-3
    expect(wrapper.find('.compact-summary').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Aplicar sugestão padrão')
    expect(wrapper.find('.progress-badge').text()).toBe('0/4 etapas')
    expect(wrapper.findAll('.suggested-pill')).toHaveLength(0)

    const groups = wrapper.findAll('.option-group')
    // Step 1: Frasco includes 90mg
    expect(groups[0].text()).toContain('90mg')
    // Step 3: Dose Desejada includes 1mg, 1.5mg, 2mg
    expect(groups[2].text()).toContain('1mg')
    expect(groups[2].text()).toContain('1.5mg')
    expect(groups[2].text()).toContain('2mg')

    // Select 15mg vial + 2mL diluent + 2mg dose -> 0.267mL -> suggests 0.3mL (without auto-selecting)
    await clickOptionInGroup(wrapper, 0, '15mg')
    await clickOptionInGroup(wrapper, 1, '2mL')
    await clickOptionInGroup(wrapper, 2, '2mg')
    expect(state.syringeMl).toBeNull()
    expect(groups[0].findAll('.suggested-pill')).toHaveLength(0)
    expect(groups[1].findAll('.suggested-pill')).toHaveLength(0)
    expect(groups[2].findAll('.suggested-pill')).toHaveLength(0)
    expect(groups[3].findAll('.suggested-pill')).toHaveLength(1)
    expect(groups[3].find('.opt-btn.suggested').text()).toContain('0.3mL')

    // Switch dose to 2.5mg -> 0.333mL -> suggests 0.5mL
    await clickOptionInGroup(wrapper, 2, '2.5mg')
    expect(groups[3].find('.opt-btn.suggested').text()).toContain('0.5mL')

    // Switch dose to 5mg -> 0.667mL -> suggests 1mL
    await clickOptionInGroup(wrapper, 2, '5mg')
    expect(groups[3].find('.opt-btn.suggested').text()).toContain('1mL')

    // Custom dose 20mg (> 15mg vial) -> clears syringe suggestion
    await groups[2].find('.custom-trigger').trigger('click')
    await groups[2].find('input[aria-label="Valor personalizado"]').setValue('20')
    expect(groups[3].findAll('.suggested-pill')).toHaveLength(0)

    // Pick 2.5mg and 1mL syringe -> complete calculation and SVG syringe check
    await clickOptionInGroup(wrapper, 2, '2.5mg')
    await clickOptionInGroup(wrapper, 3, '1mL')

    expect(wrapper.find('.progress-badge').text()).toBe('4/4 etapas')
    expect(wrapper.find('.amount-box.primary .value').text()).toBe('33.3')
    expect(wrapper.find('.amount-box:not(.primary) .value').text()).toBe('0.333')
    expect(wrapper.text()).toContain('6 doses')
    expect(wrapper.text()).toContain('75 mcg (0.075 mg)')
    expect(wrapper.find('.syringe-meta-bar').text()).toContain('1 traço = 2 Unidades')

    const svg = wrapper.find('svg.syringe-svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 680 164')
    expect(svg.find('.badge-text').text()).toBe('33.3 U')

    // Shortcut to Frequency should immediately render D3 chart using synced dose (2.5mg) and defaultFrequencyDays (7d)
    await wrapper.find('.btn-freq-link').trigger('click')
    await nextTick()
    expect(state.activeTab).toBe('frequency')
    expect(wrapper.find('#dose-a').element.value).toBe('2.5')
    expect(wrapper.find('.chart-stage svg').exists()).toBe(true)

    // Back to calculator and test Tirzepatida 90mg + 2mL + 1mg + 0.3mL -> scale 1U + diluent suggestion 4.5mL
    await wrapper.findAll('.tab-btn').find(b => b.text().includes('Calculadora')).trigger('click')
    await nextTick()
    await clickOptionInGroup(wrapper, 0, '90mg')
    await clickOptionInGroup(wrapper, 1, '2mL')
    await clickOptionInGroup(wrapper, 2, '1mg')
    await clickOptionInGroup(wrapper, 3, '0.3mL')

    expect(wrapper.find('.syringe-meta-bar').text()).toContain('1 traço = 1 Unidade')
    expect(wrapper.text()).toContain('0.45 mg (450 mcg)')
    const microAlert = wrapper.find('.clinical-alert.alert-warning')
    expect(microAlert.exists()).toBe(true)
    const diluentFixBtn = microAlert
      .findAll('.alert-action-btn')
      .find(b => b.text().includes('Ajustar diluente para 4.5mL'))
    expect(diluentFixBtn).toBeTruthy()
    await diluentFixBtn.trigger('click')
    expect(state.diluentMl).toBe(4.5)
    expect(wrapper.find('.amount-box.primary .value').text()).toBe('5')
    expect(wrapper.find('.clinical-alert.alert-warning').exists()).toBe(false)
  })

  it('supports Modo Livre unit switching (mg <-> UI) and propagates UI to Frequency tab', async () => {
    const wrapper = mount(App)
    const tirzCard = wrapper
      .findAll('.peptide-card')
      .find(card => card.find('.pep-name').text().trim() === 'Tirzepatida')
    await tirzCard.trigger('click')

    const freeBtn = wrapper
      .findAll('.compact-actions button')
      .find(b => b.text().includes('Modo Livre'))
    await freeBtn.trigger('click')

    const uiToggleBtn = wrapper
      .findAll('.unit-seg-btn')
      .find(b => b.text().trim() === 'UI')
    await uiToggleBtn.trigger('click')

    const groups = wrapper.findAll('.option-group')
    expect(groups[0].text()).toContain('500UI')
    expect(groups[2].text()).toContain('50 UI')

    const freqTabBtn = wrapper
      .findAll('.tab-btn')
      .find(b => b.text().includes('Frequência'))
    await freqTabBtn.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Dose (UI)')
  })

  it('preserves custom mcg dose across tab switches and closes custom mode when a preset option is selected', async () => {
    const wrapper = mount(App)
    const ipaCard = wrapper
      .findAll('.peptide-card')
      .find(card => card.find('.pep-name').text().trim() === 'Ipamorelin')
    await ipaCard.trigger('click')

    await clickOptionInGroup(wrapper, 0, '5mg')
    await clickOptionInGroup(wrapper, 1, '2mL')

    // Step 3 is now Dose Desejada (index 2)
    const doseGroup = wrapper.findAll('.option-group')[2]
    await doseGroup.find('.custom-trigger').trigger('click')

    const activeUnitBtn = doseGroup.find('.unit-toggle-btn.active')
    expect(activeUnitBtn.text().trim()).toBe('mcg')

    const customInput = doseGroup.find('input[aria-label="Valor personalizado"]')
    await customInput.setValue('225')
    expect(state.doseAmount).toBeCloseTo(0.225, 6)

    // Step 4 is Tamanho da Seringa (index 3)
    await clickOptionInGroup(wrapper, 3, '0.5mL')
    expect(wrapper.find('.amount-box.primary .value').text()).toBe('9')

    // Switch to Frequency and back to Calculator
    const freqTab = wrapper.findAll('.tab-btn').find(b => b.text().includes('Frequência'))
    const calcTab = wrapper.findAll('.tab-btn').find(b => b.text().includes('Calculadora'))
    await freqTab.trigger('click')
    await nextTick()
    await calcTab.trigger('click')
    await nextTick()

    const restoredDoseGroup = wrapper.findAll('.option-group')[2]
    const restoredInput = restoredDoseGroup.find('input[aria-label="Valor personalizado"]')
    expect(restoredInput.exists()).toBe(true)
    expect(restoredInput.element.value).toBe('225')
    expect(restoredDoseGroup.find('.unit-toggle-btn.active').text().trim()).toBe('mcg')

    // Selecting a preset closes custom mode
    await clickOptionInGroup(wrapper, 2, '200 mcg')
    expect(wrapper.findAll('.option-group')[2].find('input[aria-label="Valor personalizado"]').exists()).toBe(false)
    expect(state.doseAmount).toBe(0.2)
  })

  it('displays critical error when dose exceeds vial, danger alert with 1-click syringe fix, and micro-volume warning', async () => {
    const wrapper = mount(App)
    const customCard = wrapper
      .findAll('.peptide-card')
      .find(card => card.find('.pep-name').text().trim() === 'Outro / Personalizado')
    await customCard.trigger('click')

    // 1. dose > vial (5mg vial, 2mL diluent, 10mg dose, 1mL syringe)
    await clickOptionInGroup(wrapper, 0, '5mg')
    await clickOptionInGroup(wrapper, 1, '2mL')
    await clickOptionInGroup(wrapper, 2, '10mg')
    await clickOptionInGroup(wrapper, 3, '1mL')

    expect(wrapper.find('.critical-error-state').exists()).toBe(true)
    expect(wrapper.find('svg.syringe-svg').exists()).toBe(false)
    await wrapper.find('.btn-danger-action').trigger('click')
    expect(state.doseAmount).toBeNull()

    // 2. drawVolume > syringeMl (10mg, 4mL, 2mg dose -> 0.8mL, 0.3mL syringe)
    await clickOptionInGroup(wrapper, 0, '10mg')
    await clickOptionInGroup(wrapper, 1, '4mL')
    await clickOptionInGroup(wrapper, 2, '2mg')
    await clickOptionInGroup(wrapper, 3, '0.3mL')

    const dangerAlert = wrapper.find('.clinical-alert.alert-danger')
    expect(dangerAlert.exists()).toBe(true)
    expect(dangerAlert.text()).toContain('Trocar para seringa de 1mL (100 U)')
    await dangerAlert.find('.alert-action-btn').trigger('click')
    expect(state.syringeMl).toBe(1)
    expect(wrapper.find('.clinical-alert.alert-danger').exists()).toBe(false)

    // 3. Micro-volume < 5 U (10mg, 1mL, 250mcg -> 2.5 U, 1mL syringe)
    await clickOptionInGroup(wrapper, 1, '1mL')
    await clickOptionInGroup(wrapper, 2, '250mcg')
    const microAlert = wrapper.find('.clinical-alert.alert-warning')
    expect(microAlert.exists()).toBe(true)
    expect(microAlert.text()).toContain('Usar seringa de 0.3mL (30 U)')
    await microAlert.find('.alert-action-btn').trigger('click')
    expect(state.syringeMl).toBe(0.3)
  })

  it('renders interactive D3 stacking chart, handles short half-life without Infinity%, computes vial duration without diluent, and preserves state across tabs', async () => {
    const wrapper = mount(App)
    state.vialAmount = 15
    state.diluentMl = null

    const freqTab = wrapper.findAll('.tab-btn').find(b => b.text().includes('Frequência'))
    const calcTab = wrapper.findAll('.tab-btn').find(b => b.text().includes('Calculadora'))
    await freqTab.trigger('click')
    await nextTick()

    await wrapper.find('#med-select').setValue('Tirzepatida')
    await wrapper.find('#dose-a').setValue('5')
    await wrapper.findAll('.protocol-a .freq-btn').find(b => b.text() === '7d').trigger('click')
    await wrapper.find('#dose-b').setValue('2.5')
    await wrapper.findAll('.protocol-b .freq-btn').find(b => b.text() === '3.5d').trigger('click')
    await nextTick()

    expect(wrapper.find('.chart-legend').exists()).toBe(true)
    const chartSvg = wrapper.find('.chart-stage svg')
    expect(chartSvg.exists()).toBe(true)
    expect(chartSvg.findAll('path').length).toBeGreaterThanOrEqual(4)

    const overlayRect = chartSvg.find('rect[fill="transparent"]')
    expect(overlayRect.exists()).toBe(true)
    await overlayRect.trigger('mousemove', { clientX: 350 })
    await nextTick()
    const tooltip = wrapper.find('.chart-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Dia')
    expect(tooltip.text()).toContain('Protocolo A')
    expect(tooltip.text()).toContain('Protocolo B')
    expect(tooltip.text()).toContain('Diferença')

    expect(wrapper.find('.vial-simulation-panel').text()).toContain('15mg')
    expect(wrapper.find('.vial-simulation-panel').text()).toContain('Opcional para duração')
    expect(wrapper.find('.protocol-a-card .duration-value').text()).toBe('3 semanas')

    await wrapper.find('#med-select').setValue('CJC SEM DAC (Mod-GRF 1-29)')
    await nextTick()
    expect(wrapper.find('.washout-badge').text()).toBe('Sem acúmulo')
    expect(wrapper.text()).not.toContain('Infinity')
    expect(wrapper.text()).not.toContain('NaN')

    await wrapper.find('#med-select').setValue('Personalizado (Modo Livre)')
    await nextTick()
    await wrapper.find('#custom-hl-input').setValue('12')

    await calcTab.trigger('click')
    await nextTick()
    await freqTab.trigger('click')
    await nextTick()

    expect(wrapper.find('#dose-a').element.value).toBe('5')
    expect(wrapper.find('#dose-b').element.value).toBe('2.5')
    expect(wrapper.find('#custom-hl-input').element.value).toBe('12')
  })

  it('supports mg/mcg toggle and quick vial pills directly in Frequency tab', async () => {
    const wrapper = mount(App)
    state.vialAmount = null

    await wrapper.findAll('.tab-btn').find(b => b.text().includes('Frequência')).trigger('click')
    await nextTick()

    await wrapper.find('#med-select').setValue('Ipamorelin')
    await nextTick()

    expect(wrapper.find('.protocol-a').text()).toContain('Dose (mcg)')
    expect(wrapper.find('.protocol-a .unit-toggle-btn.active').text().trim()).toBe('mcg')

    await wrapper.find('#dose-a').setValue('250')
    expect(state.frequency.protocolA.dose).toBeCloseTo(0.25, 6)

    // Pick 10mg vial via quick vial pills directly on Frequency tab
    const vial10Btn = wrapper
      .findAll('.quick-vial-btn')
      .find(b => b.text().trim() === '10mg')
    expect(vial10Btn).toBeTruthy()
    await vial10Btn.trigger('click')
    await nextTick()

    expect(state.vialAmount).toBe(10)
    expect(wrapper.find('.protocol-a-card').text()).toContain('40 doses')
  })

  it('toggles between Dark and Light themes and persists preference', async () => {
    const wrapper = mount(App)
    expect(document.documentElement.dataset.theme).toBe('dark')

    await wrapper.find('.theme-toggle-btn').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('dose-calc-theme')).toBe('light')

    await wrapper.find('.theme-toggle-btn').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('dose-calc-theme')).toBe('dark')
  })
})

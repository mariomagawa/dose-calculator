<template>
  <section class="option-group card-panel" :class="{ 'is-complete': isCompleted }">
    <div class="header">
      <div class="title-wrap">
        <span class="step-badge" :class="{ 'is-done': isCompleted }" v-if="stepNumber">
          <CheckIcon v-if="isCompleted" :size="15" />
          <template v-else>{{ stepNumber }}</template>
        </span>
        <div class="title-text">
          <h3>{{ title }}</h3>
          <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="grid" :class="{ compact: isCompact }">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="opt-btn"
          :class="{
            selected: isSelected(opt.value),
            suggested: isSuggested(opt.value) && !isSelected(opt.value)
          }"
          @click="selectOption(opt.value)"
        >
          <span v-if="isSuggested(opt.value)" class="suggested-pill">Sugerido</span>

          <!-- Syringe style with ml + units -->
          <template v-if="opt.ml">
            <span class="primary-text mono-num">{{ opt.ml }}</span>
            <span v-if="opt.units" class="secondary-text mono-num">{{ opt.units }}</span>
          </template>

          <!-- Standard style with label + optional sublabel -->
          <template v-else>
            <span class="primary-text mono-num">{{ opt.label }}</span>
            <span v-if="opt.sublabel" class="secondary-sublabel mono-num">{{ opt.sublabel }}</span>
          </template>
        </button>

        <!-- Custom Input Button / Field inside grid -->
        <div v-if="allowCustom" class="custom-container" :class="{ 'is-active': isCustomActive }">
          <button
            v-if="!isCustomMode"
            type="button"
            class="opt-btn custom-trigger"
            @click="enableCustomMode"
          >
            Personalizado...
          </button>

          <div v-else class="custom-input-wrap">
            <div class="custom-input-box" :class="{ 'is-invalid': customInvalid }">
              <input
                type="text"
                inputmode="decimal"
                ref="customInputRef"
                v-model="customValue"
                :placeholder="activePlaceholder"
                aria-label="Valor personalizado"
                @input="handleCustomInput"
                @blur="handleCustomBlur"
              />

              <!-- Segmented mg / mcg toggle when applicable -->
              <div v-if="allowMcgToggle" class="custom-unit-toggle" role="group" aria-label="Unidade personalizada">
                <button
                  type="button"
                  class="unit-toggle-btn"
                  :class="{ active: customInputUnit === 'mg' }"
                  @mousedown.prevent
                  @click="setCustomInputUnit('mg')"
                >
                  mg
                </button>
                <button
                  type="button"
                  class="unit-toggle-btn"
                  :class="{ active: customInputUnit === 'mcg' }"
                  @mousedown.prevent
                  @click="setCustomInputUnit('mcg')"
                >
                  mcg
                </button>
              </div>
              <span v-else class="unit mono-num">{{ customUnit }}</span>

              <button
                type="button"
                class="custom-clear-btn"
                aria-label="Fechar campo personalizado"
                @mousedown.prevent
                @click="clearCustomMode"
              >
                <XIcon :size="14" />
              </button>
            </div>
            <span v-if="customInvalid" class="custom-error-hint">
              Informe um número positivo maior que zero.
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Check as CheckIcon, X as XIcon } from 'lucide-vue-next'
import { parsePositiveNumber, roundTo } from '../utils/calculations.js'

const props = defineProps({
  stepNumber: { type: Number, default: null },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  modelValue: { type: [Number, String], default: null },
  allowCustom: { type: Boolean, default: false },
  customPlaceholder: { type: String, default: '' },
  customUnit: { type: String, default: '' },
  isCompact: { type: Boolean, default: false },
  suggestedValue: { type: [Number, String], default: null },
  isCompleted: { type: Boolean, default: false },
  allowMcgToggle: { type: Boolean, default: false },
  defaultCustomUnit: { type: String, default: 'mg' },
  resetKey: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

const customValue = ref('')
const isCustomActive = ref(false)
const isCustomMode = ref(false)
const customInvalid = ref(false)
const customInputUnit = ref(props.defaultCustomUnit === 'mcg' ? 'mcg' : 'mg')
const customInputRef = ref(null)

const activePlaceholder = computed(() => {
  if (props.allowMcgToggle) {
    return customInputUnit.value === 'mcg' ? '250' : props.customPlaceholder || '2.5'
  }
  return props.customPlaceholder || ''
})

const matchesNumber = (a, b) => {
  const numA = parsePositiveNumber(a)
  const numB = parsePositiveNumber(b)
  if (numA === null || numB === null) return false
  return Math.abs(numA - numB) < 1e-9
}

const isSelected = (val) => {
  if (isCustomActive.value) return false
  return matchesNumber(props.modelValue, val)
}

const isSuggested = (val) => {
  return matchesNumber(props.suggestedValue, val)
}

const selectOption = (val) => {
  customValue.value = ''
  isCustomActive.value = false
  isCustomMode.value = false
  customInvalid.value = false
  emit('update:modelValue', val)
}

const enableCustomMode = async () => {
  isCustomMode.value = true
  customInvalid.value = false
  if (props.allowMcgToggle) {
    customInputUnit.value = props.defaultCustomUnit === 'mcg' ? 'mcg' : 'mg'
  }
  await nextTick()
  customInputRef.value?.focus()
}

const clearCustomMode = () => {
  customValue.value = ''
  isCustomActive.value = false
  isCustomMode.value = false
  customInvalid.value = false
  emit('update:modelValue', null)
}

const setCustomInputUnit = (nextUnit) => {
  if (!props.allowMcgToggle || customInputUnit.value === nextUnit) return
  const parsed = parsePositiveNumber(customValue.value)
  customInputUnit.value = nextUnit
  if (parsed !== null) {
    customValue.value =
      nextUnit === 'mcg'
        ? String(roundTo(parsed * 1000, 3))
        : String(roundTo(parsed / 1000, 6))
  }
  customInputRef.value?.focus()
}

const handleCustomInput = () => {
  const raw = customValue.value.trim()
  if (!raw) {
    customInvalid.value = false
    isCustomActive.value = false
    emit('update:modelValue', null)
    return
  }

  const parsed = parsePositiveNumber(raw)
  if (parsed === null) {
    customInvalid.value = true
    isCustomActive.value = true
    emit('update:modelValue', null)
    return
  }

  customInvalid.value = false
  isCustomActive.value = true
  const valueInBaseUnit =
    props.allowMcgToggle && customInputUnit.value === 'mcg'
      ? roundTo(parsed / 1000, 6)
      : parsed
  emit('update:modelValue', valueInBaseUnit)
}

const handleCustomBlur = () => {
  if (!customValue.value.trim()) {
    isCustomMode.value = false
    isCustomActive.value = false
    customInvalid.value = false
  }
}

const syncFromModelValue = () => {
  const isFocused =
    typeof document !== 'undefined' && document.activeElement === customInputRef.value
  const num = parsePositiveNumber(props.modelValue)

  if (num === null) {
    if (!isFocused) {
      customValue.value = ''
      isCustomActive.value = false
      isCustomMode.value = false
      customInvalid.value = false
      customInputUnit.value =
        props.allowMcgToggle && props.defaultCustomUnit === 'mcg' ? 'mcg' : 'mg'
    }
    return
  }

  const matchedOption = (props.options || []).some(opt => matchesNumber(num, opt.value))

  if (matchedOption) {
    if (!isFocused) {
      isCustomMode.value = false
      isCustomActive.value = false
      customValue.value = ''
      customInvalid.value = false
    }
    return
  }

  if (props.allowCustom) {
    isCustomMode.value = true
    isCustomActive.value = true
    customInvalid.value = false

    if (!isFocused) {
      if (props.allowMcgToggle) {
        const shouldUseMcg =
          customInputUnit.value === 'mcg' ||
          (props.defaultCustomUnit === 'mcg' && num < 1) ||
          num < 0.1
        customInputUnit.value = shouldUseMcg ? 'mcg' : 'mg'
        customValue.value = shouldUseMcg
          ? String(roundTo(num * 1000, 3))
          : String(roundTo(num, 4))
      } else {
        customInputUnit.value = 'mg'
        customValue.value = String(roundTo(num, 4))
      }
    }
  }
}

onMounted(syncFromModelValue)

watch(
  [() => props.modelValue, () => props.options, () => props.allowMcgToggle],
  () => {
    if (!props.allowMcgToggle) {
      customInputUnit.value = 'mg'
    }
    syncFromModelValue()
  }
)

watch(
  () => props.defaultCustomUnit,
  (nextDefault) => {
    if (!isCustomActive.value && props.allowMcgToggle) {
      customInputUnit.value = nextDefault === 'mcg' ? 'mcg' : 'mg'
    }
  }
)

watch(
  () => props.resetKey,
  () => {
    customValue.value = ''
    isCustomActive.value = false
    isCustomMode.value = false
    customInvalid.value = false
    customInputUnit.value =
      props.allowMcgToggle && props.defaultCustomUnit === 'mcg' ? 'mcg' : 'mg'
  }
)
</script>

<style scoped>
.option-group {
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
  position: relative;
}

.option-group.is-complete {
  border-color: color-mix(in srgb, var(--emerald) 30%, var(--border-subtle));
}

.header {
  display: flex;
  flex-direction: column;
}

.title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.header h3 {
  font-size: 1.08rem;
  line-height: 1.25;
}

.subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 0.6rem;
}

.grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
}

.opt-btn {
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.72rem 0.45rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.16s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.16rem;
  position: relative;
  min-height: 52px;
}

.opt-btn:hover {
  background: var(--surface-3);
  color: var(--text-primary);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.opt-btn.suggested {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border-subtle));
  background: color-mix(in srgb, var(--accent-soft) 55%, var(--surface-2));
  color: var(--text-primary);
}

.opt-btn.selected {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
  box-shadow: 0 4px 12px var(--accent-glow);
}

.suggested-pill {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent-strong);
  line-height: 1;
  margin-bottom: 1px;
}

.opt-btn.selected .suggested-pill {
  color: rgba(255, 255, 255, 0.92);
}

.opt-btn .primary-text {
  font-weight: 600;
  line-height: 1.2;
}

.opt-btn .secondary-text {
  font-size: 0.7rem;
  opacity: 0.85;
}

.opt-btn .secondary-sublabel {
  font-size: 0.68rem;
  opacity: 0.8;
  background: var(--surface-1);
  padding: 1px 5px;
  border-radius: 4px;
  margin-top: 2px;
}

.opt-btn.selected .secondary-sublabel {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  opacity: 1;
}

/* Custom Input Section */
.custom-container {
  grid-column: 1 / -1;
  margin-top: 0.25rem;
}

.custom-trigger {
  width: 100%;
  min-height: 44px;
  border-style: dashed;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
}

.custom-trigger:hover {
  border-style: solid;
  color: var(--text-primary);
}

.custom-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.custom-input-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-2);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  padding: 0.35rem 0.65rem 0.35rem 0.9rem;
  box-shadow: 0 0 0 3px var(--accent-soft);
  min-height: 46px;
}

.custom-input-box.is-invalid {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-soft);
}

.custom-input-box input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 1rem;
  width: 100%;
  outline: none;
  font-weight: 600;
}

.custom-input-box input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.custom-input-box .unit {
  color: var(--accent-strong);
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.custom-unit-toggle {
  display: inline-flex;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}

.unit-toggle-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all 0.15s ease;
}

.unit-toggle-btn.active {
  background: var(--accent);
  color: #ffffff;
}

.custom-clear-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-clear-btn:hover {
  color: var(--text-primary);
  background: var(--surface-3);
}

.custom-error-hint {
  font-size: 0.76rem;
  color: var(--danger);
  font-weight: 500;
}

@media (max-width: 640px) {
  .option-group {
    padding: 1.1rem;
  }
}
</style>

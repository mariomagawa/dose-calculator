<template>
  <div class="option-group glass-panel">
    <div class="header">
      <h3>{{ title }}</h3>
      <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
    </div>
    <div class="body">
      <div class="grid" :class="{ compact: isCompact }">
        <button
          v-for="opt in options"
          :key="opt.value"
          class="opt-btn"
          :class="{ selected: modelValue === opt.value && !isCustomActive }"
          @click="selectOption(opt.value)"
        >
          <span v-if="opt.ml" class="primary-text">{{ opt.ml }}</span>
          <span v-if="opt.units" class="secondary-text">{{ opt.units }}</span>
          <span v-if="!opt.ml && !opt.units">{{ opt.label }}</span>
        </button>
      </div>
      <div v-if="allowCustom" class="custom-input-wrapper">
        <label :for="'custom-' + title">Personalizado:</label>
        <div class="input-box" :class="{ active: isCustomActive }">
          <input
            :id="'custom-' + title"
            type="number"
            v-model="customValue"
            :placeholder="customPlaceholder"
            min="0"
            step="any"
            @input="handleCustomInput"
          />
          <span class="unit">{{ customUnit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  title: String,
  subtitle: String,
  options: Array, // { label: string, value: number, ml?: string, units?: string }
  modelValue: Number,
  allowCustom: { type: Boolean, default: false },
  customPlaceholder: String,
  customUnit: String,
  isCompact: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const customValue = ref(null);
const isCustomActive = ref(false);

const selectOption = (val) => {
  customValue.value = '';
  isCustomActive.value = false;
  emit('update:modelValue', val);
};

const handleCustomInput = () => {
  const val = parseFloat(customValue.value);
  if (!isNaN(val) && val > 0) {
    isCustomActive.value = true;
    emit('update:modelValue', val);
  } else {
    isCustomActive.value = false;
    emit('update:modelValue', null);
  }
};

// Reset custom input if modelValue is cleared externally
watch(() => props.modelValue, (newVal) => {
  if (newVal === null) {
    customValue.value = '';
    isCustomActive.value = false;
  }
});
</script>

<style scoped>
.option-group {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header h3 {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
}

.grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
}

.opt-btn {
  background: var(--surface-color);
  border: 1px solid var(--surface-border);
  color: var(--text-primary);
  padding: 0.75rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.opt-btn:hover {
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.opt-btn.selected {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

.opt-btn .primary-text {
  font-weight: 600;
}
.opt-btn .secondary-text {
  font-size: 0.75rem;
  opacity: 0.8;
}

.custom-input-wrapper {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.custom-input-wrapper label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.input-box {
  display: flex;
  align-items: center;
  background: var(--surface-color);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 0 1rem;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 150px;
}

.input-box:focus-within, .input-box.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.input-box.active {
  background: rgba(59, 130, 246, 0.1);
}

.input-box input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 0.75rem 0;
  font-size: 1rem;
  width: 100%;
  outline: none;
}

.input-box input::placeholder {
  color: var(--text-muted);
}

.input-box .unit {
  color: var(--text-secondary);
  font-weight: 500;
  margin-left: 0.5rem;
}
</style>

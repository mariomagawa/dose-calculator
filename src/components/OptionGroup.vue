<template>
  <div class="option-group glass-panel">
    <div class="header">
      <div class="title-wrap">
        <span class="step-badge" v-if="stepNumber">{{ stepNumber }}</span>
        <h3>{{ title }}</h3>
      </div>
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
          <span v-if="!opt.ml && !opt.units" class="primary-text">{{ opt.label }}</span>
        </button>

        <!-- Custom Input Button/Field inside grid -->
        <div v-if="allowCustom" class="custom-container" :class="{ 'is-active': isCustomActive }">
          <button 
            v-if="!isCustomMode" 
            class="opt-btn custom-trigger"
            @click="enableCustomMode"
          >
            Personalizado...
          </button>
          
          <div v-else class="custom-input-box">
            <input
              type="number"
              ref="customInputRef"
              v-model="customValue"
              :placeholder="customPlaceholder"
              min="0"
              step="any"
              @input="handleCustomInput"
              @blur="handleCustomBlur"
            />
            <span class="unit">{{ customUnit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  stepNumber: Number,
  title: String,
  subtitle: String,
  options: Array,
  modelValue: Number,
  allowCustom: { type: Boolean, default: false },
  customPlaceholder: String,
  customUnit: String,
  isCompact: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const customValue = ref('');
const isCustomActive = ref(false);
const isCustomMode = ref(false);
const customInputRef = ref(null);

const selectOption = (val) => {
  customValue.value = '';
  isCustomActive.value = false;
  isCustomMode.value = false;
  emit('update:modelValue', val);
};

const enableCustomMode = async () => {
  isCustomMode.value = true;
  await nextTick();
  if (customInputRef.value) customInputRef.value.focus();
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

const handleCustomBlur = () => {
  if (!customValue.value) {
    isCustomMode.value = false;
    isCustomActive.value = false;
  }
};

watch(() => props.modelValue, (newVal) => {
  if (newVal === null) {
    customValue.value = '';
    isCustomActive.value = false;
    isCustomMode.value = false;
  }
});
</script>

<style scoped>
.option-group {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
  overflow: hidden;
}

/* Subtle glow at the top edge of cards */
.option-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-badge {
  background: var(--surface-hover);
  color: var(--text-primary);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  border: 1px solid var(--surface-border);
}

.header h3 {
  font-size: 1.15rem;
  color: var(--text-primary);
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-left: calc(28px + 0.75rem); /* alignment with title */
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
  gap: 0.75rem;
}

.grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
}

.opt-btn {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid var(--surface-border);
  color: var(--text-secondary);
  padding: 0.85rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  position: relative;
  overflow: hidden;
}

.opt-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.opt-btn.selected {
  background: var(--primary);
  border-color: var(--primary-hover);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--primary-glow);
}

.opt-btn .primary-text {
  font-weight: 600;
  z-index: 1;
}

.opt-btn .secondary-text {
  font-size: 0.7rem;
  opacity: 0.8;
  z-index: 1;
}

/* Custom Input Section */
.custom-container {
  grid-column: 1 / -1; /* Make it span full width if needed, or just let it flow */
  margin-top: 0.5rem;
}

.custom-trigger {
  width: 100%;
  border-style: dashed;
  background: transparent;
  color: var(--text-muted);
}

.custom-trigger:hover {
  border-style: solid;
}

.custom-input-box {
  display: flex;
  align-items: center;
  background: var(--bg-color);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  padding: 0 1rem;
  box-shadow: 0 0 0 3px var(--surface-active);
  transition: all 0.2s;
  height: 100%;
  min-height: 48px;
}

.custom-input-box input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1.05rem;
  width: 100%;
  outline: none;
  font-weight: 600;
}

.custom-input-box input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.custom-input-box .unit {
  color: var(--primary-hover);
  font-weight: 600;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .subtitle {
    margin-left: 0;
    margin-top: 0.25rem;
  }
}
</style>

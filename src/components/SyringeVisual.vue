<template>
  <div class="syringe-visual">
    <div class="syringe-wrapper">
      <div class="syringe-needle"></div>
      <div class="syringe-tip"></div>
      <div class="syringe-body glass-panel">
        <div class="syringe-barrel-inner">
          <div class="syringe-scale">
            <div 
              class="syringe-liquid" 
              :class="{ warning: isOverCapacity }"
              :style="{ width: liquidWidth + '%' }"
            >
              <div class="syringe-particles"></div>
            </div>
            <div 
              class="syringe-plunger" 
              :style="{ left: plungerLeft + '%' }"
            >
              <div class="plunger-seal"></div>
              <div class="plunger-rod"></div>
              <div class="plunger-thumb"></div>
            </div>
            <div class="syringe-marks">
              <div v-for="tick in minorTicks" :key="'tick-'+tick" class="minor-tick" :style="{ left: getMarkPosition(tick) + '%' }"></div>
              <div v-for="mark in marks" :key="mark" class="mark-group" :style="{ left: getMarkPosition(mark) + '%' }">
                <span>{{ mark }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="syringe-flange"></div>
    </div>
    
    <transition name="fade">
      <div v-if="isOverCapacity" class="syringe-warning">
        <AlertTriangleIcon class="icon" :size="18" />
        Atenção: A dose excede a capacidade da seringa selecionada!
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AlertTriangle as AlertTriangleIcon } from 'lucide-vue-next';

const props = defineProps({
  syringeMl: { type: Number, default: 1 },
  drawVolume: { type: Number, default: 0 }
});

const isOverCapacity = computed(() => {
  return props.drawVolume > props.syringeMl && props.syringeMl > 0;
});

const fillPercentage = computed(() => {
  if (!props.syringeMl) return 0;
  let pct = (props.drawVolume / props.syringeMl) * 100;
  return pct > 100 ? 100 : pct;
});

const liquidWidth = computed(() => fillPercentage.value);
const plungerLeft = computed(() => fillPercentage.value);

const marks = computed(() => {
  let arr = [];
  if (props.syringeMl === 0.3) {
    for (let i = 5; i <= 30; i += 5) arr.push(i);
  } else if (props.syringeMl === 0.5) {
    for (let i = 10; i <= 50; i += 10) arr.push(i);
  } else {
    for (let i = 10; i <= 100; i += 10) arr.push(i);
  }
  return arr;
});

const minorTicks = computed(() => {
  let arr = [];
  if (!props.syringeMl) return arr;
  const maxUnits = Math.round(props.syringeMl * 100);
  let step = maxUnits === 100 ? 2 : 1;
  for (let i = step; i <= maxUnits; i += step) {
    if (props.syringeMl === 0.3 && i % 5 === 0) continue;
    if ((props.syringeMl === 0.5 || props.syringeMl === 1) && i % 10 === 0) continue;
    arr.push(i);
  }
  return arr;
});

const getMarkPosition = (mark) => {
  const maxUnits = props.syringeMl * 100;
  return (mark / maxUnits) * 100;
};
</script>

<style scoped>
.syringe-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding: 1rem 0;
}

.syringe-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  position: relative;
  height: 80px;
}

.syringe-needle {
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #94a3b8);
  border-radius: 2px 0 0 2px;
}

.syringe-tip {
  width: 15px;
  height: 12px;
  background: var(--surface-border);
  border-radius: 2px 0 0 2px;
  z-index: 2;
}

.syringe-body {
  flex: 1;
  height: 100%;
  border-radius: 4px;
  position: relative;
  border: 2px solid var(--surface-border);
  overflow: visible; /* To allow plunger thumb to stick out */
  background: rgba(30, 41, 59, 0.4);
}

.syringe-barrel-inner {
  position: relative;
  width: 100%;
  height: 100%;
  padding-right: 20px; /* space for plunger seal when 100% */
}

.syringe-scale {
  position: relative;
  width: 100%;
  height: 100%;
}

.syringe-liquid {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(14, 165, 233, 0.4) 0%, 
    rgba(96, 165, 250, 0.8) 25%, 
    rgba(59, 130, 246, 0.5) 50%, 
    rgba(96, 165, 250, 0.8) 75%, 
    rgba(14, 165, 233, 0.4) 100%
  );
  background-size: 200% 100%;
  animation: liquidFlow 2s infinite linear;
  transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1), background 0.3s;
  box-shadow: inset 0 -4px 10px rgba(0,0,0,0.15), inset 0 6px 12px rgba(255,255,255,0.3); /* Stronger glass reflection */
  border-radius: 0 2px 2px 0;
}

.syringe-liquid.warning {
  background: linear-gradient(90deg, 
    rgba(244, 63, 94, 0.4) 0%, 
    rgba(251, 113, 133, 0.8) 25%, 
    rgba(225, 29, 72, 0.5) 50%, 
    rgba(251, 113, 133, 0.8) 75%, 
    rgba(244, 63, 94, 0.4) 100%
  );
  background-size: 200% 100%;
}

@keyframes liquidFlow {
  0% { background-position: 200% 0; }
  100% { background-position: 0% 0; }
}

.syringe-particles {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  background-image: 
    radial-gradient(circle at 15% 30%, rgba(255, 255, 255, 0.8) 1.5px, transparent 2.5px),
    radial-gradient(circle at 45% 60%, rgba(224, 242, 254, 0.9) 2px, transparent 3px),
    radial-gradient(circle at 75% 40%, rgba(255, 255, 255, 0.6) 1px, transparent 2px),
    radial-gradient(circle at 30% 80%, rgba(186, 230, 253, 0.7) 1.5px, transparent 2.5px),
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.8) 1.2px, transparent 2.2px);
  background-size: 80px 100%;
  animation: floatParticles 3s infinite linear;
  opacity: 0.5;
}

.syringe-particles::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: 
    radial-gradient(circle at 25% 70%, rgba(255, 255, 255, 0.5) 1px, transparent 2px),
    radial-gradient(circle at 65% 25%, rgba(224, 242, 254, 0.6) 1.5px, transparent 2.5px),
    radial-gradient(circle at 95% 65%, rgba(255, 255, 255, 0.4) 1px, transparent 2px);
  background-size: 60px 100%;
  animation: floatParticles 5s infinite linear;
}

@keyframes floatParticles {
  0% { background-position: 0 0; }
  100% { background-position: 80px 0; }
}

.syringe-plunger {
  position: absolute;
  top: 0;
  height: 100%;
  width: calc(100% + 40px); /* Extends beyond barrel */
  transition: left 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  align-items: center;
  z-index: 3;
}

.plunger-seal {
  width: 12px;
  height: 100%;
  background: #1e293b;
  border: 2px solid #000;
  border-radius: 4px;
  box-shadow: -2px 0 5px rgba(0,0,0,0.3);
}

.plunger-rod {
  flex: 1;
  height: 16px;
  background: linear-gradient(0deg, #334155, #64748b, #334155);
  border-top: 1px solid #94a3b8;
  border-bottom: 1px solid #0f172a;
}

.plunger-thumb {
  width: 20px;
  height: 40px;
  background: #334155;
  border-radius: 4px;
  border: 1px solid #64748b;
  box-shadow: -2px 0 5px rgba(0,0,0,0.3);
}

.syringe-flange {
  width: 12px;
  height: 120px;
  background: var(--surface-border);
  border-radius: 4px;
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.syringe-marks {
  position: absolute;
  bottom: -25px;
  left: 0;
  width: 100%;
}

.mark-group {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}

.mark-group::before {
  content: '';
  position: absolute;
  top: -65px;
  width: 2px;
  height: 15px;
  background-color: rgba(255, 255, 255, 0.7);
}

.minor-tick {
  position: absolute;
  top: -60px;
  width: 1px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.4);
  transform: translateX(-50%);
}

.mark-group span {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.syringe-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 600px) {
  .syringe-wrapper {
    height: 60px;
  }
  .plunger-thumb {
    height: 30px;
  }
  .syringe-flange {
    height: 90px;
  }
  .mark-group::before {
    top: -45px;
    height: 10px;
  }
  .minor-tick {
    top: -42px;
    height: 7px;
  }
}
</style>

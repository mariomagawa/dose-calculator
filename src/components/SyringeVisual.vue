<template>
  <div class="syringe-visual">
    <svg
      class="syringe-svg"
      viewBox="0 0 680 164"
      role="img"
      :aria-label="`Seringa de ${syringeMl}mL preenchida até ${badgeLabel}`"
    >
      <defs>
        <linearGradient :id="`liquid-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="liquidColors.top" stop-opacity="0.92" />
          <stop offset="55%" :stop-color="liquidColors.mid" stop-opacity="0.78" />
          <stop offset="100%" :stop-color="liquidColors.bottom" stop-opacity="0.95" />
        </linearGradient>

        <linearGradient :id="`glass-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
          <stop offset="40%" stop-color="#ffffff" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>

        <clipPath :id="`barrel-clip-${uid}`">
          <rect x="75" y="59" width="354" height="50" rx="3" />
        </clipPath>
      </defs>

      <!-- Floating Readout Badge pointing directly to sealX -->
      <g
        class="readout-badge-group"
        :style="{ transform: `translateX(${badgeX}px)` }"
      >
        <rect
          x="-48"
          y="8"
          width="96"
          height="28"
          rx="14"
          :fill="liquidColors.badgeBg"
          :stroke="liquidColors.badgeBorder"
          stroke-width="1.25"
        />
        <text
          x="0"
          y="26"
          text-anchor="middle"
          :fill="liquidColors.badgeText"
          class="badge-text"
        >
          {{ badgeLabel }}
        </text>
      </g>

      <!-- Pointer triangle tracking exact sealX -->
      <g
        class="pointer-group"
        :style="{ transform: `translateX(${sealX}px)` }"
      >
        <polygon points="-5,40 5,40 0,48" :fill="liquidColors.badgeBorder" />
        <line
          x1="0"
          y1="48"
          x2="0"
          y2="58"
          :stroke="liquidColors.badgeBorder"
          stroke-width="1.25"
          stroke-dasharray="2,2"
        />
      </g>

      <!-- Needle with bevel -->
      <polygon
        points="10,84 22,82.5 56,82.5 56,85.5 22,85.5"
        fill="var(--syringe-needle)"
      />

      <!-- Hub / Luer Collar -->
      <path
        d="M56,77 L66,75 L66,72 L74,72 L74,96 L66,96 L66,93 L56,91 Z"
        fill="var(--syringe-hub)"
        stroke="var(--syringe-barrel-stroke)"
        stroke-width="1.2"
      />

      <!-- Barrel Outer Shell -->
      <rect
        x="74"
        y="58"
        width="356"
        height="52"
        rx="4"
        fill="var(--syringe-barrel-bg)"
        stroke="var(--syringe-barrel-stroke)"
        stroke-width="1.5"
      />

      <!-- Clipped Interior: Liquid + Glass Highlight + Plunger Seal -->
      <g :clip-path="`url(#barrel-clip-${uid})`">
        <!-- Zero baseline guide inside barrel -->
        <line
          x1="88"
          y1="60"
          x2="88"
          y2="108"
          stroke="var(--syringe-tick-minor)"
          stroke-width="1"
        />

        <!-- Animated Liquid Fill from x=88 to sealX -->
        <rect
          class="liquid-fill"
          x="88"
          y="60"
          height="48"
          :width="liquidWidthPx"
          :fill="`url(#liquid-${uid})`"
        />

        <!-- Specular Glass Reflection -->
        <rect
          x="76"
          y="60"
          width="352"
          height="16"
          :fill="`url(#glass-${uid})`"
        />

        <!-- Plunger Double Rubber Seal inside barrel -->
        <g
          class="plunger-seal-group"
          :style="{ transform: `translateX(${sealX}px)` }"
        >
          <rect
            x="0"
            y="60"
            width="14"
            height="48"
            rx="2"
            fill="var(--syringe-seal)"
            stroke="var(--syringe-seal-stroke)"
            stroke-width="1.2"
          />
          <line x1="5" y1="62" x2="5" y2="106" stroke="var(--syringe-seal-stroke)" stroke-width="1" opacity="0.65" />
          <line x1="9.5" y1="62" x2="9.5" y2="106" stroke="var(--syringe-seal-stroke)" stroke-width="1" opacity="0.65" />
        </g>
      </g>

      <!-- Plunger Rod & Thumb Rest (rod rendered before flange for realistic layering) -->
      <rect
        class="plunger-rod"
        :x="rodStartX"
        y="77"
        :width="rodWidth"
        height="14"
        rx="2"
        fill="var(--syringe-plunger-rod)"
      />
      <line
        class="plunger-rod-rib"
        :x1="rodStartX"
        y1="84"
        :x2="thumbX"
        y2="84"
        stroke="var(--syringe-barrel-stroke)"
        stroke-width="1"
        opacity="0.6"
      />

      <!-- Barrel Flange (Finger Grip) -->
      <rect
        x="430"
        y="40"
        width="13"
        height="88"
        rx="4"
        fill="var(--syringe-hub)"
        stroke="var(--syringe-barrel-stroke)"
        stroke-width="1.4"
      />

      <g
        class="plunger-thumb-group"
        :style="{ transform: `translateX(${thumbX}px)` }"
      >
        <rect
          x="0"
          y="62"
          width="16"
          height="44"
          rx="4"
          fill="var(--syringe-plunger-thumb)"
          stroke="var(--syringe-barrel-stroke)"
          stroke-width="1.4"
        />
      </g>

      <!-- Graduations (Ticks & Numeric Labels including 0) -->
      <g class="graduations">
        <!-- Minor ticks -->
        <line
          v-for="tick in minorTicks"
          :key="`min-${tick}`"
          :x1="getUnitX(tick)"
          :x2="getUnitX(tick)"
          y1="100"
          y2="110"
          stroke="var(--syringe-tick-minor)"
          stroke-width="1"
        />
        <!-- Medium ticks (5U intervals on 0.5 / 1mL) -->
        <line
          v-for="tick in mediumTicks"
          :key="`med-${tick}`"
          :x1="getUnitX(tick)"
          :x2="getUnitX(tick)"
          y1="95"
          y2="110"
          stroke="var(--syringe-tick-major)"
          stroke-width="1.2"
          opacity="0.75"
        />
        <!-- Major ticks + numeric labels -->
        <g v-for="mark in majorMarks" :key="`maj-${mark}`">
          <line
            :x1="getUnitX(mark)"
            :x2="getUnitX(mark)"
            y1="89"
            y2="110"
            stroke="var(--syringe-tick-major)"
            stroke-width="1.6"
          />
          <text
            :x="getUnitX(mark)"
            y="128"
            text-anchor="middle"
            fill="var(--syringe-text)"
            class="scale-label"
          >
            {{ mark }}
          </text>
        </g>

        <text
          x="248"
          y="150"
          text-anchor="middle"
          fill="var(--text-muted)"
          class="scale-caption"
        >
          Escala U-100 (Unidades)
        </text>
      </g>
    </svg>

    <div class="syringe-meta-bar mono-num">
      <span>Seringa {{ syringeMl }}mL ({{ maxUnits }} U)</span>
      <span>1 traço = {{ minorTickStepUnits }} {{ minorTickStepUnits === 1 ? 'Unidade' : 'Unidades' }}</span>
      <span>Preenchimento: {{ Math.round(fillPct) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatMetric } from '../utils/calculations.js'

const props = defineProps({
  syringeMl: { type: Number, default: 1 },
  drawVolume: { type: Number, default: 0 },
  drawUnits: { type: Number, default: 0 },
  status: { type: String, default: 'normal' } // 'normal' | 'warning' | 'danger'
})

// Unique gradient/clip IDs per component instance
const uid = Math.random().toString(36).slice(2, 8)

const SCALE_X0 = 88
const SCALE_WIDTH = 320

const maxUnits = computed(() => Math.round((props.syringeMl || 1) * 100))
const minorTickStepUnits = computed(() => (maxUnits.value === 100 ? 2 : 1))

const isOverCapacity = computed(() => {
  return props.syringeMl > 0 && props.drawVolume > props.syringeMl + 1e-9
})

const fillPct = computed(() => {
  if (!props.syringeMl || props.syringeMl <= 0) return 0
  const pct = (props.drawVolume / props.syringeMl) * 100
  return Math.max(0, Math.min(100, pct))
})

const sealX = computed(() => SCALE_X0 + (fillPct.value / 100) * SCALE_WIDTH)
const liquidWidthPx = computed(() => Math.max(0, sealX.value - SCALE_X0))
const rodStartX = computed(() => sealX.value + 14)
const thumbX = computed(() => 466 + (fillPct.value / 100) * 178)
const rodWidth = computed(() => Math.max(0, thumbX.value - rodStartX.value))
const badgeX = computed(() => Math.max(108, Math.min(396, sealX.value)))

const badgeLabel = computed(() => {
  const unitsVal = props.drawUnits || props.drawVolume * 100
  if (isOverCapacity.value) {
    return `> ${maxUnits.value} U`
  }
  return `${formatMetric(unitsVal, 1)} U`
})

const liquidColors = computed(() => {
  if (props.status === 'danger' || isOverCapacity.value) {
    return {
      top: '#fb7185',
      mid: '#f43f5e',
      bottom: '#be123c',
      badgeBg: 'var(--danger-soft)',
      badgeBorder: 'var(--danger)',
      badgeText: 'var(--danger)'
    }
  }
  if (props.status === 'warning') {
    return {
      top: '#fbbf24',
      mid: '#f59e0b',
      bottom: '#b45309',
      badgeBg: 'var(--amber-soft)',
      badgeBorder: 'var(--amber)',
      badgeText: 'var(--amber)'
    }
  }
  return {
    top: '#38bdf8',
    mid: '#0ea5e9',
    bottom: '#0369a1',
    badgeBg: 'var(--accent-soft)',
    badgeBorder: 'var(--accent)',
    badgeText: 'var(--accent-strong)'
  }
})

const majorMarks = computed(() => {
  const max = maxUnits.value
  const step = max === 30 ? 5 : 10
  const arr = []
  for (let i = 0; i <= max; i += step) {
    arr.push(i)
  }
  return arr
})

const mediumTicks = computed(() => {
  const max = maxUnits.value
  if (max === 30) return []
  const arr = []
  for (let i = 5; i < max; i += 10) {
    arr.push(i)
  }
  return arr
})

const minorTicks = computed(() => {
  const max = maxUnits.value
  const step = max === 100 ? 2 : 1
  const arr = []
  for (let i = step; i < max; i += step) {
    if (max === 30 && i % 5 === 0) continue
    if (max !== 30 && i % 5 === 0) continue
    arr.push(i)
  }
  return arr
})

const getUnitX = (unitVal) => {
  return SCALE_X0 + (unitVal / maxUnits.value) * SCALE_WIDTH
}
</script>

<style scoped>
.syringe-visual {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem 0.75rem 0.75rem;
}

.syringe-svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.liquid-fill {
  transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.plunger-seal-group,
.plunger-thumb-group,
.readout-badge-group,
.pointer-group {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.plunger-rod,
.plunger-rod-rib {
  transition: x 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.badge-text {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
}

.scale-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
}

.scale-caption {
  font-family: var(--font-sans);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.syringe-meta-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.35rem 0.75rem;
  padding: 0.45rem 0.35rem 0;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>

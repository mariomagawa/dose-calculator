<template>
  <div class="chart-wrapper" ref="wrapperRef">
    <!-- Header & HTML Legend outside SVG -->
    <div class="chart-top-bar">
      <div class="chart-title-block">
        <h4>Curva de Empilhamento Farmacocinético</h4>
        <span class="chart-med-subtitle">{{ medication }} · Carga ativa estimada ({{ unit }})</span>
      </div>

      <div class="chart-legend">
        <div v-if="protocolA" class="legend-item">
          <span class="legend-swatch swatch-a"></span>
          <span class="legend-label">{{ protocolA.label }}</span>
          <span class="legend-meta mono-num">
            {{ protocolA.dose }}{{ unit }} / {{ protocolA.interval }}d
          </span>
        </div>
        <div v-if="protocolB" class="legend-item">
          <span class="legend-swatch swatch-b"></span>
          <span class="legend-label">{{ protocolB.label }}</span>
          <span class="legend-meta mono-num">
            {{ protocolB.dose }}{{ unit }} / {{ protocolB.interval }}d
          </span>
        </div>
      </div>
    </div>

    <!-- Scrollable SVG Stage + Floating Interactive Tooltip -->
    <div class="chart-scroll-container">
      <div class="chart-stage" ref="stageRef">
        <svg ref="svgRef"></svg>

        <div
          v-if="tooltip.visible"
          class="chart-tooltip"
          :class="{ 'align-left': tooltip.alignLeft }"
          :style="{ left: `${tooltip.xPx}px`, top: `${tooltip.yPx}px` }"
        >
          <div class="tooltip-day mono-num">Dia {{ tooltip.dayLabel }}</div>
          <div v-if="tooltip.loadA !== null" class="tooltip-row">
            <span class="tooltip-dot dot-a"></span>
            <span class="tooltip-name">{{ protocolA?.label }}</span>
            <strong class="mono-num">{{ formatMetric(tooltip.loadA, 2) }}{{ unit }}</strong>
          </div>
          <div v-if="tooltip.loadB !== null" class="tooltip-row">
            <span class="tooltip-dot dot-b"></span>
            <span class="tooltip-name">{{ protocolB?.label }}</span>
            <strong class="mono-num">{{ formatMetric(tooltip.loadB, 2) }}{{ unit }}</strong>
          </div>
          <div v-if="tooltip.diff !== null" class="tooltip-diff mono-num">
            <span>Diferença (B − A)</span>
            <strong>{{ formatSignedDiff(tooltip.diff) }}{{ unit }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { formatMetric, roundTo } from '../utils/calculations.js'

const uid = Math.random().toString(36).slice(2, 8)

const props = defineProps({
  protocolA: { type: Object, default: null },
  protocolB: { type: Object, default: null },
  medication: { type: String, default: 'Tirzepatida' },
  unit: { type: String, default: 'mg' },
  theme: { type: String, default: 'dark' }
})

const svgRef = ref(null)
const wrapperRef = ref(null)
const stageRef = ref(null)

const margin = { top: 20, right: 156, bottom: 48, left: 62 }
const CHART_HEIGHT = 340
const MIN_WIDTH = 640

let resizeObserver = null

const tooltip = reactive({
  visible: false,
  xPx: 0,
  yPx: 16,
  alignLeft: false,
  dayLabel: '0',
  loadA: null,
  loadB: null,
  diff: null
})

function getPalette() {
  if (props.theme === 'light') {
    return {
      axisText: '#475569',
      axisLine: 'rgba(15, 23, 42, 0.18)',
      gridLine: 'rgba(15, 23, 42, 0.08)',
      crosshair: 'rgba(15, 23, 42, 0.35)',
      colorA: '#d97706',
      colorB: '#0284c7',
      dotStroke: '#ffffff'
    }
  }
  return {
    axisText: '#94a3b8',
    axisLine: 'rgba(148, 163, 184, 0.22)',
    gridLine: 'rgba(148, 163, 184, 0.08)',
    crosshair: 'rgba(226, 232, 240, 0.45)',
    colorA: '#f59e0b',
    colorB: '#38bdf8',
    dotStroke: '#0f1624'
  }
}

function getChartWidth() {
  if (!wrapperRef.value) return MIN_WIDTH
  return Math.max(wrapperRef.value.clientWidth, MIN_WIDTH)
}

function chooseXStep(maxTime, plotWidth) {
  let step = 7
  if (maxTime <= 10) step = 1
  else if (maxTime <= 20) step = 2
  else if (maxTime <= 42) step = 3.5
  else if (maxTime <= 65) step = 7
  else step = 14

  if (plotWidth < 460 && step === 3.5) step = 7
  if (plotWidth < 420 && step === 1) step = 2
  return step
}

function formatSignedDiff(diff) {
  if (typeof diff !== 'number' || !Number.isFinite(diff)) return '0'
  if (Math.abs(diff) < 0.01) return '0'
  const sign = diff > 0 ? '+' : '−'
  return `${sign}${roundTo(Math.abs(diff), 2)}`
}

function truncateLabel(text, maxLen = 23) {
  if (!text) return ''
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text
}

function findClosestPoint(points, targetTime) {
  if (!points || points.length === 0) return null
  const bisect = d3.bisector(d => d.time).left
  const idx = bisect(points, targetTime)
  if (idx <= 0) return points[0]
  if (idx >= points.length) return points[points.length - 1]
  const prev = points[idx - 1]
  const curr = points[idx]
  return Math.abs(targetTime - prev.time) <= Math.abs(curr.time - targetTime) ? prev : curr
}

function layoutAnnotations(annotations, yScale, height) {
  if (annotations.length === 0) return []
  const minGap = 18
  const topBound = 10
  const bottomBound = height - 6

  const sorted = annotations
    .map(item => ({
      ...item,
      rawY: yScale(item.value),
      labelY: Math.max(topBound, Math.min(bottomBound, yScale(item.value) + 3))
    }))
    .sort((a, b) => a.labelY - b.labelY)

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].labelY - sorted[i - 1].labelY < minGap) {
      sorted[i].labelY = sorted[i - 1].labelY + minGap
    }
  }

  if (sorted[sorted.length - 1].labelY > bottomBound) {
    sorted[sorted.length - 1].labelY = bottomBound
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i + 1].labelY - sorted[i].labelY < minGap) {
        sorted[i].labelY = Math.max(topBound, sorted[i + 1].labelY - minGap)
      }
    }
  }

  return sorted
}

function drawChart() {
  tooltip.visible = false
  if (!svgRef.value || (!props.protocolA && !props.protocolB)) return

  const palette = getPalette()
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const chartWidth = getChartWidth()
  const width = chartWidth - margin.left - margin.right
  const height = CHART_HEIGHT - margin.top - margin.bottom

  svg
    .attr('width', chartWidth)
    .attr('height', CHART_HEIGHT)

  const defs = svg.append('defs')

  const gradA = defs.append('linearGradient')
    .attr('id', `chart-grad-a-${uid}`)
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  gradA.append('stop').attr('offset', '0%').attr('stop-color', palette.colorA).attr('stop-opacity', 0.24)
  gradA.append('stop').attr('offset', '100%').attr('stop-color', palette.colorA).attr('stop-opacity', 0.01)

  const gradB = defs.append('linearGradient')
    .attr('id', `chart-grad-b-${uid}`)
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%')
  gradB.append('stop').attr('offset', '0%').attr('stop-color', palette.colorB).attr('stop-opacity', 0.26)
  gradB.append('stop').attr('offset', '100%').attr('stop-color', palette.colorB).attr('stop-opacity', 0.01)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const allPoints = [
    ...(props.protocolA?.points || []),
    ...(props.protocolB?.points || [])
  ]
  if (allPoints.length === 0) return

  const maxTime = d3.max(allPoints, d => d.time) || 7
  const rawMaxLoad = d3.max(allPoints, d => d.load) || 1
  const maxLoad = rawMaxLoad * 1.15

  const x = d3.scaleLinear().domain([0, maxTime]).range([0, width])
  const y = d3.scaleLinear().domain([0, maxLoad]).range([height, 0]).nice()

  // Horizontal Grid
  g.append('g')
    .selectAll('line')
    .data(y.ticks(7))
    .join('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', palette.gridLine)
    .attr('stroke-dasharray', '3,4')

  const areaGen = d3.area()
    .x(d => x(d.time))
    .y0(height)
    .y1(d => y(d.load))
    .curve(d3.curveLinear)

  const lineGen = d3.line()
    .x(d => x(d.time))
    .y(d => y(d.load))
    .curve(d3.curveLinear)

  const annotations = []

  // Protocol A
  if (props.protocolA?.points?.length) {
    g.append('path')
      .datum(props.protocolA.points)
      .attr('d', areaGen)
      .attr('fill', `url(#chart-grad-a-${uid})`)

    g.append('path')
      .datum(props.protocolA.points)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', palette.colorA)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '7,4')

    annotations.push({
      value: props.protocolA.peakSteady,
      color: palette.colorA,
      opacity: 0.7,
      label: truncateLabel(`Pico ${props.protocolA.label} (~${formatMetric(props.protocolA.peakSteady, 1)}${props.unit})`)
    })

    if (!props.protocolA.isCompleteWashout && props.protocolA.troughSteady >= 0.01) {
      annotations.push({
        value: props.protocolA.troughSteady,
        color: palette.colorA,
        opacity: 0.45,
        label: truncateLabel(`Vale ${props.protocolA.label} (~${formatMetric(props.protocolA.troughSteady, 1)}${props.unit})`)
      })
    }
  }

  // Protocol B
  if (props.protocolB?.points?.length) {
    g.append('path')
      .datum(props.protocolB.points)
      .attr('d', areaGen)
      .attr('fill', `url(#chart-grad-b-${uid})`)

    g.append('path')
      .datum(props.protocolB.points)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', palette.colorB)
      .attr('stroke-width', 2.4)

    annotations.push({
      value: props.protocolB.peakSteady,
      color: palette.colorB,
      opacity: 0.75,
      label: truncateLabel(`Pico ${props.protocolB.label} (~${formatMetric(props.protocolB.peakSteady, 1)}${props.unit})`)
    })

    if (!props.protocolB.isCompleteWashout && props.protocolB.troughSteady >= 0.01) {
      annotations.push({
        value: props.protocolB.troughSteady,
        color: palette.colorB,
        opacity: 0.45,
        label: truncateLabel(`Vale ${props.protocolB.label} (~${formatMetric(props.protocolB.troughSteady, 1)}${props.unit})`)
      })
    }
  }

  // Collision-resolved horizontal Peak/Trough lines + right-margin labels
  const placedAnnotations = layoutAnnotations(annotations, y, height)
  for (const item of placedAnnotations) {
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', item.rawY)
      .attr('y2', item.rawY)
      .attr('stroke', item.color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', item.opacity)

    g.append('text')
      .attr('x', width + 8)
      .attr('y', item.labelY)
      .attr('fill', item.color)
      .attr('font-size', '10.5px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-mono)')
      .text(item.label)
  }

  // X Axis with adaptive step
  const xStep = chooseXStep(maxTime, width)
  const tickVals = d3.range(0, maxTime + 0.001, xStep)
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(tickVals)
        .tickFormat(d => (Number.isInteger(d) ? `${d}d` : `${d.toFixed(1)}d`))
    )

  xAxis.selectAll('line, path').attr('stroke', palette.axisLine)
  xAxis.selectAll('text')
    .attr('fill', palette.axisText)
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-mono)')

  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + 38)
    .attr('text-anchor', 'middle')
    .attr('fill', palette.axisText)
    .attr('font-size', '11.5px')
    .attr('font-weight', '500')
    .text('Dias de Protocolo')

  // Y Axis
  const yAxis = g.append('g').call(d3.axisLeft(y).ticks(7))
  yAxis.selectAll('line, path').attr('stroke', palette.axisLine)
  yAxis.selectAll('text')
    .attr('fill', palette.axisText)
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-mono)')

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -46)
    .attr('text-anchor', 'middle')
    .attr('fill', palette.axisText)
    .attr('font-size', '11.5px')
    .attr('font-weight', '500')
    .text(`Carga Ativa (${props.unit})`)

  // Interactive Crosshair Elements
  const focusGroup = g.append('g').style('display', 'none')

  const crosshairLine = focusGroup.append('line')
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', palette.crosshair)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')

  const dotA = focusGroup.append('circle')
    .attr('r', 4.5)
    .attr('fill', palette.colorA)
    .attr('stroke', palette.dotStroke)
    .attr('stroke-width', 2)
    .style('display', 'none')

  const dotB = focusGroup.append('circle')
    .attr('r', 4.5)
    .attr('fill', palette.colorB)
    .attr('stroke', palette.dotStroke)
    .attr('stroke-width', 2)
    .style('display', 'none')

  const updatePointer = (clientX) => {
    const rect = svgRef.value?.getBoundingClientRect()
    if (!rect) return
    const mx = Math.max(0, Math.min(width, clientX - rect.left - margin.left))
    const hoverTime = x.invert(mx)

    const ptA = props.protocolA?.points ? findClosestPoint(props.protocolA.points, hoverTime) : null
    const ptB = props.protocolB?.points ? findClosestPoint(props.protocolB.points, hoverTime) : null

    const snapTime = ptB?.time ?? ptA?.time ?? hoverTime
    const snapX = x(snapTime)

    focusGroup.style('display', null)
    crosshairLine.attr('x1', snapX).attr('x2', snapX)

    if (ptA) {
      dotA.style('display', null).attr('cx', x(ptA.time)).attr('cy', y(ptA.load))
    } else {
      dotA.style('display', 'none')
    }

    if (ptB) {
      dotB.style('display', null).attr('cx', x(ptB.time)).attr('cy', y(ptB.load))
    } else {
      dotB.style('display', 'none')
    }

    const absX = margin.left + snapX
    tooltip.visible = true
    tooltip.alignLeft = absX > chartWidth * 0.6
    tooltip.xPx = absX
    tooltip.yPx = margin.top + 8
    tooltip.dayLabel = snapTime < 1 ? snapTime.toFixed(2) : snapTime.toFixed(1)
    tooltip.loadA = ptA ? ptA.load : null
    tooltip.loadB = ptB ? ptB.load : null
    tooltip.diff = ptA && ptB ? ptB.load - ptA.load : null
  }

  const hidePointer = () => {
    focusGroup.style('display', 'none')
    tooltip.visible = false
  }

  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'transparent')
    .style('cursor', 'crosshair')
    .on('mousemove', (event) => updatePointer(event.clientX))
    .on('touchstart', (event) => {
      if (event.touches?.[0]) updatePointer(event.touches[0].clientX)
    }, { passive: true })
    .on('touchmove', (event) => {
      if (event.touches?.[0]) updatePointer(event.touches[0].clientX)
    }, { passive: true })
    .on('mouseleave', hidePointer)
}

watch(
  [
    () => props.protocolA,
    () => props.protocolB,
    () => props.medication,
    () => props.unit,
    () => props.theme
  ],
  () => {
    nextTick(() => drawChart())
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => drawChart())
  if (wrapperRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      drawChart()
    })
    resizeObserver.observe(wrapperRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.chart-top-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

.chart-title-block h4 {
  font-size: 1rem;
  color: var(--text-primary);
}

.chart-med-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
}

.legend-swatch {
  width: 18px;
  height: 0;
}

.swatch-a {
  border-top: 2.5px dashed var(--protocol-a);
}

.swatch-b {
  border-top: 2.5px solid var(--protocol-b);
}

.legend-label {
  font-weight: 600;
  color: var(--text-primary);
}

.legend-meta {
  color: var(--text-muted);
  font-size: 0.73rem;
}

.chart-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-stage {
  position: relative;
  display: inline-block;
  min-width: 100%;
}

svg {
  display: block;
}

.chart-tooltip {
  position: absolute;
  transform: translateX(12px);
  pointer-events: none;
  background: var(--surface-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
  padding: 0.6rem 0.75rem;
  min-width: 175px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.chart-tooltip.align-left {
  transform: translateX(calc(-100% - 12px));
}

.tooltip-day {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.25rem;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-a {
  background: var(--protocol-a);
}

.dot-b {
  background: var(--protocol-b);
}

.tooltip-name {
  color: var(--text-secondary);
  flex: 1;
}

.tooltip-row strong {
  color: var(--text-primary);
}

.tooltip-diff {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.74rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.25rem;
  margin-top: 0.1rem;
}

.tooltip-diff strong {
  color: var(--text-secondary);
}
</style>

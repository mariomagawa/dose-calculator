<template>
  <div class="chart-wrapper" ref="wrapperRef">
    <div class="chart-scroll-container">
      <svg ref="svgRef"></svg>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, watchEffect, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  protocolA: { type: Object, default: null },
  protocolB: { type: Object, default: null },
  medication: { type: String, default: 'Tirzepatida' },
})

const svgRef = ref(null)
const wrapperRef = ref(null)

// Chart dimensions
const margin = { top: 50, right: 140, bottom: 60, left: 70 }
const MIN_WIDTH = 700

let resizeObserver = null

function getChartWidth() {
  if (!wrapperRef.value) return MIN_WIDTH
  const w = wrapperRef.value.clientWidth
  return Math.max(w - 2, MIN_WIDTH) // -2 for border
}

function drawChart() {
  if (!svgRef.value || (!props.protocolA && !props.protocolB)) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const chartWidth = getChartWidth()
  const width = chartWidth - margin.left - margin.right
  const height = 380 - margin.top - margin.bottom

  svg
    .attr('width', chartWidth)
    .attr('height', 380)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Gather all data points
  const allPoints = [
    ...(props.protocolA?.points || []),
    ...(props.protocolB?.points || []),
  ]

  if (allPoints.length === 0) return

  const maxTime = d3.max(allPoints, d => d.time)
  const maxLoad = d3.max(allPoints, d => d.load) * 1.15

  // Scales
  const x = d3.scaleLinear().domain([0, maxTime]).range([0, width])
  const y = d3.scaleLinear().domain([0, maxLoad]).range([height, 0]).nice()

  // Grid lines
  g.append('g')
    .attr('class', 'grid-lines')
    .selectAll('line')
    .data(y.ticks(8))
    .join('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', 'rgba(255,255,255,0.06)')
    .attr('stroke-dasharray', '2,4')

  // Area generators
  const areaGen = d3.area()
    .x(d => x(d.time))
    .y0(height)
    .y1(d => y(d.load))
    .curve(d3.curveLinear)

  const lineGen = d3.line()
    .x(d => x(d.time))
    .y(d => y(d.load))
    .curve(d3.curveLinear)

  // Protocol colors
  const colorA = { line: '#f87171', fill: 'rgba(248, 113, 113, 0.15)', dash: '8,5' }
  const colorB = { line: '#60a5fa', fill: 'rgba(96, 165, 250, 0.18)', dash: null }

  // Draw Protocol A
  if (props.protocolA?.points?.length) {
    // Area
    g.append('path')
      .datum(props.protocolA.points)
      .attr('d', areaGen)
      .attr('fill', colorA.fill)

    // Line
    g.append('path')
      .datum(props.protocolA.points)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', colorA.line)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', colorA.dash)

    // Peak/Trough dashed horizontal lines + annotations
    if (props.protocolA.peakSteady != null) {
      drawHorizontalAnnotation(g, y, width, props.protocolA.peakSteady, colorA.line, `Pico ${props.protocolA.label} (~${props.protocolA.peakSteady.toFixed(1)}mg)`, -4)
    }
    if (props.protocolA.troughSteady != null) {
      drawHorizontalAnnotation(g, y, width, props.protocolA.troughSteady, colorA.line, `Vale ${props.protocolA.label} (~${props.protocolA.troughSteady.toFixed(1)}mg)`, 14, 0.5)
    }
  }

  // Draw Protocol B
  if (props.protocolB?.points?.length) {
    // Area
    g.append('path')
      .datum(props.protocolB.points)
      .attr('d', areaGen)
      .attr('fill', colorB.fill)

    // Line
    g.append('path')
      .datum(props.protocolB.points)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', colorB.line)
      .attr('stroke-width', 2.5)

    // Peak/Trough
    if (props.protocolB.peakSteady != null) {
      drawHorizontalAnnotation(g, y, width, props.protocolB.peakSteady, colorB.line, `Pico ${props.protocolB.label} (~${props.protocolB.peakSteady.toFixed(1)}mg)`, -4)
    }
    if (props.protocolB.troughSteady != null) {
      drawHorizontalAnnotation(g, y, width, props.protocolB.troughSteady, colorB.line, `Vale ${props.protocolB.label} (~${props.protocolB.troughSteady.toFixed(1)}mg)`, 14, 0.5)
    }
  }

  // X Axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(0, maxTime + 0.1, 3.5))
        .tickFormat(d => d.toFixed(1))
    )

  xAxis.selectAll('line, path').attr('stroke', 'rgba(255,255,255,0.2)')
  xAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px')

  // X Axis label
  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .text('Dias de Protocolo')

  // Y Axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(y).ticks(8))

  yAxis.selectAll('line, path').attr('stroke', 'rgba(255,255,255,0.2)')
  yAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px')

  // Y Axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -50)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .text('Carga Ativa no Corpo (mg)')

  // Title
  svg.append('text')
    .attr('x', chartWidth / 2)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('fill', '#e2e8f0')
    .attr('font-size', '14px')
    .attr('font-weight', '600')
    .text(`Comparativo de Empilhamento no Sangue: ${props.medication}`)

  // Legend
  const legendX = width - 10
  const legendY = height - 50

  const legendGroup = g.append('g')
    .attr('transform', `translate(${legendX}, ${legendY})`)

  // Legend background
  legendGroup.append('rect')
    .attr('x', -240)
    .attr('y', -8)
    .attr('width', 250)
    .attr('height', props.protocolA && props.protocolB ? 50 : 28)
    .attr('rx', 6)
    .attr('fill', 'rgba(15, 23, 42, 0.8)')
    .attr('stroke', 'rgba(255,255,255,0.1)')

  if (props.protocolA) {
    const ly = 8
    legendGroup.append('line')
      .attr('x1', -228).attr('y1', ly).attr('x2', -198).attr('y2', ly)
      .attr('stroke', colorA.line).attr('stroke-width', 2).attr('stroke-dasharray', '6,3')
    legendGroup.append('text')
      .attr('x', -192).attr('y', ly + 4)
      .attr('fill', '#cbd5e1').attr('font-size', '11px')
      .text(`${props.protocolA.label} (${props.protocolA.dose}mg/${props.protocolA.interval}d)`)
  }

  if (props.protocolB) {
    const ly = props.protocolA ? 30 : 8
    legendGroup.append('line')
      .attr('x1', -228).attr('y1', ly).attr('x2', -198).attr('y2', ly)
      .attr('stroke', colorB.line).attr('stroke-width', 2.5)
    legendGroup.append('text')
      .attr('x', -192).attr('y', ly + 4)
      .attr('fill', '#cbd5e1').attr('font-size', '11px')
      .text(`${props.protocolB.label} (${props.protocolB.dose}mg/${props.protocolB.interval}d)`)
  }
}

function drawHorizontalAnnotation(g, yScale, width, value, color, label, offsetY = 0, opacity = 0.6) {
  const yPos = yScale(value)

  g.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', yPos)
    .attr('y2', yPos)
    .attr('stroke', color)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', opacity)

  g.append('text')
    .attr('x', width + 6)
    .attr('y', yPos + offsetY)
    .attr('fill', color)
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .text(label)
}

// Reactive redraw: watchEffect auto-tracks all reactive deps accessed inside it
watchEffect(() => {
  // Force Vue to track these reactive props deeply by serializing them
  const _a = props.protocolA ? JSON.stringify(toRaw(props.protocolA).points?.length) : null
  const _b = props.protocolB ? JSON.stringify(toRaw(props.protocolB).points?.length) : null
  const _m = props.medication

  // Schedule a redraw on next tick
  nextTick(() => drawChart())
})

// Also watch individual props explicitly as fallback
watch(() => props.protocolA, () => nextTick(() => drawChart()), { deep: true })
watch(() => props.protocolB, () => nextTick(() => drawChart()), { deep: true })
watch(() => props.medication, () => nextTick(() => drawChart()))

onMounted(() => {
  nextTick(() => drawChart())

  // ResizeObserver
  if (wrapperRef.value && window.ResizeObserver) {
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
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chart-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.chart-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 3px;
}

svg {
  display: block;
  font-family: 'Inter', system-ui, sans-serif;
}

@media (max-width: 640px) {
  svg {
    min-width: 650px;
  }
}
</style>

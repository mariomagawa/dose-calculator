<template>
  <section class="peptide-selector card-panel">
    <!-- Compact Selected Summary State -->
    <div v-if="selectedPeptide && !isExpanded" class="compact-summary">
      <div class="compact-main">
        <div class="compact-top-row">
          <span class="step-badge is-done" aria-label="Etapa 0 concluída">
            <CheckIcon :size="15" />
          </span>
          <span class="pep-code-badge">{{ selectedPeptide.code }}</span>
          <strong class="compact-name">{{ selectedPeptide.name }}</strong>
          <span v-if="selectedPeptide.id !== 'custom'" class="half-life-chip mono-num">
            t½ {{ formatHalfLife(selectedPeptide.halfLifeDays) }}
          </span>
        </div>

        <p class="compact-desc">{{ selectedPeptide.description }}</p>

        <!-- Free Mode Unit Selector -->
        <div v-if="selectedPeptide.id === 'custom'" class="free-unit-row">
          <span class="free-unit-label">Unidade do composto:</span>
          <div class="unit-segmented" role="group" aria-label="Unidade de medida">
            <button
              type="button"
              class="unit-seg-btn"
              :class="{ active: unit === 'mg' }"
              @click="emit('update:unit', 'mg')"
            >
              mg / mcg
            </button>
            <button
              type="button"
              class="unit-seg-btn"
              :class="{ active: unit === 'UI' }"
              @click="emit('update:unit', 'UI')"
            >
              UI
            </button>
          </div>
        </div>
      </div>

      <div class="compact-actions">
        <button
          type="button"
          class="btn-secondary-sm"
          @click="isExpanded = true"
        >
          <ArrowLeftRightIcon :size="14" />
          <span>Trocar</span>
        </button>

        <button
          v-if="selectedPeptide.id !== 'custom'"
          type="button"
          class="btn-ghost-sm"
          @click="switchToFree"
        >
          Modo Livre
        </button>
      </div>
    </div>

    <!-- Expanded Selection Grid State -->
    <div v-else class="expanded-selector">
      <div class="selector-header">
        <div class="header-top-row">
          <div class="title-wrap">
            <span class="step-badge step-zero">0</span>
            <div>
              <h3>Escolha o Peptídeo / Composto</h3>
              <p class="selector-subtitle">
                Selecione um composto para carregar apresentações e meia-vida, ou use o Modo Livre.
              </p>
            </div>
          </div>

          <button
            v-if="selectedPeptide"
            type="button"
            class="btn-ghost-sm"
            @click="isExpanded = false"
          >
            Fechar
          </button>
        </div>

        <!-- Search input -->
        <div class="search-row">
          <div class="search-box">
            <SearchIcon :size="16" class="search-icon" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Buscar peptídeo ou código (ex: TR15, Ipamorelin, NAD+)..."
              class="search-input"
              aria-label="Buscar peptídeo ou código"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-search"
              aria-label="Limpar busca"
              @click="searchQuery = ''"
            >
              <XIcon :size="14" />
            </button>
          </div>
          <span class="results-count mono-num">
            {{ filteredPeptides.length }} {{ filteredPeptides.length === 1 ? 'item' : 'itens' }}
          </span>
        </div>
      </div>

      <!-- Category Pills -->
      <div class="categories-bar" role="tablist" aria-label="Categorias de peptídeos">
        <button
          v-for="cat in PEPTIDE_CATEGORIES"
          :key="cat.id"
          type="button"
          class="category-pill"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Empty Search State -->
      <div v-if="filteredPeptides.length === 0" class="empty-search-state">
        <p>Nenhum composto encontrado para <strong>"{{ searchQuery }}"</strong>.</p>
        <div class="empty-actions">
          <button type="button" class="btn-secondary-sm" @click="clearFilters">
            Limpar busca
          </button>
          <button type="button" class="btn-primary-sm" @click="switchToFree">
            Usar Modo Livre
          </button>
        </div>
      </div>

      <!-- Peptides Grid -->
      <div v-else class="peptides-grid">
        <button
          v-for="pep in filteredPeptides"
          :key="pep.id"
          type="button"
          class="peptide-card"
          :class="{ selected: modelValue === pep.id }"
          @click="selectPeptide(pep)"
        >
          <div class="card-top">
            <span class="pep-code-badge" v-if="pep.code">{{ pep.code }}</span>
            <span class="pep-badge" v-if="pep.badge">{{ pep.badge }}</span>
          </div>

          <div class="card-main">
            <strong class="pep-name">{{ pep.name }}</strong>
            <p class="pep-desc">{{ pep.description }}</p>
          </div>

          <div class="card-footer">
            <span class="pep-cat-tag">{{ pep.categoryLabel }}</span>
            <div class="pep-meta-tags">
              <span v-if="pep.id !== 'custom'" class="pep-hl-tag mono-num">
                t½ {{ formatHalfLife(pep.halfLifeDays) }}
              </span>
              <span class="pep-unit-tag mono-num">{{ pep.unit }}</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Search as SearchIcon,
  X as XIcon,
  Check as CheckIcon,
  ArrowLeftRight as ArrowLeftRightIcon
} from 'lucide-vue-next'
import { PEPTIDES, PEPTIDE_CATEGORIES, GENERIC_PEPTIDE } from '../data/peptides.js'
import { formatHalfLife } from '../utils/pharmacokinetics.js'

const props = defineProps({
  modelValue: { type: String, default: null },
  unit: { type: String, default: 'mg' }
})

const emit = defineEmits([
  'update:modelValue',
  'peptide-selected',
  'switch-free',
  'update:unit'
])

const searchQuery = ref('')
const selectedCategory = ref('all')
const isExpanded = ref(false)

const allPeptidesList = [...PEPTIDES, GENERIC_PEPTIDE]

const selectedPeptide = computed(() => {
  if (!props.modelValue) return null
  return allPeptidesList.find(p => p.id === props.modelValue) || null
})

const filteredPeptides = computed(() => {
  return allPeptidesList.filter(pep => {
    if (selectedCategory.value !== 'all') {
      if (selectedCategory.value === 'custom' && pep.id !== 'custom') return false
      if (selectedCategory.value !== 'custom' && pep.category !== selectedCategory.value) return false
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = pep.name.toLowerCase().includes(q)
      const matchCode = pep.code?.toLowerCase().includes(q)
      const matchDesc = pep.description?.toLowerCase().includes(q)
      const matchCat = pep.categoryLabel?.toLowerCase().includes(q)
      return matchName || matchCode || matchDesc || matchCat
    }

    return true
  })
})

const selectPeptide = (peptide) => {
  isExpanded.value = false
  emit('update:modelValue', peptide.id)
  emit('peptide-selected', peptide)
}

const switchToFree = () => {
  isExpanded.value = false
  emit('switch-free')
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
}

watch(
  () => props.modelValue,
  (val) => {
    if (val === null) {
      isExpanded.value = false
    }
  }
)
</script>

<style scoped>
.peptide-selector {
  padding: 1.35rem;
  position: relative;
  width: 100%;
  min-width: 0;
  border-top: 2px solid var(--accent);
}

/* Compact Summary State */
.compact-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.compact-main {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1 1 280px;
  min-width: 0;
}

.compact-top-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.compact-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--text-primary);
}

.half-life-chip {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.compact-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.free-unit-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.25rem;
}

.free-unit-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
}

.unit-segmented {
  display: inline-flex;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.unit-seg-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: calc(var(--radius-sm) - 2px);
  cursor: pointer;
  transition: all 0.18s ease;
}

.unit-seg-btn.active {
  background: var(--accent);
  color: #ffffff;
}

.compact-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--accent);
  border: 1px solid var(--accent-strong);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-primary-sm:hover {
  background: var(--accent-strong);
  transform: translateY(-1px);
}

.btn-secondary-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.48rem 0.8rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-secondary-sm:hover {
  background: var(--surface-3);
}

.btn-ghost-sm {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.65rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-ghost-sm:hover {
  color: var(--text-primary);
  background: var(--surface-2);
}

/* Expanded State */
.expanded-selector {
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
}

.selector-header {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.header-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.selector-header h3 {
  font-size: 1.12rem;
  line-height: 1.25;
}

.selector-subtitle {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.58rem 0.85rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.88rem;
  width: 100%;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-search {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search:hover {
  color: var(--text-primary);
}

.results-count {
  font-size: 0.76rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Categories Bar */
.categories-bar {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
}

.categories-bar::-webkit-scrollbar {
  display: none;
}

.category-pill {
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0.38rem 0.78rem;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.category-pill:hover {
  background: var(--surface-3);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.category-pill.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

/* Empty State */
.empty-search-state {
  padding: 1.75rem 1rem;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

.empty-search-state p {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.empty-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Peptides Grid */
.peptides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.7rem;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.peptide-card {
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;
}

.peptide-card:hover {
  background: var(--surface-3);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.peptide-card.selected {
  background: var(--accent-soft);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.35rem;
  min-height: 20px;
}

.pep-code-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-strong);
  background: var(--accent-soft);
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.pep-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--emerald);
  background: var(--emerald-soft);
  padding: 2px 7px;
  border-radius: 4px;
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.pep-name {
  font-size: 0.92rem;
  color: var(--text-primary);
  line-height: 1.25;
}

.pep-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.38;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-top: auto;
  padding-top: 0.45rem;
  border-top: 1px solid var(--border-subtle);
}

.pep-cat-tag {
  font-size: 0.69rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pep-meta-tags {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.pep-hl-tag {
  font-size: 0.68rem;
  color: var(--text-secondary);
}

.pep-unit-tag {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-strong);
}

@media (max-width: 640px) {
  .peptide-selector {
    padding: 1.1rem;
  }
  .peptides-grid {
    grid-template-columns: 1fr;
    max-height: 300px;
  }
  .compact-actions {
    width: 100%;
  }
}
</style>

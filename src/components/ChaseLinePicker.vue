<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  SERVICE_LINES,
  HAZARD_LINES,
  type ChaseEnd,
  type ChaseLine,
  type ChaseModifier,
  type ChaseValue,
  type Side,
} from '../scoring/types'
import { formatLine, formatChase } from '../scoring/format'

const props = defineProps<{
  end: ChaseEnd
  laidBy: Side
  laidByName: string
}>()
const emit = defineEmits<{
  (e: 'select', payload: { value: ChaseValue; laidBy: Side }): void
  (e: 'cancel'): void
}>()

const lines = computed<readonly ChaseLine[]>(() =>
  props.end === 'service' ? SERVICE_LINES : HAZARD_LINES,
)

const modifier = ref<ChaseModifier>('exact')
const selected = ref<ChaseLine[]>([])

const MODIFIERS: { id: ChaseModifier; label: string }[] = [
  { id: 'exact', label: 'Exact' },
  { id: 'better', label: 'Better than' },
  { id: 'worse', label: 'Worse than' },
  { id: 'between', label: 'Between' },
]

function indexOf(line: ChaseLine): number {
  return lines.value.indexOf(line)
}

/**
 * For "between": after one line is picked, only its immediate neighbours in
 * the ordered list remain selectable as the second pick.
 */
function isLineEnabled(line: ChaseLine): boolean {
  if (modifier.value !== 'between') return true
  if (selected.value.length === 0) return true
  if (selected.value.includes(line)) return true
  if (selected.value.length === 2) return false
  const anchor = indexOf(selected.value[0])
  const i = indexOf(line)
  return i === anchor - 1 || i === anchor + 1
}

function toggleLine(line: ChaseLine) {
  if (!isLineEnabled(line)) return
  const i = selected.value.indexOf(line)
  if (i >= 0) {
    // toggle off
    selected.value = selected.value.filter((l) => l !== line)
    return
  }
  if (modifier.value === 'between') {
    if (selected.value.length < 2) {
      // keep ordered by position so the label reads naturally
      const next = [...selected.value, line].sort((a, b) => indexOf(a) - indexOf(b))
      selected.value = next
    }
    return
  }
  selected.value = [line]
}

function toggleModifier(id: ChaseModifier) {
  if (modifier.value === id) {
    // Tapping the active modifier returns to default (exact, no half-yard).
    modifier.value = 'exact'
    // If we were in between with 2 picks, drop to one.
    if (selected.value.length > 1) selected.value = [selected.value[0]]
    return
  }
  if (id === 'between') {
    // moving into between — keep current pick if any, but no need to clear
    modifier.value = 'between'
    if (selected.value.length > 1) selected.value = [selected.value[0]]
    return
  }
  // Moving to a single-line modifier — collapse to a single pick if needed.
  modifier.value = id
  if (selected.value.length > 1) selected.value = [selected.value[0]]
}

const isValid = computed(() => {
  if (modifier.value === 'between') return selected.value.length === 2
  return selected.value.length === 1
})

const previewValue = computed<ChaseValue | null>(() => {
  if (!isValid.value) return null
  return { end: props.end, modifier: modifier.value, lines: [...selected.value] }
})

const previewLabel = computed(() => (previewValue.value ? formatChase(previewValue.value) : ''))

function confirm() {
  if (!previewValue.value) return
  emit('select', { value: previewValue.value, laidBy: props.laidBy })
}
</script>

<template>
  <div class="chase-line-picker" role="group" :aria-label="`Lay chase by ${laidByName}`">
    <div class="picker-head">
      <span class="muted small">
        Lay chase — {{ end === 'service' ? 'service end' : 'hazard end' }}
      </span>
    </div>

    <div class="modifiers">
      <button
        v-for="m in MODIFIERS"
        :key="m.id"
        class="btn mod-btn"
        :class="{ 'btn-primary': modifier === m.id }"
        @click="toggleModifier(m.id)"
      >
        {{ m.label }}
      </button>
    </div>

    <div class="lines">
      <button
        v-for="l in lines"
        :key="l"
        class="btn line-btn"
        :class="{ 'btn-primary': selected.includes(l), dim: !isLineEnabled(l) }"
        :disabled="!isLineEnabled(l)"
        @click="toggleLine(l)"
      >
        {{ formatLine(l) }}
      </button>
    </div>

    <div v-if="previewLabel" class="preview">{{ previewLabel }}</div>

    <div class="action-row">
      <button class="btn btn-ghost btn-block" @click="$emit('cancel')">Cancel</button>
      <button
        class="btn btn-primary btn-block"
        :disabled="!isValid"
        @click="confirm"
      >
        Lay chase
      </button>
    </div>
  </div>
</template>

<style scoped>
.chase-line-picker {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
  gap: 0.3rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.picker-head { text-align: center; }
.modifiers {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}
.mod-btn { font-size: 0.68rem; min-height: 32px; padding: 0.2rem 0.2rem; }
.lines {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.3rem;
  min-height: 0;
  overflow: auto;
  align-content: start;
}
.line-btn { font-size: 0.82rem; padding: 0.2rem 0.4rem; }
.line-btn.dim { opacity: 0.35; }
.preview {
  text-align: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary);
  background: var(--surface-sunken);
  border-radius: var(--radius-2);
  padding: 0.25rem 0.5rem;
}
.small { font-size: 0.72rem; }
.action-row {
  display: flex;
  gap: 0.4rem;
}
</style>

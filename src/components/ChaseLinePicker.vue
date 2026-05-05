<script setup lang="ts">
import { ref } from 'vue'
import type { ChaseLine, Side } from '../scoring/types'

defineProps<{ players: { A: string; B: string } }>()
const emit = defineEmits<{
  (e: 'select', payload: { line: ChaseLine; laidBy: Side }): void
  (e: 'cancel'): void
}>()

const LINES: { line: ChaseLine; label: string }[] = [
  { line: '1', label: 'Chase 1' },
  { line: '2', label: 'Chase 2' },
  { line: '3', label: 'Chase 3' },
  { line: '4', label: 'Chase 4' },
  { line: '5', label: 'Chase 5' },
  { line: '6', label: 'Chase 6' },
  { line: 'better-than-half-a-yard', label: 'Better than half a yard' },
  { line: 'half-a-yard', label: 'Half a yard' },
  { line: 'worse-than-half-a-yard', label: 'Worse than half a yard' },
  { line: 'last-gallery', label: 'Last gallery' },
  { line: 'second-gallery', label: 'Second gallery' },
  { line: 'door', label: 'Door' },
  { line: 'first-gallery', label: 'First gallery' },
  { line: 'hazard-side', label: 'Hazard side' },
]

const laidBy = ref<Side | null>(null)

function pick(line: ChaseLine) {
  if (!laidBy.value) return
  emit('select', { line, laidBy: laidBy.value })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal-sheet chase-line-picker" role="dialog" aria-modal="true">
      <h3>Lay a chase</h3>
      <p class="muted small">Who bounced twice (chase laid by them)?</p>
      <div class="laidby">
        <button
          class="btn"
          :class="{ 'btn-primary': laidBy === 'A' }"
          @click="laidBy = 'A'"
        >
          {{ players.A }}
        </button>
        <button
          class="btn"
          :class="{ 'btn-primary': laidBy === 'B' }"
          @click="laidBy = 'B'"
        >
          {{ players.B }}
        </button>
      </div>
      <p class="muted small">Pick the chase line:</p>
      <div class="lines" :class="{ disabled: !laidBy }">
        <button
          v-for="l in LINES"
          :key="l.line"
          class="btn line-btn"
          :disabled="!laidBy"
          @click="pick(l.line)"
        >
          {{ l.label }}
        </button>
      </div>
      <button class="btn btn-ghost btn-block" @click="$emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.laidby {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.lines {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.lines.disabled { opacity: 0.5; }
.line-btn { min-height: 48px; font-size: 0.95rem; }
.small { font-size: 0.8rem; }
</style>

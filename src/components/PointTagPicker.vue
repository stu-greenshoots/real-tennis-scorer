<script setup lang="ts">
import type { PointTag } from '../scoring/types'

defineProps<{ side: 'A' | 'B'; playerName?: string }>()
const emit = defineEmits<{
  (e: 'select', tag: PointTag): void
  (e: 'cancel'): void
}>()

const TAGS: { tag: PointTag; label: string; hint?: string }[] = [
  { tag: 'winner', label: 'Winner', hint: 'Default — clean point' },
  { tag: 'dedans', label: 'Dedans' },
  { tag: 'grille', label: 'Grille' },
  { tag: 'gallery', label: 'Gallery' },
  { tag: 'forced-error', label: 'Forced error' },
  { tag: 'unforced-error', label: 'Unforced error' },
  { tag: 'let', label: 'Let' },
]

function pick(tag: PointTag) {
  emit('select', tag)
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal-sheet point-tag-picker" role="dialog" aria-modal="true">
      <h3>Award point to {{ playerName ?? side }}</h3>
      <p class="muted small">Pick a tag, or tap Winner for a quick point.</p>
      <div class="tags">
        <button
          v-for="t in TAGS"
          :key="t.tag"
          class="btn tag-btn"
          :class="{ 'btn-primary': t.tag === 'winner' }"
          @click="pick(t.tag)"
        >
          <span>{{ t.label }}</span>
          <span v-if="t.hint" class="muted small">{{ t.hint }}</span>
        </button>
      </div>
      <button class="btn btn-ghost btn-block" @click="$emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.tags {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.tag-btn {
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 0.7rem 0.8rem;
  min-height: 56px;
}
.small { font-size: 0.8rem; }
</style>

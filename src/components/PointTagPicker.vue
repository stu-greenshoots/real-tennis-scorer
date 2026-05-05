<script setup lang="ts">
import type { PointTag } from '../scoring/types'

defineProps<{ side: 'A' | 'B'; playerName?: string }>()
const emit = defineEmits<{
  (e: 'select', tag: PointTag): void
  (e: 'cancel'): void
}>()

const TAGS: { tag: PointTag; label: string }[] = [
  { tag: 'winner', label: 'Winner' },
  { tag: 'dedans', label: 'Dedans' },
  { tag: 'grille', label: 'Grille' },
  { tag: 'gallery', label: 'Gallery' },
  { tag: 'forced-error', label: 'Forced err.' },
  { tag: 'unforced-error', label: 'Unforced err.' },
  { tag: 'let', label: 'Let' },
]

function pick(tag: PointTag) {
  emit('select', tag)
}
</script>

<template>
  <div class="point-tag-picker" role="dialog" aria-modal="true">
    <div class="header">
      <span class="title">Point to {{ playerName ?? side }}</span>
      <button class="cancel" @click="$emit('cancel')" aria-label="Cancel">✕</button>
    </div>
    <div class="tags">
      <button
        v-for="t in TAGS"
        :key="t.tag"
        class="tag-btn"
        :class="{ primary: t.tag === 'winner' }"
        @click="pick(t.tag)"
      >
        {{ t.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.point-tag-picker {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--surface-raised, var(--surface));
  border-radius: 14px;
  padding: 0.5rem;
  gap: 0.4rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem;
  font-size: 0.85rem;
}
.title { color: var(--text-muted); font-weight: 500; }
.cancel {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-muted);
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}
.tags {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}
.tag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  height: 100%;
  transition: transform 0.05s ease;
}
.tag-btn:active { transform: scale(0.97); }
.tag-btn.primary {
  background: var(--primary);
  color: var(--primary-ink, white);
  border-color: var(--primary);
  grid-column: span 3;
  font-size: 1.2rem;
}
</style>

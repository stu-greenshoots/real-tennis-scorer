<script setup lang="ts">
import Glyphs from './Glyphs.vue'

withDefaults(
  defineProps<{
    glyph?: 'penthouse' | 'dedans' | 'grille' | 'tambour' | 'racquet' | 'ball'
    label?: string
  }>(),
  { glyph: 'penthouse' },
)
</script>

<template>
  <div class="glyph-divider">
    <span class="line" />
    <Glyphs :glyph="glyph" :size="18" />
    <span v-if="label" class="label">{{ label }}</span>
    <span class="line" />
  </div>
</template>

<style scoped>
.glyph-divider {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0;
  color: var(--court-ink);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
.line { flex: 1; height: 1px; background: var(--line); }
.label { color: var(--text-muted); white-space: nowrap; }
</style>

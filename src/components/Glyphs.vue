<script setup lang="ts">
withDefaults(
  defineProps<{
    glyph?: 'penthouse' | 'dedans' | 'grille' | 'tambour' | 'racquet' | 'ball'
    size?: number
    color?: string
  }>(),
  { glyph: 'penthouse', size: 22, color: 'currentColor' },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="glyph === 'dedans'">
      <rect x="3" y="6" width="18" height="12" rx="1.2" />
      <rect x="7" y="9" width="10" height="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </template>
    <template v-else-if="glyph === 'grille'">
      <rect x="6" y="5" width="12" height="14" rx="1" />
      <line x1="9" y1="5" x2="9" y2="19" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="15" y1="5" x2="15" y2="19" />
      <line x1="6" y1="10" x2="18" y2="10" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </template>
    <template v-else-if="glyph === 'tambour'">
      <path d="M4 19 L4 7 L11 7 L13 9 L13 19 Z" />
      <line x1="4" y1="12" x2="13" y2="12" />
      <line x1="13" y1="9" x2="20" y2="9" />
      <line x1="20" y1="9" x2="20" y2="19" />
      <line x1="13" y1="19" x2="20" y2="19" />
    </template>
    <template v-else-if="glyph === 'racquet'">
      <path d="M14 4 Q19 5 19 10 Q19 15 14 16 Q9 15 9 10 Q9 6 12 5" />
      <line x1="11" y1="14" x2="6" y2="20" />
      <line x1="6" y1="20" x2="4.5" y2="21.5" />
      <line x1="11" y1="6" x2="18" y2="13" opacity="0.5" />
      <line x1="9.5" y1="9" x2="18" y2="13" opacity="0.5" />
      <line x1="9" y1="11.5" x2="17" y2="14" opacity="0.5" />
    </template>
    <template v-else-if="glyph === 'ball'">
      <circle cx="12" cy="12" r="7" />
      <path d="M5 12 Q12 8 19 12" fill="none" />
      <path d="M5 12 Q12 16 19 12" fill="none" />
    </template>
    <template v-else>
      <path d="M3 14 L12 7 L21 14" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <line x1="7" y1="14" x2="7" y2="18" />
      <line x1="12" y1="11" x2="12" y2="18" />
      <line x1="17" y1="14" x2="17" y2="18" />
    </template>
  </svg>
</template>

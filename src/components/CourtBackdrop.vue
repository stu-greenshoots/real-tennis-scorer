<script setup lang="ts">
withDefaults(defineProps<{ opacity?: number }>(), { opacity: 0.06 })
</script>

<template>
  <svg
    class="court-backdrop"
    :style="{ opacity }"
    viewBox="0 0 390 600"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <g stroke="var(--slate)" stroke-width="1.2" fill="none" stroke-linecap="round">
      <path d="M30 110 L150 70 L240 70 L360 110" />
      <line x1="30" y1="110" x2="360" y2="110" />
      <line x1="30" y1="280" x2="360" y2="280" stroke-dasharray="6 4" />
      <path d="M260 280 L260 360 L300 360 L300 480" />
      <rect x="30" y="430" width="100" height="38" />
      <rect x="50" y="438" width="60" height="22" stroke-width="0.8" />
      <line x1="160" y1="280" x2="160" y2="295" />
      <line x1="200" y1="280" x2="200" y2="295" />
      <line x1="240" y1="280" x2="240" y2="295" />
    </g>
  </svg>
</template>

<style scoped>
.court-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>

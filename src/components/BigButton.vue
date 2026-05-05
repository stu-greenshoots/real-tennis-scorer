<script setup lang="ts">
defineProps<{
  label: string
  subtitle?: string
  disabled?: boolean
  winner?: boolean
}>()
defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <button
    class="big-button"
    :class="{ 'is-winner': winner }"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <div class="big-button__content">
      <slot />
      <div class="big-button__label">{{ label }}</div>
      <div v-if="subtitle" class="big-button__subtitle">{{ subtitle }}</div>
    </div>
  </button>
</template>

<style scoped>
.big-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 80px;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
  font-size: 1.4rem;
  cursor: pointer;
  transition: transform 0.05s ease, background 0.1s ease;
}
.big-button:active { transform: translateY(1px); }
.big-button:disabled { opacity: 0.5; cursor: not-allowed; }
.big-button.is-winner {
  background: var(--primary);
  color: var(--primary-ink);
  border-color: var(--primary);
}
.big-button__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.big-button__label {
  font-size: 1.15rem;
  font-weight: 600;
}
.big-button__subtitle {
  font-size: 0.9rem;
  opacity: 0.85;
}
</style>

<script setup lang="ts">
defineProps<{
  label?: string
  modelValue: number
  options: readonly number[]
}>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>

<template>
  <div class="num-segment">
    <div v-if="label" class="field-label">{{ label }}</div>
    <div class="track">
      <button
        v-for="o in options"
        :key="o"
        :class="{ active: modelValue === o }"
        @click="$emit('update:modelValue', o)"
      >
        {{ o }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.num-segment { display: flex; flex-direction: column; gap: 0.35rem; }
.track {
  display: inline-flex;
  background: var(--surface-sunken);
  border-radius: 999px;
  padding: 3px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);
  align-self: flex-start;
}
.track button {
  border: 0;
  padding: 0.45rem 1rem;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: 999px;
  cursor: pointer;
  min-width: 44px;
  transition: all 0.15s;
}
.track button.active {
  background: var(--surface-raised);
  color: var(--primary);
  box-shadow: var(--shadow-1);
}
</style>

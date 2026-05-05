<script setup lang="ts">
defineProps<{ label: string; sub?: string; modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<template>
  <button
    type="button"
    class="toggle-row"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <div class="text">
      <div class="label">{{ label }}</div>
      <div v-if="sub" class="sub">{{ sub }}</div>
    </div>
    <div class="switch" :class="{ on: modelValue }">
      <div class="knob" />
    </div>
  </button>
</template>

<style scoped>
.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-3);
  cursor: pointer;
  font-family: var(--font-body);
  text-align: left;
  width: 100%;
}
.text { flex: 1; }
.label { font-weight: 700; font-size: 0.95rem; color: var(--text); }
.sub { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
.switch {
  width: 46px;
  height: 28px;
  border-radius: 999px;
  background: var(--surface-sunken);
  position: relative;
  transition: background 0.2s;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
  flex-shrink: 0;
}
.switch.on { background: var(--success); }
.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: left 0.2s var(--ease-spring);
}
.switch.on .knob { left: 20px; }
</style>

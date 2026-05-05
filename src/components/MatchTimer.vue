<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'

const props = defineProps<{ startedAt: number; endedAt?: number }>()
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

function start() {
  stop()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
}
function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  if (!props.endedAt) start()
})
onBeforeUnmount(stop)

watch(
  () => props.endedAt,
  (val) => {
    if (val) stop()
    else start()
  }
)

const elapsed = computed(() => {
  const end = props.endedAt ?? now.value
  return Math.max(0, end - props.startedAt)
})

const formatted = computed(() => {
  const totalSec = Math.floor(elapsed.value / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
})
</script>

<template>
  <span class="match-timer">{{ formatted }}</span>
</template>

<style scoped>
.match-timer {
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
  color: var(--text-muted);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Timeline from '../components/Timeline.vue'
import { useHistoryStore } from '../stores/history'
import { useMatchStore } from '../stores/match'

const props = defineProps<{ id: string }>()
const router = useRouter()
const historyStore = useHistoryStore()
const matchStore = useMatchStore()

const match = computed(() => {
  // Prefer history; fall back to current in-memory match
  return (
    historyStore.getById(props.id) ??
    (matchStore.current && matchStore.current.id === props.id
      ? matchStore.current
      : undefined)
  )
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function durationMin(m: NonNullable<typeof match.value>): string {
  const end = m.endedAt ?? Date.now()
  const mins = Math.round((end - m.startedAt) / 60000)
  return `${mins} min`
}

function finalScore(m: NonNullable<typeof match.value>): string {
  const sets = m.score.setHistory
  if (!sets || sets.length === 0) return `${m.score.sets.A}–${m.score.sets.B} sets`
  return sets.map((s) => `${s.A}–${s.B}`).join(', ')
}
</script>

<template>
  <div v-if="match" class="view detail-view">
    <header class="view-header">
      <button class="btn btn-ghost" @click="router.push('/history')">‹ History</button>
      <h1>Match</h1>
      <span></span>
    </header>

    <div class="card summary">
      <div class="players">
        {{ match.players.A }} <span class="muted">vs</span> {{ match.players.B }}
      </div>
      <div class="meta muted">
        <span>{{ formatDate(match.startedAt) }}</span>
        <span>•</span>
        <span>{{ durationMin(match) }}</span>
      </div>
      <div class="score">{{ finalScore(match) }}</div>
    </div>

    <h2>Timeline</h2>
    <Timeline :events="match.events" :players="match.players" />
  </div>
  <div v-else class="view center muted">
    Match not found.
    <button class="btn" style="margin-top: 1rem;" @click="router.push('/history')">
      Back to history
    </button>
  </div>
</template>

<style scoped>
.detail-view { display: flex; flex-direction: column; gap: 0.75rem; }
.summary { display: flex; flex-direction: column; gap: 0.4rem; }
.players { font-size: 1.2rem; font-weight: 600; }
.meta { display: flex; gap: 0.4rem; font-size: 0.9rem; }
.score {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}
</style>

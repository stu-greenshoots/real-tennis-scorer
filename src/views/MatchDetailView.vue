<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Timeline from '../components/Timeline.vue'
import { useHistoryStore } from '../stores/history'
import { useMatchStore } from '../stores/match'

const props = defineProps<{ id: string }>()
const router = useRouter()
const historyStore = useHistoryStore()
const matchStore = useMatchStore()

const showDeleteConfirm = ref(false)

function exportThis() {
  const m = match.value
  if (!m) return
  const json = historyStore.exportJson(m.id) || JSON.stringify(m, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(m.startedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `match-${m.players.A}-vs-${m.players.B}-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function confirmDelete() {
  if (match.value) historyStore.delete(match.value.id)
  showDeleteConfirm.value = false
  router.replace('/history')
}

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

    <div class="detail-actions">
      <button class="btn btn-small" @click="exportThis">Export JSON</button>
      <button class="btn btn-small btn-danger" @click="showDeleteConfirm = true">Delete</button>
    </div>

    <h2>Timeline</h2>
    <Timeline :events="match.events" :players="match.players" :match="match" />

    <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="showDeleteConfirm = false">
      <div class="modal-sheet">
        <h3>Delete this match?</h3>
        <p class="muted">Export a backup first if you want to keep it.</p>
        <div class="row" style="gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-block" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn btn-danger btn-block" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
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
.detail-actions {
  display: flex;
  gap: 0.5rem;
}
.detail-actions .btn { flex: 1; }
.btn-small { min-height: 36px; padding: 0.3rem 0.7rem; font-size: 0.9rem; }
</style>

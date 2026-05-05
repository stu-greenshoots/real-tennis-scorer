<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BigButton from '../components/BigButton.vue'
import type { Side } from '../scoring/types'
import { useMatchStore } from '../stores/match'

const router = useRouter()
const matchStore = useMatchStore()

onMounted(() => {
  if (!matchStore.current) {
    router.replace('/')
    return
  }
  if (!matchStore.current.playoffActive) {
    matchStore.dispatch({ type: 'startChasePlayoff' })
  }
})

const match = computed(() => matchStore.current)

const total = computed(() => {
  const m = match.value
  if (!m) return 0
  return m.pendingChases.length + (m.playoffActive ? 0 : 0)
})

const currentChase = computed(() => match.value?.pendingChases[0])
const currentIndex = computed(() => {
  const m = match.value
  if (!m) return 0
  // If playoffRemaining is tracked, derive from total - remaining.
  const done = Math.max(0, total.value - m.pendingChases.length)
  return done + 1
})

function awardChase(side: Side) {
  matchStore.dispatch({ type: 'awardPoint', side, tag: 'chase-won' })
  if (!match.value || match.value.pendingChases.length === 0) {
    router.replace('/match')
  }
}

function chaseLabel(line: string): string {
  return String(line).replace(/-/g, ' ')
}
</script>

<template>
  <div v-if="match" class="view playoff-view">
    <header class="view-header">
      <button class="btn btn-ghost" @click="router.push('/match')">‹ Back to match</button>
      <h1>Chase playoff</h1>
      <span></span>
    </header>

    <div v-if="currentChase" class="card playoff-card">
      <div class="muted small">
        Chase {{ currentIndex }} of {{ total || match.pendingChases.length }}
      </div>
      <div class="chase-line">{{ chaseLabel(currentChase.line) }}</div>
      <div class="muted">Laid by {{ match.players[currentChase.laidBy] }}</div>
    </div>

    <div v-else class="card center muted">
      All chases resolved.
      <div style="margin-top: 0.75rem;">
        <button class="btn" @click="router.replace('/match')">Back to match</button>
      </div>
    </div>

    <div v-if="currentChase" class="big-buttons">
      <BigButton
        :label="`Won by ${match.players.A}`"
        @click="awardChase('A')"
      />
      <BigButton
        :label="`Won by ${match.players.B}`"
        @click="awardChase('B')"
      />
    </div>

    <div class="banner">Switch ends before each chase!</div>
  </div>
  <div v-else class="view center muted">No active match.</div>
</template>

<style scoped>
.playoff-view { display: flex; flex-direction: column; gap: 0.75rem; }
.playoff-card { text-align: center; }
.chase-line {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: capitalize;
  margin: 0.5rem 0;
}
.big-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.big-buttons :deep(.big-button) {
  min-height: max(100px, 25vh);
}
.small { font-size: 0.8rem; }
</style>

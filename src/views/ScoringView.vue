<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ScoreDisplay from '../components/ScoreDisplay.vue'
import BigButton from '../components/BigButton.vue'
import MatchTimer from '../components/MatchTimer.vue'
import PointTagPicker from '../components/PointTagPicker.vue'
import ChaseLinePicker from '../components/ChaseLinePicker.vue'
import type { PointTag, Side, ChaseLine } from '../scoring/types'
import { useMatchStore } from '../stores/match'
import { shouldTriggerChasePlayoff } from '../scoring/engine'

const router = useRouter()
const matchStore = useMatchStore()

onMounted(() => {
  if (!matchStore.current) router.replace('/setup')
})

const match = computed(() => matchStore.current)

const showTagPicker = ref(false)
const pendingSide = ref<Side | null>(null)
const showChasePicker = ref(false)
const showEndConfirm = ref(false)

function tapSide(side: Side) {
  if (!match.value) return
  if (match.value.playoffActive) {
    // In playoff: tapping awards the chase to that side
    matchStore.dispatch({ type: 'awardPoint', side, tag: 'chase-won' })
    return
  }
  pendingSide.value = side
  showTagPicker.value = true
}

function onTagSelect(tag: PointTag) {
  if (pendingSide.value) {
    matchStore.dispatch({ type: 'awardPoint', side: pendingSide.value, tag })
  }
  showTagPicker.value = false
  pendingSide.value = null
}

function onTagCancel() {
  showTagPicker.value = false
  pendingSide.value = null
}

function onChaseSelect(payload: { line: ChaseLine; laidBy: Side }) {
  matchStore.dispatch({ type: 'layChase', line: payload.line, laidBy: payload.laidBy })
  showChasePicker.value = false
}

function undo() {
  matchStore.dispatch({ type: 'undo' })
}

function endMatch() {
  matchStore.endMatch()
  showEndConfirm.value = false
  router.push('/')
}

const chaseBadge = computed(() => {
  const n = match.value?.pendingChases.length ?? 0
  if (n === 0) return null
  if (n === 1) {
    const line = match.value!.pendingChases[0].line
    return `Chase: ${String(line).replace(/-/g, ' ')}`
  }
  return `${n} chases pending`
})

// Auto-trigger chase playoff when conditions are met
watch(
  () => match.value && shouldTriggerChasePlayoff(match.value),
  (v) => {
    if (v && match.value && match.value.config.autoChase) {
      // Show inline banner; user navigates via button or we could auto-push.
    }
  }
)

function goToPlayoff() {
  router.push('/playoff')
}

function pressLabel(side: Side): string {
  if (match.value?.playoffActive) return `Won by ${match.value.players[side]}`
  return match.value?.players[side] ?? side
}
</script>

<template>
  <div v-if="match" class="view scoring-view">
    <header class="view-header">
      <button class="btn btn-ghost" @click="router.push('/')">‹ Home</button>
      <MatchTimer :startedAt="match.startedAt" :endedAt="match.endedAt" />
      <button class="btn btn-ghost" @click="undo" title="Undo last point">↶ Undo</button>
    </header>

    <ScoreDisplay :match="match" />

    <div v-if="match.playoffActive" class="banner">
      Playing off chases — switch ends!
    </div>

    <div v-else-if="chaseBadge" class="chase-indicator">
      <span class="badge">{{ chaseBadge }}</span>
      <button
        v-if="shouldTriggerChasePlayoff(match)"
        class="btn btn-primary btn-small"
        @click="goToPlayoff"
      >
        Play off chases
      </button>
    </div>

    <div class="big-buttons">
      <BigButton
        :label="pressLabel('A')"
        :subtitle="match.playoffActive ? 'Award this chase' : 'Tap to score'"
        @click="tapSide('A')"
      />
      <BigButton
        :label="pressLabel('B')"
        :subtitle="match.playoffActive ? 'Award this chase' : 'Tap to score'"
        @click="tapSide('B')"
      />
    </div>

    <div class="action-row">
      <button class="btn" @click="showChasePicker = true" :disabled="match.playoffActive">
        Chase
      </button>
      <button class="btn" @click="undo">Undo</button>
      <button class="btn btn-danger" @click="showEndConfirm = true">End Match</button>
    </div>

    <PointTagPicker
      v-if="showTagPicker && pendingSide"
      :side="pendingSide"
      :playerName="match.players[pendingSide]"
      @select="onTagSelect"
      @cancel="onTagCancel"
    />

    <ChaseLinePicker
      v-if="showChasePicker"
      :players="match.players"
      @select="onChaseSelect"
      @cancel="showChasePicker = false"
    />

    <div v-if="showEndConfirm" class="modal-backdrop" @click.self="showEndConfirm = false">
      <div class="modal-sheet">
        <h3>End the match?</h3>
        <p class="muted">This will record the final score and return home.</p>
        <div class="row" style="gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-block" @click="showEndConfirm = false">Cancel</button>
          <button class="btn btn-danger btn-block" @click="endMatch">End Match</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="view center muted">Loading match…</div>
</template>

<style scoped>
.scoring-view {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}
.chase-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.big-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
  min-height: 0;
}
.big-buttons :deep(.big-button) {
  min-height: max(100px, 30vh);
}
.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}
.btn-small { min-height: 36px; padding: 0.3rem 0.7rem; font-size: 0.9rem; }
</style>

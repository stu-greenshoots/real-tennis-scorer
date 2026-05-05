<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Side } from '../scoring/types'
import { useMatchStore } from '../stores/match'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import { PAUL, OPPONENT_AVATARS } from '../lib/roster'

const router = useRouter()
const matchStore = useMatchStore()
const baseUrl = import.meta.env.BASE_URL

onMounted(() => {
  if (!matchStore.current) {
    router.replace('/')
    return
  }
  if (!matchStore.current.playoffActive && matchStore.current.pendingChases.length > 0) {
    matchStore.dispatch({ type: 'startChasePlayoff' })
  }
})

const match = computed(() => matchStore.current)
const currentChase = computed(() => match.value?.pendingChases[0])
const total = computed(() => match.value?.playoffRemaining ?? match.value?.pendingChases.length ?? 0)
const stepIndex = computed(() => {
  const m = match.value
  if (!m) return 0
  return Math.max(0, total.value - m.pendingChases.length)
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

function avatarB() {
  const avId = match.value?.avatars?.B
  if (!avId) return { id: 'opponent', bg: 'var(--accent)', silhouette: 'glasses' as const }
  return OPPONENT_AVATARS.find((o) => o.id === avId) ?? OPPONENT_AVATARS[0]
}
</script>

<template>
  <div v-if="match" class="view playoff-view">
    <CourtBackdrop :opacity="0.05" />
    <div class="content">
      <header class="hdr">
        <button class="btn btn-ghost" @click="router.push('/match')">‹ Match</button>
        <div class="kicker">Chase playoff</div>
        <div class="step muted small">{{ stepIndex + 1 }} / {{ total }}</div>
      </header>

      <!-- Paul-as-instructor -->
      <div class="instructor-row">
        <img :src="`${baseUrl}scenes/paul-instructor.png`" alt="Paul instructing" class="instructor-img" />
        <div class="speech">
          <div class="speech-tail" />
          <div class="speech-title">
            {{ stepIndex === 0
              ? `${total} chase${total > 1 ? 's' : ''} laid — switch ends and play them off!`
              : 'One more — same idea. Better the line, win the point.'
            }}
          </div>
          <div class="speech-sub">
            The receiver becomes the server. They try to land the ball further from the back wall than the marked line.
          </div>
        </div>
      </div>

      <!-- Ends switched -->
      <div class="ends-switched">
        <Portrait v-bind="PAUL" :size="38" />
        <svg class="swap" width="44" height="22" viewBox="0 0 44 22" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 7 H38" /><path d="M34 3 L38 7 L34 11" />
          <path d="M40 15 H6" /><path d="M10 19 L6 15 L10 11" />
        </svg>
        <Portrait v-bind="avatarB()" :size="38" />
        <div class="muted small">Ends switched — service end is now opposite.</div>
      </div>

      <div v-if="currentChase" class="chase-card">
        <div class="kicker">Now playing off</div>
        <div class="chase-line">{{ chaseLabel(currentChase.line) }}</div>
        <div class="muted small">Originally laid by {{ match.players[currentChase.laidBy] }}</div>
      </div>
      <div v-else class="card center muted">All chases resolved.</div>

      <div v-if="currentChase" class="outcome-buttons">
        <button class="outcome" @click="awardChase('A')">
          <Portrait v-bind="PAUL" :size="42" />
          <div class="outcome-text">
            <div class="outcome-label">{{ match.players.A }} wins</div>
            <div class="outcome-sub">Bettered the line</div>
          </div>
          <span class="chev">›</span>
        </button>
        <button class="outcome" @click="awardChase('B')">
          <Portrait v-bind="avatarB()" :size="42" />
          <div class="outcome-text">
            <div class="outcome-label">{{ match.players.B }} wins</div>
            <div class="outcome-sub">Bettered the line</div>
          </div>
          <span class="chev">›</span>
        </button>
      </div>

      <div class="step-dots" v-if="total > 1">
        <span
          v-for="i in total"
          :key="i"
          class="dot"
          :class="{ active: i - 1 === stepIndex }"
        />
      </div>
    </div>
  </div>
  <div v-else class="view center muted">No active match.</div>
</template>

<style scoped>
.playoff-view { padding: 0; }
.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
}
.hdr { display: flex; align-items: center; justify-content: space-between; }
.instructor-row { display: flex; align-items: flex-start; gap: 0.75rem; }
.instructor-img {
  width: 110px;
  height: auto;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(60,30,15,0.18));
}
.speech {
  flex: 1;
  position: relative;
  background: var(--surface-raised);
  padding: 0.7rem 0.8rem;
  border-radius: var(--radius-3);
  border: 1.5px solid var(--line-strong);
  box-shadow: var(--shadow-1);
}
.speech-tail {
  position: absolute;
  left: -8px;
  top: 22px;
  width: 14px;
  height: 14px;
  background: var(--surface-raised);
  border-left: 1.5px solid var(--line-strong);
  border-bottom: 1.5px solid var(--line-strong);
  transform: rotate(45deg);
}
.speech-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  line-height: 1.05;
  color: var(--primary);
}
.speech-sub { margin-top: 0.3rem; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; }
.ends-switched {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  background: var(--surface);
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-3);
}
.ends-switched .small { flex: 1; font-weight: 600; }
.chase-card {
  padding: 0.9rem;
  background: var(--surface-raised);
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-4);
  text-align: left;
}
.chase-line {
  font-family: var(--font-display);
  font-size: 2.2rem;
  line-height: 1;
  color: var(--text);
  text-transform: capitalize;
  margin-top: 0.2rem;
}
.outcome-buttons { display: flex; flex-direction: column; gap: 0.5rem; }
.outcome {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.8rem;
  border-radius: var(--radius-3);
  background: var(--surface);
  border: 1.5px solid var(--line);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  width: 100%;
}
.outcome:active { transform: scale(0.98); }
.outcome-text { flex: 1; }
.outcome-label { font-weight: 700; font-size: 0.95rem; color: var(--text); }
.outcome-sub { font-size: 0.75rem; color: var(--text-muted); }
.chev { color: var(--text-muted); font-size: 1.4rem; line-height: 1; }
.step-dots {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
}
.step-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--line-strong);
  transition: all 0.3s;
}
.step-dots .dot.active { width: 24px; background: var(--primary); }
</style>

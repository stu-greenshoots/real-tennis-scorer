<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMatchStore } from '../stores/match'
import { useHistoryStore } from '../stores/history'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import Glyphs from '../components/Glyphs.vue'

const router = useRouter()
const matchStore = useMatchStore()
const historyStore = useHistoryStore()
const { hasActiveMatch: canResume } = storeToRefs(matchStore)

const baseUrl = import.meta.env.BASE_URL
</script>

<template>
  <div class="view home-view">
    <CourtBackdrop :opacity="0.06" />
    <div class="home-content">
      <div class="hero">
        <img :src="`${baseUrl}scenes/paul-fullbody.png`" alt="Paul" class="hero-img" />
        <div class="hero-text">
          <div class="kicker">Paul's</div>
          <h1>Real Tennis<br />Scorer</h1>
          <p class="muted small">Score a match. Lay a chase. Switch ends. Win.</p>
        </div>
      </div>

      <div class="actions">
        <button v-if="canResume" class="btn btn-primary big-btn" @click="router.push('/match')">
          Resume match
        </button>
        <button class="btn big-btn" :class="canResume ? '' : 'btn-primary'" @click="router.push('/setup')">
          <Glyphs glyph="racquet" :size="22" />
          New match
        </button>
        <button class="btn big-btn" @click="router.push('/history')">
          History
          <span v-if="historyStore.matches.length" class="badge big-badge">{{ historyStore.matches.length }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view { padding: 0; }
.home-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  gap: 1rem;
  justify-content: space-between;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  padding-top: 1rem;
}
.hero-img {
  width: min(70%, 280px);
  height: auto;
  filter: drop-shadow(0 8px 24px rgba(60,30,15,0.18));
}
.hero-text { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.hero-text h1 {
  font-size: 3rem;
  line-height: 0.95;
  margin: 0.25rem 0 0.5rem;
  color: var(--text);
  text-align: center;
}
.actions { display: flex; flex-direction: column; gap: 0.7rem; }
.big-btn {
  width: 100%;
  height: 76px;
  font-size: 1.25rem;
  border-radius: 22px;
}
.big-btn :deep(svg) { width: 24px; height: 24px; }
.actions .badge {
  margin-left: auto;
  background: var(--primary);
  color: var(--primary-contrast);
}
.big-badge {
  font-size: 0.95rem;
  padding: 0.3rem 0.75rem;
}
</style>

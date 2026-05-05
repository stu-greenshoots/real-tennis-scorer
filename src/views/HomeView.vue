<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMatchStore } from '../stores/match'

const router = useRouter()
const matchStore = useMatchStore()
const { hasActiveMatch: canResume } = storeToRefs(matchStore)

function newMatch() {
  router.push('/setup')
}
function goHistory() {
  router.push('/history')
}
function resume() {
  router.push('/match')
}
</script>

<template>
  <div class="view home-view">
    <header class="hero">
      <h1>Paul's Real Tennis Scorer</h1>
      <p class="muted">Score a match. Lay a chase. Switch ends. Win.</p>
    </header>
    <div class="home-actions">
      <button class="btn btn-primary btn-tall" @click="newMatch">New Match</button>
      <button v-if="canResume" class="btn btn-tall" @click="resume">
        Resume Match
      </button>
      <button class="btn btn-tall" @click="goHistory">History</button>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  justify-content: space-between;
  padding-top: 2rem;
  padding-bottom: 2rem;
}
.hero {
  text-align: center;
  margin-top: 2rem;
}
.home-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}
.btn-tall {
  min-height: 64px;
  font-size: 1.1rem;
}
</style>

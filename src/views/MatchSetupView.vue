<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// TODO: swap to '../stores/match' once real store ships.
import { useMatchStore } from '../stores/match'

const router = useRouter()
const matchStore = useMatchStore()

const playerA = ref('')
const playerB = ref('')
const setsToWin = ref(2)
const gamesPerSet = ref(6)
const tiebreak = ref(false)
const autoChase = ref(true)

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function bumpSets(delta: number) {
  setsToWin.value = clamp(setsToWin.value + delta, 1, 3)
}
function bumpGames(delta: number) {
  gamesPerSet.value = clamp(gamesPerSet.value + delta, 4, 9)
}

function start() {
  const players = {
    A: playerA.value.trim() || 'Paul',
    B: playerB.value.trim() || 'Opponent',
  }
  matchStore.start(players, {
    setsToWin: setsToWin.value,
    gamesPerSet: gamesPerSet.value,
    tiebreak: tiebreak.value,
    autoChase: autoChase.value,
  })
  router.push('/match')
}
</script>

<template>
  <div class="view setup-view">
    <header class="view-header">
      <button class="btn btn-ghost" @click="router.push('/')">‹ Back</button>
      <h1>New Match</h1>
      <span></span>
    </header>

    <div class="card">
      <div class="field">
        <label for="playerA">Player A</label>
        <input id="playerA" v-model="playerA" type="text" placeholder="Paul" />
      </div>
      <div class="field" style="margin-top: 0.75rem">
        <label for="playerB">Player B</label>
        <input id="playerB" v-model="playerB" type="text" placeholder="Opponent" />
      </div>
    </div>

    <div class="card">
      <div class="row option">
        <div>
          <div>Sets to win</div>
          <div class="muted small">First to {{ setsToWin }} set{{ setsToWin === 1 ? '' : 's' }}</div>
        </div>
        <div class="stepper">
          <button @click="bumpSets(-1)" aria-label="decrease">−</button>
          <span class="value">{{ setsToWin }}</span>
          <button @click="bumpSets(1)" aria-label="increase">+</button>
        </div>
      </div>

      <div class="row option">
        <div>
          <div>Games per set</div>
          <div class="muted small">Range 4–9</div>
        </div>
        <div class="stepper">
          <button @click="bumpGames(-1)" aria-label="decrease">−</button>
          <span class="value">{{ gamesPerSet }}</span>
          <button @click="bumpGames(1)" aria-label="increase">+</button>
        </div>
      </div>

      <div class="row option">
        <div>
          <div>Tiebreak</div>
          <div class="muted small">Use a tiebreak at {{ gamesPerSet }}–{{ gamesPerSet }}</div>
        </div>
        <button
          class="toggle"
          :class="{ on: tiebreak }"
          @click="tiebreak = !tiebreak"
          :aria-pressed="tiebreak"
          aria-label="Toggle tiebreak"
        ></button>
      </div>

      <div class="row option">
        <div>
          <div>Auto chase mode</div>
          <div class="muted small">Auto-trigger chase playoff when chases pile up</div>
        </div>
        <button
          class="toggle"
          :class="{ on: autoChase }"
          @click="autoChase = !autoChase"
          :aria-pressed="autoChase"
          aria-label="Toggle auto chase"
        ></button>
      </div>
    </div>

    <button class="btn btn-primary btn-block btn-tall" @click="start">Start Match</button>
  </div>
</template>

<style scoped>
.option {
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border);
}
.option:last-child { border-bottom: none; }
.small { font-size: 0.8rem; }
.btn-tall { min-height: 56px; font-size: 1.05rem; }
</style>

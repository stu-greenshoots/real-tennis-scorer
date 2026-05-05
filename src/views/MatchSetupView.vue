<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '../stores/match'
import { PAUL, OPPONENT_AVATARS } from '../lib/roster'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import NumberSegment from '../components/NumberSegment.vue'
import ToggleRow from '../components/ToggleRow.vue'
import Glyphs from '../components/Glyphs.vue'

const router = useRouter()
const matchStore = useMatchStore()

const playerA = ref('Paul')
const playerB = ref('')
const avatarIdx = ref(-1)
const setsToWin = ref(2)
const gamesPerSet = ref(6)
const tiebreak = ref(true)
const autoChase = ref(true)

function start() {
  const players = {
    A: playerA.value.trim() || 'Paul',
    B: playerB.value.trim() || 'Opponent',
  }
  const avatars = {
    A: PAUL.id,
    B: avatarIdx.value >= 0 ? OPPONENT_AVATARS[avatarIdx.value].id : undefined,
  }
  matchStore.start(players, {
    setsToWin: setsToWin.value,
    gamesPerSet: gamesPerSet.value,
    tiebreak: tiebreak.value,
    autoChase: autoChase.value,
  }, avatars)
  router.push('/match')
}
</script>

<template>
  <div class="view setup-view">
    <CourtBackdrop :opacity="0.06" />
    <div class="content">
      <header class="hdr">
        <button class="btn btn-ghost" @click="router.push('/')">‹ Back</button>
      </header>

      <div class="title-block">
        <div class="kicker">New match</div>
        <h1>Who's playing?</h1>
      </div>

      <!-- Player A — Paul (locked card) -->
      <div class="player-block">
        <div class="field-label">Player A · host</div>
        <div class="player-card host">
          <Portrait :id="PAUL.id" :bg="PAUL.bg" :silhouette="PAUL.silhouette" :size="56" />
          <div class="player-name">
            <input v-model="playerA" type="text" placeholder="Paul" />
            <div class="hint">Service end starts here</div>
          </div>
          <div class="host-badge">HOST</div>
        </div>
      </div>

      <div class="vs-row">
        <span class="vs-line" />
        <span class="vs">vs</span>
        <span class="vs-line" />
      </div>

      <!-- Player B — name input + optional avatar -->
      <div class="player-block">
        <div class="field-label">Player B · opponent</div>
        <div class="player-card">
          <Portrait
            :id="avatarIdx >= 0 ? OPPONENT_AVATARS[avatarIdx].id : 'opponent'"
            :bg="avatarIdx >= 0 ? OPPONENT_AVATARS[avatarIdx].bg : 'var(--surface-sunken)'"
            :silhouette="avatarIdx >= 0 ? OPPONENT_AVATARS[avatarIdx].silhouette : 'long-hair-beard'"
            :size="56"
          />
          <div class="player-name">
            <input v-model="playerB" type="text" placeholder="Their name" />
            <div class="hint">Pick an avatar (optional)</div>
          </div>
        </div>
        <div class="avatar-carousel">
          <button
            class="avatar-pick"
            :class="{ active: avatarIdx === -1 }"
            @click="avatarIdx = -1"
            aria-label="No avatar"
          >
            <div class="avatar-empty">—</div>
          </button>
          <button
            v-for="(o, i) in OPPONENT_AVATARS"
            :key="o.id"
            class="avatar-pick"
            :class="{ active: avatarIdx === i }"
            @click="avatarIdx = i"
            :aria-label="`Avatar ${i + 1}`"
          >
            <Portrait :id="o.id" :bg="o.bg" :silhouette="o.silhouette" :size="56" />
          </button>
        </div>
      </div>

      <!-- Match settings -->
      <div class="settings">
        <div class="row settings-row">
          <NumberSegment label="Sets to win" v-model="setsToWin" :options="[1, 2, 3]" />
          <NumberSegment label="Games / set" v-model="gamesPerSet" :options="[4, 6]" />
        </div>
        <ToggleRow
          v-model="tiebreak"
          label="Tiebreak"
          sub="Resolve set at games-all + 1"
        />
        <ToggleRow
          v-model="autoChase"
          label="Auto-chase mode"
          sub="Engine handles end-switching for you"
        />
      </div>

      <div class="cta-row">
        <button class="btn btn-primary btn-lg btn-block" @click="start">
          <Glyphs glyph="racquet" :size="18" />
          Start match
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-view { padding: 0; }
.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem 1.25rem;
  gap: 0.85rem;
  overflow-y: auto;
}
.hdr { display: flex; }
.title-block { padding: 0; }
.title-block .kicker { color: var(--accent); }
.title-block h1 {
  margin-top: 0.15rem;
  font-size: 2.6rem;
  line-height: 0.95;
  color: var(--text);
}
.player-block { display: flex; flex-direction: column; gap: 0.5rem; }
.player-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  border-radius: var(--radius-3);
  background: var(--surface-raised);
  border: 1.5px solid var(--line);
}
.player-card.host { border-color: var(--primary); }
.player-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.player-name input {
  height: 36px;
  font-weight: 700;
  font-size: 1rem;
  border: 1px solid transparent;
  background: transparent;
  padding: 0 0.25rem;
}
.player-name input:focus {
  border-color: var(--line-strong);
  background: var(--surface);
}
.hint { font-size: 0.7rem; color: var(--text-muted); padding-left: 0.25rem; }
.host-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: var(--accent);
}
.vs-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: center;
}
.vs-line { flex: 1; max-width: 60px; height: 1px; background: var(--line); }
.vs {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--accent);
}
.avatar-carousel {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.avatar-pick {
  flex: 0 0 auto;
  scroll-snap-align: start;
  padding: 4px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-3);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s;
}
.avatar-pick.active { border-color: var(--primary); background: var(--surface-raised); }
.avatar-empty {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
  font-size: 1.5rem;
}
.settings { display: flex; flex-direction: column; gap: 0.6rem; }
.settings-row { gap: 1rem; }
.cta-row { padding-top: 0.5rem; }
</style>

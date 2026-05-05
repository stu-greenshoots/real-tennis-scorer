import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/setup', name: 'setup', component: () => import('./views/MatchSetupView.vue') },
  { path: '/scoring', name: 'scoring', component: () => import('./views/ScoringView.vue') },
  { path: '/chase-playoff', name: 'chase-playoff', component: () => import('./views/ChasePlayoffView.vue') },
  { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue') },
  { path: '/match/:id', name: 'match-detail', component: () => import('./views/MatchDetailView.vue'), props: true },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/real-tennis-scorer/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/192.png', 'icons/512.png', 'icons/maskable.png'],
      manifest: {
        name: "Paul's Real Tennis Scorer",
        short_name: "Paul's Tennis",
        description: 'Phone-first PWA for scoring real tennis matches between two players, with chase tracking and end-switching.',
        theme_color: '#6b1f1f',
        background_color: '#f7f1e6',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['sports', 'utilities'],
        start_url: '/real-tennis-scorer/',
        scope: '/real-tennis-scorer/',
        icons: [
          { src: 'icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})

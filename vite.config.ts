import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Nustatoma per BASE_PATH aplinkos kintamąjį CI/CD workflow'e, kai programėlė talpinama
// pošakyje (pvz. GitHub Pages projekto svetainė https://<user>.github.io/<repo>/).
// Lokaliai (npm run dev / npm run build be BASE_PATH) lieka šaknis '/'.
const basePath = process.env.BASE_PATH || '/'

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Baltarusijos karinė stebėsena',
        short_name: 'BY stebėsena',
        description: 'Ankstyvojo perspėjimo situacijos centras Lietuvai',
        lang: 'lt',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: `${basePath}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${basePath}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${basePath}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})

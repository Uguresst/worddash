import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Afsar Gym Lab'daki manifest ikonu kilidiyle aynı sebep: OS
      // install/splash sırasında bu ikonları ağdan okuyor, SW önbelleğinde
      // gereksiz yer kaplamasınlar.
      includeManifestIcons: false,
      manifest: {
        name: 'WordDash — Kelime Tekerleği',
        short_name: 'WordDash',
        description: 'Harf tekerleğinden İngilizce kelimeler kur, Türkçe ipuçlarıyla öğren, seviye atla ve jetonla tema aç.',
        lang: 'tr',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})

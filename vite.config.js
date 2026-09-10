import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: { swSrc: 'src/sw.js', swDest: 'dist/sw.js' },
      manifest: false, // on garde notre propre public/manifest.json tel quel
      injectRegister: false, // l'app enregistre déjà le service worker elle-même
    }),
  ],
})

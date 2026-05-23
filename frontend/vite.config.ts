import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api/, /^\/novaworkglobal-api/],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\.(?:mp4|webm)$/i,
            handler: 'NetworkOnly',
          }
        ]
      },
      devOptions: {
        enabled: false  // Disabled: service worker intercepts /api proxy calls in dev mode
      },
      manifest: {
        name: 'Ascendia',
        short_name: 'Ascendia',
        description: 'AI-Powered Career Transformation Platform',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: true,

    proxy: {
      '/api': {
        target: 'https://3.145.4.238.nip.io',
        changeOrigin: true,
        secure: false,
        timeout: 120000,
        rewrite: (path) => path.replace(/^\/api/, '/novaworkglobal-api/api'),
      },
      '/novaworkglobal-api': {
        target: 'https://3.145.4.238.nip.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/novaworkglobal-api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 🔒 Security: Disable source maps in production
  },
})

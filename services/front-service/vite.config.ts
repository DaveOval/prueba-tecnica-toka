import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/auth': {
        target: process.env.VITE_API_AUTH_URL?.replace('/api/auth', '') || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api/users': {
        target: process.env.VITE_API_USER_URL?.replace('/api/users', '') || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api/audit': {
        target: process.env.VITE_API_AUDIT_URL?.replace('/api/audit', '') || 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/api/ai': {
        target: process.env.VITE_API_AI_CHAT_URL?.replace('/api/ai', '') || 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          // Para documentos, usar vectorization-service
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (req.url?.includes('/documents')) {
              const vectorizationUrl = process.env.VITE_API_VECTORIZATION_URL?.replace('/api/ai', '') || 'http://localhost:3003';
              proxyReq.path = req.url;
              // Cambiar el target dinámicamente sería complejo, mejor manejar en el servicio
            }
          });
        },
      },
    },
  },
})

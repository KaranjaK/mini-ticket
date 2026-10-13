import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// The dev server proxies /tickets to Django, so no CORS setup is needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/tickets": "http://localhost:8000" } },
})

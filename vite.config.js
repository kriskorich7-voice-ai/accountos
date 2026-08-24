import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The /api/anthropic proxy runs as a Vercel serverless function in production.
// For local `vite dev`, requests to /api are handled by the platform; in pure
// local dev without vercel, the Copilot falls back gracefully.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});

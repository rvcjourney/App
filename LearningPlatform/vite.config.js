import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Load .env from repo root (App/) so one .env works for React Native app and LearningPlatform
const envDir = path.resolve(__dirname, '..')

// https://vite.dev/config/
export default defineConfig({
  envDir,
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})

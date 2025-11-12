// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // (주의) 버전이 들어간 alias는 제거하세요.
      // 예: 'lucide-react@0.487.0': 'lucide-react'  ← 이런 건 삭제
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    // 백엔드가 8000을 쓰니 충돌 피해서 기본(5173) 사용 권장
    port: 5173,
    open: true,
  },
})

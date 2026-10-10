import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    plugins: [
      vue(),
      AutoImport({ resolvers: [ElementPlusResolver()] }),
      Components({ resolvers: [ElementPlusResolver()] }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: true },
        '/ws': { target: env.VITE_API_TARGET || 'http://127.0.0.1:8000', ws: true, changeOrigin: true },
        '/static': { target: env.VITE_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
    css: {
      preprocessorOptions: { scss: { additionalData: `@use "@/styles/variables.scss" as *;` } },
    },
  }
})
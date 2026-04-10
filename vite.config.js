import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// 지역별 HTML 파일을 dist로 복사하는 플러그인
const REGION_HTML_FILES = [
  'hongdae.html',
  'seongsu.html',
  'itaewon.html',
  'euljiro.html',
  'apgujeong.html',
  'jamsil.html',
  'magok.html',
  'nowon.html',
  'gangnam.html',
  'cheonho.html',
]

function copyRegionHtmlFiles() {
  return {
    name: 'copy-region-html-files',
    closeBundle() {
      REGION_HTML_FILES.forEach(file => {
        fs.copyFileSync(
          resolve(__dirname, file),
          resolve(__dirname, 'dist', file)
        )
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyRegionHtmlFiles()],
})

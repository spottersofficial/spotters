import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

function copyHongdaeHtml() {
  return {
    name: 'copy-hongdae-html',
    closeBundle() {
      fs.copyFileSync(
        resolve(__dirname, 'hongdae.html'),
        resolve(__dirname, 'dist/hongdae.html')
      )
    }
  }
}

export default defineConfig({
  plugins: [react(), copyHongdaeHtml()],
})

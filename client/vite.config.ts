import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The port the API listens on, taken from the repository root .env — the same
 * file, and the same precedence, the server itself uses at boot. Reading it
 * rather than repeating the number is what stops the two drifting apart the
 * next time it changes.
 *
 * Parsed by hand instead of through Vite's loadEnv() because that pulls in
 * every key, and NODE_ENV among them makes Vite warn on each build. One value
 * is all that is wanted here anyway: the database password and the JWT secret
 * in that file have no business in a bundle the browser downloads.
 */
function apiPort(): string {
  if (process.env.PORT) {
    return process.env.PORT
  }

  try {
    const file = readFileSync(resolve(here, '..', '.env'), 'utf8')
    const match = file.match(/^\s*PORT\s*=\s*"?(\d+)"?/m)

    if (match) {
      return match[1]
    }
  } catch {
    // No .env at all, which is what a fresh checkout looks like.
  }

  // What main.ts falls back to when PORT is unset.
  return '3000'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __API_URL__: JSON.stringify(`http://localhost:${apiPort()}`),
  },
})

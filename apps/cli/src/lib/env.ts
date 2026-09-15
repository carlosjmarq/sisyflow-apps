import { config as loadDotenv } from 'dotenv'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fail } from './errors.js'

const here = path.dirname(fileURLToPath(import.meta.url))
export const packageRoot = path.resolve(here, '..', '..')

export interface EnvConfig {
  url: string
  publishableKey: string
}

const DEFAULT_ENV_FILES = [
  path.join(os.homedir(), '.sisyflow', '.env'),
  path.join(packageRoot, '.env'),
  path.resolve(packageRoot, '..', 'desktop', '.env'),
]

export function loadEnv(envFile?: string): void {
  const files = envFile ? [path.resolve(envFile)] : DEFAULT_ENV_FILES
  for (const file of files) {
    loadDotenv({ path: file })
  }
}

export function getEnv(): EnvConfig {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    fail(
      'Faltan SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY. Configúralas en ~/.sisyflow/.env, ' +
        'en apps/cli/.env, en apps/desktop/.env o con variables de entorno ' +
        '(ver apps/cli/.env.example).',
    )
  }
  return { url, publishableKey }
}
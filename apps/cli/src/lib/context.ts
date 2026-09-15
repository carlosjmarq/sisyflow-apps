import type { Command } from 'commander'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase.js'
import { getClient, requireSession } from './client.js'
import { loadEnv } from './env.js'

export interface GlobalOptions {
  json?: boolean
  yes?: boolean
  envFile?: string
  email?: string
  password?: string
}

export interface CliContext {
  json: boolean
  yes: boolean
  client: SupabaseClient<Database>
  session: Session
}

export async function getContext(cmd: Command): Promise<CliContext> {
  const opts = (cmd.optsWithGlobals() ?? {}) as GlobalOptions
  if (opts.envFile) loadEnv(opts.envFile)
  const session = await requireSession({ email: opts.email, password: opts.password })
  return {
    json: !!opts.json,
    yes: !!opts.yes,
    client: getClient(),
    session,
  }
}
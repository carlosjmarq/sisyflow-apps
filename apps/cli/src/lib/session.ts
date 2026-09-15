import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Session } from '@supabase/supabase-js'

export interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number | null
  user: { id: string; email?: string } | null
}

const SESSION_DIR = path.join(os.homedir(), '.sisyflow')
const SESSION_FILE = path.join(SESSION_DIR, 'session.json')

export function sessionPath(): string {
  return SESSION_FILE
}

export function saveSessionData(session: Session): StoredSession {
  const stored: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? null,
    user: session.user ? { id: session.user.id, email: session.user.email } : null,
  }
  fs.mkdirSync(SESSION_DIR, { recursive: true })
  fs.writeFileSync(SESSION_FILE, JSON.stringify(stored, null, 2), { encoding: 'utf-8', mode: 0o600 })
  try {
    fs.chmodSync(SESSION_FILE, 0o600)
  } catch {
    // Windows ignora chmod; el resto de plataformas lo aplican
  }
  return stored
}

export function loadStoredSession(): StoredSession | null {
  try {
    const raw = fs.readFileSync(SESSION_FILE, 'utf-8')
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function clearSessionData(): void {
  try {
    fs.rmSync(SESSION_FILE, { force: true })
  } catch {
    // ya no existe
  }
}

export function isExpired(expiresAt: number | null): boolean {
  if (expiresAt === null || expiresAt === undefined) return false
  return expiresAt * 1000 - Date.now() < 60_000
}
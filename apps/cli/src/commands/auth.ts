import readline from 'node:readline'
import type { Command } from 'commander'
import pc from 'picocolors'
import { getClient } from '../lib/client.js'
import { getContext, type GlobalOptions } from '../lib/context.js'
import { fail } from '../lib/errors.js'
import { clearSessionData, saveSessionData, sessionPath } from '../lib/session.js'

async function prompt(question: string, hideInput = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  if (hideInput) {
    const output = rl as unknown as { _writeToOutput: (str: string) => void }
    const original = output._writeToOutput.bind(rl)
    output._writeToOutput = (str: string) => original(str.replace(/[\s\S]/g, '*'))
  }
  const answer = await new Promise<string>((resolve) => rl.question(question, resolve))
  if (hideInput) process.stdout.write('\n')
  rl.close()
  return answer
}

export function registerAuth(program: Command): void {
  program
    .command('login')
    .description('Inicia sesión en Supabase (email/contraseña) y guarda la sesión en ~/.sisyflow')
    .action(async (_options: Record<string, unknown>, command: Command) => {
      const opts = (command.optsWithGlobals() ?? {}) as GlobalOptions
      const email = opts.email ?? process.env.SISYFLOW_EMAIL ?? (await prompt('Email: '))
      const password =
        opts.password ?? process.env.SISYFLOW_PASSWORD ?? (await prompt('Contraseña: ', true))
      if (!email.trim() || !password) fail('Email y contraseña son obligatorios', 2)

      const supabase = getClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) fail(`No se pudo iniciar sesión: ${error.message}`)
      saveSessionData(data.session)
      console.log(pc.green(`Sesión iniciada como ${data.session.user.email ?? email}`))
      console.log(`Sesión guardada en ${sessionPath()}`)
    })

  program
    .command('logout')
    .description('Cierra la sesión guardada')
    .action(() => {
      clearSessionData()
      console.log('Sesión cerrada.')
    })

  program
    .command('whoami')
    .description('Muestra el usuario autenticado')
    .action(async (_options: Record<string, unknown>, command: Command) => {
      const { client } = await getContext(command)
      const { data } = await client.auth.getUser()
      if (data.user) {
        console.log(data.user.email ?? data.user.id)
      } else {
        fail('No hay sesión activa.')
      }
    })
}
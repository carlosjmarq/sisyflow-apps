#!/usr/bin/env node
import fs from 'node:fs'
import { CommanderError, program } from 'commander'
import pc from 'picocolors'
import { registerAuth } from './commands/auth.js'
import { registerEpic } from './commands/epic.js'
import { registerImport } from './commands/import.js'
import { registerProject } from './commands/project.js'
import { registerTodo } from './commands/todo.js'
import { loadEnv } from './lib/env.js'
import { CliError } from './lib/errors.js'

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as {
  version: string
}

program
  .name('sisyflow')
  .description('CLI de SisyFlow: CRUD de épicas, proyectos y tareas contra Supabase')
  .version(pkg.version)
  .option('--json', 'Salida en formato JSON (parseable por scripts)')
  .option('--yes', 'Confirma operaciones destructivas')
  .option('--env-file <path>', 'Ruta alternativa al archivo .env')
  .option('--email <email>', 'Email para autenticación (scripts)')
  .option('--password <password>', 'Contraseña para autenticación (scripts)')
  .showHelpAfterError('(ejecuta sisyflow help para ver todos los comandos)')
  .hook('preAction', (_thisCommand, actionCommand) => {
    const opts = (actionCommand.optsWithGlobals() ?? {}) as { envFile?: string }
    loadEnv(opts.envFile)
  })

registerAuth(program)
registerEpic(program)
registerProject(program)
registerTodo(program)
registerImport(program)

program.command('help').description('Muestra ayuda de sisyflow').action(() => {
  program.help()
})

program.action(() => {
  program.help()
})

program.exitOverride()

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv)
  } catch (err) {
    if (err instanceof CommanderError) {
      process.exitCode = err.exitCode === 0 ? 0 : 2
      return
    }
    if (err instanceof CliError) {
      console.error(pc.red(err.message))
      process.exitCode = err.exitCode
      return
    }
    console.error(err)
    process.exitCode = 1
  }
}

void main()
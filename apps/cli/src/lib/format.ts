import pc from 'picocolors'

export interface Column {
  key: string
  label: string
}

export interface OutputContext {
  json: boolean
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

export function printTable(columns: Column[], rows: Record<string, string>[]): void {
  if (rows.length === 0) {
    console.log('(sin resultados)')
    return
  }
  const widths = columns.map((col) =>
    Math.max(col.label.length, ...rows.map((row) => (row[col.key] ?? '').length)),
  )
  const line = (cells: string[]): string =>
    cells.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd()

  console.log(line(columns.map((col) => pc.bold(col.label))))
  for (const row of rows) {
    console.log(line(columns.map((col) => row[col.key] ?? '')))
  }
}

export function printRecord(fields: [string, string][]): void {
  if (fields.length === 0) return
  const width = Math.max(...fields.map(([label]) => label.length))
  for (const [label, value] of fields) {
    console.log(`${pc.bold(label.padEnd(width))}  ${value}`)
  }
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function emit(ctx: OutputContext, jsonData: unknown, columns?: Column[], rows?: Record<string, string>[]): void {
  if (ctx.json) {
    printJson(jsonData)
  } else if (rows && columns) {
    printTable(columns, rows)
  } else {
    printJson(jsonData)
  }
}
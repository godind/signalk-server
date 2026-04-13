const ANSI = {
  reset: '\u001b[0m',
  cyan: '\u001b[36m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  orange: '\u001b[38;5;208m',
  red: '\u001b[31m',
  gray: '\u001b[90m'
}

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'
export type DiagnosticsMode = 'off' | 'context' | 'payload'

const LOG_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  success: 20,
  warn: 30,
  error: 40
}

const LOG_COLORS: Record<LogLevel, keyof typeof ANSI> = {
  debug: 'gray',
  info: 'cyan',
  success: 'green',
  warn: 'yellow',
  error: 'red'
}

type EmittedLineState = {
  signature: string
  repeatCount: number
}

let lastLineState: EmittedLineState | undefined
let repeatSummaryVisible = false

type RenderedLine = {
  prefix: string
  rendered: string
  color: keyof typeof ANSI
}

type ActivityEntry =
  | {
    channel: 'log'
    level: LogLevel
    event: string
    message: string
    fields?: Record<string, unknown>
  }
  | {
    channel: 'context' | 'payload'
    event: string
    message: string
    fields?: Record<string, unknown>
  }

function colorize(text: string, color: keyof typeof ANSI): string {
  return `${ANSI[color]}${text}${ANSI.reset}`
}

function formatFieldValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

function getDiagnosticsMode(): DiagnosticsMode {
  const raw = (process.env.SK_SMOKE_DIAGNOSTICS ?? 'off').toLowerCase()

  if (raw === 'off') {
    return 'off'
  }
  if (raw === 'context') {
    return 'context'
  }
  if (raw === 'payload') {
    return 'payload'
  }

  if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on') {
    return 'context'
  }

  return 'off'
}

function getConfiguredMinimumLevel(): LogLevel {
  const configured = process.env.SK_SMOKE_LOG_LEVEL
  if (configured === 'debug') {
    return 'debug'
  }
  if (configured === 'info') {
    return 'info'
  }
  if (configured === 'warn') {
    return 'warn'
  }
  if (configured === 'error') {
    return 'error'
  }

  if ((process.env.SK_SMOKE_VERBOSE ?? 'true') === 'false') {
    return 'info'
  }

  return 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LOG_PRIORITY[level] >= LOG_PRIORITY[getConfiguredMinimumLevel()]
}

function renderLine(
  header: string,
  fields?: Record<string, unknown>
): string {
  const fieldText = fields
    ? Object.entries(fields)
      .map(([key, value]) => `${key}=${formatFieldValue(value)}`)
      .join(' ')
    : ''

  return fieldText.length > 0 ? `${header} ${fieldText}` : header
}

function writeLine(rendered: string, color: keyof typeof ANSI): void {
  console.log(colorize(rendered, color))
}

function renderWithColoredPrefix(
  prefix: string,
  rendered: string,
  color: keyof typeof ANSI
): string {
  if (rendered === prefix) {
    return colorize(prefix, color)
  }

  return `${colorize(prefix, color)}${rendered.slice(prefix.length)}`
}

function renderRepeatSummary(count: number): string {
  return `[INFO][log] Repeat count: ${count}`
}

function repeatSummaryPrefix(): string {
  return '[INFO][log]'
}

function shouldEmitRepeatSummary(): boolean {
  return shouldLog('info')
}

function updateRepeatSummaryInline(count: number): void {
  if (!shouldEmitRepeatSummary()) {
    return
  }

  if (!process.stdout.isTTY) {
    return
  }

  const rendered = renderWithColoredPrefix(
    repeatSummaryPrefix(),
    renderRepeatSummary(count),
    'blue'
  )
  process.stdout.write(`\r\u001b[2K${rendered}`)
  repeatSummaryVisible = true
}

function finalizeRepeatSummaryLine(): void {
  if (!repeatSummaryVisible) {
    return
  }

  process.stdout.write('\n')
  repeatSummaryVisible = false
}

function flushRepeatSummary(): void {
  if (!lastLineState || lastLineState.repeatCount === 1) {
    return
  }

  if (!shouldEmitRepeatSummary()) {
    repeatSummaryVisible = false
    lastLineState = {
      signature: lastLineState.signature,
      repeatCount: 1
    }
    return
  }

  if (process.stdout.isTTY) {
    finalizeRepeatSummaryLine()
  } else {
    writeLine(renderRepeatSummary(lastLineState.repeatCount), 'blue')
  }

  lastLineState = {
    signature: lastLineState.signature,
    repeatCount: 1
  }
}

function emitRenderedBlock(lines: RenderedLine[], signature: string): void {
  if (lines.length === 0) {
    return
  }

  if (lastLineState && lastLineState.signature === signature) {
    lastLineState.repeatCount += 1

    if (lastLineState.repeatCount > 1) {
      updateRepeatSummaryInline(lastLineState.repeatCount)
    }

    return
  }

  flushRepeatSummary()

  for (const line of lines) {
    console.log(renderWithColoredPrefix(line.prefix, line.rendered, line.color))
  }

  lastLineState = {
    signature,
    repeatCount: 1
  }
}

function emitLine(
  level: LogLevel,
  event: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  const prefix = `[${level.toUpperCase()}][${event}]`
  const signature = renderLine(`${prefix} ${message}`, fields)

  emitRenderedBlock([
    {
      prefix,
      rendered: signature,
      color: LOG_COLORS[level]
    }
  ], signature)
}

function emitDiagnosticLine(
  channel: 'CONTEXT' | 'PAYLOAD',
  event: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  const prefix = `[${channel}][${event}]`
  const signature = renderLine(`${prefix} ${message}`, fields)
  const color = channel === 'CONTEXT' ? 'orange' : 'gray'
  emitRenderedBlock([
    {
      prefix,
      rendered: signature,
      color
    }
  ], signature)
}

function renderActivityEntry(entry: ActivityEntry): RenderedLine | undefined {
  if (entry.channel === 'log') {
    if (!shouldLog(entry.level)) {
      return undefined
    }

    const prefix = `[${entry.level.toUpperCase()}][${entry.event}]`

    return {
      prefix,
      rendered: renderLine(`${prefix} ${entry.message}`, entry.fields),
      color: LOG_COLORS[entry.level]
    }
  }

  const diagnosticsMode = getDiagnosticsMode()
  if (entry.channel === 'context' && diagnosticsMode === 'off') {
    return undefined
  }
  if (entry.channel === 'payload' && diagnosticsMode !== 'payload') {
    return undefined
  }

  const prefix = `[${entry.channel.toUpperCase()}][${entry.event}]`

  return {
    prefix,
    rendered: renderLine(`${prefix} ${entry.message}`, entry.fields),
    color: entry.channel === 'context' ? 'orange' : 'gray'
  }
}

export function log(
  level: LogLevel,
  event: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  if (!shouldLog(level)) {
    return
  }

  emitLine(level, event, message, fields)
}

export function logAlways(
  level: LogLevel,
  event: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  emitLine(level, event, message, fields)
}

export function logActivity(entries: ActivityEntry[]): void {
  const hasVisibleBaseLog = entries.some(
    (entry) => entry.channel === 'log' && shouldLog(entry.level)
  )

  if (!hasVisibleBaseLog) {
    return
  }

  const lines = entries
    .map((entry) => renderActivityEntry(entry))
    .filter((entry): entry is RenderedLine => entry !== undefined)

  const signature = lines.map((line) => line.rendered).join('\n')
  emitRenderedBlock(lines, signature)
}

export function logDiagnosticContext(
  event: string,
  message: string,
  fields: Record<string, unknown>
): void {
  const mode = getDiagnosticsMode()
  if (mode !== 'context' && mode !== 'payload') {
    return
  }

  emitDiagnosticLine('CONTEXT', event, message, fields)
}

export function logDiagnosticPayload(
  event: string,
  message: string,
  fields: Record<string, unknown>
): void {
  if (getDiagnosticsMode() !== 'payload') {
    return
  }

  emitDiagnosticLine('PAYLOAD', event, message, fields)
}

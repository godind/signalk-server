const ANSI = {
  reset: '\u001b[0m',
  cyan: '\u001b[36m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  gray: '\u001b[90m'
}

const LOG_PREFIX = '[smoke]'

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

const LOG_COLORS: Record<LogLevel, keyof typeof ANSI> = {
  debug: 'gray',
  info: 'cyan',
  success: 'green',
  warn: 'yellow',
  error: 'red'
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

export function log(
  level: LogLevel,
  event: string,
  message: string,
  fields?: Record<string, unknown>
): void {
  if (level === 'debug' && (process.env.SK_SMOKE_VERBOSE ?? 'true') === 'false') {
    return
  }

  const header = `${LOG_PREFIX}[${level.toUpperCase()}][${event}] ${message}`
  const fieldText = fields
    ? Object.entries(fields)
        .map(([key, value]) => `${key}=${formatFieldValue(value)}`)
        .join(' ')
    : ''
  const line = fieldText.length > 0 ? `${header} ${fieldText}` : header
  console.log(colorize(line, LOG_COLORS[level]))
}

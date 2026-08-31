import type { AnsiFormattedChunk } from '../types/index.js'

export function sanitizeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const ANSI_COLOR_MAP: Record<number, string> = {
  1: 'ansi-bold',
  2: 'ansi-dim',
  3: 'ansi-italic',
  4: 'ansi-underline',
  30: 'ansi-black',
  31: 'ansi-red',
  32: 'ansi-green',
  33: 'ansi-yellow',
  34: 'ansi-blue',
  35: 'ansi-magenta',
  36: 'ansi-cyan',
  37: 'ansi-white',
  90: 'ansi-bright-black',
  91: 'ansi-bright-red',
  92: 'ansi-bright-green',
  93: 'ansi-bright-yellow',
  94: 'ansi-bright-blue',
  95: 'ansi-bright-magenta',
  96: 'ansi-bright-cyan',
  97: 'ansi-bright-white',
  40: 'ansi-bg-black',
  41: 'ansi-bg-red',
  42: 'ansi-bg-green',
  43: 'ansi-bg-yellow',
  44: 'ansi-bg-blue',
  45: 'ansi-bg-magenta',
  46: 'ansi-bg-cyan',
  47: 'ansi-bg-white',
}

export function parseAnsiCodes(
  rawText: string,
  theme: 'light' | 'dark' = 'dark'
): AnsiFormattedChunk[] {
  if (!rawText) return []

  const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light'
  const chunks: AnsiFormattedChunk[] = []
  const ansiRegex = /\u001b\[([0-9;]*)m/g

  let activeStyles = new Set<string>()
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = ansiRegex.exec(rawText)) !== null) {
    const textSegment = rawText.slice(lastIndex, match.index)
    if (textSegment.length > 0) {
      const classes = Array.from(activeStyles).concat(themeClass).join(' ')
      chunks.push({
        rawText: textSegment,
        cssClass: classes.trim() || `ansi-default ${themeClass}`,
      })
    }

    const codeStr = match[1]
    if (!codeStr || codeStr === '0') {
      activeStyles.clear()
    } else {
      const codes = codeStr.split(';').map((c) => parseInt(c, 10))
      for (const code of codes) {
        if (code === 0) {
          activeStyles.clear()
        } else if (ANSI_COLOR_MAP[code]) {
          activeStyles.add(ANSI_COLOR_MAP[code])
        }
      }
    }

    lastIndex = ansiRegex.lastIndex
  }

  const remaining = rawText.slice(lastIndex)
  if (remaining.length > 0) {
    const classes = Array.from(activeStyles).concat(themeClass).join(' ')
    chunks.push({
      rawText: remaining,
      cssClass: classes.trim() || `ansi-default ${themeClass}`,
    })
  }

  return chunks
}

export function formatAnsiToHtml(ansiText: string, isDarkTheme = true): string {
  const theme = isDarkTheme ? 'dark' : 'light'
  const chunks = parseAnsiCodes(ansiText, theme)

  return chunks
    .map((chunk) => {
      const escaped = sanitizeHtml(chunk.rawText)
      return `<span class="${sanitizeHtml(chunk.cssClass)}">${escaped}</span>`
    })
    .join('')
}

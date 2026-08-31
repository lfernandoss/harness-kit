import { describe, it, expect } from 'vitest'
import { formatAnsiToHtml, parseAnsiCodes, sanitizeHtml } from '../ansiParser.js'

describe('1.1 AnsiFormattedChunk & 1.2 formatAnsiToHtml', () => {
  it('Should escape raw HTML tags in terminal logs to prevent script injection', () => {
    const malicious = '<script>alert("xss")</script><img src="x" onerror="steal()"/>'
    const sanitized = sanitizeHtml(malicious)

    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('&lt;script&gt;')
    expect(sanitized).toContain('&lt;img')
  })

  it('Should convert standard ANSI escape sequences into structured styled span segments', () => {
    // Red text + Reset: \u001b[31mError text\u001b[0m
    const rawAnsi = '\u001b[31mError encountered\u001b[0m Normal text'
    const chunks = parseAnsiCodes(rawAnsi, 'dark')

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    const redChunk = chunks.find((c) => c.rawText.includes('Error encountered'))
    expect(redChunk).toBeDefined()
    expect(redChunk?.cssClass).toContain('ansi-red')

    const normalChunk = chunks.find((c) => c.rawText.includes('Normal text'))
    expect(normalChunk).toBeDefined()
  })

  it('Should apply light theme color classes when theme mode is light', () => {
    const rawAnsi = '\u001b[32mSuccess\u001b[0m'
    const chunks = parseAnsiCodes(rawAnsi, 'light')

    expect(chunks[0].cssClass).toContain('ansi-green')
    expect(chunks[0].cssClass).toContain('theme-light')
  })

  it('Should apply dark theme color classes when theme mode is dark', () => {
    const rawAnsi = '\u001b[32mSuccess\u001b[0m'
    const chunks = parseAnsiCodes(rawAnsi, 'dark')

    expect(chunks[0].cssClass).toContain('ansi-green')
    expect(chunks[0].cssClass).toContain('theme-dark')
  })

  it('Should format full ANSI text to HTML string with escaped entities', () => {
    const rawAnsi = '\u001b[33mWarning: <config> missing\u001b[0m'
    const html = formatAnsiToHtml(rawAnsi, true) // dark theme

    expect(html).toContain('&lt;config&gt;')
    expect(html).not.toContain('<config>')
    expect(html).toContain('class="')
    expect(html).toContain('ansi-yellow')
  })

  it('Should handle unclosed ANSI styling sequences gracefully without breaking formatting', () => {
    const rawAnsi = '\u001b[1m\u001b[34mUnclosed bold blue text'
    const chunks = parseAnsiCodes(rawAnsi, 'dark')

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].rawText).toBe('Unclosed bold blue text')
    expect(chunks[0].cssClass).toContain('ansi-bold')
    expect(chunks[0].cssClass).toContain('ansi-blue')
  })
})

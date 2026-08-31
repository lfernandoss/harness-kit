import type { LogChunkDTO } from '../../../types/index.js'
import { formatAnsiToHtml, sanitizeHtml } from '../../../utils/ansiParser.js'

export interface LiveLogConsoleProps {
  lines: LogChunkDTO[]
  autoScroll?: boolean
  isDarkTheme?: boolean
}

export class LiveLogConsoleStateManager {
  private _lines: LogChunkDTO[] = []
  private _autoScroll = true
  private maxLines: number
  private listeners = new Set<() => void>()

  constructor(options?: { maxLines?: number; autoScroll?: boolean }) {
    this.maxLines = options?.maxLines ?? 2000
    this._autoScroll = options?.autoScroll ?? true
  }

  get lines(): LogChunkDTO[] {
    return this._lines
  }

  get autoScroll(): boolean {
    return this._autoScroll
  }

  handleUserScroll(isAtBottom: boolean): void {
    if (this._autoScroll !== isAtBottom) {
      this._autoScroll = isAtBottom
      this.notify()
    }
  }

  appendLine(chunk: LogChunkDTO): void {
    this._lines.push(chunk)
    if (this._lines.length > this.maxLines) {
      this._lines.shift()
    }
    this.notify()
  }

  appendLines(chunks: LogChunkDTO[]): void {
    for (const chunk of chunks) {
      this._lines.push(chunk)
      if (this._lines.length > this.maxLines) {
        this._lines.shift()
      }
    }
    this.notify()
  }

  clear(): void {
    this._lines = []
    this.notify()
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export function renderLiveLogConsole(props: LiveLogConsoleProps): string {
  const isDark = props.isDarkTheme ?? true
  const autoScroll = props.autoScroll ?? true
  const lines = props.lines || []

  const formattedLinesHtml = lines
    .map((chunk, idx) => {
      const isStderr = chunk.stream === 'stderr'
      const formattedText = formatAnsiToHtml(chunk.text, isDark)
      return `
        <div class="terminal-line ${isStderr ? 'line-stderr' : 'line-stdout'}" data-index="${idx}">
          <span class="stream-indicator">${isStderr ? '[err]' : '[out]'}</span>
          <span class="line-content">${formattedText}</span>
        </div>
      `.trim()
    })
    .join('\n')

  return `
<div class="live-log-console-container">
  <div class="console-header">
    <div class="console-title">
      <span class="terminal-icon">💻</span>
      <span>Terminal Log Output</span>
    </div>
    <div class="console-controls">
      <label class="auto-scroll-toggle">
        <input
          type="checkbox"
          class="input-auto-scroll"
          ${autoScroll ? 'checked' : ''}
        />
        <span>Auto-scroll</span>
      </label>
      <button type="button" class="btn-clear-console" title="Clear logs">Clear</button>
    </div>
  </div>

  <div
    class="live-log-console ${isDark ? 'theme-dark' : 'theme-light'}"
    role="log"
    aria-live="polite"
    data-autoscroll="${autoScroll ? 'true' : 'false'}"
  >
    ${formattedLinesHtml || '<div class="terminal-empty">Waiting for runner output...</div>'}
  </div>
</div>
`.trim()
}

export const LiveLogConsole = renderLiveLogConsole

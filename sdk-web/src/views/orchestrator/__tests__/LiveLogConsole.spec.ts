import { describe, it, expect } from 'vitest'
import { renderLiveLogConsole, LiveLogConsoleStateManager } from '../components/LiveLogConsole.js'
import type { LogChunkDTO } from '../../../types/index.js'

describe('1.3 LiveLogConsole component & state manager', () => {
  it('Should render streaming log chunks in real-time within a container', () => {
    const lines: LogChunkDTO[] = [
      { stream: 'stdout', text: 'Initializing orchestrator...' },
      { stream: 'stdout', text: 'Entering Phase BOOTSTRAP' },
      { stream: 'stderr', text: 'Warning: minor warning' },
    ]

    const html = renderLiveLogConsole({
      lines,
      autoScroll: true,
      isDarkTheme: true,
    })

    expect(html).toContain('Initializing orchestrator...')
    expect(html).toContain('Entering Phase BOOTSTRAP')
    expect(html).toContain('Warning: minor warning')
    expect(html).toContain('live-log-console')
  })

  it('Should manage autoScroll state and handle scroll-lock pause and resume', () => {
    const manager = new LiveLogConsoleStateManager()
    expect(manager.autoScroll).toBe(true)

    // When user manually scrolls up
    manager.handleUserScroll(false)
    expect(manager.autoScroll).toBe(false)

    // When user scrolls back to bottom
    manager.handleUserScroll(true)
    expect(manager.autoScroll).toBe(true)
  })

  it('Should append logs and maintain max buffer size', () => {
    const manager = new LiveLogConsoleStateManager({ maxLines: 100 })
    for (let i = 0; i < 150; i++) {
      manager.appendLine({ stream: 'stdout', text: `Log ${i}` })
    }

    expect(manager.lines.length).toBe(100)
    expect(manager.lines[0].text).toBe('Log 50')
    expect(manager.lines[99].text).toBe('Log 149')
  })
})

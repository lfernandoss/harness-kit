import { describe, it, expect } from 'vitest'
import { renderOrchestrationDashboardView } from '../OrchestrationDashboardView.js'
import { Phase, RunMode } from '../../../types/index.js'
import type { LiveSessionState } from '../../../types/index.js'




describe('1.1 OrchestrationDashboardView component', () => {
  it('Should render RunnerConfigCard when session is null (idle/not running)', () => {
    const html = renderOrchestrationDashboardView({
      session: null,
      isRunning: false,
    })

    expect(html).toContain('orchestration-dashboard')
    expect(html).toContain('runner-config-card')
    expect(html).toContain('claude-cli')
  })

  it('Should render LiveExecutionView (PhaseTimeline, TelemetryCards, LiveLogConsole) when session is running', () => {
    const session: LiveSessionState = {
      jobId: 'job-1234',
      status: 'running',
      currentPhase: Phase.DEVELOPMENT,
      logs: [{ stream: 'stdout', text: 'Executing test suite...' }],
      isConnected: true,
      telemetry: { tokensUsed: 50000, costEstimate: 0.15 },
    }

    const html = renderOrchestrationDashboardView({
      session,
      isRunning: true,
    })

    expect(html).toContain('live-execution-view')
    expect(html).toContain('phase-timeline')
    expect(html).toContain('telemetry-cards')
    expect(html).toContain('live-log-console')
    expect(html).toContain('Executing test suite...')
  })

  it('Should render conflict notification when workspace conflict error occurs', () => {
    const html = renderOrchestrationDashboardView({
      session: null,
      isRunning: false,
      conflictError: {
        message: 'Workspace is already locked by another running job: job-abc-123',
        activeJobId: 'job-abc-123',
      },
    })

    expect(html).toContain('conflict-banner')
    expect(html).toContain('Workspace is already locked')
    expect(html).toContain('job-abc-123')
  })
})

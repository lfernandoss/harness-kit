import { describe, it, expect } from 'vitest'
import {
  renderTelemetryDashboardView,
  TelemetryDashboardView,
} from '../TelemetryDashboardView.js'
import type { ProductReport } from '../../types/telemetry.js'

describe('1.3 & 3.1 Views — TelemetryDashboardView (T06)', () => {
  const dummyReport: ProductReport = {
    backlogSummary: {
      total: 4,
      byStatus: {
        NOT_STARTED: 1,
        IN_PROGRESS: 1,
        COMPLETED: 2,
        BLOCKED: 0,
        FAILED: 0,
      },
      avgScoreTL: 9.5,
      avgScoreAdv: 9.0,
    },
    taskSummary: {
      total: 8,
      byStatus: {
        NOT_STARTED: 2,
        IN_PROGRESS: 2,
        COMPLETED: 4,
        BLOCKED: 0,
        FAILED: 0,
      },
      byFeature: {},
    },
    configSnapshot: {
      projectPaths: ['.'],
      currentPhase: 'DEVELOPMENT',
      scoreThresholdTL: 8.0,
      scoreThresholdAdv: 8.0,
      maxReworks: 3,
      completedCycles: 1,
    },
    decisionSummary: {
      totalDecisions: 5,
      recentDecisions: [],
    },
    tokenReport: {
      entries: [
        {
          timestamp: 1700000000000,
          skill: 'tdd-orchestrator',
          agent: 'developer-backend',
          model: 'claude-3-7-sonnet',
          inputTokens: 50000,
          outputTokens: 10000,
          cacheCreationTokens: 0,
          cacheReadTokens: 20000,
          costUsd: 0.45,
        },
      ],
      events: [],
      totals: {
        inputTokens: 50000,
        outputTokens: 10000,
        cacheCreationTokens: 0,
        cacheReadTokens: 20000,
        costUsd: 0.45,
      },
      bySkill: {
        'tdd-orchestrator': {
          inputTokens: 50000,
          outputTokens: 10000,
          cacheCreationTokens: 0,
          cacheReadTokens: 20000,
          costUsd: 0.45,
        },
      },
    },
  }

  it('Should render complete telemetry dashboard with executive metrics, skill breakdown, and backlog health', () => {
    const html = renderTelemetryDashboardView({ report: dummyReport })

    expect(html).toContain('telemetry-dashboard')
    expect(html).toContain('Telemetry & Token Analytics')
    expect(html).toContain('$0.4500')
    expect(html).toContain('tdd-orchestrator')
    expect(html).toContain('Backlog Health')
  })

  it('Should render loading state when isLoading is true', () => {
    const html = renderTelemetryDashboardView({ isLoading: true })

    expect(html).toContain('loading-spinner')
    expect(html).toContain('Loading telemetry analytics...')
  })

  it('Should render empty state banner gracefully when no prior execution runs exist', () => {
    const emptyReport: ProductReport = {
      backlogSummary: {
        total: 0,
        byStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, BLOCKED: 0, FAILED: 0 },
        avgScoreTL: null,
        avgScoreAdv: null,
      },
      taskSummary: {
        total: 0,
        byStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, BLOCKED: 0, FAILED: 0 },
        byFeature: {},
      },
      configSnapshot: {
        projectPaths: [],
        currentPhase: 'BOOTSTRAP',
        scoreThresholdTL: 0,
        scoreThresholdAdv: 0,
        maxReworks: 0,
        completedCycles: 0,
      },
      decisionSummary: { totalDecisions: 0, recentDecisions: [] },
      tokenReport: {
        entries: [],
        events: [],
        totals: { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, costUsd: 0 },
        bySkill: {},
      },
    }

    const html = renderTelemetryDashboardView({ report: emptyReport })

    expect(html).toContain('telemetry-empty-state')
    expect(html).toContain('No telemetry or execution runs recorded yet')
  })

  it('Should render error banner with retry button when error occurs', () => {
    const html = renderTelemetryDashboardView({
      error: 'Failed to load telemetry report',
    })

    expect(html).toContain('telemetry-error-banner')
    expect(html).toContain('Failed to load telemetry report')
    expect(html).toContain('btn-retry-telemetry')
  })

  it('Should export alias component function', () => {
    expect(typeof TelemetryDashboardView).toBe('function')
  })
})

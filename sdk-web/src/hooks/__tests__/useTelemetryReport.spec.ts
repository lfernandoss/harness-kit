import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useTelemetryReport,
  TelemetryReportStateManager,
  computeCacheSavings,
  filterAuditEntries,
  calculateTierCost,
} from '../useTelemetryReport.js'
import type {
  IReportApiClient,
  ProductReport,
  TelemetryAuditEvent,
  TelemetryFilterCriteria,
} from '../../types/telemetry.js'

describe('1.1 & 1.2 Telemetry DTO Types, Calculation Utilities & useTelemetryReport Hook (T02)', () => {
  let mockApiClient: IReportApiClient

  const dummyReport: ProductReport = {
    backlogSummary: {
      total: 2,
      byStatus: {
        NOT_STARTED: 0,
        IN_PROGRESS: 1,
        COMPLETED: 1,
        BLOCKED: 0,
        FAILED: 0,
      },
      avgScoreTL: 9.0,
      avgScoreAdv: 8.5,
    },
    taskSummary: {
      total: 4,
      byStatus: {
        NOT_STARTED: 0,
        IN_PROGRESS: 2,
        COMPLETED: 2,
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
      totalDecisions: 2,
      recentDecisions: ['Dec 1', 'Dec 2'],
    },
    tokenReport: {
      entries: [
        {
          timestamp: 1700000001000,
          skill: 'tdd-orchestrator',
          agent: 'developer-backend',
          model: 'claude-3-7-sonnet',
          inputTokens: 10000,
          outputTokens: 2000,
          cacheCreationTokens: 1000,
          cacheReadTokens: 5000,
          costUsd: 0.05,
        },
      ],
      events: [],
      totals: {
        inputTokens: 10000,
        outputTokens: 2000,
        cacheCreationTokens: 1000,
        cacheReadTokens: 5000,
        costUsd: 0.05,
      },
      bySkill: {
        'tdd-orchestrator': {
          inputTokens: 10000,
          outputTokens: 2000,
          cacheCreationTokens: 1000,
          cacheReadTokens: 5000,
          costUsd: 0.05,
        },
      },
    },
  }

  const dummyAuditEvents: TelemetryAuditEvent[] = [
    {
      auditId: 'audit-001',
      timestamp: 1700000001000,
      skill: 'tdd-orchestrator',
      agent: 'developer-backend',
      model: 'claude-3-7-sonnet',
      inputTokens: 1000,
      outputTokens: 200,
      cacheReadTokens: 500,
      costUsd: 0.005,
    },
    {
      auditId: 'audit-002',
      timestamp: 1700000002000,
      skill: 'adversarial-qa',
      agent: 'harness-qa',
      model: 'gemini-3.7-flash',
      inputTokens: 2000,
      outputTokens: 400,
      cacheReadTokens: 1000,
      costUsd: 0.002,
    },
    {
      auditId: 'audit-003',
      timestamp: 1700000003000,
      skill: 'the-grumpy-tech-lead',
      agent: 'harness-tech-lead',
      model: 'gpt-4o',
      inputTokens: 3000,
      outputTokens: 600,
      cacheReadTokens: 0,
      costUsd: 0.015,
    },
  ]

  beforeEach(() => {
    mockApiClient = {
      fetchReport: vi.fn().mockResolvedValue(dummyReport),
    }
  })

  describe('Calculation Utilities (1.1)', () => {
    it('Should calculate estimated cache savings and hit ratio when given valid token usage totals', () => {
      const savings = computeCacheSavings({
        inputTokens: 10000,
        outputTokens: 2000,
        cacheCreationTokens: 0,
        cacheReadTokens: 5000,
        costUsd: 0.05,
      })

      expect(savings.cachedTokens).toBe(5000)
      expect(savings.estimatedSavedUsd).toBeGreaterThan(0)
      // Hit ratio = 5000 / (10000 + 5000) = 33.333%
      expect(savings.hitRatioPercentage).toBeCloseTo(33.33, 1)
    })

    it('Should return zero dollars saved and zero percent hit ratio when input and cache read tokens are zero', () => {
      const savings = computeCacheSavings({
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costUsd: 0,
      })

      expect(savings.cachedTokens).toBe(0)
      expect(savings.estimatedSavedUsd).toBe(0)
      expect(savings.hitRatioPercentage).toBe(0)
    })

    it('Should compute tier-specific rates accurately for fast, medium, large, and extra-large models', () => {
      const fastCost = calculateTierCost('fast', 1_000_000, 1_000_000)
      const largeCost = calculateTierCost('large', 1_000_000, 1_000_000)

      expect(fastCost).toBeGreaterThan(0)
      expect(largeCost).toBeGreaterThan(fastCost)
    })

    it('Should filter audit events matching specific skill when skill filter is provided', () => {
      const criteria: TelemetryFilterCriteria = { skill: 'adversarial-qa' }
      const filtered = filterAuditEntries(dummyAuditEvents, criteria)

      expect(filtered.length).toBe(1)
      expect(filtered[0].skill).toBe('adversarial-qa')
    })

    it('Should filter audit events matching specific model when model filter is provided', () => {
      const criteria: TelemetryFilterCriteria = { model: 'gpt-4o' }
      const filtered = filterAuditEntries(dummyAuditEvents, criteria)

      expect(filtered.length).toBe(1)
      expect(filtered[0].model).toBe('gpt-4o')
    })

    it('Should return all audit events when filter criteria are empty', () => {
      const criteria: TelemetryFilterCriteria = {}
      const filtered = filterAuditEntries(dummyAuditEvents, criteria)

      expect(filtered.length).toBe(3)
    })

    it('Should match search query against agent name, skill, and auditId case-insensitively', () => {
      const criteria: TelemetryFilterCriteria = { search: 'BACKEND' }
      const filtered = filterAuditEntries(dummyAuditEvents, criteria)

      expect(filtered.length).toBe(1)
      expect(filtered[0].agent).toBe('developer-backend')
    })
  })

  describe('useTelemetryReport Hook & TelemetryReportStateManager (1.2)', () => {
    it('Should initialize with loading state true and null report before API response resolves', async () => {
      const manager = new TelemetryReportStateManager(mockApiClient)
      expect(manager.report).toBeNull()
      expect(manager.isLoading).toBe(false)
      expect(manager.error).toBeNull()

      const loadPromise = manager.loadReport()
      expect(manager.isLoading).toBe(true)

      await loadPromise
      expect(manager.isLoading).toBe(false)
      expect(manager.report).toEqual(dummyReport)
    })

    it('Should populate report state with ProductReport DTO when fetchReport() succeeds', async () => {
      const manager = new TelemetryReportStateManager(mockApiClient)
      await manager.loadReport()

      expect(manager.report).toBeDefined()
      expect(manager.report?.backlogSummary.total).toBe(2)
      expect(manager.error).toBeNull()
    })

    it('Should transition error state when fetchReport() rejects', async () => {
      mockApiClient.fetchReport = vi.fn().mockRejectedValue(new Error('Network error'))
      const manager = new TelemetryReportStateManager(mockApiClient)

      await manager.loadReport()
      expect(manager.isLoading).toBe(false)
      expect(manager.error).toBeDefined()
      expect(manager.error?.message).toContain('Network error')
      expect(manager.report).toBeNull()
    })

    it('Should update token totals and bySkill usage reactively when live delta is received', async () => {
      const manager = new TelemetryReportStateManager(mockApiClient)
      await manager.loadReport()

      manager.handleLiveDelta({
        delta: {
          inputTokens: 500,
          outputTokens: 100,
          cacheCreationTokens: 0,
          cacheReadTokens: 200,
          costUsd: 0.002,
        },
        skill: 'tdd-orchestrator',
        model: 'claude-3-7-sonnet',
        jobId: 'job-123',
      })

      expect(manager.report?.tokenReport.totals.inputTokens).toBe(10500)
      expect(manager.report?.tokenReport.totals.outputTokens).toBe(2100)
      expect(manager.report?.tokenReport.totals.costUsd).toBeCloseTo(0.052, 4)
      expect(manager.report?.tokenReport.bySkill['tdd-orchestrator'].inputTokens).toBe(10500)
    })

    it('Should trigger manual refresh and update report state when refresh() is called', async () => {
      const manager = new TelemetryReportStateManager(mockApiClient)
      await manager.loadReport()

      const updatedReport = {
        ...dummyReport,
        backlogSummary: { ...dummyReport.backlogSummary, total: 5 },
      }
      mockApiClient.fetchReport = vi.fn().mockResolvedValue(updatedReport)

      await manager.refresh()
      expect(manager.report?.backlogSummary.total).toBe(5)
    })

    it('Should provide useTelemetryReport hook interface', async () => {
      const hook = useTelemetryReport(mockApiClient)
      await hook.loadReport()

      expect(hook.report).toEqual(dummyReport)
      expect(typeof hook.refresh).toBe('function')
    })
  })
})

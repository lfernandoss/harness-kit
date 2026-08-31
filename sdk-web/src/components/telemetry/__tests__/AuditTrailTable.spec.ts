import { describe, it, expect, vi } from 'vitest'
import {
  renderBacklogHealthWidget,
  BacklogHealthWidget,
} from '../BacklogHealthWidget.js'
import {
  renderAuditTrailTable,
  AuditTrailTable,
} from '../AuditTrailTable.js'
import {
  convertToCsv,
  convertToJson,
  sanitizeTelemetryEvents,
  exportTelemetryData,
} from '../../../utils/telemetryExport.js'
import type {
  BacklogSummary,
  TaskSummary,
  ConfigSnapshot,
  TelemetryAuditEvent,
} from '../../../types/telemetry.js'

describe('1.3 Presentation Components & Utils — BacklogHealthWidget & AuditTrailTable & Export (T05)', () => {
  const dummyBacklog: BacklogSummary = {
    total: 5,
    byStatus: {
      NOT_STARTED: 1,
      IN_PROGRESS: 1,
      COMPLETED: 2,
      BLOCKED: 1,
      FAILED: 0,
    },
    avgScoreTL: 9.1,
    avgScoreAdv: 8.7,
  }

  const dummyTaskSummary: TaskSummary = {
    total: 10,
    byStatus: {
      NOT_STARTED: 2,
      IN_PROGRESS: 2,
      COMPLETED: 6,
      BLOCKED: 0,
      FAILED: 0,
    },
    byFeature: {
      F001: {
        featureId: 'F001',
        title: 'Feature 1',
        status: 'COMPLETED',
        totalTasks: 3,
        completedTasks: 3,
        reworks: 0,
      },
      F002: {
        featureId: 'F002',
        title: 'Feature 2',
        status: 'IN_PROGRESS',
        totalTasks: 4,
        completedTasks: 2,
        reworks: 1,
      },
    },
  }

  const dummyConfig: ConfigSnapshot = {
    projectPaths: ['.'],
    currentPhase: 'DEVELOPMENT',
    scoreThresholdTL: 8.0,
    scoreThresholdAdv: 8.0,
    maxReworks: 3,
    completedCycles: 2,
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
      metadata: 'Run token secret_12345 should not leak',
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
  ]

  describe('BacklogHealthWidget', () => {
    it('Should render feature counts grouped by status', () => {
      const html = renderBacklogHealthWidget({
        backlogSummary: dummyBacklog,
        taskSummary: dummyTaskSummary,
        configSnapshot: dummyConfig,
      })

      expect(html).toContain('COMPLETED: 2')
      expect(html).toContain('IN_PROGRESS: 1')
      expect(html).toContain('NOT_STARTED: 1')
      expect(html).toContain('BLOCKED: 1')
    })

    it('Should display total rework count and completed cycle count', () => {
      const html = renderBacklogHealthWidget({
        backlogSummary: dummyBacklog,
        taskSummary: dummyTaskSummary,
        configSnapshot: dummyConfig,
      })

      expect(html).toContain('Completed Cycles')
      expect(html).toContain('2')
      expect(html).toContain('Reworks')
    })

    it('Should export alias component function', () => {
      expect(typeof BacklogHealthWidget).toBe('function')
    })
  })

  describe('AuditTrailTable', () => {
    it('Should render list of TelemetryAuditEvent records', () => {
      const html = renderAuditTrailTable({ events: dummyAuditEvents })

      expect(html).toContain('tdd-orchestrator')
      expect(html).toContain('developer-backend')
      expect(html).toContain('adversarial-qa')
      expect(html).toContain('Export CSV')
      expect(html).toContain('Export JSON')
    })

    it('Should export alias component function', () => {
      expect(typeof AuditTrailTable).toBe('function')
    })
  })

  describe('telemetryExport utils', () => {
    it('Should serialize filtered audit records into formatted JSON blob/string', () => {
      const jsonStr = convertToJson(dummyAuditEvents)
      const parsed = JSON.parse(jsonStr)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(2)
      expect(parsed[0].skill).toBe('tdd-orchestrator')
      // Ensure secrets are sanitized
      expect(JSON.stringify(parsed)).not.toContain('secret_12345')
      expect(JSON.stringify(parsed)).toContain('[REDACTED]')
    })

    it('Should serialize filtered audit records into CSV formatted text with valid headers', () => {
      const csvStr = convertToCsv(dummyAuditEvents)
      const lines = csvStr.trim().split('\n')

      expect(lines[0]).toBe('timestamp,skill,agent,model,inputTokens,outputTokens,costUsd')
      expect(lines.length).toBe(3)
      expect(lines[1]).toContain('tdd-orchestrator')
      expect(lines[2]).toContain('adversarial-qa')
    })

    it('Should sanitize sensitive credentials and API tokens', () => {
      const sanitized = sanitizeTelemetryEvents(dummyAuditEvents)
      expect(sanitized[0].metadata).not.toContain('secret_12345')
      expect(sanitized[0].metadata).toContain('[REDACTED]')
    })
  })
})

import { describe, it, expect } from 'vitest'
import {
  renderDiagnosticsDashboard,
  DiagnosticsDashboard,
} from '../DiagnosticsDashboard.js'
import {
  renderBatchExecutionPanel,
  BatchExecutionPanel,
} from '../BatchExecutionPanel.js'
import type { DiagnoseSessionDTO, DiagnoseReportDTO } from '../../../types/diagnostics.js'

describe('1.1 DiagnosticsDashboard & BatchExecutionPanel Components (T04)', () => {
  const mockPendingSessions: DiagnoseSessionDTO[] = [
    {
      sessionId: 'session-2026-08-27-001',
      timestamp: '2026-08-27T10:00:00.000Z',
      runner: 'claude-cli',
      model: 'claude-3-7-sonnet',
      phase: 'DEVELOPMENT',
      status: 'pending',
    },
    {
      sessionId: 'session-2026-08-27-002',
      timestamp: '2026-08-27T11:00:00.000Z',
      runner: 'antigravity-cli',
      model: 'gemini-3.7-flash',
      phase: 'DEVELOPMENT',
      status: 'pending',
    },
  ]

  describe('BatchExecutionPanel', () => {
    it('Should disable batch execution button when pending session count is zero', () => {
      const html = renderBatchExecutionPanel({
        pendingCount: 0,
        isRunning: false,
      })

      expect(html).toContain('disabled')
      expect(html).toMatch(/<button[^>]*disabled[^>]*>.*(Run|Execute).*<\/button>/is)
    })

    it('Should enable batch execution button when pending sessions exist', () => {
      const html = renderBatchExecutionPanel({
        pendingCount: 2,
        isRunning: false,
      })

      expect(html).not.toMatch(/<button[^>]*class="[^"]*btn-run-batch[^"]*"[^>]*disabled/is)
    })

    it('Should display active progress bar and step counts when batch execution is running', () => {
      const html = renderBatchExecutionPanel({
        pendingCount: 2,
        isRunning: true,
        progress: {
          processed: 4,
          remaining: 2,
          total: 6,
        },
      })

      expect(html).toContain('66%')
      expect(html).toContain('4')
      expect(html).toContain('2')
      expect(html).toContain('progress-bar')
    })
  })

  describe('DiagnosticsDashboard', () => {
    it('Should display informational notice when no pending diagnose sessions exist', () => {
      const html = renderDiagnosticsDashboard({
        pendingSessions: [],
        isRunning: false,
      })

      expect(html).toContain('No pending diagnose sessions found')
      expect(html).toContain('disabled')
    })

    it('Should render pending sessions count and batch panel when sessions exist', () => {
      const html = renderDiagnosticsDashboard({
        pendingSessions: mockPendingSessions,
        isRunning: false,
      })

      expect(html).toContain('2 pending')
      expect(html).toContain('session-2026-08-27-001')
      expect(html).toContain('session-2026-08-27-002')
    })

    it('Should render DiagnoseReportView with generated trace session IDs when report is returned', () => {
      const report: DiagnoseReportDTO = {
        processedSessions: 2,
        remainingSessions: 0,
        sessionIds: ['session-2026-08-27-001', 'session-2026-08-27-002'],
        traceIds: ['trace-2026-08-27-001', 'trace-2026-08-27-002'],
        candidateCreated: {
          candidateId: 'candidate-2026-08-27-001',
          targetSkill: 'tdd-orchestrator',
          status: 'PROPOSED',
          path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
        },
      }

      const html = renderDiagnosticsDashboard({
        pendingSessions: [],
        isRunning: false,
        report,
      })

      expect(html).toContain('Diagnose Report')
      expect(html).toContain('trace-2026-08-27-001')
      expect(html).toContain('trace-2026-08-27-002')
      expect(html).toContain('candidate-2026-08-27-001')
      expect(html).toContain('tdd-orchestrator')
    })
  })
})

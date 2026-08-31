import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useDiagnostics,
  DiagnosticsStateManager,
} from '../useDiagnostics.js'
import {
  useCandidates,
  useCandidateDetail,
  CandidatesStateManager,
  CandidateDetailStateManager,
  type CandidateFilter,
} from '../useCandidates.js'
import type {
  IDiagnosticsApiClient,
  DiagnoseSessionDTO,
  DiagnoseReportDTO,
  CandidateSummaryDTO,
  CandidateDetailDTO,
  PromotionResultDTO,
} from '../../types/diagnostics.js'

describe('1.3 Custom Hooks & State Managers (T03)', () => {
  let mockApiClient: IDiagnosticsApiClient

  const dummySessions: DiagnoseSessionDTO[] = [
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

  const dummyCandidates: CandidateSummaryDTO[] = [
    {
      candidateId: 'candidate-2026-08-27-001',
      targetSkill: 'tdd-orchestrator',
      status: 'PROPOSED',
      path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
      shortRationale: 'Improve RED phase',
    },
    {
      candidateId: 'candidate-2026-08-27-002',
      targetSkill: 'adversarial-qa',
      status: 'PROMOTED',
      path: 'docs/harness-history/candidates/candidate-2026-08-27-002',
      shortRationale: 'Deep security testing',
    },
    {
      candidateId: 'candidate-2026-08-27-003',
      targetSkill: 'the-grumpy-tech-lead',
      status: 'APPLIED',
      path: 'docs/harness-history/candidates/candidate-2026-08-27-003',
    },
  ]

  beforeEach(() => {
    mockApiClient = {
      getSessions: vi.fn().mockResolvedValue(dummySessions),
      runBatch: vi.fn().mockResolvedValue({
        processedSessions: 2,
        remainingSessions: 0,
        sessionIds: ['session-2026-08-27-001', 'session-2026-08-27-002'],
        traceIds: ['trace-001', 'trace-002'],
      } as DiagnoseReportDTO),
      getCandidates: vi.fn().mockResolvedValue(dummyCandidates),
      getCandidate: vi.fn().mockImplementation(async (id: string) => {
        const found = dummyCandidates.find((c) => c.candidateId === id)
        if (!found) throw new Error(`Candidate ${id} not found`)
        return {
          ...found,
          rationale: 'Detailed rationale for ' + id,
          promptDiff: '--- old\n+++ new',
          runnerCommand: `hrns candidate review ${id}`,
        } as CandidateDetailDTO
      }),
      promoteCandidate: vi.fn().mockResolvedValue({
        success: true,
        candidateId: 'candidate-2026-08-27-001',
        targetSkill: 'tdd-orchestrator',
        runnerType: 'claude-cli',
      } as PromotionResultDTO),
    }
  })

  describe('useDiagnostics & DiagnosticsStateManager', () => {
    it('Should initialize with empty state and trigger API fetch on loadSessions()', async () => {
      const manager = new DiagnosticsStateManager(mockApiClient)
      expect(manager.pendingSessions).toEqual([])
      expect(manager.isRunning).toBe(false)
      expect(manager.progress).toBeNull()
      expect(manager.report).toBeNull()

      await manager.loadSessions()
      expect(manager.pendingSessions.length).toBe(2)
      expect(manager.isLoading).toBe(false)
      expect(mockApiClient.getSessions).toHaveBeenCalled()
    })

    it('Should update progress state and execute batch run', async () => {
      const manager = new DiagnosticsStateManager(mockApiClient)
      await manager.loadSessions()

      const runPromise = manager.runBatch({ batchSize: 2 })
      expect(manager.isRunning).toBe(true)

      manager.updateProgress({ processed: 1, remaining: 1, total: 2 })
      expect(manager.progress).toEqual({ processed: 1, remaining: 1, total: 2 })

      await runPromise
      expect(manager.isRunning).toBe(false)
      expect(manager.report?.processedSessions).toBe(2)
    })

    it('Should provide useDiagnostics hook interface', async () => {
      const hook = useDiagnostics(mockApiClient)
      await hook.loadSessions()

      expect(hook.pendingSessions.length).toBe(2)
      expect(typeof hook.runBatch).toBe('function')
    })
  })

  describe('useCandidates & CandidatesStateManager', () => {
    it('Should load candidate list and support status filtering', async () => {
      const manager = new CandidatesStateManager(mockApiClient)
      await manager.loadCandidates()

      expect(manager.candidates.length).toBe(3)
      expect(manager.filteredCandidates.length).toBe(3)

      manager.setFilter({ status: 'PROPOSED' })
      expect(manager.filteredCandidates.length).toBe(1)
      expect(manager.filteredCandidates[0].candidateId).toBe('candidate-2026-08-27-001')

      manager.setFilter({ status: 'PROMOTED' })
      expect(manager.filteredCandidates.length).toBe(1)
      expect(manager.filteredCandidates[0].candidateId).toBe('candidate-2026-08-27-002')

      manager.setFilter({ targetSkill: 'the-grumpy-tech-lead' })
      expect(manager.filteredCandidates.length).toBe(1)
      expect(manager.filteredCandidates[0].candidateId).toBe('candidate-2026-08-27-003')
    })

    it('Should provide useCandidates hook interface', async () => {
      const hook = useCandidates(mockApiClient)
      await hook.loadCandidates()

      expect(hook.candidates.length).toBe(3)
      hook.setFilter({ status: 'PROPOSED' })
      expect(hook.filter.status).toBe('PROPOSED')
    })
  })

  describe('useCandidateDetail & CandidateDetailStateManager', () => {
    it('Should load candidate details and format CLI runner command preview', async () => {
      const manager = new CandidateDetailStateManager('candidate-2026-08-27-001', mockApiClient)
      await manager.loadCandidate()

      expect(manager.candidate?.candidateId).toBe('candidate-2026-08-27-001')
      expect(manager.candidate?.runnerCommand).toBe('hrns candidate review candidate-2026-08-27-001')
    })

    it('Should transition isPromoting state and update status upon autonomous promotion', async () => {
      const manager = new CandidateDetailStateManager('candidate-2026-08-27-001', mockApiClient)
      await manager.loadCandidate()
      expect(manager.isPromoting).toBe(false)
      expect(manager.candidate?.status).toBe('PROPOSED')

      const promotePromise = manager.promoteAutonomous('claude-cli')
      expect(manager.isPromoting).toBe(true)

      const result = await promotePromise
      expect(result.success).toBe(true)
      expect(manager.isPromoting).toBe(false)
      expect(manager.candidate?.status).toBe('PROMOTED')
    })

    it('Should provide useCandidateDetail hook interface', async () => {
      const hook = useCandidateDetail('candidate-2026-08-27-001', mockApiClient)
      await hook.loadCandidate()
      expect(hook.candidate?.candidateId).toBe('candidate-2026-08-27-001')
    })
  })
})

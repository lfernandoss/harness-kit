import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateDiagnoseBatchRunOptions,
  validateCandidateId,
  createCandidateSummaryDTO,
  createCandidateDetailDTO,
  type DiagnoseSessionDTO,
  type CandidateSummaryDTO,
  type CandidateDetailDTO,
  type DiagnoseBatchRunOptions,
  type PromotionResultDTO,
} from '../../types/diagnostics.js'
import { DiagnosticsApiClient } from '../diagnosticsApi.js'

describe('1.2 Value Objects, DTOs & DiagnosticsApiClient (T01)', () => {
  describe('DiagnoseBatchRunOptions validation', () => {
    it('Should validate batch size is a positive integer greater than or equal to 1', () => {
      expect(() => validateDiagnoseBatchRunOptions({ batchSize: 0 })).toThrow(/batch size/i)
      expect(() => validateDiagnoseBatchRunOptions({ batchSize: -5 })).toThrow(/batch size/i)
      expect(() => validateDiagnoseBatchRunOptions({ batchSize: 1.5 })).toThrow(/batch size/i)

      const valid = validateDiagnoseBatchRunOptions({ batchSize: 3 })
      expect(valid.batchSize).toBe(3)
    })

    it('Should accept valid runner and model override strings', () => {
      const payload: DiagnoseBatchRunOptions = {
        batchSize: 5,
        agentType: 'claude-cli',
        model: 'claude-3-7-sonnet',
        effort: 'high',
      }
      const validated = validateDiagnoseBatchRunOptions(payload)
      expect(validated.agentType).toBe('claude-cli')
      expect(validated.model).toBe('claude-3-7-sonnet')
      expect(validated.effort).toBe('high')
      expect(Object.isFrozen(validated)).toBe(true)
    })
  })

  describe('CandidateSummaryDTO & CandidateDetailDTO validation and immutability', () => {
    it('Should reject candidate ID strings not matching candidate-YYYY-MM-DD-NNN pattern', () => {
      expect(() => validateCandidateId('invalid-candidate-name')).toThrow(/candidate-YYYY-MM-DD-NNN/i)
      expect(() => validateCandidateId('candidate-2026-8-27-01')).toThrow(/candidate-YYYY-MM-DD-NNN/i)
      expect(() => validateCandidateId('')).toThrow(/candidate-YYYY-MM-DD-NNN/i)
      expect(validateCandidateId('candidate-2026-08-27-001')).toBe('candidate-2026-08-27-001')
    })

    it('Should create valid and immutable CandidateSummaryDTO', () => {
      const dto = createCandidateSummaryDTO({
        candidateId: 'candidate-2026-08-27-001',
        targetSkill: 'tdd-orchestrator',
        status: 'PROPOSED',
        path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
        shortRationale: 'Improve RED phase handling',
      })

      expect(dto.candidateId).toBe('candidate-2026-08-27-001')
      expect(dto.targetSkill).toBe('tdd-orchestrator')
      expect(dto.status).toBe('PROPOSED')
      expect(Object.isFrozen(dto)).toBe(true)
      expect(() => {
        ;(dto as any).status = 'PROMOTED'
      }).toThrow()
    })

    it('Should guarantee immutability of candidate detail fields', () => {
      const detail = createCandidateDetailDTO({
        candidateId: 'candidate-2026-08-27-002',
        targetSkill: 'adversarial-qa',
        status: 'PROMOTED',
        path: 'docs/harness-history/candidates/candidate-2026-08-27-002',
        rationale: 'Deep adversarial analysis',
        promptDiff: '--- a/SKILL.md\n+++ b/SKILL.md',
        runnerCommand: 'hrns candidate review candidate-2026-08-27-002',
      })

      expect(detail.candidateId).toBe('candidate-2026-08-27-002')
      expect(detail.promptDiff).toContain('SKILL.md')
      expect(Object.isFrozen(detail)).toBe(true)
      expect(() => {
        ;(detail as any).promptDiff = 'changed'
      }).toThrow()
    })
  })

  describe('DiagnosticsApiClient HTTP interactions', () => {
    let mockFetch: any

    beforeEach(() => {
      mockFetch = vi.fn()
    })

    it('Should fetch pending diagnose sessions from GET /api/diagnose/sessions', async () => {
      const sessions: DiagnoseSessionDTO[] = [
        {
          sessionId: 'session-2026-08-27-001',
          timestamp: '2026-08-27T12:00:00.000Z',
          runner: 'claude-cli',
          model: 'claude-3-7-sonnet',
          phase: 'DEVELOPMENT',
          status: 'pending',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sessions,
      })

      const client = new DiagnosticsApiClient({ baseUrl: 'http://localhost:3000', fetchFn: mockFetch })
      const res = await client.getSessions()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/diagnose/sessions', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      expect(res).toEqual(sessions)
    })

    it('Should trigger batch diagnose run via POST /api/diagnose/run', async () => {
      const report = {
        processedSessions: 3,
        remainingSessions: 0,
        sessionIds: ['s1', 's2', 's3'],
        traceIds: ['trace-1', 'trace-2', 'trace-3'],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => report,
      })

      const client = new DiagnosticsApiClient({ baseUrl: 'http://localhost:3000', fetchFn: mockFetch })
      const res = await client.runBatch({ batchSize: 3, agentType: 'claude-cli' })

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/diagnose/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ batchSize: 3, agentType: 'claude-cli' }),
      })
      expect(res).toEqual(report)
    })

    it('Should fetch candidate list via GET /api/diagnose/candidates', async () => {
      const candidates: CandidateSummaryDTO[] = [
        {
          candidateId: 'candidate-2026-08-27-001',
          targetSkill: 'tdd-orchestrator',
          status: 'PROPOSED',
          path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => candidates,
      })

      const client = new DiagnosticsApiClient({ fetchFn: mockFetch })
      const res = await client.getCandidates()

      expect(mockFetch).toHaveBeenCalledWith('/api/diagnose/candidates', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      expect(res).toEqual(candidates)
    })

    it('Should fetch candidate detail via GET /api/diagnose/candidates/:id', async () => {
      const detail: CandidateDetailDTO = {
        candidateId: 'candidate-2026-08-27-001',
        targetSkill: 'tdd-orchestrator',
        status: 'PROPOSED',
        path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
        rationale: 'Refactor red phase',
        promptDiff: '+ enhanced prompt',
        runnerCommand: 'hrns candidate review candidate-2026-08-27-001',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => detail,
      })

      const client = new DiagnosticsApiClient({ fetchFn: mockFetch })
      const res = await client.getCandidate('candidate-2026-08-27-001')

      expect(mockFetch).toHaveBeenCalledWith('/api/diagnose/candidates/candidate-2026-08-27-001', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      expect(res).toEqual(detail)
    })

    it('Should promote candidate via POST /api/diagnose/candidates/:id/promote', async () => {
      const promoResult: PromotionResultDTO = {
        success: true,
        candidateId: 'candidate-2026-08-27-001',
        targetSkill: 'tdd-orchestrator',
        runnerType: 'claude-cli',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => promoResult,
      })

      const client = new DiagnosticsApiClient({ fetchFn: mockFetch })
      const res = await client.promoteCandidate('candidate-2026-08-27-001', { runner: 'claude-cli' })

      expect(mockFetch).toHaveBeenCalledWith('/api/diagnose/candidates/candidate-2026-08-27-001/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ runner: 'claude-cli' }),
      })
      expect(res).toEqual(promoResult)
    })

    it('Should throw normalized error on non-ok HTTP responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Candidate candidate-2099-01-01-999 not found' }),
      })

      const client = new DiagnosticsApiClient({ fetchFn: mockFetch })
      await expect(client.getCandidate('candidate-2099-01-01-999')).rejects.toThrow(
        /Candidate candidate-2099-01-01-999 not found/
      )
    })
  })
})

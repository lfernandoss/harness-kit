import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DiagnosticsController } from '../controllers/DiagnosticsController.js'
import { createDiagnosticsRouter } from '../routes/diagnosticsRoutes.js'
import type { DiagnoseService } from '../../../../sdk/src/diagnose/DiagnoseService.js'
import type { MetaHarnessAgentAdapter } from '../../../../sdk/src/diagnose/MetaHarnessAgentAdapter.js'
import type { CandidateReader } from '../../../../sdk/src/diagnose/CandidateReader.js'
import type { IncomingMessage, ServerResponse } from 'node:http'

function createMockReqRes(options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: string
}) {
  const req: any = {
    method: options.method ?? 'GET',
    url: options.url ?? '/',
    headers: options.headers ?? { host: 'localhost:3000' },
    socket: { remoteAddress: '127.0.0.1' },
    on: (event: string, callback: any) => {
      if (event === 'data' && options.body) {
        callback(Buffer.from(options.body))
      }
      if (event === 'end') {
        callback()
      }
      return req
    },
  }

  let responseBody = ''
  let writtenChunks: string[] = []
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader: vi.fn((k: string, v: string) => {
      res.headers[k.toLowerCase()] = v
    }),
    writeHead: vi.fn((status: number, headers?: Record<string, string>) => {
      res.statusCode = status
      if (headers) {
        for (const [k, v] of Object.entries(headers)) {
          res.headers[k.toLowerCase()] = v
        }
      }
    }),
    write: vi.fn((chunk: string | Buffer) => {
      const str = chunk.toString()
      writtenChunks.push(str)
      responseBody += str
    }),
    end: vi.fn((chunk?: string | Buffer) => {
      if (chunk) {
        const str = chunk.toString()
        writtenChunks.push(str)
        responseBody += str
      }
    }),
    getResponseBody: () => responseBody,
    getWrittenChunks: () => writtenChunks,
    getJson: () => {
      try {
        return JSON.parse(responseBody)
      } catch {
        return null
      }
    },
  }

  return { req, res }
}

describe('2.2 DiagnosticsController & diagnosticsRoutes (T02)', () => {
  let mockDiagnoseService: any
  let mockCandidateReader: any
  let mockAgentAdapter: any
  let mockLedger: any
  let controller: DiagnosticsController
  let router: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>

  beforeEach(() => {
    mockLedger = {
      loadPending: vi.fn().mockReturnValue([
        {
          sessionId: 'session-2026-08-27-001',
          timestamp: '2026-08-27T10:00:00.000Z',
          runner: 'claude-cli',
          model: 'claude-3-7-sonnet',
          phase: 'DEVELOPMENT',
          status: 'pending',
          snapshot: {
            runner: 'claude-cli',
            model: 'claude-3-7-sonnet',
            effort: 'high',
            scopeSummary: 'api token secret_1234567890abcdef should be [REDACTED]',
            featureIds: ['F001'],
            phaseTimingsMs: {},
          },
        },
      ]),
      loadAll: vi.fn().mockReturnValue([]),
    }

    mockDiagnoseService = {
      processNextBatch: vi.fn().mockResolvedValue({
        processed: 1,
        remaining: 0,
        sessionIds: ['session-2026-08-27-001'],
        traceIds: ['session-2026-08-27-001'],
      }),
      processAllPendingInBatches: vi.fn().mockImplementation(async (batchSize: number, onProgress?: any) => {
        if (onProgress) {
          onProgress({ processed: 1, remaining: 0, total: 1 })
        }
        return {
          processed: 1,
          remaining: 0,
          sessionIds: ['session-2026-08-27-001'],
          traceIds: ['session-2026-08-27-001'],
          report: {
            processedSessions: 1,
            remainingSessions: 0,
            sessionIds: ['session-2026-08-27-001'],
            traceIds: ['session-2026-08-27-001'],
          },
        }
      }),
    }

    mockCandidateReader = {
      listCandidates: vi.fn().mockReturnValue([
        {
          candidateId: 'candidate-2026-08-27-001',
          targetSkill: 'tdd-orchestrator',
          status: 'PROPOSED',
          path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
          shortRationale: 'Optimize RED phase',
        },
      ]),
      readCandidateFromDisk: vi.fn().mockImplementation((_dir: string, id: string) => {
        if (id === 'candidate-2026-08-27-001') {
          return {
            candidateId: 'candidate-2026-08-27-001',
            targetSkill: 'tdd-orchestrator',
            status: 'PROPOSED',
            path: 'docs/harness-history/candidates/candidate-2026-08-27-001',
            rationale: 'Fix test red phase',
            proposedChange: '+++ new prompt',
          }
        }
        return null
      }),
      getCandidateStatus: vi.fn().mockReturnValue('PROPOSED'),
    }

    mockAgentAdapter = {
      invokeCandidatePromotion: vi.fn().mockResolvedValue({
        exitCode: 0,
        raw: JSON.stringify({ status: 'PROMOTED' }),
      }),
    }

    controller = new DiagnosticsController({
      diagnoseService: mockDiagnoseService,
      ledger: mockLedger,
      candidateReader: mockCandidateReader,
      agentAdapter: mockAgentAdapter,
      workingDir: process.cwd(),
    })

    router = createDiagnosticsRouter(controller)
  })

  describe('GET /api/diagnose/sessions', () => {
    it('Should return 200 OK with pending session list and sanitize credentials', async () => {
      const { req, res } = createMockReqRes({
        method: 'GET',
        url: '/api/diagnose/sessions',
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(200)

      const json = res.getJson()
      expect(Array.isArray(json)).toBe(true)
      expect(json.length).toBe(1)
      expect(json[0].sessionId).toBe('session-2026-08-27-001')
      expect(json[0].status).toBe('pending')
      // Ensure secret pattern is sanitized
      if (json[0].snapshot) {
        expect(json[0].snapshot.scopeSummary).not.toContain('secret_1234567890abcdef')
      }
    })
  })

  describe('POST /api/diagnose/run', () => {
    it('Should execute batch and return DiagnoseReportDTO', async () => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        url: '/api/diagnose/run',
        body: JSON.stringify({ batchSize: 3, agentType: 'claude-cli' }),
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(200)

      const json = res.getJson()
      expect(json.processedSessions).toBe(1)
      expect(json.sessionIds).toContain('session-2026-08-27-001')
    })

    it('Should stream progress events when SSE headers are requested', async () => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        url: '/api/diagnose/run',
        headers: {
          accept: 'text/event-stream',
          host: 'localhost:3000',
        },
        body: JSON.stringify({ batchSize: 3 }),
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.headers['content-type']).toContain('text/event-stream')

      const chunks = res.getWrittenChunks()
      expect(chunks.some((c: string) => c.includes('event: progress') || c.includes('"processed":1'))).toBe(true)
    })
  })

  describe('GET /api/diagnose/candidates and /api/diagnose/candidates/:id', () => {
    it('Should return list of candidate summaries on GET /api/diagnose/candidates', async () => {
      const { req, res } = createMockReqRes({
        method: 'GET',
        url: '/api/diagnose/candidates',
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(200)

      const json = res.getJson()
      expect(Array.isArray(json)).toBe(true)
      expect(json[0].candidateId).toBe('candidate-2026-08-27-001')
    })

    it('Should return CandidateDetailDTO on GET /api/diagnose/candidates/:id', async () => {
      const { req, res } = createMockReqRes({
        method: 'GET',
        url: '/api/diagnose/candidates/candidate-2026-08-27-001',
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(200)

      const json = res.getJson()
      expect(json.candidateId).toBe('candidate-2026-08-27-001')
      expect(json.targetSkill).toBe('tdd-orchestrator')
      expect(json.runnerCommand).toContain('candidate-2026-08-27-001')
    })

    it('Should return 404 Not Found when requesting non-existent candidate', async () => {
      const { req, res } = createMockReqRes({
        method: 'GET',
        url: '/api/diagnose/candidates/candidate-2099-01-01-999',
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(404)

      const json = res.getJson()
      expect(json.error).toMatch(/not found/i)
    })

    it('Should reject directory traversal attempts with 400 Bad Request', async () => {
      const { req, res } = createMockReqRes({
        method: 'GET',
        url: '/api/diagnose/candidates/..%2F..%2Fetc%2Fpasswd',
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /api/diagnose/candidates/:id/promote', () => {
    it('Should execute autonomous LLM promotion and return PromotionResultDTO', async () => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        url: '/api/diagnose/candidates/candidate-2026-08-27-001/promote',
        body: JSON.stringify({ runner: 'claude-cli' }),
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(200)

      const json = res.getJson()
      expect(json.success).toBe(true)
      expect(json.candidateId).toBe('candidate-2026-08-27-001')
      expect(json.targetSkill).toBe('tdd-orchestrator')
    })

    it('Should prevent shell injection in runner selection', async () => {
      const { req, res } = createMockReqRes({
        method: 'POST',
        url: '/api/diagnose/candidates/candidate-2026-08-27-001/promote',
        body: JSON.stringify({ runner: 'claude-cli; rm -rf /' }),
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(400)
    })

    it('Should capture adapter errors and return 500 failure DTO without crashing', async () => {
      mockAgentAdapter.invokeCandidatePromotion.mockRejectedValueOnce(new Error('Rate limit exceeded'))

      const { req, res } = createMockReqRes({
        method: 'POST',
        url: '/api/diagnose/candidates/candidate-2026-08-27-001/promote',
        body: JSON.stringify({ runner: 'claude-cli' }),
      })

      const handled = await router(req, res)
      expect(handled).toBe(true)
      expect(res.statusCode).toBe(500)

      const json = res.getJson()
      expect(json.success).toBe(false)
      expect(json.error).toContain('Rate limit exceeded')
    })
  })
})

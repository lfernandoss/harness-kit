import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { ReportController } from '../controllers/ReportController.js'
import { createReportRouter } from '../routes/report.routes.js'
import type { ProductReport } from '../../types/telemetry.js'

function createMockReqRes(options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  remoteAddress?: string
  body?: string
}) {
  const req: any = {
    method: options.method ?? 'GET',
    url: options.url ?? '/',
    headers: options.headers ?? { host: 'localhost:3000' },
    socket: { remoteAddress: options.remoteAddress ?? '127.0.0.1' },
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

describe('2.1 Backend Report REST Endpoint & Aggregator (T01)', () => {
  let mockAggregator: any
  let controller: ReportController
  let router: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>

  const dummyReport: ProductReport = {
    backlogSummary: {
      total: 3,
      byStatus: {
        NOT_STARTED: 1,
        IN_PROGRESS: 1,
        COMPLETED: 1,
        BLOCKED: 0,
        FAILED: 0,
      },
      avgScoreTL: 9.2,
      avgScoreAdv: 8.8,
    },
    taskSummary: {
      total: 6,
      byStatus: {
        NOT_STARTED: 2,
        IN_PROGRESS: 2,
        COMPLETED: 2,
        BLOCKED: 0,
        FAILED: 0,
      },
      byFeature: {
        F001: {
          featureId: 'F001',
          title: 'Feature 1',
          status: 'COMPLETED',
          totalTasks: 2,
          completedTasks: 2,
          reworks: 0,
        },
      },
    },
    configSnapshot: {
      projectPaths: ['/test/project'],
      currentPhase: 'DEVELOPMENT',
      scoreThresholdTL: 8.0,
      scoreThresholdAdv: 8.0,
      maxReworks: 3,
      completedCycles: 1,
    },
    decisionSummary: {
      totalDecisions: 4,
      recentDecisions: ['Decision 1', 'Decision 2'],
    },
    tokenReport: {
      entries: [
        {
          timestamp: 1700000000000,
          skill: 'tdd-orchestrator',
          agent: 'developer-backend',
          model: 'claude-3-7-sonnet',
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 200,
          costUsd: 0.015,
        },
      ],
      events: [],
      totals: {
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationTokens: 0,
        cacheReadTokens: 200,
        costUsd: 0.015,
      },
      bySkill: {
        'tdd-orchestrator': {
          inputTokens: 1000,
          outputTokens: 500,
          cacheCreationTokens: 0,
          cacheReadTokens: 200,
          costUsd: 0.015,
        },
      },
    },
  }

  beforeEach(() => {
    mockAggregator = {
      aggregate: vi.fn().mockReturnValue(dummyReport),
    }
    controller = new ReportController({ aggregator: mockAggregator })
    router = createReportRouter(controller)
  })

  it('Should return HTTP 200 with complete ProductReport payload when requested', async () => {
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/reports',
    })

    const handled = await router(req, res)
    expect(handled).toBe(true)
    expect(res.statusCode).toBe(200)

    const json = res.getJson()
    expect(json).toBeDefined()
    expect(json.backlogSummary.total).toBe(3)
    expect(json.tokenReport.totals.costUsd).toBe(0.015)
    expect(json.configSnapshot.currentPhase).toBe('DEVELOPMENT')
  })

  it('Should return default zero-value metrics and empty arrays when docs/product directory is empty or missing', async () => {
    const emptyController = new ReportController({
      workingDir: 'non_existent_dir_' + Date.now(),
    })
    const emptyRouter = createReportRouter(emptyController)

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/reports',
    })

    const handled = await emptyRouter(req, res)
    expect(handled).toBe(true)
    expect(res.statusCode).toBe(200)

    const json = res.getJson()
    expect(json.backlogSummary.total).toBe(0)
    expect(json.tokenReport.totals.inputTokens).toBe(0)
    expect(json.tokenReport.totals.costUsd).toBe(0)
  })

  it('Should restrict endpoint access strictly to localhost (127.0.0.1, ::1, localhost)', async () => {
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/reports',
      remoteAddress: '192.168.1.100',
    })

    const handled = await router(req, res)
    expect(handled).toBe(true)
    expect(res.statusCode).toBe(403)

    const json = res.getJson()
    expect(json.error).toMatch(/forbidden|localhost/i)
  })

  it('Should sanitize sensitive credentials and API tokens from report payload', async () => {
    const reportWithSecrets: ProductReport = {
      ...dummyReport,
      decisionSummary: {
        totalDecisions: 1,
        recentDecisions: ['Using secret key sk-1234567890abcdef and token ghp_abcdef1234567890'],
      },
    }
    mockAggregator.aggregate.mockReturnValueOnce(reportWithSecrets)

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/reports',
    })

    await router(req, res)
    const json = res.getJson()
    expect(json.decisionSummary.recentDecisions[0]).not.toContain('sk-1234567890abcdef')
    expect(json.decisionSummary.recentDecisions[0]).not.toContain('ghp_abcdef1234567890')
    expect(json.decisionSummary.recentDecisions[0]).toContain('[REDACTED]')
  })

  it('Should return false for non-matching route URLs', async () => {
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/other-endpoint',
    })

    const handled = await router(req, res)
    expect(handled).toBe(false)
  })
})

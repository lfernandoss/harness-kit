import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { FileSessionRepository } from '../../../../outbound/persistence/FileSessionRepository'
import { ProcessTreeManager } from '../../../../outbound/services/ProcessTreeManager'
import { CreateCycleSessionUseCase } from '../../../../../application/use-cases/CreateCycleSessionUseCase'
import { ResumeCycleUseCase } from '../../../../../application/use-cases/ResumeCycleUseCase'
import { AbortCycleUseCase } from '../../../../../application/use-cases/AbortCycleUseCase'
import { SessionCycleRoutes } from '../SessionCycleRoutes'

describe('SessionCycleRoutes HTTP Integration', () => {
  let tempDir: string
  let server: http.Server
  let serverPort: number
  let sessionRepo: FileSessionRepository
  let routes: SessionCycleRoutes

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-http-test-'))
    sessionRepo = new FileSessionRepository(tempDir)
    const processTreeManager = new ProcessTreeManager()
    const createUseCase = new CreateCycleSessionUseCase(sessionRepo)
    const resumeUseCase = new ResumeCycleUseCase(sessionRepo)
    const abortUseCase = new AbortCycleUseCase(sessionRepo, processTreeManager)

    routes = new SessionCycleRoutes(sessionRepo, createUseCase, resumeUseCase, abortUseCase)

    server = http.createServer((req, res) => {
      const handled = routes.handle(req, res)
      if (!handled) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not Found' }))
      }
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number }
        serverPort = addr.port
        resolve()
      })
    })
  })

  afterEach(async () => {
    if (server.closeAllConnections) {
      server.closeAllConnections()
    }
    await new Promise<void>((resolve) => server.close(() => resolve()))
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  const request = (method: string, pathUrl: string, body?: Record<string, unknown>): Promise<{ status: number, data: any }> => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path: pathUrl,
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          let raw = ''
          res.on('data', (chunk) => { raw += chunk })
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 500, data: JSON.parse(raw) })
            } catch {
              resolve({ status: res.statusCode || 500, data: raw })
            }
          })
        }
      )
      req.on('error', reject)
      if (body) {
        req.write(JSON.stringify(body))
      }
      req.end()
    })
  }

  it('OPTIONS request should return 204 for CORS preflight', async () => {
    const res = await request('OPTIONS', '/api/sessions/cycles')
    expect(res.status).toBe(204)
  })

  it('POST /api/sessions/cycles should initialize session and return 201', async () => {
    const res = await request('POST', '/api/sessions/cycles', {
      workspacePath: tempDir,
    })

    expect(res.status).toBe(201)
    expect(res.data.sessionId).toMatch(/^sess-/)
    expect(res.data.cycleId).toMatch(/^cycle-/)
  })

  it('POST /api/sessions/cycles should return 400 if workspacePath is missing', async () => {
    const res = await request('POST', '/api/sessions/cycles', {})
    expect(res.status).toBe(400)
    expect(res.data.error).toBe('workspacePath is required')
  })

  it('GET /api/sessions/:sessionId should return session manifest', async () => {
    const createRes = await request('POST', '/api/sessions/cycles', {
      workspacePath: tempDir,
    })
    const sessionId = createRes.data.sessionId

    const getRes = await request('GET', `/api/sessions/${sessionId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.data.id).toBe(sessionId)
    expect(getRes.data.cycles.length).toBe(1)
  })

  it('GET /api/sessions/:sessionId with unknown ID should return 404', async () => {
    const res = await request('GET', '/api/sessions/sess-nonexistent-999')
    expect(res.status).toBe(404)
  })

  it('GET /api/sessions/:sessionId with invalid ID should return 400', async () => {
    const res = await request('GET', '/api/sessions/invalid-id')
    expect(res.status).toBe(400)
  })

  it('POST /api/sessions/cycles/resume should resume a cycle', async () => {
    const createRes = await request('POST', '/api/sessions/cycles', {
      workspacePath: tempDir,
    })
    const { sessionId, cycleId } = createRes.data

    const resumeRes = await request('POST', '/api/sessions/cycles/resume', {
      sessionId,
      cycleId,
      fromPhase: 'PHASE_A',
    })

    expect(resumeRes.status).toBe(200)
    expect(resumeRes.data.resumed).toBe(true)
    expect(resumeRes.data.nextPhase).toBe('PHASE_B')
  })

  it('POST /api/sessions/cycles/resume should return 400 when missing parameters', async () => {
    const res = await request('POST', '/api/sessions/cycles/resume', {
      sessionId: 'sess-1',
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/sessions/cycles/abort should abort running cycle', async () => {
    const createRes = await request('POST', '/api/sessions/cycles', {
      workspacePath: tempDir,
    })
    const { sessionId, cycleId } = createRes.data

    const abortRes = await request('POST', '/api/sessions/cycles/abort', {
      sessionId,
      cycleId,
      reason: 'Testing abort route',
    })

    expect(abortRes.status).toBe(200)
    expect(abortRes.data.aborted).toBe(true)
  })

  it('POST /api/sessions/cycles/abort should return 400 when missing cycleId', async () => {
    const res = await request('POST', '/api/sessions/cycles/abort', {})
    expect(res.status).toBe(400)
  })

  it('GET /api/sessions/cycles/events should establish SSE stream and receive broadcast', async () => {
    const statusCode = await new Promise<number>((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path: '/api/sessions/cycles/events',
          method: 'GET',
        },
        (res) => {
          res.on('data', () => {
            resolve(res.statusCode || 0)
            res.destroy()
            req.destroy()
          })
        }
      )
      req.on('error', () => {})
      req.end()
    })

    expect(statusCode).toBe(200)
  })
})

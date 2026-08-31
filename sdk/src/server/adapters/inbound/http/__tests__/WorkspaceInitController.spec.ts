import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'node:path'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { HttpServer } from '../../../../HttpServer'
import { WorkspaceLockManager } from '../../../outbound/mutex/WorkspaceLockManager'
import { InMemoryJobStore } from '../../../outbound/repository/InMemoryJobStore'
import { JobQueue } from '../../../outbound/queue/JobQueue'
import { RouteHandlers } from '../routes/RouteHandlers'
import { IncomingMessage, ServerResponse } from 'node:http'
import { EventEmitter } from 'node:events'

// Helper to test RouteHandlers directly with mock req/res
function createMockReqRes(options: {
  method: string
  url: string
  body?: any
  headers?: Record<string, string>
}) {
  const req = new EventEmitter() as any
  req.method = options.method
  req.url = options.url
  req.headers = { host: 'localhost:3000', ...(options.headers || {}) }
  req.socket = { remoteAddress: '127.0.0.1' }

  let statusCode = 200
  const headers: Record<string, string> = {}
  let body = ''

  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()]
    },
    writeHead(code: number, h?: any) {
      statusCode = code
      if (h) Object.assign(headers, h)
      return res
    },
    end(chunk?: any) {
      if (chunk) body += chunk.toString()
      res.statusCode = statusCode
      return res
    },
  } as any

  return {
    req,
    res,
    send() {
      if (options.body !== undefined) {
        const payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
        req.emit('data', Buffer.from(payload))
      }
      req.emit('end')
    },
    getResult() {
      let parsed: any
      try {
        parsed = JSON.parse(body)
      } catch {
        parsed = body
      }
      return { status: res.statusCode, headers, body: parsed }
    },
  }
}

describe('WorkspaceInitController / RouteHandlers HTTP Inbound API', () => {
  let tempDir: string
  let lockManager: WorkspaceLockManager
  let jobStore: InMemoryJobStore
  let jobQueue: JobQueue
  let handlers: RouteHandlers

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'hrns-controller-test-'))
    lockManager = new WorkspaceLockManager()
    jobStore = new InMemoryJobStore()
    jobQueue = new JobQueue()
    handlers = new RouteHandlers(jobStore, jobQueue, lockManager, {
      allowedWorkspaces: [tempDir],
    })
  })

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  })

  describe('GET /api/workspace/init/status', () => {
    it('should return HTTP 200 with WorkspaceInitStatusDTO JSON body for valid workspace', async () => {
      const { req, res, send, getResult } = createMockReqRes({
        method: 'GET',
        url: `/api/workspace/init/status?path=${encodeURIComponent(tempDir)}`,
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect(result.status).toBe(200)
      expect(result.body.hasExistingProduct).toBe(false)
      expect(result.body.hasExistingSettings).toBe(false)
      expect(result.body.defaultRules).toBeDefined()
      expect(result.body.defaultRules.planning).toBeDefined()
    })

    it('should detect existing docs/product directory when present', async () => {
      mkdirSync(join(tempDir, 'docs', 'product'), { recursive: true })

      const { req, res, send, getResult } = createMockReqRes({
        method: 'GET',
        url: `/api/workspace/init/status?path=${encodeURIComponent(tempDir)}`,
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect(result.status).toBe(200)
      expect(result.body.hasExistingProduct).toBe(true)
    })
  })

  describe('POST /api/workspace/init', () => {
    it('should return HTTP 201 with WorkspaceInitResultDTO when clean workspace is initialized', async () => {
      const { req, res, send, getResult } = createMockReqRes({
        method: 'POST',
        url: '/api/workspace/init',
        body: {
          workspacePath: tempDir,
          createSettings: true,
          customSteeringRules: {
            implementation: ['TDD Red-Green-Refactor'],
          },
        },
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect(result.status).toBe(201)
      expect(result.body.success).toBe(true)
      expect(result.body.workspacePath).toBe(tempDir)
      expect(result.body.createdFiles).toBeDefined()
      expect(result.body.createdFiles.length).toBeGreaterThan(0)
      expect(result.body.settingsPath).toBeDefined()
    })

    it('should return HTTP 409 Conflict when docs/product exists and forceOverwrite is missing or false', async () => {
      mkdirSync(join(tempDir, 'docs', 'product'), { recursive: true })

      const { req, res, send, getResult } = createMockReqRes({
        method: 'POST',
        url: '/api/workspace/init',
        body: {
          workspacePath: tempDir,
          forceOverwrite: false,
        },
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect(result.status).toBe(409)
      expect(result.body.code).toBe('CONFLICT')
    })

    it('should return HTTP 423 Locked / 409 Conflict when WorkspaceLockManager detects an active orchestrator job', async () => {
      await lockManager.acquire(tempDir, 'job-active-999')

      const { req, res, send, getResult } = createMockReqRes({
        method: 'POST',
        url: '/api/workspace/init',
        body: {
          workspacePath: tempDir,
        },
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect([409, 423]).toContain(result.status)
    })

    it('should return HTTP 400 Bad Request when request body contains malformed JSON or invalid phase keys', async () => {
      const { req, res, send, getResult } = createMockReqRes({
        method: 'POST',
        url: '/api/workspace/init',
        body: 'invalid-non-json-body{{{',
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect(result.status).toBe(400)
      expect(result.body.code).toBe('INVALID_JSON')
    })

    it('should return HTTP 400 Bad Request when customSteeringRules contains unsupported phase keys', async () => {
      const { req, res, send, getResult } = createMockReqRes({
        method: 'POST',
        url: '/api/workspace/init',
        body: {
          workspacePath: tempDir,
          customSteeringRules: {
            unsupportedPhase: ['Invalid rule'],
          },
        },
      })

      const handlePromise = handlers.handleRequest(req, res)
      send()
      await handlePromise

      const result = getResult()
      expect(result.status).toBe(400)
      expect(result.body.code).toBe('INVALID_PHASE_KEY')
    })
  })
})

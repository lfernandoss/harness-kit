import type { IncomingMessage, ServerResponse } from 'node:http'
import { ISessionRepository } from '../../../../domain/repositories/ISessionRepository'
import { CreateCycleSessionUseCase } from '../../../../application/use-cases/CreateCycleSessionUseCase'
import { ResumeCycleUseCase } from '../../../../application/use-cases/ResumeCycleUseCase'
import { AbortCycleUseCase } from '../../../../application/use-cases/AbortCycleUseCase'
import { SessionId } from '../../../../domain/value-objects/SessionId'
import { CycleId } from '../../../../domain/value-objects/CycleId'

export class SessionCycleRoutes {
  private sseClients: Set<ServerResponse> = new Set()

  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly createCycleUseCase: CreateCycleSessionUseCase,
    private readonly resumeCycleUseCase: ResumeCycleUseCase,
    private readonly abortCycleUseCase: AbortCycleUseCase
  ) {}

  private parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch (err) {
          reject(new Error('Invalid JSON payload'))
        }
      })
      req.on('error', reject)
    })
  }

  private sendJson(res: ServerResponse, statusCode: number, data: any): void {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end(JSON.stringify(data))
  }

  broadcastSSE(event: string, data: any): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const client of this.sseClients) {
      try {
        client.write(message)
      } catch {
        this.sseClients.delete(client)
      }
    }
  }

  handle(req: IncomingMessage, res: ServerResponse): boolean {
    const url = req.url || ''
    const method = req.method || 'GET'

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      })
      res.end()
      return true
    }

    // SSE Stream endpoint
    if (method === 'GET' && url.startsWith('/api/sessions/cycles/events')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      })
      res.write(': connected\n\n')
      this.sseClients.add(res)
      req.on('close', () => {
        this.sseClients.delete(res)
      })
      return true
    }

    // POST /api/sessions/cycles (Create session & start cycle)
    if (method === 'POST' && url === '/api/sessions/cycles') {
      this.parseBody(req)
        .then(async (body) => {
          if (!body.workspacePath) {
            return this.sendJson(res, 400, { error: 'workspacePath is required' })
          }
          const result = await this.createCycleUseCase.execute(body)
          this.broadcastSSE('session_created', result)
          this.sendJson(res, 201, result)
        })
        .catch((err) => {
          this.sendJson(res, 400, { error: err.message })
        })
      return true
    }

    // POST /api/sessions/cycles/resume
    if (method === 'POST' && url === '/api/sessions/cycles/resume') {
      this.parseBody(req)
        .then(async (body) => {
          if (!body.sessionId || !body.cycleId) {
            return this.sendJson(res, 400, { error: 'sessionId and cycleId are required' })
          }
          const result = await this.resumeCycleUseCase.execute(body)
          this.broadcastSSE('cycle_resumed', result)
          this.sendJson(res, 200, result)
        })
        .catch((err) => {
          this.sendJson(res, 400, { error: err.message })
        })
      return true
    }

    // POST /api/sessions/cycles/abort
    if (method === 'POST' && url === '/api/sessions/cycles/abort') {
      this.parseBody(req)
        .then(async (body) => {
          if (!body.cycleId) {
            return this.sendJson(res, 400, { error: 'cycleId is required' })
          }
          const result = await this.abortCycleUseCase.execute(body)
          this.broadcastSSE('cycle_aborted', result)
          this.sendJson(res, 200, result)
        })
        .catch((err) => {
          this.sendJson(res, 400, { error: err.message })
        })
      return true
    }

    // GET /api/sessions/:sessionId
    if (method === 'GET' && url.startsWith('/api/sessions/')) {
      const parts = url.split('/')
      const sessionIdStr = parts[3]
      if (sessionIdStr && !url.includes('/cycles/')) {
        try {
          const sessionId = new SessionId(sessionIdStr)
          this.sessionRepository.findSessionById(sessionId)
            .then((session) => {
              if (!session) {
                return this.sendJson(res, 404, { error: 'Session not found' })
              }
              this.sendJson(res, 200, session.toManifest())
            })
            .catch((err) => {
              this.sendJson(res, 500, { error: err.message })
            })
          return true
        } catch {
          this.sendJson(res, 400, { error: 'Invalid SessionId format' })
          return true
        }
      }
    }

    return false
  }
}

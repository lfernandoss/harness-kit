import type { IncomingMessage, ServerResponse } from 'node:http'
import { ParallelCycleCoordinator } from '../../../../application/use-cases/ParallelCycleCoordinator'

export class ParallelCycleRoutes {
  private sseClients: Set<ServerResponse> = new Set()

  constructor(private readonly coordinator: ParallelCycleCoordinator) {
    this.coordinator.subscribe((event) => {
      this.broadcastSSE('cycle_event', event)
    })
  }

  private parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch {
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

  private broadcastSSE(event: string, data: any): void {
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
    const method = (req.method || 'GET').toUpperCase()

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

    // GET /api/cycles/events (SSE Stream)
    if (method === 'GET' && url.startsWith('/api/cycles/events')) {
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

    // POST /api/cycles/parallel (Dispatch parallel cycles)
    if (method === 'POST' && url === '/api/cycles/parallel') {
      this.parseBody(req)
        .then(async (body) => {
          const cycles = Array.isArray(body.cycles) ? body.cycles : [body]
          if (cycles.length === 0) {
            return this.sendJson(res, 400, { error: 'No cycle configs provided' })
          }

          const dispatched = await this.coordinator.dispatchParallel(cycles)
          this.sendJson(res, 201, {
            batchId: `batch-${Date.now()}`,
            dispatched,
          })
        })
        .catch((err) => {
          this.sendJson(res, 400, { error: err.message })
        })
      return true
    }

    // GET /api/cycles/active
    if (method === 'GET' && url === '/api/cycles/active') {
      const activeCycles = this.coordinator.getActiveCycles()
      this.sendJson(res, 200, {
        activeCycles,
        count: activeCycles.length,
      })
      return true
    }

    // POST /api/cycles/:cycleId/approve-spec
    if (method === 'POST' && url.startsWith('/api/cycles/') && url.endsWith('/approve-spec')) {
      const parts = url.split('/')
      const cycleId = parts[3]
      if (cycleId) {
        this.coordinator
          .approveSpec(cycleId)
          .then((result) => this.sendJson(res, 200, result))
          .catch((err) => this.sendJson(res, 400, { error: err.message }))
        return true
      }
    }

    // POST /api/cycles/:cycleId/reject-spec
    if (method === 'POST' && url.startsWith('/api/cycles/') && url.endsWith('/reject-spec')) {
      const parts = url.split('/')
      const cycleId = parts[3]
      if (cycleId) {
        this.parseBody(req)
          .then(async (body) => {
            const feedback = body?.feedback || ''
            const result = await this.coordinator.rejectSpec(cycleId, feedback)
            this.sendJson(res, 200, result)
          })
          .catch((err) => this.sendJson(res, 400, { error: err.message }))
        return true
      }
    }

    // POST /api/cycles/:cycleId/abort
    if (method === 'POST' && url.startsWith('/api/cycles/') && url.endsWith('/abort')) {
      const parts = url.split('/')
      const cycleId = parts[3]
      if (cycleId) {
        this.parseBody(req)
          .then(async (body) => {
            const reason = body?.reason || 'API abort requested'
            const result = await this.coordinator.abortCycle(cycleId, reason)
            this.sendJson(res, 200, result)
          })
          .catch((err) => {
            this.sendJson(res, 400, { error: err.message })
          })
        return true
      }
    }

    return false
  }
}

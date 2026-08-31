import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  DiagnosticsController,
  InvalidCandidateIdError,
  ShellInjectionError,
} from '../controllers/DiagnosticsController.js'

async function readBody(req: IncomingMessage, maxBytes = 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) {
        req.destroy()
        reject(new Error('Payload size exceeds 1MB limit'))
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'))
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const jsonStr = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonStr, 'utf-8'),
  })
  res.end(jsonStr)
}

export function createDiagnosticsRouter(
  controller: DiagnosticsController = new DiagnosticsController()
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const rawUrl = req.url ?? '/'
    let parsedUrl: URL
    try {
      parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`)
    } catch {
      sendJson(res, 400, { error: 'Invalid URL', code: 'BAD_REQUEST' })
      return true
    }

    const pathname = parsedUrl.pathname
    const method = (req.method ?? 'GET').toUpperCase()

    if (
      !pathname.startsWith('/api/diagnose/sessions') &&
      !pathname.startsWith('/api/diagnose/run') &&
      !pathname.startsWith('/api/diagnose/candidates')
    ) {
      return false
    }

    try {
      // 1. GET /api/diagnose/sessions
      if (method === 'GET' && pathname === '/api/diagnose/sessions') {
        const sessions = await controller.getSessions()
        sendJson(res, 200, sessions)
        return true
      }

      // 2. POST /api/diagnose/run
      if (method === 'POST' && pathname === '/api/diagnose/run') {
        const rawBody = await readBody(req)
        let body: any = {}
        if (rawBody && rawBody.trim().length > 0) {
          try {
            body = JSON.parse(rawBody)
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON body', code: 'BAD_REQUEST' })
            return true
          }
        }

        const isSse =
          (req.headers.accept && req.headers.accept.includes('text/event-stream')) ||
          parsedUrl.searchParams.get('stream') === 'true'

        if (isSse) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          })
          res.write('event: ready\ndata: {"status":"started"}\n\n')

          const report = await controller.runBatch(body, (progress) => {
            res.write(`event: progress\ndata: ${JSON.stringify(progress)}\n\n`)
          })

          res.write(`event: complete\ndata: ${JSON.stringify(report)}\n\n`)
          res.end()
          return true
        }

        const report = await controller.runBatch(body)
        sendJson(res, 200, report)
        return true
      }

      // 3. GET /api/diagnose/candidates
      if (method === 'GET' && pathname === '/api/diagnose/candidates') {
        const candidates = await controller.getCandidates()
        sendJson(res, 200, candidates)
        return true
      }

      // 4. POST /api/diagnose/candidates/:id/promote
      if (method === 'POST' && pathname.startsWith('/api/diagnose/candidates/') && pathname.endsWith('/promote')) {
        const pathSuffix = pathname.replace('/api/diagnose/candidates/', '').replace(/\/promote$/, '')
        let candidateId = pathSuffix
        try {
          candidateId = decodeURIComponent(pathSuffix)
        } catch {
          sendJson(res, 400, { error: 'Invalid candidate ID encoding', code: 'BAD_REQUEST' })
          return true
        }

        const rawBody = await readBody(req)
        let body: any = {}
        if (rawBody && rawBody.trim().length > 0) {
          try {
            body = JSON.parse(rawBody)
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON body', code: 'BAD_REQUEST' })
            return true
          }
        }

        const result = await controller.promoteCandidate(candidateId, body)
        if (!result.success) {
          sendJson(res, 500, result)
        } else {
          sendJson(res, 200, result)
        }
        return true
      }

      // 5. GET /api/diagnose/candidates/:id
      if (method === 'GET' && pathname.startsWith('/api/diagnose/candidates/')) {
        const pathSuffix = pathname.replace('/api/diagnose/candidates/', '')
        let candidateId = pathSuffix
        try {
          candidateId = decodeURIComponent(pathSuffix)
        } catch {
          sendJson(res, 400, { error: 'Invalid candidate ID encoding', code: 'BAD_REQUEST' })
          return true
        }

        const candidate = await controller.getCandidate(candidateId)
        if (!candidate) {
          sendJson(res, 404, {
            error: `Candidate ${candidateId} not found`,
            code: 'NOT_FOUND',
          })
          return true
        }

        sendJson(res, 200, candidate)
        return true
      }

      return false
    } catch (err: any) {
      if (err instanceof InvalidCandidateIdError || err instanceof ShellInjectionError) {
        sendJson(res, 400, { error: err.message, code: 'BAD_REQUEST' })
        return true
      }

      sendJson(res, 500, {
        error: err.message || 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      })
      return true
    }
  }
}

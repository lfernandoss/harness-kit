import type { IncomingMessage, ServerResponse } from 'node:http'
import { ReportController } from '../controllers/ReportController.js'

function isLocalhost(req: IncomingMessage): boolean {
  const remoteAddress = req.socket?.remoteAddress ?? ''
  const hostHeader = req.headers.host ?? ''

  if (
    remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1' ||
    remoteAddress.endsWith('127.0.0.1')
  ) {
    return true
  }

  if (hostHeader.startsWith('localhost') || hostHeader.startsWith('127.0.0.1')) {
    // If remote address is set and not localhost, deny
    if (remoteAddress && remoteAddress !== '127.0.0.1' && remoteAddress !== '::1' && !remoteAddress.includes('127.0.0.1')) {
      return false
    }
    return true
  }

  return false
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const jsonStr = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonStr, 'utf-8'),
  })
  res.end(jsonStr)
}

export function createReportRouter(
  controller: ReportController = new ReportController()
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

    if (pathname !== '/api/reports') {
      return false
    }

    if (!isLocalhost(req)) {
      sendJson(res, 403, {
        error: 'Forbidden: Localhost access only',
        code: 'FORBIDDEN',
      })
      return true
    }

    if (method === 'GET') {
      try {
        const report = await controller.getReport()
        sendJson(res, 200, report)
        return true
      } catch (err: any) {
        sendJson(res, 500, {
          error: err.message || 'Failed to aggregate telemetry report',
          code: 'INTERNAL_SERVER_ERROR',
        })
        return true
      }
    }

    return false
  }
}

export const reportRouter = createReportRouter

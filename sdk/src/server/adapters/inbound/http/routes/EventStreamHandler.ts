import type { IncomingMessage, ServerResponse } from 'node:http'
import type { JobEventDTO } from '../../../../domain/types'

const SENSITIVE_PATTERNS = [
  /(?:(?:api[_-]?key|token|secret|password|bearer|auth|authorization)\s*[:=]\s*|bearer\s+)(["']?)([\w\-\.]{6,})\1/gi,
  /sk-ant-api[\w\-]+/gi,
  /sk-[\w\-]{20,}/gi,
  /gh[pousr]_[a-zA-Z0-9]{36,}/gi,
]

function sanitizeLogChunk(text: string): string {
  let sanitized = text
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, quote, secret) => {
      if (secret) {
        return match.replace(secret, '[REDACTED]')
      }
      return match.replace(/[\w\-\.]{6,}$/, '[REDACTED]')
    })
  }
  return sanitized
}

export class EventStreamBroadcaster {
  private static instance: EventStreamBroadcaster
  private clients = new Map<string, Set<ServerResponse>>()
  private buffers = new Map<string, JobEventDTO[]>()
  private readonly maxBufferSize = 500

  static getInstance(): EventStreamBroadcaster {
    if (!EventStreamBroadcaster.instance) {
      EventStreamBroadcaster.instance = new EventStreamBroadcaster()
    }
    return EventStreamBroadcaster.instance
  }

  addClient(jobId: string, client: ServerResponse): void {
    let jobClients = this.clients.get(jobId)
    if (!jobClients) {
      jobClients = new Set()
      this.clients.set(jobId, jobClients)
    }
    jobClients.add(client)

    const onClose = () => {
      this.removeClient(jobId, client)
    }

    client.on('close', onClose)
    client.on('finish', onClose)
  }

  removeClient(jobId: string, client: ServerResponse): void {
    const jobClients = this.clients.get(jobId)
    if (jobClients) {
      jobClients.delete(client)
      if (jobClients.size === 0) {
        this.clients.delete(jobId)
      }
    }
  }

  getClientCount(jobId: string): number {
    return this.clients.get(jobId)?.size ?? 0
  }

  getHistory(jobId: string): JobEventDTO[] {
    return this.buffers.get(jobId) ?? []
  }

  broadcast(jobId: string, rawEvent: JobEventDTO): void {
    let event: JobEventDTO = { ...rawEvent, jobId }

    if (event.type === 'log_chunk') {
      event = {
        ...event,
        text: sanitizeLogChunk(event.text),
      }
    }

    let jobBuffer = this.buffers.get(jobId)
    if (!jobBuffer) {
      jobBuffer = []
      this.buffers.set(jobId, jobBuffer)
    }

    jobBuffer.push(event)
    if (jobBuffer.length > this.maxBufferSize) {
      jobBuffer.shift()
    }

    const payload = `data: ${JSON.stringify(event)}\n\n`
    const jobClients = this.clients.get(jobId)
    if (jobClients) {
      for (const client of jobClients) {
        try {
          client.write(payload)
        } catch {
          this.removeClient(jobId, client)
        }
      }
    }
  }

  handleStreamRequest(
    req: IncomingMessage,
    res: ServerResponse,
    jobId: string
  ): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    })

    if (typeof (res as any).flushHeaders === 'function') {
      ;(res as any).flushHeaders()
    }

    // Replay history from ring buffer
    const history = this.getHistory(jobId)
    for (const event of history) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    this.addClient(jobId, res)
  }

  clear(jobId?: string): void {
    if (jobId) {
      this.buffers.delete(jobId)
      this.clients.delete(jobId)
    } else {
      this.buffers.clear()
      this.clients.clear()
    }
  }
}

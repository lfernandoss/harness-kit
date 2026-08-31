import type { IEventStreamClient, JobEventDTO } from '../types/index.js'

export class EventStreamClient implements IEventStreamClient {
  private eventSource?: EventSource
  private listeners = new Set<(event: JobEventDTO) => void>()
  private readonly baseUrl: string

  constructor(options?: { baseUrl?: string }) {
    this.baseUrl = (options?.baseUrl || '').replace(/\/+$/, '')
  }

  connect(jobId: string): void {
    this.disconnect()

    const url = `${this.baseUrl}/orchestrator/stream/${encodeURIComponent(jobId)}`
    if (typeof EventSource !== 'undefined') {
      this.eventSource = new EventSource(url)

      this.eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as JobEventDTO
          this.notify(data)
        } catch (err) {
          console.warn('Failed to parse SSE event data:', err)
        }
      }

      this.eventSource.onerror = () => {
        // SSE handles reconnection automatically
      }
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }
  }

  onEvent(handler: (event: JobEventDTO) => void): () => void {
    this.listeners.add(handler)
    return () => {
      this.listeners.delete(handler)
    }
  }

  private notify(event: JobEventDTO): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

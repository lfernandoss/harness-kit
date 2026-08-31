import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { EventEmitter } from 'node:events'
import { EventStreamBroadcaster } from '../EventStreamHandler'
import type { JobEventDTO } from '../../../../../domain/types'
import { Phase } from '../../../../../../orchestrator/types'



class MockResponse extends EventEmitter {
  public headers: Record<string, string> = {}
  public statusCode = 200
  public writtenData: string[] = []
  public ended = false

  setHeader(key: string, val: string) {
    this.headers[key.toLowerCase()] = val
  }

  writeHead(status: number, headers: Record<string, string>) {
    this.statusCode = status
    for (const [k, v] of Object.entries(headers)) {
      this.headers[k.toLowerCase()] = v
    }
  }

  write(data: string) {
    this.writtenData.push(data)
    return true
  }

  end() {
    this.ended = true
    this.emit('close')
  }
}

class MockRequest extends EventEmitter {
  public headers: Record<string, string> = {}
  public url = '/orchestrator/stream/test-job-1'
}

describe('2.1 EventStreamBroadcaster and SSE Streaming', () => {
  let broadcaster: EventStreamBroadcaster

  beforeEach(() => {
    broadcaster = new EventStreamBroadcaster()
  })

  it('Should stream phase_change and log_chunk events to multiple connected HTTP clients simultaneously', () => {
    const client1 = new MockResponse() as unknown as ServerResponse
    const client2 = new MockResponse() as unknown as ServerResponse

    broadcaster.addClient('job-1', client1)
    broadcaster.addClient('job-1', client2)

    expect(broadcaster.getClientCount('job-1')).toBe(2)

    const event1: JobEventDTO = {
      type: 'phase_change',
      phase: Phase.PLANNING,
      timestamp: Date.now(),
      jobId: 'job-1',
    }

    const event2: JobEventDTO = {
      type: 'log_chunk',
      stream: 'stdout',
      text: 'Compiling module...',
      timestamp: Date.now(),
      jobId: 'job-1',
    }

    broadcaster.broadcast('job-1', event1)
    broadcaster.broadcast('job-1', event2)

    const c1 = client1 as unknown as MockResponse
    const c2 = client2 as unknown as MockResponse

    expect(c1.writtenData.length).toBe(2)
    expect(c2.writtenData.length).toBe(2)

    expect(c1.writtenData[0]).toContain('data: ')
    expect(c1.writtenData[0]).toContain('"type":"phase_change"')
    expect(c1.writtenData[1]).toContain('"text":"Compiling module..."')

    expect(c2.writtenData[0]).toContain('"type":"phase_change"')
    expect(c2.writtenData[1]).toContain('"text":"Compiling module..."')
  })

  it('Should replay buffered events from the in-memory ring buffer (up to 500 events) upon new client connection', () => {
    // Broadcast 10 events before client connects
    for (let i = 0; i < 10; i++) {
      broadcaster.broadcast('job-replay', {
        type: 'log_chunk',
        stream: 'stdout',
        text: `Log line ${i}`,
        timestamp: Date.now() + i,
        jobId: 'job-replay',
      })
    }

    const client = new MockResponse() as unknown as ServerResponse
    broadcaster.handleStreamRequest(
      new MockRequest() as unknown as IncomingMessage,
      client,
      'job-replay'
    )

    const mock = client as unknown as MockResponse
    expect(mock.headers['content-type']).toBe('text/event-stream')
    expect(mock.headers['cache-control']).toBe('no-cache')
    expect(mock.headers['connection']).toBe('keep-alive')

    // Buffered events should have been written to client
    expect(mock.writtenData.length).toBe(10)
    expect(mock.writtenData[0]).toContain('Log line 0')
    expect(mock.writtenData[9]).toContain('Log line 9')
  })

  it('Should maintain a ring buffer capped at 500 events per job', () => {
    for (let i = 0; i < 550; i++) {
      broadcaster.broadcast('job-overflow', {
        type: 'log_chunk',
        stream: 'stdout',
        text: `Line ${i}`,
        timestamp: Date.now() + i,
        jobId: 'job-overflow',
      })
    }

    const history = broadcaster.getHistory('job-overflow')
    expect(history.length).toBe(500)
    // Oldest 50 lines (0..49) dropped; first event in buffer should be Line 50
    expect((history[0] as any).text).toBe('Line 50')
    expect((history[499] as any).text).toBe('Line 549')
  })

  it('Should remove client from active listener set when client disconnects without throwing errors', () => {
    const client = new MockResponse() as unknown as ServerResponse
    broadcaster.addClient('job-disc', client)
    expect(broadcaster.getClientCount('job-disc')).toBe(1)

    const mock = client as unknown as MockResponse
    mock.end()

    expect(broadcaster.getClientCount('job-disc')).toBe(0)

    // Broadcasting after disconnect should not throw
    expect(() => {
      broadcaster.broadcast('job-disc', {
        type: 'phase_change',
        phase: Phase.DEPLOY,
        timestamp: Date.now(),
      })
    }).not.toThrow()
  })

  it('Should sanitize sensitive environment variables and API keys from streamed terminal logs', () => {
    const client = new MockResponse() as unknown as ServerResponse
    broadcaster.addClient('job-sec', client)

    broadcaster.broadcast('job-sec', {
      type: 'log_chunk',
      stream: 'stdout',
      text: 'Using ANTHROPIC_API_KEY=sk-ant-api03-abcdef1234567890 and Bearer secret_token_xyz987654',
      timestamp: Date.now(),
      jobId: 'job-sec',
    })

    const mock = client as unknown as MockResponse
    expect(mock.writtenData[0]).not.toContain('sk-ant-api03-abcdef1234567890')
    expect(mock.writtenData[0]).not.toContain('secret_token_xyz987654')
    expect(mock.writtenData[0]).toContain('[REDACTED]')
  })
})

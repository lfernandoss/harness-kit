import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SwimlaneApiClient } from '../SwimlaneApiClient'

describe('SwimlaneApiClient Integration', () => {
  let client: SwimlaneApiClient
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    client = new SwimlaneApiClient('http://127.0.0.1:4000')
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('fetchSession should make GET request and return parsed JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'sess-001', workspacePath: 'C:\\test', cycles: [] }),
    } as Response)

    const session = await client.fetchSession('sess-001')
    expect(session.id).toBe('sess-001')
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4000/api/sessions/sess-001')
  })

  it('fetchSession should throw on non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response)

    await expect(client.fetchSession('sess-missing')).rejects.toThrow('Failed to fetch session: Not Found')
  })

  it('resumeCycle should make POST request to /resume', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ resumed: true }),
    } as Response)

    const res = await client.resumeCycle('sess-001', 'cycle-101', 'PHASE_A')
    expect(res.resumed).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4000/api/sessions/cycles/resume', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('resumeCycle should throw on non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
    } as Response)

    await expect(client.resumeCycle('sess-001', 'cycle-101')).rejects.toThrow('Failed to resume cycle: Bad Request')
  })

  it('abortCycle should make POST request to /abort', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ aborted: true }),
    } as Response)

    const res = await client.abortCycle('cycle-101', 'User stopped')
    expect(res.aborted).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:4000/api/sessions/cycles/abort', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('abortCycle should throw on non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Error',
    } as Response)

    await expect(client.abortCycle('cycle-101')).rejects.toThrow('Failed to abort cycle: Internal Error')
  })
})

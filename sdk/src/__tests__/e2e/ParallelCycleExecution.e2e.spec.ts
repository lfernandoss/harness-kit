import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { HttpServer } from '../../server/HttpServer'
import * as fs from 'fs'

describe('E2E: Parallel Cycle Management with Dedicated 1:1 Sessions', () => {
  let server: HttpServer
  let serverPort: number
  let baseUrl: string

  beforeAll(async () => {
    server = new HttpServer({ port: 0, host: '127.0.0.1' })
    await server.start()
    serverPort = server.getPort()
    baseUrl = `http://127.0.0.1:${serverPort}`
  })

  afterAll(async () => {
    if (server) {
      await server.stop()
    }
  })

  it('executes 3 cycles concurrently, assigning 1:1 dedicated session IDs and isolated worktrees', async () => {
    // 1. Dispatch 3 parallel cycles
    const dispatchRes = await fetch(`${baseUrl}/api/cycles/parallel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cycles: [
          { scope: 'E2E Task 1: Auth Module', category: 'backend', agent: 'antigravity-cli' },
          { scope: 'E2E Task 2: UI Dashboard', category: 'frontend', agent: 'antigravity-cli' },
          { scope: 'E2E Task 3: Security QA', category: 'qa', agent: 'antigravity-cli' }
        ]
      })
    })

    expect(dispatchRes.status).toBe(201)
    const dispatchData = await dispatchRes.json()
    expect(dispatchData.dispatched).toHaveLength(3)

    const [c1, c2, c3] = dispatchData.dispatched

    // Verify 1:1 session ID isolation
    const sessionIds = [c1.sessionId, c2.sessionId, c3.sessionId]
    const cycleIds = [c1.cycleId, c2.cycleId, c3.cycleId]

    expect(new Set(sessionIds).size).toBe(3)
    expect(new Set(cycleIds).size).toBe(3)

    // Verify isolated worktrees exist
    expect(fs.existsSync(c1.worktreePath)).toBe(true)
    expect(fs.existsSync(c2.worktreePath)).toBe(true)
    expect(fs.existsSync(c3.worktreePath)).toBe(true)

    // 2. Query active cycles
    const activeRes = await fetch(`${baseUrl}/api/cycles/active`)
    expect(activeRes.status).toBe(200)
    const activeData = await activeRes.json()
    expect(activeData.activeCycles.length).toBeGreaterThanOrEqual(3)

    // 3. Abort Cycle 1
    const abortRes = await fetch(`${baseUrl}/api/cycles/${c1.cycleId}/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'E2E abort cycle 1' })
    })

    expect(abortRes.status).toBe(200)
    const abortData = await abortRes.json()
    expect(abortData.status).toBe('ABORTED')

    // 4. Assert Cycle 1 worktree was cleaned up, and siblings remain active
    expect(fs.existsSync(c1.worktreePath)).toBe(false)
    expect(fs.existsSync(c2.worktreePath)).toBe(true)
    expect(fs.existsSync(c3.worktreePath)).toBe(true)

    // 5. Clean up remaining cycles
    await fetch(`${baseUrl}/api/cycles/${c2.cycleId}/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'E2E teardown' })
    })
    await fetch(`${baseUrl}/api/cycles/${c3.cycleId}/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'E2E teardown' })
    })

    expect(fs.existsSync(c2.worktreePath)).toBe(false)
    expect(fs.existsSync(c3.worktreePath)).toBe(false)
  })
})

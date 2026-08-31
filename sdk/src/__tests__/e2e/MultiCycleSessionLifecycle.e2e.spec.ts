import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as http from 'http'
import { MultiCycleTestHarness } from '../../test-fixtures/MultiCycleTestHarness'
import { PhaseSnapshot } from '../../server/domain/entities/PhaseSnapshot'

describe('Multi-Cycle Session Lifecycle & Reuse E2E', () => {
  let harness: MultiCycleTestHarness

  beforeEach(async () => {
    harness = new MultiCycleTestHarness()
    await harness.init(true)
  })

  afterEach(async () => {
    await harness.cleanup()
  })

  const request = (method: string, pathUrl: string, body?: Record<string, unknown>): Promise<{ status: number, data: any }> => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: harness.serverPort,
          path: pathUrl,
          method,
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          let raw = ''
          res.on('data', (chunk) => { raw += chunk })
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 500, data: JSON.parse(raw) })
            } catch {
              resolve({ status: res.statusCode || 500, data: raw })
            }
          })
        }
      )
      req.on('error', reject)
      if (body) {
        req.write(JSON.stringify(body))
      }
      req.end()
    })
  }

  it('should support multiple cycles attached to the same session ID via API', async () => {
    // Cycle 1: Create initial session
    const res1 = await request('POST', '/api/sessions/cycles', {
      workspacePath: harness.tempDir,
    })
    expect(res1.status).toBe(201)
    const sessionId = res1.data.sessionId
    const cycleId1 = res1.data.cycleId

    // Cycle 2: Attach to existing session
    const res2 = await request('POST', '/api/sessions/cycles', {
      sessionId,
      workspacePath: harness.tempDir,
    })
    expect(res2.status).toBe(201)
    expect(res2.data.sessionId).toBe(sessionId)
    const cycleId2 = res2.data.cycleId
    expect(cycleId2).not.toBe(cycleId1)

    // Cycle 3: Attach to existing session again
    const res3 = await request('POST', '/api/sessions/cycles', {
      sessionId,
      workspacePath: harness.tempDir,
    })
    expect(res3.status).toBe(201)
    expect(res3.data.sessionId).toBe(sessionId)
    const cycleId3 = res3.data.cycleId

    // Verify session manifest includes all 3 cycles
    const getRes = await request('GET', `/api/sessions/${sessionId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.data.cycles.length).toBe(3)
    const cycleIds = getRes.data.cycles.map((c: any) => c.id)
    expect(cycleIds).toContain(cycleId1)
    expect(cycleIds).toContain(cycleId2)
    expect(cycleIds).toContain(cycleId3)
  })

  it('should maintain atomic disk persistence without corrupting sibling cycle manifests during concurrent writes', async () => {
    const session = await harness.createSession()
    const cycle1 = await harness.attachCycle(session.id)
    const cycle2 = await harness.attachCycle(session.id)

    // Concurrently record phases and save
    cycle1.start()
    cycle1.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED', new Date()))
    cycle2.start()
    cycle2.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED', new Date()))

    await Promise.all([
      harness.sessionRepo.saveCycle(cycle1),
      harness.sessionRepo.saveCycle(cycle2),
    ])

    const reloadedSession = await harness.sessionRepo.findSessionById(session.id)
    expect(reloadedSession).not.toBeNull()
    expect(reloadedSession!.getCycles().length).toBe(2)

    const reloadedCycle1 = await harness.sessionRepo.findCycleById(cycle1.id, session.id)
    const reloadedCycle2 = await harness.sessionRepo.findCycleById(cycle2.id, session.id)

    expect(reloadedCycle1?.getSnapshots().length).toBe(1)
    expect(reloadedCycle2?.getSnapshots().length).toBe(1)
  })
})

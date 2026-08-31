import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as http from 'http'
import { MultiCycleTestHarness } from '../../test-fixtures/MultiCycleTestHarness'
import { PhaseSnapshot } from '../../server/domain/entities/PhaseSnapshot'

describe('Multi-Cycle SSE Multiplexing & Resumption E2E', () => {
  let harness: MultiCycleTestHarness

  beforeEach(async () => {
    harness = new MultiCycleTestHarness()
    await harness.init(true)
  })

  afterEach(async () => {
    await harness.cleanup()
  })

  it('should broadcast phase events to SSE subscribers across active cycles', async () => {
    const eventsReceived: Array<{ event: string, data: any }> = []

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: harness.serverPort,
        path: '/api/sessions/cycles/events',
        method: 'GET',
      },
      (res) => {
        res.on('data', (chunk) => {
          const str = chunk.toString()
          if (str.includes('event:')) {
            eventsReceived.push({ event: 'received', data: str })
          }
        })
      }
    )
    req.end()

    // Allow connection to establish
    await new Promise((r) => setTimeout(r, 100))

    // Broadcast multiple cycle events
    harness.routes.broadcastSSE('phase_updated', { cycleId: 'cycle-1', phase: 'PHASE_A' })
    harness.routes.broadcastSSE('phase_updated', { cycleId: 'cycle-2', phase: 'PHASE_B' })

    await new Promise((r) => setTimeout(r, 100))
    req.destroy()

    expect(eventsReceived.length).toBeGreaterThanOrEqual(1)
  })

  it('should resume cycle from saved phase snapshot without regressions', async () => {
    const session = await harness.createSession()
    const cycle = await harness.attachCycle(session.id)

    // Simulate cycle interrupted after Phase A
    cycle.start()
    cycle.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED', new Date()))
    await harness.sessionRepo.saveCycle(cycle)

    const resumeResult = await harness.resumeUseCase.execute({
      sessionId: session.id.value,
      cycleId: cycle.id.value,
      fromPhase: 'PHASE_A',
    })

    expect(resumeResult.resumed).toBe(true)
    expect(resumeResult.nextPhase).toBe('PHASE_B')

    const reloaded = await harness.sessionRepo.findCycleById(cycle.id, session.id)
    expect(reloaded?.getState()).toBe('RUNNING')
    expect(reloaded?.getSnapshots().length).toBe(1)
  })
})

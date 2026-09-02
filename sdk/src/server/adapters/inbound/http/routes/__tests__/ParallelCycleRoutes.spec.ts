import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ParallelCycleRoutes } from '../ParallelCycleRoutes'
import { ParallelCycleCoordinator } from '../../../../../application/use-cases/ParallelCycleCoordinator'
import { FileSessionRepository } from '../../../../outbound/persistence/FileSessionRepository'
import { WorktreeIsolationProvider } from '../../../../outbound/services/WorktreeIsolationProvider'
import { ProcessTreeManager } from '../../../../outbound/services/ProcessTreeManager'
import * as http from 'http'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

describe('ParallelCycleRoutes', () => {
  let tempDir: string
  let coordinator: ParallelCycleCoordinator
  let routes: ParallelCycleRoutes
  let server: http.Server
  let serverPort: number

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-test-'))
    const repo = new FileSessionRepository(tempDir)
    const wtProvider = new WorktreeIsolationProvider(tempDir)
    const procManager = new ProcessTreeManager()
    coordinator = new ParallelCycleCoordinator(repo, wtProvider, procManager)
    routes = new ParallelCycleRoutes(coordinator)

    server = http.createServer((req, res) => {
      const handled = routes.handle(req, res)
      if (!handled) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not Found' }))
      }
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number }
        serverPort = addr.port
        resolve()
      })
    })
  })

  afterEach(async () => {
    await coordinator.cleanup()
    if (server) {
      if (server.closeAllConnections) server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('handles POST /api/cycles/parallel and dispatches cycles', async () => {
    const res = await fetch(`http://127.0.0.1:${serverPort}/api/cycles/parallel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cycles: [
          { scope: 'Task 1', category: 'backend' },
          { scope: 'Task 2', category: 'frontend' }
        ]
      })
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.dispatched).toHaveLength(2)
    expect(data.dispatched[0].sessionId).not.toBe(data.dispatched[1].sessionId)
  })

  it('handles GET /api/cycles/active and returns current running cycles', async () => {
    await coordinator.dispatchParallel([
      { scope: 'Active Task 1', category: 'backend' }
    ])

    const res = await fetch(`http://127.0.0.1:${serverPort}/api/cycles/active`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activeCycles).toHaveLength(1)
    expect(data.activeCycles[0].category).toBe('backend')
  })

  it('handles POST /api/cycles/:cycleId/abort and cancels cycle', async () => {
    const dispatched = await coordinator.dispatchParallel([
      { scope: 'To Abort', category: 'qa' }
    ])

    const cycleId = dispatched[0].cycleId

    const res = await fetch(`http://127.0.0.1:${serverPort}/api/cycles/${cycleId}/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Unit test abort' })
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ABORTED')
    expect(coordinator.getActiveCycles()).toHaveLength(0)
  })

  it('handles POST /api/cycles/:cycleId/approve-spec and transitions cycle to DEVELOPMENT', async () => {
    const dispatched = await coordinator.dispatchParallel([
      { scope: 'Gate Test Task', category: 'backend' }
    ])
    const cycleId = dispatched[0].cycleId

    coordinator.setSpecApprovalPending(cycleId, { specSummary: 'Spec drafted' })

    const res = await fetch(`http://127.0.0.1:${serverPort}/api/cycles/${cycleId}/approve-spec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('RUNNING')
    expect(data.currentPhase).toBe('DEVELOPMENT')
  })
})

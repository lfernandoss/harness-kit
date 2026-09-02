import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ParallelCycleCoordinator, ParallelCycleConfig } from '../ParallelCycleCoordinator'
import { FileSessionRepository } from '../../../adapters/outbound/persistence/FileSessionRepository'
import { WorktreeIsolationProvider } from '../../../adapters/outbound/services/WorktreeIsolationProvider'
import { ProcessTreeManager } from '../../../adapters/outbound/services/ProcessTreeManager'
import { CycleState } from '../../../domain/value-objects/CycleState'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

describe('ParallelCycleCoordinator', () => {
  let tempDir: string
  let coordinator: ParallelCycleCoordinator
  let repo: FileSessionRepository
  let wtProvider: WorktreeIsolationProvider
  let procManager: ProcessTreeManager

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coord-test-'))
    repo = new FileSessionRepository(tempDir)
    wtProvider = new WorktreeIsolationProvider(tempDir)
    procManager = new ProcessTreeManager()
    coordinator = new ParallelCycleCoordinator(repo, wtProvider, procManager, { maxConcurrency: 4 })
  })

  afterEach(async () => {
    await coordinator.cleanup()
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('dispatches multiple cycles concurrently, each with its own unique SessionId and CycleId', async () => {
    const configs: ParallelCycleConfig[] = [
      { scope: 'Backend Auth Module', category: 'backend', agent: 'antigravity-cli' },
      { scope: 'Frontend Dashboard', category: 'frontend', agent: 'antigravity-cli' },
      { scope: 'Adversarial QA Suite', category: 'qa', agent: 'antigravity-cli' }
    ]

    const dispatched = await coordinator.dispatchParallel(configs)

    expect(dispatched).toHaveLength(3)
    // Verify each cycle has a distinct 1:1 session ID
    const sessionIds = dispatched.map((d) => d.sessionId)
    const cycleIds = dispatched.map((d) => d.cycleId)

    expect(new Set(sessionIds).size).toBe(3)
    expect(new Set(cycleIds).size).toBe(3)

    // Check active cycles
    const active = coordinator.getActiveCycles()
    expect(active).toHaveLength(3)
    expect(active[0].status).toBe('RUNNING')
    expect(active[0].worktreePath).toBeDefined()
  })

  it('aborts an individual running cycle and cleans up its worktree without affecting sibling cycles', async () => {
    const dispatched = await coordinator.dispatchParallel([
      { scope: 'Task A', category: 'backend' },
      { scope: 'Task B', category: 'frontend' }
    ])

    const targetCycleId = dispatched[0].cycleId
    const siblingCycleId = dispatched[1].cycleId

    const abortResult = await coordinator.abortCycle(targetCycleId, 'User requested cancel')
    expect(abortResult.status).toBe(CycleState.ABORTED)

    const active = coordinator.getActiveCycles()
    expect(active).toHaveLength(1)
    expect(active[0].cycleId).toBe(siblingCycleId)
  })

  it('broadcasts real-time multi-channel events across active cycles', async () => {
    const eventsReceived: any[] = []
    coordinator.subscribe((evt) => {
      eventsReceived.push(evt)
    })

    const dispatched = await coordinator.dispatchParallel([
      { scope: 'Task Alpha', category: 'backend' }
    ])

    coordinator.emitCycleEvent(dispatched[0].cycleId, 'phase_change', { phase: 'DEVELOPMENT' })

    expect(eventsReceived.length).toBeGreaterThan(0)
    const phaseEvt = eventsReceived.find((e) => e.type === 'phase_change')
    expect(phaseEvt).toBeDefined()
    expect(phaseEvt.cycleId).toBe(dispatched[0].cycleId)
    expect(phaseEvt.phase).toBe('DEVELOPMENT')
  })

  it('manages human-in-the-loop spec approval gate', async () => {
    const dispatched = await coordinator.dispatchParallel([
      { scope: 'Task with Approval', category: 'backend' }
    ])
    const cycleId = dispatched[0].cycleId

    // Move to WAITING_SPEC_APPROVAL
    coordinator.setSpecApprovalPending(cycleId, { specSummary: 'Auth design ready' })

    const activeBefore = coordinator.getActiveCycles()
    expect(activeBefore[0].status).toBe('WAITING_SPEC_APPROVAL')
    expect(activeBefore[0].specSummary).toBe('Auth design ready')

    // Approve spec
    const approvalResult = await coordinator.approveSpec(cycleId)
    expect(approvalResult.status).toBe(CycleState.RUNNING)
    expect(approvalResult.currentPhase).toBe('DEVELOPMENT')

    const activeAfter = coordinator.getActiveCycles()
    expect(activeAfter[0].status).toBe(CycleState.RUNNING)
    expect(activeAfter[0].currentPhase).toBe('DEVELOPMENT')
  })

  it('handles spec rejection and requests adjustments', async () => {
    const dispatched = await coordinator.dispatchParallel([
      { scope: 'Task to Adjust', category: 'frontend' }
    ])
    const cycleId = dispatched[0].cycleId

    coordinator.setSpecApprovalPending(cycleId, { specSummary: 'Initial draft' })

    const rejectResult = await coordinator.rejectSpec(cycleId, 'Need dark mode token specs')
    expect(rejectResult.status).toBe(CycleState.RUNNING)
    expect(rejectResult.currentPhase).toBe('REFINEMENT')
  })
})

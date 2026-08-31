import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AbortOrchestrationJobUseCase } from '../AbortOrchestrationJobUseCase'
import { InMemoryJobStore } from '../../../adapters/outbound/repository/InMemoryJobStore'
import { WorkspaceLockManager } from '../../../adapters/outbound/mutex/WorkspaceLockManager'
import { JobExecutionRegistry } from '../../../adapters/outbound/services/JobExecutionRegistry'
import { EventStreamBroadcaster } from '../../../adapters/inbound/http/routes/EventStreamHandler'
import { HttpServerError } from '../../../domain/types'

describe('1.2 AbortOrchestrationJobUseCase & 2.3 Explicit Subprocess Tree Abort', () => {
  let jobStore: InMemoryJobStore
  let lockManager: WorkspaceLockManager
  let executionRegistry: JobExecutionRegistry
  let broadcaster: EventStreamBroadcaster
  let useCase: AbortOrchestrationJobUseCase
  let abortController: AbortController

  beforeEach(() => {
    jobStore = new InMemoryJobStore()
    lockManager = new WorkspaceLockManager()
    executionRegistry = new JobExecutionRegistry()
    broadcaster = new EventStreamBroadcaster()
    abortController = new AbortController()

    useCase = new AbortOrchestrationJobUseCase(
      jobStore,
      lockManager,
      executionRegistry,
      broadcaster
    )
  })

  it('Should abort running job, update status to aborted, and release workspace lock', async () => {
    const workspace = '/test/workspace'
    await lockManager.acquireLock(workspace, 'job-abort-1')
    await jobStore.save({
      jobId: 'job-abort-1',
      status: 'running',
      workspacePath: workspace,
      request: { scope: 'test', project: 'test', agent: 'claude-cli', idempotencyKey: 'idemp-1' },
      createdAt: new Date().toISOString(),
    })

    const mockRunnerProcess = { kill: vi.fn(), pid: 12345 }
    executionRegistry.registerRunning('job-abort-1', {} as any, abortController, mockRunnerProcess as any)

    const result = await useCase.execute('job-abort-1', 'User requested abort')

    expect(result.aborted).toBe(true)
    expect(abortController.signal.aborted).toBe(true)

    const job = await jobStore.findById('job-abort-1')
    expect(job?.status).toBe('aborted')
    expect(await lockManager.isLocked(workspace)).toBe(false)
  })

  it('Should reject abort request with 404 when jobId does not exist', async () => {
    await expect(
      useCase.execute('unknown-job-id')
    ).rejects.toThrow(HttpServerError)
  })
})

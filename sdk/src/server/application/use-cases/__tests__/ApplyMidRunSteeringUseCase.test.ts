import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApplyMidRunSteeringUseCase } from '../ApplyMidRunSteeringUseCase'
import { InMemoryJobStore } from '../../../adapters/outbound/repository/InMemoryJobStore'
import { JobExecutionRegistry } from '../../../adapters/outbound/services/JobExecutionRegistry'
import { EventStreamBroadcaster } from '../../../adapters/inbound/http/routes/EventStreamHandler'
import { HttpServerError } from '../../../domain/types'
import { Phase } from '../../../../orchestrator/types'


describe('1.1 SteeringRequestDTO & 1.2 ApplyMidRunSteeringUseCase', () => {
  let jobStore: InMemoryJobStore
  let executionRegistry: JobExecutionRegistry
  let broadcaster: EventStreamBroadcaster
  let useCase: ApplyMidRunSteeringUseCase
  let mockOrchestrator: any

  beforeEach(() => {
    jobStore = new InMemoryJobStore()
    executionRegistry = new JobExecutionRegistry()
    broadcaster = new EventStreamBroadcaster()
    useCase = new ApplyMidRunSteeringUseCase(jobStore, executionRegistry, broadcaster)

    mockOrchestrator = {
      applySteering: vi.fn(),
      applySteeringActions: vi.fn(),
      state: { currentPhase: Phase.DEVELOPMENT },
    }
  })

  it('Should validate and accept add_rule steering action when rule text is within 5000 characters', async () => {
    await jobStore.save({
      jobId: 'job-active-1',
      status: 'running',
      workspacePath: '/tmp/ws',
      request: { scope: 'test', project: 'test', agent: 'claude-cli', idempotencyKey: 'idemp-1' },
      createdAt: new Date().toISOString(),
    })
    executionRegistry.registerRunning('job-active-1', mockOrchestrator)

    const result = await useCase.execute('job-active-1', {
      type: 'add_rule',
      rule: 'Enforce strict error boundaries',
    })

    expect(result.applied).toBe(true)
    expect(mockOrchestrator.applySteering).toHaveBeenCalled()
  })

  it('Should reject add_rule steering action when rule text exceeds 5000 characters or is empty', async () => {
    await jobStore.save({
      jobId: 'job-active-1',
      status: 'running',
      workspacePath: '/tmp/ws',
      request: { scope: 'test', project: 'test', agent: 'claude-cli', idempotencyKey: 'idemp-1' },
      createdAt: new Date().toISOString(),
    })
    executionRegistry.registerRunning('job-active-1', mockOrchestrator)

    // Empty rule
    await expect(
      useCase.execute('job-active-1', {
        type: 'add_rule',
        rule: '   ',
      })
    ).rejects.toThrow(HttpServerError)

    // Exceeds 5000 chars
    const hugeRule = 'a'.repeat(5001)
    await expect(
      useCase.execute('job-active-1', {
        type: 'add_rule',
        rule: hugeRule,
      })
    ).rejects.toThrow(HttpServerError)
  })

  it('Should validate rollback action when target phase is a valid resumable phase', async () => {
    await jobStore.save({
      jobId: 'job-active-1',
      status: 'running',
      workspacePath: '/tmp/ws',
      request: { scope: 'test', project: 'test', agent: 'claude-cli', idempotencyKey: 'idemp-1' },
      createdAt: new Date().toISOString(),
    })
    executionRegistry.registerRunning('job-active-1', mockOrchestrator)

    const result = await useCase.execute('job-active-1', {
      type: 'rollback',
      targetPhase: Phase.PLANNING,
    })

    expect(result.applied).toBe(true)
    expect(mockOrchestrator.applySteering).toHaveBeenCalled()
  })

  it('Should reject rollback action when target phase is invalid', async () => {
    await jobStore.save({
      jobId: 'job-active-1',
      status: 'running',
      workspacePath: '/tmp/ws',
      request: { scope: 'test', project: 'test', agent: 'claude-cli', idempotencyKey: 'idemp-1' },
      createdAt: new Date().toISOString(),
    })
    executionRegistry.registerRunning('job-active-1', mockOrchestrator)

    await expect(
      useCase.execute('job-active-1', {
        type: 'rollback',
        targetPhase: 'NON_EXISTENT_PHASE' as any,
      })
    ).rejects.toThrow(HttpServerError)
  })

  it('Should validate override_score action clamping scores between 0 and 10', async () => {
    await jobStore.save({
      jobId: 'job-active-1',
      status: 'running',
      workspacePath: '/tmp/ws',
      request: { scope: 'test', project: 'test', agent: 'claude-cli', idempotencyKey: 'idemp-1' },
      createdAt: new Date().toISOString(),
    })
    executionRegistry.registerRunning('job-active-1', mockOrchestrator)

    const result = await useCase.execute('job-active-1', {
      type: 'override_score',
      tl: 9.5,
      adv: 8.0,
    })

    expect(result.applied).toBe(true)
    expect(mockOrchestrator.applySteering).toHaveBeenCalled()
  })

  it('Should reject steering request with 404 when target jobId is not actively running', async () => {
    await expect(
      useCase.execute('non-existent-job', {
        type: 'add_rule',
        rule: 'Some rule',
      })
    ).rejects.toThrow(HttpServerError)
  })
})

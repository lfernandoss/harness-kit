import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  OrchestrationExecutionManager,
  useOrchestrationExecution,
} from '../useOrchestrationExecution.js'
import { Phase, RunMode } from '../../types/index.js'

import type { IOrchestrationApiClient, IEventStreamClient } from '../../types/index.js'



describe('1.2 useOrchestrationExecution hook & Manager', () => {
  let mockApiClient: IOrchestrationApiClient
  let mockStreamClient: IEventStreamClient
  let eventCallback: ((event: any) => void) | null = null

  beforeEach(() => {
    eventCallback = null
    mockApiClient = {
      startJob: vi.fn().mockResolvedValue({ jobId: 'job-999', status: 'queued' }),
      resumeJob: vi.fn().mockResolvedValue({ jobId: 'job-999', status: 'queued' }),
      abortJob: vi.fn().mockResolvedValue(undefined),
      steerJob: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn().mockResolvedValue({ status: 'running' }),
    }
    mockStreamClient = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onEvent: vi.fn((cb) => {
        eventCallback = cb
        return () => {
          eventCallback = null
        }
      }),
    }
  })

  it('Should initialize with null session state when no active job is running', () => {
    const manager = new OrchestrationExecutionManager(mockApiClient, mockStreamClient)
    expect(manager.session).toBeNull()
    expect(manager.isRunning).toBe(false)
  })

  it('Should start job, connect to event stream, and update session state', async () => {
    const manager = new OrchestrationExecutionManager(mockApiClient, mockStreamClient)
    await manager.startJob({
      scope: 'Build dashboard',
      mode: RunMode.THINKING,
    })

    expect(mockApiClient.startJob).toHaveBeenCalled()
    expect(mockStreamClient.connect).toHaveBeenCalledWith('job-999')
    expect(manager.session?.jobId).toBe('job-999')
    expect(manager.session?.status).toBe('queued')
  })

  it('Should update LiveSessionState phase and append logs upon receiving SSE messages', async () => {
    const manager = new OrchestrationExecutionManager(mockApiClient, mockStreamClient)
    await manager.startJob({
      scope: 'Build dashboard',
      mode: RunMode.THINKING,
    })

    expect(eventCallback).toBeDefined()

    // Receive phase_change event
    eventCallback!({
      type: 'phase_change',
      phase: Phase.PLANNING,
      timestamp: Date.now(),
      jobId: 'job-999',
    })

    expect(manager.session?.currentPhase).toBe(Phase.PLANNING)

    // Receive log_chunk event
    eventCallback!({
      type: 'log_chunk',
      stream: 'stdout',
      text: 'Running planning phase...',
      timestamp: Date.now(),
      jobId: 'job-999',
    })

    expect(manager.session?.logs.length).toBe(1)
    expect(manager.session?.logs[0].text).toBe('Running planning phase...')
  })

  it('Should update connection status to disconnected when EventSource closes', async () => {
    const manager = new OrchestrationExecutionManager(mockApiClient, mockStreamClient)
    await manager.startJob({
      scope: 'Build dashboard',
      mode: RunMode.THINKING,
    })

    manager.handleStreamDisconnect()
    expect(manager.session?.isConnected).toBe(false)
  })
})

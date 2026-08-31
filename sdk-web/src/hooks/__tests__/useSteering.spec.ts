import { describe, it, expect, vi } from 'vitest'
import { SteeringManager, useSteering } from '../useSteering.js'
import type { IOrchestrationApiClient } from '../../types/index.js'
import { Phase } from '../../types/index.js'


describe('1.2 useSteering & SteeringManager', () => {
  it('Should dispatch POST request with JSON-serialized SteeringRequestDTO to /orchestrator/jobs/:jobId/steering', async () => {
    const mockApiClient: IOrchestrationApiClient = {
      startJob: vi.fn(),
      resumeJob: vi.fn(),
      abortJob: vi.fn(),
      steerJob: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn(),
    }

    const manager = new SteeringManager('job-test-1', mockApiClient)
    await manager.submitSteering({
      type: 'add_rule',
      rule: 'Never use console.log in prod',
    })

    expect(mockApiClient.steerJob).toHaveBeenCalledWith('job-test-1', {
      type: 'add_rule',
      rule: 'Never use console.log in prod',
    })
    expect(manager.isSubmitting).toBe(false)
    expect(manager.error).toBeNull()
  })

  it('Should handle API errors gracefully when steering submission fails', async () => {
    const mockApiClient: IOrchestrationApiClient = {
      startJob: vi.fn(),
      resumeJob: vi.fn(),
      abortJob: vi.fn(),
      steerJob: vi.fn().mockRejectedValue(new Error('Job not running')),
      getStatus: vi.fn(),
    }

    const manager = new SteeringManager('job-test-1', mockApiClient)
    await expect(
      manager.submitSteering({
        type: 'rollback',
        targetPhase: Phase.PLANNING,
      })
    ).rejects.toThrow('Job not running')

    expect(manager.error).toBe('Job not running')
    expect(manager.isSubmitting).toBe(false)
  })
})

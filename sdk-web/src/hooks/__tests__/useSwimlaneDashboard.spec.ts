import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SwimlaneApiClient, SessionManifestDto } from '../../services/SwimlaneApiClient'
import { useSwimlaneDashboard } from '../useSwimlaneDashboard'

describe('SwimlaneApiClient & useSwimlaneDashboard Hook', () => {
  let mockApiClient: SwimlaneApiClient

  beforeEach(() => {
    mockApiClient = {
      baseUrl: 'http://127.0.0.1:4000',
      fetchSession: vi.fn().mockResolvedValue({
        id: 'sess-001',
        workspacePath: 'C:\\workspace',
        cycles: [
          {
            id: 'cycle-101',
            sessionId: 'sess-001',
            state: 'RUNNING',
            snapshots: [{ phase: 'PHASE_A', verdict: 'PASSED' }],
            createdAt: '2026-08-31T10:00:00.000Z',
            updatedAt: '2026-08-31T10:05:00.000Z',
          },
        ],
      } as SessionManifestDto),
      resumeCycle: vi.fn().mockResolvedValue({ resumed: true }),
      abortCycle: vi.fn().mockResolvedValue({ aborted: true }),
    } as unknown as SwimlaneApiClient
  })

  it('SwimlaneApiClient should parse session manifest properly', async () => {
    const manifest = await mockApiClient.fetchSession('sess-001')
    expect(manifest.id).toBe('sess-001')
    expect(manifest.cycles.length).toBe(1)
  })

  it('useSwimlaneDashboard should group cycles into category lanes', async () => {
    const controller = useSwimlaneDashboard({
      apiClient: mockApiClient,
      sessionId: 'sess-001',
    })

    await controller.loadSession('sess-001')
    const state = controller.getState()

    expect(state.session?.id).toBe('sess-001')
    expect(state.lanes.length).toBeGreaterThan(0)
    expect(state.lanes[0].cycles.length).toBe(1)
  })

  it('useSwimlaneDashboard should handle real-time phase updates via SSE event handler', async () => {
    const controller = useSwimlaneDashboard({
      apiClient: mockApiClient,
      sessionId: 'sess-001',
    })

    await controller.loadSession('sess-001')
    controller.handleSseEvent('cycle_phase_updated', {
      cycleId: 'cycle-101',
      phase: 'PHASE_B',
      status: 'COMPLETED',
    })

    const state = controller.getState()
    const updatedCycle = state.lanes[0].cycles[0]
    expect(updatedCycle.currentPhase).toBe('PHASE_B')
  })

  it('useSwimlaneDashboard should trigger abortCycle and update state', async () => {
    const controller = useSwimlaneDashboard({
      apiClient: mockApiClient,
      sessionId: 'sess-001',
    })

    await controller.loadSession('sess-001')
    await controller.abortCycle('cycle-101')

    expect(mockApiClient.abortCycle).toHaveBeenCalledWith('cycle-101')
    const state = controller.getState()
    expect(state.lanes[0].cycles[0].state).toBe('ABORTED')
  })
})

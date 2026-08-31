import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SwimlaneDashboardController } from '../../hooks/useSwimlaneDashboard'
import { SwimlaneApiClient } from '../../services/SwimlaneApiClient'
import { SwimlaneDashboardView } from '../../views/orchestrator/SwimlaneDashboardView'

describe('SwimlaneDashboardIntegration E2E', () => {
  let mockApiClient: SwimlaneApiClient
  let controller: SwimlaneDashboardController

  beforeEach(() => {
    mockApiClient = {
      baseUrl: 'http://127.0.0.1:4000',
      fetchSession: vi.fn().mockResolvedValue({
        id: 'sess-e2e-001',
        workspacePath: 'C:\\test\\workspace',
        createdAt: '2026-08-31T10:00:00.000Z',
        updatedAt: '2026-08-31T10:30:00.000Z',
        cycles: [
          {
            id: 'cycle-e2e-1',
            sessionId: 'sess-e2e-001',
            state: 'RUNNING',
            createdAt: '2026-08-31T10:00:00.000Z',
            updatedAt: '2026-08-31T10:10:00.000Z',
            snapshots: [
              { phase: 'PHASE_A', verdict: 'PASSED', recordedAt: '2026-08-31T10:05:00.000Z' },
              { phase: 'PHASE_B', verdict: 'RUNNING', recordedAt: '2026-08-31T10:10:00.000Z' },
            ],
          },
          {
            id: 'cycle-e2e-2',
            sessionId: 'sess-e2e-001',
            state: 'COMPLETED',
            createdAt: '2026-08-31T10:15:00.000Z',
            updatedAt: '2026-08-31T10:25:00.000Z',
            snapshots: [
              { phase: 'PHASE_A', verdict: 'PASSED', recordedAt: '2026-08-31T10:20:00.000Z' },
              { phase: 'PHASE_B', verdict: 'PASSED', recordedAt: '2026-08-31T10:25:00.000Z' },
            ],
          },
        ],
      }),
      resumeCycle: vi.fn().mockResolvedValue({ resumed: true }),
      abortCycle: vi.fn().mockResolvedValue({ aborted: true }),
    } as unknown as SwimlaneApiClient

    controller = new SwimlaneDashboardController({
      apiClient: mockApiClient,
      sessionId: 'sess-e2e-001',
    })
  })

  it('should load multi-cycle session into dashboard and render full interactive swimlane canvas', async () => {
    await controller.loadSession('sess-e2e-001')

    const view = new SwimlaneDashboardView({ controller })
    const html = view.render()

    expect(html).toContain('sess-e2e-001')
    expect(html).toContain('cycle-e2e-1')
    expect(html).toContain('cycle-e2e-2')
    expect(html).toContain('swimlane-time-scale-header')
    expect(html).toContain('swimlane-category-lane')
  })

  it('should handle card selection, open detail drawer, and trigger abort through controller', async () => {
    await controller.loadSession('sess-e2e-001')
    controller.selectCycle('cycle-e2e-1')

    const view = new SwimlaneDashboardView({ controller })
    const htmlWithDrawer = view.render()

    expect(htmlWithDrawer).toContain('swimlane-detail-drawer open')
    expect(htmlWithDrawer).toContain('Cycle Details: cycle-e2e-1')
    expect(htmlWithDrawer).toContain('PHASE_A')
    expect(htmlWithDrawer).toContain('btn-abort-cycle')

    await controller.abortCycle('cycle-e2e-1', 'Manual stop')
    expect(mockApiClient.abortCycle).toHaveBeenCalledWith('cycle-e2e-1', 'Manual stop')

    const state = controller.getState()
    expect(state.lanes[0].cycles.find((c) => c.id === 'cycle-e2e-1')?.state).toBe('ABORTED')
  })
})

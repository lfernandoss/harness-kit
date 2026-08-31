import { describe, it, expect, vi } from 'vitest'
import { CategoryFilterBar } from '../components/CategoryFilterBar'
import { SwimlaneDashboardView } from '../SwimlaneDashboardView'
import { SwimlaneDashboardController } from '../../../hooks/useSwimlaneDashboard'
import { SwimlaneApiClient } from '../../../services/SwimlaneApiClient'

describe('CategoryFilterBar & SwimlaneDashboardView Components', () => {
  it('CategoryFilterBar should render filter pill buttons and handle select', () => {
    const onSelect = vi.fn()
    const filterBar = new CategoryFilterBar({
      categories: ['ALL', 'BACKEND', 'FRONTEND', 'QA'],
      selectedCategory: 'ALL',
      onSelectCategory: onSelect,
    })

    const html = filterBar.render()
    expect(html).toContain('swimlane-category-filter-bar')
    expect(html).toContain('filter-pill active')
    expect(html).toContain('BACKEND')

    filterBar.handleSelect('BACKEND')
    expect(onSelect).toHaveBeenCalledWith('BACKEND')
  })

  it('SwimlaneDashboardView should render complete dashboard canvas', async () => {
    const mockClient = {
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
      }),
    } as unknown as SwimlaneApiClient

    const controller = new SwimlaneDashboardController({ apiClient: mockClient })
    await controller.loadSession('sess-001')

    const view = new SwimlaneDashboardView({ controller })
    const html = view.render()

    expect(html).toContain('swimlane-dashboard-view')
    expect(html).toContain('swimlane-session-selector')
    expect(html).toContain('swimlane-category-filter-bar')
    expect(html).toContain('swimlane-time-scale-header')
    expect(html).toContain('swimlane-category-lane')
    expect(html).toContain('cycle-101')
  })
})

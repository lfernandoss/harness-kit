import { describe, it, expect, vi } from 'vitest'
import { SessionSelector, SessionSummaryOption } from '../SessionSelector'
import { CycleDetailDrawer, CycleDetailData } from '../CycleDetailDrawer'

describe('SessionSelector & CycleDetailDrawer Components', () => {
  it('SessionSelector should render session options and trigger onSelect', () => {
    const onSelect = vi.fn()
    const options: SessionSummaryOption[] = [
      { id: 'sess-001', label: 'Session 1 (3 cycles)', createdAt: '2026-08-31T10:00:00.000Z' },
      { id: 'sess-002', label: 'Session 2 (1 cycle)', createdAt: '2026-08-31T11:00:00.000Z' },
    ]

    const selector = new SessionSelector({
      sessions: options,
      selectedSessionId: 'sess-001',
      onSelectSession: onSelect,
    })

    const html = selector.render()
    expect(html).toContain('swimlane-session-selector')
    expect(html).toContain('sess-001')
    expect(html).toContain('sess-002')

    selector.handleSelect('sess-002')
    expect(onSelect).toHaveBeenCalledWith('sess-002')
  })

  it('CycleDetailDrawer should render phase snapshots and action buttons', () => {
    const onResume = vi.fn()
    const onAbort = vi.fn()
    const onClose = vi.fn()

    const cycleData: CycleDetailData = {
      id: 'cycle-101',
      sessionId: 'sess-abc',
      state: 'RUNNING',
      snapshots: [
        { phase: 'PHASE_A', verdict: 'PASSED', recordedAt: '2026-08-31T10:01:00.000Z' },
        { phase: 'PHASE_B', verdict: 'IN_PROGRESS', recordedAt: '2026-08-31T10:02:00.000Z' },
      ],
    }

    const drawer = new CycleDetailDrawer({
      cycle: cycleData,
      isOpen: true,
      onResume,
      onAbort,
      onClose,
    })

    const html = drawer.render()
    expect(html).toContain('swimlane-detail-drawer')
    expect(html).toContain('cycle-101')
    expect(html).toContain('PHASE_A')
    expect(html).toContain('PASSED')
    expect(html).toContain('btn-abort-cycle')

    drawer.triggerAbort()
    expect(onAbort).toHaveBeenCalledWith('cycle-101')
  })

  it('CycleDetailDrawer should return empty when closed', () => {
    const drawer = new CycleDetailDrawer({
      isOpen: false,
    })
    expect(drawer.render()).toBe('')
  })
})

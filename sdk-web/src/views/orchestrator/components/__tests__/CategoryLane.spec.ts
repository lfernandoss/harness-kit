import { describe, it, expect, vi } from 'vitest'
import { CycleCard, CycleCardModel } from '../CycleCard'
import { CategoryLane, CategoryLaneModel } from '../CategoryLane'

describe('CycleCard and CategoryLane Components', () => {
  const sampleCycle: CycleCardModel = {
    id: 'cycle-101',
    sessionId: 'sess-abc',
    category: 'backend',
    state: 'RUNNING',
    label: 'Backend TDD Run',
    startTime: '2026-08-31T10:00:00.000Z',
    endTime: '2026-08-31T10:05:00.000Z',
    currentPhase: 'PHASE_B',
  }

  it('CycleCard should render with computed pixel offset and width', () => {
    const onSelect = vi.fn()
    const card = new CycleCard({
      cycle: sampleCycle,
      baseTime: '2026-08-31T10:00:00.000Z',
      scale: 1,
      onSelect,
    })

    const html = card.render()
    expect(html).toContain('swimlane-cycle-card')
    expect(html).toContain('cycle-101')
    expect(html).toContain('RUNNING')
    expect(html).toContain('left: 0px')
    expect(html).toContain('width: 300px')
  })

  it('CycleCard should emit onSelect when handleClick is called', () => {
    const onSelect = vi.fn()
    const card = new CycleCard({
      cycle: sampleCycle,
      baseTime: '2026-08-31T10:00:00.000Z',
      scale: 1,
      onSelect,
    })

    card.handleClick()
    expect(onSelect).toHaveBeenCalledWith('cycle-101', 'sess-abc')
  })

  it('CategoryLane should render lane title and child cycle cards', () => {
    const laneModel: CategoryLaneModel = {
      category: 'backend',
      displayName: 'Backend Engineering',
      cycles: [sampleCycle],
    }

    const lane = new CategoryLane({
      lane: laneModel,
      baseTime: '2026-08-31T10:00:00.000Z',
      scale: 1,
      onSelectCycle: vi.fn(),
    })

    const html = lane.render()
    expect(html).toContain('swimlane-category-lane')
    expect(html).toContain('Backend Engineering')
    expect(html).toContain('cycle-101')
  })
})

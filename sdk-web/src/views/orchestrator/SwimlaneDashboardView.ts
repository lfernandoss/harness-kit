import { SwimlaneDashboardController } from '../../hooks/useSwimlaneDashboard'
import { TimeScaleHeader } from './components/TimeScaleHeader'
import { CategoryLane } from './components/CategoryLane'
import { SessionSelector } from './components/SessionSelector'
import { CategoryFilterBar } from './components/CategoryFilterBar'
import { CycleDetailDrawer } from './components/CycleDetailDrawer'

export interface SwimlaneDashboardViewProps {
  controller: SwimlaneDashboardController
  pixelsPerSecond?: number
}

export class SwimlaneDashboardView {
  constructor(private readonly props: SwimlaneDashboardViewProps) {}

  render(): string {
    const state = this.props.controller.getState()
    const baseTime = state.session?.createdAt || new Date().toISOString()

    const sessionSelector = new SessionSelector({
      sessions: state.session ? [{ id: state.session.id, label: `Session (${state.session.id})`, createdAt: state.session.createdAt }] : [],
      selectedSessionId: state.selectedSessionId || undefined,
      onSelectSession: (id) => this.props.controller.loadSession(id),
    })

    const categories = ['ALL', ...Array.from(new Set(state.lanes.map((l) => l.category.toUpperCase())))]
    const filterBar = new CategoryFilterBar({
      categories,
      selectedCategory: state.categoryFilter,
      onSelectCategory: (cat) => this.props.controller.setFilter(cat),
    })

    const timeHeader = new TimeScaleHeader({
      baseTime,
      totalDurationSeconds: 3600,
      zoomLevel: '15m',
      pixelsPerSecond: this.props.pixelsPerSecond || 1,
    })

    const visibleLanes = state.categoryFilter === 'ALL'
      ? state.lanes
      : state.lanes.filter((l) => l.category.toUpperCase() === state.categoryFilter)

    const lanesHtml = visibleLanes
      .map((l) => {
        const laneComp = new CategoryLane({
          lane: l,
          baseTime,
          scale: this.props.pixelsPerSecond || 1,
          onSelectCycle: (cycleId) => this.props.controller.selectCycle(cycleId),
        })
        return laneComp.render()
      })
      .join('\n')

    const selectedCycle = state.session?.cycles?.find((c) => c.id === state.selectedCycleId)
    const drawer = new CycleDetailDrawer({
      isOpen: Boolean(state.selectedCycleId && selectedCycle),
      cycle: selectedCycle
        ? {
            id: selectedCycle.id,
            sessionId: selectedCycle.sessionId,
            state: selectedCycle.state,
            snapshots: selectedCycle.snapshots || [],
            abortReason: selectedCycle.abortReason,
          }
        : undefined,
      onAbort: (cycleId) => this.props.controller.abortCycle(cycleId),
      onResume: (cycleId, fromPhase) => this.props.controller.resumeCycle(selectedCycle!.sessionId, cycleId, fromPhase),
      onClose: () => this.props.controller.selectCycle(null),
    })

    return `
      <div class="swimlane-dashboard-view">
        <div class="top-controls-bar">
          ${sessionSelector.render()}
          ${filterBar.render()}
        </div>
        <div class="swimlane-canvas-wrapper">
          <div class="time-scale-header-container">
            ${timeHeader.render()}
          </div>
          <div class="lanes-track-container">
            ${lanesHtml}
          </div>
        </div>
        ${drawer.render()}
      </div>
    `.trim()
  }
}

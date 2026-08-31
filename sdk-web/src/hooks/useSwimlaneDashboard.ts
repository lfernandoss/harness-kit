import { SwimlaneApiClient, SessionManifestDto, CycleManifestDto } from '../services/SwimlaneApiClient'
import { CategoryLaneModel } from '../views/orchestrator/components/CategoryLane'
import { CycleCardModel } from '../views/orchestrator/components/CycleCard'

export interface SwimlaneDashboardConfig {
  apiClient?: SwimlaneApiClient
  sessionId?: string
  workspacePath?: string
}

export interface SwimlaneDashboardState {
  session: SessionManifestDto | null
  lanes: CategoryLaneModel[]
  selectedCycleId: string | null
  selectedSessionId: string | null
  categoryFilter: string
  isConnected: boolean
  error: string | null
}

export class SwimlaneDashboardController {
  private state: SwimlaneDashboardState = {
    session: null,
    lanes: [],
    selectedCycleId: null,
    selectedSessionId: null,
    categoryFilter: 'ALL',
    isConnected: false,
    error: null,
  }

  private apiClient: SwimlaneApiClient

  constructor(config: SwimlaneDashboardConfig = {}) {
    this.apiClient = config.apiClient || new SwimlaneApiClient()
    this.state.selectedSessionId = config.sessionId || null
  }

  getState(): Readonly<SwimlaneDashboardState> {
    return this.state
  }

  setFilter(category: string): void {
    this.state.categoryFilter = category
  }

  selectCycle(cycleId: string | null): void {
    this.state.selectedCycleId = cycleId
  }

  private buildLanes(cycles: CycleManifestDto[]): CategoryLaneModel[] {
    const laneMap: Map<string, CycleCardModel[]> = new Map()
    laneMap.set('default', [])

    for (const c of cycles) {
      const category = 'default'
      const card: CycleCardModel = {
        id: c.id,
        sessionId: c.sessionId,
        category,
        state: c.state,
        startTime: c.createdAt,
        endTime: c.updatedAt,
        currentPhase: c.snapshots?.[c.snapshots.length - 1]?.phase,
      }
      if (!laneMap.has(category)) {
        laneMap.set(category, [])
      }
      laneMap.get(category)!.push(card)
    }

    const lanes: CategoryLaneModel[] = []
    for (const [cat, items] of laneMap.entries()) {
      lanes.push({
        category: cat,
        displayName: cat === 'default' ? 'General Cycles' : cat.toUpperCase(),
        cycles: items,
      })
    }
    return lanes
  }

  async loadSession(sessionId: string): Promise<void> {
    try {
      const manifest = await this.apiClient.fetchSession(sessionId)
      this.state.session = manifest
      this.state.selectedSessionId = sessionId
      this.state.lanes = this.buildLanes(manifest.cycles || [])
      this.state.error = null
    } catch (err: any) {
      this.state.error = err.message || 'Failed to load session'
    }
  }

  handleSseEvent(eventType: string, data: any): void {
    if (eventType === 'cycle_phase_updated' && data.cycleId) {
      for (const lane of this.state.lanes) {
        const cycle = lane.cycles.find((c) => c.id === data.cycleId)
        if (cycle) {
          cycle.currentPhase = data.phase
          if (data.status) {
            cycle.state = data.status
          }
        }
      }
    }
  }

  async abortCycle(cycleId: string, reason?: string): Promise<void> {
    if (reason !== undefined) {
      await this.apiClient.abortCycle(cycleId, reason)
    } else {
      await this.apiClient.abortCycle(cycleId)
    }
    for (const lane of this.state.lanes) {
      const cycle = lane.cycles.find((c) => c.id === cycleId)
      if (cycle) {
        cycle.state = 'ABORTED'
      }
    }
  }

  async resumeCycle(sessionId: string, cycleId: string, fromPhase?: string): Promise<void> {
    await this.apiClient.resumeCycle(sessionId, cycleId, fromPhase)
    for (const lane of this.state.lanes) {
      const cycle = lane.cycles.find((c) => c.id === cycleId)
      if (cycle) {
        cycle.state = 'RUNNING'
      }
    }
  }
}

export function useSwimlaneDashboard(config: SwimlaneDashboardConfig = {}): SwimlaneDashboardController {
  return new SwimlaneDashboardController(config)
}

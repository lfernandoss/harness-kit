import { ISessionRepository } from '../../domain/repositories/ISessionRepository'
import { IWorktreeProvider } from '../../adapters/outbound/services/WorktreeIsolationProvider'
import { ProcessTreeManager } from '../../adapters/outbound/services/ProcessTreeManager'
import { AutonomousCycleSession } from '../../domain/aggregates/AutonomousCycleSession'
import { CycleId } from '../../domain/value-objects/CycleId'
import { SessionId } from '../../domain/value-objects/SessionId'
import { CycleState } from '../../domain/value-objects/CycleState'

export interface ParallelCycleConfig {
  scope: string
  category?: string
  agent?: string
  mode?: string
}

export interface ParallelCycleDispatchedResult {
  cycleId: string
  sessionId: string
  category: string
  status: string
  worktreePath: string
}

export interface ParallelCycleActiveItem {
  cycleId: string
  sessionId: string
  category: string
  status: string
  currentPhase?: string
  worktreePath: string
  startedAt: string
  tokensUsed?: number
  costEstimate?: number
  specSummary?: string
  scope?: string
}

export interface CoordinatorOptions {
  maxConcurrency?: number
}

export class ParallelCycleCoordinator {
  private activeCycleSessions = new Map<string, AutonomousCycleSession>()
  private listeners: Set<(event: any) => void> = new Set()
  private maxConcurrency: number

  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly worktreeProvider: IWorktreeProvider,
    private readonly processTreeManager: ProcessTreeManager,
    options: CoordinatorOptions = {}
  ) {
    this.maxConcurrency = options.maxConcurrency ?? 4
  }

  async dispatchParallel(configs: ParallelCycleConfig[]): Promise<ParallelCycleDispatchedResult[]> {
    const results: ParallelCycleDispatchedResult[] = []

    for (const config of configs) {
      const cycleId = CycleId.generate()
      const sessionId = SessionId.generate()
      const category = config.category || 'general'

      // Provision isolated worktree for this cycle
      const worktreePath = await this.worktreeProvider.createWorktree(cycleId)

      // Create 1:1 AutonomousCycleSession aggregate
      const cycleSession = new AutonomousCycleSession(
        cycleId,
        sessionId,
        category,
        worktreePath,
        CycleState.RUNNING,
        new Date(),
        {
          scope: config.scope,
          agent: config.agent || 'antigravity-cli',
          mode: config.mode || 'thinking',
          currentPhase: 'BOOTSTRAP',
        }
      )

      this.activeCycleSessions.set(cycleId.value, cycleSession)

      const result: ParallelCycleDispatchedResult = {
        cycleId: cycleId.value,
        sessionId: sessionId.value,
        category,
        status: CycleState.RUNNING,
        worktreePath,
      }

      results.push(result)

      this.emitEvent({
        type: 'cycle_dispatched',
        cycleId: cycleId.value,
        sessionId: sessionId.value,
        category,
        status: CycleState.RUNNING,
        worktreePath,
        scope: config.scope,
        timestamp: new Date().toISOString(),
      })
    }

    return results
  }

  getActiveCycles(): ParallelCycleActiveItem[] {
    const active: ParallelCycleActiveItem[] = []
    for (const cycleSession of this.activeCycleSessions.values()) {
      if (cycleSession.isActive()) {
        const snapshots = cycleSession.getSnapshots()
        const currentPhase =
          cycleSession.metadata?.currentPhase ||
          (snapshots.length > 0 ? snapshots[snapshots.length - 1].phase : 'BOOTSTRAP')

        const status =
          cycleSession.metadata?.approvalStatus === 'WAITING_SPEC_APPROVAL'
            ? 'WAITING_SPEC_APPROVAL'
            : cycleSession.state

        active.push({
          cycleId: cycleSession.cycleId.value,
          sessionId: cycleSession.sessionId.value,
          category: cycleSession.category,
          status,
          currentPhase,
          worktreePath: cycleSession.workspacePath,
          startedAt: cycleSession.startedAt.toISOString(),
          tokensUsed: cycleSession.metadata?.tokensUsed || 0,
          costEstimate: cycleSession.metadata?.costEstimate || 0,
          specSummary: cycleSession.metadata?.specSummary,
          scope: cycleSession.metadata?.scope,
        })
      }
    }
    return active
  }

  setSpecApprovalPending(cycleIdStr: string, options: { specSummary?: string } = {}): void {
    const cycleSession = this.activeCycleSessions.get(cycleIdStr)
    if (!cycleSession) throw new Error(`Cycle ${cycleIdStr} not found`)
    cycleSession.metadata.approvalStatus = 'WAITING_SPEC_APPROVAL'
    cycleSession.metadata.specSummary = options.specSummary || 'Especificação e decisões arquiteturais prontas para aprovação'
    this.emitEvent({
      type: 'spec_approval_pending',
      cycleId: cycleIdStr,
      sessionId: cycleSession.sessionId.value,
      status: 'WAITING_SPEC_APPROVAL',
      specSummary: cycleSession.metadata.specSummary,
      timestamp: new Date().toISOString(),
    })
  }

  async approveSpec(cycleIdStr: string): Promise<{ cycleId: string; status: CycleState; currentPhase: string }> {
    const cycleSession = this.activeCycleSessions.get(cycleIdStr)
    if (!cycleSession) throw new Error(`Cycle ${cycleIdStr} not found`)
    delete cycleSession.metadata.approvalStatus
    cycleSession.transitionTo(CycleState.RUNNING)
    cycleSession.metadata.currentPhase = 'DEVELOPMENT'

    this.emitEvent({
      type: 'spec_approved',
      cycleId: cycleIdStr,
      sessionId: cycleSession.sessionId.value,
      status: CycleState.RUNNING,
      phase: 'DEVELOPMENT',
      timestamp: new Date().toISOString(),
    })

    return { cycleId: cycleIdStr, status: CycleState.RUNNING, currentPhase: 'DEVELOPMENT' }
  }

  async rejectSpec(cycleIdStr: string, feedback: string = ''): Promise<{ cycleId: string; status: CycleState; currentPhase: string }> {
    const cycleSession = this.activeCycleSessions.get(cycleIdStr)
    if (!cycleSession) throw new Error(`Cycle ${cycleIdStr} not found`)
    delete cycleSession.metadata.approvalStatus
    cycleSession.metadata.revisionFeedback = feedback
    cycleSession.transitionTo(CycleState.RUNNING)
    cycleSession.metadata.currentPhase = 'REFINEMENT'

    this.emitEvent({
      type: 'spec_rejected',
      cycleId: cycleIdStr,
      sessionId: cycleSession.sessionId.value,
      status: CycleState.RUNNING,
      phase: 'REFINEMENT',
      feedback,
      timestamp: new Date().toISOString(),
    })

    return { cycleId: cycleIdStr, status: CycleState.RUNNING, currentPhase: 'REFINEMENT' }
  }

  async abortCycle(cycleIdStr: string, reason: string = 'User requested abort'): Promise<{ cycleId: string; status: CycleState }> {
    const cycleSession = this.activeCycleSessions.get(cycleIdStr)
    if (!cycleSession) {
      throw new Error(`Cycle ${cycleIdStr} not found`)
    }

    const cycleId = new CycleId(cycleIdStr)

    // Kill process tree
    await this.processTreeManager.killProcessTree(cycleId)

    // Transition state
    cycleSession.transitionTo(CycleState.ABORTED)
    cycleSession.metadata.abortReason = reason

    // Remove isolated worktree
    await this.worktreeProvider.removeWorktree(cycleId)

    this.activeCycleSessions.delete(cycleIdStr)

    this.emitEvent({
      type: 'cycle_aborted',
      cycleId: cycleIdStr,
      sessionId: cycleSession.sessionId.value,
      status: CycleState.ABORTED,
      reason,
      timestamp: new Date().toISOString(),
    })

    return { cycleId: cycleIdStr, status: CycleState.ABORTED }
  }

  subscribe(listener: (event: any) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  emitCycleEvent(cycleIdStr: string, type: string, payload: Record<string, any> = {}): void {
    const cycleSession = this.activeCycleSessions.get(cycleIdStr)
    this.emitEvent({
      cycleId: cycleIdStr,
      sessionId: cycleSession?.sessionId.value,
      type,
      ...payload,
      timestamp: new Date().toISOString(),
    })
  }

  private emitEvent(event: any): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {}
    }
  }

  async cleanup(): Promise<void> {
    for (const cycleIdStr of Array.from(this.activeCycleSessions.keys())) {
      try {
        await this.abortCycle(cycleIdStr, 'Teardown cleanup')
      } catch {}
    }
    this.activeCycleSessions.clear()
    this.listeners.clear()
    await this.worktreeProvider.cleanupAll()
  }
}

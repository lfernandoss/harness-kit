import { CycleId } from '../value-objects/CycleId'
import { SessionId } from '../value-objects/SessionId'
import { CycleState } from '../value-objects/CycleState'
import { PhaseSnapshot, PhaseSnapshotData } from '../entities/PhaseSnapshot'

export interface AutonomousCycleSessionManifest {
  cycleId: string
  sessionId: string
  category: string
  workspacePath: string
  state: CycleState | string
  startedAt: string
  completedAt?: string
  snapshots: PhaseSnapshotData[]
  metadata?: Record<string, any>
}

export class AutonomousCycleSession {
  private _state: CycleState
  private _snapshots: PhaseSnapshot[] = []
  private _startedAt: Date
  private _completedAt?: Date
  private _metadata: Record<string, any>

  constructor(
    readonly cycleId: CycleId,
    readonly sessionId: SessionId,
    readonly category: string = 'general',
    readonly workspacePath: string = process.cwd(),
    state: CycleState = CycleState.INITIALIZED,
    startedAt: Date = new Date(),
    metadata: Record<string, any> = {}
  ) {
    this._state = state
    this._startedAt = startedAt
    this._metadata = metadata
  }

  get state(): CycleState {
    return this._state
  }

  get startedAt(): Date {
    return this._startedAt
  }

  get completedAt(): Date | undefined {
    return this._completedAt
  }

  get metadata(): Record<string, any> {
    return this._metadata
  }

  transitionTo(newState: CycleState): void {
    this._state = newState
    if (newState === CycleState.COMPLETED || newState === CycleState.FAILED || newState === CycleState.ABORTED) {
      this._completedAt = new Date()
    }
  }

  recordPhase(snapshot: PhaseSnapshot): void {
    this._snapshots.push(snapshot)
  }

  getSnapshots(): readonly PhaseSnapshot[] {
    return [...this._snapshots]
  }

  isActive(): boolean {
    return this._state === CycleState.RUNNING || this._state === CycleState.INITIALIZED
  }

  toManifest(): AutonomousCycleSessionManifest {
    return {
      cycleId: this.cycleId.value,
      sessionId: this.sessionId.value,
      category: this.category,
      workspacePath: this.workspacePath,
      state: this._state,
      startedAt: this._startedAt.toISOString(),
      completedAt: this._completedAt?.toISOString(),
      snapshots: this._snapshots.map((s) => s.toJSON()),
      metadata: this._metadata,
    }
  }

  static fromManifest(manifest: AutonomousCycleSessionManifest): AutonomousCycleSession {
    const cycleSession = new AutonomousCycleSession(
      new CycleId(manifest.cycleId),
      new SessionId(manifest.sessionId),
      manifest.category || 'general',
      manifest.workspacePath || process.cwd(),
      (manifest.state as CycleState) || CycleState.INITIALIZED,
      new Date(manifest.startedAt),
      manifest.metadata || {}
    )

    if (manifest.completedAt) {
      cycleSession._completedAt = new Date(manifest.completedAt)
    }

    if (manifest.snapshots && Array.isArray(manifest.snapshots)) {
      manifest.snapshots.forEach((s) => {
        cycleSession.recordPhase(PhaseSnapshot.fromJSON(s))
      })
    }

    return cycleSession
  }
}

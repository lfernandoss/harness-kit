import { CycleId } from '../value-objects/CycleId'
import { SessionId } from '../value-objects/SessionId'
import { CycleState } from '../value-objects/CycleState'
import { PhaseSnapshot, PhaseSnapshotData } from '../entities/PhaseSnapshot'

export interface CycleManifestData {
  id: string
  sessionId: string
  state: CycleState
  snapshots: PhaseSnapshotData[]
  abortReason?: string
  createdAt: string
  updatedAt: string
}

export class AutonomousCycle {
  readonly id: CycleId
  readonly sessionId: SessionId
  private state: CycleState
  private snapshots: PhaseSnapshot[] = []
  private abortReason?: string
  readonly createdAt: Date
  private updatedAt: Date

  constructor(
    id: CycleId,
    sessionId: SessionId,
    initialState: CycleState = CycleState.INITIALIZED,
    snapshots: PhaseSnapshot[] = [],
    abortReason?: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id
    this.sessionId = sessionId
    this.state = initialState
    this.snapshots = [...snapshots]
    this.abortReason = abortReason
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  getState(): CycleState {
    return this.state
  }

  getSnapshots(): readonly PhaseSnapshot[] {
    return this.snapshots
  }

  getAbortReason(): string | undefined {
    return this.abortReason
  }

  start(): void {
    if (this.state === CycleState.COMPLETED || this.state === CycleState.ABORTED) {
      throw new Error(`Cannot start cycle: already in terminal state ${this.state}`)
    }
    this.state = CycleState.RUNNING
    this.updatedAt = new Date()
  }

  recordPhase(snapshot: PhaseSnapshot): void {
    if (this.state !== CycleState.RUNNING && this.state !== CycleState.INITIALIZED) {
      throw new Error(`Cannot record phase on cycle in state ${this.state}`)
    }
    this.snapshots.push(snapshot)
    this.updatedAt = new Date()
  }

  complete(): void {
    if (this.state !== CycleState.RUNNING) {
      throw new Error(`Cannot complete cycle in state ${this.state}`)
    }
    this.state = CycleState.COMPLETED
    this.updatedAt = new Date()
  }

  abort(reason?: string): void {
    this.state = CycleState.ABORTED
    this.abortReason = reason || 'Cycle aborted'
    this.updatedAt = new Date()
  }

  fail(reason?: string): void {
    this.state = CycleState.FAILED
    this.abortReason = reason
    this.updatedAt = new Date()
  }

  toManifest(): CycleManifestData {
    return {
      id: this.id.value,
      sessionId: this.sessionId.value,
      state: this.state,
      snapshots: this.snapshots.map((s) => s.toJSON()),
      abortReason: this.abortReason,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  static fromManifest(data: CycleManifestData): AutonomousCycle {
    return new AutonomousCycle(
      new CycleId(data.id),
      new SessionId(data.sessionId),
      data.state,
      (data.snapshots || []).map((s) => PhaseSnapshot.fromJSON(s)),
      data.abortReason,
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date()
    )
  }
}

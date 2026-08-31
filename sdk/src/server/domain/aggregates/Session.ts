import { SessionId } from '../value-objects/SessionId'
import { CycleId } from '../value-objects/CycleId'
import { AutonomousCycle, CycleManifestData } from './AutonomousCycle'

export interface SessionManifestData {
  id: string
  workspacePath: string
  cycles: CycleManifestData[]
  createdAt: string
  updatedAt: string
}

export class Session {
  readonly id: SessionId
  readonly workspacePath: string
  private cycles: Map<string, AutonomousCycle> = new Map()
  readonly createdAt: Date
  private updatedAt: Date

  constructor(
    id: SessionId,
    workspacePath: string,
    cycles: AutonomousCycle[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (!workspacePath || typeof workspacePath !== 'string') {
      throw new Error('Session requires valid non-empty workspacePath')
    }
    this.id = id
    this.workspacePath = workspacePath
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    for (const cycle of cycles) {
      this.attachCycle(cycle)
    }
  }

  attachCycle(cycle: AutonomousCycle): void {
    if (!cycle.sessionId.equals(this.id)) {
      throw new Error(`Cycle session ID mismatch: expected ${this.id.value}, got ${cycle.sessionId.value}`)
    }
    this.cycles.set(cycle.id.value, cycle)
    this.updatedAt = new Date()
  }

  findCycle(cycleId: CycleId): AutonomousCycle | undefined {
    return this.cycles.get(cycleId.value)
  }

  getCycles(): readonly AutonomousCycle[] {
    return Array.from(this.cycles.values())
  }

  toManifest(): SessionManifestData {
    return {
      id: this.id.value,
      workspacePath: this.workspacePath,
      cycles: Array.from(this.cycles.values()).map((c) => c.toManifest()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  static fromManifest(data: SessionManifestData): Session {
    const cycles = (data.cycles || []).map((c) => AutonomousCycle.fromManifest(c))
    return new Session(
      new SessionId(data.id),
      data.workspacePath,
      cycles,
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date()
    )
  }
}

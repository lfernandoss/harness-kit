export interface PhaseSnapshotData {
  phase: string
  verdict: string
  metadata?: Record<string, unknown>
  recordedAt?: string
}

export class PhaseSnapshot {
  readonly phase: string
  readonly verdict: string
  readonly metadata: Record<string, unknown>
  readonly recordedAt: Date

  constructor(
    phase: string,
    verdict: string,
    metadata: Record<string, unknown> = {},
    recordedAt: Date = new Date()
  ) {
    if (!phase || typeof phase !== 'string') {
      throw new Error('PhaseSnapshot requires non-empty phase')
    }
    if (!verdict || typeof verdict !== 'string') {
      throw new Error('PhaseSnapshot requires non-empty verdict')
    }
    this.phase = phase
    this.verdict = verdict
    this.metadata = metadata
    this.recordedAt = recordedAt
  }

  toJSON(): PhaseSnapshotData {
    return {
      phase: this.phase,
      verdict: this.verdict,
      metadata: this.metadata,
      recordedAt: this.recordedAt.toISOString(),
    }
  }

  static fromJSON(data: PhaseSnapshotData): PhaseSnapshot {
    return new PhaseSnapshot(
      data.phase,
      data.verdict,
      data.metadata || {},
      data.recordedAt ? new Date(data.recordedAt) : new Date()
    )
  }
}

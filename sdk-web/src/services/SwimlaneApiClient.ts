export interface PhaseSnapshotDto {
  phase: string
  verdict: string
  metadata?: Record<string, unknown>
  recordedAt?: string
}

export interface CycleManifestDto {
  id: string
  sessionId: string
  state: 'INITIALIZED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED'
  snapshots: PhaseSnapshotDto[]
  abortReason?: string
  createdAt: string
  updatedAt: string
}

export interface SessionManifestDto {
  id: string
  workspacePath: string
  cycles: CycleManifestDto[]
  createdAt: string
  updatedAt: string
}

export class SwimlaneApiClient {
  constructor(readonly baseUrl: string = 'http://127.0.0.1:4000') {}

  async fetchSession(sessionId: string): Promise<SessionManifestDto> {
    const res = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`)
    if (!res.ok) {
      throw new Error(`Failed to fetch session: ${res.statusText}`)
    }
    return res.json()
  }

  async resumeCycle(sessionId: string, cycleId: string, fromPhase?: string): Promise<{ resumed: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/sessions/cycles/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, cycleId, fromPhase }),
    })
    if (!res.ok) {
      throw new Error(`Failed to resume cycle: ${res.statusText}`)
    }
    return res.json()
  }

  async abortCycle(cycleId: string, reason?: string): Promise<{ aborted: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/sessions/cycles/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleId, reason }),
    })
    if (!res.ok) {
      throw new Error(`Failed to abort cycle: ${res.statusText}`)
    }
    return res.json()
  }
}

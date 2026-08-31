export interface CreateCycleSessionRequestDto {
  workspacePath: string
  sessionId?: string
  runner?: string
  mode?: string
}

export interface ResumeCycleRequestDto {
  sessionId: string
  cycleId: string
  fromPhase?: string
}

export interface AbortCycleRequestDto {
  cycleId: string
  sessionId?: string
  reason?: string
}

export interface SessionCycleResponseDto {
  sessionId: string
  cycleId?: string
  workspacePath: string
  state: string
  createdAt: string
}

import { ISessionRepository } from '../../domain/repositories/ISessionRepository'
import { Session } from '../../domain/aggregates/Session'
import { AutonomousCycle } from '../../domain/aggregates/AutonomousCycle'
import { SessionId } from '../../domain/value-objects/SessionId'
import { CycleId } from '../../domain/value-objects/CycleId'
import { CycleState } from '../../domain/value-objects/CycleState'

export interface CreateCycleSessionInput {
  workspacePath: string
  sessionId?: string
  runner?: string
  mode?: string
}

export interface CreateCycleSessionOutput {
  sessionId: string
  cycleId: string
  workspacePath: string
  state: CycleState
  createdAt: string
}

export class CreateCycleSessionUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(input: CreateCycleSessionInput): Promise<CreateCycleSessionOutput> {
    const sessionId = input.sessionId ? new SessionId(input.sessionId) : SessionId.generate()
    
    let session = await this.sessionRepository.findSessionById(sessionId)
    if (!session) {
      session = new Session(sessionId, input.workspacePath)
    }

    const cycleId = CycleId.generate()
    const cycle = new AutonomousCycle(cycleId, sessionId)
    session.attachCycle(cycle)

    await this.sessionRepository.saveSession(session)

    return {
      sessionId: session.id.value,
      cycleId: cycle.id.value,
      workspacePath: session.workspacePath,
      state: cycle.getState(),
      createdAt: cycle.createdAt.toISOString(),
    }
  }
}

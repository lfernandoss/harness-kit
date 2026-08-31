import { Session } from '../aggregates/Session'
import { AutonomousCycle } from '../aggregates/AutonomousCycle'
import { SessionId } from '../value-objects/SessionId'
import { CycleId } from '../value-objects/CycleId'

export interface ISessionRepository {
  saveSession(session: Session): Promise<void>
  findSessionById(id: SessionId): Promise<Session | null>
  listSessions(): Promise<Session[]>
  saveCycle(cycle: AutonomousCycle): Promise<void>
  findCycleById(cycleId: CycleId, sessionId?: SessionId): Promise<AutonomousCycle | null>
}

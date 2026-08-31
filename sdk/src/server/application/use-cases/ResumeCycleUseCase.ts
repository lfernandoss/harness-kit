import { ISessionRepository } from '../../domain/repositories/ISessionRepository'
import { SessionId } from '../../domain/value-objects/SessionId'
import { CycleId } from '../../domain/value-objects/CycleId'

export interface ResumeCycleInput {
  sessionId: string
  cycleId: string
  fromPhase?: string
}

export interface ResumeCycleOutput {
  resumed: boolean
  cycleId: string
  lastPhase?: string
  nextPhase: string
}

const PHASE_ORDER = ['PHASE_A', 'PHASE_B', 'PHASE_C', 'PHASE_D', 'PHASE_E']

export class ResumeCycleUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(input: ResumeCycleInput): Promise<ResumeCycleOutput> {
    const sessionId = new SessionId(input.sessionId)
    const cycleId = new CycleId(input.cycleId)

    const cycle = await this.sessionRepository.findCycleById(cycleId, sessionId)
    if (!cycle) {
      throw new Error(`Cycle not found: ${input.cycleId}`)
    }

    const snapshots = cycle.getSnapshots()
    const lastSnapshot = snapshots[snapshots.length - 1]
    const lastPhase = input.fromPhase || lastSnapshot?.phase

    let nextPhase = 'PHASE_A'
    if (lastPhase) {
      const idx = PHASE_ORDER.indexOf(lastPhase)
      if (idx >= 0 && idx < PHASE_ORDER.length - 1) {
        nextPhase = PHASE_ORDER[idx + 1]
      } else {
        nextPhase = lastPhase
      }
    }

    cycle.start()
    await this.sessionRepository.saveCycle(cycle)

    return {
      resumed: true,
      cycleId: cycle.id.value,
      lastPhase,
      nextPhase,
    }
  }
}

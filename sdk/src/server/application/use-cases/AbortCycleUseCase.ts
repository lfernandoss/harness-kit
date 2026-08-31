import { ISessionRepository } from '../../domain/repositories/ISessionRepository'
import { ProcessTreeManager } from '../../adapters/outbound/services/ProcessTreeManager'
import { SessionId } from '../../domain/value-objects/SessionId'
import { CycleId } from '../../domain/value-objects/CycleId'

export interface AbortCycleInput {
  sessionId?: string
  cycleId: string
  reason?: string
}

export interface AbortCycleOutput {
  aborted: boolean
  cycleId: string
  reason: string
}

export class AbortCycleUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly processTreeManager: ProcessTreeManager
  ) {}

  async execute(input: AbortCycleInput): Promise<AbortCycleOutput> {
    const cycleId = new CycleId(input.cycleId)
    const sessionId = input.sessionId ? new SessionId(input.sessionId) : undefined

    await this.processTreeManager.killProcessTree(cycleId)

    const cycle = await this.sessionRepository.findCycleById(cycleId, sessionId)
    const reason = input.reason || 'Cycle aborted by user'

    if (cycle) {
      cycle.abort(reason)
      await this.sessionRepository.saveCycle(cycle)
    }

    return {
      aborted: true,
      cycleId: cycleId.value,
      reason,
    }
  }
}

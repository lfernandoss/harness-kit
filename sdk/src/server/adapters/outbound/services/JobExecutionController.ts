import { ProcessTreeManager, ProcessHandle } from './ProcessTreeManager'
import { AutonomousCycle } from '../../../domain/aggregates/AutonomousCycle'
import { CycleId } from '../../../domain/value-objects/CycleId'
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository'
import { PhaseSnapshot } from '../../../domain/entities/PhaseSnapshot'

export class JobExecutionController {
  constructor(
    private readonly processTreeManager: ProcessTreeManager,
    private readonly sessionRepository: ISessionRepository
  ) {}

  async startCycleExecution(
    cycle: AutonomousCycle,
    command: string,
    args: string[],
    env?: Record<string, string | undefined>,
    cwd?: string
  ): Promise<ProcessHandle> {
    cycle.start()
    await this.sessionRepository.saveCycle(cycle)

    const handle = await this.processTreeManager.spawnSupervisedProcess(
      cycle.id,
      command,
      args,
      env,
      cwd
    )

    handle.process.on('exit', async (code) => {
      if (code === 0) {
        cycle.complete()
      } else {
        cycle.fail(`Process exited with code ${code}`)
      }
      await this.sessionRepository.saveCycle(cycle)
    })

    return handle
  }

  async recordPhase(cycle: AutonomousCycle, phase: string, verdict: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const snapshot = new PhaseSnapshot(phase, verdict, metadata)
    cycle.recordPhase(snapshot)
    await this.sessionRepository.saveCycle(cycle)
  }

  async abortCycle(cycleId: CycleId, reason?: string): Promise<void> {
    await this.processTreeManager.killProcessTree(cycleId)
    const cycle = await this.sessionRepository.findCycleById(cycleId)
    if (cycle) {
      cycle.abort(reason)
      await this.sessionRepository.saveCycle(cycle)
    }
  }
}

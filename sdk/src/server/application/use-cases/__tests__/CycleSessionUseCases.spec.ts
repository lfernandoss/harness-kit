import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { FileSessionRepository } from '../../../adapters/outbound/persistence/FileSessionRepository'
import { ProcessTreeManager } from '../../../adapters/outbound/services/ProcessTreeManager'
import { CreateCycleSessionUseCase } from '../CreateCycleSessionUseCase'
import { ResumeCycleUseCase } from '../ResumeCycleUseCase'
import { AbortCycleUseCase } from '../AbortCycleUseCase'
import { CycleState } from '../../../domain/value-objects/CycleState'
import { SessionId } from '../../../domain/value-objects/SessionId'
import { CycleId } from '../../../domain/value-objects/CycleId'
import { AutonomousCycle } from '../../../domain/aggregates/AutonomousCycle'
import { PhaseSnapshot } from '../../../domain/entities/PhaseSnapshot'
import { Session } from '../../../domain/aggregates/Session'

describe('Cycle Session Use Cases', () => {
  let tempDir: string
  let repo: FileSessionRepository
  let processTreeManager: ProcessTreeManager

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-usecase-test-'))
    repo = new FileSessionRepository(tempDir)
    processTreeManager = new ProcessTreeManager()
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('CreateCycleSessionUseCase should create session and cycle with unique session ID', async () => {
    const useCase = new CreateCycleSessionUseCase(repo)
    const result = await useCase.execute({
      workspacePath: tempDir,
    })

    expect(result.sessionId.startsWith('sess-')).toBe(true)
    expect(result.cycleId.startsWith('cycle-')).toBe(true)
    expect(result.state).toBe(CycleState.INITIALIZED)

    const savedSession = await repo.findSessionById(new SessionId(result.sessionId))
    expect(savedSession).not.toBeNull()
    expect(savedSession!.getCycles().length).toBe(1)
  })

  it('ResumeCycleUseCase should resume cycle from last phase snapshot', async () => {
    const sessionId = new SessionId('sess-resume-test')
    const cycleId = new CycleId('cycle-resume-test')
    const session = new Session(sessionId, tempDir)
    const cycle = new AutonomousCycle(cycleId, sessionId)
    cycle.start()
    cycle.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED'))
    cycle.recordPhase(new PhaseSnapshot('PHASE_B', 'PASSED'))
    session.attachCycle(cycle)
    await repo.saveSession(session)

    const useCase = new ResumeCycleUseCase(repo)
    const result = await useCase.execute({
      sessionId: sessionId.value,
      cycleId: cycleId.value,
    })

    expect(result.resumed).toBe(true)
    expect(result.lastPhase).toBe('PHASE_B')
    expect(result.nextPhase).toBe('PHASE_C')
  })

  it('AbortCycleUseCase should kill process tree and update cycle state to ABORTED', async () => {
    const sessionId = new SessionId('sess-abort-test')
    const cycleId = new CycleId('cycle-abort-test')
    const session = new Session(sessionId, tempDir)
    const cycle = new AutonomousCycle(cycleId, sessionId)
    cycle.start()
    session.attachCycle(cycle)
    await repo.saveSession(session)

    const useCase = new AbortCycleUseCase(repo, processTreeManager)
    const result = await useCase.execute({
      cycleId: cycleId.value,
      sessionId: sessionId.value,
      reason: 'User manual abort',
    })

    expect(result.aborted).toBe(true)

    const updatedCycle = await repo.findCycleById(cycleId, sessionId)
    expect(updatedCycle!.getState()).toBe(CycleState.ABORTED)
    expect(updatedCycle!.getAbortReason()).toBe('User manual abort')
  })
})

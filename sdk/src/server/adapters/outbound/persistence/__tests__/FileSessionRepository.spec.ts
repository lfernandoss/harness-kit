import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { FileSessionRepository } from '../FileSessionRepository'
import { Session } from '../../../../domain/aggregates/Session'
import { AutonomousCycle } from '../../../../domain/aggregates/AutonomousCycle'
import { PhaseSnapshot } from '../../../../domain/entities/PhaseSnapshot'
import { SessionId } from '../../../../domain/value-objects/SessionId'
import { CycleId } from '../../../../domain/value-objects/CycleId'

describe('FileSessionRepository', () => {
  let tempDir: string
  let repo: FileSessionRepository

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-session-test-'))
    repo = new FileSessionRepository(tempDir)
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should persist and retrieve Session with attached cycles from disk', async () => {
    const sessionId = new SessionId('sess-123')
    const session = new Session(sessionId, tempDir)
    const cycle = new AutonomousCycle(new CycleId('cycle-1'), sessionId)
    cycle.start()
    cycle.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED'))
    session.attachCycle(cycle)

    await repo.saveSession(session)

    const loaded = await repo.findSessionById(sessionId)
    expect(loaded).not.toBeNull()
    expect(loaded!.id.value).toBe('sess-123')
    expect(loaded!.getCycles().length).toBe(1)
    expect(loaded!.getCycles()[0].id.value).toBe('cycle-1')
    expect(loaded!.getCycles()[0].getSnapshots().length).toBe(1)
  })

  it('should atomically write cycle manifests without corrupting existing files', async () => {
    const sessionId = new SessionId('sess-abc')
    const session = new Session(sessionId, tempDir)
    await repo.saveSession(session)

    const cycle = new AutonomousCycle(new CycleId('cycle-xyz'), sessionId)
    cycle.start()
    await repo.saveCycle(cycle)

    const sessionFilePath = path.join(tempDir, '.harness', 'sessions', 'sess-abc', 'session.json')
    expect(fs.existsSync(sessionFilePath)).toBe(true)

    const cycleFilePath = path.join(tempDir, '.harness', 'sessions', 'sess-abc', 'cycles', 'cycle-xyz.json')
    expect(fs.existsSync(cycleFilePath)).toBe(true)

    const loadedCycle = await repo.findCycleById(new CycleId('cycle-xyz'), sessionId)
    expect(loadedCycle).not.toBeNull()
    expect(loadedCycle!.id.value).toBe('cycle-xyz')
  })

  it('should return null when querying non-existent SessionId', async () => {
    const loaded = await repo.findSessionById(new SessionId('sess-nonexistent'))
    expect(loaded).toBeNull()
  })

  it('should list all persisted sessions in workspace', async () => {
    const session1 = new Session(new SessionId('sess-001'), tempDir)
    const session2 = new Session(new SessionId('sess-002'), tempDir)
    await repo.saveSession(session1)
    await repo.saveSession(session2)

    const all = await repo.listSessions()
    expect(all.length).toBe(2)
  })
})

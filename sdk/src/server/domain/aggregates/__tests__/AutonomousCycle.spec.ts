import { describe, it, expect } from 'vitest'
import { AutonomousCycle } from '../AutonomousCycle'
import { Session } from '../Session'
import { PhaseSnapshot } from '../../entities/PhaseSnapshot'
import { SessionId } from '../../value-objects/SessionId'
import { CycleId } from '../../value-objects/CycleId'
import { CycleState } from '../../value-objects/CycleState'

describe('AutonomousCycle Aggregate Root', () => {
  it('should initialize AutonomousCycle with INITIALIZED state when created with valid IDs', () => {
    const cycleId = new CycleId('cycle-101')
    const sessionId = new SessionId('sess-abc')
    const cycle = new AutonomousCycle(cycleId, sessionId)

    expect(cycle.id.equals(cycleId)).toBe(true)
    expect(cycle.sessionId.equals(sessionId)).toBe(true)
    expect(cycle.getState()).toBe(CycleState.INITIALIZED)
    expect(cycle.getSnapshots()).toEqual([])
  })

  it('should transition to RUNNING state when cycle execution is started', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    expect(cycle.getState()).toBe(CycleState.RUNNING)
  })

  it('should record PhaseSnapshot when phase execution finishes', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    const snapshot = new PhaseSnapshot('PHASE_A', 'PASSED', { score: 1.0 })
    cycle.recordPhase(snapshot)

    expect(cycle.getSnapshots().length).toBe(1)
    expect(cycle.getSnapshots()[0].phase).toBe('PHASE_A')
    expect(cycle.getSnapshots()[0].verdict).toBe('PASSED')
  })

  it('should transition to COMPLETED state when complete() is called from RUNNING', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    cycle.complete()
    expect(cycle.getState()).toBe(CycleState.COMPLETED)
  })

  it('should transition to ABORTED state when abort is requested', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    cycle.abort('User cancelled')
    expect(cycle.getState()).toBe(CycleState.ABORTED)
    expect(cycle.getAbortReason()).toBe('User cancelled')
  })

  it('should transition to FAILED state when fail() is invoked', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    cycle.fail('Process crashed')
    expect(cycle.getState()).toBe(CycleState.FAILED)
  })

  it('should reject state transition when attempting to start a COMPLETED or ABORTED cycle', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    cycle.complete()
    expect(() => cycle.start()).toThrow('Cannot start cycle: already in terminal state COMPLETED')
  })

  it('should serialize to and deserialize from JSON manifest', () => {
    const cycle = new AutonomousCycle(new CycleId('cycle-101'), new SessionId('sess-abc'))
    cycle.start()
    cycle.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED', { score: 0.9 }))
    
    const manifest = cycle.toManifest()
    expect(manifest.id).toBe('cycle-101')
    expect(manifest.sessionId).toBe('sess-abc')
    expect(manifest.state).toBe(CycleState.RUNNING)
    expect(manifest.snapshots.length).toBe(1)

    const rehydrated = AutonomousCycle.fromManifest(manifest)
    expect(rehydrated.id.value).toBe('cycle-101')
    expect(rehydrated.getState()).toBe(CycleState.RUNNING)
    expect(rehydrated.getSnapshots().length).toBe(1)
  })
})

describe('Session Aggregate Root', () => {
  it('should create Session and attach AutonomousCycles successfully', () => {
    const sessionId = new SessionId('sess-100')
    const session = new Session(sessionId, 'C:\\workspace\\project')

    expect(session.id.equals(sessionId)).toBe(true)
    expect(session.workspacePath).toBe('C:\\workspace\\project')
    expect(session.getCycles().length).toBe(0)

    const cycle = new AutonomousCycle(new CycleId('cycle-1'), sessionId)
    session.attachCycle(cycle)
    expect(session.getCycles().length).toBe(1)
    expect(session.findCycle(new CycleId('cycle-1'))).toBeDefined()
  })

  it('should reject attaching cycle belonging to a different session ID', () => {
    const session = new Session(new SessionId('sess-100'), 'C:\\workspace\\project')
    const otherCycle = new AutonomousCycle(new CycleId('cycle-2'), new SessionId('sess-other'))
    expect(() => session.attachCycle(otherCycle)).toThrow('Cycle session ID mismatch')
  })
})

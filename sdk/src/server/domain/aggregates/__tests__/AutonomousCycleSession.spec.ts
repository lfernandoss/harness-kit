import { describe, it, expect } from 'vitest'
import { AutonomousCycleSession } from '../AutonomousCycleSession'
import { SessionId } from '../../value-objects/SessionId'
import { CycleId } from '../../value-objects/CycleId'
import { CycleState } from '../../value-objects/CycleState'
import { PhaseSnapshot } from '../../entities/PhaseSnapshot'

describe('AutonomousCycleSession', () => {
  it('enforces 1:1 binding between CycleId and SessionId with INITIALIZED state', () => {
    const cycleId = CycleId.generate()
    const sessionId = SessionId.generate()
    const cycleSession = new AutonomousCycleSession(cycleId, sessionId, 'backend', 'C:/repo')

    expect(cycleSession.cycleId.equals(cycleId)).toBe(true)
    expect(cycleSession.sessionId.equals(sessionId)).toBe(true)
    expect(cycleSession.state).toBe(CycleState.INITIALIZED)
    expect(cycleSession.category).toBe('backend')
    expect(cycleSession.workspacePath).toBe('C:/repo')
  })

  it('manages independent state transitions', () => {
    const cycleSession = new AutonomousCycleSession(CycleId.generate(), SessionId.generate(), 'frontend', 'C:/repo')

    cycleSession.transitionTo(CycleState.RUNNING)
    expect(cycleSession.state).toBe(CycleState.RUNNING)
    expect(cycleSession.isActive()).toBe(true)

    cycleSession.transitionTo(CycleState.COMPLETED)
    expect(cycleSession.state).toBe(CycleState.COMPLETED)
    expect(cycleSession.isActive()).toBe(false)
    expect(cycleSession.completedAt).toBeDefined()
  })

  it('records immutable phase snapshots and generates complete manifest', () => {
    const cycleId = CycleId.generate()
    const sessionId = SessionId.generate()
    const cycleSession = new AutonomousCycleSession(cycleId, sessionId, 'qa', 'C:/repo')

    const snapshot = new PhaseSnapshot('BOOTSTRAP', 'PASSED', { score: 1.0 }, new Date('2026-09-01T12:00:00.000Z'))
    cycleSession.recordPhase(snapshot)

    expect(cycleSession.getSnapshots()).toHaveLength(1)
    expect(cycleSession.getSnapshots()[0].phase).toBe('BOOTSTRAP')

    const manifest = cycleSession.toManifest()
    expect(manifest.cycleId).toBe(cycleId.value)
    expect(manifest.sessionId).toBe(sessionId.value)
    expect(manifest.category).toBe('qa')
    expect(manifest.snapshots).toHaveLength(1)
    expect(manifest.snapshots[0].phase).toBe('BOOTSTRAP')
    expect(manifest.snapshots[0].verdict).toBe('PASSED')
  })

  it('reconstitutes from existing manifest dictionary', () => {
    const cycleIdStr = 'cycle-custom-123'
    const sessionIdStr = 'sess-custom-456'
    const cycleSession = AutonomousCycleSession.fromManifest({
      cycleId: cycleIdStr,
      sessionId: sessionIdStr,
      state: CycleState.RUNNING,
      category: 'devops',
      workspacePath: 'C:/repo',
      startedAt: '2026-09-01T12:00:00.000Z',
      snapshots: [
        {
          phase: 'PLANNING',
          verdict: 'PASSED',
          recordedAt: '2026-09-01T12:05:00.000Z',
          metadata: {}
        }
      ]
    })

    expect(cycleSession.cycleId.value).toBe(cycleIdStr)
    expect(cycleSession.sessionId.value).toBe(sessionIdStr)
    expect(cycleSession.state).toBe(CycleState.RUNNING)
    expect(cycleSession.category).toBe('devops')
    expect(cycleSession.getSnapshots()).toHaveLength(1)
  })
})

import { describe, it, expect } from 'vitest'
import { SessionId } from '../SessionId'
import { CycleId } from '../CycleId'
import { CycleState } from '../CycleState'

describe('SessionId Value Object', () => {
  it('should create SessionId when prefix is valid and value non-empty', () => {
    const id = new SessionId('sess-123e4567-e89b-12d3-a456-426614174000')
    expect(id.value).toBe('sess-123e4567-e89b-12d3-a456-426614174000')
  })

  it('should generate a random valid SessionId via static generate()', () => {
    const id = SessionId.generate()
    expect(id.value.startsWith('sess-')).toBe(true)
    expect(id.value.length).toBeGreaterThan(10)
  })

  it('should reject SessionId when format is empty or missing prefix', () => {
    expect(() => new SessionId('')).toThrow('Invalid SessionId')
    expect(() => new SessionId('invalid-prefix')).toThrow('Invalid SessionId')
  })

  it('should evaluate two SessionId instances as equal when values match', () => {
    const id1 = new SessionId('sess-abc-123')
    const id2 = new SessionId('sess-abc-123')
    const id3 = new SessionId('sess-xyz-999')
    expect(id1.equals(id2)).toBe(true)
    expect(id1.equals(id3)).toBe(false)
  })
})

describe('CycleId Value Object', () => {
  it('should create CycleId when value has valid cycle prefix', () => {
    const id = new CycleId('cycle-2026-001')
    expect(id.value).toBe('cycle-2026-001')
  })

  it('should generate a valid CycleId via static generate()', () => {
    const id = CycleId.generate()
    expect(id.value.startsWith('cycle-')).toBe(true)
  })

  it('should reject CycleId when format is invalid or empty', () => {
    expect(() => new CycleId('')).toThrow('Invalid CycleId')
    expect(() => new CycleId('wrong-prefix')).toThrow('Invalid CycleId')
  })

  it('should evaluate two CycleId instances as equal when values match', () => {
    const id1 = new CycleId('cycle-1')
    const id2 = new CycleId('cycle-1')
    expect(id1.equals(id2)).toBe(true)
  })
})

describe('CycleState Enum', () => {
  it('should contain all valid state transitions', () => {
    expect(CycleState.INITIALIZED).toBe('INITIALIZED')
    expect(CycleState.RUNNING).toBe('RUNNING')
    expect(CycleState.COMPLETED).toBe('COMPLETED')
    expect(CycleState.FAILED).toBe('FAILED')
    expect(CycleState.ABORTED).toBe('ABORTED')
  })
})

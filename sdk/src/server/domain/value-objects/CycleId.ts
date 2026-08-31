import { randomUUID } from 'crypto'

export class CycleId {
  readonly value: string

  constructor(value: string) {
    if (!value || typeof value !== 'string' || !value.startsWith('cycle-')) {
      throw new Error('Invalid CycleId: must start with "cycle-" prefix')
    }
    this.value = value
  }

  static generate(): CycleId {
    const timestamp = Date.now()
    return new CycleId(`cycle-${timestamp}-${randomUUID().substring(0, 8)}`)
  }

  equals(other: CycleId): boolean {
    if (!other || !(other instanceof CycleId)) {
      return false
    }
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

import { randomUUID } from 'crypto'

export class SessionId {
  readonly value: string

  constructor(value: string) {
    if (!value || typeof value !== 'string' || !value.startsWith('sess-')) {
      throw new Error('Invalid SessionId: must start with "sess-" prefix')
    }
    this.value = value
  }

  static generate(): SessionId {
    return new SessionId(`sess-${randomUUID()}`)
  }

  equals(other: SessionId): boolean {
    if (!other || !(other instanceof SessionId)) {
      return false
    }
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

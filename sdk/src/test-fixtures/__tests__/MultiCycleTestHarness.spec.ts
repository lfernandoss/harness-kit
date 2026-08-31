import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import { MultiCycleTestHarness } from '../MultiCycleTestHarness'

describe('MultiCycleTestHarness Fixture', () => {
  it('should initialize sandboxed workspace and clean up completely', async () => {
    const harness = new MultiCycleTestHarness()
    await harness.init()

    expect(fs.existsSync(harness.tempDir)).toBe(true)
    expect(harness.sessionRepo).toBeDefined()
    expect(harness.routes).toBeDefined()

    const session = await harness.createSession()
    expect(session.id.value).toMatch(/^sess-/)

    await harness.cleanup()
    expect(fs.existsSync(harness.tempDir)).toBe(false)
  })
})

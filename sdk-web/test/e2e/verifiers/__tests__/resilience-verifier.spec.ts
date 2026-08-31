import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ResilienceVerifier } from '../resilience-verifier.js'
import { BrowserAutomationDriver } from '../../fixtures/browser-driver.js'
import { TestServerController } from '../../fixtures/server-controller.js'
import { createEphemeralSandbox } from '../../fixtures/sandbox.js'

describe('ResilienceVerifier Unit & Resilience Tests', () => {
  let sandboxPath: string
  let controller: TestServerController
  let driver: BrowserAutomationDriver
  let verifier: ResilienceVerifier

  beforeEach(async () => {
    sandboxPath = await createEphemeralSandbox('resilience-verifier-test')
    controller = new TestServerController()
    driver = new BrowserAutomationDriver()
    verifier = new ResilienceVerifier(driver)
    await driver.launch({ headless: true })
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
    await controller.stop().catch(() => {})
  })

  it('should instantiate ResilienceVerifier with driver', () => {
    expect(verifier).toBeDefined()
  })

  it('should detect and assert 409 concurrency conflict between two tabs', async () => {
    const instance = await controller.start(sandboxPath)
    const tab1 = await driver.newPage(`${instance.baseUrl}/run`)
    const tab2 = await driver.newPage(`${instance.baseUrl}/run`)

    const conflictResult = await verifier.verifyConcurrencyRejection(
      tab1,
      tab2,
      instance.baseUrl,
      sandboxPath
    )

    expect(conflictResult.rejectedStatusCode).toBe(409)
    expect(conflictResult.isLocked).toBe(true)
    expect(conflictResult.activeJobId).toBeDefined()
    expect(conflictResult.conflictMessage).toContain('locked')

    const tab2Content = await tab2.content()
    expect(tab2Content).toContain('Workspace Concurrency Conflict')
    expect(tab2Content).toContain('409')
  })

  it('should handle reconnection when tab is closed and reopened during active run', async () => {
    const instance = await controller.start(sandboxPath)
    const tab1 = await driver.newPage(`${instance.baseUrl}/run`)

    const reconResult = await verifier.verifyReconnectionResilience(
      tab1,
      instance.baseUrl,
      sandboxPath
    )

    expect(reconResult.reconnected).toBe(true)
    expect(reconResult.activeJobId).toBeDefined()
    expect(reconResult.logsReplayed).toBeGreaterThan(0)
  })
})

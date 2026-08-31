import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestServerController } from './fixtures/server-controller.js'
import { BrowserAutomationDriver } from './fixtures/browser-driver.js'
import { ResilienceVerifier, verifyMultiTabResilience } from './verifiers/resilience-verifier.js'
import { createEphemeralSandbox } from './fixtures/sandbox.js'

describe('E2E Multi-Tab Concurrency Rejection & Reconnection Resilience Suite', () => {
  let sandboxPath: string
  let controller: TestServerController
  let driver: BrowserAutomationDriver
  let verifier: ResilienceVerifier

  beforeEach(async () => {
    sandboxPath = await createEphemeralSandbox('multi-tab-e2e')
    controller = new TestServerController()
    driver = new BrowserAutomationDriver()
    verifier = new ResilienceVerifier(driver)
    await driver.launch({ headless: true })
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
    await controller.stop().catch(() => {})
  })

  it('Should display 409 Conflict notification and preserve active job when second browser tab attempts concurrent execution', async () => {
    const instance = await controller.start(sandboxPath)
    const tab1 = await driver.newPage(`${instance.baseUrl}/run`)
    const tab2 = await driver.newPage(`${instance.baseUrl}/run`)

    const conflict = await verifyMultiTabResilience(tab1, tab2, instance.baseUrl, sandboxPath)

    expect(conflict.rejectedStatusCode).toBe(409)
    expect(conflict.isLocked).toBe(true)
    expect(conflict.activeJobId).toBeDefined()

    // Tab 1 state check: remains running and healthy
    const tab1Content = await tab1.content()
    expect(tab1Content).toContain('Active Orchestration Run')

    // Tab 2 state check: displays conflict banner
    const tab2Content = await tab2.content()
    expect(tab2Content).toContain('Workspace Concurrency Conflict (HTTP 409)')
    expect(tab2Content).toContain(conflict.activeJobId)
  })

  it('Should maintain active background execution and replay logs when browser tab is closed and reopened', async () => {
    const instance = await controller.start(sandboxPath)
    const initialTab = await driver.newPage(`${instance.baseUrl}/run`)

    const result = await verifier.verifyReconnectionResilience(initialTab, instance.baseUrl, sandboxPath)

    expect(result.reconnected).toBe(true)
    expect(result.logsReplayed).toBeGreaterThanOrEqual(2)
  })
})

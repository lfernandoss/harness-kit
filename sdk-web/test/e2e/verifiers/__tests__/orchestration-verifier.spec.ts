import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { OrchestrationVerifier } from '../orchestration-verifier.js'
import { BrowserAutomationDriver } from '../../fixtures/browser-driver.js'
import { TestServerController } from '../../fixtures/server-controller.js'
import { createEphemeralSandbox } from '../../fixtures/sandbox.js'

describe('OrchestrationVerifier Unit & Verification Tests', () => {
  let sandboxPath: string
  let controller: TestServerController
  let driver: BrowserAutomationDriver
  let verifier: OrchestrationVerifier

  beforeEach(async () => {
    sandboxPath = await createEphemeralSandbox('orch-verifier-test')
    controller = new TestServerController()
    driver = new BrowserAutomationDriver()
    verifier = new OrchestrationVerifier(driver)
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
    await controller.stop().catch(() => {})
  })

  it('should instantiate OrchestrationVerifier with driver', () => {
    expect(verifier).toBeDefined()
  })

  it('should verify simulated run flow with phase transitions and log streaming', async () => {
    const instance = await controller.start(sandboxPath)
    await driver.launch({ headless: true })
    const page = await driver.newPage(instance.baseUrl)

    const result = await verifier.verifyFullRunFlow(page, {
      expectedPhases: ['BOOTSTRAP', 'PLANNING', 'DEVELOPMENT', 'DEPLOY'],
      minLogLines: 2,
      finalStatus: 'COMPLETED',
    }, instance.baseUrl, sandboxPath)

    expect(result.status).toBe('COMPLETED')
    expect(result.jobId).toBeDefined()
    expect(result.logLines).toBeGreaterThanOrEqual(2)
  })

  it('should mask sensitive tokens in logs before DOM rendering', () => {
    const rawLog = 'Connecting with secret token sk-ant-api03-abcdef123456 and ghp_999999999'
    const sanitized = verifier.sanitizeLogForDom(rawLog)
    expect(sanitized).not.toContain('sk-ant-api03-abcdef123456')
    expect(sanitized).not.toContain('ghp_999999999')
    expect(sanitized).toContain('***MASKED***')
  })

  it('should handle cancellation workflow and transition to HALTED', async () => {
    const instance = await controller.start(sandboxPath)
    await driver.launch({ headless: true })
    const page = await driver.newPage(instance.baseUrl)

    const result = await verifier.verifyCancellationFlow(page, instance.baseUrl, 'mock-job-to-cancel', sandboxPath)
    expect(result.halted).toBe(true)
    expect(result.status).toBe('HALTED')
  })
})

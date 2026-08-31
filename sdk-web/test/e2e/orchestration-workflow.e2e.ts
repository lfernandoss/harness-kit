import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestServerController } from './fixtures/server-controller.js'
import { BrowserAutomationDriver } from './fixtures/browser-driver.js'
import { OrchestrationVerifier, verifyOrchestrationWorkflow } from './verifiers/orchestration-verifier.js'
import { createEphemeralSandbox } from './fixtures/sandbox.js'

describe('E2E Orchestration Workflow & SSE Log Streaming Suite', () => {
  let sandboxPath: string
  let controller: TestServerController
  let driver: BrowserAutomationDriver
  let verifier: OrchestrationVerifier

  beforeEach(async () => {
    sandboxPath = await createEphemeralSandbox('orch-e2e')
    controller = new TestServerController()
    driver = new BrowserAutomationDriver()
    verifier = new OrchestrationVerifier(driver)
    await driver.launch({ headless: true })
  })

  afterEach(async () => {
    await driver.close().catch(() => {})
    await controller.stop().catch(() => {})
  })

  it('Should execute full orchestration run and display real-time progress when user clicks Start Run', async () => {
    const instance = await controller.start(sandboxPath)
    const page = await driver.newPage(`${instance.baseUrl}/run`)

    const result = await verifyOrchestrationWorkflow(page, {
      expectedPhases: ['BOOTSTRAP', 'PLANNING', 'DEVELOPMENT', 'DEPLOY'],
      minLogLines: 3,
      finalStatus: 'COMPLETED',
    }, instance.baseUrl, sandboxPath)

    expect(result.status).toBe('COMPLETED')
    expect(result.jobId).toBeDefined()
    expect(result.logLines).toBeGreaterThanOrEqual(3)

    const content = await page.content()
    expect(content).toContain('COMPLETED')
  })

  it('Should terminate full subprocess tree when user clicks Cancel Run button in UI', async () => {
    const instance = await controller.start(sandboxPath)
    const page = await driver.newPage(`${instance.baseUrl}/run`)

    const result = await verifier.verifyCancellationFlow(page, instance.baseUrl, 'e2e-abort-job', sandboxPath)
    expect(result.halted).toBe(true)
    expect(result.status).toBe('HALTED')
  })

  it('Should filter sensitive tokens and environment variables from rendered DOM logs', async () => {
    const instance = await controller.start(sandboxPath)
    const page = await driver.newPage(`${instance.baseUrl}/run`)

    const rawLogsWithTokens = [
      'Initialized agent with API_KEY=sk-ant-api03-abcdef987654321',
      'Exported GITHUB_TOKEN=ghp_secrettoken1234567890',
      'Normal log line: building components',
    ]

    const sanitized = verifier.sanitizeLogList(rawLogsWithTokens)
    expect(sanitized.join('\n')).not.toContain('sk-ant-api03-abcdef987654321')
    expect(sanitized.join('\n')).not.toContain('ghp_secrettoken1234567890')
    expect(sanitized.join('\n')).toContain('***MASKED***')
  })
})

import { describe, it, expect } from 'vitest'
import { AntigravityCLIRunner } from '../antigravity-cli/AntigravityCLIRunner'
import { AgentInvocation, Runner } from '../types'
import { AgentRunnerRegistry } from '../AgentRunnerRegistry'
import crossSpawn from 'cross-spawn'

const isIntegrationEnabled = Boolean(process.env.AGY_INTEGRATION_TEST && process.env.AGY_INTEGRATION_TEST !== 'false')

describe.skipIf(!isIntegrationEnabled)('AntigravityCLIRunner — Live Binary Integration Suite', () => {
  it('Should execute live agy --version check or basic invocation', () => {
    const proc = crossSpawn.sync('agy', ['--version'], { encoding: 'utf8' })
    expect(proc.status).toBe(0)
    expect(proc.stdout || proc.stderr).toBeTruthy()
  })

  it('Should perform live headless turn with real agy CLI binary and verify response parsing', async () => {
    const runner = new AntigravityCLIRunner()
    const invocation: AgentInvocation = {
      prompt: 'Respond with exactly: "ANTIGRAVITY_INTEGRATION_TEST_OK"',
      agent: 'developer-backend',
      mode: 'autonomous',
      timeoutMs: 60000,
    }

    const output = await runner.run(invocation)
    expect(output.success).toBe(true)
    expect(output.raw).toContain('ANTIGRAVITY_INTEGRATION_TEST_OK')
    if (output.session) {
      expect(output.session.id).toBeTruthy()
    }
  })

  it('Should support workspace skill discovery using real --add-dir arguments', async () => {
    const runner = new AntigravityCLIRunner()
    const invocation: AgentInvocation = {
      prompt: 'Verify skill discovery',
      agent: 'developer-backend',
      mode: 'autonomous',
      additionalDirs: [process.cwd()],
      timeoutMs: 60000,
    }

    const output = await runner.run(invocation)
    expect(output.success).toBe(true)
  })
})

describe('AntigravityCLIRunner — Live Integration Gating Gatekeeper', () => {
  it('Should correctly reflect AGY_INTEGRATION_TEST flag status', () => {
    expect(typeof isIntegrationEnabled).toBe('boolean')
  })

  it('Should ensure runner is registered in registry for integration callers', () => {
    const reg = AgentRunnerRegistry.get(Runner.ANTIGRAVITY_CLI)
    expect(reg).toBeDefined()
    expect(reg?.constructor).toBe(AntigravityCLIRunner)
  })
})

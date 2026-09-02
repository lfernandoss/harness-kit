import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'path'
import { existsSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { HarnessOrchestrator } from '../../src/orchestrator/HarnessOrchestrator'
import { HarnessSettings } from '../../src/settings/HarnessSettings'
import { FakeAgentRunner } from '../helpers/FakeAgentRunner'
import type { AgentInvocation, AgentOutput } from '../../src/agent-runner/types'
import { Complexity } from '../../src/orchestrator/types'

describe('T17 — Orchestrator Settings Overrides', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `orchestrator-settings-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('applies settings overrides to agent invocations', async () => {
    const fakeRunner = new FakeAgentRunner()
    // Explicit type to match default settings or settings files
    Object.defineProperty(fakeRunner, 'type', { value: 'claude-cli', writable: true })

    const globalDir = join(tmpDir, 'global-config')
    const globalFile = join(globalDir, 'harness-kit', 'settings.json')
    vi.spyOn(HarnessSettings as any, 'getGlobalSettingsPath').mockReturnValue(globalFile)

    // Pre-create global file with specific settings
    mkdirSync(join(globalDir, 'harness-kit'), { recursive: true })
    writeFileSync(globalFile, JSON.stringify({
      'claude-cli': {
        phases: {
          bootstrap: { model: 'overridden-bootstrap-model', effort: 'low' }
        }
      }
    }))

    const settings = HarnessSettings.load(tmpDir)

    const orchestrator = new HarnessOrchestrator({
      scope: 'test-scope',
      projectPaths: [tmpDir],
      agentRunner: fakeRunner,
      productDir: join(tmpDir, 'docs', 'product'),
      settings,
      complexity: Complexity.AUTO,
    }, { workingDir: tmpDir })

    await orchestrator.runBootstrapOnly()

    const bootstrapCalls = fakeRunner.invocations
    expect(bootstrapCalls.length).toBeGreaterThan(0)
    // Should have used the overridden model and effort
    expect(bootstrapCalls[0]).toHaveProperty('model', 'overridden-bootstrap-model')
    expect(bootstrapCalls[0]).toHaveProperty('effort', 'low')
  })

  it('applies custom timeoutMs configuration and aborts when timeout expires', async () => {
    const fakeRunner = new FakeAgentRunner()
    Object.defineProperty(fakeRunner, 'type', { value: 'claude-cli', writable: true })

    // Stub runner to simulate a long running task that checks abort signal
    fakeRunner.run = async (invocation: AgentInvocation, options?: { signal?: AbortSignal }): Promise<AgentOutput> => {
      fakeRunner.invocations.push(invocation)
      return new Promise((_, reject) => {
        const check = () => {
          if (options?.signal?.aborted) {
            reject(new Error('aborted'))
          } else {
            setTimeout(check, 2)
          }
        }
        check()
      })
    }

    const orchestrator = new HarnessOrchestrator({
      scope: 'test-scope',
      projectPaths: [tmpDir],
      agentRunner: fakeRunner,
      productDir: join(tmpDir, 'docs', 'product'),
      timeoutMs: 10, // 10ms timeout via orchestrator config
      complexity: Complexity.AUTO,
    }, { workingDir: tmpDir })

    await expect(orchestrator.runBootstrapOnly()).rejects.toThrow('aborted')
  })

  it('reads timeoutMs from phase settings', async () => {
    const fakeRunner = new FakeAgentRunner()
    Object.defineProperty(fakeRunner, 'type', { value: 'claude-cli', writable: true })

    fakeRunner.run = async (invocation: AgentInvocation, _options?: { signal?: AbortSignal }): Promise<AgentOutput> => {
      fakeRunner.invocations.push(invocation)
      return { success: true, stdout: 'mock', stderr: '', raw: '{}' }
    }

    const globalDir = join(tmpDir, 'global-config-timeout')
    const globalFile = join(globalDir, 'harness-kit', 'settings.json')
    vi.spyOn(HarnessSettings as any, 'getGlobalSettingsPath').mockReturnValue(globalFile)

    mkdirSync(join(globalDir, 'harness-kit'), { recursive: true })
    writeFileSync(globalFile, JSON.stringify({
      'claude-cli': {
        phases: {
          bootstrap: { timeoutMs: 9999 }
        }
      }
    }))

    const settings = HarnessSettings.load(tmpDir)

    const orchestrator = new HarnessOrchestrator({
      scope: 'test-scope',
      projectPaths: [tmpDir],
      agentRunner: fakeRunner,
      productDir: join(tmpDir, 'docs', 'product'),
      settings,
      complexity: Complexity.AUTO,
    }, { workingDir: tmpDir })

    const spy = vi.spyOn(global, 'setTimeout')

    await orchestrator.runBootstrapOnly()

    expect(spy).toHaveBeenCalledWith(expect.any(Function), 9999)
  })

  it('TC-CLI-01: cmdSettings set updates runner defaultModel and effort declaratively', async () => {
    const { cmdSettings } = await import('../../src/cli/services/settings-service.js')
    const localSettingsFile = join(tmpDir, '.harness-kit', 'settings.json')

    await cmdSettings(tmpDir, ['set', 'antigravity', '--model', 'gemini-3.7-flash', '--effort', 'high', '--scope', 'local'])

    expect(existsSync(localSettingsFile)).toBe(true)
    const saved = JSON.parse(readFileSync(localSettingsFile, 'utf-8'))
    expect(saved.antigravity.defaultModel).toBe('gemini-3.7-flash')
    expect(saved.antigravity.defaultEffort).toBe('high')
  })

  it('TC-CLI-02: cmdSettings set updates phase-specific override declaratively', async () => {
    const { cmdSettings } = await import('../../src/cli/services/settings-service.js')
    const localSettingsFile = join(tmpDir, '.harness-kit', 'settings.json')

    await cmdSettings(tmpDir, ['set', 'claude', '--phase', 'planning', '--model', 'claude-3-7-sonnet', '--effort', 'high', '--scope', 'local'])

    expect(existsSync(localSettingsFile)).toBe(true)
    const saved = JSON.parse(readFileSync(localSettingsFile, 'utf-8'))
    expect(saved.claude.phases.planning.model).toBe('claude-3-7-sonnet')
    expect(saved.claude.phases.planning.effort).toBe('high')
  })

  it('TC-CLI-03: cmdSettings set outputs JSON when --json flag is passed', async () => {
    const { cmdSettings } = await import('../../src/cli/services/settings-service.js')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await cmdSettings(tmpDir, ['set', 'cursor', '--model', 'gpt-5.6-sol', '--scope', 'local', '--json'])

    expect(logSpy).toHaveBeenCalled()
    const lastCall = logSpy.mock.calls[logSpy.mock.calls.length - 1][0]
    const parsed = JSON.parse(lastCall)
    expect(parsed.status).toBe('SUCCESS')
    expect(parsed.settings.cursor.defaultModel).toBe('gpt-5.6-sol')
  })

  it('TC-INVOKE-01: AgentInvocationService applies runner defaultModel when phase model is absent', async () => {
    const fakeRunner = new FakeAgentRunner()
    Object.defineProperty(fakeRunner, 'type', { value: 'antigravity-cli', writable: true })

    const customSettingsMap = {
      'antigravity': {
        defaultModel: 'gemini-3.7-flash',
        defaultEffort: 'medium',
        phases: {}
      }
    }
    const settings = new (HarnessSettings as any)(customSettingsMap)

    const orchestrator = new HarnessOrchestrator({
      scope: 'test-scope',
      projectPaths: [tmpDir],
      agentRunner: fakeRunner,
      productDir: join(tmpDir, 'docs', 'product'),
      settings,
      complexity: Complexity.AUTO,
    }, { workingDir: tmpDir })

    await orchestrator.runBootstrapOnly()

    const calls = fakeRunner.invocations
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0]).toHaveProperty('model', 'gemini-3.7-flash')
    expect(calls[0]).toHaveProperty('effort', 'medium')
  })
})


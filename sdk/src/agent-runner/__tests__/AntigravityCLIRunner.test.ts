import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AgentInvocation, AgentOutput, AgentSession, Runner, TokenUsage } from '../types'
import { AntigravityCLIRunner } from '../antigravity-cli/AntigravityCLIRunner'
import { AbstractCliRunner } from '../AbstractCliRunner'
import { AgentRunnerRegistry } from '../AgentRunnerRegistry'
import { AgentRunnerError, AgentRunnerErrorCode } from '../AgentRunnerError'
import spawn from 'cross-spawn'
import EventEmitter from 'node:events'

vi.mock('cross-spawn', () => ({
  default: vi.fn(),
}))

class MockChildProcess extends EventEmitter {
  stdout: EventEmitter
  stderr: EventEmitter
  stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }
  pid: number | undefined
  kill: ReturnType<typeof vi.fn>

  constructor(
    mockStdout: string[] = [],
    mockStderr: string[] = [],
    exitCode: number = 0,
    error?: NodeJS.ErrnoException,
    opts?: { hang?: boolean },
  ) {
    super()
    this.stdout = new EventEmitter()
    this.stderr = new EventEmitter()
    this.stdin = { write: vi.fn(), end: vi.fn() }
    this.pid = 12345
    this.kill = vi.fn()

    if (error) {
      setTimeout(() => this.emit('error', error), 10)
      return
    }

    if (opts?.hang) {
      return
    }

    let stdoutIndex = 0
    let stderrIndex = 0

    const sendData = () => {
      if (stdoutIndex < mockStdout.length) {
        this.stdout.emit('data', mockStdout[stdoutIndex++])
      }
      if (stderrIndex < mockStderr.length) {
        this.stderr.emit('data', mockStderr[stderrIndex++])
      }

      if (stdoutIndex === mockStdout.length && stderrIndex === mockStderr.length) {
        setTimeout(() => this.emit('close', exitCode), 10)
      } else {
        setTimeout(sendData, 5)
      }
    }
    setTimeout(sendData, 5)
  }
}

describe('AntigravityCLIRunner — Unit Tests', () => {
  let invocation: AgentInvocation
  let mockSpawn: ReturnType<typeof vi.mocked<typeof spawn>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSpawn = vi.mocked(spawn)

    invocation = {
      prompt: 'Hello Antigravity',
      skill: 'test-skill',
      agent: 'test-agent',
      payload: { key: 'value' },
      mode: 'autonomous',
    }
  })

  describe('1.1 Runners and Registry', () => {
    describe('Creation & Registration', () => {
      it('Should instantiate AntigravityCLIRunner with default binary name agy and writePromptToStdin = true', () => {
        const runner = new AntigravityCLIRunner()
        expect(runner.type).toBe(Runner.ANTIGRAVITY_CLI)
        // @ts-ignore - protected property access
        expect(runner.binaryName).toBe('agy')
        // @ts-ignore - protected property access
        expect(runner.writePromptToStdin).toBe(true)
      })

      it('Should register AntigravityCLIRunner in AgentRunnerRegistry under Runner.ANTIGRAVITY_CLI', () => {
        expect(AgentRunnerRegistry.has(Runner.ANTIGRAVITY_CLI)).toBe(true)
        const registration = AgentRunnerRegistry.get(Runner.ANTIGRAVITY_CLI)
        expect(registration).toBeDefined()
        expect(registration?.constructor).toBe(AntigravityCLIRunner)
      })

      it('Should reject duplicate registration in AgentRunnerRegistry with descriptive error', () => {
        expect(() => {
          AgentRunnerRegistry.register({
            type: Runner.ANTIGRAVITY_CLI,
            constructor: AntigravityCLIRunner,
          })
        }).toThrow(/already registered/i)
      })
    })

    describe('CLI Argument Construction', () => {
      it('Should build arguments containing --print-timeout and --dangerously-skip-permissions', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const args = runner.buildArgs(invocation.prompt!, invocation)

        expect(args).not.toContain('--output-format')
        expect(args).toContain('--print-timeout')
        expect(args[args.indexOf('--print-timeout') + 1]).toBe('1801000ms')
        expect(args).toContain('--dangerously-skip-permissions')
      })

      it('Should append --agent <name> when invocation.agent is defined', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const args = runner.buildArgs(invocation.prompt!, { ...invocation, agent: 'backend-dev' })

        expect(args).toContain('--agent')
        expect(args[args.indexOf('--agent') + 1]).toBe('backend-dev')
      })

      it('Should append --model <model> and --effort <effort> when configured in runner or invocation', () => {
        const runnerWithConfig = new AntigravityCLIRunner({ model: 'gemini-1.5-pro', effort: 'high' })
        // @ts-ignore - protected method access
        const argsConfig = runnerWithConfig.buildArgs(invocation.prompt!, invocation)

        expect(argsConfig).toContain('--model')
        expect(argsConfig[argsConfig.indexOf('--model') + 1]).toBe('gemini-1.5-pro')
        expect(argsConfig).toContain('--effort')
        expect(argsConfig[argsConfig.indexOf('--effort') + 1]).toBe('high')

        const runnerWithoutConfig = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const argsInvocation = runnerWithoutConfig.buildArgs(invocation.prompt!, {
          ...invocation,
          model: 'gemini-2.0-flash',
          effort: 'medium',
        })

        expect(argsInvocation).toContain('--model')
        expect(argsInvocation[argsInvocation.indexOf('--model') + 1]).toBe('gemini-2.0-flash')
        expect(argsInvocation).toContain('--effort')
        expect(argsInvocation[argsInvocation.indexOf('--effort') + 1]).toBe('medium')
      })

      it('Should append multiple --add-dir <path> flags when invocation.additionalDirs contains workspace paths', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const args = runner.buildArgs(invocation.prompt!, {
          ...invocation,
          additionalDirs: ['/path/to/skill-a', '/path/to/skill-b'],
        })

        expect(args).toContain('--add-dir')
        const addDirIndices = args.reduce<number[]>((acc, cur, idx) => (cur === '--add-dir' ? [...acc, idx] : acc), [])
        expect(addDirIndices.length).toBe(2)
        expect(args[addDirIndices[0] + 1]).toBe('/path/to/skill-a')
        expect(args[addDirIndices[1] + 1]).toBe('/path/to/skill-b')
      })

      it('Should append --conversation <sessionId> when invocation.session.id is provided', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const args = runner.buildArgs(invocation.prompt!, {
          ...invocation,
          session: { id: 'conv-session-123' },
        })

        expect(args).toContain('--conversation')
        expect(args[args.indexOf('--conversation') + 1]).toBe('conv-session-123')
      })

      it('Should omit prompt text from argument array and ensure no -p flag is generated', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const args = runner.buildArgs(invocation.prompt!, invocation)

        expect(args).not.toContain('-p')
        expect(args).not.toContain('--prompt')
        expect(args).not.toContain('Hello Antigravity')
      })
    })

    describe('Output & Error Parsing', () => {
      it('Should parse structured JSON response from stdout and extract response, structured_output, and usage', async () => {
        const mockJsonOutput = JSON.stringify({
          conversation_id: 'conv-123',
          status: 'SUCCESS',
          response: 'Generated solution successfully',
          structured_output: { testResult: 'PASSED', files: ['file1.ts'] },
          usage: {
            input_tokens: 1200,
            output_tokens: 450,
            cache_creation_tokens: 100,
            cache_read_tokens: 300,
            cost_usd: 0.0042,
          },
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.success).toBe(true)
        expect(result.raw).toBe('Generated solution successfully')
        expect(result.artefacts).toEqual({ testResult: 'PASSED', files: ['file1.ts'] })
        expect(result.usage).toEqual({
          inputTokens: 1200,
          outputTokens: 450,
          cacheCreationTokens: 100,
          cacheReadTokens: 300,
          costUsd: 0.0042,
          model: undefined,
          effort: undefined,
        })
      })

      it('Should fallback to plain text response when stdout contains non-JSON content', async () => {
        const plainText = 'Non-JSON raw stdout text from agy'
        mockSpawn.mockReturnValue(new MockChildProcess([plainText]) as any)

        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.success).toBe(true)
        expect(result.raw).toBe(plainText)
        expect(result.stdout).toBe(plainText)
      })

      it('Should extract structured artefacts using extractJsonOrNull when structured_output is absent in JSON', async () => {
        const mockJsonOutput = JSON.stringify({
          conversation_id: 'conv-123',
          status: 'SUCCESS',
          response: 'Here is the result:\n```json\n{"extractedKey": "extractedValue"}\n```',
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.success).toBe(true)
        expect(result.artefacts).toEqual({ extractedKey: 'extractedValue' })
      })

      it('Should throw AgentRunnerError with API_ERROR when status is FAILED', async () => {
        const mockJsonOutput = JSON.stringify({
          conversation_id: 'conv-123',
          status: 'FAILED',
          error: 'Execution failed due to syntax error in generated code',
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

        const runner = new AntigravityCLIRunner()
        await expect(runner.run(invocation)).rejects.toThrow(
          expect.objectContaining({
            code: AgentRunnerErrorCode.API_ERROR,
            message: expect.stringContaining('Execution failed due to syntax error'),
          })
        )
      })

      it('Should handle error_message and message fields when error field is absent', async () => {
        const mockWithErrorMessage = JSON.stringify({
          status: 'FAILED',
          error_message: 'Failure via error_message',
        })
        mockSpawn.mockReturnValue(new MockChildProcess([mockWithErrorMessage]) as any)
        const runner = new AntigravityCLIRunner()
        await expect(runner.run(invocation)).rejects.toThrow('Failure via error_message')

        const mockWithMessage = JSON.stringify({
          status: 'FAILED',
          message: 'Failure via message',
        })
        mockSpawn.mockReturnValue(new MockChildProcess([mockWithMessage]) as any)
        await expect(runner.run(invocation)).rejects.toThrow('Failure via message')
      })

      it('Should handle error when invocation has no skill and errorDetail is empty', async () => {
        const mockFailed = JSON.stringify({
          status: 'FAILED',
          response: 'raw failure',
        })
        mockSpawn.mockReturnValue(new MockChildProcess([mockFailed]) as any)
        const runner = new AntigravityCLIRunner()
        const invWithoutSkill: AgentInvocation = {
          agent: 'test',
          mode: 'autonomous',
          prompt: 'test',
        }
        await expect(runner.run(invWithoutSkill)).rejects.toThrow('raw failure')
      })

      it('Should extract embedded json artefacts when stdout is plain text with json block', async () => {
        const plainWithJson = 'Some plain text prefix\n```json\n{"plainArtefact": "value"}\n```\n'
        mockSpawn.mockReturnValue(new MockChildProcess([plainWithJson]) as any)
        const runner = new AntigravityCLIRunner()
        const res = await runner.run(invocation)
        expect(res.artefacts).toEqual({ plainArtefact: 'value' })
      })

      it('Should not extract artefacts when non-JSON stdout contains JSON array instead of object', async () => {
        const plainWithArray = 'Plain text\n```json\n[1, 2, 3]\n```\n'
        mockSpawn.mockReturnValue(new MockChildProcess([plainWithArray]) as any)
        const runner = new AntigravityCLIRunner()
        const res = await runner.run(invocation)
        expect(res.artefacts).toBeUndefined()
      })

      it('Should handle checkParsed when both errorDetail and raw are absent', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore
        const err = runner.checkParsed({ success: false }, invocation)
        expect(err).toBeInstanceOf(AgentRunnerError)
        expect(err?.message).toBe('agy agent returned an error: ')
      })

      it('Should not append --agent when invocation.agent is undefined or empty', () => {
        const runner = new AntigravityCLIRunner()
        // @ts-ignore
        const args = runner.buildArgs('prompt', { mode: 'autonomous', agent: '' })
        expect(args).not.toContain('--agent')
      })

      it('Should throw AgentRunnerError with API_ERROR when status is ERROR and response is empty', async () => {
        const mockJsonOutput = JSON.stringify({
          conversation_id: 'conv-123',
          status: 'ERROR',
          error: 'Critical agent failure',
          response: '',
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

        const runner = new AntigravityCLIRunner()
        await expect(runner.run(invocation)).rejects.toThrow(
          expect.objectContaining({
            code: AgentRunnerErrorCode.API_ERROR,
            message: expect.stringContaining('Critical agent failure'),
          })
        )
      })

      it('Should succeed with success: true when status is ERROR but response contains valid non-empty text (tool warning recovery)', async () => {
        const mockJsonOutput = JSON.stringify({
          conversation_id: 'conv-123',
          status: 'ERROR',
          error: 'declaring permissions: cortex tool write_to_file: invalid artifact path',
          response: 'Recovered output from tool warning',
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.success).toBe(true)
        expect(result.raw).toBe('Recovered output from tool warning')
      })

      it('Should extract session ID from conversation_id, conversationId, session_id, or sessionId fields', async () => {
        const variations = [
          { json: { conversation_id: 'sess-1', status: 'SUCCESS', response: 'ok' }, expected: 'sess-1' },
          { json: { conversationId: 'sess-2', status: 'SUCCESS', response: 'ok' }, expected: 'sess-2' },
          { json: { session_id: 'sess-3', status: 'SUCCESS', response: 'ok' }, expected: 'sess-3' },
          { json: { sessionId: 'sess-4', status: 'SUCCESS', response: 'ok' }, expected: 'sess-4' },
        ]

        for (const { json, expected } of variations) {
          mockSpawn.mockReturnValue(new MockChildProcess([JSON.stringify(json)]) as any)
          const runner = new AntigravityCLIRunner()
          const result = await runner.run(invocation)
          expect(result.session).toEqual({ id: expected })
        }
      })
    })
  })

  describe('1.2 Value Objects and Types', () => {
    describe('AgentInvocation Validation', () => {
      it('Should accept valid AgentInvocation with required agent and mode fields', () => {
        const validInvocation: AgentInvocation = {
          agent: 'developer-backend',
          mode: 'autonomous',
        }
        expect(validInvocation.agent).toBe('developer-backend')
        expect(validInvocation.mode).toBe('autonomous')
      })

      it('Should support optional skill, prompt, payload, session, additionalDirs, and timeoutMs fields', () => {
        const fullInvocation: AgentInvocation = {
          agent: 'developer-backend',
          mode: 'autonomous',
          skill: 'tdd-orchestrator',
          prompt: 'Execute step 1',
          payload: { feature: 'F001' },
          session: { id: 'session-xyz' },
          additionalDirs: ['/dir1', '/dir2'],
          timeoutMs: 60000,
        }
        expect(fullInvocation.skill).toBe('tdd-orchestrator')
        expect(fullInvocation.timeoutMs).toBe(60000)
        expect(fullInvocation.additionalDirs).toEqual(['/dir1', '/dir2'])
      })

      it('Should preserve invocation immutability during argument serialization', () => {
        const immutableInvocation: Readonly<AgentInvocation> = Object.freeze({
          agent: 'developer-backend',
          mode: 'autonomous' as const,
          additionalDirs: Object.freeze(['/dir1', '/dir2']) as unknown as string[],
          session: Object.freeze({ id: 'sess-1' }),
        })

        const runner = new AntigravityCLIRunner()
        // @ts-ignore - protected method access
        const args = runner.buildArgs('test prompt', immutableInvocation)
        expect(args).toContain('--agent')
        expect(immutableInvocation.agent).toBe('developer-backend')
      })
    })

    describe('TokenUsage Accounting', () => {
      it('Should map input_tokens, output_tokens, cache_read_tokens, and cost_usd to TokenUsage', async () => {
        const mockJson = JSON.stringify({
          status: 'SUCCESS',
          response: 'ok',
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_read_tokens: 25,
            cost_usd: 0.002,
          },
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJson]) as any)
        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.usage).toMatchObject({
          inputTokens: 100,
          outputTokens: 50,
          cacheReadTokens: 25,
          costUsd: 0.002,
        })
      })

      it('Should default missing token counts to zero in normalized TokenUsage', async () => {
        const mockJson = JSON.stringify({
          status: 'SUCCESS',
          response: 'ok',
          usage: {},
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJson]) as any)
        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.usage).toEqual({
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          costUsd: 0,
          model: undefined,
          effort: undefined,
        })
      })

      it('Should include resolved model and effort in TokenUsage metadata', async () => {
        const mockJson = JSON.stringify({
          status: 'SUCCESS',
          response: 'ok',
          usage: { input_tokens: 10 },
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJson]) as any)
        const runner = new AntigravityCLIRunner({ model: 'gemini-2.0-pro', effort: 'high' })
        const result = await runner.run(invocation)

        expect(result.usage?.model).toBe('gemini-2.0-pro')
        expect(result.usage?.effort).toBe('high')
      })
    })

    describe('AgentSession Equality & Continuity', () => {
      it('Should consider two AgentSession instances equal when they contain identical id values', () => {
        const sessionA: AgentSession = { id: 'conv-abc' }
        const sessionB: AgentSession = { id: 'conv-abc' }
        expect(sessionA.id).toBe(sessionB.id)
      })

      it('Should propagate session identifier without mutation through runner response envelope', async () => {
        const mockJson = JSON.stringify({
          conversation_id: 'conv-persistent-999',
          status: 'SUCCESS',
          response: 'Continuity maintained',
        })

        mockSpawn.mockReturnValue(new MockChildProcess([mockJson]) as any)
        const runner = new AntigravityCLIRunner()
        const result = await runner.run({ ...invocation, session: { id: 'conv-persistent-999' } })

        expect(result.session?.id).toBe('conv-persistent-999')
      })
    })
  })

  describe('1.3 Domain Services and Utilities', () => {
    describe('Environment Sanitization (filterSensitiveEnv)', () => {
      it('Should strip environment variables ending in _KEY, _SECRET, _TOKEN, _PASS, _PASSWORD', () => {
        const env = {
          OPENAI_API_KEY: 'secret1',
          APP_SECRET: 'secret2',
          GITHUB_TOKEN: 'secret3',
          DB_PASS: 'secret4',
          USER_PASSWORD: 'secret5',
          SAFE_VAR: 'visible',
        }

        const filtered = AbstractCliRunner.filterSensitiveEnv(env)
        expect(filtered.OPENAI_API_KEY).toBeUndefined()
        expect(filtered.APP_SECRET).toBeUndefined()
        expect(filtered.GITHUB_TOKEN).toBeUndefined()
        expect(filtered.DB_PASS).toBeUndefined()
        expect(filtered.USER_PASSWORD).toBeUndefined()
        expect(filtered.SAFE_VAR).toBe('visible')
      })

      it('Should strip DATABASE_URL, REDIS_URL, MONGO, AUTH_, PROJECT_MAPPINGS, and ALLOWED_WORKSPACES', () => {
        const env = {
          DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
          REDIS_URL: 'redis://localhost:6379',
          MONGO_URI: 'mongodb://localhost:27017',
          AUTH_BEARER: 'bearer-token',
          PROJECT_MAPPINGS: '{"a": "b"}',
          ALLOWED_WORKSPACES: '/var/workspaces',
          GIT_REPOSITORIES: '/git/repos',
          NORMAL_ENV: 'normal',
        }

        const filtered = AbstractCliRunner.filterSensitiveEnv(env)
        expect(filtered.DATABASE_URL).toBeUndefined()
        expect(filtered.REDIS_URL).toBeUndefined()
        expect(filtered.MONGO_URI).toBeUndefined()
        expect(filtered.AUTH_BEARER).toBeUndefined()
        expect(filtered.PROJECT_MAPPINGS).toBeUndefined()
        expect(filtered.ALLOWED_WORKSPACES).toBeUndefined()
        expect(filtered.GIT_REPOSITORIES).toBeUndefined()
        expect(filtered.NORMAL_ENV).toBe('normal')
      })

      it('Should retain non-sensitive variables such as PATH, NODE_ENV, HOME, and TMPDIR', () => {
        const env = {
          PATH: '/usr/local/bin:/usr/bin',
          NODE_ENV: 'test',
          HOME: '/home/user',
          TMPDIR: '/tmp',
        }

        const filtered = AbstractCliRunner.filterSensitiveEnv(env)
        expect(filtered.PATH).toBe('/usr/local/bin:/usr/bin')
        expect(filtered.NODE_ENV).toBe('test')
        expect(filtered.HOME).toBe('/home/user')
        expect(filtered.TMPDIR).toBe('/tmp')
      })
    })

    describe('Streaming Telemetry (onStdoutLine)', () => {
      it('Should invoke onStdoutLine for each newline-delimited line emitted during process execution', async () => {
        const lines = ['[INFO] starting agent\n', '[STEP] step 1 running\n', '{"status":"SUCCESS","response":"done"}\n']
        mockSpawn.mockReturnValue(new MockChildProcess(lines) as any)

        class TelemetryRunner extends AntigravityCLIRunner {
          readonly receivedLines: string[] = []
          protected override onStdoutLine(line: string, _inv: AgentInvocation): void {
            this.receivedLines.push(line)
          }
        }

        const runner = new TelemetryRunner()
        const result = await runner.run(invocation)

        expect(result.success).toBe(true)
        expect(runner.receivedLines).toContain('[INFO] starting agent')
        expect(runner.receivedLines).toContain('[STEP] step 1 running')
      })

      it('Should not mutate or corrupt the buffered stdout used for final payload extraction', async () => {
        const mockJson = JSON.stringify({ status: 'SUCCESS', response: 'Payload intact' })
        mockSpawn.mockReturnValue(new MockChildProcess([mockJson + '\n']) as any)

        const runner = new AntigravityCLIRunner()
        const result = await runner.run(invocation)

        expect(result.raw).toBe('Payload intact')
      })
    })
  })

  describe('1.4 Domain Events and Lifecycle Hooks', () => {
    describe('Process Lifecycle Events', () => {
      it('Should register process kill cleanup handler in activeKillFns on process spawn and unregister on close', async () => {
        const mockChild = new MockChildProcess(['{"status":"SUCCESS","response":"ok"}'])
        mockSpawn.mockReturnValue(mockChild as any)

        const runner = new AntigravityCLIRunner()
        const runPromise = runner.run(invocation)

        // @ts-ignore - access private activeKillFns
        const activeKillFns = AbstractCliRunner.activeKillFns
        expect(activeKillFns.size).toBeGreaterThanOrEqual(1)

        await runPromise
        expect(activeKillFns.size).toBe(0)
      })

      it('Should register OS signal handlers (SIGINT, SIGTERM, SIGHUP) only once across all runners', () => {
        const processOnSpy = vi.spyOn(process, 'on')
        const runner1 = new AntigravityCLIRunner()
        const runner2 = new AntigravityCLIRunner()

        // @ts-ignore
        AbstractCliRunner.registerSignalHandlers()
        // @ts-ignore
        AbstractCliRunner.registerSignalHandlers()

        const sigintCalls = processOnSpy.mock.calls.filter(([event]) => event === 'SIGINT')
        expect(sigintCalls.length).toBeLessThanOrEqual(1)
        processOnSpy.mockRestore()
      })
    })
  })
})

describe('AntigravityCLIRunner — Integration Tests', () => {
  let invocation: AgentInvocation
  let mockSpawn: ReturnType<typeof vi.mocked<typeof spawn>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSpawn = vi.mocked(spawn)

    invocation = {
      prompt: 'Test integration prompt',
      skill: 'test-skill',
      agent: 'developer-backend',
      mode: 'autonomous',
    }
  })

  describe('2.1 Runner Registry Integration', () => {
    it('Should retrieve AntigravityCLIRunner constructor from AgentRunnerRegistry.get(Runner.ANTIGRAVITY_CLI)', () => {
      const reg = AgentRunnerRegistry.get(Runner.ANTIGRAVITY_CLI)
      expect(reg).toBeDefined()
      expect(reg?.type).toBe(Runner.ANTIGRAVITY_CLI)
      expect(reg?.constructor).toBe(AntigravityCLIRunner)
    })

    it('Should instantiate and execute runner retrieved from AgentRunnerRegistry', async () => {
      const reg = AgentRunnerRegistry.get(Runner.ANTIGRAVITY_CLI)!
      const RunnerClass = reg.constructor
      const runner = new RunnerClass({})

      mockSpawn.mockReturnValue(new MockChildProcess(['{"status":"SUCCESS","response":"Registry execution success"}']) as any)
      const result = await runner.run(invocation)

      expect(result.success).toBe(true)
      expect(result.raw).toBe('Registry execution success')
    })
  })

  describe('2.2 Orchestration Flows and Multi-Turn Continuity', () => {
    it('Should stream prompt to child process stdin, capture mock stdout, and resolve complete AgentOutput', async () => {
      const mockProcess = new MockChildProcess(['{"status":"SUCCESS","response":"Turn 1 output"}'])
      mockSpawn.mockReturnValue(mockProcess as any)

      const runner = new AntigravityCLIRunner()
      const result = await runner.run({ ...invocation, prompt: 'Detailed turn 1 prompt' })

      expect(mockProcess.stdin.write).toHaveBeenCalledWith('Detailed turn 1 prompt', 'utf8')
      expect(mockProcess.stdin.end).toHaveBeenCalled()
      expect(result.raw).toBe('Turn 1 output')
    })

    it('Should pass invocation workspace directory as child process working directory (cwd)', async () => {
      mockSpawn.mockReturnValue(new MockChildProcess(['{"status":"SUCCESS","response":"cwd ok"}']) as any)

      const runner = new AntigravityCLIRunner()
      await runner.run({ ...invocation, workspacePath: '/custom/workspace/dir' })

      expect(mockSpawn).toHaveBeenCalledWith(
        'agy',
        expect.any(Array),
        expect.objectContaining({
          cwd: '/custom/workspace/dir',
        })
      )
    })

    it('Should capture conversation_id from turn 1 response and return AgentSession, and pass --conversation <id> on turn 2', async () => {
      // Turn 1
      const turn1Output = JSON.stringify({
        conversation_id: 'conv-session-turn-1',
        status: 'SUCCESS',
        response: 'Turn 1 completed',
      })
      mockSpawn.mockReturnValue(new MockChildProcess([turn1Output]) as any)

      const runner = new AntigravityCLIRunner()
      const resultTurn1 = await runner.run(invocation)
      expect(resultTurn1.session?.id).toBe('conv-session-turn-1')

      // Turn 2
      const turn2Output = JSON.stringify({
        conversation_id: 'conv-session-turn-1',
        status: 'SUCCESS',
        response: 'Turn 2 completed with context',
      })
      const mockProcessTurn2 = new MockChildProcess([turn2Output])
      mockSpawn.mockReturnValue(mockProcessTurn2 as any)

      const resultTurn2 = await runner.run({
        ...invocation,
        session: resultTurn1.session,
        prompt: 'Turn 2 prompt',
      })

      expect(mockSpawn).toHaveBeenCalledWith(
        'agy',
        expect.arrayContaining(['--conversation', 'conv-session-turn-1']),
        expect.anything()
      )
      expect(resultTurn2.raw).toBe('Turn 2 completed with context')
      expect(resultTurn2.session?.id).toBe('conv-session-turn-1')
    })

    it('Should map multiple skill paths via --add-dir and verify child process receives all directory arguments in order', async () => {
      mockSpawn.mockReturnValue(new MockChildProcess(['{"status":"SUCCESS","response":"skills mapped"}']) as any)

      const runner = new AntigravityCLIRunner()
      await runner.run({
        ...invocation,
        additionalDirs: ['/skills/alpha', '/skills/beta', '/skills/gamma'],
      })

      expect(mockSpawn).toHaveBeenCalledWith(
        'agy',
        expect.arrayContaining([
          '--add-dir', '/skills/alpha',
          '--add-dir', '/skills/beta',
          '--add-dir', '/skills/gamma',
        ]),
        expect.anything()
      )
    })
  })

  describe('2.3 External Integrations & Process Management', () => {
    it('Should execute taskkill /pid <pid> /f /t on Windows when child process hangs and timeout expires', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32' })

      try {
        const mockChild = new MockChildProcess([], [], 0, undefined, { hang: true })
        mockSpawn.mockReturnValue(mockChild as any)

        const runner = new AntigravityCLIRunner()
        const runPromise = runner.run({ ...invocation, timeoutMs: 50 })

        await expect(runPromise).rejects.toThrow(
          expect.objectContaining({
            code: AgentRunnerErrorCode.TIMEOUT,
            message: expect.stringContaining('timed out after 50ms'),
          })
        )

        expect(mockSpawn).toHaveBeenCalledWith('taskkill', ['/pid', '12345', '/f', '/t'])
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform })
      }
    })

    it('Should execute process.kill(-pid, SIGKILL) on POSIX when child process hangs and timeout expires', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'linux' })
      const killSpy = vi.spyOn(process, 'kill').mockImplementation((() => true) as any)

      try {
        const mockChild = new MockChildProcess([], [], 0, undefined, { hang: true })
        mockSpawn.mockReturnValue(mockChild as any)

        const runner = new AntigravityCLIRunner()
        const runPromise = runner.run({ ...invocation, timeoutMs: 50 })

        await expect(runPromise).rejects.toThrow(
          expect.objectContaining({
            code: AgentRunnerErrorCode.TIMEOUT,
            message: expect.stringContaining('timed out after 50ms'),
          })
        )

        expect(killSpy).toHaveBeenCalledWith(-12345, 'SIGKILL')
      } finally {
        killSpy.mockRestore()
        Object.defineProperty(process, 'platform', { value: originalPlatform })
      }
    })

    it('Should trigger process group termination immediately when AbortSignal is aborted before completion', async () => {
      const mockChild = new MockChildProcess([], [], 0, undefined, { hang: true })
      mockSpawn.mockReturnValue(mockChild as any)

      const runner = new AntigravityCLIRunner()
      const controller = new AbortController()

      const runPromise = runner.run(invocation, { signal: controller.signal })
      controller.abort()

      await expect(runPromise).rejects.toThrow('aborted')
    })

    it('Should reject immediately if AbortSignal is already aborted prior to invocation', async () => {
      const mockChild = new MockChildProcess([], [], 0, undefined, { hang: true })
      mockSpawn.mockReturnValue(mockChild as any)

      const runner = new AntigravityCLIRunner()
      const controller = new AbortController()
      controller.abort()

      await expect(runner.run(invocation, { signal: controller.signal })).rejects.toThrow('aborted')
    })

    it('Should classify exit code with rate-limit stderr text as AgentRunnerErrorCode.QUOTA_EXCEEDED', async () => {
      const mockChild = new MockChildProcess([], ['Resource has been exhausted (e.g. check quota)'], 1)
      mockSpawn.mockReturnValue(mockChild as any)

      const runner = new AntigravityCLIRunner()
      await expect(runner.run(invocation)).rejects.toThrow(
        expect.objectContaining({
          code: AgentRunnerErrorCode.QUOTA_EXCEEDED,
          message: expect.stringContaining('check quota'),
        })
      )
    })

    it('Should classify exit code 127 / ENOENT as AgentRunnerErrorCode.NETWORK_ERROR with binary missing hint', async () => {
      const enoentError: NodeJS.ErrnoException = new Error('spawn agy ENOENT')
      enoentError.code = 'ENOENT'

      mockSpawn.mockReturnValue(new MockChildProcess([], [], 127, enoentError) as any)

      const runner = new AntigravityCLIRunner()
      await expect(runner.run(invocation)).rejects.toThrow(
        expect.objectContaining({
          code: AgentRunnerErrorCode.NETWORK_ERROR,
          message: expect.stringContaining('CLI not found — is it installed?'),
        })
      )
    })

    it('Should classify generic non-zero exit codes without quota keywords as AgentRunnerErrorCode.UNKNOWN_ERROR', async () => {
      const mockChild = new MockChildProcess([], ['Internal uncaught exception at index.js'], 1)
      mockSpawn.mockReturnValue(mockChild as any)

      const runner = new AntigravityCLIRunner()
      await expect(runner.run(invocation)).rejects.toThrow(
        expect.objectContaining({
          code: AgentRunnerErrorCode.UNKNOWN_ERROR,
          message: expect.stringContaining('CLI exited with code 1'),
        })
      )
    })
  })
})

describe('AntigravityCLIRunner — Functional Tests', () => {
  let invocation: AgentInvocation
  let mockSpawn: ReturnType<typeof vi.mocked<typeof spawn>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSpawn = vi.mocked(spawn)

    invocation = {
      prompt: 'Execute functional task',
      skill: 'tdd-orchestrator',
      agent: 'developer-backend',
      mode: 'autonomous',
    }
  })

  describe('3.1 Happy Path Flows', () => {
    it('Should execute full headless turn with structured JSON extraction when valid prompt is submitted', async () => {
      const mockJsonOutput = JSON.stringify({
        conversation_id: 'turn-session-101',
        status: 'SUCCESS',
        response: 'Feature implemented successfully.',
        structured_output: {
          featureId: 'F001',
          status: 'SUCCESS',
          metrics: { totalTests: 15, passed: 15, failed: 0, coverage: 100 },
        },
        usage: {
          input_tokens: 3500,
          output_tokens: 800,
          cache_read_tokens: 1200,
          cost_usd: 0.015,
        },
      })

      mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

      const runner = new AntigravityCLIRunner()
      const output = await runner.run(invocation)

      expect(output.success).toBe(true)
      expect(output.raw).toBe('Feature implemented successfully.')
      expect(output.artefacts).toEqual({
        featureId: 'F001',
        status: 'SUCCESS',
        metrics: { totalTests: 15, passed: 15, failed: 0, coverage: 100 },
      })
      expect(output.usage).toMatchObject({
        inputTokens: 3500,
        outputTokens: 800,
        cacheReadTokens: 1200,
        costUsd: 0.015,
      })
      expect(output.session).toEqual({ id: 'turn-session-101' })
    })

    it('Should maintain multi-turn conversational session across Phase B TDD rework iterations', async () => {
      const initialSession: AgentSession = { id: 'conv-session-456' }
      const mockResponse = JSON.stringify({
        conversation_id: 'conv-session-456',
        status: 'SUCCESS',
        response: 'Rework iteration completed.',
      })

      mockSpawn.mockReturnValue(new MockChildProcess([mockResponse]) as any)

      const runner = new AntigravityCLIRunner()
      const output = await runner.run({ ...invocation, session: initialSession })

      expect(mockSpawn).toHaveBeenCalledWith(
        'agy',
        expect.arrayContaining(['--conversation', 'conv-session-456']),
        expect.anything()
      )
      expect(output.session?.id).toBe('conv-session-456')
    })
  })

  describe('3.2 Alternative and Error Flows', () => {
    it('Should classify upstream quota exhaustion and trigger orchestrator backoff', async () => {
      const quotaStderr = 'Resource has been exhausted (e.g. check quota)'
      mockSpawn.mockReturnValue(new MockChildProcess([], [quotaStderr], 1) as any)

      const runner = new AntigravityCLIRunner()
      await expect(runner.run(invocation)).rejects.toThrow(
        expect.objectContaining({
          code: AgentRunnerErrorCode.QUOTA_EXCEEDED,
          message: expect.stringContaining('Resource has been exhausted'),
        })
      )
    })

    it('Should classify JSON quota exhaustion error in parsed output as QUOTA_EXCEEDED', async () => {
      const mockJsonOutput = JSON.stringify({
        conversation_id: 'conv-quota-1',
        status: 'FAILED',
        error: 'Model quota exhausted: Resource has been exhausted',
      })

      mockSpawn.mockReturnValue(new MockChildProcess([mockJsonOutput]) as any)

      const runner = new AntigravityCLIRunner()
      await expect(runner.run(invocation)).rejects.toThrow(
        expect.objectContaining({
          code: AgentRunnerErrorCode.QUOTA_EXCEEDED,
          message: expect.stringContaining('Model quota exhausted'),
        })
      )
    })

    it('Should terminate hung process tree on phase timeout without crashing runner process', async () => {
      const mockChild = new MockChildProcess([], [], 0, undefined, { hang: true })
      mockSpawn.mockReturnValue(mockChild as any)

      const runner = new AntigravityCLIRunner()
      await expect(runner.run({ ...invocation, timeoutMs: 30 })).rejects.toThrow(
        expect.objectContaining({
          code: AgentRunnerErrorCode.TIMEOUT,
        })
      )
    })

    it('Should extract structured blocks from mixed diagnostic stdout stream', async () => {
      const mixedStdout = `
[DEBUG] Initializing MCP connections...
[WARN] Plugin 'a11y' taking longer than expected.
Here is the JSON payload:
\`\`\`json
{
  "extractedStatus": "OK",
  "data": [1, 2, 3]
}
\`\`\`
[DEBUG] Finished session.
      `

      mockSpawn.mockReturnValue(new MockChildProcess([mixedStdout]) as any)

      const runner = new AntigravityCLIRunner()
      const output = await runner.run(invocation)

      expect(output.success).toBe(true)
      expect(output.artefacts).toEqual({
        extractedStatus: 'OK',
        data: [1, 2, 3],
      })
    })
  })

  describe('3.3 Security Scenarios', () => {
    it('Should isolate child process environment from sensitive host secrets', async () => {
      const originalEnv = { ...process.env }
      process.env.OPENAI_API_KEY = 'sk-super-secret-key'
      process.env.ANTHROPIC_AUTH_TOKEN = 'auth-token-xyz'
      process.env.DATABASE_URL = 'postgres://admin:password@prod-db.com/db'
      process.env.GITHUB_TOKEN = 'ghp_secretToken'

      try {
        mockSpawn.mockReturnValue(new MockChildProcess(['{"status":"SUCCESS","response":"env clean"}']) as any)

        const runner = new AntigravityCLIRunner()
        await runner.run(invocation)

        expect(mockSpawn).toHaveBeenCalledWith(
          'agy',
          expect.any(Array),
          expect.objectContaining({
            env: expect.not.objectContaining({
              OPENAI_API_KEY: expect.anything(),
              ANTHROPIC_AUTH_TOKEN: expect.anything(),
              DATABASE_URL: expect.anything(),
              GITHUB_TOKEN: expect.anything(),
            }),
          })
        )
      } finally {
        process.env = originalEnv
      }
    })

    it('Should run with unattended permissions bypass while sanitizing child spawn environment', async () => {
      mockSpawn.mockReturnValue(new MockChildProcess(['{"status":"SUCCESS","response":"secure ok"}']) as any)

      const runner = new AntigravityCLIRunner()
      await runner.run(invocation)

      expect(mockSpawn).toHaveBeenCalledWith(
        'agy',
        expect.arrayContaining(['--dangerously-skip-permissions']),
        expect.objectContaining({
          env: expect.any(Object),
        })
      )
    })
  })
})

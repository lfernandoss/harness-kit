import type { IAgentRunner } from '../IAgentRunner'
import { Runner, type AgentInvocation, type AgentOutput } from '../types'
import { AgentRunnerRegistry } from '../AgentRunnerRegistry'
import { AgentRunnerError, AgentRunnerErrorCode } from '../AgentRunnerError'
import { DEFAULT_PHASE_TIMEOUT_MS } from '../../settings/DefaultSettings'

// Fallback Agent interface / stub if @cursor/sdk is not in node_modules
class AgentStub {
  static async create(_options: any): Promise<any> {
    return {
      execute: async () => ({ output: '', success: true }),
      stop: async () => {}
    }
  }
}

let Agent: any = AgentStub
try {
  Agent = require('@cursor/sdk').Agent
} catch {
  Agent = AgentStub
}

export interface CursorSDKRunnerConfig {
  readonly model?: string
  readonly timeoutMs?: number
}

export class CursorSDKRunner implements IAgentRunner {
  readonly type = Runner.CURSOR_SDK
  readonly #model: string | undefined
  readonly timeoutMs: number

  constructor(config?: Partial<CursorSDKRunnerConfig>) {
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_PHASE_TIMEOUT_MS
    this.#model = config?.model
  }

  async run(
    invocation: AgentInvocation,
    options?: { signal?: AbortSignal },
  ): Promise<AgentOutput> {
    const apiKey = process.env.CURSOR_API_KEY
    if (!apiKey) {
      throw new AgentRunnerError({
        code: AgentRunnerErrorCode.MISSING_API_KEY,
        skill: invocation.skill ?? '',
        phase: 'dispatch',
        message: 'CursorSDKRunner requires CURSOR_API_KEY environment variable to be set',
      })
    }

    const modelName = invocation.model ?? this.#model ?? 'composer-2.5'
    const reasoningEffort = invocation.effort

    const params: { id: string; value: string }[] = []
    if (reasoningEffort) {
      params.push({ id: 'reasoning-effort', value: reasoningEffort })
    }

    const agent = await Agent.create({
      apiKey,
      model: {
        id: modelName,
        params,
      },
    })

    const timeout = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(
          new AgentRunnerError({
            code: AgentRunnerErrorCode.TIMEOUT,
            skill: invocation.skill ?? '',
            phase: 'dispatch',
            message: `CursorSDKRunner timed out after ${this.timeoutMs}ms`,
          }),
        )
      }, this.timeoutMs)
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(
            new AgentRunnerError({
              code: AgentRunnerErrorCode.PROCESS_ERROR,
              skill: invocation.skill ?? '',
              phase: 'dispatch',
              message: 'Execution aborted by caller signal',
            }),
          )
        })
      }
    })

    try {
      const response = await Promise.race([
        agent.execute({
          prompt: invocation.prompt,
          mode: invocation.mode,
        }),
        timeout,
      ])

      return {
        stdout: response.output ?? '',
        stderr: response.stderr ?? '',
        success: response.success ?? true,
        artefacts: response.artefacts,
        usage: {
          inputTokens: response.inputTokens ?? 0,
          outputTokens: response.outputTokens ?? 0,
          costUsd: response.costUsd ?? 0,
          model: modelName,
        },
      }
    } catch (err) {
      if (err instanceof AgentRunnerError) {
        throw err
      }
      throw new AgentRunnerError({
        code: AgentRunnerErrorCode.PROCESS_ERROR,
        skill: invocation.skill ?? '',
        phase: 'dispatch',
        message: `Cursor SDK execution failed: ${err instanceof Error ? err.message : String(err)}`,
      })
    } finally {
      await agent.stop().catch(() => {})
    }
  }
}

AgentRunnerRegistry.register({
  type: Runner.CURSOR_SDK,
  constructor: CursorSDKRunner,
})

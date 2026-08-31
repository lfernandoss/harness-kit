# Tactical Design — harness-kit

**Domain:** antigravity_cli_validation | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `AntigravityCLIRunner` | Runner / Domain Adapter | Binary is `agy`; `writePromptToStdin = true`; registers in `AgentRunnerRegistry` | *see snippet below* |
| `AbstractCliRunner` | Runner / Template Base | Enforces process-tree termination, `filterSensitiveEnv`, timeout timer, and stdout hooks | *see snippet below* |
| `AgentRunnerRegistry` | Registry / Factory Service | Unique type keys; returns registered runner constructor | *see snippet below* |

```typescript
class AntigravityCLIRunner extends AbstractCliRunner:
  readonly type = Runner.ANTIGRAVITY_CLI
  protected get binaryName(): string { return 'agy' }
  protected override get writePromptToStdin(): boolean { return true }
```

```typescript
abstract class AbstractCliRunner implements IAgentRunner:
  run(invocation: AgentInvocation, options?: { signal?: AbortSignal }): Promise<AgentOutput>
  static filterSensitiveEnv(env: Record<string, string | undefined>): Record<string, string | undefined>
  // manages process tree lifecycle and signal registration
```

```typescript
class AgentRunnerRegistry:
  static register(registration: RunnerRegistration): void
  static get(type: string): RunnerRegistration | undefined
  // ensures idempotency and unique runner registration
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `AgentInvocation` | Domain Contract / DTO | Immutable; requires `agent` and `mode`; optional `prompt`, `session`, `additionalDirs` | *see snippet below* |
| `AgentOutput` | Domain Contract / DTO | Canonical result; contains `raw`, optional `artefacts`, `usage`, `session` | *see snippet below* |
| `TokenUsage` | Domain Value Object | Non-negative token counts; includes input/output/cache tokens and USD cost | *see snippet below* |
| `AgentSession` | Domain Value Object | Non-empty `id` string for conversation tracking across turns | *see snippet below* |
| `AgentRunnerError` | Domain Exception / VO | Typed error with `AgentRunnerErrorCode`, `skill`, `phase`, `message` | *see snippet below* |

```typescript
interface AgentInvocation:
  readonly agent: string; readonly mode: 'autonomous' | 'default'
  readonly prompt?: string; readonly session?: AgentSession
  readonly additionalDirs?: string[]; readonly timeoutMs?: number
```

```typescript
interface AgentOutput:
  readonly success?: boolean; readonly raw: string
  readonly artefacts?: Record<string, string>; readonly usage?: TokenUsage
  readonly session?: AgentSession; readonly stderr?: string
```

```typescript
interface TokenUsage:
  inputTokens: number; outputTokens: number
  cacheReadTokens: number; costUsd: number
  model?: string; effort?: string
```

```typescript
interface AgentSession:
  readonly id: string // non-empty conversation identifier
```

```typescript
class AgentRunnerError extends Error:
  readonly code: AgentRunnerErrorCode; readonly skill: string
  readonly phase: string; readonly cause?: Error
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `buildArgs` | Serializes CLI options into `agy` argument array | `AgentInvocation`, `DefaultSettings` | *see snippet below* |
| `parseOutput` | Extracts JSON payload, session id, and token usage from stdout | `extractJsonOrNull`, `TokenUsage` | *see snippet below* |
| `checkParsed` | Detects logical failures and error states in parsed output | `AgentRunnerError`, `AgentRunnerErrorCode` | *see snippet below* |
| `filterSensitiveEnv` | Strips secrets and credentials from child environment | `SENSITIVE_ENV_PATTERNS`, `process.env` | *see snippet below* |

```typescript
function buildArgs(invocation: AgentInvocation): string[]:
  // compiles --add-dir, --output-format json, --print-timeout,
  // --dangerously-skip-permissions, --agent, --conversation
  return args
```

```typescript
function parseOutput(stdout: string, stderr: string, invocation: AgentInvocation): Partial<AgentOutput>:
  // parses top-level JSON or falls back to extractJsonOrNull;
  // extracts conversation_id, structured_output, and usage metrics
  return { success, raw, artefacts, usage, session }
```

```typescript
function checkParsed(parsed: Partial<AgentOutput>, invocation: AgentInvocation): AgentRunnerError | null:
  // returns AgentRunnerError if parsed.success === false and response empty
  return parsed.success === false ? new AgentRunnerError(...) : null
```

```typescript
function filterSensitiveEnv(env: Record<string, string | undefined>): Record<string, string | undefined>:
  // filters out keys matching API_KEY, SECRET, TOKEN, PASSWORD, DATABASE_URL
  return sanitizedEnv
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `ProcessSpawned` | `run()` invokes `cross-spawn` | `{ binary: 'agy', args: string[], cwd: string }` | `ProcessTreeHandler`, Debug Logger |
| `DiagnosticLineReceived` | Subprocess emits stdout chunk before exit | `{ line: string, invocation: AgentInvocation }` | `onStdoutLine`, Progress Telemetry |
| `ProcessTreeTerminated` | Timeout expires or AbortSignal triggers | `{ pid: number, platform: string, signal: string }` | OS Process Subsystem, Active Kill Set |
| `SessionStateCaptured` | `parseOutput` extracts conversation ID | `{ sessionId: string }` | Multi-Turn Phase Tracker, Orchestrator |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `IAgentRunner` | `run(invocation, options?)` | `Promise<AgentOutput>` |
| `AgentRunnerRegistry` | `register(registration)`, `get(type)` | `void`, `RunnerRegistration \| undefined` |

```typescript
interface IAgentRunner:
  run(invocation: AgentInvocation, options?: { signal?: AbortSignal }): Promise<AgentOutput>
  // executes agent invocation and returns standardized AgentOutput
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Hermetic Unit Tests for Argument Construction and Stdin Delivery",
    "description": "Validates CLI argument serialization and stdin prompt delivery for AntigravityCLIRunner using simulated process streams.",
    "scope": [
      "sdk/src/agent-runner/__tests__/AntigravityCLIRunner.test.ts",
      "sdk/src/agent-runner/antigravity-cli/AntigravityCLIRunner.ts"
    ],
    "acceptance": [
      "Verifies --add-dir, --model, --effort, --output-format json, --print-timeout, --dangerously-skip-permissions, and --agent flags are generated correctly",
      "Verifies prompt is written to stdin and omitted from CLI argument array",
      "Verifies runner registers successfully in AgentRunnerRegistry under Runner.ANTIGRAVITY_CLI"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Resilient Output Extraction and Error Parsing Tests",
    "description": "Tests top-level JSON parsing, fallback block extraction, and partial error recovery semantics.",
    "scope": [
      "sdk/src/agent-runner/__tests__/AntigravityCLIRunner.test.ts",
      "sdk/src/agent-runner/antigravity-cli/AntigravityCLIRunner.ts"
    ],
    "acceptance": [
      "Verifies valid structured_output and raw response extraction from formatted JSON stdout",
      "Verifies status FAILED or empty ERROR throws AgentRunnerError with API_ERROR code",
      "Verifies status ERROR with valid partial response succeeds to support tool recovery"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Session Continuity and Token Metric Accounting Tests",
    "description": "Validates multi-turn conversation ID propagation and structured token usage normalization.",
    "scope": [
      "sdk/src/agent-runner/__tests__/AntigravityCLIRunner.test.ts",
      "sdk/src/agent-runner/types.ts"
    ],
    "acceptance": [
      "Verifies --conversation argument is passed when invocation contains an active session id",
      "Verifies session.id is extracted from conversation_id, conversationId, session_id, or sessionId fields",
      "Verifies input, output, cache read/write tokens, and USD cost are correctly mapped to TokenUsage"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement Rate-Limit and Quota Error Mapping Verification",
    "description": "Ensures rate limits and quota exhaustion signatures from agy translate to QUOTA_EXCEEDED domain errors.",
    "scope": [
      "sdk/src/agent-runner/__tests__/AntigravityCLIRunner.test.ts",
      "sdk/src/agent-runner/AgentRunnerError.ts"
    ],
    "acceptance": [
      "Verifies exit codes with rate-limit or quota signatures map to AgentRunnerErrorCode.QUOTA_EXCEEDED",
      "Verifies JSON error fields containing quota exhaustion strings trigger backoff-compatible error codes",
      "Verifies non-quota exit failures map to UNKNOWN_ERROR or API_ERROR"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Cross-Platform Process-Tree Lifecycle and Security Boundary Tests",
    "description": "Validates process-tree cleanup on abort/timeout across Win32/POSIX and verifies environment variable sanitization.",
    "scope": [
      "sdk/src/agent-runner/__tests__/AntigravityCLIRunner.test.ts",
      "sdk/src/agent-runner/AbstractCliRunner.ts"
    ],
    "acceptance": [
      "Verifies taskkill on Windows and SIGKILL process-group kill on POSIX when runner times out or receives AbortSignal",
      "Verifies filterSensitiveEnv strips API keys, tokens, and database credentials before spawning child process",
      "Verifies zero sensitive environment variables or secrets are passed in child spawn environment"
    ],
    "depends_on": "04"
  },
  {
    "id": "06",
    "title": "Implement Opt-In Gated Live Binary Integration Smoke Suite",
    "description": "Provides an opt-in integration test suite executing against real agy binaries when explicitly enabled.",
    "scope": [
      "sdk/src/agent-runner/__tests__/AntigravityCLIRunner.integration.test.ts",
      "sdk/package.json"
    ],
    "acceptance": [
      "Suite is skipped by default in CI and executes only when AGY_INTEGRATION_TEST is truthy",
      "Verifies end-to-end tool execution and workspace skill discovery using real --add-dir arguments",
      "Verifies live response parsing and session continuity against a real agy CLI installation"
    ],
    "depends_on": "05"
  }
]
```

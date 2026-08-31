# Test Scenarios — harness-kit

**Domain:** antigravity_cli_validation
**Project:** harness-kit
**Framework:** Vitest
**Date:** 2026-08-21

## Section 1 — Unit Tests

### 1.1 Runners and Registry

**Creation & Registration:**
- [ ] Should instantiate `AntigravityCLIRunner` with default binary name `agy` and `writePromptToStdin = true`
- [ ] Should register `AntigravityCLIRunner` in `AgentRunnerRegistry` under `Runner.ANTIGRAVITY_CLI`
- [ ] Should reject duplicate registration in `AgentRunnerRegistry` with descriptive error

**CLI Argument Construction:**
- [ ] Should build arguments containing `--output-format json`, `--print-timeout`, and `--dangerously-skip-permissions`
- [ ] Should append `--agent <name>` when `invocation.agent` is defined
- [ ] Should append `--model <model>` and `--effort <effort>` when configured in runner or invocation
- [ ] Should append multiple `--add-dir <path>` flags when `invocation.additionalDirs` contains workspace paths
- [ ] Should append `--conversation <sessionId>` when `invocation.session.id` is provided
- [ ] Should omit prompt text from argument array and ensure no `-p` flag is generated

**Output & Error Parsing:**
- [ ] Should parse structured JSON response from `stdout` and extract `response`, `structured_output`, and `usage`
- [ ] Should fallback to plain text response when `stdout` contains non-JSON content
- [ ] Should extract structured artefacts using `extractJsonOrNull` when `structured_output` is absent in JSON
- [ ] Should throw `AgentRunnerError` with `API_ERROR` when `status` is `FAILED`
- [ ] Should throw `AgentRunnerError` with `API_ERROR` when `status` is `ERROR` and `response` is empty
- [ ] Should succeed with `success: true` when `status` is `ERROR` but `response` contains valid non-empty text (tool warning recovery)
- [ ] Should extract session ID from `conversation_id`, `conversationId`, `session_id`, or `sessionId` fields

### 1.2 Value Objects and Types

**AgentInvocation Validation:**
- [ ] Should accept valid `AgentInvocation` with required `agent` and `mode` fields
- [ ] Should support optional `skill`, `prompt`, `payload`, `session`, `additionalDirs`, and `timeoutMs` fields
- [ ] Should preserve invocation immutability during argument serialization

**TokenUsage Accounting:**
- [ ] Should map `input_tokens`, `output_tokens`, `cache_read_tokens`, and `cost_usd` to `TokenUsage`
- [ ] Should default missing token counts to zero in normalized `TokenUsage`
- [ ] Should include resolved `model` and `effort` in `TokenUsage` metadata

**AgentSession Equality & Continuity:**
- [ ] Should consider two `AgentSession` instances equal when they contain identical `id` values
- [ ] Should propagate session identifier without mutation through runner response envelope

### 1.3 Domain Services and Utilities

**Environment Sanitization (`filterSensitiveEnv`):**
- [ ] Should strip environment variables ending in `_KEY`, `_SECRET`, `_TOKEN`, `_PASS`, `_PASSWORD`
- [ ] Should strip `DATABASE_URL`, `REDIS_URL`, `MONGO`, `AUTH_`, `PROJECT_MAPPINGS`, and `ALLOWED_WORKSPACES`
- [ ] Should retain non-sensitive variables such as `PATH`, `NODE_ENV`, `HOME`, and `TMPDIR`

**Streaming Telemetry (`onStdoutLine`):**
- [ ] Should invoke `onStdoutLine` for each newline-delimited line emitted during process execution
- [ ] Should not mutate or corrupt the buffered `stdout` used for final payload extraction

### 1.4 Domain Events and Lifecycle Hooks

**Process Lifecycle Events:**
- [ ] Should register process kill cleanup handler in `activeKillFns` on process spawn
- [ ] Should unregister process kill cleanup handler and clear timeout timer on process close
- [ ] Should register OS signal handlers (`SIGINT`, `SIGTERM`, `SIGHUP`) only once across all runners

---

## Section 2 — Integration Tests

### 2.1 Runner Registry Integration

- [ ] Should retrieve `AntigravityCLIRunner` constructor from `AgentRunnerRegistry.get(Runner.ANTIGRAVITY_CLI)`
- [ ] Should instantiate and execute runner retrieved from `AgentRunnerRegistry`

### 2.2 Orchestration Flows and Multi-Turn Continuity

**Single-Turn Dispatch Flow:**
- [ ] Should stream prompt to child process `stdin`, capture mock `stdout`, and resolve complete `AgentOutput`
- [ ] Should pass invocation workspace directory as child process working directory (`cwd`)

**Multi-Turn Session Continuity:**
- [ ] Should capture `conversation_id` from turn 1 response and return `AgentSession`
- [ ] Should pass `--conversation <id>` on turn 2 invocation and maintain conversation context

**External Skill Directory Resolution:**
- [ ] Should map multiple skill paths via `--add-dir` and verify child process receives all directory arguments in order

### 2.3 External Integrations & Process Management

**Process-Tree Termination on Timeout:**
- [ ] Should execute `taskkill /pid <pid> /f /t` on Windows when child process hangs and timeout expires
- [ ] Should execute `process.kill(-pid, 'SIGKILL')` on POSIX when child process hangs and timeout expires
- [ ] Should reject with `AgentRunnerError` of type `TIMEOUT` and leave zero orphaned processes

**Process-Tree Termination on AbortSignal:**
- [ ] Should trigger process group termination immediately when `AbortSignal` is aborted before completion
- [ ] Should reject immediately if `AbortSignal` is already aborted prior to invocation

**Error Classification & Quota Exhaustion:**
- [ ] Should classify exit code with rate-limit stderr text as `AgentRunnerErrorCode.QUOTA_EXCEEDED`
- [ ] Should classify exit code 127 / `ENOENT` as `AgentRunnerErrorCode.NETWORK_ERROR` with binary missing hint
- [ ] Should classify generic non-zero exit codes without quota keywords as `AgentRunnerErrorCode.UNKNOWN_ERROR`

**Live Binary Execution Gate (`AGY_INTEGRATION_TEST`):**
- [ ] Should skip live binary test suite when `AGY_INTEGRATION_TEST` environment variable is not set
- [ ] Should execute live `agy --version` and basic headless prompt when `AGY_INTEGRATION_TEST=true`

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

- [ ] **Should execute full headless turn with structured JSON extraction when valid prompt is submitted**
  - Given: An `AgentInvocation` with `agent = 'developer-backend'`, `mode = 'autonomous'`, and prompt payload
  - When: `AntigravityCLIRunner.run()` is called against a simulated child process returning valid JSON
  - Then: Resolves `AgentOutput` with `success = true`, extracted `artefacts`, normalized `TokenUsage`, and captured `session`

- [ ] **Should maintain multi-turn conversational session across Phase B TDD rework iterations**
  - Given: An initial turn that resolved with `session.id = 'conv-session-456'`
  - When: A second `AgentInvocation` is dispatched with `session = { id: 'conv-session-456' }`
  - Then: Runner appends `--conversation conv-session-456` to CLI arguments and retains state continuity

### 3.2 Alternative and Error Flows

- [ ] **Should classify upstream quota exhaustion and trigger orchestrator backoff**
  - Given: `agy` process exits with non-zero code and stderr contains `"Resource has been exhausted (e.g. check quota)"`
  - When: Runner processes process exit event
  - Then: Rejects with `AgentRunnerError` where `code = AgentRunnerErrorCode.QUOTA_EXCEEDED` and detailed message snippet

- [ ] **Should terminate hung process tree on phase timeout without crashing runner process**
  - Given: A mock child process that hangs indefinitely without emitting data or closing
  - When: `timeoutMs = 50ms` expires
  - Then: Runner invokes OS kill tree command, unregisters active handlers, and rejects with `AgentRunnerErrorCode.TIMEOUT`

- [ ] **Should extract structured blocks from mixed diagnostic stdout stream**
  - Given: `stdout` contains initialization log lines, MCP warnings, and an embedded markdown JSON block
  - When: Runner parses output with `extractJsonOrNull` fallback
  - Then: Resolves `AgentOutput` with `success = true` and correctly parsed `artefacts` dictionary

### 3.3 Security Scenarios

- [ ] **Should isolate child process environment from sensitive host secrets**
  - Given: Host `process.env` contains `OPENAI_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `DATABASE_URL`, and `GITHUB_TOKEN`
  - When: `AntigravityCLIRunner.run()` spawns the child process
  - Then: Child process `env` contains zero sensitive keys matching `SENSITIVE_ENV_PATTERNS`

- [ ] **Should run with unattended permissions bypass while sanitizing disk telemetry**
  - Given: Runner appends `--dangerously-skip-permissions` for unattended CLI execution
  - When: Telemetry logs (`tokens.jsonl`) and debug streams are written
  - Then: No raw API secrets, sensitive environment values, or credential headers are written to disk

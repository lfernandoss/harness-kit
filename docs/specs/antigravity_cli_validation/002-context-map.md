# Strategic Design — Context Map: Antigravity CLI Validation

**Domain:** antigravity_cli_validation | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **Antigravity Runner Context** | Compiles `agy` arguments, streams stdin prompts, parses output, and extracts token usage. | Excludes phase orchestration and task scheduling. | Harness Core | `AntigravityCLIRunner`, `AgentInvocation`, `AgentOutput`, `TokenUsage` |
| **Process Tree Lifecycle Context** | Manages cross-platform process spawning, timeout timers, and recursive group termination. | Excludes payload contents and LLM response semantics. | Platform / Infra | `ProcessTreeHandler`, `ProcessSignalManager` |
| **Session Continuity Context** | Tracks conversation identity and preserves historical state across multi-turn phase loops. | Excludes prompt generation and LLM token processing. | Harness Core | `AgentSession`, `ConversationTracker` |
| **Security Boundary Context** | Enforces environment sanitization and redaction of credentials before process execution. | Excludes token acquisition and auth negotiation. | Security / Infra | `EnvironmentSanitizer`, `SensitivePatterns` |
| **Error Translation Context** | Classifies exit codes, rate limits, and API fault signatures into domain error models. | Excludes retry scheduling and backoff logic. | Harness Core | `AgentRunnerError`, `AgentRunnerErrorCode` |

## Section 2 — Context Map

```
[Orchestrator Core] → [Antigravity Runner Context]
Pattern       : Customer-Supplier
Direction     : Downstream (Runner) conforms to Upstream (Orchestrator)
Justification : Orchestrator defines AgentInvocation contract; runner fulfills execution.

[Antigravity Runner Context] → [External agy CLI Binary]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream (Runner ACL) wraps external CLI
Justification : Protects domain types from CLI stdout variations and schema shifts.

[Antigravity Runner Context] → [Process Tree Lifecycle Context]
Pattern       : Shared Kernel (via AbstractCliRunner)
Direction     : Bidirectional
Justification : Inherits cross-platform process cleanup, signal traps, and timeout timers.

[Antigravity Runner Context] → [Security Boundary Context]
Pattern       : Shared Kernel
Direction     : Bidirectional
Justification : Shares filterSensitiveEnv rules across all CLI runner implementations.

[Antigravity Runner Context] → [Error Translation Context]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream
Justification : Maps external exit codes and JSON error signatures to domain error codes.
```

## Section 3 — Core Domain Highlight

```
Context   : Antigravity Runner Context
Reason    : Enables headless autonomous orchestration over Google Antigravity 2.0 with token accounting, tool resolution, and session preservation.
Investment: Full dual-tier test harness with hermetic branch coverage, stream simulation, and live gated integration smoke suites.
```

## Section 4 — Architectural Decisions

### ADR-01: Dual-Tier Testing Strategy
- **Decision:** Execute hermetic unit tests simulating child process streams by default; gate live binary execution behind `AGY_INTEGRATION_TEST=true`.
- **Context:** CI runners lack installed `agy` binaries, yet complete branch coverage and real-world smoke testing are required.
- **Consequences:** Eliminates external network flakiness in CI pipelines while providing an opt-in path for live binary validation.

### ADR-02: Stdin Prompt Streaming & Resilient Output Isolation
- **Decision:** Stream prompt payloads over child `stdin` (`writePromptToStdin = true`) and parse `stdout` with top-level JSON isolation falling back to `extractJsonOrNull`.
- **Context:** Prompts frequently exceed OS `ARG_MAX` length; `agy` emits diagnostic telemetry alongside structured JSON.
- **Consequences:** Prevents `ENAMETOOLONG` spawn failures and avoids syntax errors caused by interleaved log lines.

### ADR-03: Cross-Platform Process-Tree Termination
- **Decision:** Terminate full process groups via `taskkill /f /t` on Windows and `process.kill(-pid, SIGKILL)` on POSIX upon timeout or abortion.
- **Context:** `agy` may spawn child subagents or sidecars that become orphaned if only the parent PID is terminated.
- **Consequences:** Ensures zero leaked background processes across all supported operating systems.

### ADR-04: Domain Error Mapping for Quota & Rate Limits
- **Decision:** Classify rate limits, quota exhaustion, and model overload signatures into `AgentRunnerErrorCode.QUOTA_EXCEEDED`.
- **Context:** Distinguishes temporary capacity throttling from fatal API bugs to allow orchestrator backoff and retry.
- **Consequences:** Enables autonomous retry loops without crashing the overall development session.

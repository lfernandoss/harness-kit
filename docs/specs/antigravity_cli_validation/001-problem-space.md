# Strategic Design — Problem Space: Antigravity CLI Validation

**Domain:** antigravity_cli_validation | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event (past tense) | Command (trigger) | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `RunnerDispatched` | `DispatchInvocation` | `AntigravityCLIRunner` | Orchestrator | Invocation Summary |
| 2 | `EnvironmentSanitized` | `SanitizeEnvironment` | `EnvironmentSanitizer` | OS Subsystem | Clean Process Env |
| 3 | `ProcessSpawned` | `SpawnAgyProcess` | `ProcessTreeHandler` | `agy` CLI Binary | Process Run Status |
| 4 | `TelemetryStreamed` | `CaptureStdoutLine` | `OutputExtractor` | Console / Logs | Diagnostic Stream |
| 5 | `ProcessTreeTerminated` | `AbortOrTimeout` | `ProcessTreeHandler` | OS (`taskkill`/`SIGKILL`) | Process Group State |
| 6 | `ResponseParsed` | `ParseAgyOutput` | `OutputExtractor` | JSON Parser | Result & Artefacts |
| 7 | `SessionPreserved` | `TrackSessionState` | `SessionManager` | Conversation Store | Multi-Turn State |
| 8 | `QuotaExhaustionClassified`| `ClassifyAgyError` | `ErrorClassifier` | Gemini API | Backoff / Retry Plan |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Antigravity CLI Protocol & Parsing** | Core | Core differentiator: structured JSON extraction, stdin streaming, and token usage mapping for `agy`. |
| **Process Tree Lifecycle & Cancellation** | Supporting | Cross-platform termination (`taskkill` vs `SIGKILL`) preventing orphaned subagents. |
| **Session Continuity Management** | Supporting | Multi-turn conversation persistence (`--conversation <sessionId>`) across TDD and review phases. |
| **Environment Sanitization & Security** | Generic | Commodity filtering (`filterSensitiveEnv`) stripping credentials before process spawning. |
| **Error & Quota Translation** | Supporting | Standardized translation of rate limits to `AgentRunnerErrorCode.QUOTA_EXCEEDED`. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `AntigravityCLIRunner` | Runner executing Google Antigravity (`agy`) in headless unattended mode. | Registered in `AgentRunnerRegistry`. |
| `AgentInvocation` | Domain request envelope with prompt, agent persona, model, effort, session. | Immutable dispatch contract. |
| `AgentOutput` | Standardized result containing raw response, artefacts, tokens, session. | Consumed by orchestrator. |
| `StdinPromptDelivery` | Streams prompt over child `stdin` to avoid OS `ARG_MAX` length limits. | `writePromptToStdin = true`. |
| `ResilientJsonExtraction` | Parses top-level JSON with fallback to `extractJsonOrNull`. | Ignores interleaved diagnostics. |
| `ProcessTreeTermination` | Recursive termination of `agy` and child sidecars across Win32/POSIX. | `taskkill` on Windows, `SIGKILL` on POSIX. |
| `SessionContinuity` | Preserves conversation context across multi-turn phase loops. | Transmitted via `--conversation`. |
| `QuotaExceededClassification` | Maps rate-limit signatures to `QUOTA_EXCEEDED` for retry/backoff. | Avoids fatal phase failures. |
| `HermeticSpawnMock` | Isolated test harness simulating process events without live binary. | Fast CI testing standard. |
| `GatedIntegrationSuite` | Live binary integration test suite gated by `AGY_INTEGRATION_TEST`. | Real CLI smoke verification. |
| `ToolDirectoryMapping` | Mounts external skills/tools into `agy` execution via `--add-dir`. | Required for tool discovery. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `AntigravityCLIRunner` ensure an `ERROR` status containing valid partial response text succeeds as tool recovery while an empty error throws `AgentRunnerError`?
- What guarantees prevent `session.id` from being dropped across multi-turn TDD loops?

**Scalability and Performance**
- How does output extraction handle high-throughput telemetry without choking the JSON parser or causing event loop lag on large AST diffs?

**Security and Sensitive Data**
- Under `--dangerously-skip-permissions`, what mechanisms ensure `filterSensitiveEnv` prevents secret leakage into subprocess environments or `tokens.jsonl`?

**Concurrency and Failures**
- How does `activeKillFns` avoid race conditions during simultaneous multi-agent process terminations on `SIGINT`?
- How are upstream Gemini 429 quota exhaustion signals distinguished from unrecoverable network drops?

**Responsibility Boundaries Between Layers**
- Is output extraction strictly decoupled from orchestrator workflows so CLI syntax revisions do not leak past the runner interface?

---

**Architecture Tip:** Separate hermetic stream simulation from live binary smoke tests to achieve 100% CI branch coverage without external network dependencies.

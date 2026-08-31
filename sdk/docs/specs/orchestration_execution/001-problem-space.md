# Strategic Design — Problem Space: Live Orchestration Execution Dashboard

**Domain:** orchestration_execution | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event (past tense) | Command (trigger) | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `ExecutionParametersConfigured` | `ConfigureExecutionParameters` | `OrchestrationSession` | None | `ExecutionConfigViewModel` |
| 2 | `OrchestrationJobStarted` | `StartOrchestrationJob` | `OrchestrationSession` | OS Process / Subprocess Runner | `ActiveJobStatusView` |
| 3 | `WorkspaceLockAcquired` | `AcquireWorkspaceLock` | `WorkspaceLock` | File System Lockfile | `LockStatusViewModel` |
| 4 | `PhaseTransitionDispatched` | `TransitionOrchestrationPhase` | `PhaseStateMachine` | FileStateManager / SDK Core | `LivePipelineStageView` |
| 5 | `TelemetryDeltaStreamed` | `BroadcastTelemetryDelta` | `ExecutionTelemetryStreamer` | SSE / WebSocket Client Stream | `LiveMetricsAndLogFeed` |
| 6 | `MidRunSteeringSubmitted` | `SubmitMidRunSteering` | `SteeringController` | SteeringAnalyzer / Agent Runner | `SteeringActionFeed` |
| 7 | `PhaseRollbackApplied` | `ApplyPhaseRollback` | `PhaseStateMachine` | FileStateManager | `LivePipelineStageView` |
| 8 | `OrchestrationJobAborted` | `AbortOrchestrationJob` | `OrchestrationSession` | OS Process (`taskkill`/`SIGKILL`) | `JobTerminationSummary` |
| 9 | `OrchestrationJobCompleted` | `CompleteOrchestrationJob` | `OrchestrationSession` | Git Worktree / JobStore | `ExecutionReportSummary` |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Live Pipeline Streaming & State Machine** | Core | Primary differentiator: real-time phase progression, multi-client event broadcasting, ANSI log streaming, and seamless UI reconnection. |
| **Mid-Run Steering & Interactive Controls** | Core | Key interactive differentiator: non-blocking rule injection, dynamic phase rollback, and score overrides during active agent execution. |
| **Runner & Execution Mode Configuration** | Supporting | Maps user inputs (runners, models, modes, skip flags) into typed SDK configuration DTOs. |
| **Workspace Lock & Background Job Lifecycle** | Generic | Manages singleton execution per workspace, HTTP 409 rejection, and OS process tree lifecycle. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `OrchestrationSession` | Resident background execution of the SDK pipeline bound to a workspace and tracked by a unique `jobId`. | Decoupled from browser connection lifecycle. |
| `RunMode` | Preset execution profile (`quick`, `fast`, `thinking`, `deep_thinking`) determining complexity and phase skips. | Direct parity with CLI `--mode`. |
| `RunnerSelector` | Interactive control configuring agent runner backend (`claude-cli`, `antigravity-cli`, `cursor-cli`, etc.), model, and effort. | Binds to SDK `AgentRunnerFactory`. |
| `PhaseStateMachine` | State machine governing pipeline transitions across `BOOTSTRAP`, `REFINEMENT`, `PLANNING`, `DEVELOPMENT`, `REVIEW`, `MEMORY`, `DEPLOY`, and `HALTED`. | Persisted on disk via `DEVELOPMENT-STATE.md`. |
| `EventStreamBroadcaster` | Server-Sent Events (SSE) broadcaster streaming real-time phase deltas, token telemetry, and ANSI logs to all connected tabs. | Supports replay buffer for reconnection. |
| `LiveLogStream` | Real-time ANSI-colorized output stream displaying agent prompts, stdout/stderr, and pipeline status. | Formatted using Itaú theme-aware ANSI converter. |
| `MidRunSteering` | Dynamic runtime intervention allowing developers to add rules, trigger phase rollbacks, or override QA/TL scores mid-flight. | Handled via `SteeringAnalyzer`. |
| `SteeringAction` | Validated mutation payload (`add_rule`, `rollback`, `override_score`) applied without aborting the background job. | Immutable typed action object. |
| `WorkspaceLockConflict` | HTTP 409 condition raised when an execution is triggered on a workspace that already has an active lock. | Prevents concurrent race conditions. |
| `SessionReconnection` | Automatic reconnection of browser client to a running background job, syncing current phase and missed telemetry. | Zero job interruption on tab close/reload. |
| `ExplicitAbort` | User-initiated termination that stops the agent subprocess tree (`taskkill /t` or `SIGKILL`) and releases locks. | Disconnection does not trigger abort. |
| `TokenLedgerDelta` | Granular token consumption and cost metric emitted per agent turn and phase. | Fed directly to dashboard telemetry charts. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `OrchestrationSession` enforce that only one execution can hold the workspace lock, ensuring concurrent requests receive HTTP 409 without corrupting `DEVELOPMENT-STATE.md`?
- How is the state machine kept consistent if a mid-run `rollback` is requested while an agent subprocess is actively streaming stdout?

**Scalability and Performance**
- How does the `EventStreamBroadcaster` manage high-frequency ANSI log chunks without overflowing memory or saturating browser DOM render cycles?
- How is the event-replay ring buffer sized so reconnecting clients receive recent context without unbounded heap growth?

**Security and Sensitive Data**
- How does the live terminal stream sanitize sensitive environment variables (e.g., tokens, API keys) before broadcasting log frames to connected browser clients?
- How are mid-run steering inputs validated against length limits and prompt injection before being fed into `SteeringAnalyzer`?

**Concurrency and Failures**
- How does the server guarantee that closing or refreshing a browser tab never triggers `AbortSignal` or leaves zombie background processes?
- How does the system cleanly terminate process trees across Windows (`taskkill /t /f`) and Unix (`SIGKILL`) when an explicit abort is issued?

**Responsibility Boundaries Between Layers**
- How does the frontend dashboard remain purely presentational, consuming backend DTOs without re-implementing orchestration transition logic?

---

**Architecture Tip:** Treat the local Node.js server as the single source of truth for execution state, broadcasting immutable SSE event deltas to presentation-only React components.

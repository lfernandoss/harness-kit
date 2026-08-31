# Strategic Design — Context Map: Live Orchestration Execution Dashboard

**Domain:** orchestration_execution | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **Live Orchestration Dashboard Context** | Manages execution controls, runner selection UI, live stage timeline rendering, ANSI terminal log streaming, and telemetry metrics presentation. | Excludes subprocess execution, file state persistence, and token cost calculation logic. | Frontend UX / Web Core | `DashboardViewModel`, `RunnerConfigForm`, `StageTimeline`, `LiveLogViewer` |
| **Execution & Stream Adapter Context** | Hosts HTTP endpoints for job lifecycle (`/run`, `/resume`, `/abort`, `/steering`) and broadcasts real-time SSE event deltas (`job_state`, `log_chunk`, `telemetry`). | Excludes client rendering, UI theme management, and low-level agent subprocess spawning. | Backend Host / Inbound Adapters | `OrchestrationHttpController`, `EventStreamBroadcaster`, `JobEventBuffer` |
| **Mid-Run Steering Context** | Receives dynamic developer interventions (`add_rule`, `rollback`, `override_score`), validates payloads, and applies them to the active state machine. | Excludes terminal stream rendering and initial workspace initialization. | Orchestrator Core / Steering | `SteeringController`, `SteeringAction`, `SteeringAnalyzerAdapter` |
| **Workspace Lock & Worker Context** | Enforces per-workspace singleton execution, queues pending jobs, and coordinates with `WorkspaceLockManager` to reject concurrent runs with HTTP 409. | Excludes UI routing and log formatting. | SDK Infrastructure / Outbound | `WorkspaceLockManager`, `InMemoryJobStore`, `AsyncWorkerPool` |

## Section 2 — Context Map

```
[Live Orchestration Dashboard Context] → [Execution & Stream Adapter Context]
Pattern       : Customer-Supplier / Published Language
Direction     : Downstream (Dashboard UI) consumes Upstream (HTTP & SSE APIs)
Justification : Dashboard sends execution commands via REST/RPC and receives real-time progress events over Server-Sent Events (SSE).

[Execution & Stream Adapter Context] → [Workspace Lock & Worker Context]
Pattern       : Conformist / Direct Delegation
Direction     : Downstream (Stream Adapter) delegates execution to Upstream (Lock & Worker Pool)
Justification : Adapter directly delegates job scheduling and lock verification to SDK core services.

[Execution & Stream Adapter Context] → [Mid-Run Steering Context]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream (Steering Adapter) translates HTTP steering requests into domain SteeringActions
Justification : Protects core orchestrator from malformed user prompts and unvalidated score values.

[Live Orchestration Dashboard Context] → [Application Shell Context (web_shell_theme)]
Pattern       : Open Host Service (Layout & Theme System)
Direction     : Downstream (Dashboard) mounts inside Upstream (ApplicationShell)
Justification : Dashboard mounts into the shell's <Outlet /> slot and utilizes Itaú design tokens for UI and ANSI log styling.
```

## Section 3 — Core Domain Highlight

```
Context   : Live Orchestration Dashboard Context + Mid-Run Steering Context
Reason    : Delivers the core real-time interactive pair-programming experience mirroring the CLI on web with runner configuration, live phase streaming, and mid-flight steering without execution restarts.
Investment: High-efficiency SSE broadcasting, theme-calibrated ANSI log stream parsing, multi-client event-replay ring buffers, and zero-restart mid-run steering injection.
```

## Section 4 — Architectural Decisions

### ADR-01: Server-Sent Events (SSE) with In-Memory Ring Buffer
- **Decision:** Use Server-Sent Events (SSE) with an in-memory ring buffer (last 500 events) for real-time progress and log streaming instead of WebSockets.
- **Context:** Orchestration telemetry is predominantly unidirectional (server to browser), and HTTP REST/RPC endpoints handle user commands (run, abort, steer) effectively.
- **Consequences:** Native HTTP reconnects (`EventSource`), simpler proxy and firewall compatibility, and minimal overhead; requires REST endpoints for bidirectional steering.

### ADR-02: Decoupled Resident Server Background Jobs
- **Decision:** Run orchestration jobs as long-lived server background tasks managed by `InMemoryJobStore`, independent of browser tab lifecycles.
- **Context:** Developers frequently refresh or close browser tabs during multi-minute agent cycles.
- **Consequences:** Browser disconnections do not interrupt running pipelines; cancellation requires an explicit user abort action or server termination (`SIGINT`/`SIGTERM`).

### ADR-03: Workspace Lock Singleton with HTTP 409 Conflict Handling
- **Decision:** Bind job execution to `WorkspaceLockManager`, rejecting any new execution on an active workspace with HTTP 409 (Conflict) and broadcasting active state to all connected tabs.
- **Context:** Multiple open browser tabs or concurrent requests could corrupt `DEVELOPMENT-STATE.md` or git worktrees.
- **Consequences:** Strictly guarantees single-writer integrity; requires clear UI error messaging and automatic transition to the active session view.

### ADR-04: Non-Blocking Mid-Run Steering via In-Memory Action Queue
- **Decision:** Process mid-run steering commands asynchronously by appending validated `SteeringAction` items to the active `HarnessOrchestrator` instance without restarting the pipeline.
- **Context:** Developers need to adjust rules or rollback phases during long executions without losing prior completed phases.
- **Consequences:** Immediate steering effect on phase transitions; requires strict payload validation before passing prompts to `SteeringAnalyzer`.

# Strategic Design — Context Map: Session Cycle Management

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| Session Cycle Core Context | Governs cycle state machine, session identity uniqueness, phase snapshots, and persistence lifecycle. | UI rendering, external agent CLI parsing, and git worktree creation. | Backend Platform Team | `Session`, `AutonomousCycle`, `PhaseSnapshot`, `SessionId`, `CycleId` |
| Process Supervisor Context | Manages OS process trees, child PID registration, and graceful or forced termination. | Cycle state transition rules, file serialization, and token billing. | Infrastructure / Runtime Team | `JobExecutionController`, `ProcessTreeManager`, `ProcessHandle` |
| Orchestration Execution Context | Coordinates phase-to-phase transitions (A through E), agent dispatches, and gate validations. | Raw file-system session serialization and process signal trapping. | Orchestration Engine Team | `OrchestratorJob`, `PhaseTransitionEngine`, `ValidationVerdict` |
| Web Dashboard Presentation Context | Renders interactive swimlanes, streams SSE lifecycle events, and captures user steering inputs. | Server-side disk file locks, state validation, and process spawning. | Frontend Team | `SwimlaneTimeline`, `CycleCard`, `SessionSelector` |

## Section 2 — Context Map

```
[Session Cycle Core Context] → [Process Supervisor Context]
Pattern   : Customer-Supplier
Direction : Downstream (Core) requests execution control from Upstream (Process Supervisor)
Justification: Core drives execution lifecycle; Supervisor provides OS-level process management.

[Orchestration Execution Context] → [Session Cycle Core Context]
Pattern   : Open Host Service / Published Language
Direction : Downstream (Orchestration) consumes stable Session & Cycle lifecycle contracts
Justification: Orchestration engine updates cycle phases and queries session history via clean interfaces.

[Web Dashboard Presentation Context] → [Session Cycle Core Context]
Pattern   : Anti-Corruption Layer (ACL)
Direction : Downstream (Web UI) translates HTTP/SSE DTOs to view models
Justification: Protects frontend swimlanes from internal session aggregate structure and file paths.
```

## Section 3 — Core Domain Highlight

```
Context : Session Cycle Core Context
Reason  : Critical differentiator providing deterministic multi-cycle execution, crash recovery, and state isolation for autonomous AI workflows.
Investment: Full DDD implementation with strict aggregate invariants, immutable value objects, domain events, and atomic disk repository ports.
```

## Section 4 — Architectural Decisions

```
Decision    : Distinct Unique Session ID per Autonomous Cycle
Context     : Sharing a single session ID across cycles caused workspace race conditions and token pollution.
Consequences: Guaranteed isolation and clean auditability; requires session catalog indexing for grouping related runs.

Decision    : Atomic File-Based Repository at `.harness/sessions/`
Context     : Server crashes could corrupt cycle manifests if writes occurred without transactional atomicity.
Consequences: Resilient crash recovery without database overhead; requires atomic rename writes (`.tmp` to `.json`).

Decision    : Decoupled Lifecycle State and Raw ANSI Streaming
Context     : High-volume ANSI terminal output overloaded React DOM when multiplexed with timeline updates.
Consequences: Fluid 60fps timeline rendering; detailed logs fetched only on-demand per active cycle card.

Decision    : Process Tree Supervised Execution with PID Tracking
Context     : Terminating root Node processes left child CLI runners active, leaking API quota and file locks.
Consequences: Clean aborts via recursive `taskkill /t /f` or POSIX process group kills; requires OS-specific adapters.
```

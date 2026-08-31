# Strategic Design — Problem Space: Session Cycle Management

## Section 1 — Event Storming

| # | Domain Event | Command | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | SessionInitialized | InitializeSession | Session | File System | SessionSummaryProjection |
| 2 | AutonomousCycleRegistered | RegisterAutonomousCycle | AutonomousCycle | File System | CycleManifestProjection |
| 3 | CycleExecutionStarted | StartCycleExecution | AutonomousCycle | Agent Runner CLI (agy/claude) | ActiveExecutionState |
| 4 | PhaseSnapshotRecorded | RecordPhaseSnapshot | AutonomousCycle | File System | CyclePhaseTimeline |
| 5 | CycleExecutionCompleted | CompleteCycleExecution | AutonomousCycle | Metrics Collector | SessionCycleHistory |
| 6 | CycleExecutionAborted | AbortCycleExecution | AutonomousCycle | OS Process Tree (taskkill/SIGKILL) | ActiveExecutionState |
| 7 | CycleExecutionResumed | ResumeCycleExecution | AutonomousCycle | Agent Runner CLI | ActiveExecutionState |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| Cycle Lifecycle & Session Persistence | Core | Core engine governing state transitions, process supervision, unique session isolation, and deterministic disk recovery. |
| Process Tree Supervision | Supporting | Manages isolated child process lifecycle, signal trapping, and clean termination per cycle without orphan leaks. |
| Disk Storage & Serialization | Generic | Standard atomic JSON file persistence under `.harness/sessions/` for manifests and phase snapshots. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| Session | Persistent boundary tracking metadata and collection of autonomous cycles for a workspace run. | Never shared across cycles; each cycle gets its unique identity. |
| Autonomous Cycle | Discrete execution unit traversing TDD/Refinement phases (Phase A to Phase E) with dedicated runner instances. | Synonyms: Cycle, Run. |
| Cycle ID | Unique deterministic identifier identifying a single autonomous cycle execution. | Format: `cycle-<timestamp>-<uuid4>`. |
| Session ID | Distinct UUID identifying the session container on disk. | Format: `sess-<uuid4>`. Distinct per cycle. |
| Phase Snapshot | Point-in-time immutable record of phase progress, verdict scores, and artifact delta. | Enables targeted mid-stream resumption without full replay. |
| Process Supervisor | Runtime controller tracking child PIDs and enforcing recursive termination. | Prevents background token waste and zombie processes. |
| Manifest | JSON file holding cycle metadata, timestamps, configuration parameters, and status flags. | Stored at `.harness/sessions/<session-id>/manifest.json`. |
| Execution State | Finite state of a cycle: `INITIALIZED`, `RUNNING`, `COMPLETED`, `FAILED`, `ABORTED`. | Managed via strict state machine invariants. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does the system guarantee that an `AutonomousCycle` cannot transition to `COMPLETED` if any phase snapshot recorded an unresolved failure or missing gate artifact?
- What invariant prevents simultaneous duplicate execution attempts on the exact same `CycleId`?

**Scalability and Performance**
- How does the file-based persistence model maintain sub-second hydration times when retrieving session manifests across hundreds of completed historical cycles?
- How is memory bloat avoided during high-frequency phase snapshot logging in long-running multi-agent cycles?

**Security and Sensitive Data**
- How does the session persistence layer guarantee that environment secrets and credentials stripped via `filterSensitiveEnv` are never serialized to disk manifests?

**Concurrency and Failures**
- If the host system crashes during disk serialization of a `PhaseSnapshot`, how does atomic file writing prevent manifest file corruption on restart?
- How does process tree termination prevent orphan CLI runner processes when an abort signal is triggered concurrently with phase transition?

**Responsibility Boundaries Between Layers**
- How do use cases coordinate with the `JobExecutionController` without coupling the domain core to OS-specific process spawning libraries?

---
**Architecture Tip:** Isolate process supervision in an outbound adapter, driving cycle state strictly through pure aggregate domain invariants and atomic persistence ports.

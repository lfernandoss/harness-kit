# Strategic Design — Context Map: Multi-Cycle Verification Suite

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| Multi-Cycle Verification Context | Executes comprehensive end-to-end integration and concurrency stress test suites validating session reuse and lifecycle integrity. | Production CLI execution and production UI hosting. | QA & Reliability Engineering | `MultiCycleE2ETestSuite`, `SessionReuseIntegrityAudit`, `ProcessLeakDetector` |
| Session Cycle Core Context (F001) | Provides session identity, cycle persistence, process supervision, and REST/SSE endpoints. | Test report assertions and mock synthetic event generation. | Backend Platform Team | `Session`, `AutonomousCycle`, `FileSessionRepository`, `ProcessTreeManager` |
| Swimlane Presentation Context (F002) | Renders multi-cycle swimlanes, time ruler, and active execution cards. | Headless assertions and OS process inspection. | Frontend Web Team | `SwimlaneDashboardView`, `useSwimlaneDashboard`, `SwimlaneApiClient` |

## Section 2 — Context Map

```
[Multi-Cycle Verification Context] → [Session Cycle Core Context (F001)]
Pattern   : Conformist / Direct Integration Contract
Direction : Downstream (Verification Suite) exercises Upstream (Session Cycle API & Domain)
Justification: The test suite verifies full domain rules, repository persistence, and HTTP/SSE routes directly.

[Multi-Cycle Verification Context] → [Swimlane Presentation Context (F002)]
Pattern   : Customer-Supplier
Direction : Downstream (Verification Suite) tests Upstream (Frontend Hooks & View Controllers)
Justification: Simulates end-to-end user actions (e.g. abort, resume, session switch, lane filter) against live or mock endpoints.
```

## Section 3 — Core Domain Highlight

```
Context : Multi-Cycle Verification Context
Reason  : Critical quality gate guaranteeing that multi-cycle orchestrations and session reuses operate with zero data loss, zero orphan processes, and full state recoverability.
Investment: Multi-phase headless integration tests, synthetic stress test runners, and process tree termination auditing.
```

## Section 4 — Architectural Decisions

```
Decision    : Headless End-to-End Contract Verification
Context     : Testing full multi-cycle flows across backend and frontend must run fast in CI/CD without spinning up full headless browser binaries.
Consequences: High-speed vitest execution (<2s per full suite run) while testing 100% of the integration contract code paths.

Decision    : Real Temporary Workspace File System Isolation
Context     : Testing atomic writes and multi-session persistence must not pollute or conflict with the active development workspace.
Consequences: Every test suite execution provisions a self-contained `os.tmpdir()` sandbox with automatic teardown.

Decision    : Process Tree Cleanliness Invariant Assertion
Context     : Spawning and aborting child processes could leave zombie runners consuming system RAM and CPU.
Consequences: Explicit assertion verifying `ProcessTreeManager.killTree()` terminates all spawned PIDs on both Windows and POSIX.
```

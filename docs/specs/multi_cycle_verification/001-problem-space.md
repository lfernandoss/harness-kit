# Strategic Design — Problem Space: Multi-Cycle Verification Suite

## Section 1 — Event Storming

| # | Domain Event | Command | Aggregate / Test Suite | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | MultiCycleVerificationSuiteStarted | ExecuteMultiCycleVerification | MultiCycleTestRunner | Node Test Runner | VerificationSuiteStatus |
| 2 | SyntheticSessionBatchProvisioned | ProvisionSyntheticSessions | TestFixtureManager | FileSystem (.harness) | SessionManifestSnapshot |
| 3 | ConcurrentCyclesDispatched | DispatchConcurrentCycles | ConcurrencyHarness | ProcessTreeManager | ActiveProcessMap |
| 4 | SessionIdReuseAsserted | AssertSessionIdReuse | SessionIntegrityValidator | ISessionRepository | ReusedSessionLedger |
| 5 | AtomicPersistenceStressTested | StressTestPersistence | PersistenceAuditSuite | Disk I/O Mock | FileIntegrityVerdict |
| 6 | SseMultiplexingVerified | VerifySseMultiplexing | SseStreamAuditSuite | SSE Broadcast Channel | StreamLatencyMatrix |
| 7 | ProcessTreeTerminationAudited | AuditProcessTreeTermination | ProcessLeakDetector | OS Process Table | OrphanProcessReport |
| 8 | MultiCycleVerificationReportGenerated | CompileVerificationReport | MultiCycleReportGenerator | CI/CD Quality Gate | E2EVerificationSummary |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| Multi-Cycle E2E & Concurrency Verification | Core | Autonomous orchestration requires guaranteed end-to-end reliability across multiple chained cycles and session reuses under race conditions. |
| Synthetic Session & Runner Test Fixtures | Supporting | Manages mock CLI runner binaries, temporary worktrees, and synthetic snapshot generators for deterministic test fixtures. |
| Test Coverage & Quality Reporting | Generic | Standard test metric compilation, TAP/JUnit reporting, and threshold enforcement. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| Multi-Cycle Test Suite | High-order automated test suite verifying end-to-end integration between session lifecycle and frontend dashboard. | Enforces zero zombie processes and zero manifest corruption. |
| Session Reuse Assertion | Test check confirming that multiple consecutive autonomous cycles correctly attach to the exact same `SessionId` when requested. | Guarantees backwards-compatible ID reuse while maintaining isolated cycle manifests. |
| Process Leak Detector | Audit routine scanning the operating system process tree after cycle aborts to ensure no orphan child runners survive. | Uses PID tracking and Windows/POSIX process groups. |
| Concurrency Stressor | Automated test runner simulating multiple concurrent cycles dispatching events simultaneously over a single SSE channel. | Validates non-blocking HTTP and SSE throughput. |
| Atomic Persistence Audit | Test routine verifying that abrupt process termination or simultaneous writes never leave corrupted `.json.tmp` files. | Checks atomic rename invariants. |
| Synthetic Fixture Manager | Helper utility generating controlled multi-phase mock sessions with predetermined execution durations and pass/fail states. | Provides test data isolation in temporary directories. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does the verification suite distinguish between a valid session reuse (attaching cycle 2 to session 1) and an unintended session ID collision?
- What assertions guarantee that rehydrated snapshot histories are byte-for-byte identical across consecutive disk reads?

**Scalability and Performance**
- How does the test harness verify that the SSE broadcast handler does not leak memory or drop event frames when 10+ concurrent cycles emit phase events simultaneously?

**Security and Sensitive Data**
- How does the test suite verify that child process environment sanitization effectively strips API keys and credentials before spawning subprocesses?

**Concurrency and Failures**
- How does the test harness simulate abrupt process crashes (kill -9) during a phase transition to verify that the atomic write lock and `.harness/sessions/` manifests remain valid?

**Responsibility Boundaries Between Layers**
- How does the verification suite test the integration between backend HTTP/SSE routes and frontend view controllers without depending on physical browser drivers?

---
**Architecture Tip:** Implement headless contract integration tests linking `FileSessionRepository`, `SessionCycleRoutes`, and `useSwimlaneDashboard` directly in memory and temp workspaces for deterministic, high-speed execution.

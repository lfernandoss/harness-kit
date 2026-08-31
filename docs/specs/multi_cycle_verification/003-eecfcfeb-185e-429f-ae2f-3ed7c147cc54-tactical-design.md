# Tactical Design — eecfcfeb-185e-429f-ae2f-3ed7c147cc54
**Domain:** multi_cycle_verification | **Project:** eecfcfeb-185e-429f-ae2f-3ed7c147cc54

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| MultiCycleTestHarness | Fixture | Provisions isolated sandboxes and mocks | *see below* |
| SessionReuseVerifier | Verification | Asserts session ID retention across cycles | *see below* |
| ProcessLeakDetector | Audit | Asserts zero orphan child PIDs after abort | *see below* |

```typescript
class MultiCycleTestHarness {
  constructor(readonly tempDir: string, readonly serverPort: number) {}
  async cleanup(): Promise<void> { /* kills processes & deletes tempDir */ }
}
```

```typescript
class SessionReuseVerifier {
  static assertReusedSession(session: Session, cycleCount: number): void {
    if (session.getCycles().length !== cycleCount) throw new Error('Mismatch');
  }
}
```

```typescript
class ProcessLeakDetector {
  static assertNoActiveProcess(manager: ProcessTreeManager, cycleId: CycleId): void {
    if (manager.hasActiveProcess(cycleId)) throw new Error('Leaked process');
  }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| VerificationResult | Audit | Status: 'PASSED' \| 'FAILED'; durationMs >= 0 | *see below* |
| E2ETestConfig | Fixture | Port > 0; workspacePath valid non-empty string | *see below* |

```typescript
interface VerificationResult {
  suiteName: string; passed: boolean; durationMs: number; error?: string;
}
```

```typescript
interface E2ETestConfig {
  workspacePath: string; serverPort: number; timeoutMs?: number;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| createSandboxedSession | Spawns sandboxed environment for test execution | MultiCycleTestHarness | *see below* |
| simulateInterruptedCycle | Creates interrupted snapshot state for resumption tests | ISessionRepository | *see below* |

```typescript
async function createSandboxedSession(harness: MultiCycleTestHarness): Promise<Session> {
  const session = new Session(SessionId.generate(), harness.tempDir);
  return session;
}
```

```typescript
async function simulateInterruptedCycle(repo: ISessionRepository, cycle: AutonomousCycle): Promise<void> {
  cycle.recordPhase(new PhaseSnapshot('PHASE_A', 'PASSED', new Date()));
  await repo.saveCycle(cycle);
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| TestHarnessStarted | Test runner launches E2E test | `{ suite: string, startedAt: string }` | TestRunner, AuditLogger |
| TestAssertionFailed | Invariant fails | `{ suite: string, assertion: string, error: string }` | MultiCycleTestRunner |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| TestFixturePersistence | createTempWorkspace, clearTempWorkspace | `Promise<string>`, `Promise<void>` |

```typescript
interface TestFixturePersistence {
  createTempWorkspace(): Promise<string>;
  clearTempWorkspace(dirPath: string): Promise<void>;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Synthetic Test Fixtures and Workspace Sandboxing",
    "description": "Creates helper utilities for temporary directory creation, mock session creation, and process supervision fixtures.",
    "scope": [
      "sdk/src/test-fixtures/MultiCycleTestHarness.ts",
      "sdk/src/test-fixtures/__tests__/MultiCycleTestHarness.spec.ts"
    ],
    "acceptance": [
      "Provisions temporary workspace with isolated .harness directory structure",
      "Cleans up all temporary files and processes upon test completion"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Multi-Cycle Session Lifecycle & Reuse E2E Tests",
    "description": "Validates sequential and concurrent autonomous cycle creation with session ID retention and reuse.",
    "scope": [
      "sdk/src/__tests__/e2e/MultiCycleSessionLifecycle.e2e.spec.ts"
    ],
    "acceptance": [
      "Asserts that multiple cycles attached to the same session preserve individual cycle state manifests",
      "Verifies that listing sessions returns all attached cycles accurately"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Real-time SSE Stream Multiplexing & Resumption Tests",
    "description": "Tests real-time phase updates streaming across multiple active cycles and phase resumption from snapshots.",
    "scope": [
      "sdk/src/__tests__/e2e/MultiCycleSseResumption.e2e.spec.ts"
    ],
    "acceptance": [
      "Validates SSE broadcast delivery to connected clients during concurrent cycle execution",
      "Asserts cycle resumes from exact interrupted phase snapshot without regressions"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement Process Tree Termination & Leak Audit Tests",
    "description": "Stresses cycle abort workflows and audits OS process tables for zero zombie or orphaned subprocesses.",
    "scope": [
      "sdk/src/__tests__/e2e/ProcessTreeTermination.e2e.spec.ts"
    ],
    "acceptance": [
      "Verifies recursive process kill terminates running child processes on abort",
      "Confirms filtered environment variables contain zero sensitive tokens"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Frontend-Backend Swimlane Integration Verification Suite",
    "description": "Tests end-to-end integration between Swimlane Dashboard controllers and live backend session endpoints.",
    "scope": [
      "sdk-web/src/__tests__/e2e/SwimlaneDashboardIntegration.e2e.spec.ts"
    ],
    "acceptance": [
      "Verifies Swimlane controller reflects live cycle execution and status updates from backend API",
      "Asserts category filtering and session selection operate without errors"
    ],
    "depends_on": "04"
  }
]
```

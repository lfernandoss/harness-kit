# Tactical Design — eecfcfeb-185e-429f-ae2f-3ed7c147cc54
**Domain:** session_cycle_management | **Project:** eecfcfeb-185e-429f-ae2f-3ed7c147cc54

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| AutonomousCycle | Aggregate Root | Valid state transition; unique CycleId; snapshots append-only | *see below* |
| Session | Aggregate Root | Distinct SessionId; non-empty workspacePath | *see below* |
| PhaseSnapshot | Entity | Phase identifier valid; non-null timestamp; immutable verdict | *see below* |

```typescript
class AutonomousCycle extends AggregateRoot {
  constructor(readonly id: CycleId, readonly sessionId: SessionId, private state: CycleState) {}
  recordPhase(snapshot: PhaseSnapshot): void { this.snapshots.push(snapshot) }
}
```

```typescript
class Session extends AggregateRoot {
  constructor(readonly id: SessionId, readonly workspacePath: string) {}
  attachCycle(cycle: AutonomousCycle): void { this.cycles.set(cycle.id.value, cycle) }
}
```

```typescript
class PhaseSnapshot {
  constructor(readonly phase: string, readonly verdict: string, readonly recordedAt: Date) {}
  isValid(): boolean { return Boolean(this.phase && this.recordedAt) }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| SessionId | Domain VO | Non-empty string; UUIDv4 format validation | *see below* |
| CycleId | Domain VO | Non-empty deterministic identifier format `cycle-<id>` | *see below* |
| CycleState | Domain Enum | Finite state enum: INITIALIZED, RUNNING, COMPLETED, FAILED, ABORTED | *see below* |

```typescript
class SessionId {
  constructor(readonly value: string) { if (!value || !value.startsWith('sess-')) throw new Error('Invalid SessionId') }
  equals(other: SessionId): boolean { return this.value === other.value }
}
```

```typescript
class CycleId {
  constructor(readonly value: string) { if (!value || !value.startsWith('cycle-')) throw new Error('Invalid CycleId') }
  equals(other: CycleId): boolean { return this.value === other.value }
}
```

```typescript
enum CycleState {
  INITIALIZED = 'INITIALIZED', RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED', FAILED = 'FAILED', ABORTED = 'ABORTED'
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| CreateCycleSessionUseCase | Initializes session with unique ID and starts cycle | Session, AutonomousCycle, ISessionRepository | *see below* |
| ResumeCycleUseCase | Resumes interrupted cycle from last valid phase snapshot | AutonomousCycle, ISessionRepository, ProcessTreeManager | *see below* |
| AbortCycleUseCase | Terminates active cycle and kills process tree recursively | AutonomousCycle, ProcessTreeManager, ISessionRepository | *see below* |

```typescript
class CreateCycleSessionUseCase {
  async execute(dto: CreateCycleDto): Promise<SessionManifestDto> {
    // validate -> instantiate Session & AutonomousCycle -> persist -> dispatch
  }
}
```

```typescript
class ResumeCycleUseCase {
  async execute(cycleId: CycleId, fromPhase?: string): Promise<void> {
    // load cycle -> rehydrate snapshot -> resume execution controller
  }
}
```

```typescript
class AbortCycleUseCase {
  async execute(cycleId: CycleId): Promise<void> {
    // processTreeManager.kill(cycleId) -> cycle.abort() -> repository.save(cycle)
  }
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| SessionInitialized | Session created | `{ sessionId: string, workspacePath: string, createdAt: string }` | EventStreamHandler, AuditLogger |
| CyclePhaseTransitioned | Phase completed | `{ cycleId: string, phase: string, status: string, durationMs: number }` | EventStreamHandler, SwimlaneTimeline |
| CycleExecutionAborted | User triggers abort | `{ cycleId: string, abortedAt: string, reason: string }` | ProcessTreeManager, EventStreamHandler |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| ISessionRepository | saveSession, findSessionById, saveCycle, findCycleById | `Promise<void>`, `Promise<Session \| null>`, `Promise<AutonomousCycle \| null>` |
| ProcessTreeManager | spawnSupervisedProcess, killProcessTree | `Promise<ProcessHandle>`, `Promise<void>` |

```typescript
interface ISessionRepository {
  saveSession(session: Session): Promise<void>;
  findSessionById(id: SessionId): Promise<Session | null>;
  saveCycle(cycle: AutonomousCycle): Promise<void>;
}
```

```typescript
interface ProcessTreeManager {
  spawn(cycleId: CycleId, command: string, args: string[]): Promise<number>;
  killTree(cycleId: CycleId): Promise<void>;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement SessionId and CycleId Value Objects",
    "description": "Creates immutable value objects and state enums for unique session and cycle identities.",
    "scope": [
      "sdk/src/server/domain/value-objects/SessionId.ts",
      "sdk/src/server/domain/value-objects/CycleId.ts",
      "sdk/src/server/domain/value-objects/CycleState.ts",
      "sdk/src/server/domain/value-objects/__tests__/SessionId.spec.ts"
    ],
    "acceptance": [
      "Validates non-empty UUID format rejecting malformed IDs",
      "Guarantees immutability and value equality comparison"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement AutonomousCycle Aggregate Root",
    "description": "Enforces cycle state transitions, phase snapshots, and execution invariants.",
    "scope": [
      "sdk/src/server/domain/aggregates/AutonomousCycle.ts",
      "sdk/src/server/domain/entities/PhaseSnapshot.ts",
      "sdk/src/server/domain/aggregates/__tests__/AutonomousCycle.spec.ts"
    ],
    "acceptance": [
      "Rejects invalid phase transitions violating sequential progression",
      "Appends immutable phase snapshots on phase completion"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement FileSessionRepository for Atomic Persistence",
    "description": "Persists and hydrates sessions and cycle manifests on disk with atomic write operations.",
    "scope": [
      "sdk/src/server/domain/repositories/ISessionRepository.ts",
      "sdk/src/server/adapters/outbound/persistence/FileSessionRepository.ts",
      "sdk/src/server/adapters/outbound/persistence/__tests__/FileSessionRepository.spec.ts"
    ],
    "acceptance": [
      "Writes manifests atomically using temp files and atomic renames",
      "Hydrates all persisted sessions and cycle manifests on startup"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement ProcessTreeManager for Cycle Execution",
    "description": "Manages child process tree registration and recursive termination for autonomous runners.",
    "scope": [
      "sdk/src/server/adapters/outbound/services/ProcessTreeManager.ts",
      "sdk/src/server/adapters/outbound/services/JobExecutionController.ts",
      "sdk/src/server/adapters/outbound/services/__tests__/ProcessTreeManager.spec.ts"
    ],
    "acceptance": [
      "Recursively terminates process tree on abort without leaving zombies",
      "Captures process exit codes and maps errors to AgentRunnerErrorCode"
    ],
    "depends_on": "02"
  },
  {
    "id": "05",
    "title": "Implement Multi-Cycle Session Lifecycle Use Cases",
    "description": "Coordinates session creation, cycle execution dispatch, phase resumption, and abort workflows.",
    "scope": [
      "sdk/src/server/application/use-cases/CreateCycleSessionUseCase.ts",
      "sdk/src/server/application/use-cases/ResumeCycleUseCase.ts",
      "sdk/src/server/application/use-cases/AbortCycleUseCase.ts",
      "sdk/src/server/application/use-cases/__tests__/CycleSessionUseCases.spec.ts"
    ],
    "acceptance": [
      "Dispatches new cycle execution with unique session identity",
      "Resumes cycle from specific phase snapshot without re-executing passed phases"
    ],
    "depends_on": "03"
  },
  {
    "id": "06",
    "title": "Implement HTTP and SSE Routes for Session Lifecycle",
    "description": "Exposes REST endpoints and SSE streams for session cycle tracking and execution control.",
    "scope": [
      "sdk/src/server/adapters/inbound/http/dto/SessionCycleDto.ts",
      "sdk/src/server/adapters/inbound/http/routes/SessionCycleRoutes.ts",
      "sdk/src/server/adapters/inbound/http/routes/__tests__/SessionCycleRoutes.spec.ts"
    ],
    "acceptance": [
      "Returns 201 with session manifest on initialization",
      "Streams real-time cycle phase transitions over SSE to connected clients"
    ],
    "depends_on": "05"
  }
]
```

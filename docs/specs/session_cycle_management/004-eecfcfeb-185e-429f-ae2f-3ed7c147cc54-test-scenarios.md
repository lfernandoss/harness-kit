# Test Scenarios — eecfcfeb-185e-429f-ae2f-3ed7c147cc54

**Domain:** session_cycle_management
**Project:** eecfcfeb-185e-429f-ae2f-3ed7c147cc54
**Framework:** Vitest
**Date:** 2026-08-31

## Section 1 — Unit Tests

### 1.1 Aggregates and Aggregate Roots

#### AutonomousCycle Aggregate Root
- [ ] **Should initialize AutonomousCycle with INITIALIZED state when created with valid IDs**
  - Given: A valid `CycleId` ("cycle-101") and a valid `SessionId` ("sess-abc")
  - When: Instantiating `AutonomousCycle`
  - Then: `AutonomousCycle` has state `INITIALIZED` and empty snapshot collection
- [ ] **Should transition to RUNNING state when cycle execution is started**
  - Given: An `AutonomousCycle` in `INITIALIZED` state
  - When: `start()` command is invoked
  - Then: State transitions to `RUNNING`
- [ ] **Should record PhaseSnapshot when phase execution finishes**
  - Given: An `AutonomousCycle` in `RUNNING` state
  - When: `recordPhase()` is called with a valid `PhaseSnapshot`
  - Then: The snapshot is appended to the internal snapshots list
- [ ] **Should transition to ABORTED state when abort is requested**
  - Given: An `AutonomousCycle` in `RUNNING` state
  - When: `abort()` command is applied
  - Then: State transitions to `ABORTED`
- [ ] **Should reject state transition when attempting to start a COMPLETED or ABORTED cycle**
  - Given: An `AutonomousCycle` in `COMPLETED` state
  - When: `start()` command is applied
  - Then: Throws `DomainInvariantError` rejecting invalid state transition

#### Session Aggregate Root
- [ ] **Should attach AutonomousCycle to Session successfully**
  - Given: A valid `Session` instance and a valid `AutonomousCycle`
  - When: `attachCycle()` is called
  - Then: The cycle is tracked inside the session's cycle registry

### 1.2 Value Objects

#### SessionId Value Object
- [ ] **Should create SessionId when prefix is valid and value non-empty**
  - Given: String `"sess-99b8"`
  - When: Creating `SessionId`
  - Then: Instance is created successfully
- [ ] **Should reject SessionId when format is empty or missing prefix**
  - Given: Empty string `""` or invalid string `"invalid-prefix"`
  - When: Creating `SessionId`
  - Then: Throws validation error

#### CycleId Value Object
- [ ] **Should create CycleId when value has valid cycle prefix**
  - Given: String `"cycle-2026-001"`
  - When: Creating `CycleId`
  - Then: Instance is created successfully
- [ ] **Should evaluate two CycleId instances as equal when values match**
  - Given: Two instances with value `"cycle-2026-001"`
  - When: `equals()` is invoked
  - Then: Returns true

### 1.3 Domain Services
N/A — Domain logic is fully encapsulated in `AutonomousCycle` and `Session` aggregates.

### 1.4 Domain Events
- [ ] **Should contain mandatory cycleId and timestamp when CyclePhaseTransitioned is emitted**
  - Given: A phase transition event
  - When: Event payload is constructed
  - Then: `cycleId`, `phase`, `status`, and `durationMs` are present and immutable

## Section 2 — Integration Tests

### 2.1 Repositories

#### FileSessionRepository
- [ ] **Should persist and retrieve Session with attached cycles from disk**
  - Given: A `Session` containing an `AutonomousCycle`
  - When: `saveSession()` writes to `.harness/sessions/<session-id>/session.json` and `findSessionById()` is called
  - Then: The rehydrated session matches the original state
- [ ] **Should atomically write cycle manifests without corrupting existing files**
  - Given: An updated `AutonomousCycle`
  - When: `saveCycle()` writes manifest to disk
  - Then: The file is written via temporary file rename ensuring atomic persistence
- [ ] **Should return null when querying non-existent SessionId**
  - Given: A non-existent `SessionId` ("sess-unknown")
  - When: `findSessionById()` is called
  - Then: Returns null without throwing exceptions

### 2.2 Use Cases

#### CreateCycleSessionUseCase
- [ ] **Should create session manifest on disk and register cycle in execution controller**
  - Given: Valid `CreateCycleDto` with workspace path and runner configuration
  - When: `CreateCycleSessionUseCase.execute()` is called
  - Then: Persists `.harness/sessions/<session-id>/session.json` and returns manifest DTO

#### ResumeCycleUseCase
- [ ] **Should restore cycle state from phase snapshot and resume execution**
  - Given: An interrupted cycle on disk with snapshot up to Phase B
  - When: `ResumeCycleUseCase.execute()` is called with target cycle ID
  - Then: Execution resumes from Phase C without re-running Phase A and B

#### AbortCycleUseCase
- [ ] **Should trigger process tree termination and update cycle state to ABORTED**
  - Given: An active cycle with running child OS processes
  - When: `AbortCycleUseCase.execute()` is called
  - Then: `ProcessTreeManager.killTree()` is invoked and cycle state is persisted as `ABORTED`

### 2.3 External Integrations

#### ProcessTreeManager
- [ ] **Should spawn process with sanitized environment and record child PID**
  - Given: Command string and sanitized environment variables
  - When: `spawnSupervisedProcess()` is executed
  - Then: Process starts and PID is registered in active handle map
- [ ] **Should terminate full child process tree on Windows using taskkill**
  - Given: A running process tree under test
  - When: `killTree()` is invoked on Windows platform
  - Then: Executes `taskkill /pid <PID> /t /f` and confirms process termination

## Section 3 — Functional Tests

### 3.1 Happy Path Flows
- [ ] **Should execute full multi-cycle lifecycle with unique session IDs and phase persistence**
  - Given: SDK server active on `127.0.0.1`
  - When: User creates a new cycle session via `POST /api/sessions/cycles`
  - Then: HTTP 201 is returned with unique `sessionId`, manifest is written to `.harness/sessions/`, and SSE stream emits lifecycle events

### 3.2 Alternative and Error Flows
- [ ] **Should return HTTP 404 when querying status for unknown cycleId**
  - Given: Request for `GET /api/sessions/cycles/cycle-non-existent`
  - When: Endpoint handler processes request
  - Then: Returns HTTP 404 with structured error message
- [ ] **Should return HTTP 409 Conflict when attempting to start duplicate cycle on active workspace lock**
  - Given: An already running cycle in workspace
  - When: A second concurrent start request is received
  - Then: Returns HTTP 409 Conflict protecting workspace integrity

### 3.3 Security Scenarios
- [ ] **Should sanitize environment variables before spawning child runner processes**
  - Given: Host process environment containing `API_KEY`, `TOKEN`, `PASSWORD`
  - When: `ProcessTreeManager` spawns runner CLI
  - Then: Subprocess environment receives only filtered variables via `filterSensitiveEnv`
- [ ] **Should reject path traversal attempts in session and workspace parameters**
  - Given: Payload with malicious workspace path `../../etc/`
  - When: API validates incoming DTO
  - Then: Request is rejected with HTTP 400 Bad Request

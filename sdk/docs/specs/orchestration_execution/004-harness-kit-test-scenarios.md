# Test Scenarios — harness-kit

**Domain:** orchestration_execution
**Project:** harness-kit
**Framework:** Vitest
**Date:** 2026-08-27

## Section 1 — Unit Tests

### 1.1 Value Objects and Contracts

**RunConfigDTO Validation:**
- [ ] Should validate `RunConfigDTO` successfully when non-empty scope and valid `RunMode` are provided
- [ ] Should reject `RunConfigDTO` when scope is empty or contains only whitespace
- [ ] Should map optional runner backend, model, and effort options correctly without mutation

**JobEventDTO Contract:**
- [ ] Should validate `phase_change` event structure with mandatory `phase` and `timestamp` fields
- [ ] Should validate `log_chunk` event with stream identifier (`stdout` or `stderr`) and log text
- [ ] Should validate `telemetry` event containing `tokensUsed` and `costEstimate`

**SteeringRequestDTO Validation:**
- [ ] Should validate `add_rule` steering action when rule text is within 5000 characters
- [ ] Should reject `add_rule` steering action when rule text exceeds maximum character length
- [ ] Should validate `rollback` action when target phase belongs to resumable phases
- [ ] Should reject `rollback` action when target phase is invalid (e.g., non-existent phase name)
- [ ] Should validate `override_score` action clamping scores between 0 and 10

**AnsiFormattedChunk & Theme Converter:**
- [ ] Should parse standard ANSI color codes and return tokens with mapped CSS classes
- [ ] Should apply light theme color classes when theme mode is light
- [ ] Should apply dark theme color classes when theme mode is dark
- [ ] Should maintain WCAG AA contrast ratio ≥ 4.5:1 across all parsed ANSI foreground/background combinations

### 1.2 Domain Services and Custom Hooks

**formatAnsiToHtml:**
- [ ] Should escape raw HTML tags in terminal logs to prevent script injection
- [ ] Should convert multi-line ANSI escape sequences into structured styled span segments
- [ ] Should handle unclosed ANSI styling sequences gracefully without breaking formatting

**useOrchestrationExecution:**
- [ ] Should initialize with null session state when no active job is running
- [ ] Should update `LiveSessionState` phase and append logs upon receiving SSE messages
- [ ] Should update connection status to disconnected when EventSource closes

**useSteering:**
- [ ] Should dispatch POST request with JSON-serialized `SteeringRequestDTO` to `/orchestrator/jobs/:jobId/steering`
- [ ] Should handle API errors gracefully when steering submission fails

**ApplyMidRunSteeringUseCase:**
- [ ] Should validate steering action and inject it into the active `HarnessOrchestrator` instance
- [ ] Should reject steering request with 404 when target `jobId` is not actively running

**AbortOrchestrationJobUseCase:**
- [ ] Should send abort signal to the running agent runner and update job status to `aborted`
- [ ] Should release workspace lock in `WorkspaceLockManager` upon abortion

### 1.3 Components

**RunnerConfigCard:**
- [ ] Should render available runner backend choices (claude-cli, antigravity-cli, cursor-cli, etc.)
- [ ] Should render execution mode options (`quick`, `fast`, `thinking`, `deep_thinking`) with default selection
- [ ] Should toggle reset vs resume mode based on existing session state
- [ ] Should invoke `onStart` callback with validated `RunConfigDTO` when form is submitted

**PhaseTimeline:**
- [ ] Should render all pipeline stages from `BOOTSTRAP` to `DEPLOY`
- [ ] Should mark completed phases with completed visual badge
- [ ] Should highlight the current active phase with pulsating active indicator
- [ ] Should display skipped stages with distinct disabled styling when skip flags are active

**LiveLogConsole:**
- [ ] Should render streaming log chunks in real-time within a virtualized container
- [ ] Should auto-scroll to the bottom when new log lines arrive and auto-scroll is enabled
- [ ] Should pause auto-scroll when user manually scrolls up in the console
- [ ] Should resume auto-scroll when user scrolls back to the bottom

**SteeringDrawer:**
- [ ] Should display form inputs for rule text, phase rollback dropdown, and score override sliders
- [ ] Should trigger `submitSteering` and close drawer when form is submitted
- [ ] Should disable submit button while steering request is in-flight

### 1.4 Domain Events

**Pipeline and Log Events:**
- [ ] Should ensure `JobExecutionQueued` contains `jobId`, `workspacePath`, and `mode`
- [ ] Should ensure `PhaseTransitionEmitted` is immutable and contains valid `fromPhase` and `toPhase`
- [ ] Should ensure `TerminalLogEmitted` preserves exact whitespace and escape characters

---

## Section 2 — Integration Tests

### 2.1 EventStreamBroadcaster and SSE Streaming

**SSE Broadcast & Multi-Client Synchronization:**
- [ ] Should stream `phase_change` and `log_chunk` events to multiple connected HTTP clients simultaneously
- [ ] Should replay buffered events from the in-memory ring buffer (up to 500 events) upon new client connection
- [ ] Should remove client from active listener set when client disconnects without throwing errors
- [ ] Should maintain continuous stream without memory leaks over 10,000 streamed log chunks

### 2.2 Workspace Lock & Concurrency Management

**Singleton Execution & HTTP 409 Conflict:**
- [ ] Should acquire workspace lock and return 202 Accepted when no job is running on workspace
- [ ] Should reject concurrent execution request on the same workspace with HTTP 409 Conflict
- [ ] Should release workspace lock when job reaches `completed`, `failed`, or `aborted` state
- [ ] Should allow subsequent job execution on the workspace immediately after prior lock release

### 2.3 Mid-Run Steering and Subprocess Termination

**Dynamic Steering Dispatch:**
- [ ] Should apply `add_rule` steering action to running orchestrator without restarting the pipeline
- [ ] Should transition orchestrator state to earlier phase when `rollback` steering action is applied
- [ ] Should update QA/TL scores in active review context when `override_score` action is applied

**Explicit Subprocess Tree Abort:**
- [ ] Should terminate agent subprocess tree cleanly (`taskkill /t` on Windows, `SIGKILL` on Unix) on explicit abort
- [ ] Should verify no orphan runner processes remain running in background after abort
- [ ] Should update job status to `aborted` and emit terminal event to all connected SSE clients

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

- [ ] **Should configure, launch, stream live execution, and complete orchestration cycle**
  - Given: Local web server is running and developer opens the execution dashboard
  - When: Developer selects `claude-cli` runner, `thinking` mode, enters scope "Implement auth module", and clicks Run
  - Then: Server acquires workspace lock, transitions job to `running`, broadcasts live phase transitions and ANSI logs via SSE, updates `PhaseTimeline` to `DEPLOY`, and finishes with status `completed`

- [ ] **Should inject mid-run steering rule during active development phase without interruption**
  - Given: Orchestration job is actively executing the `DEVELOPMENT` phase
  - When: Developer opens `SteeringDrawer`, types "Enforce strict error boundaries", and submits steering
  - Then: Server processes `add_rule` action, logs confirmation in `LiveLogConsole`, and agent incorporates new rule in subsequent tasks without restarting the job

- [ ] **Should reconnect seamlessly to running background job after browser tab reload**
  - Given: Orchestration job is running in background on local server
  - When: Developer reloads browser tab or opens dashboard in a new tab
  - Then: Dashboard reconnects to SSE stream, receives replayed history events from ring buffer, and restores active phase and console logs without interrupting the running job

### 3.2 Alternative and Error Flows

- [ ] **Should display conflict banner when triggering run on an already locked workspace**
  - Given: A job is already actively executing on the target workspace
  - When: Developer attempts to submit another run configuration targeting the same workspace
  - Then: Server returns HTTP 409 Conflict and dashboard displays an explanatory conflict notice with link to the active session

- [ ] **Should terminate execution cleanly upon user-confirmed explicit abort**
  - Given: Orchestration job is actively running
  - When: Developer clicks Abort button and confirms in the `AbortConfirmModal`
  - Then: Server terminates runner subprocess tree, releases workspace lock, updates dashboard status badge to Aborted, and stops log streaming

- [ ] **Should reject malformed steering payloads with validation error**
  - Given: Orchestration job is running
  - When: Client sends POST `/orchestrator/jobs/:jobId/steering` with an invalid phase name for rollback
  - Then: Server returns HTTP 400 Bad Request with descriptive error message without impacting the running execution

### 3.3 Security & Concurrency Scenarios

- [ ] **Should sanitize sensitive environment variables from streamed terminal logs**
  - Given: Runner execution outputs environment details or config traces
  - When: Log chunks are processed by `EventStreamBroadcaster`
  - Then: Tokens, passwords, and sensitive keys matching sensitive patterns are masked before transmission to browser clients

- [ ] **Should prevent browser disconnection from triggering AbortSignal**
  - Given: Long-running agent task is actively executing
  - When: Browser window is closed or network connection drops
  - Then: Server background process continues execution to completion, persisting state to `DEVELOPMENT-STATE.md` without interruption

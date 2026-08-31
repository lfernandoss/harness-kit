# Test Scenarios — eecfcfeb-185e-429f-ae2f-3ed7c147cc54

**Domain:** multi_cycle_verification
**Project:** eecfcfeb-185e-429f-ae2f-3ed7c147cc54
**Framework:** Vitest
**Date:** 2026-08-31

## Section 1 — Unit Tests

### 1.1 Test Fixtures and Sandboxing

#### MultiCycleTestHarness
- [ ] **Should provision isolated temporary workspace directory on initialization**
  - Given: A new `MultiCycleTestHarness` instance
  - When: `init()` is called
  - Then: Creates sandbox directory in temporary storage with `.harness` structure
- [ ] **Should recursively clean up workspace directory on teardown**
  - Given: An active `MultiCycleTestHarness` with created files
  - When: `cleanup()` is invoked
  - Then: Removes all sandbox files and verifies path no longer exists on disk

### 1.2 Invariant Assertions

#### SessionReuseVerifier
- [ ] **Should assert that all attached cycles point to identical sessionId**
  - Given: A `Session` containing 3 cycles
  - When: `SessionReuseVerifier.assertConsistentSessionId()` is invoked
  - Then: Returns true when all cycles reference the parent session ID

## Section 2 — Integration Tests

### 2.1 Multi-Cycle Lifecycle and Session Reuse

#### MultiCycleSessionLifecycle E2E
- [ ] **Should create multiple sequential cycles under the same session ID**
  - Given: Running HTTP test server
  - When: Dispatching 3 consecutive cycle creation requests specifying the same `sessionId`
  - Then: Returns HTTP 201 for each, and the session manifest contains 3 distinct `AutonomousCycle` records
- [ ] **Should persist each cycle manifest atomically without corrupting sibling cycle manifests**
  - Given: 3 cycles in a single session
  - When: Cycles update phases concurrently
  - Then: All 3 `.json` manifests in `.harness/sessions/<session-id>/cycles/` remain valid and uncorrupted

### 2.2 SSE Multiplexing and Resumption

#### MultiCycleSseResumption E2E
- [ ] **Should broadcast phase transition events across multiple active cycles concurrently**
  - Given: Active SSE event stream client connected to `/api/sessions/cycles/events`
  - When: Cycle 1 advances to Phase B and Cycle 2 advances to Phase C
  - Then: Client receives both `cycle_phase_updated` events with correct cycle IDs
- [ ] **Should resume interrupted cycle from saved phase snapshot**
  - Given: A cycle with saved snapshots up to Phase B
  - When: Resume request is sent via `/api/sessions/cycles/resume`
  - Then: Cycle transitions to `RUNNING` and resumes from Phase C

### 2.3 Process Tree Supervision and Leak Audit

#### ProcessTreeTermination E2E
- [ ] **Should terminate child process tree recursively upon cycle abort**
  - Given: A spawned long-running child process registered under `cycle-101`
  - When: `ProcessTreeManager.killProcessTree()` is triggered
  - Then: OS process is terminated and removed from active handles map
- [ ] **Should sanitize environment variables and filter sensitive secrets**
  - Given: Environment containing `AWS_SECRET_KEY`, `GITHUB_TOKEN`, `DB_PASSWORD`
  - When: Process environment is filtered via `filterSensitiveEnv`
  - Then: Sanitized environment contains only non-sensitive configuration keys

## Section 3 — Functional Tests

### 3.1 End-to-End Cross-Layer Flows

#### SwimlaneDashboardIntegration E2E
- [ ] **Should reflect multi-cycle session lifecycle in frontend dashboard controller**
  - Given: Live backend HTTP/SSE server and frontend `SwimlaneDashboardController`
  - When: Multiple cycles are created and phase updates streamed
  - Then: Dashboard state updates lanes, card widths, and status badges in real-time
- [ ] **Should trigger cycle abort from frontend controller and verify backend process kill**
  - Given: Running cycle reflected in dashboard controller
  - When: Controller invokes `abortCycle("cycle-101")`
  - Then: Backend terminates process, persists `ABORTED` state, and emits SSE update

### 3.2 Resilience and Concurrency Flows
- [ ] **Should handle rapid concurrent session queries without disk read lock contention**
  - Given: 20 simultaneous HTTP GET requests to `/api/sessions/:id`
  - When: Server processes requests concurrently
  - Then: All requests return HTTP 200 with valid session manifests in under 500ms

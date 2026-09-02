# Parallel Autonomous Cycle Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement parallel autonomous cycle execution where operators can launch multiple cycles concurrently, each mapped 1:1 to its own dedicated Session ID and isolated in its own Git worktree.

**Architecture:** Clean Architecture with `AutonomousCycleSession` aggregate roots (1:1 cycle/session binding), `WorktreeIsolationProvider` for zero-collision disk sandboxing, `ParallelCycleCoordinator` with `ProcessTreeManager` child process supervision, and multi-channel SSE streaming into an interactive Swimlanes dashboard.

**Tech Stack:** TypeScript, Node.js v24, Vitest, Git Worktrees, Server-Sent Events (SSE), CSS Modules.

## Global Constraints
- Node.js >= 18 runtime with strict loopback binding to `127.0.0.1`.
- Mandatory 1:1 mapping between `CycleId` and `SessionId`.
- Process tree termination via `taskkill /t /f` (Windows) or `SIGKILL` process groups (POSIX).
- Sensitive environment variable sanitization via `filterSensitiveEnv`.
- All tests executed with Vitest; minimum 85% coverage.

---

### Task 1: `AutonomousCycleSession` 1:1 Aggregate Root & State Machine

**Files:**
- Create: `sdk/src/server/domain/aggregates/AutonomousCycleSession.ts`
- Test: `sdk/src/server/domain/aggregates/__tests__/AutonomousCycleSession.spec.ts`

**Interfaces:**
- Consumes: `SessionId`, `CycleId`, `CycleState`, `PhaseSnapshot`
- Produces: `AutonomousCycleSession` class with `transitionTo()`, `recordPhase()`, `toManifest()`, and invariant validations.

- [x] **Step 1: Write failing unit test for `AutonomousCycleSession`**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `AutonomousCycleSession`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 2: `WorktreeIsolationProvider` (Git Worktree Sandbox Lifecycle)

**Files:**
- Create: `sdk/src/server/adapters/outbound/services/WorktreeIsolationProvider.ts`
- Test: `sdk/src/server/adapters/outbound/services/__tests__/WorktreeIsolationProvider.spec.ts`

**Interfaces:**
- Consumes: `CycleId`, repository root path
- Produces: `IWorktreeProvider` with `createWorktree(cycleId): Promise<string>` and `removeWorktree(cycleId): Promise<void>`.

- [x] **Step 1: Write failing unit test for `WorktreeIsolationProvider`**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `WorktreeIsolationProvider`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 3: `ParallelCycleCoordinator` & Multi-Channel SSE Event Broadcaster

**Files:**
- Create: `sdk/src/server/application/use-cases/ParallelCycleCoordinator.ts`
- Test: `sdk/src/server/application/use-cases/__tests__/ParallelCycleCoordinator.spec.ts`

**Interfaces:**
- Consumes: `FileSessionRepository`, `WorktreeIsolationProvider`, `ProcessTreeManager`
- Produces: `ParallelCycleCoordinator` handling `dispatchParallel(configs)`, `getActiveCycles()`, `abortCycle(cycleId)`.

- [x] **Step 1: Write failing unit test for `ParallelCycleCoordinator`**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `ParallelCycleCoordinator`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 4: REST API & SSE Endpoints (`ParallelCycleRoutes`)

**Files:**
- Create: `sdk/src/server/adapters/inbound/http/routes/ParallelCycleRoutes.ts`
- Modify: `sdk/src/server/adapters/inbound/http/routes/RouteHandlers.ts`
- Test: `sdk/src/server/adapters/inbound/http/routes/__tests__/ParallelCycleRoutes.spec.ts`

**Interfaces:**
- Consumes: `ParallelCycleCoordinator`
- Produces: HTTP handlers for `/api/cycles/parallel`, `/api/cycles/active`, `/api/cycles/events`, `/api/cycles/:cycleId/abort`.

- [x] **Step 1: Write failing integration test for `ParallelCycleRoutes`**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `ParallelCycleRoutes` and wire into `RouteHandlers`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 5: Web UI Parallel Swimlanes & Creation Modal

**Files:**
- Create: `sdk-web/src/views/orchestrator/components/ParallelCycleModal.ts`
- Modify: `sdk-web/src/views/orchestrator/SwimlaneDashboardView.ts`
- Modify: `sdk/src/server/adapters/inbound/http/web/WebUiRenderer.ts`
- Test: `sdk-web/src/views/orchestrator/components/__tests__/ParallelCycleModal.spec.ts`

- [x] **Step 1: Write failing UI component test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `ParallelCycleModal` and multi-lane dynamic rendering**
- [x] **Step 4: Run test to verify it passes**

---

### Task 6: End-to-End Verification Suite

**Files:**
- Create: `sdk/src/__tests__/e2e/ParallelCycleExecution.e2e.spec.ts`

- [x] **Step 1: Write E2E test verifying concurrent execution of 3 cycles**
- [x] **Step 2: Run test to verify it passes end-to-end**
- [x] **Step 3: Verify zero process leaks and clean worktree teardowns**

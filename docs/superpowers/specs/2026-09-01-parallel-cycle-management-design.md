# Design Document: Parallel Autonomous Cycle Management with Dedicated 1:1 Sessions

**Date:** 2026-09-01  
**Status:** Approved  
**Author:** Software Architect & Antigravity  
**Domain:** `parallel_cycle_management`  

---

## 1. Executive Summary

This feature provides a robust, concurrent orchestration framework enabling operators to create, run, monitor, and manage **multiple autonomous cycles executing in parallel**. Each parallel cycle is mapped **1:1 to its own dedicated Session ID** (`sessionId`) and isolated workspace (**Git Worktree**), guaranteeing that concurrent LLM agent runs cannot cause file lock contention, merge collisions, or polluted session histories.

---

## 2. Core Architectural Decisions

### 2.1 1:1 Strict Cycle-to-Session Identity
- **Aggregate Root:** `AutonomousCycleSession`
- Each cycle instance is instantiated with a unique `CycleId` and a dedicated `SessionId` (e.g. `cycle-uuid` and `sess-uuid`).
- All phase transitions, execution logs, and `PhaseSnapshot`s are persisted hermetically inside `.harness/sessions/<session-id>/manifest.json`.

### 2.2 Git Worktree Workspace Isolation
- **Service:** `WorktreeIsolationProvider`
- When a parallel cycle is spawned, a new isolated Git worktree is created under `.worktrees/cycle-<cycle-id>` based on the repository's active HEAD branch.
- Child CLI subprocesses (Antigravity CLI, Claude Code, Copilot, Cursor) execute with `cwd` set to the isolated worktree directory.
- Upon cycle completion or abortion, temporary worktrees are safely dismantled and cleaned up.

### 2.3 Parallel Cycle Supervision
- **Coordinator:** `ParallelCycleCoordinator`
- Manages an in-memory registry of active parallel cycle workers up to a configurable concurrency limit (default: 4 concurrent cycles).
- Integrates with `ProcessTreeManager` for platform-safe subprocess spawning, environment token sanitization, and recursive process tree termination (`taskkill /t /f` on Windows, `SIGTERM`/`SIGKILL` process groups on POSIX).

---

## 3. REST & Server-Sent Events (SSE) API Specification

### 3.1 `POST /api/cycles/parallel`
Dispatches 1 to $N$ autonomous cycles concurrently.
- **Request Body:**
  ```json
  {
    "workspacePath": "C:/Users/psn_l/projetos/harness-kit",
    "cycles": [
      {
        "scope": "Implement REST endpoints for user authentication",
        "agent": "antigravity-cli",
        "category": "backend",
        "mode": "thinking"
      },
      {
        "scope": "Implement React login form and validation",
        "agent": "antigravity-cli",
        "category": "frontend",
        "mode": "thinking"
      }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "batchId": "batch-20260901-001",
    "dispatched": [
      {
        "cycleId": "cycle-a1b2c3d4",
        "sessionId": "sess-e5f6a7b8",
        "category": "backend",
        "status": "INITIALIZING",
        "worktreePath": ".worktrees/cycle-a1b2c3d4"
      },
      {
        "cycleId": "cycle-b2c3d4e5",
        "sessionId": "sess-f6a7b8c9",
        "category": "frontend",
        "status": "INITIALIZING",
        "worktreePath": ".worktrees/cycle-b2c3d4e5"
      }
    ]
  }
  ```

### 3.2 `GET /api/cycles/active`
Returns real-time manifests for all currently active parallel cycles.
- **Response (200 OK):**
  ```json
  {
    "activeCycles": [
      {
        "cycleId": "cycle-a1b2c3d4",
        "sessionId": "sess-e5f6a7b8",
        "category": "backend",
        "status": "RUNNING",
        "currentPhase": "DEVELOPMENT",
        "startedAt": "2026-09-01T12:00:00.000Z",
        "tokensUsed": 14500,
        "costEstimate": 0.22
      }
    ]
  }
  ```

### 3.3 `GET /api/cycles/events`
Multiplexed Server-Sent Events (SSE) stream broadcasting real-time events across all running cycles.
- **Event Schema:**
  ```
  event: cycle_update
  data: {
    "cycleId": "cycle-a1b2c3d4",
    "sessionId": "sess-e5f6a7b8",
    "type": "phase_change",
    "phase": "REVIEW",
    "timestamp": "2026-09-01T12:05:00.000Z"
  }
  ```

### 3.4 `POST /api/cycles/:cycleId/abort`
Aborts an individual running cycle.
- **Request Body:** `{ "reason": "Operator requested stop" }`
- **Response (200 OK):** `{ "cycleId": "cycle-a1b2c3d4", "status": "ABORTED" }`

---

## 4. Web UI — Parallel Swimlanes Dashboard View

1. **Parallel Swimlanes Canvas (`SwimlaneDashboardView`)**:
   - Fixed horizontal time scale header with zoom presets (`5m`, `15m`, `1h`, `auto`).
   - Distinct horizontal tracks for each parallel cycle, displaying its unique `sessionId` pill, runner category badge, and active phase indicator.
   - Dynamic pixel offsets and card widths calculated using duration projection pure functions.

2. **Parallel Dispatch Modal (`ParallelCycleModal`)**:
   - Allows operators to draft multiple tasks simultaneously with prompt descriptions, runner selection, and category tagging before triggering simultaneous execution.

3. **Cycle Inspection Drawer (`CycleDetailDrawer`)**:
   - Slide-over drawer displaying dedicated session logs, token consumption, recorded phase verdicts (Tech Lead & Adversarial QA scores), and individual control actions (Pause / Resume / Abort).

---

## 5. Security & Isolation Invariants

- **Zero Token Leakage:** Subprocess environment is passed through `filterSensitiveEnv` to remove all credentials and private keys.
- **No Orphan Subprocesses:** Cancellation triggers recursive OS process tree termination (`taskkill /t /f` or POSIX signal tree).
- **Workspace Hygiene:** Worktree directories are created outside the tracked source tree and cleaned up after execution.

---

## 6. Testing Strategy

1. **Unit Tests:**
   - `AutonomousCycleSession.spec.ts`: Validates 1:1 session/cycle aggregate root invariants and immutable phase snapshots.
   - `WorktreeIsolationProvider.spec.ts`: Tests worktree directory provisioning, branch naming, and cleanup routines.
   - `ParallelCycleCoordinator.spec.ts`: Tests concurrency limiting, active cycle tracking, and multiplexed event broadcasting.

2. **Integration & E2E Tests:**
   - `ParallelCycleExecution.e2e.spec.ts`: Launches 3 parallel cycles simultaneously, asserts distinct `sessionId`s and isolated worktrees, and verifies multiplexed SSE delivery.
   - `ParallelCycleAbort.e2e.spec.ts`: Stresses concurrent abortion of one cycle while sibling parallel cycles continue execution unaffected.
   - `ParallelSwimlanesView.spec.ts`: Verifies multi-lane rendering, dynamic time scale ruler, and filter pill actions.

# Design Document: Multi Autonomous Orchestration Hub with Spec Approval Gate

**Date:** 2026-09-02  
**Status:** Approved  
**Author:** Software Architect & Antigravity  
**Domain:** `multi_orchestration_hub`  

---

## 1. Executive Summary

Transforms the primary **Autonomous Orchestration Hub** (`/#/run`) from a single-job interface into a multi-task concurrent orchestrator. Operators can draft, initiate, and supervise multiple autonomous TDD tasks running in parallel. Each parallel task maintains its dedicated 1:1 Session ID, isolated Git Worktree, independent 6-phase TDD Pipeline Lifecycle, and filtered live terminal console. Furthermore, an interactive **Human-in-the-Loop Spec Approval Gate** pauses execution after Refinement/Planning until the human operator reviews and explicitly approves the tactical design and specifications before code generation begins.

---

## 2. Core Architectural Components

### 2.1 Multi-Task State Management (Client-Side)
- **Task Registry:** The frontend maintains a reactive array of parallel tasks:
  ```typescript
  interface ActiveOrchestrationTask {
    id: string              // cycleId
    sessionId: string       // 1:1 dedicated sessionId
    title: string           // task scope description
    category: string        // backend | frontend | qa | devops
    status: string          // INITIALIZING | RUNNING | WAITING_SPEC_APPROVAL | COMPLETED | ABORTED
    currentPhase: string    // BOOTSTRAP | REFINEMENT | PLANNING | DEVELOPMENT | REVIEW | MEMORY
    worktreePath: string
    specSummary?: string
    logs: string[]
  }
  ```
- **Active Task Tab Selection:** Switching tabs updates the pipeline tracker (`step-BOOTSTRAP` ... `step-MEMORY`), terminal logs, and action buttons without interrupting background executions of other sibling tasks.
- **"+ Nova Tarefa" Mode:** Selecting the plus tab reveals the launch form to configure a new task while background tasks continue processing.

### 2.2 Human-in-the-Loop Spec Approval Gate
- **Cycle Pause Point:** Upon completing `PLANNING`, the cycle state transitions to `WAITING_SPEC_APPROVAL`.
- **Interactive UI Banner:** A prominent banner appears above the terminal when the active task is in `WAITING_SPEC_APPROVAL`:
  - `👁️ Visualizar Spec`: Displays the generated tactical spec and architecture decisions.
  - `✅ Aprovar Spec e Iniciar Desenvolvimento`: Dispatches `POST /api/cycles/:cycleId/approve-spec`.
  - `✏️ Solicitar Ajustes`: Dispatches `POST /api/cycles/:cycleId/reject-spec` with feedback.
- Once approved, the task transitions to `RUNNING` on phase `DEVELOPMENT` and proceeds 100% autonomously through `REVIEW` and `MEMORY`.

### 2.3 Backend Endpoints
- `POST /api/cycles/parallel` — Dispatches 1 or more parallel tasks.
- `GET /api/cycles/active` — Lists all active tasks and their approval states.
- `POST /api/cycles/:cycleId/approve-spec` — Unlocks the cycle to enter `DEVELOPMENT`.
- `POST /api/cycles/:cycleId/reject-spec` — Records revision feedback and re-triggers `REFINEMENT`.
- `POST /api/cycles/:cycleId/abort` — Aborts an individual task, terminates its child process tree, and cleans up its worktree.
- `GET /api/cycles/events` — Multiplexed SSE stream delivering logs and phase updates keyed by `cycleId` and `sessionId`.

---

## 3. Testing & Validation Strategy

1. **Unit Tests:**
   - `ParallelCycleCoordinator.spec.ts`: Verify `approveSpec(cycleId)` and `rejectSpec(cycleId)` state transitions.
   - `MultiOrchestrationHub.spec.ts`: Verify tab switching, task creation, spec approval banner rendering, and terminal log segregation.
2. **Integration & E2E Tests:**
   - Test simultaneous dispatch of 2 parallel tasks in the Orchestration Hub.
   - Test approval of Spec for Task 1 while Task 2 is still refining.
   - Verify zero cross-talk between terminals and 1:1 session IDs.

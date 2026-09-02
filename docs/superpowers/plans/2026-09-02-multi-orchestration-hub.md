# Multi Autonomous Orchestration Hub with Spec Approval Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the primary Autonomous Orchestration Hub (`/#/run`) into a multi-task concurrent orchestrator supporting multiple parallel tasks with 1:1 sessions, segregated terminal logs, and a Human-in-the-Loop Spec Approval Gate.

**Architecture:** Clean Architecture with `ParallelCycleCoordinator` managing approval states (`WAITING_SPEC_APPROVAL`), REST endpoints for approval/rejection, and a reactive multi-task tab bar in `WebUiRenderer` managing independent pipelines and logs.

**Tech Stack:** TypeScript, Node.js v24, Vitest, Server-Sent Events (SSE).

## Global Constraints
- Node.js >= 18 runtime with loopback binding to `127.0.0.1`.
- Mandatory 1:1 mapping between `CycleId` and `SessionId`.
- No unescaped raw newlines or broken template literals in `WebUiRenderer.ts`.
- All tests executed with Vitest; minimum 85% coverage.

---

### Task 1: Spec Approval Gates in `ParallelCycleCoordinator` & `ParallelCycleRoutes`

**Files:**
- Modify: `sdk/src/server/application/use-cases/ParallelCycleCoordinator.ts`
- Modify: `sdk/src/server/adapters/inbound/http/routes/ParallelCycleRoutes.ts`
- Test: `sdk/src/server/application/use-cases/__tests__/ParallelCycleCoordinator.spec.ts`
- Test: `sdk/src/server/adapters/inbound/http/routes/__tests__/ParallelCycleRoutes.spec.ts`

- [x] **Step 1: Write failing unit test for `approveSpec` and `rejectSpec`**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `approveSpec` and `rejectSpec` in `ParallelCycleCoordinator` and wire HTTP routes**
- [x] **Step 4: Run test to verify it passes**

---

### Task 2: Multi-Task Tab Bar & Task Selection in `WebUiRenderer.ts`

**Files:**
- Modify: `sdk/src/server/adapters/inbound/http/web/WebUiRenderer.ts`

- [x] **Step 1: Add task tabs bar container `#parallelTasksTabBar` above the run form**
- [x] **Step 2: Add `+ Nova Tarefa` button and active task pill elements**
- [x] **Step 3: Implement client-side task switching logic in `<script>`**

---

### Task 3: Dynamic Pipeline Lifecycle & Segregated Terminal Logs per Task

**Files:**
- Modify: `sdk/src/server/adapters/inbound/http/web/WebUiRenderer.ts`

- [x] **Step 1: Track independent logs and currentPhase for each task in client memory**
- [x] **Step 2: Update `timelineTrackFill` and step badges when switching task tabs**
- [x] **Step 3: Filter incoming SSE events by active `cycleId` to populate active terminal**

---

### Task 4: Human-in-the-Loop Spec Approval Gate UI & Actions

**Files:**
- Modify: `sdk/src/server/adapters/inbound/http/web/WebUiRenderer.ts`

- [x] **Step 1: Add `#specApprovalBanner` card above the terminal**
- [x] **Step 2: Wire `btnApproveSpec` to send `POST /api/cycles/:cycleId/approve-spec`**
- [x] **Step 3: Wire `btnRejectSpec` to send `POST /api/cycles/:cycleId/reject-spec`**

---

### Task 5: End-to-End Verification & Server Restart

**Files:**
- Modify: `sdk/src/__tests__/e2e/ParallelCycleExecution.e2e.spec.ts`

- [x] **Step 1: Run unit and integration tests**
- [x] **Step 2: Recompile server and verify with `node:vm` syntax check**
- [x] **Step 3: Restart web server daemon and verify live in browser**

# Test Scenarios — harness-kit

**Domain:** workspace_initialization
**Project:** harness-kit
**Framework:** Vitest
**Date:** 2026-08-25

## Section 1 — Unit Tests

### 1.1 Value Objects and Types

**PhaseSteeringKey Validation:**
- [ ] Should validate `'user'`, `'bootstrap'`, `'planning'`, `'implementation'`, `'review'`, and `'memory'` as valid `PhaseSteeringKey` identifiers
- [ ] Should reject unsupported phase keys (e.g., `'deploy'`, `'testing'`) as invalid `PhaseSteeringKey`

**SteeringRulesPayload Validation:**
- [ ] Should construct valid `SteeringRulesPayload` containing string arrays for each supported phase
- [ ] Should trim leading/trailing whitespace and filter out empty string rule entries

**InitializeWorkspaceDTO Contract:**
- [ ] Should validate `InitializeWorkspaceDTO` when `workspacePath` is a valid string or omitted (defaulting to current working directory)
- [ ] Should accept optional `forceOverwrite` boolean flag defaulting to `false`
- [ ] Should accept optional `createSettings` boolean flag defaulting to `false`

**WorkspaceInitStatusDTO Contract:**
- [ ] Should construct immutable `WorkspaceInitStatusDTO` containing boolean flags for existing product dir, settings, and default steering rules

---

### 1.2 Domain Services and Use Cases

**compileSteeringRules:**
- [ ] Should combine default steering rules with custom steering rules for matching phases
- [ ] Should preserve default rules intact when custom rules for a phase are empty or omitted
- [ ] Should append custom rules without mutating original default rule arrays
- [ ] Should eliminate duplicate rule entries within the same phase array

**GetWorkspaceInitStatusUseCase:**
- [ ] Should return `hasExistingProduct: false` and `hasExistingSettings: false` when target workspace is uninitialized
- [ ] Should return `hasExistingProduct: true` when `docs/product/` directory exists in the workspace
- [ ] Should return `hasExistingSettings: true` when `.harness-kit/settings.json` exists in the workspace
- [ ] Should return pre-populated default steering rules for all six execution phases

**InitializeWorkspaceUseCase (Unit / Invariant Logic):**
- [ ] Should throw `ConflictError` when `docs/product/` exists and `forceOverwrite` is `false`
- [ ] Should invoke `ensureProductFiles()` and `saveBootstrapConfig()` when initializing clean workspace
- [ ] Should invoke `createLocalSettings()` when `createSettings` is `true` and settings file does not exist

**useWorkspaceInit Hook:**
- [ ] Should initialize wizard at `'detection'` step and trigger status query on mount
- [ ] Should advance from `'detection'` to `'overwrite_guard'` if `hasExistingProduct` is `true` and overwrite not yet acknowledged
- [ ] Should advance from `'detection'` to `'steering_editor'` when workspace is clean
- [ ] Should update draft steering rules when `updatePhaseRules(phase, rules)` is called
- [ ] Should set `isSubmitting: true` during initialization execution and transition to `'summary'` upon success

---

### 1.3 Components and UI Views

**SteeringRulesEditor Component:**
- [ ] Should render navigation tabs for all 6 execution phases (`user`, `bootstrap`, `planning`, `implementation`, `review`, `memory`)
- [ ] Should display default inherited rules as read-only badges and custom rules as editable list items
- [ ] Should allow adding new rule item via text input on Enter key press or Add button click
- [ ] Should allow removing individual custom rule items
- [ ] Should emit updated rules payload via `onChange` callback

**OverwriteGuardDialog Component:**
- [ ] Should render open dialog when `isOpen` is `true` with warning message regarding existing `docs/product/`
- [ ] Should invoke `onConfirm` callback when user clicks "Overwrite & Continue"
- [ ] Should invoke `onCancel` callback when user clicks "Cancel"

**InitStepper Component:**
- [ ] Should highlight active step indicator matching current `WizardStep`
- [ ] Should display completed checkmarks for previously passed wizard steps
- [ ] Should apply Itaú brand theme tokens (`--color-primary`) to active step markers

**InitWizardPage Component:**
- [ ] Should render stepper header, active step content, and Back/Next navigation footer
- [ ] Should disable Next button when current step contains invalid inputs
- [ ] Should display action buttons to navigate to `/run` or view summary on the final step

---

## Section 2 — Integration Tests

### 2.1 File State Management and Provisioning

- [ ] Should create all essential tracking files (`DEVELOPMENT-STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `BACKLOG.md`) in `docs/product/`
- [ ] Should write valid JSON to `BOOTSTRAP-CONFIG.json` containing compiled `steeringRules` structure
- [ ] Should create `.harness-kit/settings.json` with valid default settings schema when requested
- [ ] Should recursively remove and re-create `docs/product/` when `forceOverwrite` is `true`

---

### 2.2 HTTP Inbound API and Concurrency Locks

**GET /api/workspace/init/status:**
- [ ] Should return HTTP 200 with `WorkspaceInitStatusDTO` JSON body
- [ ] Should accept optional `?path=` query parameter targeting specific workspace folder

**POST /api/workspace/init:**
- [ ] Should return HTTP 201 with `WorkspaceInitResultDTO` when clean workspace is initialized
- [ ] Should return HTTP 409 Conflict when `docs/product/` exists and `forceOverwrite` is missing or `false`
- [ ] Should return HTTP 423 Locked / 409 Conflict when `WorkspaceLockManager` detects an active orchestrator job running on the workspace
- [ ] Should return HTTP 400 Bad Request when request body contains malformed JSON or invalid phase keys

---

### 2.3 Wizard Step Flow and API Integration

- [ ] Should fetch status on load, display existing file warnings, and submit compiled configuration to backend API
- [ ] Should handle API 500 error gracefully by displaying error banner without resetting user input in the form
- [ ] Should populate default steering rules received from server inspection endpoint into the UI editor

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

- [ ] **Should complete full interactive workspace initialization on a new project**
  - Given: A clean workspace directory without existing `docs/product/` or `.harness-kit/`
  - When: User opens initialization wizard, reviews default steering rules, adds custom rule to `implementation` phase, toggles settings creation, and clicks "Initialize Workspace"
  - Then: Server creates `docs/product/` tracking files, writes `BOOTSTRAP-CONFIG.json` with merged rules, creates `.harness-kit/settings.json`, and wizard transitions to Summary step displaying success message and "Start Run" action button

- [ ] **Should overwrite existing workspace after explicit user confirmation in wizard**
  - Given: An existing workspace containing old `docs/product/` files
  - When: User navigates to initialization wizard, sees overwrite guard warning, confirms "Overwrite Existing Workspace", and submits initialization
  - Then: Server replaces previous `docs/product/` contents with fresh tracking templates, saves new `BOOTSTRAP-CONFIG.json`, and returns HTTP 201 with list of provisioned files

---

### 3.2 Alternative and Error Flows

- [ ] **Should reject initialization without overwriting when forceOverwrite flag is false**
  - Given: An existing workspace with `docs/product/` present
  - When: A POST request to `/api/workspace/init` is made with `forceOverwrite: false`
  - Then: Server rejects request with HTTP 409 Conflict, returns error message indicating existing files, and makes no changes to filesystem

- [ ] **Should abort initialization wizard when user cancels overwrite guard dialog**
  - Given: Wizard displays overwrite guard dialog for detected existing files
  - When: User clicks "Cancel" in the dialog
  - Then: Dialog closes, wizard step remains on detection screen, and no API mutation is triggered

- [ ] **Should display actionable error when target workspace path is invalid or non-writable**
  - Given: User specifies a read-only or invalid workspace path
  - When: User attempts to inspect or initialize the workspace
  - Then: Server returns HTTP 400 with descriptive error code and wizard renders inline error alert

---

### 3.3 Security & Concurrency Scenarios

- [ ] **Should reject path traversal attempts targeting directories outside workspace boundary**
  - Given: Request payload contains `workspacePath: "../../../sensitive/folder"`
  - When: `InitializeWorkspaceUseCase` validates the request
  - Then: Use case rejects execution with HTTP 400 Bad Request and logs security validation warning

- [ ] **Should block initialization when orchestrator execution job is currently active in workspace**
  - Given: An autonomous TDD orchestrator job is currently running in the target workspace holding `WorkspaceLockManager` lock
  - When: User triggers workspace initialization via Web UI or API
  - Then: Request is rejected with HTTP 423 Locked / 409 Conflict indicating active execution, preventing file corruption or race conditions

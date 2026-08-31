# Test Scenarios — harness-kit

**Domain:** settings_management
**Project:** harness-kit
**Framework:** Vitest
**Date:** 2026-08-27

## Section 1 — Unit Tests

### 1.1 Value Objects and Domain Models

**SettingsScope Validation:**
- [ ] Should validate `'global'` and `'local'` as valid `SettingsScope` instances
- [ ] Should reject unknown string values (e.g., `'system'`, `'temp'`) as invalid `SettingsScope`

**HarnessSettingsMap & RunnerSettings Contracts:**
- [ ] Should construct `RunnerSettings` with valid positive `timeoutMs` (e.g., `120000`)
- [ ] Should reject `RunnerSettings` when `timeoutMs` is zero, negative, or non-finite
- [ ] Should construct `PhaseSettings` with optional `model`, `effort`, and positive `timeoutMs`
- [ ] Should allow empty `PhaseSettings` object representing default phase fallback

**SettingsDiagnostic Contract:**
- [ ] Should construct valid `SettingsDiagnostic` with `valid = true` and empty `errors` array
- [ ] Should construct invalid `SettingsDiagnostic` with `valid = false` and descriptive error paths and line numbers

### 1.2 Domain Services and Validation Logic

**validateSettingsMap:**
- [ ] Should return valid diagnostic for canonical `DEFAULT_SETTINGS` object
- [ ] Should report error when root payload is not a valid JSON object (e.g., null, array, primitive)
- [ ] Should report error when runner timeout is negative or non-numeric
- [ ] Should report error when phase timeout is negative or non-numeric
- [ ] Should pass validation for custom runner keys when runner structure conforms to `RunnerSettings`

**AtomicSettingsWriter:**
- [ ] Should write settings content to temporary `.tmp` file and atomically rename to target path
- [ ] Should preserve existing target file if write to `.tmp` fails or throws an exception
- [ ] Should create parent directory recursively if target directory does not exist

### 1.3 Hooks and State Services

**useSettings:**
- [ ] Should initialize with default `'global'` scope and load corresponding settings
- [ ] Should switch active scope to `'local'` and trigger settings fetch for local workspace
- [ ] Should mark state as `isDirty = true` when draft configuration is modified from original
- [ ] Should reset `isDirty = false` after successful save or discard action
- [ ] Should synchronize edits between structured form draft and raw JSON text representation
- [ ] Should debounce validation when raw JSON text is modified

**SettingsApiClient:**
- [ ] Should serialize scope query parameter correctly for `GET /orchestrator/settings`
- [ ] Should map 400 Bad Request error response to structured `SettingsDiagnostic`
- [ ] Should handle network disconnection gracefully and expose error message to state hook

### 1.4 UI Components

**ScopeSelector:**
- [ ] Should render Global and Local scope tab buttons with proper `aria-pressed` states
- [ ] Should trigger `onSelect` callback with `'local'` when Local tab button is clicked
- [ ] Should trigger `onSelect` callback with `'global'` when Global tab button is clicked

**SettingsFormEditor:**
- [ ] Should render runner configuration cards for each configured agent runner
- [ ] Should render input fields for base timeout, model name, effort level, and per-phase timeouts
- [ ] Should trigger `onChange` callback with updated `HarnessSettingsMap` when input values change

**RawJsonEditor:**
- [ ] Should render JSON editor with line numbers and syntax highlighting
- [ ] Should display inline error markers and diagnostic list when JSON syntax or schema is invalid
- [ ] Should trigger `onChange` callback on text input

**SettingsConfirmModal:**
- [ ] Should render modal title, warning description, and target file path for Renew and Delete actions
- [ ] Should call `onConfirm` callback when confirm button is clicked
- [ ] Should call `onCancel` callback when cancel button or backdrop is clicked

---

## Section 2 — Integration Tests

### 2.1 Backend Use Cases and Filesystem Persistence

**GetSettingsUseCase:**
- [ ] Should load global settings from `~/.config/harness-kit/settings.json` when scope is `'global'`
- [ ] Should load project settings from `.harness-kit/settings.json` when scope is `'local'`
- [ ] Should auto-create global settings with `DEFAULT_SETTINGS` if file does not exist
- [ ] Should return `DEFAULT_SETTINGS` fallback if local file is missing or contains invalid JSON

**UpdateSettingsUseCase:**
- [ ] Should persist updated settings to target file path atomically
- [ ] Should update specific agent runner configuration while preserving unmodified runners
- [ ] Should update phase overrides (`model`, `effort`) for specified phases
- [ ] Should reject request with HTTP 400 when `project` identifier is missing for local scope
- [ ] Should reject request with HTTP 400 when `timeoutMs` is negative or non-finite

**RenewSettingsUseCase:**
- [ ] Should recreate target `settings.json` with canonical `DEFAULT_SETTINGS`
- [ ] Should overwrite corrupted or modified settings file and return renewed payload

**DeleteSettingsUseCase:**
- [ ] Should delete target `settings.json` from filesystem and return success status
- [ ] Should handle deletion of non-existent file gracefully without throwing an exception

### 2.2 Frontend API and State Integration

- [ ] Should fetch and render settings upon initial mount of `SettingsView`
- [ ] Should submit updated draft to backend via `POST /orchestrator/settings` on Save action
- [ ] Should trigger `RenewSettingsUseCase` via API and refresh UI state upon modal confirmation
- [ ] Should trigger `DeleteSettingsUseCase` via API and display empty file state upon modal confirmation

### 2.3 Web Shell and Theme Integration (External Dependency)

- [ ] Should render form controls, tab buttons, code editor, and modals using Itaú design tokens
- [ ] Should maintain WCAG AA contrast ratio ≥ 4.5:1 across all form inputs, labels, and buttons in both light and dark modes

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

- [ ] **Should view and update settings in Form Editor mode with atomic persistence**
  - Given: Local project with `.harness-kit/settings.json` exists
  - When: User navigates to `/settings`, modifies `antigravity` base timeout to `180000`, and clicks "Save Settings"
  - Then: Backend saves updated configuration atomically, UI displays success toast, and `isDirty` flag resets to `false`

- [ ] **Should switch between Global and Local scopes seamlessly**
  - Given: User is viewing Local settings in `SettingsView`
  - When: User clicks "Global" scope selector tab
  - Then: UI loads and displays configuration from `~/.config/harness-kit/settings.json` without page reload

- [ ] **Should edit settings in Raw JSON mode with real-time schema validation**
  - Given: User switches to Raw JSON mode in `SettingsView`
  - When: User modifies phase `model` to `"gemini-2.5-pro"` and clicks "Save Settings"
  - Then: Valid configuration is persisted to disk and synchronized with Form Editor view

- [ ] **Should renew settings to defaults after modal confirmation**
  - Given: Local `settings.json` contains customized overrides
  - When: User clicks "Renew Defaults" and confirms in modal dialog
  - Then: Backend overwrites `.harness-kit/settings.json` with `DEFAULT_SETTINGS` and form resets to defaults

### 3.2 Alternative and Error Flows

- [ ] **Should block saving and display inline errors when schema validation fails**
  - Given: User is in Raw JSON mode
  - When: User enters negative timeout `"timeoutMs": -1000` or invalid JSON syntax
  - Then: Save button is disabled, inline diagnostic badge shows validation error, and no file write occurs

- [ ] **Should handle missing local settings file with creation prompt**
  - Given: Local project has no `.harness-kit/settings.json` file
  - When: User opens Local settings scope
  - Then: UI displays "File does not exist" state with button to "Create Local Settings"

### 3.3 Security & File Integrity Scenarios

- [ ] **Should reject path traversal attempts in project parameter**
  - Given: HTTP client sends `GET /orchestrator/settings?project=../../etc/passwd`
  - When: `GetSettingsUseCase` executes
  - Then: Request is rejected with HTTP 400 Bad Request / Path Traversal Detected

- [ ] **Should guarantee file integrity during interrupted write operations**
  - Given: `AtomicSettingsWriter` begins writing temporary file
  - When: Write stream is aborted before completion
  - Then: Existing `settings.json` remains completely intact and valid on disk

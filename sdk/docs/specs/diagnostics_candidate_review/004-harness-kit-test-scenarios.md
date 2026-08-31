# Test Scenarios — harness-kit

**Domain:** diagnostics_candidate_review
**Project:** harness-kit
**Framework:** Vitest 4.1.10
**Date:** 2026-08-27

## Section 1 — Unit Tests

### 1.1 Components and State Controllers

#### `DiagnosticsDashboard`
- [ ] Should disable batch execution button when pending session count is zero
  - Given: A `DiagnosticsDashboard` initialized with an empty pending sessions list
  - When: The dashboard view renders
  - Then: The "Run Diagnose Batch" trigger button is rendered in disabled state
- [ ] Should display active progress bar and step counts when batch execution is running
  - Given: A batch execution in progress with 4 processed and 2 remaining sessions
  - When: The `DiagnosticsDashboard` receives batch progress state updates
  - Then: A progress bar is displayed showing 66% completion with processed and remaining counters
- [ ] Should render `DiagnoseReportView` with generated trace session IDs when report is returned
  - Given: A completed `DiagnoseReportDTO` containing 2 generated trace sessions
  - When: The batch run finishes successfully
  - Then: The report summary displays the total processed count and clickable trace session IDs

#### `CandidateList` and `CandidateDetailModal`
- [ ] Should render candidate cards with appropriate status badges (`PROPOSED`, `APPLIED`, `PROMOTED`)
  - Given: A list of candidates with distinct statuses
  - When: `CandidateList` renders the catalog
  - Then: Each card displays the candidate ID, target skill tag, and color-coded status badge
- [ ] Should filter candidate cards when status filter is selected
  - Given: A candidate list containing 3 `PROPOSED` and 2 `PROMOTED` candidates
  - When: The user selects the `PROPOSED` filter pill
  - Then: Only the 3 `PROPOSED` candidates are visible in the grid
- [ ] Should open `CandidateDetailModal` with diff preview when candidate card is clicked
  - Given: A candidate card for `candidate-2026-08-27-001`
  - When: The user clicks the candidate card
  - Then: `CandidateDetailModal` opens displaying rationale, prompt diff, and promotion actions

### 1.2 Value Objects and DTOs

#### `DiagnoseBatchRunOptions`
- [ ] Should validate batch size is a positive integer greater than or equal to 1
  - Given: A batch options payload with `batchSize = 0` or negative numbers
  - When: `DiagnoseBatchRunOptions` is validated
  - Then: Validation rejects the payload with an invalid batch size error
- [ ] Should accept valid runner and model override strings
  - Given: A payload with `agentType: "claude-cli"` and `model: "claude-3-7-sonnet"`
  - When: `DiagnoseBatchRunOptions` is constructed
  - Then: Properties are assigned and validated as immutable strings

#### `CandidateSummaryDTO` and `CandidateDetailDTO`
- [ ] Should reject candidate ID strings not matching `candidate-YYYY-MM-DD-NNN` pattern
  - Given: A raw candidate ID string `"invalid-candidate-name"`
  - When: `CandidateSummaryDTO` schema validation executes
  - Then: Validation throws a pattern mismatch exception
- [ ] Should guarantee immutability of candidate detail fields
  - Given: A valid `CandidateDetailDTO` instance
  - When: A consumer attempts to mutate `promptDiff` or `targetSkill`
  - Then: The object prevents property reassignment

### 1.3 Custom Hooks and Actions

#### `useDiagnostics`
- [ ] Should initialize with empty state and trigger API fetch on mount
  - Given: A clean mount of `useDiagnostics`
  - When: The hook initializes
  - Then: `pendingSessions` is empty, `isLoading` is true, and `getSessions()` is invoked
- [ ] Should update progress state when receiving SSE batch progress event
  - Given: An active SSE event stream connection
  - When: A `DiagnoseBatchProgress` event payload is dispatched
  - Then: Hook state updates `progress` with new `processed` and `remaining` numbers

#### `useCandidates` and `useCandidateDetail`
- [ ] Should load candidate details and format CLI runner command preview
  - Given: A valid `candidateId`
  - When: `useCandidateDetail` loads metadata
  - Then: It provides the `CandidateDetailDTO` and a formatted `hrns candidate review <id>` command string
- [ ] Should transition `isPromoting` state during autonomous candidate promotion
  - Given: A candidate ready for promotion
  - When: `promoteAutonomous()` is invoked
  - Then: `isPromoting` transitions to true and reverts to false upon API completion

### 1.4 Domain Events and Message Payloads

#### `DiagnoseBatchProgress` and `CandidateStatusChanged`
- [ ] Should construct `DiagnoseBatchProgress` with mandatory numeric counts
  - Given: Progress telemetry from `DiagnoseService`
  - When: `DiagnoseBatchProgress` event is created
  - Then: Payload contains non-negative `processed`, `remaining`, and `total` integers
- [ ] Should emit `CandidateStatusChanged` when candidate promotion completes
  - Given: Successful autonomous LLM promotion of a candidate
  - When: `promoteCandidateAutonomous` finishes
  - Then: `CandidateStatusChanged` is emitted with `candidateId`, `targetSkill`, and new status

---

## Section 2 — Integration Tests

### 2.1 Repositories and Disk Adapters

#### `JsonlSessionLedger` Adapter
- [ ] Should load only records with `status === 'pending'` from `diagnose-sessions.jsonl`
  - Given: A JSONL ledger file containing 3 pending and 5 processed session records
  - When: `loadPending()` is executed
  - Then: Exactly 3 records are returned with all metadata intact
- [ ] Should atomically update session statuses from `pending` to `processed` without corrupting other records
  - Given: 2 session IDs processed in a batch
  - When: `rewriteBatchStatuses(ids, 'processed')` is called
  - Then: The JSONL file is atomically overwritten with updated statuses while preserving unselected lines

#### `CandidateReader` Adapter
- [ ] Should scan `docs/harness-history/candidates/` and parse all valid candidate directories
  - Given: 4 candidate directories on disk with `candidate.json` and prompt diff files
  - When: `listCandidates()` and `readCandidateFromDisk()` are called
  - Then: All 4 candidates are parsed with correct `targetSkill`, `rationale`, and `status`
- [ ] Should verify candidate status against active skill file to determine `APPLIED` vs `PROMOTED`
  - Given: A candidate whose prompt modifications match the active skill file
  - When: `getCandidateStatus()` evaluates the skill file on disk
  - Then: The status resolves to `PROMOTED`

### 2.2 Use Cases and API Routes

#### `DiagnosticsController` Endpoints
- [ ] Should return 200 OK with pending session list on `GET /api/diagnose/sessions`
  - Given: A populated `diagnose-sessions.jsonl` ledger
  - When: HTTP request `GET /api/diagnose/sessions` is made
  - Then: Response status is 200 and body contains JSON array of `DiagnoseSessionDTO`
- [ ] Should stream batch progress events and return final report on `POST /api/diagnose/run`
  - Given: Valid `DiagnoseBatchRunOptions`
  - When: HTTP request `POST /api/diagnose/run` is executed
  - Then: Response streams SSE progress events and concludes with 200 OK and `DiagnoseReportDTO`
- [ ] Should return 404 Not Found when requesting non-existent candidate on `GET /api/diagnose/candidates/:id`
  - Given: A candidate ID `"candidate-2099-01-01-999"` not present on disk
  - When: HTTP request `GET /api/diagnose/candidates/:id` is made
  - Then: Response status is 404 with a structured error message

### 2.3 External Integrations and Runners

#### `MetaHarnessAgentAdapter` Integration
- [ ] Should invoke Meta-Harness agent in non-interactive mode for autonomous candidate promotion
  - Given: A valid candidate ID and target skill
  - When: `promoteCandidateAutonomous` is called with runner `"claude-cli"`
  - Then: `MetaHarnessAgentAdapter.invokeCandidatePromotion` executes with non-interactive flag and returns success result
- [ ] Should capture adapter errors and return structured failure DTO without crashing server
  - Given: An agent runner CLI failure (e.g., rate limit or process timeout)
  - When: `promoteCandidateAutonomous` is executed
  - Then: Returns `{ success: false, error: "Rate limit exceeded" }` with status 500

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

#### Complete Diagnostics Batch Execution Flow
- [ ] Should execute full diagnostics cycle and display generated trace sessions
  - Given: A workspace with 6 pending diagnose sessions in `docs/product/diagnose-sessions.jsonl`
  - When: The developer visits `/diagnose`, selects batch size 3, and clicks "Run Diagnose Batch"
  - Then: The UI displays real-time progress for batch 1 (3/6) and batch 2 (6/6), marks sessions processed, and renders final report with generated trace IDs

#### Candidate Review and Autonomous Promotion Flow
- [ ] Should review candidate diff and apply autonomous promotion to active skill
  - Given: A `PROPOSED` candidate in `docs/harness-history/candidates/candidate-2026-08-27-001` targeting `tdd-orchestrator`
  - When: The developer navigates to `/candidates`, opens the candidate detail modal, inspects the prompt diff, and clicks "Apply via LLM"
  - Then: The backend delegates promotion to `MetaHarnessAgentAdapter`, updates target skill file on disk, and updates the UI status badge to `PROMOTED`

### 3.2 Alternative and Error Flows

- [ ] Should display informational notice when no pending diagnose sessions exist
  - Given: An empty `diagnose-sessions.jsonl` ledger
  - When: The user visits `/diagnose`
  - Then: The UI displays "No pending diagnose sessions found" with disabled execution triggers
- [ ] Should handle promotion failure gracefully and display error banner
  - Given: A corrupted candidate folder missing prompt diff files
  - When: The user attempts to promote the candidate
  - Then: The UI shows an error notification without altering skill files or corrupting state

### 3.3 Security Scenarios

- [ ] Should reject directory traversal attempts in candidate ID path parameter
  - Given: An HTTP request to `GET /api/diagnose/candidates/..%2F..%2Fetc%2Fpasswd`
  - When: `DiagnosticsController` parses the request
  - Then: The request is blocked with HTTP 400 Bad Request
- [ ] Should sanitize sensitive environment variables and tokens from trace summaries and logs
  - Given: Session logs containing API keys or environment tokens
  - When: DTOs are formatted for API responses and UI presentation
  - Then: Sensitive tokens matching credential patterns are redacted (`[REDACTED]`)
- [ ] Should prevent shell injection in candidate promotion runner commands
  - Given: Malicious input in model or runner arguments containing shell delimiters (`;`, `&&`, `|`)
  - When: The promotion command is built
  - Then: Arguments are strictly sanitized and validated against allowed runner presets
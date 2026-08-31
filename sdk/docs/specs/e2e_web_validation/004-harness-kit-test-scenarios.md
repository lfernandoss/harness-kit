# Test Scenarios — harness-kit

**Domain:** e2e_web_validation
**Project:** harness-kit
**Framework:** Vitest ^4.1.10 & Playwright
**Date:** 2026-08-27

## Section 1 — Unit Tests

### Subsection 1.1 — Aggregates and Fixtures

**Creation and Initialization:**
- [ ] Should initialize `E2ETestEnvironment` successfully when valid `TestEnvironmentConfig` is provided
  - Given: A valid `TestEnvironmentConfig` with `timeoutMs: 30000` and fixture template name
  - When: `E2ETestEnvironment` is constructed
  - Then: Internal state is configured to manage sandbox lifecycle and dynamic ports

- [ ] Should reject `E2ETestEnvironment` creation when timeout is non-positive
  - Given: A `TestEnvironmentConfig` with `timeoutMs <= 0`
  - When: `E2ETestEnvironment` construction is attempted
  - Then: It throws a validation error and aborts initialization

**State Transitions and Cleanup:**
- [ ] Should transition `E2ETestEnvironment` to ACTIVE when setup completes successfully
  - Given: An initialized `E2ETestEnvironment`
  - When: `setup()` is invoked
  - Then: Ephemeral sandbox is provisioned, test server is running, and `TestServerInstance` is returned

- [ ] Should transition `E2ETestEnvironment` to TORN_DOWN and emit `TestTeardownCompleted` on teardown
  - Given: An active `E2ETestEnvironment` with running test server and sandbox directory
  - When: `teardown()` is invoked
  - Then: Server process tree is killed, temp directory is removed, and `TestTeardownCompleted` is emitted

### Subsection 1.2 — Value Objects and DTOs

**Validation:**
- [ ] Should instantiate `TestServerInstance` successfully when host is strictly 127.0.0.1 and port is valid
  - Given: `host = "127.0.0.1"`, `port = 34567`, and valid base URL
  - When: `TestServerInstance` is constructed
  - Then: Immutable instance is created holding assigned network coordinates

- [ ] Should reject `TestServerInstance` when host is not 127.0.0.1
  - Given: `host = "0.0.0.0"` or external interface IP
  - When: `TestServerInstance` construction is attempted
  - Then: Throws security invariant violation error

- [ ] Should instantiate `MultiTabConflictResult` when status code is 409
  - Given: `activeJobId = "job-123"`, `rejectedStatusCode = 409`, `isLocked = true`
  - When: `MultiTabConflictResult` is created
  - Then: Represents verified singleton workspace lock state

**Equality and Immutability:**
- [ ] Should consider two `A11yAuditResult` instances equal when violation counts, modes, and contrast ratios match
  - Given: Two `A11yAuditResult` instances with `violations: 0`, `mode: "dark"`, `contrastRatio: 5.2`
  - When: Compared for equality
  - Then: Returns true

### Subsection 1.3 — Domain Services and Verifiers

- [ ] Should return unique directory path when `createEphemeralSandbox` is invoked
  - Given: A valid mock template name
  - When: `createEphemeralSandbox` executes
  - Then: Creates isolated temp directory and returns absolute path

- [ ] Should pass verification when `auditA11yAndTokens` finds zero WCAG AA violations
  - Given: A rendered page in light or dark theme mode
  - When: `auditA11yAndTokens` executes axe-core contrast assertions
  - Then: Returns `A11yAuditResult` with `passesAA: true` and `violations: 0`

### Subsection 1.4 — Domain Events

- [ ] Should contain mandatory metadata in `TestSandboxProvisioned` event
  - Given: A newly created ephemeral workspace sandbox
  - When: `TestSandboxProvisioned` is emitted
  - Then: Event contains `sandboxPath`, `template`, and timestamp

- [ ] Should contain server network info in `TestServerReady` event
  - Given: A successfully started test server instance
  - When: `TestServerReady` is emitted
  - Then: Event contains `baseUrl`, `port`, `host: "127.0.0.1"`, and is immutable

---

## Section 2 — Integration Tests

### Subsection 2.1 — Adapters and Fixture Integrations

- [ ] Should populate and remove sandbox directory using `ISandboxFileSystemAdapter`
  - Given: A fixture template with mock files
  - When: `copyTemplate()` and subsequently `purgeDir()` are executed
  - Then: Files are copied into temp directory and completely deleted upon purge

- [ ] Should spawn and terminate test server process using `ITestServerProcess`
  - Given: A sandbox workspace path and dynamic port
  - When: `spawnServer()` is called, followed by `killProcessTree()`
  - Then: Server responds to HTTP requests while active and terminates all child runners on kill

- [ ] Should launch headless browser and open test page using `IBrowserDriverAdapter`
  - Given: A running test server URL
  - When: `launchBrowser()` and `newPage()` are executed
  - Then: Playwright browser context opens the page and returns interactive `Page` handle

### Subsection 2.2 — Verifier Use Cases

- [ ] Should verify full orchestration run flow from start to completion
  - Given: Headless browser page navigated to `/run` with test server connected to mock workspace
  - When: `verifyOrchestrationWorkflow` clicks "Start Run" and observes SSE events
  - Then: Status transitions to `RUNNING`, streaming logs populate DOM, and final status reaches `COMPLETED`

- [ ] Should verify multi-tab conflict handling across concurrent tabs
  - Given: Two browser tabs opened to `/run` on the same test server instance
  - When: `verifyMultiTabResilience` starts execution on Tab 1 and triggers run on Tab 2
  - Then: Tab 2 receives HTTP 409 Conflict, displays lock banner, and does not corrupt workspace state

### Subsection 2.3 — External System Integrations

- [ ] Should connect to real Node.js HTTP/SSE server and receive streaming log deltas
  - Given: Live `WebServerHost` running on dynamic port on `127.0.0.1`
  - When: Headless browser connects to SSE endpoint `/api/orchestration/events`
  - Then: Event stream delivers valid JSON progress deltas with ANSI formatted text

---

## Section 3 — Functional Tests

### Subsection 3.1 — Happy Path Flows

- [ ] **Should execute full orchestration run and display real-time progress when user clicks Start Run**
  - Given: Web application loaded in browser at `/run` connected to an ephemeral workspace sandbox
  - When: User clicks the "Start Run" button in the UI
  - Then: Status badge updates to `RUNNING`, phase progress bar advances, terminal output streams ANSI logs in real time, and final status reaches `COMPLETED`

- [ ] **Should toggle Itaú theme between light and dark without contrast violations when user clicks Theme Toggle**
  - Given: Web application loaded with default Itaú light theme
  - When: User clicks the accessible Theme Toggle button in the `WorkspaceHeader`
  - Then: Root `data-theme` attribute transitions to `dark`, background and surface colors update, and automated axe-core audit confirms zero WCAG AA contrast violations (ratio >= 4.5:1)

- [ ] **Should navigate between settings, reports, diagnostics, and candidates routes and render data from SDK use cases**
  - Given: Web application loaded in browser
  - When: User clicks navigation links in `ResponsiveSidebar` for `/settings`, `/reports`, `/diagnose`, and `/candidates`
  - Then: Each route renders appropriate view components populated with backend DTOs

### Subsection 3.2 — Alternative and Error Flows

- [ ] **Should display 409 Conflict notification and preserve active job when second browser tab attempts concurrent execution**
  - Given: Active orchestration run in progress on Tab 1
  - When: User opens Tab 2 on the same workspace and clicks "Start Run"
  - Then: Tab 2 receives HTTP 409 Conflict with clear banner indicating active lock, while Tab 1 execution continues unaffected

- [ ] **Should terminate full subprocess tree when user clicks Cancel Run button in UI**
  - Given: Orchestration run actively executing subagent runner processes
  - When: User clicks the "Cancel Run" button in the web interface
  - Then: UI sends cancel command, server issues `taskkill /t` / `SIGKILL` to subprocess tree, status transitions to `HALTED`, and no orphaned processes remain

### Subsection 3.3 — Security & Resilience Scenarios

- [ ] **Should maintain active background execution and replay logs when browser tab is closed and reopened**
  - Given: Orchestration run actively executing on server
  - When: User closes the browser tab, waits 2 seconds, and opens a new tab navigating back to `/run`
  - Then: UI automatically reconnects to running job, replays buffered log stream, and resumes live progress updates without aborting the background task

- [ ] **Should prevent binding to non-localhost interfaces during E2E test runs**
  - Given: E2E test runner starting test server controller
  - When: Test server initializes TCP socket
  - Then: Socket binds strictly to `127.0.0.1`, and external network requests from outside localhost are blocked

- [ ] **Should filter sensitive tokens and environment variables from rendered DOM logs**
  - Given: Agent process generating logs containing simulated API keys or tokens
  - When: Logs stream to browser terminal view
  - Then: Sensitive strings are masked or filtered before DOM insertion, verifying privacy protection

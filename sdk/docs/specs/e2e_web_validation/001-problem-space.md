# Strategic Design — Problem Space: End-to-End Web Integration & Verification

**Domain:** e2e_web_validation | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event | Command | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `EphemeralSandboxCreated` | `CreateSandbox` | `E2ETestEnvironment` | OS File System | Sandbox Path |
| 2 | `TestServerStarted` | `StartTestServer` | `TestServerController` | Node HTTP / TCP | Server Base URL |
| 3 | `BrowserSessionLaunched` | `LaunchBrowser` | `BrowserAutomationDriver` | Headless Chromium | Browser Context |
| 4 | `OrchestrationFlowVerified` | `VerifyOrchestration` | `OrchestrationVerifier` | REST / SSE Stream | Status & Logs |
| 5 | `MultiTabConflictVerified` | `VerifyConcurrency` | `ResilienceVerifier` | Tabs / Lock Manager | HTTP 409 State |
| 6 | `ReconnectionFlowVerified` | `VerifyReconnection` | `ResilienceVerifier` | Background Job / SSE | Log Replay State |
| 7 | `ThemeA11yAudited` | `AuditA11yAndTheme` | `A11yThemeAuditor` | Axe-Core / DOM | A11y / Token Report |
| 8 | `FeatureViewsVerified` | `VerifyFeatureViews` | `FeatureSuiteVerifier` | SDK Diagnostics / APIs | View Assertions |
| 9 | `E2ESuiteCompleted` | `ExecuteE2ESuite` | `E2ETestRunner` | CI / Test Reporter | E2E Summary Report |
| 10 | `TestEnvironmentTornDown` | `TeardownEnvironment` | `E2ETestEnvironment` | OS Process / FS | Cleanup Status |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Orchestration & Workflow Verification** | Core | Validates real-time SSE streaming, interactive steering, singleton workspace locks, and job lifecycle. |
| **Multi-Tab & Reconnection Resilience** | Core | Validates background jobs survive client disconnects/reloads and verifies HTTP 409 conflict on concurrent tabs. |
| **Accessibility & Theme Auditing** | Supporting | Verifies WCAG AA contrast (4.5:1) and DOM tokens for Itaú light/dark themes via browser audits. |
| **Hermetic Sandbox & Lifecycle** | Supporting | Manages ephemeral test workspaces, dynamic port assignment, and guaranteed recursive process tree cleanup. |
| **Browser Automation Adapter** | Generic | Standard Playwright/Chromium driver automation and test runner reporting. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `E2ETestEnvironment` | Coordinates isolated workspace, dynamic port, and local server. | Controls lifecycle. |
| `EphemeralWorkspaceSandbox` | Temporary on-disk directory with mock project files for tests. | Purged after test run. |
| `TestServerController` | Programmatic manager starting/stopping `sdk-web` on ephemeral ports. | Binds strictly to `127.0.0.1`. |
| `BrowserAutomationDriver` | Headless browser client executing UI interactions and assertions. | Uses Playwright. |
| `OrchestrationVerifier` | Verifies job start, real-time SSE events, and log streaming. | Validates execution flow. |
| `ResilienceVerifier` | Checks 409 conflict, tab closing/reconnect, and job persistence. | Verifies background jobs. |
| `A11yThemeAuditor` | Validates Itaú color tokens and WCAG AA 4.5:1 contrast. | Uses axe-core. |
| `SubprocessTreeTeardown` | Kills child runners and agent processes recursively. | Uses `taskkill /t` or `SIGKILL`. |
| `DynamicPortAllocator` | Allocates free local TCP ports for parallel test execution. | Avoids port conflicts. |
| `E2ETestReport` | Structured JSON/JUnit summary of test durations and results. | Consumed by CI gates. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does the E2E suite guarantee mock runs never mutate developer repository files or global configs?
- How is deterministic synchronization achieved between asynchronous SSE streams and DOM assertions without sleep timeouts?

**Scalability and Performance**
- How does the harness prevent CPU/memory exhaustion when running parallel headless browser contexts and test servers?
- How are large ANSI log streams (10k+ lines) verified in DOM without causing renderer lockups or test timeouts?

**Security and Sensitive Data**
- Why must test server instances bind exclusively to `127.0.0.1` on ephemeral ports, preventing external network exposure?
- How does the E2E suite verify sensitive environment variables and tokens are filtered from DOM rendering and log streams?

**Concurrency and Failures**
- How does the suite simulate tab crashes mid-phase to verify background jobs survive and replay logs upon reconnect?
- How does the teardown hook guarantee hung child subprocesses are killed if an assertion fails mid-test?

**Responsibility Boundaries Between Layers**
- How does the E2E suite remain strictly focused on validating user workflows without coupling to private SDK methods?

---

**Architecture Tip:** Target stable ARIA roles and HTTP/SSE contracts to keep E2E tests black-box and resilient to UI refactoring.

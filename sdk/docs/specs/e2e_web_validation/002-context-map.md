# Strategic Design — Context Map: End-to-End Web Integration & Verification

**Domain:** e2e_web_validation | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| `E2ETestHarnessContext` | Manages ephemeral test workspaces, dynamic port assignment, and test server lifecycle. | Does not execute UI assertions or domain business logic. | Test Infrastructure | `E2ETestEnvironment`, `EphemeralWorkspaceSandbox`, `TestServerController` |
| `WorkflowVerificationContext` | Validates end-to-end user workflows across UI routes, SSE log streaming, and backend use cases. | Does not provision test servers directly. | Quality Engineering | `OrchestrationVerifier`, `FeatureSuiteVerifier`, `E2ETestRunner` |
| `ResilienceValidationContext` | Validates multi-tab concurrency locking (HTTP 409) and client reconnect resilience. | Does not manage browser driver sessions. | Quality Engineering | `ResilienceVerifier`, `ReconnectionState` |
| `A11yThemeAuditContext` | Validates WCAG AA 4.5:1 contrast ratios and Itaú theme token consistency in DOM. | Does not manage orchestration jobs. | Frontend Quality | `A11yThemeAuditor`, `ThemeContrastReport` |
| `BrowserAutomationAdapterContext` | Provides headless browser automation drivers, DOM locators, and report generation. | Does not define test assertion logic. | Platform / Tooling | `BrowserAutomationDriver`, `E2ETestReport` |

## Section 2 — Context Map

```
[WorkflowVerificationContext] → [E2ETestHarnessContext]
Pattern   : Customer-Supplier
Direction : Downstream (Workflow) consumes Upstream (Harness Environment)
Justification: Workflow verification requires ready-to-use isolated server URLs and sandbox workspace paths.

[ResilienceValidationContext] → [E2ETestHarnessContext]
Pattern   : Customer-Supplier
Direction : Downstream (Resilience) consumes Upstream (Harness Environment)
Justification: Resilience tests require multi-tab browser contexts connected to the same test server instance.

[WorkflowVerificationContext] → [BrowserAutomationAdapterContext]
Pattern   : Conformist
Direction : Downstream (Workflow) conforms to Upstream (Browser Automation API)
Justification: Standardizes page interactions, navigation, and DOM locators via Playwright driver.

[A11yThemeAuditContext] → [BrowserAutomationAdapterContext]
Pattern   : Conformist
Direction : Downstream (A11y Audit) conforms to Upstream (Browser Automation API)
Justification: Evaluates accessibility rules directly within the live headless browser page context.

[WorkflowVerificationContext] → [SDK Web Host (Tested System)]
Pattern   : Anti-Corruption Layer (ACL)
Direction : Outbound HTTP/SSE client driving tested system
Justification: Tests interact strictly through public HTTP/SSE interfaces and user-facing DOM elements without internal SDK coupling.
```

## Section 3 — Core Domain Highlight

```
Context : WorkflowVerificationContext & ResilienceValidationContext
Reason  : Critical differentiator guaranteeing complete functional parity between sdk-web and CLI, flawless real-time streaming, and robust multi-tab resilience.
Investment: Rigorous behavioral verification, deterministic async SSE stream assertions, automated multi-tab race condition simulations, and comprehensive error flow testing.
```

## Section 4 — Architectural Decisions

```
Decision    : Black-Box E2E Testing via HTTP/SSE and ARIA Roles
Context     : Need to verify full user workflows without coupling tests to internal React components or private SDK classes.
Consequences: High test resilience against UI refactors; requires clear ARIA labeling and stable API contracts.

Decision    : Ephemeral Workspace Sandboxing with Dynamic Port Allocation
Context     : Parallel test execution must not collide on port 3000 or mutate project repositories.
Consequences: Zero side-effects and clean isolation; requires automated setup/teardown in OS temp directories.

Decision    : Unconditional Process Tree Teardown (taskkill /t / SIGKILL)
Context     : Orphaned background agent processes or hanging HTTP servers must be prevented during test failures.
Consequences: Guarantees zero resource leaks; requires OS-specific process tree termination hooks.

Decision    : In-Browser Automated WCAG AA Contrast Auditing
Context     : Itaú brand color tokens in both light and dark themes must strictly adhere to 4.5:1 contrast standards.
Consequences: Continuous compliance verification; integrated automated axe-core DOM assertions during E2E runs.
```

# Tactical Design — harness-kit

**Domain:** e2e_web_validation | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `E2ETestEnvironment` | Fixture / Harness Manager | Ephemeral workspace created in OS temp; guarantees recursive teardown on exit | *see snippet below* |
| `TestServerController` | Fixture / Host Controller | Binds strictly to `127.0.0.1` on dynamic allocated port; health check before test | *see snippet below* |
| `BrowserAutomationDriver` | Fixture / Browser Driver | Headless Chromium instance; manages isolated browser tabs and ARIA locators | *see snippet below* |
| `OrchestrationVerifier` | Verifier / Workflow Suite | Asserts start click, SSE progress events, ANSI log streaming, and status badge | *see snippet below* |
| `ResilienceVerifier` | Verifier / Resilience Suite | Asserts second tab gets HTTP 409 conflict, tab reconnects without aborting job | *see snippet below* |
| `A11yThemeAuditor` | Verifier / A11y Suite | Injects axe-core in page; enforces WCAG AA 4.5:1 contrast across theme toggles | *see snippet below* |

```typescript
class E2ETestEnvironment {
  constructor(private readonly config: TestEnvironmentConfig) {}
  async setup(): Promise<TestServerInstance> { /* provisions sandbox & starts server */ return this.instance; }
  async teardown(): Promise<void> { /* terminates process tree & purges temp dir */ }
}
```

```typescript
class TestServerController {
  constructor(private readonly portAllocator: DynamicPortAllocator) {}
  async start(workspacePath: string): Promise<TestServerInstance> { /* starts sdk-web on 127.0.0.1 */ }
  async stop(): Promise<void> { /* stops HTTP server & kills child runners */ }
}
```

```typescript
class BrowserAutomationDriver {
  constructor(private readonly browser: Browser) {}
  async newPage(url: string): Promise<Page> { const page = await this.browser.newPage(); await page.goto(url); return page; }
  async close(): Promise<void> { await this.browser.close(); }
}
```

```typescript
class OrchestrationVerifier {
  constructor(private readonly driver: BrowserAutomationDriver) {}
  async verifyFullRunFlow(page: Page): Promise<void> { /* clicks run, asserts SSE logs, verifies complete */ }
}
```

```typescript
class ResilienceVerifier {
  constructor(private readonly driver: BrowserAutomationDriver) {}
  async verifyConcurrencyRejection(tab1: Page, tab2: Page): Promise<void> { /* tab1 runs, tab2 gets 409 */ }
}
```

```typescript
class A11yThemeAuditor {
  constructor(private readonly page: Page) {}
  async auditThemeContrast(mode: 'light' | 'dark'): Promise<A11yAuditResult> { /* asserts 4.5:1 ratio */ }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `TestEnvironmentConfig` | Fixture / DTO Contract | Validates `timeoutMs > 0`, `fixtureTemplate` exists | *see snippet below* |
| `TestServerInstance` | Fixture / VO Contract | `{ host: '127.0.0.1', port: number, baseUrl: string, workspacePath: string }` | *see snippet below* |
| `OrchestrationRunAssertion` | Verifier / Contract | `{ expectedPhases: string[], minLogLines: number, finalStatus: string }` | *see snippet below* |
| `A11yAuditResult` | Verifier / VO Contract | `{ violations: number, passesAA: boolean, mode: 'light' \| 'dark' }` | *see snippet below* |
| `MultiTabConflictResult` | Verifier / DTO Contract | `{ activeJobId: string, rejectedStatusCode: 409, isLocked: boolean }` | *see snippet below* |

```typescript
interface TestEnvironmentConfig {
  readonly timeoutMs: number; readonly fixtureTemplate: string;
  readonly headless: boolean; readonly captureScreenshots: boolean;
}
```

```typescript
interface TestServerInstance {
  readonly host: string; readonly port: number; // host === '127.0.0.1'
  readonly baseUrl: string; readonly workspacePath: string;
}
```

```typescript
interface OrchestrationRunAssertion {
  readonly expectedPhases: readonly string[]; readonly minLogLines: number;
  readonly finalStatus: 'COMPLETED' | 'HALTED' | 'FAILED';
}
```

```typescript
interface A11yAuditResult {
  readonly violations: number; readonly passesAA: boolean; // violations === 0
  readonly mode: 'light' | 'dark'; readonly contrastRatio: number;
}
```

```typescript
interface MultiTabConflictResult {
  readonly activeJobId: string; readonly rejectedStatusCode: 409;
  readonly isLocked: boolean; readonly conflictMessage: string;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `createEphemeralSandbox` | Creates isolated temporary workspace populated with fixture templates | OS Temp Directory, File System, Mock Repo | *see snippet below* |
| `verifyOrchestrationWorkflow` | Triggers run via UI button, streams SSE progress, asserts ANSI logs | `BrowserAutomationDriver`, `Page`, SSE Stream | *see snippet below* |
| `verifyMultiTabResilience` | Opens two tabs, triggers run, validates 409 conflict, tests reconnect | `BrowserAutomationDriver`, Multiple `Page` instances | *see snippet below* |
| `auditA11yAndTokens` | Toggles theme mode, runs axe-core assertions, verifies WCAG AA | `BrowserAutomationDriver`, `AxeResults`, DOM Styles | *see snippet below* |

```typescript
async function createEphemeralSandbox(templateName: string): Promise<string> {
  const sandboxPath = path.join(os.tmpdir(), `harness-e2e-${Date.now()}`);
  await fs.cp(path.join(FIXTURES_DIR, templateName), sandboxPath, { recursive: true }); return sandboxPath;
}
```

```typescript
async function verifyOrchestrationWorkflow(page: Page, assertion: OrchestrationRunAssertion): Promise<void> {
  await page.click('button[aria-label="Start Run"]');
  await page.waitForSelector('.status-badge[data-status="RUNNING"]');
}
```

```typescript
async function verifyMultiTabResilience(tab1: Page, tab2: Page, baseUrl: string): Promise<MultiTabConflictResult> {
  await tab1.click('button[aria-label="Start Run"]'); await tab2.goto(`${baseUrl}/run`);
  await tab2.click('button[aria-label="Start Run"]'); return { rejectedStatusCode: 409 } as MultiTabConflictResult;
}
```

```typescript
async function auditA11yAndTokens(page: Page, mode: 'light' | 'dark'): Promise<A11yAuditResult> {
  await page.click('button[aria-label="Toggle theme"]');
  const results = await injectAndRunAxe(page); return { violations: results.violations.length, passesAA: true, mode } as A11yAuditResult;
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `TestSandboxProvisioned` | Temp directory created and populated | `{ sandboxPath: string, template: string }` | `E2ETestEnvironment`, Test Logger |
| `TestServerReady` | Server starts and passes `/health` check | `{ baseUrl: string, port: number, host: string }` | Test Runner, Browser Driver |
| `E2EAssertionPassed` | UI interaction or DOM assertion completes | `{ testName: string, step: string, durationMs: number }` | Test Reporter, CI Summary |
| `TestTeardownCompleted` | Server killed and sandbox directory purged | `{ sandboxPath: string, cleaned: boolean }` | Test Runner Lifecycle Hook |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `ISandboxFileSystemAdapter` | `createTempDir()`, `copyTemplate(src, dest)`, `purgeDir(dest)` | `Promise<string>`, `Promise<void>`, `Promise<void>` |
| `IBrowserDriverAdapter` | `launchBrowser()`, `newPage(url)`, `closeBrowser()` | `Promise<Browser>`, `Promise<Page>`, `Promise<void>` |
| `ITestServerProcess` | `spawnServer(config)`, `killProcessTree()` | `Promise<TestServerInstance>`, `Promise<void>` |

```typescript
interface ISandboxFileSystemAdapter {
  createTempDir(prefix: string): Promise<string>;
  copyTemplate(src: string, dest: string): Promise<void>; purgeDir(dest: string): Promise<void>;
}
```

```typescript
interface IBrowserDriverAdapter {
  launchBrowser(headless: boolean): Promise<Browser>;
  newPage(url: string): Promise<Page>; closeBrowser(): Promise<void>;
}
```

```typescript
interface ITestServerProcess {
  spawnServer(workspacePath: string, port: number): Promise<TestServerInstance>;
  killProcessTree(): Promise<void>; // taskkill /t /f or SIGKILL
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Ephemeral Workspace Sandbox and Dynamic Port Harness",
    "description": "Creates isolated temporary workspace provisioning with automatic cleanup and dynamic port assignment for collision-free test runs.",
    "scope": [
      "sdk-web/test/e2e/fixtures/sandbox.ts",
      "sdk-web/test/e2e/fixtures/port-allocator.ts",
      "sdk-web/test/e2e/fixtures/__tests__/sandbox.spec.ts"
    ],
    "acceptance": [
      "Provisions isolated workspace in OS temp directory with mock project files and cleans up fully on teardown",
      "Allocates available dynamic TCP ports on 127.0.0.1 avoiding collisions with port 3000"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Test Server Controller and Browser Automation Driver Adapter",
    "description": "Builds programmatic server lifecycle manager and headless Playwright browser driver supporting multi-tab coordination and teardown.",
    "scope": [
      "sdk-web/test/e2e/fixtures/server-controller.ts",
      "sdk-web/test/e2e/fixtures/browser-driver.ts",
      "sdk-web/test/e2e/fixtures/__tests__/server-controller.spec.ts"
    ],
    "acceptance": [
      "Spawns sdk-web server instance bound to 127.0.0.1, verifies /health readiness, and shuts down cleanly",
      "Terminates subprocess trees recursively on teardown to prevent orphaned runners"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Orchestration Workflow and SSE Log Streaming E2E Suite",
    "description": "Develops end-to-end test validating job trigger, real-time SSE progress events, ANSI log streaming, and status badge updates in the UI.",
    "scope": [
      "sdk-web/test/e2e/orchestration-workflow.e2e.ts",
      "sdk-web/test/e2e/verifiers/orchestration-verifier.ts",
      "sdk-web/test/e2e/verifiers/__tests__/orchestration-verifier.spec.ts"
    ],
    "acceptance": [
      "Asserts starting an orchestration run renders live streaming logs and transitions phase badges",
      "Verifies explicit job cancellation from UI triggers immediate subprocess termination"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement Multi-Tab Concurrency Rejection and Reconnection Resilience E2E Suite",
    "description": "Validates singleton workspace lock enforcement (HTTP 409) across concurrent browser tabs and verifies job persistence across tab reloads.",
    "scope": [
      "sdk-web/test/e2e/multi-tab-resilience.e2e.ts",
      "sdk-web/test/e2e/verifiers/resilience-verifier.ts",
      "sdk-web/test/e2e/verifiers/__tests__/resilience-verifier.spec.ts"
    ],
    "acceptance": [
      "Verifies second browser tab attempting concurrent run receives HTTP 409 Conflict with clear UI warning",
      "Verifies closing and reopening browser tab during active run transparently reconnects and replays logs without job interruption"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Itaú Theme Switching, A11y Auditing, and Feature Views E2E Suite",
    "description": "Builds automated E2E tests for Itaú light/dark theme toggles, WCAG AA 4.5:1 contrast compliance, settings, reports, and diagnostics views.",
    "scope": [
      "sdk-web/test/e2e/theme-a11y.e2e.ts",
      "sdk-web/test/e2e/feature-views.e2e.ts",
      "sdk-web/test/e2e/verifiers/a11y-auditor.ts"
    ],
    "acceptance": [
      "Asserts theme toggle updates data-theme attribute, persists to localStorage, and passes axe-core contrast audit with zero violations",
      "Asserts settings, reports, diagnostics, and candidates routes render and bind to backend use cases correctly"
    ],
    "depends_on": "04"
  }
]
```

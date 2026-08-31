# Project Documentation

Index of project technical documentation for **HarnessKit**. Use the links below to navigate the available documents and graph map topology.

## Documentation Index

| Document | Description | Reading |
|----------|-------------|----------|
| [**.digest.md**](./.digest.md) | Fast-path machine-readable orientation digest (stack, test commands, rules). | **Mandatory** |
| [**.graph.json**](./.graph.json) | Macro relation graph index for agent topology navigation and 1-hop routing. | **Mandatory** |
| [**ARCHITECTURE.md**](./adr/ARCHITECTURE.md) | Architecture, folder organization, and code patterns for the project. | **Mandatory** |
| [**TESTS.md**](./adr/TESTS.md) | Testing strategies, patterns, and execution commands. | **Mandatory** |
| [**antigravity-cli-validation.md**](./feature/antigravity-cli-validation.md) | Google Antigravity CLI runner validation, stdin streaming, and session continuity. | Optional |
| [**diagnostics-candidate-review.md**](./feature/diagnostics-candidate-review.md) | Diagnostics session ledger analysis, batch execution, and Meta-Harness candidate diff review. | Optional |
| [**e2e-web-validation.md**](./feature/e2e-web-validation.md) | End-to-end automated testing suite for sdk-web workflows, SSE streaming, and WCAG AA a11y. | Optional |
| [**orchestration-execution.md**](./feature/orchestration-execution.md) | Live orchestration dashboard with runner controls, real-time SSE log streaming, and mid-run steering. | Optional |
| [**settings-management.md**](./feature/settings-management.md) | Dual-mode visual and raw JSON settings management with atomic disk persistence. | Optional |
| [**telemetry-analytics.md**](./feature/telemetry-analytics.md) | Telemetry dashboard displaying multidimensional token costs, prompt cache savings, and audit export. | Optional |
| [**web-shell-theme.md**](./feature/web-shell-theme.md) | Application shell featuring Itaú Unibanco design tokens, light/dark theme switch, and responsive layout. | Optional |
| [**workspace-initialization.md**](./feature/workspace-initialization.md) | Interactive workspace initialization wizard with file inspection and overwrite protection. | Optional |

## Recommended Reading Order

If an exact path is supplied, read it directly. Otherwise use this order:

1. **.digest.md** — fast AI orientation (architecture pattern, stack, test commands).
2. **.graph.json** — macro relation graph index for 1-hop document lookup.
3. Selected ADR or feature documents only when their design context is required.\n
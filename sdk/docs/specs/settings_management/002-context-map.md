# Strategic Design — Context Map: Settings Management

**Domain:** settings_management | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **Settings Management Context** | Coordinates loading, updating, renewing, validating, and deleting global/local `settings.json` files via application use cases. | Excludes UI rendering, browser storage, and job execution. | Backend / SDK Core | `HarnessSettings`, `SettingsValidator`, `SettingsScope`, `HarnessSettingsMap` |
| **Settings UI & Editor Context** | Delivers interactive web interface for scope switching, visual form editing, raw JSON editing, live linting, and confirmation dialogs. | Excludes disk I/O and direct filesystem mutations. | Frontend / Web UI | `SettingsView`, `SettingsForm`, `RawJsonEditor`, `ScopeSelector`, `ConfirmModal` |
| **Filesystem Persistence Context** | Handles atomic file writes, path resolution, directory scaffolding, and safe deletion on local disk. | Excludes domain schema validation and HTTP routing. | Core Platform | `AtomicSettingsWriter`, `PathResolver`, `FileSystemAdapter` |
| **Web Shell & Theme Context** *(Dependency)* | Provides application layout frame, `/settings` route shell, and Itaú design tokens (light/dark mode). | Excludes inner settings form state and data fetching. | Frontend Platform | `ApplicationShell`, `ThemeTokens`, `NavigationRoute` |

## Section 2 — Context Map

```
[Settings UI & Editor Context] → [Settings Management Context]
Pattern       : Customer-Supplier / Published Language
Direction     : Downstream (UI) consumes Upstream (API Use Cases via REST/RPC)
Justification : Frontend consumes backend DTOs (`/orchestrator/settings`) as single source of truth.

[Settings Management Context] → [Filesystem Persistence Context]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream (Settings Context) wraps platform filesystem calls
Justification : Encapsulates OS path differences, file locks, and atomic replacement mechanics.

[Settings UI & Editor Context] → [Web Shell & Theme Context]
Pattern       : Conformist
Direction     : Downstream (Settings UI) conforms to upstream Shell and Theme Tokens
Justification : Settings UI mounts into application shell slot and adopts Itaú CSS variables.
```

## Section 3 — Core Domain Highlight

```
Context   : Settings Management Context + Settings UI & Editor Context
Reason    : Delivers complete parity with CLI `hrns settings` through an accessible, dual-mode visual/raw interface enforcing precedence rules and schema validation.
Investment: Atomic file writing, dual-mode bi-directional state synchronization, debounced live schema diagnostics, and WCAG AA compliant form controls.
```

## Section 4 — Architectural Decisions

### ADR-01: Dual-Mode Synchronized Editor (Form & Raw JSON)
- **Decision:** Provide both structured form controls and a syntax-highlighted raw JSON editor synchronized via a single root state object.
- **Context:** Developers need both quick UI toggles (for timeouts/models) and bulk editing capabilities for complex multi-phase configurations.
- **Consequences:** Maximizes productivity; requires robust state reconciliation and validation before mode switches.

### ADR-02: Backend-Authoritative Schema Validation and Precedence
- **Decision:** All validation, precedence resolution, and default fallbacks are computed by backend use cases and exposed via REST endpoints.
- **Context:** Prevents diverging validation logic between CLI (`hrns settings`) and Web UI (`sdk-web`).
- **Consequences:** Single source of truth; frontend remains a thin presentation layer.

### ADR-03: Atomic File Replacement for Settings Persistence
- **Decision:** Write updated settings to a temporary file (`settings.json.tmp`) and atomically rename it to replace the target file.
- **Context:** Prevents file truncation or corruption if write streams are interrupted.
- **Consequences:** Guarantees zero partial file corruption across OS environments.

### ADR-04: Explicit Confirmation Gates for Destructive Operations
- **Decision:** Renew and Delete actions require explicit confirmation modals detailing target file path and consequences.
- **Context:** Prevents accidental data loss of customized phase and runner overrides.
- **Consequences:** Eliminates accidental resets; minor additional interaction step for users.

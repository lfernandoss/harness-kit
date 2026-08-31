# Strategic Design — Problem Space: Settings Management

**Domain:** settings_management | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event (past tense) | Command (trigger) | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `SettingsScopeSelected` | `SelectSettingsScope` | `SettingsSession` | Browser Storage | Active Scope View |
| 2 | `SettingsLoaded` | `LoadSettings` | `SettingsConfig` | Filesystem (`fs`) | Settings Form/Raw Model |
| 3 | `SettingsValidated` | `ValidateSettings` | `SettingsValidator` | Schema Engine | Validation Diagnostics |
| 4 | `SettingsFormModified` | `UpdateSettingsField` | `SettingsConfig` | Web UI State | Draft Settings View |
| 5 | `SettingsRawJsonUpdated` | `EditRawJson` | `SettingsConfig` | Editor Engine | Raw JSON Model |
| 6 | `SettingsPersisted` | `SaveSettings` | `SettingsConfig` | Filesystem (`fs`) | Persisted Settings DTO |
| 7 | `SettingsRenewed` | `RenewSettings` | `SettingsConfig` | Filesystem (`fs`) | Default Settings DTO |
| 8 | `SettingsDeleted` | `DeleteSettings` | `SettingsConfig` | Filesystem (`fs`) | File Status Model |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Settings Resolution & Precedence** | Core | Precedence hierarchy (Local > Global > Defaults) with runner and phase overrides. |
| **Settings Form & JSON Editor** | Core | Dual-mode visual/raw editor with real-time schema validation and Itaú styling. |
| **Atomic File Persistence** | Supporting | Safe filesystem I/O, atomic write replacing, directory initialization, and deletion. |
| **Schema Validation Engine** | Generic | Standard JSON parsing, format linting, and diagnostic reporting. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `SettingsScope` | Target scope: Global (`~/.config/harness-kit/settings.json`) or Local (`.harness-kit/settings.json`). | Mutually exclusive target selector in UI. |
| `HarnessSettingsMap` | Root map configuring runners, base timeouts, and phase override maps. | Canonical contract across backend and frontend. |
| `RunnerSettings` | Configuration for a specific runner, including default timeout and phase map. | Keyed by canonical runner identifier. |
| `PhaseSettings` | Granular override parameters (`model`, `effort`, `timeoutMs`) for a phase. | Supported phases: `bootstrap`, `planning`, etc. |
| `SettingsValidator` | Service validating schema compliance, positive timeouts, and supported keys. | Returns structured diagnostic messages. |
| `FormEditMode` | Visual editor mode providing form fields for runners, phases, models, and timeouts. | Validates inputs on change and submit. |
| `RawJsonMode` | Code editor mode allowing direct editing of `settings.json` content. | Real-time syntax and schema linting. |
| `DefaultSettings` | Baseline canonical configuration used when creating or renewing settings. | Source of truth for clean defaults. |
| `AtomicSettingsWriter` | Persistence service using temp files and atomic rename to prevent corruption. | Safe atomic replacement on disk. |
| `SettingsRenewal` | Operation recreating target `settings.json` with baseline default values. | Replaces configuration with defaults. |
| `SettingsDeletion` | Operation removing the local or global `settings.json` file from disk. | Requires confirmation modal. |
| `PrecedenceHierarchy` | Resolution rule where Local overrides Global, which overrides Defaults. | Local (`.harness-kit/`) > Global > Defaults. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `SettingsValidator` guarantee `timeoutMs > 0` and runner/phase keys match supported sets before saving?
- How is two-way consistency preserved between visual form fields and raw JSON editor content?

**Scalability and Performance**
- How does the web UI debounce schema validation during continuous typing in `RawJsonMode`?
- How does the backend avoid redundant disk reads when multiple clients query settings concurrently?

**Security and Sensitive Data**
- How do settings use cases prevent path traversal when resolving local workspace paths from query parameters?
- How are filesystem permissions checked before writes to prevent unhandled exceptions on read-only directories?

**Concurrency and Failures**
- What happens if `settings.json` is modified externally while being edited in the web interface?
- How does `AtomicSettingsWriter` prevent corrupted files if process termination occurs mid-write?

**Responsibility Boundaries Between Layers**
- How does the frontend consume backend DTOs without duplicating validation rules in React state?

---

**Architecture Tip:** Synchronize form and JSON views through a centralized reducer serializing to the canonical `HarnessSettingsMap` DTO.

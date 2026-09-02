# Strategic Design — Context Map: CLI Settings Models

**Domain:** cli_settings_models | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **CLI Settings Interface** | Handles terminal UI, interactive inquirer wizards, CLI flag parsing, and formatted output. | Does not directly read/write disk files or bypass domain validation. | Harness CLI | `CliSettingsSession`, `CommandArgs`, `InquirerForm` |
| **Settings Management Core** | Validates schema, executes patch-based deep merges, and persists files atomically. | Does not spawn external editors or handle user terminal interaction. | SDK Core | `HarnessSettingsMap`, `RunnerSettings`, `PhaseSettings`, `SettingsValidator` |
| **Orchestrator Resolution** | Resolves effective runner models/effort per phase and snapshots cycle settings. | Does not mutate settings on disk or handle user configuration requests. | Orchestrator | `HarnessSettings`, `AgentInvocation`, `SessionSettingsSnapshot` |
| **Workspace Isolation** | Provides process mutexes and file locking across Git worktrees during file writes. | Does not interpret settings content or runner configurations. | Platform Infra | `WorkspaceLockManager`, `FileLock` |

## Section 2 — Context Map

```
[CLI Settings Interface] ──(Customer-Supplier)──> [Settings Management Core]
[Orchestrator Resolution] ──(Conformist)─────────> [Settings Management Core]
[Settings Management Core] ──(Partnership)───────> [Workspace Isolation]
```

### Relationships & Integration Patterns

```
[CLI Settings Interface] → [Settings Management Core]
Pattern   : Customer-Supplier
Direction : Downstream (CLI) to Upstream (Core)
Justification: CLI uses GetSettingsUseCase and UpdateSettingsUseCase ports, conforming to core schema DTOs.
```

```
[Orchestrator Resolution] → [Settings Management Core]
Pattern   : Conformist
Direction : Downstream (Orchestrator) to Upstream (Core)
Justification: Orchestrator consumes the canonical HarnessSettings data model and resolution rules directly.
```

```
[Settings Management Core] → [Workspace Isolation]
Pattern   : Partnership
Direction : Bidirectional
Justification: AtomicSettingsWriter coordinates with WorkspaceLockManager for safe mutations during concurrent runs.
```

## Section 3 — Core Domain Highlight

```
Context   : Settings Management Core & CLI Settings Interface
Reason    : Flexible, secure, and intuitive model configuration across CLI runners (Antigravity, Claude, Copilot, Cursor) is a key operational differentiator for HarnessKit.
Investment: Clean Architecture integration, two-tier model fallback hierarchy, strict input sanitization, and full vitest coverage for both interactive and headless CLI flows.
```

## Section 4 — Architectural Decisions

### ADR-01: Reuse Existing Application Use Cases in CLI
- **Context:** The CLI needs to read, validate, merge, and save settings.
- **Decision:** Have `settings-service.ts` import and invoke `GetSettingsUseCase`, `UpdateSettingsUseCase`, and `SettingsValidator` instead of doing standalone file operations.
- **Consequences:** Eliminates logic drift between CLI and `sdk-web`, enforces unified validation, and guarantees consistent atomic file writes.

### ADR-02: Two-Tier Model and Effort Resolution Hierarchy
- **Context:** Setting models across 7 phases individually creates configuration friction.
- **Decision:** Introduce optional `defaultModel` and `defaultEffort` on `RunnerSettings`. `HarnessSettings.resolve()` checks phase override first, falls back to runner default, then global default.
- **Consequences:** Reduces boilerplate configuration while preserving granular per-phase override capabilities.

### ADR-03: Dual CLI Presentation Interface
- **Context:** Developers need an interactive prompt wizard, while CI/CD requires non-interactive scriptability.
- **Decision:** Support `hrns settings` interactive wizard via `@inquirer/prompts` when run without args, and subcommands (`hrns settings set <runner> [model]`) with `--json` output when args are present.
- **Consequences:** Provides intuitive developer UX while ensuring seamless automation in headless environments.

### ADR-04: Regex Whitelist Sanitization for Model and Effort
- **Context:** Model strings are passed as command-line arguments to spawned runner processes.
- **Decision:** Enforce regex `^[a-zA-Z0-9._:/-]+$` for model names and strict enum (`low|medium|high|xhigh`) for effort in `SettingsValidator`.
- **Consequences:** Hardens child process execution against argument injection and accidental malformed flags.

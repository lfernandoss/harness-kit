# Strategic Design — Problem Space: CLI Settings Models

**Domain:** cli_settings_models | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event | Command | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `CliSettingsModeSelected` | `SelectCliSettingsAction` | `CliSettingsSession` | Terminal TTY | Action Menu View |
| 2 | `RunnerDefaultModelConfigured` | `SetRunnerDefaultModel` | `RunnerSettingsConfig` | Filesystem | Runner Settings View |
| 3 | `PhaseModelOverrideConfigured` | `SetPhaseModelOverride` | `RunnerSettingsConfig` | Filesystem | Phase Config View |
| 4 | `ModelStringValidated` | `ValidateModelInput` | `SettingsValidator` | Regex Engine | Validation Diagnostics |
| 5 | `CliSettingsDeepMerged` | `ApplySettingsPatch` | `RunnerSettingsConfig` | Filesystem | Merged Settings Model |
| 6 | `CliSettingsPersisted` | `SaveSettingsFile` | `RunnerSettingsConfig` | Filesystem | Persisted Settings DTO |
| 7 | `PhaseModelResolved` | `ResolveInvocationModel` | `HarnessSettings` | Agent Runner | Resolved Execution Spec |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **CLI Model Configuration & Wizard** | Core | Interactive and declarative CLI model and effort configuration across runners and phases. |
| **Model Precedence Resolution** | Core | Two-tier fallback: Phase override > Runner default > System baseline. |
| **Clean Settings Persistence** | Supporting | Patch-based deep merge and atomic persistence reusing application use cases. |
| **Model Sanitization & Advisory** | Generic | Input regex validation preventing argument injection and known-model suggestions. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `RunnerDefaultModel` | Baseline LLM identifier for a runner across all phases when no phase override is set. | Root of `RunnerSettings`. |
| `RunnerDefaultEffort` | Baseline effort (`low`, `medium`, `high`, `xhigh`) for a runner across all phases. | Optional runner-level property. |
| `PhaseModelOverride` | Phase-specific LLM identifier overriding the runner default for a specific phase. | In `phases[phaseKey].model`. |
| `TwoTierResolution` | Resolution order: phase override > runner default > system default. | In `HarnessSettings.resolve()`. |
| `InteractiveSettingsWizard` | Terminal prompt workflow using `@inquirer/prompts` to configure models. | Invoked when no args supplied. |
| `DeclarativeSettingsCommand` | Direct CLI command (`hrns settings set ...`) for scriptable headless execution. | Supports CI/CD automation. |
| `ModelStringSanitization` | Regex validation (`^[a-zA-Z0-9._:/-]+$`) preventing argument injection. | In `SettingsValidator`. |
| `PatchDeepMerge` | Safe update modifying targeted runner/phase keys while preserving untouched fields. | In `UpdateSettingsUseCase`. |
| `SettingsScopeTarget` | Target configuration: Local (`.harness-kit/`) or Global (`~/.config/...`). | Scope selector. |
| `SessionSettingsSnapshot` | Immutable settings snapshot captured at cycle start to shield running agents. | Guarantees determinism. |
| `AdvisoryModelCatalog` | Non-blocking dictionary of known models for autocompletion and soft warnings. | Non-restrictive catalog. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `HarnessSettings.resolve()` guarantee empty strings fall back to `defaultModel` rather than passing empty arguments to CLI binaries?
- How does patch-based deep merging ensure adding a runner model never wipes existing phase timeouts?

**Scalability and Performance**
- How does the CLI avoid repeated disk reads when resolving models across multiple agent dispatches?
- How is the memory footprint bounded when parsing deep settings maps in long-running loops?

**Security and Sensitive Data**
- What regex and length limits in `SettingsValidator` prevent shell argument injection through model strings?
- How does the CLI verify that local settings file paths stay jailed to the workspace directory?

**Concurrency and Failures**
- How does `WorkspaceLockManager` prevent partial writes when CLI updates occur during concurrent worktree runs?
- What fallback behavior occurs if `settings.json` is concurrently locked or unwritable?

**Responsibility Boundaries Between Layers**
- How do CLI controllers in `settings-service.ts` delegate directly to application use cases without touching raw `fs`?
- How does the domain model shield CLI runners from knowing whether a model originated from global defaults or CLI overrides?

---

**Architecture Tip:** Centralize model resolution in `HarnessSettings` and sanitization in `SettingsValidator` so CLI and Web share 100% of domain and persistence logic.

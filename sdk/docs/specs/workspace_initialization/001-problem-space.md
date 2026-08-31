# Strategic Design — Problem Space: Workspace Initialization Wizard

**Domain:** workspace_initialization | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event (past tense) | Command (trigger) | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `WorkspaceInspectionRequested` | `InspectWorkspace` | `WorkspaceInitializer` | Local Filesystem / OS | `WorkspaceStatusReadModel` |
| 2 | `ExistingWorkspaceDetected` | `EvaluateWorkspaceHealth` | `WorkspaceInitializer` | Local Filesystem | `ExistingArtifactsDescriptor` |
| 3 | `OverwriteProtectionConfirmed` | `ConfirmWorkspaceOverwrite` | `InitializationWizard` | Browser User Input | `OverwriteConsentState` |
| 4 | `WizardStepChanged` | `TransitionWizardStep` | `InitializationWizard` | Web UI Router / State | `WizardProgressState` |
| 5 | `SteeringRuleAdded` | `AddSteeringRule` | `SteeringRulesConfig` | Web UI Form | `SteeringRulesDraft` |
| 6 | `SteeringRulesMerged` | `CompileSteeringRules` | `SteeringRulesConfig` | Config Validator | `CompiledSteeringRules` |
| 7 | `TrackingFilesGenerated` | `ProvisionTrackingFiles` | `WorkspaceInitializer` | Local Filesystem (`docs/product/`) | `ProvisionedFilesSummary` |
| 8 | `BootstrapConfigPersisted` | `SaveBootstrapConfig` | `WorkspaceInitializer` | Local Filesystem (`BOOTSTRAP-CONFIG.json`) | `BootstrapConfigDescriptor` |
| 9 | `LocalSettingsBootstrapped` | `CreateLocalSettings` | `WorkspaceInitializer` | Local Filesystem (`.harness-kit/`) | `LocalSettingsSummary` |
| 10 | `WorkspaceInitializationCompleted` | `FinalizeInitialization` | `InitializationWizard` | SDK Job Dispatcher | `InitializationReport` |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Interactive Initialization Wizard** | Core | Primary developer onboarding differentiator: multi-step visual setup mirroring `hrns init`, path detection, safety guards, and live steering rule authoring. |
| **Workspace File Provisioning & State** | Supporting | Atomic generation of `docs/product/` tracking files (`DEVELOPMENT-STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `BACKLOG.md`) and `BOOTSTRAP-CONFIG.json`. |
| **Steering Rules Governance** | Supporting | Schema validation and phase-based inheritance (`user`, `bootstrap`, `planning`, `implementation`, `review`, `memory`) merged with default rulesets. |
| **Local Settings Provisioning** | Generic | Commodity filesystem creation of default `.harness-kit/settings.json` configuration. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `InitializationWizard` | Interactive multi-step frontend workflow guiding the developer through workspace configuration, safety verification, and rule definition. | Manages wizard step transitions. |
| `WorkspaceInitializer` | Application service coordinating filesystem inspection, tracking file generation, and config persistence. | Server-side orchestrator for init. |
| `SteeringRulesConfig` | Phase-partitioned collection of directives (`user`, `bootstrap`, `planning`, `implementation`, `review`, `memory`) guiding agent reasoning. | Merges defaults with user input. |
| `TrackingFiles` | Essential state documents in `docs/product/` (`DEVELOPMENT-STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `BACKLOG.md`). | Foundation of project memory. |
| `BootstrapConfig` | Structured JSON document (`BOOTSTRAP-CONFIG.json`) persisting active steering rules and initialization metadata. | Single source of truth for phases. |
| `OverwritePolicy` | Safety invariant requiring explicit developer consent before wiping or re-initializing existing `docs/product/` directories. | Prevents accidental data loss. |
| `PhaseSteeringKey` | Domain identifier representing an orchestration lifecycle phase (`user`, `bootstrap`, `planning`, `implementation`, `review`, `memory`). | Strict enumeration. |
| `WorkspaceStatus` | DTO representing filesystem presence of `docs/product`, `BOOTSTRAP-CONFIG.json`, and `.harness-kit/settings.json`. | Returned by pre-flight inspection. |
| `WizardStep` | Discrete visual state in the setup sequence: `detection`, `overwrite_guard`, `steering_editor`, `settings_setup`, `summary`. | Non-linear navigation restricted. |
| `SteeringRuleItem` | Individual text instruction or constraint attached to a specific `PhaseSteeringKey`. | Non-empty trimmed string. |
| `LocalSettingsDescriptor` | Configuration payload written to `.harness-kit/settings.json` controlling runner models and tool options. | Optional creation during init. |
| `FileStateManagerAdapter` | Outbound adapter interfacing with SDK `FileStateManager` for atomic file writes and reads. | Isolates disk I/O from use cases. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `WorkspaceInitializer` guarantee atomic file creation so that a failure while writing `BOOTSTRAP-CONFIG.json` does not leave a half-created `docs/product/` directory without rollback?
- How is the `OverwritePolicy` enforced to prevent concurrent browser requests or CLI processes from wiping existing tracking files without explicit user consent?

**Scalability and Performance**
- How does the workspace inspection endpoint avoid blocking the Node.js event loop when checking directory existence across deeply nested file structures or network shares?
- How does the wizard UI optimize rendering performance when manipulating large steering rule collections across all six execution phases?

**Security and Sensitive Data**
- How does `WorkspaceInitializer` validate and sanitize input paths to prevent path traversal attacks (e.g., `../../`) attempting to initialize directories outside the intended workspace root?
- How does the system prevent arbitrary script injection when rendering and saving user-defined steering rule strings?

**Concurrency and Failures**
- How does the server handle race conditions if two browser tabs attempt to initialize the same workspace simultaneously (using `WorkspaceLockManager`)?
- How are partial filesystem permissions errors (e.g., read-only `.harness-kit/` directory) communicated back to the wizard UI without crashing the server?

**Responsibility Boundaries Between Layers**
- How are business rules for default steering rules and file templates kept strictly within the backend SDK domain, preventing the frontend from duplicating template generation logic?

---

**Architecture Tip:** Treat workspace initialization as an idempotent backend use case wrapped by `WorkspaceLockManager`, keeping the web wizard as a thin step coordinator consuming backend DTOs.

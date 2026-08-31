# Strategic Design — Context Map: Workspace Initialization Wizard

**Domain:** workspace_initialization | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **Interactive Initialization Wizard Context** | Manages multi-step setup flow (`detection`, `overwrite_guard`, `steering_editor`, `settings_setup`, `summary`), form validation, and command dispatch. | Excludes direct disk I/O, file template authoring, and background agent execution. | Frontend UX / Init Module | `InitializationWizard`, `WizardStepState`, `SteeringRulesDraft`, `OverwriteConsentState` |
| **Workspace Provisioning Context** | Orchestrates pre-flight workspace inspection, atomic creation of `docs/product/` tracking files, and config file persistence. | Excludes UI presentation, web server hosting, and live execution telemetry. | SDK Core / File Services | `WorkspaceInitializer`, `WorkspaceStatus`, `TrackingFilesRegistry`, `BootstrapConfig` |
| **Steering Rules Governance Context** | Encapsulates domain invariants, phase defaults (`user`, `bootstrap`, `planning`, `implementation`, `review`, `memory`), and rule merging logic. | Excludes filesystem writes and HTTP transport serialization. | SDK Domain / Rules Core | `SteeringRulesConfig`, `PhaseSteeringKey`, `SteeringRuleItem` |
| **Workspace Concurrency & Lock Context** | Provides workspace-level mutual exclusion via `WorkspaceLockManager`, rejecting conflicting concurrent initialization or execution requests. | Excludes domain initialization business logic and UI state. | Platform / Concurrency | `WorkspaceLockManager`, `LockDescriptor` |

## Section 2 — Context Map

```
[Interactive Initialization Wizard Context] → [Workspace Provisioning Context]
Pattern       : Customer-Supplier / Open Host Service (REST API)
Direction     : Downstream (Web UI Wizard) consumes Upstream (SDK Provisioning API)
Justification : Wizard dispatches inspection and initialization commands to backend endpoints (/api/workspace/init).

[Workspace Provisioning Context] → [Steering Rules Governance Context]
Pattern       : Shared Kernel / Conformist
Direction     : Downstream (Provisioning) uses domain rules from Upstream (Steering Governance)
Justification : Provisioning use cases use domain schemas to validate, merge, and compile steering rules into BOOTSTRAP-CONFIG.json.

[Workspace Provisioning Context] → [Workspace Concurrency & Lock Context]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream (Provisioning) wraps concurrency locks
Justification : Protects initialization workflows against concurrent file access and race conditions on docs/product/.

[Interactive Initialization Wizard Context] → [Web Shell & Theme Context (Dependency)]
Pattern       : Conformist / Published Language
Direction     : Downstream (Init Wizard) conforms to upstream shell layout slots and Itaú design tokens
Justification : Wizard views render inside ApplicationShell conforming to navigation contracts and WCAG AA theme tokens.
```

## Section 3 — Core Domain Highlight

```
Context   : Interactive Initialization Wizard Context + Workspace Provisioning Context
Reason    : Delivers the visual, interactive onboarding experience for Harness Kit, enabling safe workspace configuration, template generation, and customized steering rules without CLI friction.
Investment: Guided multi-step wizard UI, live JSON preview, atomic filesystem writes, explicit overwrite protection, and full parity with hrns init.
```

## Section 4 — Architectural Decisions

### ADR-01: Two-Phase Inspection and Execution Protocol
- **Decision:** Expose two distinct HTTP endpoints (`GET /api/workspace/init/status` and `POST /api/workspace/init`), decoupling pre-flight inspection from mutation.
- **Context:** Allows the wizard UI to dynamically adapt (showing overwrite warnings, pre-populating existing rules) before triggering filesystem changes.
- **Consequences:** Clean separation of query and command; prevents accidental modifications during initial view load.

### ADR-02: Server-Authoritative Steering Rule Compilation
- **Decision:** Maintain default steering rules and merging algorithms exclusively in the backend SDK, passing compiled defaults in inspection DTOs and compiling final configs on the server.
- **Context:** Prevents frontend/backend divergence and ensures CLI (`hrns init`) and Web UI share identical rule compilation behavior.
- **Consequences:** Single source of truth; frontend acts as a form editor without duplicating domain business rules.

### ADR-03: Atomic Filesystem Provisioning with Overwrite Safety Guard
- **Decision:** Enforce `OverwritePolicy` in `InitializeWorkspaceUseCase`: if `docs/product/` exists and `forceOverwrite !== true`, the use case rejects with HTTP 409 Conflict.
- **Context:** Protects developers against accidental loss of historical tracking files during uncoordinated web requests.
- **Consequences:** Guaranteed safety; requires explicit user toggle in UI before overwriting existing project artifacts.

### ADR-04: WorkspaceLockManager Guarding Initialization Lifecycle
- **Decision:** Acquire workspace lock during `InitializeWorkspaceUseCase` execution, returning HTTP 423 Locked / 409 Conflict if an active orchestrator job is running.
- **Context:** Prevents race conditions where files are generated or wiped while an agent execution is in progress.
- **Consequences:** Complete data integrity across concurrent sessions; blocks initialization during active runs.

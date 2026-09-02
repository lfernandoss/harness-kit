# Test Scenario Specifications — harness-kit

**Domain:** cli_settings_models | **Project:** harness-kit

## Section 1 — Unit Tests

### 1.1 Value Objects & Types

#### Scenario 1.1.1 — Valid Model Identifier
- **Scenario:** Should create valid ModelString when model conforms to regex specification
- **Given:** A model identifier string `"gemini-3.7-flash"`
- **When:** Validated through `SettingsValidator.validateModel`
- **Then:** The validation succeeds without throwing an error

#### Scenario 1.1.2 — Reject Model with Shell Metacharacters
- **Scenario:** Should reject ModelString when identifier contains shell metacharacters
- **Given:** A model string `"gpt-4; rm -rf /"`
- **When:** Validated through `SettingsValidator.validateModel`
- **Then:** Throws a validation error with message indicating invalid model identifier

#### Scenario 1.1.3 — Reject Model with Leading Flag Prefix
- **Scenario:** Should reject ModelString when identifier begins with command flag prefix
- **Given:** A model string `"--dangerously-skip-permissions"`
- **When:** Validated through `SettingsValidator.validateModel`
- **Then:** Throws a validation error rejecting leading dash or flag structures

#### Scenario 1.1.4 — Valid Effort Enumeration
- **Scenario:** Should accept EffortLevel when value is one of low, medium, high, or xhigh
- **Given:** An effort string `"high"`
- **When:** Validated through `SettingsValidator.validateEffort`
- **Then:** The validation succeeds without error

#### Scenario 1.1.5 — Reject Unknown Effort String
- **Scenario:** Should reject EffortLevel when value is not in permitted enum
- **Given:** An effort string `"extreme"`
- **When:** Validated through `SettingsValidator.validateEffort`
- **Then:** Throws a validation error indicating unsupported effort level

---

### 1.2 Domain Model Resolution (`HarnessSettings`)

#### Scenario 1.2.1 — Resolve Phase Override Priority
- **Scenario:** Should resolve phase override when both phase override and runner default are configured
- **Given:** A runner `"antigravity"` with `defaultModel: "gemini-3.7-flash"` and phase `planning` with `model: "gemini-3.7-pro"`
- **When:** `HarnessSettings.resolve("antigravity", "planning")` is called
- **Then:** Returns `{ model: "gemini-3.7-pro" }` taking precedence over the runner default

#### Scenario 1.2.2 — Fallback to Runner Default Model
- **Scenario:** Should resolve runner default model when phase-specific model is not defined
- **Given:** A runner `"claude"` with `defaultModel: "claude-3-7-sonnet"` and phase `implementation` with no model override
- **When:** `HarnessSettings.resolve("claude", "implementation")` is called
- **Then:** Returns `{ model: "claude-3-7-sonnet" }` inherited from runner defaults

#### Scenario 1.2.3 — Fallback When Phase Model is Empty String
- **Scenario:** Should fallback to runner default model when phase model override is empty string
- **Given:** A runner with `defaultModel: "gpt-5.6-sol"` and phase override `{ model: "" }`
- **When:** `HarnessSettings.resolve()` is executed for that phase
- **Then:** Returns the runner default model rather than an empty string

#### Scenario 1.2.4 — Merge Maps Preserves Runner Defaults
- **Scenario:** Should preserve runner defaultModel during settings map merge
- **Given:** A base configuration with runner default model and an override map specifying a new phase timeout
- **When:** `HarnessSettings.mergeMaps(base, override)` is called
- **Then:** The merged result retains the original runner `defaultModel` alongside the updated timeout

---

### 1.3 Use Cases (`UpdateSettingsUseCase`)

#### Scenario 1.3.1 — Patch Runner Default Model Preserves Sibling Fields
- **Scenario:** Should update runner defaultModel while preserving existing phase timeouts
- **Given:** An existing settings file with `antigravity.timeoutMs: 1800000` and configured phases
- **When:** `UpdateSettingsUseCase.execute` is called with a patch updating `defaultModel: "gemini-3.7-flash"`
- **Then:** The target file contains the new `defaultModel` and retains the existing `timeoutMs` and phases intact

#### Scenario 1.3.2 — Patch Phase Model Preserves Unrelated Phases
- **Scenario:** Should update single phase model while preserving other phases
- **Given:** An existing configuration with phases `bootstrap`, `planning`, and `implementation`
- **When:** A patch is applied targeting only `phases.planning.model`
- **Then:** The `planning` model is updated and `bootstrap` and `implementation` configurations remain unchanged

#### Scenario 1.3.3 — Atomic Persistence on Validation Failure
- **Scenario:** Should not corrupt or modify file on disk when patch contains invalid schema
- **Given:** A valid existing `settings.json` file on disk
- **When:** An invalid patch containing an illegal model string is submitted to `UpdateSettingsUseCase`
- **Then:** An error is thrown and the original file on disk remains completely unmodified

---

## Section 2 — Integration Tests

### 2.1 CLI Settings Commands (`cmdSettings`)

#### Scenario 2.1.1 — Declarative Set Runner Default Model
- **Scenario:** Should update settings file non-interactively when set subcommand is invoked with runner and model flags
- **Given:** CLI invoked with arguments `['set', 'antigravity', '--model', 'gemini-3.7-flash', '--scope', 'local']`
- **When:** `cmdSettings(cwd, args)` executes
- **Then:** Writes the updated configuration to `.harness-kit/settings.json` and outputs success message with exit code 0

#### Scenario 2.1.2 — Declarative Set Phase Model Override
- **Scenario:** Should update specific phase model when phase flag is supplied
- **Given:** CLI invoked with `['set', 'claude', '--model', 'claude-3-7-sonnet', '--phase', 'review_tl']`
- **When:** `cmdSettings(cwd, args)` executes
- **Then:** Updates `claude.phases.review_tl.model` in the targeted settings file

#### Scenario 2.1.3 — Non-Interactive Output in JSON Mode
- **Scenario:** Should return parseable JSON output when --json flag is provided
- **Given:** CLI invoked with valid set flags and `--json`
- **When:** Command execution completes
- **Then:** Stdout outputs only a structured JSON response containing status and updated model mappings

#### Scenario 2.1.4 — Non-Zero Exit Code on Invalid Model
- **Scenario:** Should exit with non-zero code when invalid model argument is passed
- **Given:** CLI invoked with `['set', 'cursor', '--model', 'invalid model with spaces']`
- **When:** Command executes in non-interactive mode
- **Then:** Writes error diagnostics to stderr and process exits with code 1 without altering settings

---

## Section 3 — End-to-End & System Invariants

### 3.1 Orchestrator Agent Invocation Integration

#### Scenario 3.1.1 — Agent Dispatched with Resolved Runner Default Model
- **Scenario:** Should pass resolved runner default model in process arguments when phase override is missing
- **Given:** Orchestrator running with `antigravity` runner and settings configured with `defaultModel: "gemini-3.7-flash"`
- **When:** `AgentInvocationService.invokeAgent` executes for phase `bootstrap`
- **Then:** Spawns `agy` process with arguments including `['--model', 'gemini-3.7-flash']`

#### Scenario 3.1.2 — Agent Dispatched with Phase Override Overriding Runner Default
- **Scenario:** Should pass phase override model in process arguments when both defaults and overrides exist
- **Given:** Settings with runner `defaultModel: "gemini-3.7-flash"` and phase `planning.model: "gemini-3.7-pro"`
- **When:** `AgentInvocationService.invokeAgent` executes for phase `planning`
- **Then:** Spawns `agy` process with arguments including `['--model', 'gemini-3.7-pro']`

### 3.2 Concurrency & Worktree Isolation

#### Scenario 3.2.1 — Workspace Lock Prevents Concurrent Write Collisions
- **Scenario:** Should wait for active workspace file lock before applying CLI settings patch
- **Given:** A background cycle holding a workspace lock during job execution
- **When:** CLI `hrns settings set` is triggered for local scope
- **Then:** CLI coordinates through `WorkspaceLockManager` ensuring atomic write safety without partial file reads

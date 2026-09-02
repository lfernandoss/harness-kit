# Tactical Design — harness-kit

**Domain:** cli_settings_models | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `RunnerSettings` | Domain Model | `defaultModel` must match regex; `defaultEffort` must be valid enum | *see below* |
| `HarnessSettings` | Domain Service | Phase override > Runner default > System baseline fallback | *see below* |
| `SettingsValidator` | Domain Service | Rejects shell metacharacters, negative timeouts, invalid effort strings | *see below* |
| `UpdateSettingsUseCase` | Application | Applies patch-based deep merge before atomic disk write | *see below* |
| `SettingsService` | Presentation (CLI) | Routes interactive prompts and declarative flags to application use cases | *see below* |

```typescript
// RunnerSettings domain model shape
interface RunnerSettings {
  defaultModel?: string; defaultEffort?: 'low' | 'medium' | 'high' | 'xhigh';
  timeoutMs?: number; phases?: Record<string, PhaseSettings>
}
```

```typescript
// HarnessSettings resolution logic
resolve(runnerKey: string, phaseKey: string): PhaseSettings {
  const r = this.settings[runnerKey] ?? {}; const p = r.phases?.[phaseKey] ?? {};
  return { model: p.model ?? r.defaultModel, effort: p.effort ?? r.defaultEffort, timeoutMs: p.timeoutMs ?? r.timeoutMs }
}
```

```typescript
// SettingsValidator sanitization
static validateModel(model?: string): void {
  if (model && !/^[a-zA-Z0-9._:/-]+$/.test(model)) throw new Error('Invalid model identifier');
}
```

```typescript
// UpdateSettingsUseCase patch execution
async execute(input: UpdateSettingsInput): Promise<void> {
  const current = await this.readCurrent(input.scope); const merged = this.deepMerge(current, input.patch);
  await this.writer.write(input.path, this.validator.validate(merged));
}
```

```typescript
// SettingsService CLI entrypoint
export async function cmdSettings(cwd: string, args: string[]): Promise<void> {
  if (args[0] === 'set') return executeSetCommand(cwd, args.slice(1));
  return runInteractiveWizard(cwd);
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `ModelString` | Domain / VO | String matching `^[a-zA-Z0-9._:/-]+$`, max 128 chars | *see below* |
| `EffortLevel` | Domain / VO | Restricted enum: `'low' \| 'medium' \| 'high' \| 'xhigh'` | *see below* |
| `SettingsPatchDto` | Application / DTO | Partial structure of `HarnessSettingsMap` for safe merging | *see below* |
| `CliSettingsCommandArgs` | Presentation / DTO | Parsed CLI flags (`--runner`, `--model`, `--effort`, `--phase`, `--scope`) | *see below* |

```typescript
// ModelString type validation
type ModelString = string & { readonly __brand: unique symbol };
function parseModelString(val: string): ModelString {
  if (!/^[a-zA-Z0-9._:/-]{1,128}$/.test(val)) throw new Error('Invalid model identifier');
  return val as ModelString;
}
```

```typescript
// EffortLevel enum
type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh';
const VALID_EFFORTS: ReadonlySet<string> = new Set(['low', 'medium', 'high', 'xhigh']);
```

```typescript
// SettingsPatchDto contract
interface SettingsPatchDto {
  scope: 'local' | 'global';
  runner: string; defaultModel?: string; defaultEffort?: EffortLevel;
  phases?: Record<string, { model?: string; effort?: EffortLevel; timeoutMs?: number }>;
}
```

```typescript
// CliSettingsCommandArgs
interface CliSettingsCommandArgs {
  runner?: string; model?: string; effort?: EffortLevel;
  phase?: string; scope?: 'local' | 'global'; json?: boolean;
}
```

## Section 3 — Use Cases / Services

| Operation | Responsibility | Coordinates | 4-line Snippet |
|---|---|---|---|
| `GetSettingsUseCase` | Loads and parses target settings with canonical precedence | `PathResolver`, filesystem | *see below* |
| `UpdateSettingsUseCase` | Merges settings patch, validates schema, and writes atomically | `SettingsValidator`, `AtomicSettingsWriter` | *see below* |
| `CliSettingsWizardService` | Manages terminal multi-step selection prompts | `@inquirer/prompts`, `UpdateSettingsUseCase` | *see below* |

```typescript
// GetSettingsUseCase invocation
class GetSettingsUseCase {
  async execute(scope: 'local' | 'global', cwd: string): Promise<HarnessSettingsMap> {
    return HarnessSettings.loadScoped(scope, cwd);
  }
}
```

```typescript
// UpdateSettingsUseCase execution
class UpdateSettingsUseCase {
  async execute(targetPath: string, patch: Partial<HarnessSettingsMap>): Promise<void> {
    const updated = this.mergePatch(this.read(targetPath), patch);
    await AtomicSettingsWriter.write(targetPath, SettingsValidator.validate(updated));
  }
}
```

```typescript
// CliSettingsWizardService prompt flow
async function promptModelSelection(runner: string, current: string): Promise<string> {
  const { input } = await import('@inquirer/prompts');
  return input({ message: `Enter model for ${runner}:`, default: current, validate: v => /^[a-zA-Z0-9._:/-]*$/.test(v) });
}
```

## Section 4 — Events

| Event | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `SettingsUpdated` | `UpdateSettingsUseCase` succeeds | `{ scope, runner, timestamp }` | CLI Logger, Audit Trail |
| `ModelResolved` | `HarnessSettings.resolve()` invoked | `{ runner, phase, model, source }` | Orchestrator DebugContext |

```typescript
// Event payload structure
interface SettingsUpdatedEvent {
  scope: 'local' | 'global'; runner: string;
  updatedAt: string;
}
```

## Section 5 — Persistence Interface

| Resource | Methods | Return Types |
|---|---|---|
| `ISettingsRepository` | `read(scope, cwd)`, `write(scope, cwd, data)` | `Promise<HarnessSettingsMap>`, `Promise<void>` |
| `IAtomicWriter` | `writeAtomic(filePath, content)` | `Promise<void>` |

```typescript
// ISettingsRepository port
interface ISettingsRepository {
  read(scope: 'local' | 'global', cwd: string): Promise<HarnessSettingsMap>;
  write(scope: 'local' | 'global', cwd: string, data: HarnessSettingsMap): Promise<void>;
}
```

```typescript
// IAtomicWriter port
interface IAtomicWriter {
  writeAtomic(filePath: string, content: string): Promise<void>;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Extend SettingsSchema and SettingsValidator with Runner Defaults and Sanitization",
    "description": "Add defaultModel and defaultEffort properties to RunnerSettings in SettingsSchema. Update SettingsValidator to enforce regex sanitization on model identifiers and enum validation on effort levels.",
    "scope": [
      "sdk/src/settings/SettingsSchema.ts",
      "sdk/src/settings/SettingsValidator.ts",
      "sdk/tests/unit/t16-settings.test.ts"
    ],
    "acceptance": [
      "RunnerSettings supports optional defaultModel and defaultEffort fields",
      "SettingsValidator accepts valid model names matching ^[a-zA-Z0-9._:/-]+$ and rejects invalid characters",
      "SettingsValidator validates effort against low, medium, high, xhigh",
      "Unit tests cover valid and invalid model strings and effort inputs"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Two-Tier Fallback Resolution in HarnessSettings",
    "description": "Enhance HarnessSettings.resolve() and mergeMaps to resolve phase-specific model overrides first, falling back to runner-level defaultModel, then system defaults.",
    "scope": [
      "sdk/src/settings/HarnessSettings.ts",
      "sdk/tests/unit/t28-harness-settings.test.ts"
    ],
    "acceptance": [
      "HarnessSettings.resolve() returns phase-specific model when defined",
      "HarnessSettings.resolve() falls back to runner defaultModel when phase model is absent or empty",
      "mergeMaps properly preserves and merges defaultModel across base and override maps",
      "Unit tests verify the two-tier resolution priority"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Patch-Based Deep Merging in UpdateSettingsUseCase",
    "description": "Update UpdateSettingsUseCase to apply partial settings patches on existing configurations without overwriting untouched runners, phases, or timeouts.",
    "scope": [
      "sdk/src/server/application/use-cases/UpdateSettingsUseCase.ts",
      "sdk/src/server/application/use-cases/__tests__/SettingsUseCases.test.ts"
    ],
    "acceptance": [
      "Updating a runner defaultModel preserves all existing phase timeouts and overrides",
      "Updating a phase model leaves sibling phases and other runners intact",
      "AtomicSettingsWriter safely saves the validated merged structure",
      "Use case tests verify patch isolation and error rollbacks"
    ],
    "depends_on": "01"
  },
  {
    "id": "04",
    "title": "Implement Declarative CLI Settings Commands",
    "description": "Add non-interactive commands in settings-service.ts (e.g. hrns settings set <runner> --model <model> [--phase <phase>] [--scope local|global]) supporting scriptable execution and --json output.",
    "scope": [
      "sdk/src/cli/services/settings-service.ts",
      "sdk/tests/unit/t17-orchestrator-settings.test.ts"
    ],
    "acceptance": [
      "CLI supports declarative model configuration via command flags without prompting",
      "Commands exit with code 0 on success and non-zero on validation failure",
      "Supports --json flag to output updated settings DTO for CI/CD scripting",
      "Unit tests cover valid flag arguments, unknown options, and validation failures"
    ],
    "depends_on": "02"
  },
  {
    "id": "05",
    "title": "Implement Interactive CLI Settings Wizard",
    "description": "Enhance cmdSettings interactive flow with @inquirer/prompts to guide users through selecting scope, runner, configuring runner defaults, or managing granular phase overrides.",
    "scope": [
      "sdk/src/cli/services/settings-service.ts"
    ],
    "acceptance": [
      "Running hrns settings without args presents an interactive menu to configure models",
      "Wizard displays current values and prompts for new model identifiers",
      "Validates inputs inline using SettingsValidator before applying updates",
      "Calls UpdateSettingsUseCase to persist changes atomically"
    ],
    "depends_on": "04"
  },
  {
    "id": "06",
    "title": "Verify Agent Invocation and Orchestrator End-to-End Integration",
    "description": "Ensure AgentInvocationService and CLI runners (Antigravity, Claude, Copilot, Cursor) receive resolved models from runner defaults and phase overrides in active runs.",
    "scope": [
      "sdk/src/orchestrator/services/AgentInvocationService.ts",
      "sdk/tests/unit/t17-orchestrator-settings.test.ts"
    ],
    "acceptance": [
      "AgentInvocationService passes configured runner defaultModel to child process args when phase override is absent",
      "Phase-specific override takes precedence in invocation arguments when present",
      "Integration tests confirm correct CLI arguments are constructed for runners"
    ],
    "depends_on": "05"
  }
]
```

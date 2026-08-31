# Tactical Design — harness-kit

**Domain:** settings_management | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `SettingsView` | Component / View Container | Mounts at `/settings`; renders scope selector, editor tabs, action bar, and safety modals | *see snippet below* |
| `SettingsFormEditor` | Component / Form Layer | Structured form for runners, base timeouts (> 0), models, and per-phase override maps | *see snippet below* |
| `RawJsonEditor` | Component / Code Editor | Direct JSON editor with syntax highlighting, live schema diagnostics, and format prettifier | *see snippet below* |
| `ScopeSelector` | Component / Navigation | Toggles target between Global (`~/.config/...`) and Local (`.harness-kit/...`) files | *see snippet below* |
| `SettingsService` | Inbound / Outbound Adapter | Backend use cases managing load, update, renew, validate, and delete operations via REST | *see snippet below* |
| `AtomicSettingsWriter` | Outbound / Persistence | Writes to temp file before atomic rename; prevents partial file corruption | *see snippet below* |

```typescript
const SettingsView: React.FC = () => {
  const { scope, settings, isDirty, save, renew, remove } = useSettings();
  return <div className="settings-view"><ScopeSelector scope={scope} /><SettingsEditor settings={settings} /></div>;
};
```

```typescript
const SettingsFormEditor: React.FC<{ settings: HarnessSettingsMap; onChange: (map: HarnessSettingsMap) => void }> = ({ settings, onChange }) => {
  return <form className="settings-form">{Object.entries(settings).map(([runner, cfg]) => <RunnerCard key={runner} runner={runner} cfg={cfg} />)}</form>;
};
```

```typescript
const RawJsonEditor: React.FC<{ jsonString: string; errors: Diagnostic[]; onChange: (v: string) => void }> = ({ jsonString, errors, onChange }) => {
  return <div className="raw-json-editor"><CodeMirror value={jsonString} onChange={onChange} /><DiagnosticList errors={errors} /></div>;
};
```

```typescript
const ScopeSelector: React.FC<{ scope: SettingsScope; onSelect: (s: SettingsScope) => void }> = ({ scope, onSelect }) => {
  return <div className="scope-selector"><button aria-pressed={scope === 'global'} onClick={() => onSelect('global')}>Global</button><button aria-pressed={scope === 'local'} onClick={() => onSelect('local')}>Local</button></div>;
};
```

```typescript
class SettingsService {
  constructor(private readonly getUC: IGetSettingsUseCase, private readonly updateUC: IUpdateSettingsUseCase) {}
  async getSettings(scope: SettingsScope, project?: string): Promise<SettingsPayload> { return this.getUC.execute(scope, project); }
}
```

```typescript
class AtomicSettingsWriter {
  static write(filePath: string, data: HarnessSettingsMap): void {
    const tmp = `${filePath}.tmp`; writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8'); renameSync(tmp, filePath);
  }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `SettingsScope` | Domain / Value Object | Strict union: `'global' \| 'local'` | *see snippet below* |
| `HarnessSettingsMap` | Domain / Contract | `Record<string, RunnerSettings>`; root configuration map | *see snippet below* |
| `RunnerSettings` | Domain / Contract | `{ timeoutMs?: number; phases?: Record<string, PhaseSettings> }` | *see snippet below* |
| `PhaseSettings` | Domain / Contract | `{ model?: string; effort?: string; timeoutMs?: number }` | *see snippet below* |
| `SettingsDiagnostic` | Domain / Contract | `{ valid: boolean; errors: Array<{ path: string; message: string; line?: number }> }` | *see snippet below* |
| `SettingsApiPayload` | Integration / DTO | `{ scope: SettingsScope; targetPath: string; exists: boolean; settings: HarnessSettingsMap }` | *see snippet below* |

```typescript
type SettingsScope = 'global' | 'local';
const isSettingsScope = (v: unknown): v is SettingsScope => v === 'global' || v === 'local';
```

```typescript
interface HarnessSettingsMap {
  [runner: string]: RunnerSettings;
}
```

```typescript
interface RunnerSettings {
  readonly timeoutMs?: number; // integer > 0
  readonly phases?: Record<string, PhaseSettings>;
}
```

```typescript
interface PhaseSettings {
  readonly model?: string; readonly effort?: string;
  readonly timeoutMs?: number; // integer > 0
}
```

```typescript
interface SettingsDiagnostic {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<{ path: string; message: string; line?: number }>;
}
```

```typescript
interface SettingsApiPayload {
  readonly scope: SettingsScope; readonly targetPath: string;
  readonly exists: boolean; readonly settings: HarnessSettingsMap;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `useSettings` | State hook managing scope, draft state, dirty flag, and API operations | `SettingsApiClient`, LocalStorage, Toast Service | *see snippet below* |
| `validateSettingsMap` | Validates schema conformance, agent names, and positive timeouts | `SettingsSchema`, `Runner` enum, `DiagnosticCollector` | *see snippet below* |
| `RenewSettingsUseCase` | Recreates target settings file with canonical `DEFAULT_SETTINGS` | `AtomicSettingsWriter`, `PathResolver` | *see snippet below* |
| `DeleteSettingsUseCase` | Safely removes target `settings.json` file from disk | `PathResolver`, `fs.unlinkSync` | *see snippet below* |

```typescript
function useSettings(initialScope: SettingsScope = 'global'): SettingsState & SettingsActions {
  const [scope, setScope] = useState<SettingsScope>(initialScope); const [draft, setDraft] = useState<HarnessSettingsMap>({});
  return { scope, draft, setScope, updateDraft: (s) => setDraft(s), save: async () => {}, renew: async () => {}, remove: async () => {} };
}
```

```typescript
function validateSettingsMap(data: unknown): SettingsDiagnostic {
  if (typeof data !== 'object' || data === null) return { valid: false, errors: [{ path: '', message: 'Must be an object' }] };
  return { valid: true, errors: [] };
}
```

```typescript
class RenewSettingsUseCase {
  async execute(scope: SettingsScope, projectPath?: string): Promise<SettingsApiPayload> {
    const target = PathResolver.resolve(scope, projectPath); AtomicSettingsWriter.write(target, DEFAULT_SETTINGS); return { scope, targetPath: target, exists: true, settings: DEFAULT_SETTINGS };
  }
}
```

```typescript
class DeleteSettingsUseCase {
  async execute(scope: SettingsScope, projectPath?: string): Promise<{ success: boolean; targetPath: string }> {
    const target = PathResolver.resolve(scope, projectPath); if (existsSync(target)) unlinkSync(target); return { success: true, targetPath: target };
  }
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `SettingsLoaded` | GET `/orchestrator/settings` completes | `{ scope: SettingsScope, settings: HarnessSettingsMap, targetPath: string }` | `useSettings`, `SettingsView` |
| `SettingsSaved` | POST `/orchestrator/settings` persists changes | `{ scope: SettingsScope, settings: HarnessSettingsMap, timestamp: number }` | `useSettings`, Notification Toast |
| `SettingsRenewed` | POST `/orchestrator/settings/renew` succeeds | `{ scope: SettingsScope, settings: HarnessSettingsMap }` | `SettingsFormEditor`, `RawJsonEditor` |
| `SettingsDeleted` | DELETE `/orchestrator/settings` succeeds | `{ scope: SettingsScope, targetPath: string }` | `SettingsView`, Empty State View |
| `ValidationReported` | Schema or syntax validation completes | `{ valid: boolean, errors: Array<{ path: string, message: string }> }` | UI Error Badges, Save Button State |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `ISettingsApiClient` | `fetchSettings(scope, project?)`, `saveSettings(scope, data, project?)`, `renewSettings(scope, project?)`, `deleteSettings(scope, project?)`, `validateSettings(data)` | `Promise<SettingsApiPayload>`, `Promise<SettingsApiPayload>`, `Promise<SettingsApiPayload>`, `Promise<void>`, `Promise<SettingsDiagnostic>` |

```typescript
interface ISettingsApiClient {
  fetchSettings(scope: SettingsScope, project?: string): Promise<SettingsApiPayload>;
  saveSettings(scope: SettingsScope, settings: HarnessSettingsMap, project?: string): Promise<SettingsApiPayload>;
  renewSettings(scope: SettingsScope, project?: string): Promise<SettingsApiPayload>;
  deleteSettings(scope: SettingsScope, project?: string): Promise<void>;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Backend Settings Use Cases and REST Route Handlers",
    "description": "Extends server application with renew, delete, and validate settings use cases and exposes corresponding REST route endpoints.",
    "scope": [
      "sdk/src/server/application/use-cases/RenewSettingsUseCase.ts",
      "sdk/src/server/application/use-cases/DeleteSettingsUseCase.ts",
      "sdk/src/server/adapters/inbound/http/routes/RouteHandlers.ts",
      "sdk/src/server/application/use-cases/__tests__/SettingsUseCases.test.ts"
    ],
    "acceptance": [
      "Implements RenewSettingsUseCase resetting target settings to DEFAULT_SETTINGS",
      "Implements DeleteSettingsUseCase removing target settings file from disk safely",
      "Exposes GET, POST, DELETE, and /renew endpoints with query validation and error handling"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement SettingsApiClient and DTO Contracts in sdk-web",
    "description": "Creates frontend HTTP client service and TypeScript contracts interfacing with backend settings endpoints.",
    "scope": [
      "sdk-web/src/services/SettingsApiClient.ts",
      "sdk-web/src/types/settings.types.ts",
      "sdk-web/src/services/__tests__/SettingsApiClient.spec.ts"
    ],
    "acceptance": [
      "Implements fetchSettings, saveSettings, renewSettings, deleteSettings, and validateSettings methods",
      "Correctly serializes query parameters for scope and project target",
      "Handles HTTP error responses and maps backend error DTOs to structured diagnostics"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement useSettings Hook with Dual-Mode Synchronization and Validation",
    "description": "Builds custom hook managing active scope, dirty tracking, two-way sync between form and raw JSON models, and debounced validation.",
    "scope": [
      "sdk-web/src/hooks/useSettings.ts",
      "sdk-web/src/utils/settingsValidator.ts",
      "sdk-web/src/hooks/__tests__/useSettings.spec.ts"
    ],
    "acceptance": [
      "Maintains active scope state (global/local) and loads settings on scope change",
      "Tracks dirty state between original loaded configuration and current user draft",
      "Synchronizes edits bidirectionally between structured form object and raw JSON string with validation"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement ScopeSelector, SettingsFormEditor, and RawJsonEditor Components",
    "description": "Implements UI components for scope switching, visual runner/phase override cards, and syntax-highlighted raw JSON editor.",
    "scope": [
      "sdk-web/src/components/settings/ScopeSelector.tsx",
      "sdk-web/src/components/settings/SettingsFormEditor.tsx",
      "sdk-web/src/components/settings/RawJsonEditor.tsx",
      "sdk-web/src/components/settings/__tests__/SettingsFormEditor.spec.ts"
    ],
    "acceptance": [
      "Renders accessible scope selector tabs matching Itaú theme design tokens",
      "Renders runner configuration cards with phase override inputs for model, effort, and timeoutMs",
      "Renders raw JSON editor with line numbers, syntax highlighting, and inline diagnostic error markers"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement SettingsView Container with Action Bar and Confirmation Modals",
    "description": "Constructs the full Settings page integrating editor modes, action buttons (Save, Renew, Delete), and destructive action modals.",
    "scope": [
      "sdk-web/src/views/SettingsView.tsx",
      "sdk-web/src/components/settings/SettingsConfirmModal.tsx",
      "sdk-web/src/views/__tests__/SettingsView.spec.ts"
    ],
    "acceptance": [
      "Renders full settings layout at /settings route with view mode toggle (Form vs Raw JSON)",
      "Displays confirmation modal before executing Renew or Delete actions",
      "Shows status toast notifications upon successful save, renew, or delete operations"
    ],
    "depends_on": "04"
  }
]
```

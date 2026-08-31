# Tactical Design — harness-kit

**Domain:** workspace_initialization | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `InitializeWorkspaceUseCase` | Application / Use Case | Validates overwrite policy; creates tracking files and `BOOTSTRAP-CONFIG.json` | *see snippet below* |
| `GetWorkspaceInitStatusUseCase` | Application / Query | Inspects workspace paths, checks existing artifacts, returns default steering rules | *see snippet below* |
| `InitWizardPage` | Component / Page View | Coordinates 5-step setup stepper, draft state, and submit lifecycle | *see snippet below* |
| `SteeringRulesEditor` | Component / Form View | Edits phase-partitioned steering rules with default rule inheritance | *see snippet below* |
| `OverwriteGuardDialog` | Component / Modal Guard | Accessible dialog requiring explicit confirmation before wiping existing `docs/product/` | *see snippet below* |
| `WorkspaceInitApiClient` | Integration / HTTP Client | Calls `GET /api/workspace/init/status` and `POST /api/workspace/init` | *see snippet below* |

```typescript
class InitializeWorkspaceUseCase {
  constructor(private readonly fsm: FileStateManager, private readonly lock: WorkspaceLockManager) {}
  async execute(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO> { /* ... */ }
}
```

```typescript
class GetWorkspaceInitStatusUseCase {
  constructor(private readonly fsm: FileStateManager) {}
  async execute(workspacePath: string): Promise<WorkspaceInitStatusDTO> { /* ... */ }
}
```

```typescript
const InitWizardPage: React.FC = () => {
  const { currentStep, goToNext, submitInit } = useWorkspaceInit();
  return <div className="init-wizard-page"><InitStepper current={currentStep} /><WizardStepContent /></div>;
};
```

```typescript
const SteeringRulesEditor: React.FC<SteeringRulesEditorProps> = ({ rules, onChange }) => {
  return <div className="steering-editor">{PHASES.map(p => <PhaseRuleSection key={p.key} phase={p} />)}</div>;
};
```

```typescript
const OverwriteGuardDialog: React.FC<OverwriteGuardProps> = ({ isOpen, onConfirm, onCancel }) => {
  return <dialog open={isOpen} className="overwrite-dialog"><p>Existing docs/product found.</p><button onClick={onConfirm}>Overwrite</button></dialog>;
};
```

```typescript
class WorkspaceInitApiClient {
  async getStatus(path?: string): Promise<WorkspaceInitStatusDTO> { return http.get('/api/workspace/init/status'); }
  async initialize(payload: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO> { return http.post('/api/workspace/init', payload); }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `PhaseSteeringKey` | Domain / Value Object | Strict union: `'user' \| 'bootstrap' \| 'planning' \| 'implementation' \| 'review' \| 'memory'` | *see snippet below* |
| `SteeringRulesPayload` | Domain / DTO | Maps each `PhaseSteeringKey` to an array of trimmed, non-empty string rules | *see snippet below* |
| `WorkspaceInitStatusDTO` | Application / Query DTO | Contains path existence flags, existing file lists, and default rules | *see snippet below* |
| `InitializeWorkspaceDTO` | Application / Command DTO | Contains `workspacePath`, optional `forceOverwrite`, custom rules, and `createSettings` | *see snippet below* |
| `WorkspaceInitResultDTO` | Application / Result DTO | Contains `success`, `workspacePath`, `createdFiles`, and optional `settingsPath` | *see snippet below* |
| `WizardStep` | Frontend / State Enum | Strict union: `'detection' \| 'overwrite_guard' \| 'steering_editor' \| 'settings_setup' \| 'summary'` | *see snippet below* |

```typescript
type PhaseSteeringKey = 'user' | 'bootstrap' | 'planning' | 'implementation' | 'review' | 'memory';
type SteeringRulesPayload = Record<PhaseSteeringKey, string[]>;
```

```typescript
interface WorkspaceInitStatusDTO {
  readonly workspacePath: string; readonly hasExistingProduct: boolean;
  readonly hasExistingSettings: boolean; readonly defaultRules: SteeringRulesPayload;
}
```

```typescript
interface InitializeWorkspaceDTO {
  readonly workspacePath?: string; readonly forceOverwrite?: boolean;
  readonly customSteeringRules?: Partial<SteeringRulesPayload>; readonly createSettings?: boolean;
}
```

```typescript
interface WorkspaceInitResultDTO {
  readonly success: boolean; readonly workspacePath: string;
  readonly createdFiles: string[]; readonly settingsPath?: string;
}
```

```typescript
type WizardStep = 'detection' | 'overwrite_guard' | 'steering_editor' | 'settings_setup' | 'summary';
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `compileSteeringRules` | Merges default and custom steering rules, filtering empty entries | `SteeringRulesPayload`, `PhaseSteeringKey` | *see snippet below* |
| `useWorkspaceInit` | Coordinates wizard step transitions, state drafts, and submit execution | `WorkspaceInitApiClient`, React State | *see snippet below* |
| `registerWorkspaceInitRoutes` | Binds HTTP controllers for `/api/workspace/init/status` and `/api/workspace/init` | Fastify/Express Router, Application Use Cases | *see snippet below* |
| `validateWorkspaceDirectory` | Ensures workspace path is valid and writable without path traversal | Node.js `fs.promises`, `path.resolve` | *see snippet below* |

```typescript
function compileSteeringRules(defaults: SteeringRulesPayload, custom?: Partial<SteeringRulesPayload>): SteeringRulesPayload {
  const keys: PhaseSteeringKey[] = ['user', 'bootstrap', 'planning', 'implementation', 'review', 'memory'];
  return keys.reduce((acc, k) => ({ ...acc, [k]: [...(defaults[k] || []), ...(custom?.[k] || [])] }), {} as SteeringRulesPayload);
}
```

```typescript
function useWorkspaceInit(): WorkspaceInitHookResult {
  const [step, setStep] = useState<WizardStep>('detection');
  const [rules, setRules] = useState<Partial<SteeringRulesPayload>>({});
  // coordinates status query, step transitions, and initialization submission
}
```

```typescript
function registerWorkspaceInitRoutes(router: FastifyInstance, initUseCase: InitializeWorkspaceUseCase, statusUseCase: GetWorkspaceInitStatusUseCase): void {
  router.get('/api/workspace/init/status', async (req, res) => res.send(await statusUseCase.execute(req.query.path)));
  router.post('/api/workspace/init', async (req, res) => res.send(await initUseCase.execute(req.body)));
}
```

```typescript
async function validateWorkspaceDirectory(targetPath: string): Promise<boolean> {
  const resolved = path.resolve(targetPath);
  return (await fs.promises.stat(resolved)).isDirectory();
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `WorkspaceInitStatusFetched` | Pre-flight inspection query completes | `{ hasExistingProduct: boolean, hasExistingSettings: boolean, defaultRules: SteeringRulesPayload }` | `InitWizardPage`, `useWorkspaceInit` |
| `WizardStepChanged` | User clicks Next / Back or step completes | `{ fromStep: WizardStep, toStep: WizardStep }` | `InitStepper`, `InitWizardPage` |
| `SteeringRulesUpdated` | User edits rules in a specific phase tab | `{ phase: PhaseSteeringKey, rules: string[] }` | `SteeringRulesEditor`, `RulesPreview` |
| `WorkspaceInitSubmitted` | User confirms final step to initialize | `{ workspacePath?: string, forceOverwrite?: boolean, customSteeringRules?: Partial<SteeringRulesPayload> }` | `WorkspaceInitApiClient`, `InitializeWorkspaceUseCase` |
| `WorkspaceInitialized` | File provisioning and config save succeed | `{ workspacePath: string, createdFiles: string[], settingsPath?: string }` | `SummaryStep`, NavigationRouter (`/run`) |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `IFileStateManager` | `ensureProductFiles()`, `loadBootstrapConfig()`, `saveBootstrapConfig(config)`, `removeProductDir()` | `void`, `BootstrapConfig`, `void` |
| `IHarnessSettingsService` | `createLocalSettings(cwd)`, `hasLocalSettings(cwd)` | `string`, `boolean` |
| `IWorkspaceInitApiClient` | `fetchStatus(path?)`, `initializeWorkspace(dto)` | `Promise<WorkspaceInitStatusDTO>`, `Promise<WorkspaceInitResultDTO>` |

```typescript
interface IFileStateManager {
  ensureProductFiles(): void; hasProductDir(): boolean; removeProductDir(): void;
  loadBootstrapConfig(): BootstrapConfig; saveBootstrapConfig(config: BootstrapConfig): void;
}
```

```typescript
interface IHarnessSettingsService {
  createLocalSettings(cwd: string): string;
  hasLocalSettings(cwd: string): boolean;
}
```

```typescript
interface IWorkspaceInitApiClient {
  fetchStatus(workspacePath?: string): Promise<WorkspaceInitStatusDTO>;
  initializeWorkspace(dto: InitializeWorkspaceDTO): Promise<WorkspaceInitResultDTO>;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Workspace Init Status and Execution Use Cases",
    "description": "Creates GetWorkspaceInitStatusUseCase and InitializeWorkspaceUseCase with atomic file generation, steering rule compilation, and overwrite protection.",
    "scope": [
      "sdk/src/server/application/use-cases/GetWorkspaceInitStatusUseCase.ts",
      "sdk/src/server/application/use-cases/InitializeWorkspaceUseCase.ts",
      "sdk/src/server/application/use-cases/__tests__/InitializeWorkspaceUseCase.spec.ts"
    ],
    "acceptance": [
      "GetWorkspaceInitStatusUseCase returns workspace artifact existence and default steering rules",
      "InitializeWorkspaceUseCase compiles custom rules with defaults and saves BOOTSTRAP-CONFIG.json and docs/product/ tracking files",
      "Rejects initialization with 409 Conflict when docs/product exists and forceOverwrite is false"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Register Workspace Initialization HTTP API Endpoints",
    "description": "Exposes GET /api/workspace/init/status and POST /api/workspace/init routes with request validation and WorkspaceLockManager concurrency protection.",
    "scope": [
      "sdk/src/server/adapters/inbound/http/WorkspaceInitController.ts",
      "sdk/src/server/adapters/inbound/http/__tests__/WorkspaceInitController.spec.ts"
    ],
    "acceptance": [
      "Handles GET and POST initialization requests with schema validation",
      "Blocks initialization and returns 423 Locked / 409 Conflict if an active orchestrator job is currently running on the workspace"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Frontend WorkspaceInitApiClient and useWorkspaceInit Hook",
    "description": "Creates API client and state management hook coordinating 5-step wizard progression, form draft persistence, and initialization dispatch.",
    "scope": [
      "sdk-web/src/services/WorkspaceInitApiClient.ts",
      "sdk-web/src/hooks/useWorkspaceInit.ts",
      "sdk-web/src/hooks/__tests__/useWorkspaceInit.spec.ts"
    ],
    "acceptance": [
      "Coordinates wizard progression across detection, overwrite guard, steering editor, settings setup, and summary steps",
      "Integrates API communication with error handling, loading state flags, and form validation"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement SteeringRulesEditor and OverwriteGuard Dialog Components",
    "description": "Builds interactive phase-by-phase steering rules editor with defaults preview and accessible overwrite safety dialog styled with Itaú tokens.",
    "scope": [
      "sdk-web/src/components/init/SteeringRulesEditor.tsx",
      "sdk-web/src/components/init/OverwriteGuardDialog.tsx",
      "sdk-web/src/components/init/__tests__/SteeringRulesEditor.spec.ts"
    ],
    "acceptance": [
      "Renders tabbed/accordion view for all 6 execution phases allowing adding, editing, and removing steering rules",
      "Displays accessible modal warning when existing docs/product directory is detected, requiring explicit confirmation to proceed"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Complete InitWizardPage with Stepper and Run Launcher",
    "description": "Assembles full workspace initialization wizard page with visual stepper, settings generation toggle, and direct navigation trigger to /run.",
    "scope": [
      "sdk-web/src/pages/InitWizardPage.tsx",
      "sdk-web/src/components/init/InitStepper.tsx",
      "sdk-web/src/pages/__tests__/InitWizardPage.spec.ts"
    ],
    "acceptance": [
      "Renders complete multi-step wizard adhering to Itaú light and dark theme tokens",
      "Displays summary of generated tracking files upon completion and provides immediate action to trigger first orchestration run"
    ],
    "depends_on": "04"
  }
]
```

# Tactical Design — harness-kit

**Domain:** diagnostics_candidate_review | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `DiagnosticsDashboard` | Component / View | Renders ledger summary, batch controls, and report; disables run when pending count is 0 | *see snippet below* |
| `CandidateList` | Component / View | Renders candidate grid/table with status badges (`PROPOSED`, `APPLIED`, `PROMOTED`) | *see snippet below* |
| `CandidateDetailModal` | Component / Drawer | Displays candidate rationale, prompt diff preview, and promotion execution actions | *see snippet below* |
| `DiagnosticsController` | Server / Inbound Adapter | Exposes REST/SSE endpoints consuming SDK `DiagnoseService` and `CandidateReader` | *see snippet below* |
| `DiagnosticsApiClient` | Integration / HTTP Client | Typesafe API client calling backend diagnose and candidate endpoints with error handling | *see snippet below* |

```typescript
const DiagnosticsDashboard: React.FC = () => {
  const { pendingSessions, runBatch, isRunning, progress, report } = useDiagnostics();
  return <div className="diagnostics-dashboard"><BatchExecutionPanel pending={pendingSessions} onRun={runBatch} isRunning={isRunning} progress={progress} />{report && <DiagnoseReportView report={report} />}</div>;
};
```

```typescript
const CandidateList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const { candidates, isLoading, filter, setFilter } = useCandidates();
  return <div className="candidate-list"><CandidateFilterBar filter={filter} onChange={setFilter} />{candidates.map(c => <CandidateCard key={c.candidateId} candidate={c} onClick={() => onSelect(c.candidateId)} />)}</div>;
};
```

```typescript
const CandidateDetailModal: React.FC<{ candidateId: string; onClose: () => void }> = ({ candidateId, onClose }) => {
  const { candidate, promoteAutonomous, isPromoting } = useCandidateDetail(candidateId);
  return <div className="modal-backdrop"><div className="candidate-modal"><DiffPreview diff={candidate?.promptDiff} /><button disabled={isPromoting} onClick={promoteAutonomous}>Apply via LLM</button></div></div>;
};
```

```typescript
class DiagnosticsController {
  constructor(private readonly diagnoseService: DiagnoseService, private readonly candidateReader: typeof CandidateReader) {}
  async getSessions(req: Request, res: Response): Promise<void> { res.json({ pending: this.diagnoseService.getPendingSessions() }); }
}
```

```typescript
class DiagnosticsApiClient {
  async getPendingSessions(): Promise<DiagnoseSessionDTO[]> { return (await fetch('/api/diagnose/sessions')).json(); }
  async runBatch(opts: DiagnoseBatchRunOptions): Promise<DiagnoseReportDTO> { return (await fetch('/api/diagnose/run', { method: 'POST', body: JSON.stringify(opts) })).json(); }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `DiagnoseSessionDTO` | Domain / DTO | Immutable record: `{ sessionId, timestamp, runner, model, phase, domain, status }` | *see snippet below* |
| `CandidateSummaryDTO` | Domain / DTO | Validates `candidateId` matches `candidate-YYYY-MM-DD-NNN`; includes `targetSkill` & `status` | *see snippet below* |
| `CandidateDetailDTO` | Domain / DTO | Contains full `rationale`, `promptDiff`, `targetSkill`, and validated `status` | *see snippet below* |
| `DiagnoseBatchRunOptions` | Application / Input DTO | Validates `batchSize >= 1`, optional `agentType`, `model`, and `effort` strings | *see snippet below* |
| `PromotionResultDTO` | Application / Output DTO | Immutable `{ success: boolean, candidateId: string, targetSkill: string, error?: string }` | *see snippet below* |

```typescript
interface DiagnoseSessionDTO {
  readonly sessionId: string; readonly timestamp: string; readonly runner: string;
  readonly model: string; readonly phase: string; readonly domain?: string; readonly status: 'pending' | 'processed';
}
```

```typescript
interface CandidateSummaryDTO {
  readonly candidateId: string; readonly targetSkill: string;
  readonly status: 'PROPOSED' | 'APPLIED' | 'PROMOTED'; readonly path: string; readonly shortRationale?: string;
}
```

```typescript
interface CandidateDetailDTO extends CandidateSummaryDTO {
  readonly rationale: string; readonly promptDiff: string;
  readonly generatedAt?: string; readonly runnerCommand: string;
}
```

```typescript
interface DiagnoseBatchRunOptions {
  readonly batchSize?: number; readonly agentType?: string;
  readonly model?: string; readonly effort?: string;
}
```

```typescript
interface PromotionResultDTO {
  readonly success: boolean; readonly candidateId: string;
  readonly targetSkill: string; readonly runnerType: string; readonly error?: string;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `useDiagnostics` | Manages diagnose session state, batch execution trigger, and progress updates | `DiagnosticsApiClient`, `SSEConsumer` | *see snippet below* |
| `useCandidates` | Manages candidate listing, filtering, and live status cache | `DiagnosticsApiClient`, `CandidateFilter` | *see snippet below* |
| `useCandidateDetail` | Loads individual candidate metadata, prompt diff, and dispatches promotion | `DiagnosticsApiClient`, `CandidateDetailDTO` | *see snippet below* |
| `executeDiagnoseBatch` | Backend coordinator running batch loop and emitting SSE progress | `DiagnoseService`, `JsonlSessionLedger`, `SSEBroadcaster` | *see snippet below* |
| `promoteCandidateAutonomous` | Backend action delegating LLM prompt mutation to adapter | `MetaHarnessAgentAdapter`, `CandidatePromotionService` | *see snippet below* |

```typescript
function useDiagnostics(): DiagnosticsState & { runBatch(opts: DiagnoseBatchRunOptions): Promise<void> } {
  const [state, setState] = useState<DiagnosticsState>({ pendingSessions: [], isRunning: false, progress: null, report: null });
  return { ...state, runBatch: async (opts) => { setState(s => ({ ...s, isRunning: true })); await api.runBatch(opts); } };
}
```

```typescript
function useCandidates(): { candidates: CandidateSummaryDTO[]; filter: CandidateFilter; setFilter: (f: CandidateFilter) => void } {
  const [candidates, setCandidates] = useState<CandidateSummaryDTO[]>([]);
  return { candidates, filter, setFilter };
}
```

```typescript
function useCandidateDetail(candidateId: string): { candidate: CandidateDetailDTO | null; promoteAutonomous: () => Promise<void>; isPromoting: boolean } {
  const [candidate, setCandidate] = useState<CandidateDetailDTO | null>(null); const [isPromoting, setIsPromoting] = useState(false);
  return { candidate, isPromoting, promoteAutonomous: async () => { setIsPromoting(true); await api.promoteCandidate(candidateId); setIsPromoting(false); } };
}
```

```typescript
async function executeDiagnoseBatch(service: DiagnoseService, opts: DiagnoseBatchRunOptions, onProgress: (p: BatchProgressDTO) => void): Promise<DiagnoseReportDTO> {
  return await service.processAllPendingInBatches(opts.batchSize ?? 3, (b) => onProgress({ processed: b.processed, remaining: b.remaining }));
}
```

```typescript
async function promoteCandidateAutonomous(adapter: MetaHarnessAgentAdapter, id: string, skill: string, runner: string): Promise<PromotionResultDTO> {
  const res = await adapter.invokeCandidatePromotion(id, skill, runner);
  return { success: res.success, candidateId: id, targetSkill: skill, runnerType: runner, error: res.error };
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `DiagnoseBatchProgress` | Batch finishes processing a sub-slice of sessions | `{ processed: number, remaining: number, total: number }` | `DiagnosticsDashboard`, `BatchExecutionPanel` |
| `DiagnoseBatchFinished` | All pending sessions processed or batch loop finishes | `{ processedCount: number, report: DiagnoseReportDTO }` | `DiagnosticsDashboard`, `useDiagnostics` |
| `CandidateStatusChanged` | Candidate successfully applied or promoted to active skill | `{ candidateId: string, targetSkill: string, newStatus: 'APPLIED' \| 'PROMOTED' }` | `CandidateList`, `CandidateDetailModal` |
| `PromotionProgressStream` | Agent runner stdout/stderr stream during autonomous promotion | `{ candidateId: string, logChunk: string, timestamp: number }` | `PromotionLogViewer`, `CandidateDetailModal` |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `IDiagnosticsApiClient` | `getSessions()`, `runBatch(opts)`, `getCandidates()`, `getCandidate(id)`, `promoteCandidate(id, opts)` | `Promise<DiagnoseSessionDTO[]>`, `Promise<DiagnoseReportDTO>`, `Promise<CandidateSummaryDTO[]>`, `Promise<CandidateDetailDTO>`, `Promise<PromotionResultDTO>` |
| `IDiagnoseLedgerAdapter` | `loadPending()`, `rewriteBatchStatuses(ids, status)` | `DiagnoseSessionRecord[]`, `void` |
| `ICandidateDiskAdapter` | `listCandidates()`, `readCandidate(id)`, `getCandidateStatus(id, skill)` | `string[]`, `CandidateDetailDTO \| null`, `CandidateStatus` |

```typescript
interface IDiagnosticsApiClient {
  getSessions(): Promise<DiagnoseSessionDTO[]>;
  runBatch(opts: DiagnoseBatchRunOptions): Promise<DiagnoseReportDTO>;
  getCandidates(): Promise<CandidateSummaryDTO[]>;
  getCandidate(id: string): Promise<CandidateDetailDTO>;
  promoteCandidate(id: string, opts?: { runner?: string }): Promise<PromotionResultDTO>;
}
```

```typescript
interface IDiagnoseLedgerAdapter {
  loadPending(): DiagnoseSessionRecord[];
  rewriteBatchStatuses(sessionIds: string[], newStatus: 'processed'): void;
}
```

```typescript
interface ICandidateDiskAdapter {
  listCandidates(): string[];
  readCandidate(id: string): CandidateDetailDTO | null;
  getCandidateStatus(id: string, targetSkill: string): 'PROPOSED' | 'APPLIED' | 'PROMOTED';
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Diagnostics and Candidate DTOs and API Client",
    "description": "Defines domain DTOs and creates the frontend API client for diagnostics sessions, batch runs, and candidate operations.",
    "scope": [
      "sdk-web/src/types/diagnostics.ts",
      "sdk-web/src/api/diagnosticsApi.ts",
      "sdk-web/src/api/__tests__/diagnosticsApi.spec.ts"
    ],
    "acceptance": [
      "Defines typed interfaces for DiagnoseSessionDTO, CandidateSummaryDTO, CandidateDetailDTO, and DiagnoseBatchRunOptions",
      "Implements API client methods with complete error handling and status code validation",
      "Passes unit tests for API client requests, query params, and JSON error normalization"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Diagnostics and Candidates Backend API Endpoints in sdk-web",
    "description": "Creates REST and SSE routes in sdk-web server consuming SDK DiagnoseService, JsonlSessionLedger, and CandidateReader.",
    "scope": [
      "sdk-web/src/server/routes/diagnosticsRoutes.ts",
      "sdk-web/src/server/controllers/DiagnosticsController.ts",
      "sdk-web/src/server/__tests__/diagnosticsRoutes.spec.ts"
    ],
    "acceptance": [
      "Exposes GET /api/diagnose/sessions and POST /api/diagnose/run streaming progress via SSE",
      "Exposes GET /api/diagnose/candidates and GET /api/diagnose/candidates/:id returning parsed candidate metadata and diffs",
      "Exposes POST /api/diagnose/candidates/:id/promote delegating autonomous execution to MetaHarnessAgentAdapter"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement useDiagnostics and useCandidates React Hooks with SSE Integration",
    "description": "Builds reactive hooks managing diagnostics state, real-time batch progression, and candidate listing with status filters.",
    "scope": [
      "sdk-web/src/hooks/useDiagnostics.ts",
      "sdk-web/src/hooks/useCandidates.ts",
      "sdk-web/src/hooks/__tests__/useDiagnostics.spec.ts"
    ],
    "acceptance": [
      "Manages pending sessions state, batch trigger execution, and live SSE progress subscription",
      "Manages candidate list state with filtering by status and target skill",
      "Optimistically updates candidate status upon promotion dispatch"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement DiagnosticsDashboard and BatchExecutionPanel Components",
    "description": "Builds the diagnostics dashboard view with session metrics, batch configuration controls, and report visualizer.",
    "scope": [
      "sdk-web/src/components/diagnostics/DiagnosticsDashboard.tsx",
      "sdk-web/src/components/diagnostics/BatchExecutionPanel.tsx",
      "sdk-web/src/components/diagnostics/__tests__/DiagnosticsDashboard.spec.tsx"
    ],
    "acceptance": [
      "Renders pending session counter, runner selection options, and batch size configuration input",
      "Displays real-time progress bar with processed and remaining counters during active batch run",
      "Renders structured diagnosis report with generated trace IDs and session breakdown"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement CandidateList, DiffPreview, and PromotionModal Components",
    "description": "Builds candidate catalog cards, interactive prompt diff previewer, and autonomous/interactive promotion modal.",
    "scope": [
      "sdk-web/src/components/candidates/CandidateList.tsx",
      "sdk-web/src/components/candidates/CandidateDetailModal.tsx",
      "sdk-web/src/components/candidates/__tests__/CandidateList.spec.tsx"
    ],
    "acceptance": [
      "Renders candidate cards with color-coded status badges (PROPOSED/APPLIED/PROMOTED) and target skill indicators",
      "Displays side-by-side prompt diff viewer with syntax highlighting and rationale accordion",
      "Provides one-click autonomous LLM promotion button and interactive CLI command copy snippet"
    ],
    "depends_on": "04"
  }
]
```
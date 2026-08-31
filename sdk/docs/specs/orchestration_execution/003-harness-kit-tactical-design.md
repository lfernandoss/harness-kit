# Tactical Design — harness-kit

**Domain:** orchestration_execution | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `OrchestrationDashboardView` | Component / Page | Mounts in shell `<Outlet />`; switches between configuration form and active execution dashboard | *see snippet below* |
| `RunnerConfigCard` | Component / Form | Validates runner selection against `AgentRunnerFactory` registered types and non-empty scope | *see snippet below* |
| `PhaseTimeline` | Component / Visualizer | Renders discrete phases (`BOOTSTRAP` to `DEPLOY`); highlights active phase with status badge | *see snippet below* |
| `LiveLogConsole` | Component / Console | Renders streamed ANSI terminal output with theme-calibrated dark/light palette and auto-scroll | *see snippet below* |
| `SteeringDrawer` | Component / Interaction | Submits `add_rule`, `rollback`, or `override_score` payloads to `/orchestrator/jobs/:id/steering` | *see snippet below* |
| `EventStreamBroadcaster` | Adapter / Inbound SSE | Maintains SSE client connections, broadcasts phase/log events, and holds 500-event ring buffer | *see snippet below* |

```typescript
const OrchestrationDashboardView: React.FC = () => {
  const { activeJob, isRunning } = useOrchestrationExecution();
  return <div className="orchestration-dashboard">{isRunning ? <LiveExecutionView job={activeJob} /> : <RunnerConfigCard />}</div>;
};
```

```typescript
const RunnerConfigCard: React.FC<{ onStart: (cfg: RunConfigDTO) => void }> = ({ onStart }) => {
  const [mode, setMode] = useState<RunMode>(RunMode.THINKING);
  return <form onSubmit={(e) => { e.preventDefault(); onStart({ mode }); }}><RunnerSelector /><button type="submit">Run</button></form>;
};
```

```typescript
const PhaseTimeline: React.FC<{ currentPhase: Phase; completedPhases: Phase[] }> = ({ currentPhase, completedPhases }) => {
  return <div className="phase-timeline">{ALL_PHASES.map(p => <PhaseStep key={p} phase={p} active={p === currentPhase} done={completedPhases.includes(p)} />)}</div>;
};
```

```typescript
const LiveLogConsole: React.FC<{ lines: LogChunkDTO[]; autoScroll: boolean }> = ({ lines, autoScroll }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return <div ref={scrollRef} className="live-log-console">{lines.map((l, i) => <AnsiSpan key={i} text={l.text} />)}</div>;
};
```

```typescript
const SteeringDrawer: React.FC<{ jobId: string; isOpen: boolean; onClose: () => void }> = ({ jobId, isOpen, onClose }) => {
  const { submitSteering } = useSteering(jobId);
  return <aside className={`steering-drawer ${isOpen ? 'open' : ''}`}><SteeringForm onSubmit={(action) => { submitSteering(action); onClose(); }} /></aside>;
};
```

```typescript
class EventStreamBroadcaster {
  private clients = new Set<ServerResponse>(); private buffer: JobEventDTO[] = [];
  broadcast(event: JobEventDTO): void { this.buffer.push(event); this.clients.forEach(c => c.write(`data: ${JSON.stringify(event)}\n\n`)); }
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `RunConfigDTO` | Domain / Contract | Validates `scope` non-empty, `mode` in `RunMode`, and `projectPaths` contains valid paths | *see snippet below* |
| `JobEventDTO` | Integration / SSE Contract | Discriminated union for SSE events: `phase_change`, `log_chunk`, `telemetry`, `steering_applied` | *see snippet below* |
| `SteeringRequestDTO` | Integration / DTO | Validates action type (`add_rule` \| `rollback` \| `override_score`) and payload constraints | *see snippet below* |
| `LiveSessionState` | State / UI Contract | Tracks `jobId`, `status`, `currentPhase`, `logs`, `telemetry`, and connection state | *see snippet below* |
| `AnsiFormattedChunk` | Styles / VO | Text chunk with mapped foreground/background CSS classes conforming to WCAG AA contrast | *see snippet below* |

```typescript
interface RunConfigDTO {
  readonly scope: string; readonly mode: RunMode;
  readonly agent?: string; readonly model?: string; readonly effort?: string;
}
```

```typescript
type JobEventDTO =
  | { type: 'phase_change'; phase: Phase; timestamp: number }
  | { type: 'log_chunk'; stream: 'stdout' | 'stderr'; text: string }
  | { type: 'telemetry'; tokensUsed: number; costEstimate: number };
```

```typescript
type SteeringRequestDTO =
  | { type: 'add_rule'; rule: string }
  | { type: 'rollback'; targetPhase: Phase }
  | { type: 'override_score'; tl?: number; adv?: number };
```

```typescript
interface LiveSessionState {
  readonly jobId: string; readonly status: 'queued' | 'running' | 'completed' | 'failed' | 'aborted';
  readonly currentPhase: Phase; readonly logs: LogChunkDTO[]; readonly isConnected: boolean;
}
```

```typescript
interface AnsiFormattedChunk {
  readonly rawText: string; readonly cssClass: string;
  readonly fgColor?: string; readonly bgColor?: string;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `useOrchestrationExecution` | Manages live job lifecycle, start/abort triggers, and SSE connection | `EventSource` (`/orchestrator/stream`), `RunOrchestratorJobUseCase` | *see snippet below* |
| `useSteering` | Dispatches mid-run steering actions to server and updates local feedback | `POST /orchestrator/jobs/:id/steering`, `SteeringAnalyzer` | *see snippet below* |
| `formatAnsiToHtml` | Converts terminal ANSI escape codes to semantic theme-aware HTML spans | Itaú CSS theme classes, ANSI color mapper | *see snippet below* |
| `AbortOrchestrationJobUseCase` | Terminates active runner subprocess tree and releases workspace lock | `AsyncWorkerPool`, `WorkspaceLockManager`, OS `taskkill`/`SIGKILL` | *see snippet below* |
| `ApplyMidRunSteeringUseCase` | Validates steering payload and injects actions into running orchestrator | `SteeringAnalyzer`, `HarnessOrchestrator` instance | *see snippet below* |

```typescript
function useOrchestrationExecution(jobId?: string) {
  const [session, setSession] = useState<LiveSessionState | null>(null);
  // connects EventSource('/orchestrator/stream/:id'), receives deltas
  return { session, startJob: (cfg: RunConfigDTO) => {}, abortJob: () => {} };
}
```

```typescript
function useSteering(jobId: string) {
  const submit = async (action: SteeringRequestDTO) => { await fetch(`/orchestrator/jobs/${jobId}/steering`, { method: 'POST', body: JSON.stringify(action) }); };
  return { submitSteering: submit };
}
```

```typescript
function formatAnsiToHtml(ansiText: string, isDarkTheme: boolean): AnsiFormattedChunk[] {
  // parses SGR escape codes and maps to theme-calibrated CSS tokens
  return parseAnsiCodes(ansiText, isDarkTheme ? 'dark' : 'light');
}
```

```typescript
class AbortOrchestrationJobUseCase {
  async execute(jobId: string): Promise<void> {
    // sends AbortSignal, kills process tree (taskkill /t / SIGKILL), updates status to 'aborted'
  }
}
```

```typescript
class ApplyMidRunSteeringUseCase {
  async execute(jobId: string, action: SteeringRequestDTO): Promise<{ applied: boolean }> {
    // validates action, dispatches to active HarnessOrchestrator instance
    return { applied: true };
  }
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `JobExecutionQueued` | User submits runner configuration form | `{ jobId: string, workspacePath: string, mode: RunMode }` | `OrchestrationHttpController`, `AsyncWorkerPool` |
| `PhaseTransitionEmitted` | Orchestrator advances to next pipeline phase | `{ jobId: string, fromPhase: Phase, toPhase: Phase, timestamp: number }` | `EventStreamBroadcaster`, `PhaseTimeline` |
| `TerminalLogEmitted` | Agent runner produces stdout/stderr line | `{ jobId: string, stream: 'stdout' \| 'stderr', text: string }` | `EventStreamBroadcaster`, `LiveLogConsole` |
| `SteeringActionDispatched` | User submits steering action via UI drawer | `{ jobId: string, action: SteeringRequestDTO, timestamp: number }` | `ApplyMidRunSteeringUseCase`, `SteeringActionFeed` |
| `JobAborted` | User clicks explicit abort button or SIGINT caught | `{ jobId: string, reason: string, abortedAt: number }` | `AsyncWorkerPool`, `WorkspaceLockManager`, UI Dashboard |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `IOrchestrationApiClient` | `startJob(dto)`, `resumeJob(id, dto)`, `abortJob(id)`, `steerJob(id, action)` | `Promise<RunResponseDto>`, `Promise<void>` |
| `IEventStreamClient` | `connect(jobId)`, `disconnect()`, `onEvent(callback)` | `EventSource`, `void` |
| `IJobExecutionRegistry` | `getActiveJob(workspacePath)`, `registerRunning(jobId, orchestrator)` | `HarnessOrchestrator \| undefined`, `void` |

```typescript
interface IOrchestrationApiClient {
  startJob(config: RunConfigDTO): Promise<{ jobId: string; status: string }>;
  abortJob(jobId: string): Promise<void>;
  steerJob(jobId: string, action: SteeringRequestDTO): Promise<void>;
}
```

```typescript
interface IEventStreamClient {
  connect(jobId: string): void; disconnect(): void;
  onEvent(handler: (event: JobEventDTO) => void): () => void;
}
```

```typescript
interface IJobExecutionRegistry {
  getRunningOrchestrator(jobId: string): HarnessOrchestrator | undefined;
  registerRunning(jobId: string, instance: HarnessOrchestrator): void;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Server-Sent Events Broadcaster and Execution Endpoints",
    "description": "Creates SSE stream endpoint, in-memory ring buffer, and steering/abort REST routes in the backend HTTP server.",
    "scope": [
      "sdk/src/server/adapters/inbound/http/routes/EventStreamHandler.ts",
      "sdk/src/server/application/use-cases/ApplyMidRunSteeringUseCase.ts",
      "sdk/src/server/adapters/inbound/http/routes/__tests__/EventStreamHandler.spec.ts"
    ],
    "acceptance": [
      "Broadcasts phase_change, log_chunk, and telemetry events over GET /orchestrator/stream/:jobId using SSE format",
      "Maintains ring buffer of last 500 events to support transparent client reconnection without data loss",
      "Handles POST /orchestrator/jobs/:jobId/steering and POST /orchestrator/jobs/:jobId/abort"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Runner Selection and Execution Mode Configuration View",
    "description": "Builds the execution setup interface allowing developers to select agent runners, models, execution modes, and scope parameters.",
    "scope": [
      "sdk-web/src/views/orchestrator/RunnerConfigCard.tsx",
      "sdk-web/src/views/orchestrator/components/RunnerSelector.tsx",
      "sdk-web/src/views/orchestrator/__tests__/RunnerConfigCard.spec.ts"
    ],
    "acceptance": [
      "Renders selectable agent runner cards (claude-cli, antigravity-cli, cursor-cli, etc.) with model and effort options",
      "Supports execution modes (quick, fast, thinking, deep_thinking) and toggles for reset vs resume",
      "Validates scope input and submits typed RunConfigDTO to start execution"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Live Pipeline Stage Timeline and Telemetry View",
    "description": "Creates real-time horizontal pipeline progress bar and telemetry metrics cards updated via SSE stream.",
    "scope": [
      "sdk-web/src/views/orchestrator/components/PhaseTimeline.tsx",
      "sdk-web/src/views/orchestrator/components/TelemetryCards.tsx",
      "sdk-web/src/views/orchestrator/__tests__/PhaseTimeline.spec.ts"
    ],
    "acceptance": [
      "Renders discrete pipeline stages from BOOTSTRAP to DEPLOY with active, pending, and completed status styles",
      "Updates active stage smoothly upon receiving phase_change SSE events without layout shift",
      "Displays real-time token consumption, cycle counter, and estimated duration metrics"
    ],
    "depends_on": "01"
  },
  {
    "id": "04",
    "title": "Implement Live Terminal Log Streamer with Theme-Calibrated ANSI Parser",
    "description": "Builds high-performance virtualized log console rendering colorized stdout/stderr with auto-scroll and theme styling.",
    "scope": [
      "sdk-web/src/views/orchestrator/components/LiveLogConsole.tsx",
      "sdk-web/src/utils/ansiParser.ts",
      "sdk-web/src/views/orchestrator/__tests__/LiveLogConsole.spec.ts"
    ],
    "acceptance": [
      "Streams incoming log chunks in real-time with automatic scroll-to-bottom and manual scroll-lock pause",
      "Converts ANSI terminal color codes to semantic CSS styles meeting WCAG AA contrast in light and dark themes",
      "Sanitizes log chunks to prevent raw HTML/script injection in console output"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Mid-Run Steering Drawer and Explicit Abort Controls",
    "description": "Implements interactive steering modal for injecting rules, rollbacks, and score overrides mid-flight, alongside explicit abort dialog.",
    "scope": [
      "sdk-web/src/views/orchestrator/components/SteeringDrawer.tsx",
      "sdk-web/src/views/orchestrator/components/AbortConfirmModal.tsx",
      "sdk-web/src/views/orchestrator/__tests__/SteeringDrawer.spec.ts"
    ],
    "acceptance": [
      "Dispatches add_rule, rollback, and override_score actions to backend API without interrupting the background job",
      "Renders confirmation dialog before dispatching explicit abort to kill subprocess tree cleanly",
      "Displays HTTP 409 conflict notifications when workspace lock is held by another execution"
    ],
    "depends_on": "04"
  }
]
```

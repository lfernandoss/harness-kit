# Tactical Design — harness-kit

**Domain:** telemetry_analytics | **Project:** harness-kit

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| `TelemetryDashboardView` | Component / View | Root view mounted at `/reports`; coordinates child telemetry widgets and hooks | *see snippet below* |
| `MetricsSummaryCards` | Component / KPI | Displays total cost USD, input/output tokens, cache read savings, and average QA/TL scores | *see snippet below* |
| `SkillCostBreakdownTable` | Component / Matrix | Tabular breakdown of input, output, cache tokens, and cost per skill; sortable by cost | *see snippet below* |
| `ModelCostDistributionChart`| Component / Visualization| Visual distribution of token spend across model tiers (`fast`, `medium`, `large`, `extra_large`) | *see snippet below* |
| `BacklogHealthWidget` | Component / Status Card | Displays feature completion progress, rework counts, and cycle metrics | *see snippet below* |
| `AuditTrailTable` | Component / Filterable Grid | Searchable and filterable table of `TelemetryAuditEvent` records with JSON/CSV export | *see snippet below* |
| `useTelemetryReport` | Integration / State Hook | Fetches `ProductReport` DTO, listens for live SSE token deltas, and manages filter state | *see snippet below* |
| `ReportApiController` | Inbound Adapter / Route | HTTP handler for `GET /api/reports` invoking `ReportDataAggregator` | *see snippet below* |

```typescript
const TelemetryDashboardView: React.FC = () => {
  const { report, isLoading, error, refresh } = useTelemetryReport();
  return <div className="telemetry-dashboard"><MetricsSummaryCards report={report} /><SkillCostBreakdownTable bySkill={report?.tokenReport.bySkill} /></div>;
};
```

```typescript
const MetricsSummaryCards: React.FC<{ report?: ProductReport }> = ({ report }) => {
  const totals = report?.tokenReport.totals ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  return <div className="kpi-grid"><KpiCard title="Total Cost" value={`$${totals.costUsd.toFixed(4)}`} /></div>;
};
```

```typescript
const SkillCostBreakdownTable: React.FC<{ bySkill?: Record<string, TokenUsage> }> = ({ bySkill = {} }) => {
  const rows = Object.entries(bySkill).map(([skill, u]) => ({ skill, ...u }));
  return <table className="itau-table"><thead><tr><th>Skill</th><th>Cost</th></tr></thead></table>;
};
```

```typescript
const ModelCostDistributionChart: React.FC<{ entries: TokenEntry[] }> = ({ entries }) => {
  const data = aggregateModelCost(entries);
  return <div className="chart-container"><BarChart data={data} palette="itau-theme" /></div>;
};
```

```typescript
const BacklogHealthWidget: React.FC<{ summary?: BacklogSummary }> = ({ summary }) => {
  return <div className="health-card"><span>Features: {summary?.total ?? 0}</span><span>TL Score: {summary?.avgScoreTL?.toFixed(1) ?? 'N/A'}</span></div>;
};
```

```typescript
const AuditTrailTable: React.FC<{ events: TelemetryAuditEvent[]; onExport: (fmt: 'csv' | 'json') => void }> = ({ events, onExport }) => {
  return <div className="audit-section"><button onClick={() => onExport('csv')}>Export CSV</button><DataTable data={events} /></div>;
};
```

```typescript
function useTelemetryReport() {
  const [report, setReport] = useState<ProductReport | null>(null);
  useEffect(() => { fetchReport().then(setReport); }, []);
  return { report, isLoading: !report, refresh: () => fetchReport().then(setReport) };
}
```

```typescript
async function handleGetReport(req: Request, res: Response): Promise<void> {
  const report = reportDataAggregator.aggregate();
  res.status(200).json(report);
}
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| `TelemetryFilterCriteria` | Integration / Value Object | Immutable criteria: `{ skill?: string, model?: string, agent?: string, search?: string }` | *see snippet below* |
| `SkillCostRow` | Presentation / DTO | `{ skill: string, inputTokens: number, outputTokens: number, cacheReadTokens: number, costUsd: number }` | *see snippet below* |
| `ModelDistributionItem` | Presentation / DTO | `{ model: string, tier: string, costUsd: number, percentage: number }` | *see snippet below* |
| `CacheSavingsMetrics` | Presentation / DTO | `{ cachedTokens: number, estimatedSavedUsd: number, hitRatioPercentage: number }` | *see snippet below* |
| `ExportOptions` | Generic / Contract | `{ format: 'json' \| 'csv', filename?: string, sanitizePaths?: boolean }` | *see snippet below* |

```typescript
interface TelemetryFilterCriteria {
  readonly skill?: string; readonly model?: string;
  readonly agent?: string; readonly search?: string;
}
```

```typescript
interface SkillCostRow {
  readonly skill: string; readonly inputTokens: number;
  readonly outputTokens: number; readonly cacheReadTokens: number; readonly costUsd: number;
}
```

```typescript
interface ModelDistributionItem {
  readonly model: string; readonly tier: string;
  readonly costUsd: number; readonly percentage: number;
}
```

```typescript
interface CacheSavingsMetrics {
  readonly cachedTokens: number; readonly estimatedSavedUsd: number;
  readonly hitRatioPercentage: number;
}
```

```typescript
interface ExportOptions {
  readonly format: 'json' | 'csv';
  readonly filename?: string; readonly sanitizePaths?: boolean;
}
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| `useTelemetryReport` | Coordinates fetching, polling fallback, and live SSE updates | `ReportApiClient`, `EventSource`, `ProductReport` | *see snippet below* |
| `filterAuditEntries` | Pure filtering function matching criteria against audit records | `TelemetryAuditEvent[]`, `TelemetryFilterCriteria` | *see snippet below* |
| `computeCacheSavings` | Calculates dollar savings and hit ratio from cached token usage | `TokenReport['totals']`, `ModelTierPricing` | *see snippet below* |
| `exportTelemetryData` | Serializes audit records to CSV/JSON and triggers browser download | `Blob`, `URL.createObjectURL`, `document.createElement('a')` | *see snippet below* |

```typescript
function useTelemetryReport(): { report: ProductReport | null; isLoading: boolean; error: Error | null; refresh(): Promise<void> } {
  // subscribes to SSE TokenLedgerDelta and fetches /api/reports
  return { report, isLoading, error, refresh };
}
```

```typescript
function filterAuditEntries(events: TelemetryAuditEvent[], criteria: TelemetryFilterCriteria): TelemetryAuditEvent[] {
  return events.filter(e => (!criteria.skill || e.skill === criteria.skill) && (!criteria.model || e.model === criteria.model));
}
```

```typescript
function computeCacheSavings(totals: TokenUsage, averageCacheRate = 0.000000235): CacheSavingsMetrics {
  const estimatedSavedUsd = totals.cacheReadTokens * averageCacheRate;
  return { cachedTokens: totals.cacheReadTokens, estimatedSavedUsd, hitRatioPercentage: totals.inputTokens ? (totals.cacheReadTokens / (totals.inputTokens + totals.cacheReadTokens)) * 100 : 0 };
}
```

```typescript
function exportTelemetryData(events: TelemetryAuditEvent[], options: ExportOptions): void {
  const content = options.format === 'json' ? JSON.stringify(events, null, 2) : convertToCsv(events);
  downloadBlob(new Blob([content]), options.filename ?? `telemetry-report.${options.format}`);
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| `ReportDataLoaded` | `GET /api/reports` response received | `{ report: ProductReport, timestamp: number }` | `useTelemetryReport`, Dashboard Widgets |
| `LiveTokenDeltaEmitted` | Orchestration agent completes turn | `{ delta: TokenUsage, skill: string, model: string, jobId: string }` | SSE Stream Listener, Live KPI Cards |
| `TelemetryFilterApplied` | User modifies filter dropdown or search input | `{ criteria: TelemetryFilterCriteria }` | `AuditTrailTable`, Distribution Charts |
| `TelemetryExportTriggered`| User clicks export CSV/JSON button | `{ format: 'json' \| 'csv', rowCount: number }` | `exportTelemetryData`, Browser File Downloader |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| `IReportApiClient` | `fetchReport()` | `Promise<ProductReport>` |
| `ITelemetryExporter` | `exportToFile(events, options)` | `void` |

```typescript
interface IReportApiClient {
  fetchReport(): Promise<ProductReport>;
}
```

```typescript
interface ITelemetryExporter {
  exportToFile(events: TelemetryAuditEvent[], options: ExportOptions): void;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Implement Backend Report REST Endpoint and DTO Exporter",
    "description": "Exposes GET /api/reports HTTP route consuming SDK ReportDataAggregator to deliver unified ProductReport DTO.",
    "scope": [
      "sdk-web/src/server/routes/report.routes.ts",
      "sdk-web/src/server/controllers/ReportController.ts",
      "sdk-web/src/server/__tests__/ReportController.spec.ts"
    ],
    "acceptance": [
      "Returns HTTP 200 with complete ProductReport including backlog, tasks, config, decisions, and tokenReport",
      "Handles empty or missing docs/product directory gracefully with default zero-value metrics",
      "Restricts endpoint access to localhost (127.0.0.1)"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement Telemetry DTO Types and useTelemetryReport Hook",
    "description": "Implements typed frontend client interfaces and data fetching hook integrating SSE live deltas and manual refresh.",
    "scope": [
      "sdk-web/src/types/telemetry.ts",
      "sdk-web/src/hooks/useTelemetryReport.ts",
      "sdk-web/src/hooks/__tests__/useTelemetryReport.spec.ts"
    ],
    "acceptance": [
      "Fetches ProductReport DTO on mount and provides loading and error states",
      "Updates token totals reactively upon receiving live SSE TokenLedgerDelta events",
      "Provides debounced refresh method without full-page reloads"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement Executive Metrics Summary Cards and Cache Savings Gauge",
    "description": "Builds responsive KPI metric cards displaying USD cost, token totals, cache savings, and quality scores styled with Itaú tokens.",
    "scope": [
      "sdk-web/src/components/telemetry/MetricsSummaryCards.tsx",
      "sdk-web/src/components/telemetry/CacheSavingsCard.tsx",
      "sdk-web/src/components/telemetry/__tests__/MetricsSummaryCards.spec.ts"
    ],
    "acceptance": [
      "Renders formatted monetary cost, input/output tokens, and prompt cache hit savings accurately matching CLI output",
      "Displays average TL score and Adversarial QA score with color-coded status thresholds",
      "Complies with WCAG AA 4.5:1 contrast in both light and dark Itaú themes"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement Skill Cost Matrix and Model Distribution Charts",
    "description": "Renders sortable skill-by-skill token usage matrix and visual breakdown charts of cost by model tier and phase.",
    "scope": [
      "sdk-web/src/components/telemetry/SkillCostBreakdownTable.tsx",
      "sdk-web/src/components/telemetry/ModelCostDistributionChart.tsx",
      "sdk-web/src/components/telemetry/__tests__/SkillCostBreakdownTable.spec.ts"
    ],
    "acceptance": [
      "Renders tabular breakdown of input, output, cache tokens and estimated cost per skill with sortable columns",
      "Renders responsive cost distribution chart across model tiers using theme-aware Itaú color palettes",
      "Highlights top consuming skills and models dynamically"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement Backlog Health Widget and Filterable Audit Trail Grid with Export",
    "description": "Implements feature status progress list, searchable/filterable audit event table, and JSON/CSV export action.",
    "scope": [
      "sdk-web/src/components/telemetry/BacklogHealthWidget.tsx",
      "sdk-web/src/components/telemetry/AuditTrailTable.tsx",
      "sdk-web/src/utils/telemetryExport.ts",
      "sdk-web/src/components/telemetry/__tests__/AuditTrailTable.spec.ts"
    ],
    "acceptance": [
      "Displays feature progress breakdown with status badges, task counts, and rework indicators",
      "Filters audit records in real time by skill, model, agent, and free-text search without server roundtrips",
      "Exports filtered audit datasets to valid CSV and formatted JSON files upon user trigger"
    ],
    "depends_on": "04"
  },
  {
    "id": "06",
    "title": "Assemble TelemetryDashboard View and Integrate with App Shell Route",
    "description": "Integrates all telemetry widgets, cards, and charts into the unified /reports route inside ApplicationShell.",
    "scope": [
      "sdk-web/src/views/TelemetryDashboardView.tsx",
      "sdk-web/src/routes/AppRoutes.tsx",
      "sdk-web/src/views/__tests__/TelemetryDashboardView.spec.ts"
    ],
    "acceptance": [
      "Renders complete telemetry dashboard at /reports route with smooth transition states",
      "Adapts layout seamlessly to mobile, tablet, and desktop viewports",
      "Maintains active filter and tab state during live background job executions"
    ],
    "depends_on": "05"
  }
]
```

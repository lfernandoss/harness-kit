# Strategic Design — Context Map: Telemetry & Token Analytics Dashboard

**Domain:** telemetry_analytics | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| **Telemetry Analytics & Aggregation Context** | Aggregates token usage, computes tier pricing, estimates cache savings, and compiles unified `ProductReport` DTOs. | Excludes UI chart rendering, DOM manipulation, and interactive client filtering. | Analytics / SDK Backend | `ReportDataAggregator`, `TokenLedger`, `ProductReport`, `TokenReport`, `CostAnalyzer` |
| **Telemetry Dashboard Presentation Context** | Renders summary metric cards, skill cost breakdown tables, distribution charts, and backlog quality widgets in Itaú theme. | Excludes raw filesystem access, calculation of pricing rates, and orchestration execution. | Frontend UX / Dashboard | `TelemetryDashboard`, `MetricsSummaryCard`, `SkillCostMatrix`, `CostBreakdownChart`, `BacklogHealthWidget` |
| **Telemetry Stream & Live Reconnection Context** | Dispatches real-time token ledger deltas and execution metric frames via SSE to connected dashboard tabs. | Excludes persistent disk storage writes and historical file parsing. | Platform / Event Streaming | `TelemetryEventStreamer`, `TokenDeltaEvent`, `LiveMetricsListener` |
| **Audit Export Context** | Formats and serializes filtered telemetry audit records into downloadable JSON or CSV files. | Excludes domain metric calculations and file state aggregation. | Frontend Platform | `TelemetryExportAdapter`, `CsvExporter`, `JsonExporter` |

## Section 2 — Context Map

```
[Telemetry Dashboard Presentation Context] → [Telemetry Analytics & Aggregation Context]
Pattern       : Customer-Supplier / Published Language
Direction     : Downstream (Dashboard) consumes Upstream (SDK Aggregation API)
Justification : Dashboard strictly consumes pre-computed ProductReport DTOs via GET /api/reports, maintaining backend as single source of truth.

[Telemetry Dashboard Presentation Context] → [Telemetry Stream Context]
Pattern       : Open Host Service / Published Language
Direction     : Downstream (Dashboard) subscribes to Upstream (SSE Event Stream)
Justification : Dashboard receives live TokenLedgerDelta events to update counters and progress gauges in real time during active executions.

[Telemetry Dashboard Presentation Context] → [Audit Export Context]
Pattern       : Anti-Corruption Layer (ACL)
Direction     : Downstream wraps export transformations
Justification : Converts filtered in-memory audit rows into sanitized CSV/JSON blobs without leaking internal model structures.

[Telemetry Dashboard Presentation Context] → [Web Shell & Theme Context (External)]
Pattern       : Conformist
Direction     : Downstream conforms to Web Shell layout slots and Itaú Theme tokens
Justification : Dashboard mounts inside shell route /reports and utilizes Itaú design tokens (--itau-orange, --itau-navy, dark surfaces).
```

## Section 3 — Core Domain Highlight

```
Context   : Telemetry Analytics & Aggregation Context + Telemetry Dashboard Presentation Context
Reason    : Delivers complete visual and numerical parity with CLI hrns report, providing developers and leads with instant financial visibility, LLM token efficiency, cache savings attribution, and backlog health metrics.
Investment: Optimized backend DTO serialization, responsive chart visualizations adhering to Itaú light/dark themes, and WCAG AA compliant contrast for tabular metrics and status badges.
```

## Section 4 — Architectural Decisions

### ADR-01: Single Source of Truth via Pre-Aggregated Backend DTO (`ProductReport`)
- **Decision:** All metric calculations, model pricing tier attributions, and backlog summaries are computed exclusively on the backend by `ReportDataAggregator` and returned as `ProductReport`.
- **Context:** Prevents calculation discrepancies between CLI `hrns report` and web dashboard, ensuring strict consistency.
- **Consequences:** Zero math duplication in React; lightweight presentation layer.

### ADR-02: Live Telemetry Delta Streaming with Polling Fallback
- **Decision:** Stream real-time token increments via SSE (`TokenLedgerDelta`) while a job is running, with periodic 10-second polling fallback when viewing static historical reports.
- **Context:** Provides live feedback during active runs without requiring full-page reloads.
- **Consequences:** Instant UI reactivity; graceful fallback if SSE connection drops.

### ADR-03: Itaú Token-Calibrated Chart and Metric Palette
- **Decision:** Apply Itaú brand palette (Orange `#EC7000`, Navy `#003399`, Graphite surfaces) with specific WCAG AA compliant chart accent series for both light and dark themes.
- **Context:** Visual consistency with corporate brand identity and accessible data visualization standards.
- **Consequences:** Cohesive look-and-feel; verified contrast ratios (≥ 4.5:1).

### ADR-04: Non-Mutating Client-Side Telemetry Filtering
- **Decision:** Perform multi-facet filtering (by skill, model, agent, timestamp) in-memory on the loaded `ProductReport.tokenReport.entries` array in the client state.
- **Context:** Dataset size per session is bounded (< 10,000 entries), allowing instant sub-millisecond filter feedback without repeated HTTP roundtrips.
- **Consequences:** Highly responsive search/filter UX; zero server load for interactive table exploration.

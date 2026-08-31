# Strategic Design — Problem Space: Telemetry & Token Analytics Dashboard

**Domain:** telemetry_analytics | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event (past tense) | Command (trigger) | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `ReportSummaryRequested` | `RequestReportSummary` | `TelemetryDashboard` | HTTP Client / Fastify API | `ReportSummaryViewModel` |
| 2 | `TelemetryReportAggregated` | `AggregateProductReport` | `ReportDataAggregator` | FileStateManager / TokenLedger | `ProductReportDTO` |
| 3 | `TokenBreakdownFiltered` | `ApplyTelemetryFilter` | `TelemetryFilterEngine` | None | `FilteredMetricsViewModel` |
| 4 | `CostPerModelCalculated` | `CalculateCostBreakdown` | `CostAnalyzer` | Pricing Tier Registry | `CostBreakdownViewModel` |
| 5 | `SessionMetricsStreamed` | `StreamLiveTelemetry` | `TelemetryStreamBroadcaster` | Server-Sent Events (SSE) | `LiveSessionMetricsView` |
| 6 | `TelemetryAuditTrailExported` | `ExportAuditTrail` | `TelemetryExportService` | Browser Download (JSON/CSV) | `ExportedAuditPayload` |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Token Consumption & Cost Analytics** | Core | Primary differentiator: multi-dimensional cost/token breakdown per skill, model tier, phase, and prompt cache savings mirroring `hrns report`. |
| **Session Quality & Backlog Telemetry** | Core | Differentiator: real-time correlation between token spend, feature progress, rework cycles, and QA/TL quality scores. |
| **Telemetry Filtering & Projections** | Supporting | Faceted filtering (by skill, model, agent, time range) and chart projections for presentation components. |
| **Audit Trail Export** | Generic | Commodity CSV/JSON serialization and browser file download adapter for historical telemetry records. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `ProductReport` | Unified backend DTO containing backlog summary, task progress, config snapshot, decisions, and token report. | Single source of truth from SDK backend. |
| `TokenLedger` | Append-only ledger recording input, output, cache creation, and cache read tokens with estimated USD costs. | Persisted in `tokens.jsonl`. |
| `CostBreakdown` | Multi-dimensional cost attribution partitioned across skills, model tiers (`fast`, `medium`, `large`, `extra_large`), and phases. | Computed via tier rates. |
| `CacheReadSavings` | Estimated financial savings achieved through LLM prompt cache hits versus uncached input tokens. | Mirror of `hrns report` cache savings. |
| `BacklogHealthMetric` | Aggregated indicators correlating feature completion rate, rework count, and average QA/TL scores. | Direct parity with CLI report summary. |
| `SkillCostMatrix` | Tabular/visual projection displaying token usage (input, output, cache) and estimated cost per harness skill. | e.g., `the-grumpy-tech-lead`, `adversarial-qa`. |
| `ModelTierPricing` | Standardized rate table mapping LLM models to cost tiers for consistent USD cost estimation. | Tier averages per million tokens. |
| `TelemetryAuditEvent` | Normalized audit record containing timestamp, skill, agent, model, duration, and detailed token metrics. | Structure from `TokenLedger`. |
| `SessionMetrics` | High-level execution metrics including elapsed duration, completed cycles, token throughput, and success rate. | Live and historical session data. |
| `TelemetryDashboard` | Interactive web dashboard rendering charts, metric cards, and audit tables styled with Itaú tokens. | Presentational SPA view at `/reports`. |
| `TelemetryFilter` | Criteria object filtering telemetry by skill, model, agent name, and timestamp range. | Client-side reactive filter state. |
| `AuditExportFormat` | Supported export file format (`json` or `csv`) for exporting historical telemetry entries. | Triggered via UI download action. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does the dashboard guarantee that token counts and cost breakdowns strictly match `hrns report` CLI output without client-side calculation discrepancies?
- How are corrupted or malformed lines in `tokens.jsonl` handled so they never crash the aggregation pipeline or yield `NaN` in total cost?

**Scalability and Performance**
- How does the aggregation service perform when `tokens.jsonl` contains >100,000 audit events without causing server event-loop blocking or high UI latency?
- How are chart time-series downsampled for rendering in the browser to prevent SVG/Canvas DOM thrashing during long-running multi-cycle sessions?

**Security and Sensitive Data**
- How does the telemetry export ensure that sensitive environment variables, system prompts, or private workspace paths are never leaked in export payloads?
- How is the `/api/reports` endpoint restricted to `localhost` (`127.0.0.1`) to prevent unauthorized telemetry inspection from external network actors?

**Concurrency and Failures**
- How does the dashboard handle live SSE telemetry deltas arriving while the user is actively sorting or filtering the historical audit table?
- How are atomic file read operations guaranteed on `tokens.jsonl` when an active agent subprocess is concurrently appending new token usage lines?

**Responsibility Boundaries Between Layers**
- How is the frontend dashboard kept strictly presentational, consuming `ProductReport` DTOs directly from the backend without re-implementing aggregation rules?

---

**Architecture Tip:** Delegate all telemetry aggregation and pricing calculations strictly to backend SDK services, delivering pre-computed view DTOs to the React dashboard.

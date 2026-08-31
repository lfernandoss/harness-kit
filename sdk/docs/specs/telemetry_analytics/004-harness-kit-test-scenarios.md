# Test Scenarios — harness-kit

**Domain:** telemetry_analytics
**Project:** harness-kit
**Framework:** Vitest
**Date:** 2026-08-27

## Section 1 — Unit Tests

### 1.1 Types, Value Objects & Calculation Utilities

**Cache Savings & Cost Calculation:**
- [ ] Should calculate estimated cache savings and hit ratio when given valid token usage totals
- [ ] Should return zero dollars saved and zero percent hit ratio when input and cache read tokens are zero
- [ ] Should compute tier-specific rates accurately for fast, medium, large, and extra-large models

**TelemetryFilterCriteria & filterAuditEntries:**
- [ ] Should filter audit events matching specific skill when skill filter is provided
- [ ] Should filter audit events matching specific model when model filter is provided
- [ ] Should return all audit events when filter criteria are empty
- [ ] Should match search query against agent name, skill, and auditId case-insensitively

**ExportOptions Validation:**
- [ ] Should validate export options with format 'json' and 'csv'
- [ ] Should format CSV headers and rows accurately without corrupting special characters

### 1.2 Hooks and State Management

**useTelemetryReport Hook:**
- [ ] Should initialize with loading state `true` and null report before API response resolves
- [ ] Should populate `report` state with `ProductReport` DTO when `fetchReport()` succeeds
- [ ] Should transition error state when `fetchReport()` rejects
- [ ] Should update token totals and bySkill usage reactively when `LiveTokenDeltaEmitted` is received
- [ ] Should trigger manual refresh and update report state when `refresh()` is called

**exportTelemetryData Utility:**
- [ ] Should generate valid JSON blob when format is 'json'
- [ ] Should generate valid CSV formatted text with headers `timestamp,skill,agent,model,inputTokens,outputTokens,costUsd` when format is 'csv'
- [ ] Should trigger browser file download with expected filename

### 1.3 Presentation Components

**MetricsSummaryCards:**
- [ ] Should render formatted total cost USD, input tokens, output tokens, and cache tokens
- [ ] Should render average TL score and average Adversarial QA score with appropriate badge colors
- [ ] Should display N/A for QA/TL scores when no completed feature scores exist
- [ ] Should maintain WCAG AA 4.5:1 text contrast in both light and dark themes

**SkillCostBreakdownTable:**
- [ ] Should render a table row for each skill in `bySkill` record
- [ ] Should sort rows in descending order of `costUsd` by default
- [ ] Should sort rows by column header when clicked (skill name, input tokens, output tokens, cost)
- [ ] Should format numerical token counts with locale thousands separators

**ModelCostDistributionChart:**
- [ ] Should aggregate and render token cost grouped by model tier
- [ ] Should apply Itaú theme-calibrated chart color palette
- [ ] Should render tooltip with exact cost and percentage when hovering over chart segment

**BacklogHealthWidget:**
- [ ] Should render feature counts grouped by status (COMPLETED, IN_PROGRESS, NOT_STARTED, BLOCKED, FAILED)
- [ ] Should display total rework count and completed cycle count

**AuditTrailTable:**
- [ ] Should render paginated list of `TelemetryAuditEvent` records
- [ ] Should update visible rows when filter inputs are modified
- [ ] Should trigger `onExport` callback with selected format when export button is clicked

---

## Section 2 — Integration Tests

### 2.1 Backend Report REST Endpoint & Aggregator

**Report API Route (`GET /api/reports`):**
- [ ] Should return HTTP 200 with complete `ProductReport` payload when `docs/product` files exist
- [ ] Should return default zero-value metrics and empty arrays when `docs/product` directory is empty or missing
- [ ] Should skip malformed or corrupted JSON lines in `tokens.jsonl` without throwing unhandled exceptions
- [ ] Should restrict endpoint access strictly to localhost (`127.0.0.1`)

**ReportDataAggregator Integration:**
- [ ] Should aggregate backlog features, development tasks, bootstrap config, and token ledger into unified `ProductReport`
- [ ] Should accurately calculate `avgScoreTL` and `avgScoreAdv` across all completed features
- [ ] Should aggregate per-feature task completion ratios and rework counters

### 2.2 Telemetry Stream & Live Delta Ingestion

**Live Stream Listener:**
- [ ] Should ingest `TokenLedgerDelta` SSE events during active orchestration runs
- [ ] Should increment total input/output tokens and cost in memory without full-page reloads
- [ ] Should reconcile in-memory live deltas with authoritative `GET /api/reports` upon phase completion

### 2.3 Telemetry Export Integration

- [ ] Should serialize filtered audit records into downloadable CSV blob
- [ ] Should serialize filtered audit records into formatted JSON blob
- [ ] Should exclude internal sensitive execution parameters from exported records

---

## Section 3 — Functional Tests

### 3.1 Happy Path Flows

- [ ] **Should load telemetry dashboard with executive metrics, skill breakdown, and backlog health**
  - Given: A workspace contains valid `backlog.json`, `state.json`, and `tokens.jsonl` with multiple recorded runs
  - When: The developer navigates to `/reports` in `sdk-web`
  - Then: Page renders `MetricsSummaryCards` with total cost and tokens, `SkillCostBreakdownTable` sorted by cost, `ModelCostDistributionChart`, and `BacklogHealthWidget` with Itaú brand styling

- [ ] **Should update token analytics dynamically during live orchestration run**
  - Given: The developer is viewing the `/reports` dashboard while an orchestration session is running in the background
  - When: An agent skill finishes an execution turn and emits a `LiveTokenDeltaEmitted` event
  - Then: Dashboard KPI cards and token counters increment immediately without requiring manual browser reload

- [ ] **Should filter audit records and export custom telemetry report**
  - Given: Telemetry dashboard is loaded with 50 audit events across multiple skills
  - When: User selects skill filter `"adversarial-qa"` and clicks "Export CSV"
  - Then: Table filters view to show only adversarial-qa records and browser triggers download of `telemetry-report.csv` containing only matching rows

### 3.2 Alternative and Error Flows

- [ ] **Should render empty state gracefully when no prior execution runs exist**
  - Given: A newly initialized workspace with empty `tokens.jsonl` and empty backlog
  - When: User navigates to `/reports`
  - Then: Dashboard displays zeroed KPI cards (`$0.0000`, `0 tokens`) and renders informative empty state banner without errors

- [ ] **Should handle backend API failure with retry option**
  - Given: Backend HTTP server encounters temporary I/O error reading state files
  - When: Dashboard sends `GET /api/reports`
  - Then: Dashboard displays an error alert with "Retry" button, and re-fetching upon clicking recovers the view

### 3.3 Security & Localhost Protection Scenarios

- [ ] **Should prevent external LAN requests to report endpoints**
  - Given: Web server is running on local developer machine
  - When: An HTTP request for `GET /api/reports` arrives from an external IP address
  - Then: Server refuses connection or rejects with HTTP 403 Forbidden

- [ ] **Should sanitize sensitive environment tokens and credentials from audit exports**
  - Given: Telemetry ledger contains agent execution metadata
  - When: User triggers CSV or JSON telemetry export
  - Then: Export file strictly contains token counts, durations, and skill names, excluding any API keys, environment variables, or private path credentials

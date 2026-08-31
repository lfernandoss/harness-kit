# Strategic Design — Problem Space: Diagnostics & Candidate Review

**Domain:** diagnostics_candidate_review | **Complexity:** HIGH

## Section 1 — Event Storming

| # | Domain Event | Command | Aggregate | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | `DiagnoseLedgerLoaded` | `LoadDiagnoseLedger` | `DiagnoseLedger` | FileSystem (`diagnose-sessions.jsonl`) | `DiagnoseSessionsOverview` |
| 2 | `DiagnoseBatchStarted` | `StartDiagnoseBatch` | `DiagnoseBatchProcessor` | OS Process / Agent Runner | `DiagnoseProgressFeed` |
| 3 | `SessionTracesRecorded` | `RecordSessionTraces` | `TraceDirectoryScanner` | FileSystem (`traces/`) | `TraceSessionSummaryView` |
| 4 | `MetaHarnessTriggered` | `TriggerMetaHarness` | `MetaHarnessOptimizer` | Meta-Harness Agent | `MetaHarnessStatusView` |
| 5 | `DiagnoseBatchCompleted` | `CompleteDiagnoseBatch` | `DiagnoseBatchProcessor` | FileSystem / Ledger | `DiagnoseReportView` |
| 6 | `CandidateListLoaded` | `LoadCandidateList` | `CandidateRegistry` | FileSystem (`candidates/`) | `CandidateListView` |
| 7 | `CandidateDetailsInspected` | `InspectCandidateDetails` | `CandidateRegistry` | FileSystem (`candidates/{id}`) | `CandidateDetailView` |
| 8 | `CandidatePromotionTriggered` | `TriggerCandidatePromotion` | `CandidatePromotionManager` | Meta-Harness Agent / LLM | `PromotionProgressFeed` |
| 9 | `CandidateStatusUpdated` | `UpdateCandidateStatus` | `CandidateRegistry` | Active Skill Files | `CandidateStatusBadge` |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| **Candidate Review & Optimization** | Core | Inspecting prompt mutations, diffs, rationale, and orchestrating candidate promotions. |
| **Diagnose Batch Processing** | Core | Batching pending telemetry, generating monotonic trace IDs, and coordinating Meta-Harness cycles. |
| **Session Ledger & Trace Catalog** | Supporting | Parses `diagnose-sessions.jsonl` and trace directories into structured DTOs for the UI. |
| **Agent Runner Execution** | Generic | Delegates subprocess execution to SDK runner adapters (`claude-cli`, `antigravity-cli`). |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| `DiagnoseLedger` | JSONL file tracking session telemetry and status. | Atomic status mutations (`pending` -> `processed`). |
| `TraceSession` | Numbered directory (`session-YYYY-MM-DD-NNN`) storing logs. | Monotonic sequence per day. |
| `DiagnoseBatch` | Set of pending sessions processed collectively. | Default batch size of 3. |
| `OptimizationCandidate` | Proposed skill/prompt modification from Meta-Harness. | Read from `docs/harness-history/candidates/`. |
| `CandidateStatus` | Lifecycle state: `PROPOSED`, `APPLIED`, or `PROMOTED`. | Inferred or explicit status badge. |
| `TargetSkill` | Specific harness skill targeted for optimization. | Identified in candidate metadata. |
| `CandidatePromotion` | Workflow applying candidate prompt updates to skills. | Autonomous uses `--auto`. |
| `MetaHarnessAgentAdapter` | Adapter invoking Meta-Harness to analyze batches/candidates. | Bridges SDK with AI runner CLI. |
| `DiffPreview` | Visual representation of candidate prompt mutations. | Syntax and diff highlighting. |
| `DiagnoseReport` | Aggregated report summarizing processed counts and outcomes. | Mirrors `DiagnoseReportRenderer`. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does `DiagnoseLedger` guarantee atomic transitions from `pending` to `processed` so interrupted batches never duplicate traces?
- How is candidate status verified against active skill file content to prevent false positive promotion reporting?

**Scalability and Performance**
- How does the web API paginate large candidate diffs and deep session ledgers without memory spikes in the Node process?
- How does the UI virtualize candidate lists and trace trees when hundreds of sessions exist in history?

**Security and Sensitive Data**
- How are session records and candidate diffs sanitized to ensure workspace credentials are never exposed in UI payloads?
- How are candidate promotion prompts validated to prevent prompt injection during automated LLM application?

**Concurrency and Failures**
- How does the system handle concurrent diagnose triggers across multiple browser tabs, ensuring only one batch execution runs?
- How are subprocess timeouts during candidate promotion handled without leaving zombie processes?

**Responsibility Boundaries Between Layers**
- How does `sdk-web` remain strictly an adapter over `@harness-kit/sdk` without duplicating ledger parsing in frontend?

---

**Architecture Tip:** Leverage SDK `DiagnoseService` and `CandidateReader` directly in backend API controllers, streaming batch and promotion progress over SSE to reactive UI components.
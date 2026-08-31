# Context Map — Diagnostics & Candidate Review

**Domain:** diagnostics_candidate_review | **Complexity:** HIGH

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| `DiagnosticsManagementContext` | Coordinates pending session loading, batch execution, trace logging, and report rendering. | Prompt synthesis, subprocess lifecycle. | Core SDK | `DiagnoseLedger`, `DiagnoseBatch`, `TraceSession`, `DiagnoseReport` |
| `CandidateReviewContext` | Manages candidate discovery, metadata extraction, diff previewing, and promotion. | Session ledger parsing, active orchestration. | AI Tooling / DX | `OptimizationCandidate`, `CandidateStatus`, `DiffPayload`, `TargetSkill` |
| `WebShellThemeContext` | Provides layout frame, navigation sidebar, and Itaú theme styling tokens. | Domain data fetching, batch processing. | Frontend Platform | `ApplicationShell`, `ItauThemeTokens`, `ThemeManager` |
| `AgentRunnerGateway` | Spawns external CLI processes (`claude-cli`, `antigravity-cli`) for Meta-Harness agent execution. | Candidate diff parsing, UI presentation. | SDK Infrastructure | `AgentRunner`, `RunnerConfig`, `ExecutionResult` |

## Section 2 — Context Map

```
[DiagnosticsManagementContext] → [WebShellThemeContext]
Pattern   : Conformist
Direction : Downstream UI conforms to SDK backend DTO contracts and theme tokens.
Justification: Web views render diagnostic models without altering domain invariants.

[CandidateReviewContext] → [WebShellThemeContext]
Pattern   : Conformist
Direction : Downstream UI conforms to candidate DTOs and theme presentation tokens.
Justification: Candidate review view renders diffs and status badges within the shell.

[DiagnosticsManagementContext] → [AgentRunnerGateway]
Pattern   : Anti-Corruption Layer (ACL)
Direction : Downstream Diagnostics adapts upstream CLI runner interfaces.
Justification: MetaHarnessAgentAdapter translates batch requests into runner executions.

[CandidateReviewContext] → [AgentRunnerGateway]
Pattern   : Anti-Corruption Layer (ACL)
Direction : Downstream CandidateReview translates promotion requests to CLI executions.
Justification: CandidatePromotionService builds sanitized CLI prompts and handles execution.

[CandidateReviewContext] → [DiagnosticsManagementContext]
Pattern   : Customer-Supplier
Direction : CandidateReview depends on trace sessions and history produced by Diagnostics.
Justification: Candidates are generated from diagnostic trace batches and historical evaluation.
```

## Section 3 — Core Domain Highlight

```
Context   : CandidateReviewContext & DiagnosticsManagementContext
Reason    : Core differentiator enabling self-optimizing harnesses via automated trace analysis and prompt mutation review.
Investment: High-fidelity diff visualization, atomic JSONL ledger persistence, comprehensive test coverage for batching and status transitions.
```

## Section 4 — Architectural Decisions

```
Decision    : Reusable SDK Domain Services in sdk-web HTTP/SSE Controllers
Context     : Need functional parity between CLI and Web without duplicating business logic.
Consequences: Guaranteed single source of truth; requires sdk-web backend to consume @harness-kit/sdk as a library.

Decision    : Server-Sent Events (SSE) for Real-Time Batch & Promotion Progress
Context     : Diagnostics and candidate promotions are long-running background tasks.
Consequences: Enables live UI updates without polling; requires resilient client reconnection handling.

Decision    : Dual Promotion Execution Modes (Autonomous vs Interactive Trigger)
Context     : Developers require both one-click automated LLM application and manual terminal command inspection.
Consequences: Supports non-interactive adapter invocation via API while exposing copyable CLI commands.
```
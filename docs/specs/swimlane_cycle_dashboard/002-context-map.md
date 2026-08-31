# Strategic Design — Context Map: Swimlane Cycle Dashboard

## Section 1 — Bounded Context Identification

| Bounded Context | Responsibility | Boundary (excluded) | Team Ownership | Key Entities |
|---|---|---|---|---|
| Swimlane Presentation Context | Renders horizontal temporal ruler, category lanes, interactive cycle cards, and filtering controls. | Direct file-system disk I/O and process tree management. | Frontend Web Team | `SwimlaneDashboardView`, `TimeScaleRuler`, `CategoryLane`, `CycleCard` |
| Session Cycle Core Context (F001 Dependency) | Governs session persistence, unique session identity, cycle state machine, and REST/SSE contracts. | CSS rendering, client DOM updates, and browser local storage. | Backend Platform Team | `Session`, `AutonomousCycle`, `PhaseSnapshot`, `SessionId`, `CycleId` |
| Theme & Design Tokens Context | Provides Itaú brand tokens, WCAG AA contrast colors, spacing, and CSS grid variables. | Business domain rules and network communication. | UI/UX Design System Team | `ThemeTokens`, `ContrastMatrix`, `DesignVariables` |

## Section 2 — Context Map

```
[Swimlane Presentation Context] → [Session Cycle Core Context (F001)]
Pattern   : Anti-Corruption Layer (ACL) & Customer-Supplier
Direction : Downstream (Swimlane UI) consumes Upstream (Session Cycle API)
Justification: Frontend translates backend REST/SSE DTOs into normalized timeline coordinates and view states.

[Swimlane Presentation Context] → [Theme & Design Tokens Context]
Pattern   : Conformist / Shared Kernel
Direction : Downstream (Swimlane UI) adopts Design Tokens conformingly
Justification: Guarantees unified dark/light themes and WCAG AA accessibility across all swimlane elements.
```

## Section 3 — Core Domain Highlight

```
Context : Swimlane Presentation Context
Reason  : High-value visual control plane providing observability, multi-cycle duration correlation, and mid-flight interventions for autonomous engineering workflows.
Investment: Rigorous 3-layer architecture (Styles, Components, Integration), virtualized rendering for 50+ tracks, and resilient SSE event streaming.
```

## Section 4 — Architectural Decisions

```
Decision    : Pure Timeline Coordinate Calculation Utilities
Context     : Recalculating card offsets and pixel widths inside render loops caused severe layout thrashing.
Consequences: High performance 60fps rendering during scrolling and live SSE events; decoupled mathematical models.

Decision    : Category Pill Filtering with Preserved Temporal Axis
Context     : Filtering lanes by agent type must not shift or disrupt the shared horizontal time ruler.
Consequences: Operators can focus on specific domains (e.g. QA or Backend) without losing cross-agent temporal synchronization.

Decision    : On-Demand Detail Drawer with Lazy Log Subscription
Context     : Streaming raw ANSI logs continuously into all rendered cards saturated browser memory and DOM nodes.
Consequences: Lightweight memory footprint; detailed live terminal logs connect only when a cycle card is expanded.

Decision    : Virtualized Canvas Rendering for Scalable Lanes
Context     : Workspaces with dozens of historical cycles could degrade scrolling smoothness.
Consequences: Constant sub-millisecond render times regardless of historical session size.
```

# Strategic Design — Problem Space: Swimlane Cycle Dashboard

## Section 1 — Event Storming

| # | Domain Event | Command | Aggregate / View Model | External Systems | Read Models |
|---|---|---|---|---|---|
| 1 | DashboardMounted | MountSwimlaneDashboard | SwimlaneDashboard | Backend HTTP API | SessionListViewModel |
| 2 | ActiveSessionSelected | SelectActiveSession | SessionSelector | Backend HTTP API | ActiveSessionManifest |
| 3 | TimeScaleZoomChanged | ChangeTimeScaleZoom | TimeScaleHeader | Browser Window | TimeScaleGridProjection |
| 4 | CategoryFilterToggled | ToggleCategoryFilter | CategoryFilterBar | Local Storage | FilteredLanesViewModel |
| 5 | CycleCardFocused | FocusCycleCard | CycleCard | Backend SSE / REST | CycleDetailDrawerModel |
| 6 | RealtimePhaseUpdated | ReceiveSSEPhaseUpdate | SwimlaneTrack | Backend SSE Broadcaster | LiveCycleProgressModel |
| 7 | CycleResumeRequested | RequestCycleResume | CycleDetailDrawer | Backend REST API | ActiveExecutionStatus |
| 8 | CycleAbortRequested | RequestCycleAbort | CycleDetailDrawer | Backend REST API | ActiveExecutionStatus |

## Section 2 — Subdomain Classification

| Subdomain | Type | Justification |
|---|---|---|
| Interactive Swimlane Visualization | Core | Visual coordination and multi-cycle temporal representation across agent lanes; primary UX for autonomous orchestration observablity. |
| Real-time Event Subscription | Supporting | Maintains live SSE connections, multiplexes incoming cycle status changes, and manages client memory buffers. |
| UI Design System & Theming | Generic | Standard WCAG AA compliant layout components, color tokens, and Itaú theme styling. |

## Section 3 — Ubiquitous Language Glossary

| Term | Definition | Notes |
|---|---|---|
| Swimlane Dashboard | Interactive panoramic workspace displaying multi-cycle autonomous executions along synchronized timeline tracks. | Based on Template 1 (Raias Paralelas). |
| Time Scale Ruler | Fixed top header showing continuous temporal markers (seconds, minutes, hours, or phase blocks). | Supports zoom levels: Zoom In, Zoom Out, Auto-fit. |
| Category Lane | Horizontal row grouping autonomous cycles by domain, agent type (e.g. backend, frontend, qa), or status. | Collapsible and filterable via pill tabs. |
| Cycle Card | Rounded rectangular visual block on a lane whose horizontal position and length map to cycle start/end timestamps. | Color-coded by state: running, completed, failed, aborted. |
| Category Filter Pill | Toggle button above swimlanes allowing instant isolation of specific agent domains without losing timeline sync. | E.g. [All], [Backend], [Frontend], [QA], [DevOps]. |
| Detail Drawer | Expandable side sheet showing detailed ANSI logs, token consumption, phase snapshots, and action buttons. | Opened by clicking a cycle card block. |
| Session Selector | Dropdown control allowing rapid switching between persisted session identifiers in the workspace. | Populated from `.harness/sessions/` manifests. |
| Live SSE Stream | Unidirectional HTTP event connection updating card positions and progress nodes in real-time. | Decoupled from raw log payloads. |

## Section 4 — Socratic Questions

**Business Invariants and Consistency**
- How does the swimlane view guarantee that cycle cards with zero duration or active running status render with a visible minimum bounding width on the time scale?
- What mechanism prevents UI state inconsistency when a cycle abort is confirmed via REST while SSE emits a delayed phase update?

**Scalability and Performance**
- How will the canvas render 50+ concurrent or historical cycle blocks across multiple lanes without causing React layout thrashing or dropped frames during scroll?
- How is memory managed in the frontend when receiving hundreds of SSE status updates per minute across active cycles?

**Security and Sensitive Data**
- How does the detail drawer ensure that raw terminal logs containing sensitive environment tokens are sanitized before DOM injection?

**Concurrency and Failures**
- How does the dashboard automatically reconnect its SSE event listener when the backend server restarts, without losing the user's active filter and zoom state?
- How does the session selector handle concurrent deletion or modification of session manifests on disk?

**Responsibility Boundaries Between Layers**
- How is the visual positioning calculation (pixel offset from timestamp) decoupled from the raw domain entity models?

---
**Architecture Tip:** Compute timeline coordinate projections in pure utility functions, keeping React components strictly declarative and driven by normalized view models.

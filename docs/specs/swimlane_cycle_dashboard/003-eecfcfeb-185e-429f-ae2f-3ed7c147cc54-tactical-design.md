# Tactical Design — eecfcfeb-185e-429f-ae2f-3ed7c147cc54
**Domain:** swimlane_cycle_dashboard | **Project:** eecfcfeb-185e-429f-ae2f-3ed7c147cc54

## Section 1 — Main Structure

| Element | Layer / Type | Invariants / Tech Rules | 4-line Snippet |
|---|---|---|---|
| swimlane.tokens | Styles | WCAG AA contrast ratio >= 4.5:1; Itaú palette | *see below* |
| SwimlaneDashboardView | Component | Renders time ruler, lanes, and active detail drawer | *see below* |
| useSwimlaneDashboard | Integration | Manages active session, SSE stream, and filtered lanes | *see below* |

```css
:root {
  --swimlane-header-h: 48px; --swimlane-lane-h: 72px;
  --swimlane-running: #0070f3; --swimlane-completed: #107c41;
}
```

```typescript
component SwimlaneDashboardView:
  props: SwimlaneViewProps; state: { activeSessionId, selectedCycleId }
  // renders: SessionSelector, CategoryFilterBar, TimeScaleHeader, CategoryLanes
```

```typescript
hook useSwimlaneDashboard(workspacePath: string):
  state: { session, lanes, activeCycle, isConnected }
  actions: { selectSession, resumeCycle, abortCycle, setFilter }
```

## Section 2 — Value Objects / Types / Interfaces

| Name | Context / Layer | Validation & Typing Rules | 4-line Snippet |
|---|---|---|---|
| SwimlaneCycleCardProps | Component | cycleId non-empty; start/end valid timestamps | *see below* |
| CategoryLaneModel | Integration | category name unique; cycles array non-null | *see below* |
| TimeScaleZoomLevel | Component | Enum: '1m' \| '5m' \| '15m' \| '1h' \| 'auto' | *see below* |

```typescript
interface SwimlaneCycleCardProps {
  cycle: CycleViewModel; pixelOffset: number; pixelWidth: number;
  onSelect: (cycleId: string) => void;
}
```

```typescript
interface CategoryLaneModel {
  category: string; displayName: string;
  cycles: CycleViewModel[]; isCollapsed?: boolean;
}
```

```typescript
type TimeScaleZoomLevel = '1m' | '5m' | '15m' | '1h' | 'auto';
// controls pixel-to-time ratio in ruler projections
```

## Section 3 — Domain Services / Use Cases / Actions

| Operation / Hook | Responsibility | Coordinates / Subscriptions | 4-line Snippet |
|---|---|---|---|
| calculateTimelineOffset | Converts timestamps to horizontal pixel position | timeScaleUtils | *see below* |
| useSwimlaneDashboard | Coordinates API queries, SSE subscriptions, and local filters | SwimlaneApiClient, EventStreamClient | *see below* |
| filterLanesByCategory | Filters lanes by selected category pills | View state | *see below* |

```typescript
function calculateTimelineOffset(timestamp: string, baseTime: string, scale: number): number {
  return Math.max(0, (new Date(timestamp).getTime() - new Date(baseTime).getTime()) * scale);
}
```

```typescript
hook useSwimlaneDashboard():
  // subscribes to SSE -> updates active session state -> manages drawer visibility
```

```typescript
function filterLanesByCategory(lanes: CategoryLaneModel[], filter: string): CategoryLaneModel[] {
  return filter === 'ALL' ? lanes : lanes.filter(l => l.category === filter);
}
```

## Section 4 — Events / Messages / Async Flows

| Event / Action Name | Trigger | Minimum Payload | Consumers |
|---|---|---|---|
| cycleCardClicked | User clicks a cycle card | `{ cycleId: string, sessionId: string }` | CycleDetailDrawer, Analytics |
| sseCyclePhaseUpdated | Backend broadcasts phase update | `{ cycleId: string, phase: string, status: string }` | useSwimlaneDashboard, CycleCard |
| categoryFilterChanged | User clicks category pill tab | `{ category: string }` | CategoryFilterBar, SwimlaneDashboardView |

## Section 5 — Persistence / Repository / Data Access Interfaces

| Resource / Adapter | Methods / Actions | Return Types / Expected State |
|---|---|---|
| SwimlaneApiClient | fetchSessions, fetchSessionManifest, resumeCycle, abortCycle | `Promise<SessionSummary[]>`, `Promise<SessionManifest>`, `Promise<void>` |

```typescript
interface SwimlaneApiClient {
  fetchSession(sessionId: string): Promise<SessionManifestDTO>;
  resumeCycle(sessionId: string, cycleId: string, fromPhase?: string): Promise<void>;
  abortCycle(cycleId: string, reason?: string): Promise<void>;
}
```

## Section 6 — Ordered Development Tasks

```json
[
  {
    "id": "01",
    "title": "Setup Swimlane Design Tokens and CSS Styles",
    "description": "Defines design variables, lane grid metrics, and status color tokens conforming to WCAG AA.",
    "scope": [
      "sdk-web/src/styles/swimlane.tokens.css",
      "sdk-web/src/styles/swimlane.module.css",
      "sdk-web/src/styles/__tests__/swimlaneContrast.spec.ts"
    ],
    "acceptance": [
      "Exports color tokens for all cycle states with WCAG AA contrast ratio >= 4.5:1",
      "Defines horizontal grid rules and sticky header variables"
    ],
    "depends_on": null
  },
  {
    "id": "02",
    "title": "Implement TimeScaleHeader Component and Time Utilities",
    "description": "Calculates temporal coordinate positions and renders the fixed top time scale ruler.",
    "scope": [
      "sdk-web/src/utils/timeScaleUtils.ts",
      "sdk-web/src/views/orchestrator/components/TimeScaleHeader.ts",
      "sdk-web/src/views/orchestrator/components/__tests__/TimeScaleHeader.spec.ts"
    ],
    "acceptance": [
      "Translates ISO timestamps into accurate horizontal pixel offsets and widths",
      "Renders time markers with dynamic zoom level intervals"
    ],
    "depends_on": "01"
  },
  {
    "id": "03",
    "title": "Implement CategoryLane and CycleCard Components",
    "description": "Renders horizontal category swimlanes and color-coded interactive cycle card blocks.",
    "scope": [
      "sdk-web/src/views/orchestrator/components/CycleCard.ts",
      "sdk-web/src/views/orchestrator/components/CategoryLane.ts",
      "sdk-web/src/views/orchestrator/components/__tests__/CategoryLane.spec.ts"
    ],
    "acceptance": [
      "Renders cycle card with status badge, duration label, and phase progress",
      "Emits onSelectCycle event when user clicks or focuses a cycle card"
    ],
    "depends_on": "02"
  },
  {
    "id": "04",
    "title": "Implement SessionSelector and CycleDetailDrawer",
    "description": "Provides session selection dropdown and expanding drawer for detailed phase inspection and abort actions.",
    "scope": [
      "sdk-web/src/views/orchestrator/components/SessionSelector.ts",
      "sdk-web/src/views/orchestrator/components/CycleDetailDrawer.ts",
      "sdk-web/src/views/orchestrator/components/__tests__/CycleDetailDrawer.spec.ts"
    ],
    "acceptance": [
      "Allows switching active session ID and triggers canvas reload",
      "Displays phase snapshots and triggers resume/abort action callbacks"
    ],
    "depends_on": "03"
  },
  {
    "id": "05",
    "title": "Implement SwimlaneApiClient and Dashboard Hook",
    "description": "Connects to backend REST endpoints and streams real-time SSE updates for the swimlane canvas.",
    "scope": [
      "sdk-web/src/services/SwimlaneApiClient.ts",
      "sdk-web/src/hooks/useSwimlaneDashboard.ts",
      "sdk-web/src/hooks/__tests__/useSwimlaneDashboard.spec.ts"
    ],
    "acceptance": [
      "Fetches session manifests and converts DTOs to swimlane view models",
      "Updates cycle state in real-time upon receiving SSE events"
    ],
    "depends_on": "04"
  },
  {
    "id": "06",
    "title": "Implement SwimlaneDashboardView and Category Filter Bar",
    "description": "Assembles the complete swimlane dashboard view with category filter pills and responsive layout.",
    "scope": [
      "sdk-web/src/views/orchestrator/components/CategoryFilterBar.ts",
      "sdk-web/src/views/orchestrator/SwimlaneDashboardView.ts",
      "sdk-web/src/views/orchestrator/__tests__/SwimlaneDashboardView.spec.ts"
    ],
    "acceptance": [
      "Filters active lanes by domain category without shifting time ruler alignment",
      "Renders full dashboard view with zero layout shifts or console errors"
    ],
    "depends_on": "05"
  }
]
```

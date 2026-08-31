# Test Scenarios — eecfcfeb-185e-429f-ae2f-3ed7c147cc54

**Domain:** swimlane_cycle_dashboard
**Project:** eecfcfeb-185e-429f-ae2f-3ed7c147cc54
**Framework:** Vitest
**Date:** 2026-08-31

## Section 1 — Unit Tests

### 1.1 Components and View Models

#### TimeScaleHeader Component
- [ ] **Should render time scale ruler with valid hour and minute tick marks**
  - Given: A base timestamp "2026-08-31T12:00:00Z" and zoom level '15m'
  - When: `TimeScaleHeader` component mounts
  - Then: Ruler renders temporal interval markers spaced proportionally along the header
- [ ] **Should adjust tick mark density when zoom level changes**
  - Given: `TimeScaleHeader` mounted at '15m' zoom
  - When: Zoom level is updated to '1h'
  - Then: Number of rendered tick marks decreases and interval width expands

#### CycleCard Component
- [ ] **Should render cycle card block with correct state badge and duration**
  - Given: `CycleViewModel` with state `RUNNING` and duration 45 seconds
  - When: `CycleCard` component is rendered
  - Then: Displays running status indicator and duration label with computed pixel width
- [ ] **Should trigger onSelect callback when cycle card is clicked**
  - Given: Rendered `CycleCard` with cycle ID "cycle-101"
  - When: User clicks the card element
  - Then: `onSelect` callback is invoked with "cycle-101"

#### CategoryLane Component
- [ ] **Should render lane title and container for cycle cards**
  - Given: `CategoryLaneModel` for category "backend" with 2 cycles
  - When: `CategoryLane` component renders
  - Then: Lane displays category header "Backend" and renders 2 child `CycleCard` components

### 1.2 Utilities and Coordinate Projections

#### timeScaleUtils
- [ ] **Should calculate exact pixel offset from timestamp and base start time**
  - Given: Base timestamp "2026-08-31T10:00:00Z", target time "2026-08-31T10:05:00Z", scale 1 px/sec
  - When: `calculateTimelineOffset()` is invoked
  - Then: Returns 300 pixels
- [ ] **Should calculate minimum bounding width for instantaneous or active cycles**
  - Given: Cycle start time equals end time
  - When: `calculateCardWidth()` is invoked
  - Then: Returns minimum width of 48 pixels preventing invisible card nodes

### 1.3 Custom Hooks

#### useSwimlaneDashboard Hook
- [ ] **Should initialize with idle state and fetch sessions list on mount**
  - Given: Mock `SwimlaneApiClient` with available sessions
  - When: `useSwimlaneDashboard` hook is executed
  - Then: State holds sessions list and selects latest active session by default
- [ ] **Should update cycle state when real-time SSE event is received**
  - Given: Active session in hook state
  - When: SSE broadcaster emits phase update for active cycle
  - Then: Hook state updates the target cycle's progress and status without refreshing the page

### 1.4 UI Events
- [ ] **Should filter visible lanes when category pill is selected**
  - Given: 4 lanes ("backend", "frontend", "qa", "devops")
  - When: User selects pill "backend"
  - Then: View displays only the "backend" lane while preserving horizontal time ruler scale

## Section 2 — Integration Tests

### 2.1 API and SSE Clients

#### SwimlaneApiClient
- [ ] **Should fetch session manifest and parse into normalized view models**
  - Given: Backend HTTP server running on `127.0.0.1`
  - When: `SwimlaneApiClient.fetchSession("sess-100")` is called
  - Then: Returns parsed `SessionManifest` with typed cycle collections
- [ ] **Should send resume cycle request to backend endpoint**
  - Given: Active cycle "cycle-1" in session "sess-100"
  - When: `SwimlaneApiClient.resumeCycle("sess-100", "cycle-1", "PHASE_A")` is called
  - Then: Sends HTTP POST to `/api/sessions/cycles/resume` and resolves successfully

### 2.2 View and Drawer Integration

#### SwimlaneDashboardView
- [ ] **Should open CycleDetailDrawer when a cycle card is selected**
  - Given: `SwimlaneDashboardView` with rendered lanes
  - When: User selects a cycle card
  - Then: `CycleDetailDrawer` opens displaying phase breakdown, token metrics, and action buttons
- [ ] **Should trigger cycle abort from drawer and update swimlane card status**
  - Given: Open drawer for running cycle "cycle-1"
  - When: User confirms abort action
  - Then: Abort API is called and card badge transitions to `ABORTED`

## Section 3 — Functional Tests

### 3.1 Happy Path Flows
- [ ] **Should render full interactive swimlane canvas and reflect live cycle execution**
  - Given: User navigates to Swimlane Dashboard
  - When: Multi-cycle execution runs in background
  - Then: Swimlane lanes display moving progress blocks, time ruler tracks elapsed time, and category filters function smoothly

### 3.2 Alternative and Error Flows
- [ ] **Should display empty state placeholder when selected session has no cycles**
  - Given: A newly initialized session with 0 cycles
  - When: Session is loaded in dashboard
  - Then: Displays friendly empty-state guidance and quick-start button
- [ ] **Should show reconnecting banner when SSE connection is interrupted**
  - Given: Active dashboard with established SSE stream
  - When: Network connection drops
  - Then: Shows warning banner and initiates exponential backoff reconnection

### 3.3 Accessibility and Theme Scenarios
- [ ] **Should meet WCAG AA contrast ratio for all cycle status badges and text**
  - Given: Dark and light themes in Itaú design system
  - When: Status badges (running, completed, failed, aborted) are rendered
  - Then: Contrast ratio against background is at least 4.5:1
- [ ] **Should support full keyboard navigation across swimlane cards and filter pills**
  - Given: Keyboard-only navigation mode
  - When: User navigates via Tab and Arrow keys
  - Then: Focus rings are visible on all interactive cards, pills, and drawer buttons

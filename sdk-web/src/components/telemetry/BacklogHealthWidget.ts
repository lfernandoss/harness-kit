import type {
  BacklogSummary,
  TaskSummary,
  ConfigSnapshot,
} from '../../types/telemetry.js'

export interface BacklogHealthWidgetProps {
  backlogSummary?: BacklogSummary
  taskSummary?: TaskSummary
  configSnapshot?: ConfigSnapshot
  theme?: 'light' | 'dark'
}

export function renderBacklogHealthWidget(props: BacklogHealthWidgetProps = {}): string {
  const backlog = props.backlogSummary ?? {
    total: 0,
    byStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, BLOCKED: 0, FAILED: 0 },
    avgScoreTL: null,
    avgScoreAdv: null,
  }

  const tasks = props.taskSummary ?? {
    total: 0,
    byStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, BLOCKED: 0, FAILED: 0 },
    byFeature: {},
  }

  const config = props.configSnapshot ?? {
    projectPaths: [],
    currentPhase: 'BOOTSTRAP',
    scoreThresholdTL: 0,
    scoreThresholdAdv: 0,
    maxReworks: 0,
    completedCycles: 0,
  }

  const theme = props.theme ?? 'light'

  let totalReworks = 0
  const featureList = Object.values(tasks.byFeature || {})
  for (const f of featureList) {
    totalReworks += f.reworks || 0
  }

  const statusChips = [
    { label: 'COMPLETED', count: backlog.byStatus.COMPLETED, className: 'status-completed' },
    { label: 'IN_PROGRESS', count: backlog.byStatus.IN_PROGRESS, className: 'status-in-progress' },
    { label: 'NOT_STARTED', count: backlog.byStatus.NOT_STARTED, className: 'status-not-started' },
    { label: 'BLOCKED', count: backlog.byStatus.BLOCKED, className: 'status-blocked' },
    { label: 'FAILED', count: backlog.byStatus.FAILED, className: 'status-failed' },
  ]
    .map(
      (s) => `
    <span class="status-chip ${s.className}">
      ${s.label}: ${s.count}
    </span>
  `.trim()
    )
    .join('\n')

  const featureItemsHtml =
    featureList.length > 0
      ? featureList
          .map(
            (f) => `
      <div class="feature-progress-item" data-feature="${f.featureId}">
        <div class="feature-header-line">
          <span class="feature-id">${f.featureId}</span>
          <span class="feature-title">${f.title || f.featureId}</span>
          <span class="feature-badge status-${f.status.toLowerCase().replace('_', '-')}">${f.status}</span>
        </div>
        <div class="feature-stats-line">
          <span>Tasks: ${f.completedTasks}/${f.totalTasks}</span>
          <span>Reworks: ${f.reworks}</span>
        </div>
      </div>
      `.trim()
          )
          .join('\n')
      : `
      <p class="feature-empty-text">No features in progress</p>
    `.trim()

  return `
<div class="backlog-health-widget itau-card" data-theme="${theme}">
  <div class="card-header">
    <div class="header-title-wrap">
      <span class="header-icon" aria-hidden="true">❤️</span>
      <h3 class="card-title">Backlog Health & Progress</h3>
    </div>
    <span class="header-count">${backlog.total} features</span>
  </div>

  <div class="health-summary-section">
    <div class="status-chips-grid">
      ${statusChips}
    </div>

    <div class="health-meta-grid">
      <div class="meta-item">
        <span class="meta-label">Completed Cycles:</span>
        <span class="meta-value">${config.completedCycles}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Total Reworks:</span>
        <span class="meta-value">${totalReworks}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Phase:</span>
        <span class="meta-value">${config.currentPhase}</span>
      </div>
    </div>
  </div>

  <div class="features-progress-section">
    <h4 class="section-subtitle">Features Breakdown</h4>
    <div class="features-list">
      ${featureItemsHtml}
    </div>
  </div>
</div>
`.trim()
}

export const BacklogHealthWidget = renderBacklogHealthWidget

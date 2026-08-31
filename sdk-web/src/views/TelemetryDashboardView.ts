import type {
  ProductReport,
  TelemetryFilterCriteria,
} from '../types/telemetry.js'
import { renderMetricsSummaryCards } from '../components/telemetry/MetricsSummaryCards.js'
import { renderSkillCostBreakdownTable } from '../components/telemetry/SkillCostBreakdownTable.js'
import { renderModelCostDistributionChart } from '../components/telemetry/ModelCostDistributionChart.js'
import { renderBacklogHealthWidget } from '../components/telemetry/BacklogHealthWidget.js'
import { renderAuditTrailTable } from '../components/telemetry/AuditTrailTable.js'

export interface TelemetryDashboardViewProps {
  report?: ProductReport | null
  isLoading?: boolean
  error?: string | null
  theme?: 'light' | 'dark'
  criteria?: TelemetryFilterCriteria
  onRefresh?: () => void
  onExport?: (fmt: 'csv' | 'json') => void
}

export function renderTelemetryDashboardView(
  props: TelemetryDashboardViewProps = {}
): string {
  const theme = props.theme ?? 'light'
  const isLoading = Boolean(props.isLoading)
  const error = props.error ?? null
  const report = props.report ?? null
  const criteria = props.criteria ?? {}

  if (isLoading) {
    return `
<div class="telemetry-dashboard is-loading" data-theme="${theme}">
  <header class="telemetry-view-header">
    <div class="header-title-wrap">
      <h1 class="page-title">Telemetry & Token Analytics</h1>
      <p class="page-subtitle">Historical and live token spend, model tier attributions, and backlog telemetry</p>
    </div>
  </header>
  <div class="loading-container">
    <span class="loading-spinner" aria-hidden="true">🔄</span>
    <p class="loading-text">Loading telemetry analytics...</p>
  </div>
</div>
`.trim()
  }

  if (error) {
    return `
<div class="telemetry-dashboard has-error" data-theme="${theme}">
  <header class="telemetry-view-header">
    <div class="header-title-wrap">
      <h1 class="page-title">Telemetry & Token Analytics</h1>
      <p class="page-subtitle">Historical and live token spend, model tier attributions, and backlog telemetry</p>
    </div>
  </header>
  <div class="telemetry-error-banner" role="alert">
    <span class="error-icon" aria-hidden="true">⚠️</span>
    <div class="error-content">
      <h3 class="error-title">Error Loading Telemetry</h3>
      <p class="error-message">${error}</p>
      <button type="button" class="btn btn-primary btn-retry-telemetry" data-action="retry">
        🔄 Retry
      </button>
    </div>
  </div>
</div>
`.trim()
  }

  const totals = report?.tokenReport?.totals
  const hasNoData =
    !report ||
    ((totals?.inputTokens ?? 0) === 0 &&
      (totals?.outputTokens ?? 0) === 0 &&
      (report.backlogSummary?.total ?? 0) === 0)

  const emptyBannerHtml = hasNoData
    ? `
  <div class="telemetry-empty-state itau-card">
    <span class="empty-icon" aria-hidden="true">📊</span>
    <h3 class="empty-title">No telemetry or execution runs recorded yet</h3>
    <p class="empty-description">
      Run an orchestration cycle or task to generate token spend and execution metrics.
    </p>
  </div>
  `
    : ''

  const metricsCardsHtml = renderMetricsSummaryCards({ report: report ?? undefined, theme })
  const skillTableHtml = renderSkillCostBreakdownTable({
    bySkill: report?.tokenReport?.bySkill,
    theme,
  })
  const modelChartHtml = renderModelCostDistributionChart({
    entries: report?.tokenReport?.entries,
    theme,
  })
  const backlogWidgetHtml = renderBacklogHealthWidget({
    backlogSummary: report?.backlogSummary,
    taskSummary: report?.taskSummary,
    configSnapshot: report?.configSnapshot,
    theme,
  })
  const auditTableHtml = renderAuditTrailTable({
    events: report?.tokenReport?.entries,
    criteria,
    theme,
  })

  return `
<div class="telemetry-dashboard" data-theme="${theme}" data-route="/reports">
  <header class="telemetry-view-header">
    <div class="header-title-wrap">
      <h1 class="page-title">Telemetry & Token Analytics</h1>
      <p class="page-subtitle">
        Historical and live token spend, model tier attributions, and backlog telemetry mirroring <code>hrns report</code>
      </p>
    </div>
    <div class="header-actions">
      <button type="button" class="btn btn-outline btn-refresh-telemetry" data-action="refresh" title="Refresh metrics">
        🔄 Refresh
      </button>
    </div>
  </header>

  <main class="telemetry-dashboard-content">
    ${emptyBannerHtml}

    <div class="telemetry-section-kpi">
      ${metricsCardsHtml}
    </div>

    <div class="telemetry-grid-two-col">
      <div class="col-main">
        ${skillTableHtml}
      </div>
      <div class="col-side">
        ${modelChartHtml}
      </div>
    </div>

    <div class="telemetry-section-health">
      ${backlogWidgetHtml}
    </div>

    <div class="telemetry-section-audit">
      ${auditTableHtml}
    </div>
  </main>
</div>
`.trim()
}

export const TelemetryDashboardView = renderTelemetryDashboardView

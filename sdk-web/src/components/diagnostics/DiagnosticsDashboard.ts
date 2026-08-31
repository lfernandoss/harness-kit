import type {
  DiagnoseSessionDTO,
  DiagnoseReportDTO,
  BatchProgressDTO,
} from '../../types/diagnostics.js'
import { renderBatchExecutionPanel } from './BatchExecutionPanel.js'

export interface DiagnosticsDashboardProps {
  pendingSessions?: DiagnoseSessionDTO[]
  isRunning?: boolean
  progress?: BatchProgressDTO | null
  report?: DiagnoseReportDTO | null
  error?: string | null
  onRunBatch?: () => void
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderDiagnosticsDashboard(props: DiagnosticsDashboardProps = {}): string {
  const pendingSessions = props.pendingSessions || []
  const isRunning = Boolean(props.isRunning)
  const report = props.report
  const error = props.error

  const batchPanelHtml = renderBatchExecutionPanel({
    pendingCount: pendingSessions.length,
    isRunning,
    progress: props.progress,
  })

  let sessionsListHtml = ''
  if (pendingSessions.length === 0) {
    sessionsListHtml = `
      <div class="empty-state-notice">
        <p class="text-muted">No pending diagnose sessions found</p>
      </div>
    `.trim()
  } else {
    const rows = pendingSessions
      .map(
        (s) => `
        <tr class="session-row" data-id="${escapeHtml(s.sessionId)}">
          <td class="session-id"><code>${escapeHtml(s.sessionId)}</code></td>
          <td class="session-runner"><span class="badge badge-runner">${escapeHtml(s.runner)}</span></td>
          <td class="session-phase">${escapeHtml(s.phase)}</td>
          <td class="session-time">${escapeHtml(s.timestamp)}</td>
          <td class="session-status"><span class="badge badge-pending">pending</span></td>
        </tr>
      `.trim()
      )
      .join('\n')

    sessionsListHtml = `
      <div class="table-responsive">
        <table class="table sessions-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Runner</th>
              <th>Phase</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `.trim()
  }

  let reportViewHtml = ''
  if (report) {
    const traceRows = (report.traceIds || [])
      .map((t) => `<li><a href="#/traces/${escapeHtml(t)}" class="trace-link"><code>${escapeHtml(t)}</code></a></li>`)
      .join('\n')

    const candidateHtml = report.candidateCreated
      ? `
      <div class="report-candidate-alert alert alert-success">
        <h4>Optimization Candidate Proposed:</h4>
        <p><strong>ID:</strong> <code>${escapeHtml(report.candidateCreated.candidateId)}</code></p>
        <p><strong>Target Skill:</strong> <span class="badge badge-skill">${escapeHtml(report.candidateCreated.targetSkill)}</span></p>
        <a href="#/candidates" class="btn btn-sm btn-outline-primary">View Candidate</a>
      </div>
    `.trim()
      : ''

    reportViewHtml = `
      <div class="diagnose-report-view card mt-4">
        <div class="card-header">
          <h3 class="card-title">Diagnose Report</h3>
          <span class="badge badge-success">${report.processedSessions} Sessions Processed</span>
        </div>
        <div class="card-body">
          <div class="report-metrics">
            <p><strong>Remaining Sessions:</strong> ${report.remainingSessions}</p>
          </div>
          ${candidateHtml}
          <div class="generated-traces">
            <h5>Generated Trace Sessions:</h5>
            <ul class="trace-list">
              ${traceRows || '<li>No traces recorded</li>'}
            </ul>
          </div>
        </div>
      </div>
    `.trim()
  }

  let errorBannerHtml = ''
  if (error) {
    errorBannerHtml = `
      <div class="alert alert-danger" role="alert">
        <span>${escapeHtml(error)}</span>
      </div>
    `.trim()
  }

  return `
<div class="diagnostics-dashboard">
  <div class="dashboard-header">
    <h2 class="dashboard-title">Diagnostics &amp; Meta-Harness</h2>
    <p class="dashboard-subtitle">Batch process recorded execution sessions and trigger autonomous prompt optimization.</p>
  </div>

  ${errorBannerHtml}

  <div class="dashboard-grid">
    <div class="dashboard-controls-col">
      ${batchPanelHtml}
    </div>

    <div class="dashboard-sessions-col card">
      <div class="card-header">
        <h3 class="card-title">Pending Session Queue</h3>
        <span class="badge badge-secondary">${pendingSessions.length} pending</span>
      </div>
      <div class="card-body">
        ${sessionsListHtml}
      </div>
    </div>
  </div>

  ${reportViewHtml}
</div>
`.trim()
}

export const DiagnosticsDashboard = renderDiagnosticsDashboard

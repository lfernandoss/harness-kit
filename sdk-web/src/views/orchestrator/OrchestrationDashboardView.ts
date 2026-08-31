import type { LiveSessionState, RunConfigDTO } from '../../types/index.js'
import { renderRunnerConfigCard } from './RunnerConfigCard.js'
import { renderPhaseTimeline } from './components/PhaseTimeline.js'
import { renderTelemetryCards } from './components/TelemetryCards.js'
import { renderLiveLogConsole } from './components/LiveLogConsole.js'
import { renderSteeringDrawer } from './components/SteeringDrawer.js'
import { renderAbortConfirmModal } from './components/AbortConfirmModal.js'
import { sanitizeHtml } from '../../utils/ansiParser.js'

export interface OrchestrationDashboardViewProps {
  session?: LiveSessionState | null
  isRunning?: boolean
  isDrawerOpen?: boolean
  isAbortModalOpen?: boolean
  conflictError?: { message: string; activeJobId?: string } | null
  error?: string | null
  autoScroll?: boolean
  isDarkTheme?: boolean
}

export function renderOrchestrationDashboardView(
  props: OrchestrationDashboardViewProps = {}
): string {
  const session = props.session || null
  const isRunning = Boolean(props.isRunning || (session && (session.status === 'queued' || session.status === 'running')))
  const conflictError = props.conflictError || null
  const isDark = props.isDarkTheme ?? true
  const autoScroll = props.autoScroll ?? true

  const conflictBannerHtml = conflictError
    ? `
    <div class="conflict-banner" role="alert">
      <div class="conflict-icon">⚠️</div>
      <div class="conflict-content">
        <h4 class="conflict-title">Workspace Concurrency Conflict (HTTP 409)</h4>
        <p class="conflict-message">${sanitizeHtml(conflictError.message)}</p>
        ${
          conflictError.activeJobId
            ? `<p class="conflict-job-link">Active Job ID: <code>${sanitizeHtml(conflictError.activeJobId)}</code></p>`
            : ''
        }
      </div>
    </div>
  `
    : ''

  let bodyContentHtml = ''

  if (isRunning && session) {
    const timelineHtml = renderPhaseTimeline({
      currentPhase: session.currentPhase,
      completedPhases: getCompletedPhases(session.currentPhase),
    })

    const telemetryHtml = renderTelemetryCards({
      tokensUsed: session.telemetry?.tokensUsed ?? 0,
      costEstimate: session.telemetry?.costEstimate ?? 0,
    })

    const logConsoleHtml = renderLiveLogConsole({
      lines: session.logs,
      autoScroll,
      isDarkTheme: isDark,
    })

    const steeringDrawerHtml = renderSteeringDrawer({
      jobId: session.jobId,
      isOpen: Boolean(props.isDrawerOpen),
      currentPhase: session.currentPhase,
    })

    const abortModalHtml = renderAbortConfirmModal({
      jobId: session.jobId,
      isOpen: Boolean(props.isAbortModalOpen),
    })

    bodyContentHtml = `
      <div class="live-execution-view">
        <div class="execution-header">
          <div class="job-meta">
            <h2 class="job-title">Active Orchestration Run</h2>
            <div class="job-badges">
              <span class="badge badge-job-id">Job: <code>${sanitizeHtml(session.jobId)}</code></span>
              <span class="badge badge-status status-${sanitizeHtml(session.status)}">${sanitizeHtml(session.status)}</span>
              <span class="badge badge-conn ${session.isConnected ? 'connected' : 'disconnected'}">
                ${session.isConnected ? '● Connected' : '○ Reconnecting...'}
              </span>
            </div>
          </div>

          <div class="execution-actions">
            <button type="button" class="btn btn-secondary btn-open-steering">
              🛠️ Session Steering
            </button>
            <button type="button" class="btn btn-danger btn-open-abort">
              🛑 Abort Run
            </button>
          </div>
        </div>

        <section class="section-timeline">
          ${timelineHtml}
        </section>

        <section class="section-telemetry">
          ${telemetryHtml}
        </section>

        <section class="section-logs">
          ${logConsoleHtml}
        </section>

        ${steeringDrawerHtml}
        ${abortModalHtml}
      </div>
    `
  } else {
    bodyContentHtml = renderRunnerConfigCard({
      error: props.error,
    })
  }

  return `
<div class="orchestration-dashboard">
  ${conflictBannerHtml}
  ${bodyContentHtml}
</div>
`.trim()
}

function getCompletedPhases(currentPhase: string): string[] {
  const ALL = ['BOOTSTRAP', 'REFINEMENT', 'PLANNING', 'DEVELOPMENT', 'REVIEW', 'MEMORY', 'TRANSITION', 'DEPLOY']
  const idx = ALL.indexOf(currentPhase)
  if (idx <= 0) return []
  return ALL.slice(0, idx)
}

export const OrchestrationDashboardView = renderOrchestrationDashboardView

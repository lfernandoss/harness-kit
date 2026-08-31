import { renderTelemetryDashboardView, TelemetryDashboardViewProps } from '../views/TelemetryDashboardView.js'
import { renderSettingsView, SettingsViewProps } from '../views/SettingsView.js'
import { renderOrchestrationDashboardView, OrchestrationDashboardViewProps } from '../views/orchestrator/OrchestrationDashboardView.js'
import { renderDiagnosticsDashboard } from '../components/diagnostics/DiagnosticsDashboard.js'
import { renderCandidateList } from '../components/candidates/CandidateList.js'
import { renderApplicationShell } from '../components/layout/ApplicationShell.js'
import type { ThemeMode } from '../types/index.js'

export interface RouteContext {
  path: string
  theme?: ThemeMode
  workspaceName?: string
  telemetryProps?: TelemetryDashboardViewProps
  settingsProps?: SettingsViewProps
  orchestrationProps?: OrchestrationDashboardViewProps
  diagnosticsProps?: any
  candidatesProps?: any
}

export function renderRouteView(context: RouteContext): string {
  const { path, theme = 'light', workspaceName = 'harness-kit' } = context

  let viewHtml = ''
  if (path === '/reports' || path.startsWith('/reports')) {
    viewHtml = renderTelemetryDashboardView({
      ...context.telemetryProps,
      theme,
    })
  } else if (path === '/settings' || path.startsWith('/settings')) {
    viewHtml = renderSettingsView(context.settingsProps)
  } else if (path === '/run' || path.startsWith('/run') || path === '/') {
    viewHtml = renderOrchestrationDashboardView(context.orchestrationProps)
  } else if (path === '/diagnose' || path.startsWith('/diagnose')) {
    viewHtml = renderDiagnosticsDashboard(context.diagnosticsProps)
  } else if (path === '/candidates' || path.startsWith('/candidates')) {
    viewHtml = renderCandidateList(context.candidatesProps)
  } else {
    viewHtml = `<div class="not-found-view"><h2>404 Not Found</h2><p>Path ${path} not found</p></div>`
  }

  return renderApplicationShell({
    workspaceName,
    theme,
    currentPath: path,
    content: viewHtml,
  })
}

export const AppRoutes = {
  renderRouteView,
}

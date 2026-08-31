import type { TelemetryAuditEvent, TelemetryFilterCriteria } from '../../types/telemetry.js'
import { filterAuditEntries } from '../../hooks/useTelemetryReport.js'

export interface AuditTrailTableProps {
  events?: TelemetryAuditEvent[]
  criteria?: TelemetryFilterCriteria
  theme?: 'light' | 'dark'
  onExport?: (fmt: 'csv' | 'json') => void
}

function formatNumber(num: number): string {
  return Number(num || 0).toLocaleString('en-US')
}

function formatTimestamp(ts: number): string {
  if (!ts) return 'N/A'
  const d = new Date(ts)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

export function renderAuditTrailTable(props: AuditTrailTableProps = {}): string {
  const allEvents = props.events ?? []
  const criteria = props.criteria ?? {}
  const theme = props.theme ?? 'light'

  const filtered = filterAuditEntries(allEvents, criteria)

  const rowsHtml =
    filtered.length > 0
      ? filtered
          .map(
            (e) => `
      <tr class="audit-row" data-id="${e.auditId || ''}">
        <td class="cell-ts">${formatTimestamp(e.timestamp)}</td>
        <td class="cell-skill"><code>${e.skill}</code></td>
        <td class="cell-agent">${e.agent || '-'}</td>
        <td class="cell-model"><code>${e.model || '-'}</code></td>
        <td class="cell-num">${formatNumber(e.inputTokens)}</td>
        <td class="cell-num">${formatNumber(e.outputTokens)}</td>
        <td class="cell-num">${formatNumber(e.cacheReadTokens)}</td>
        <td class="cell-cost">$${(e.costUsd || 0).toFixed(4)}</td>
      </tr>
      `.trim()
          )
          .join('\n')
      : `
      <tr>
        <td colspan="8" class="cell-empty">No telemetry audit records found</td>
      </tr>
    `.trim()

  return `
<div class="audit-trail-card itau-card" data-theme="${theme}">
  <div class="card-header">
    <div class="header-title-wrap">
      <span class="header-icon" aria-hidden="true">📜</span>
      <h3 class="card-title">Telemetry Audit Trail</h3>
    </div>
    <div class="export-actions">
      <button type="button" class="btn btn-outline btn-export-csv" data-action="export-csv">
        📥 Export CSV
      </button>
      <button type="button" class="btn btn-outline btn-export-json" data-action="export-json">
        📄 Export JSON
      </button>
    </div>
  </div>

  <div class="audit-filters-bar">
    <input
      type="text"
      class="input-search"
      placeholder="Search agent, skill, or model..."
      value="${criteria.search || ''}"
      data-filter="search"
    />
    <input
      type="text"
      class="input-skill"
      placeholder="Filter skill..."
      value="${criteria.skill || ''}"
      data-filter="skill"
    />
    <input
      type="text"
      class="input-model"
      placeholder="Filter model..."
      value="${criteria.model || ''}"
      data-filter="model"
    />
  </div>

  <div class="table-responsive">
    <table class="itau-table audit-table" aria-label="Telemetry Audit Events">
      <thead>
        <tr>
          <th scope="col">Timestamp</th>
          <th scope="col">Skill</th>
          <th scope="col">Agent</th>
          <th scope="col">Model</th>
          <th scope="col">Input</th>
          <th scope="col">Output</th>
          <th scope="col">Cache</th>
          <th scope="col">Cost (USD)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</div>
`.trim()
}

export const AuditTrailTable = renderAuditTrailTable

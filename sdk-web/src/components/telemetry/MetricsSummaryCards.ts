import type { ProductReport } from '../../types/telemetry.js'
import { renderCacheSavingsCard } from './CacheSavingsCard.js'

export interface MetricsSummaryCardsProps {
  report?: ProductReport | null
  theme?: 'light' | 'dark'
}

function formatNumber(num: number): string {
  return Number(num || 0).toLocaleString('en-US')
}

function getScoreBadgeClass(score: number | null): string {
  if (score === null || score === undefined) return 'score-badge-none'
  if (score >= 8.0) return 'score-badge-high'
  if (score >= 6.0) return 'score-badge-medium'
  return 'score-badge-low'
}

export function renderMetricsSummaryCards(props: MetricsSummaryCardsProps = {}): string {
  const theme = props.theme || 'light'
  const report = props.report

  const totals = report?.tokenReport?.totals ?? {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    costUsd: 0,
  }

  const backlog = report?.backlogSummary ?? {
    total: 0,
    byStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, BLOCKED: 0, FAILED: 0 },
    avgScoreTL: null,
    avgScoreAdv: null,
  }

  const costFormatted = `$${(totals.costUsd || 0).toFixed(4)}`
  const inputFormatted = formatNumber(totals.inputTokens)
  const outputFormatted = formatNumber(totals.outputTokens)
  const cacheFormatted = formatNumber(totals.cacheReadTokens)

  const tlScoreFormatted = backlog.avgScoreTL !== null ? backlog.avgScoreTL.toFixed(1) : 'N/A'
  const advScoreFormatted = backlog.avgScoreAdv !== null ? backlog.avgScoreAdv.toFixed(1) : 'N/A'

  const tlBadgeClass = getScoreBadgeClass(backlog.avgScoreTL)
  const advBadgeClass = getScoreBadgeClass(backlog.avgScoreAdv)

  const cacheSavingsHtml = renderCacheSavingsCard({ totals, theme })

  return `
<section class="metrics-summary-cards kpi-grid" data-theme="${theme}">
  <div class="kpi-card" data-card="total-cost">
    <div class="kpi-card-header">
      <span class="kpi-icon" aria-hidden="true">💰</span>
      <h3 class="kpi-title">Total Cost</h3>
    </div>
    <div class="kpi-card-body">
      <div class="kpi-value">${costFormatted}</div>
      <div class="kpi-subtext">Estimated USD Spend</div>
    </div>
  </div>

  <div class="kpi-card" data-card="input-tokens">
    <div class="kpi-card-header">
      <span class="kpi-icon" aria-hidden="true">📥</span>
      <h3 class="kpi-title">Input Tokens</h3>
    </div>
    <div class="kpi-card-body">
      <div class="kpi-value">${inputFormatted}</div>
      <div class="kpi-subtext">Prompt tokens sent</div>
    </div>
  </div>

  <div class="kpi-card" data-card="output-tokens">
    <div class="kpi-card-header">
      <span class="kpi-icon" aria-hidden="true">📤</span>
      <h3 class="kpi-title">Output Tokens</h3>
    </div>
    <div class="kpi-card-body">
      <div class="kpi-value">${outputFormatted}</div>
      <div class="kpi-subtext">Generation tokens received</div>
    </div>
  </div>

  <div class="kpi-card" data-card="cache-tokens">
    <div class="kpi-card-header">
      <span class="kpi-icon" aria-hidden="true">💾</span>
      <h3 class="kpi-title">Cache Read Tokens</h3>
    </div>
    <div class="kpi-card-body">
      <div class="kpi-value">${cacheFormatted}</div>
      <div class="kpi-subtext">Prompt cache hits</div>
    </div>
  </div>

  ${cacheSavingsHtml}

  <div class="kpi-card" data-card="quality-scores">
    <div class="kpi-card-header">
      <span class="kpi-icon" aria-hidden="true">🎯</span>
      <h3 class="kpi-title">Quality Scores</h3>
    </div>
    <div class="kpi-card-body score-pair">
      <div class="score-item">
        <span class="score-label">TL Score:</span>
        <span class="score-badge ${tlBadgeClass}">${tlScoreFormatted}</span>
      </div>
      <div class="score-item">
        <span class="score-label">QA Score:</span>
        <span class="score-badge ${advBadgeClass}">${advScoreFormatted}</span>
      </div>
    </div>
  </div>
</section>
`.trim()
}

export const MetricsSummaryCards = renderMetricsSummaryCards

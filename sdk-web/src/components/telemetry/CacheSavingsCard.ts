import type { TokenUsage } from '../../types/telemetry.js'
import { computeCacheSavings } from '../../hooks/useTelemetryReport.js'

export interface CacheSavingsCardProps {
  totals?: TokenUsage
  theme?: 'light' | 'dark'
}

export function renderCacheSavingsCard(props: CacheSavingsCardProps = {}): string {
  const totals = props.totals ?? {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    costUsd: 0,
  }

  const savings = computeCacheSavings(totals)
  const cachedFormatted = Number(savings.cachedTokens).toLocaleString('en-US')
  const savedUsdFormatted = `$${savings.estimatedSavedUsd.toFixed(4)}`
  const hitRatioFormatted = `${savings.hitRatioPercentage.toFixed(1)}%`

  return `
<div class="kpi-card cache-savings-card" data-card="cache-savings">
  <div class="kpi-card-header">
    <span class="kpi-icon" aria-hidden="true">⚡</span>
    <h3 class="kpi-title">Cache Savings</h3>
  </div>
  <div class="kpi-card-body">
    <div class="kpi-value">${savedUsdFormatted}</div>
    <div class="kpi-subtext">
      <span>Hit Ratio: <strong>${hitRatioFormatted}</strong></span>
      <span>(${cachedFormatted} cached tokens)</span>
    </div>
  </div>
</div>
`.trim()
}

export const CacheSavingsCard = renderCacheSavingsCard

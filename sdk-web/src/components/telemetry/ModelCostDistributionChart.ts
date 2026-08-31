import type { TokenEntry, ModelDistributionItem } from '../../types/telemetry.js'

export function inferModelTier(modelName: string): string {
  const m = (modelName || '').toLowerCase()
  if (m.includes('flash') || m.includes('haiku') || m.includes('mini')) return 'fast'
  if (m.includes('opus') || m.includes('o1') || m.includes('o3') || m.includes('extra')) return 'large'
  return 'medium'
}

export function aggregateModelCost(entries: TokenEntry[]): ModelDistributionItem[] {
  if (!entries || !Array.isArray(entries)) return []

  const modelMap: Record<string, { tier: string; costUsd: number }> = {}
  let totalCost = 0

  for (const entry of entries) {
    const model = entry.model || 'unknown-model'
    const cost = entry.costUsd || 0
    totalCost += cost

    if (!modelMap[model]) {
      modelMap[model] = {
        tier: inferModelTier(model),
        costUsd: 0,
      }
    }
    modelMap[model].costUsd += cost
  }

  const items: ModelDistributionItem[] = Object.entries(modelMap).map(([model, data]) => {
    const percentage = totalCost > 0 ? (data.costUsd / totalCost) * 100 : 0
    return {
      model,
      tier: data.tier,
      costUsd: data.costUsd,
      percentage,
    }
  })

  items.sort((a, b) => b.costUsd - a.costUsd)
  return items
}

export interface ModelCostDistributionChartProps {
  entries?: TokenEntry[]
  theme?: 'light' | 'dark'
}

export function renderModelCostDistributionChart(
  props: ModelCostDistributionChartProps = {}
): string {
  const entries = props.entries ?? []
  const theme = props.theme ?? 'light'
  const items = aggregateModelCost(entries)

  const barsHtml =
    items.length > 0
      ? items
          .map((item) => {
            const pctFormatted = item.percentage.toFixed(1)
            const costFormatted = `$${item.costUsd.toFixed(4)}`
            return `
      <div class="distribution-bar-item" data-model="${item.model}" data-tier="${item.tier}">
        <div class="bar-label-row">
          <span class="model-name">${item.model}</span>
          <span class="tier-pill tier-${item.tier}">${item.tier.toUpperCase()}</span>
          <span class="cost-value">${costFormatted} (${pctFormatted}%)</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill bar-${item.tier}" style="width: ${Math.max(item.percentage, 2)}%" title="${item.model}: ${costFormatted} (${pctFormatted}%)"></div>
        </div>
      </div>
      `.trim()
          })
          .join('\n')
      : `
      <div class="chart-empty-state">
        <p>No model execution entries available</p>
      </div>
    `.trim()

  return `
<div class="model-distribution-chart itau-card palette-itau" data-theme="${theme}">
  <div class="card-header">
    <div class="header-title-wrap">
      <span class="header-icon" aria-hidden="true">📈</span>
      <h3 class="card-title">Model Spend Distribution</h3>
    </div>
    <span class="header-count">${items.length} models</span>
  </div>

  <div class="chart-content">
    ${barsHtml}
  </div>
</div>
`.trim()
}

export const ModelCostDistributionChart = renderModelCostDistributionChart

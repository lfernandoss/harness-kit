import type { TokenUsage, SkillCostRow } from '../../types/telemetry.js'

export interface SkillCostBreakdownTableProps {
  bySkill?: Record<string, TokenUsage>
  sortBy?: 'skill' | 'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'costUsd'
  sortOrder?: 'asc' | 'desc'
  theme?: 'light' | 'dark'
}

function formatNumber(num: number): string {
  return Number(num || 0).toLocaleString('en-US')
}

export function renderSkillCostBreakdownTable(props: SkillCostBreakdownTableProps = {}): string {
  const bySkill = props.bySkill ?? {}
  const sortBy = props.sortBy ?? 'costUsd'
  const sortOrder = props.sortOrder ?? 'desc'
  const theme = props.theme ?? 'light'

  const rows: SkillCostRow[] = Object.entries(bySkill).map(([skill, u]) => ({
    skill,
    inputTokens: u.inputTokens || 0,
    outputTokens: u.outputTokens || 0,
    cacheReadTokens: u.cacheReadTokens || 0,
    costUsd: u.costUsd || 0,
  }))

  rows.sort((a, b) => {
    let comparison = 0
    if (sortBy === 'skill') {
      comparison = a.skill.localeCompare(b.skill)
    } else {
      comparison = (a[sortBy] as number) - (b[sortBy] as number)
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const maxCost = Math.max(...rows.map((r) => r.costUsd), 0.0001)

  const rowsHtml =
    rows.length > 0
      ? rows
          .map((row, idx) => {
            const isTop = row.costUsd === maxCost && row.costUsd > 0
            const rowClass = isTop ? 'skill-row top-consumer' : 'skill-row'
            return `
      <tr class="${rowClass}" data-skill="${row.skill}">
        <td class="cell-skill">
          <span class="skill-name">${row.skill}</span>
          ${isTop ? '<span class="badge-top">Top</span>' : ''}
        </td>
        <td class="cell-num">${formatNumber(row.inputTokens)}</td>
        <td class="cell-num">${formatNumber(row.outputTokens)}</td>
        <td class="cell-num">${formatNumber(row.cacheReadTokens)}</td>
        <td class="cell-cost">$${row.costUsd.toFixed(4)}</td>
      </tr>
      `.trim()
          })
          .join('\n')
      : `
      <tr>
        <td colspan="5" class="cell-empty">No skill token usage recorded</td>
      </tr>
    `.trim()

  return `
<div class="skill-cost-breakdown-card itau-card" data-theme="${theme}">
  <div class="card-header">
    <div class="header-title-wrap">
      <span class="header-icon" aria-hidden="true">📊</span>
      <h3 class="card-title">Skill Cost Breakdown</h3>
    </div>
    <span class="header-count">${rows.length} skills tracked</span>
  </div>

  <div class="table-responsive">
    <table class="itau-table skill-matrix-table" aria-label="Skill Token and Cost Breakdown">
      <thead>
        <tr>
          <th scope="col" class="th-sortable" data-sort="skill">Skill</th>
          <th scope="col" class="th-sortable" data-sort="inputTokens">Input Tokens</th>
          <th scope="col" class="th-sortable" data-sort="outputTokens">Output Tokens</th>
          <th scope="col" class="th-sortable" data-sort="cacheReadTokens">Cache Read</th>
          <th scope="col" class="th-sortable" data-sort="costUsd">Cost (USD)</th>
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

export const SkillCostBreakdownTable = renderSkillCostBreakdownTable

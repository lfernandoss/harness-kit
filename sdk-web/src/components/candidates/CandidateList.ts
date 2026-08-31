import type { CandidateSummaryDTO } from '../../types/diagnostics.js'

export interface CandidateListProps {
  candidates?: CandidateSummaryDTO[]
  selectedFilter?: 'ALL' | 'PROPOSED' | 'APPLIED' | 'PROMOTED'
  selectedSkill?: string
  isLoading?: boolean
  onSelectCandidate?: (candidateId: string) => void
  onFilterChange?: (filter: 'ALL' | 'PROPOSED' | 'APPLIED' | 'PROMOTED') => void
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderCandidateList(props: CandidateListProps = {}): string {
  const candidates = props.candidates || []
  const filter = props.selectedFilter || 'ALL'
  const isLoading = Boolean(props.isLoading)

  const filtered = candidates.filter((c) => {
    if (filter !== 'ALL' && c.status !== filter) return false
    if (props.selectedSkill && c.targetSkill !== props.selectedSkill) return false
    return true
  })

  const filterPills = (['ALL', 'PROPOSED', 'APPLIED', 'PROMOTED'] as const).map((status) => {
    const isSelected = filter === status
    return `
      <button
        type="button"
        class="filter-pill ${isSelected ? 'active' : ''}"
        data-status="${status}"
      >
        ${status}
      </button>
    `.trim()
  }).join('\n')

  let cardsHtml = ''
  if (isLoading) {
    cardsHtml = '<div class="loading-spinner">Loading candidates...</div>'
  } else if (filtered.length === 0) {
    cardsHtml = `
      <div class="empty-candidates-notice">
        <p class="text-muted">No candidates found for the selected filter.</p>
      </div>
    `.trim()
  } else {
    cardsHtml = filtered
      .map((c) => {
        const badgeClass =
          c.status === 'PROMOTED'
            ? 'badge-promoted badge-success'
            : c.status === 'APPLIED'
            ? 'badge-applied badge-info'
            : 'badge-proposed badge-warning'

        return `
        <div
          class="candidate-card card"
          data-candidate-id="${escapeHtml(c.candidateId)}"
          role="button"
          tabindex="0"
        >
          <div class="card-header">
            <div class="card-title-group">
              <span class="candidate-id"><code>${escapeHtml(c.candidateId)}</code></span>
              <span class="badge badge-skill">${escapeHtml(c.targetSkill)}</span>
            </div>
            <span class="badge ${badgeClass}">${c.status}</span>
          </div>

          <div class="card-body">
            <p class="candidate-rationale">${escapeHtml(c.shortRationale || 'No short summary available')}</p>
          </div>

          <div class="card-footer">
            <span class="card-path text-muted"><code>${escapeHtml(c.path)}</code></span>
            <button
              type="button"
              class="btn btn-sm btn-outline-primary btn-inspect-candidate"
              data-candidate-id="${escapeHtml(c.candidateId)}"
            >
              Review Diff ➔
            </button>
          </div>
        </div>
      `.trim()
      })
      .join('\n')
  }

  return `
<div class="candidate-list-view">
  <div class="candidate-list-header">
    <div class="header-titles">
      <h2 class="section-title">Optimization Candidates</h2>
      <p class="section-subtitle">Inspect Meta-Harness prompt mutation proposals and promote them to active skill files.</p>
    </div>

    <div class="candidate-filter-bar" role="group" aria-label="Candidate Status Filters">
      ${filterPills}
    </div>
  </div>

  <div class="candidate-grid">
    ${cardsHtml}
  </div>
</div>
`.trim()
}

export const CandidateList = renderCandidateList

import type { CandidateDetailDTO } from '../../types/diagnostics.js'

export interface CandidateDetailModalProps {
  isOpen: boolean
  candidate?: CandidateDetailDTO | null
  isPromoting?: boolean
  error?: string | null
  onClose?: () => void
  onPromoteAutonomous?: (runner?: string) => void
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderCandidateDetailModal(props: CandidateDetailModalProps): string {
  const isOpen = Boolean(props.isOpen)
  const candidate = props.candidate
  const isPromoting = Boolean(props.isPromoting)
  const error = props.error

  if (!candidate && isOpen) {
    return `
      <div class="dialog-overlay open" role="dialog" aria-modal="true">
        <div class="dialog-modal candidate-modal">
          <div class="loading-state">Loading candidate details...</div>
        </div>
      </div>
    `.trim()
  }

  const candidateId = candidate?.candidateId || ''
  const targetSkill = candidate?.targetSkill || ''
  const rationale = candidate?.rationale || 'No rationale recorded.'
  const diff = candidate?.promptDiff || 'No diff available.'
  const runnerCommand = candidate?.runnerCommand || `hrns candidate review ${candidateId}`
  const status = candidate?.status || 'PROPOSED'

  const statusBadgeClass =
    status === 'PROMOTED'
      ? 'badge-success'
      : status === 'APPLIED'
      ? 'badge-info'
      : 'badge-warning'

  const errorBannerHtml = error
    ? `
    <div class="alert alert-danger" role="alert">
      <span>${escapeHtml(error)}</span>
    </div>
  `
    : ''

  return `
<div
  class="dialog-overlay candidate-modal-backdrop ${isOpen ? 'open' : ''}"
  ${!isOpen ? 'hidden style="display: none;"' : ''}
>
  <div
    class="dialog-modal candidate-detail-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="candidate-modal-title"
  >
    <div class="dialog-header modal-header">
      <div class="title-wrap">
        <h3 id="candidate-modal-title" class="modal-title">
          Candidate Review: <code>${escapeHtml(candidateId)}</code>
        </h3>
        <span class="badge badge-skill">${escapeHtml(targetSkill)}</span>
        <span class="badge ${statusBadgeClass}">${status}</span>
      </div>
      <button type="button" class="btn-close-modal" aria-label="Close modal">✕</button>
    </div>

    <div class="dialog-body modal-body">
      ${errorBannerHtml}

      <div class="modal-section rationale-section">
        <h4 class="section-heading">Diagnosis &amp; Rationale</h4>
        <div class="rationale-content">
          <p>${escapeHtml(rationale)}</p>
        </div>
      </div>

      <div class="modal-section diff-section">
        <h4 class="section-heading">Prompt Diff Preview</h4>
        <pre class="diff-preview-box"><code>${escapeHtml(diff)}</code></pre>
      </div>

      <div class="modal-section cli-command-section">
        <h4 class="section-heading">Interactive Terminal Review</h4>
        <div class="code-snippet-box">
          <code>${escapeHtml(runnerCommand)}</code>
          <button type="button" class="btn btn-sm btn-copy-cmd" data-cmd="${escapeHtml(runnerCommand)}">
            Copy
          </button>
        </div>
      </div>
    </div>

    <div class="dialog-footer modal-footer">
      <button type="button" class="btn btn-secondary btn-modal-close">
        Close
      </button>
      <button
        type="button"
        class="btn btn-success btn-promote-autonomous"
        ${isPromoting ? 'disabled' : ''}
      >
        ${isPromoting ? 'Applying via LLM...' : 'Apply via LLM'}
      </button>
    </div>
  </div>
</div>
`.trim()
}

export const CandidateDetailModal = renderCandidateDetailModal

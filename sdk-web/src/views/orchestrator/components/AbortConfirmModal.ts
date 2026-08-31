import { sanitizeHtml } from '../../../utils/ansiParser.js'

export interface AbortConfirmModalProps {
  jobId: string
  isOpen: boolean
  isAborting?: boolean
}

export function renderAbortConfirmModal(props: AbortConfirmModalProps): string {
  const isOpen = Boolean(props.isOpen)
  const isAborting = Boolean(props.isAborting)

  if (!isOpen) return ''

  return `
<div class="modal-backdrop abort-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="abort-title">
  <div class="modal-dialog">
    <div class="modal-header">
      <h3 id="abort-title" class="modal-title">Abort Execution</h3>
      <button type="button" class="btn-close-modal" aria-label="Cancel">✕</button>
    </div>

    <div class="modal-body">
      <p class="modal-warning">
        ⚠️ <strong>Are you sure you want to abort the running execution?</strong>
      </p>
      <p class="modal-explanation">
        Aborting will terminate the agent runner subprocess tree immediately (<code>taskkill /t</code> / <code>SIGKILL</code>), release the workspace lock, and mark job <code>${sanitizeHtml(
          props.jobId
        )}</code> as aborted.
      </p>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-secondary btn-cancel-abort" ${isAborting ? 'disabled' : ''}>
        Continue Execution
      </button>
      <button type="button" class="btn btn-danger btn-confirm-abort" ${isAborting ? 'disabled' : ''}>
        ${isAborting ? 'Aborting...' : 'Confirm Abort'}
      </button>
    </div>
  </div>
</div>
`.trim()
}

export const AbortConfirmModal = renderAbortConfirmModal

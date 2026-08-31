export interface OverwriteGuardDialogProps {
  isOpen: boolean
  workspacePath?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export function renderOverwriteGuardDialog(props: OverwriteGuardDialogProps): string {
  const isOpen = Boolean(props.isOpen)
  const pathLabel = props.workspacePath || 'this workspace'

  return `
<div
  class="dialog-overlay ${isOpen ? 'open' : ''}"
  ${!isOpen ? 'hidden style="display: none;"' : ''}
>
  <div
    class="dialog-modal overwrite-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="overwrite-dialog-title"
    aria-describedby="overwrite-dialog-desc"
  >
    <div class="dialog-header">
      <div class="warning-icon" aria-hidden="true">⚠️</div>
      <h3 id="overwrite-dialog-title" class="dialog-title">
        Existing Workspace Detected
      </h3>
    </div>

    <div id="overwrite-dialog-desc" class="dialog-body">
      <p class="warning-text">
        An existing <code>docs/product/</code> directory was found in <strong>${escapeHtml(pathLabel)}</strong>.
      </p>
      <p class="warning-subtext">
        Re-initializing will replace existing tracking files (<code>DEVELOPMENT-STATE.md</code>, <code>ROADMAP.md</code>, <code>REQUIREMENTS.md</code>, <code>BACKLOG.md</code>, and <code>BOOTSTRAP-CONFIG.json</code>) with new templates.
      </p>
    </div>

    <div class="dialog-footer">
      <button
        type="button"
        class="btn btn-secondary btn-overwrite-cancel"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-danger btn-overwrite-confirm"
      >
        Overwrite &amp; Continue
      </button>
    </div>
  </div>
</div>
`.trim()
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const OverwriteGuardDialog = renderOverwriteGuardDialog

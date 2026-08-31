import type { SettingsScope } from '../../types/settings.types.js'
import { sanitizeHtml } from '../../utils/ansiParser.js'

export interface SettingsConfirmModalProps {
  isOpen: boolean
  actionType: 'renew' | 'delete'
  targetPath: string
  scope?: SettingsScope
  isProcessing?: boolean
}

export function renderSettingsConfirmModal(props: SettingsConfirmModalProps): string {
  const isOpen = Boolean(props.isOpen)
  const isProcessing = Boolean(props.isProcessing)
  const actionType = props.actionType || 'renew'
  const targetPath = props.targetPath || ''
  const scope = props.scope || 'global'

  if (!isOpen) return ''

  const isRenew = actionType === 'renew'

  const title = isRenew
    ? 'Renew Settings to Defaults'
    : 'Delete Settings File'

  const warningMessage = isRenew
    ? '⚠️ Are you sure you want to renew settings to canonical defaults?'
    : '🚨 Are you sure you want to permanently delete this settings file?'

  const description = isRenew
    ? `This will overwrite all custom runner timeouts, models, and phase overrides in <code>${sanitizeHtml(
        targetPath
      )}</code> (${scope} scope) with the default configuration.`
    : `This will remove the settings file at <code>${sanitizeHtml(
        targetPath
      )}</code> (${scope} scope) from disk. Future runs will fall back to higher-precedence or default settings.`

  const confirmBtnClass = isRenew ? 'btn-warning btn-confirm-renew' : 'btn-danger btn-confirm-delete'
  const confirmBtnLabel = isProcessing
    ? isRenew
      ? 'Renewing...'
      : 'Deleting...'
    : isRenew
    ? 'Confirm & Renew to Defaults'
    : 'Confirm & Delete File'

  return `
<div class="modal-backdrop settings-confirm-modal modal-settings-${sanitizeHtml(actionType)}" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
  <div class="modal-dialog">
    <header class="modal-header">
      <h3 id="settings-modal-title" class="modal-title">${sanitizeHtml(title)}</h3>
      <button type="button" class="btn-close-modal btn-cancel-modal" aria-label="Close modal">✕</button>
    </header>

    <div class="modal-body">
      <p class="modal-warning">
        <strong>${warningMessage}</strong>
      </p>
      <p class="modal-description">
        ${description}
      </p>
      <div class="modal-target-path-card">
        <span class="path-label">Target File Path:</span>
        <code class="path-code">${sanitizeHtml(targetPath)}</code>
      </div>
    </div>

    <footer class="modal-footer">
      <button type="button" class="btn btn-secondary btn-cancel-modal" ${isProcessing ? 'disabled' : ''}>
        Cancel
      </button>
      <button type="button" class="btn ${confirmBtnClass}" ${isProcessing ? 'disabled' : ''}>
        ${confirmBtnLabel}
      </button>
    </footer>
  </div>
</div>
`.trim()
}

export const SettingsConfirmModal = renderSettingsConfirmModal

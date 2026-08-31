import type {
  SettingsScope,
  HarnessSettingsMap,
  SettingsDiagnostic,
} from '../types/settings.types.js'
import { renderScopeSelector } from '../components/settings/ScopeSelector.js'
import { renderSettingsFormEditor } from '../components/settings/SettingsFormEditor.js'
import { renderRawJsonEditor } from '../components/settings/RawJsonEditor.js'
import { renderSettingsConfirmModal } from '../components/settings/SettingsConfirmModal.js'
import { sanitizeHtml } from '../utils/ansiParser.js'

export interface SettingsViewProps {
  scope?: SettingsScope
  project?: string
  settings?: HarnessSettingsMap
  draft?: HarnessSettingsMap
  rawJson?: string
  targetPath?: string
  exists?: boolean
  mode?: 'form' | 'raw'
  isDirty?: boolean
  diagnostics?: SettingsDiagnostic
  isLoading?: boolean
  isSaving?: boolean
  isRenewing?: boolean
  isDeleting?: boolean
  error?: string | null
  successMessage?: string | null
  isRenewModalOpen?: boolean
  isDeleteModalOpen?: boolean
}

export function renderSettingsView(props: SettingsViewProps = {}): string {
  const scope = props.scope || 'global'
  const project = props.project
  const targetPath = props.targetPath || ''
  const exists = props.exists ?? true
  const mode = props.mode || 'form'
  const isDirty = Boolean(props.isDirty)
  const isSaving = Boolean(props.isSaving)
  const isLoading = Boolean(props.isLoading)
  const diagnostics = props.diagnostics || { valid: true, errors: [] }
  const draft = props.draft || props.settings || {}
  const rawJson = props.rawJson || JSON.stringify(draft, null, 2)
  const error = props.error || null
  const successMessage = props.successMessage || null
  const isRenewModalOpen = Boolean(props.isRenewModalOpen)
  const isDeleteModalOpen = Boolean(props.isDeleteModalOpen)

  const scopeSelectorHtml = renderScopeSelector({
    scope,
    project,
    targetPath,
    isDirty,
  })

  const toastSuccessHtml = successMessage
    ? `
    <div class="settings-toast settings-toast-success" role="status">
      <span class="toast-icon" aria-hidden="true">✓</span>
      <span class="toast-message">${sanitizeHtml(successMessage)}</span>
    </div>
  `
    : ''

  const errorBannerHtml = error
    ? `
    <div class="settings-banner settings-error-banner" role="alert">
      <span class="banner-icon" aria-hidden="true">⚠️</span>
      <span class="banner-message">${sanitizeHtml(error)}</span>
    </div>
  `
    : ''

  let editorContentHtml = ''
  if (mode === 'form') {
    editorContentHtml = renderSettingsFormEditor({
      settings: draft,
      isReadOnly: isLoading || isSaving,
    })
  } else {
    editorContentHtml = renderRawJsonEditor({
      jsonString: rawJson,
      diagnostics,
      isReadOnly: isLoading || isSaving,
    })
  }

  const renewModalHtml = renderSettingsConfirmModal({
    isOpen: isRenewModalOpen,
    actionType: 'renew',
    targetPath,
    scope,
    isProcessing: Boolean(props.isRenewing),
  })

  const deleteModalHtml = renderSettingsConfirmModal({
    isOpen: isDeleteModalOpen,
    actionType: 'delete',
    targetPath,
    scope,
    isProcessing: Boolean(props.isDeleting),
  })

  const saveDisabled = !isDirty || !diagnostics.valid || isSaving || isLoading
  const discardDisabled = !isDirty || isSaving || isLoading

  return `
<div class="settings-view-page ${isDirty ? 'is-dirty' : ''}">
  <header class="settings-view-header">
    <div class="header-main">
      <div class="title-wrap">
        <h1 class="page-title">Settings Management</h1>
        <p class="page-subtitle">
          Configure global and workspace settings, agent runner models, and per-phase timeout overrides.
        </p>
      </div>

      <div class="header-mode-toggle">
        <span class="mode-label">View Mode:</span>
        <div class="btn-group-toggle" role="radiogroup" aria-label="Editor View Mode">
          <button
            type="button"
            class="btn-mode-toggle ${mode === 'form' ? 'active' : ''}"
            data-mode="form"
            aria-checked="${mode === 'form'}"
            role="radio"
          >
            📋 Visual Form
          </button>
          <button
            type="button"
            class="btn-mode-toggle ${mode === 'raw' ? 'active' : ''}"
            data-mode="raw"
            aria-checked="${mode === 'raw'}"
            role="radio"
          >
            { } Raw JSON
          </button>
        </div>
      </div>
    </div>

    ${scopeSelectorHtml}
  </header>

  <main class="settings-view-content" id="settings-editor-panel">
    ${toastSuccessHtml}
    ${errorBannerHtml}

    ${
      !exists
        ? `
      <div class="settings-empty-state-card">
        <span class="empty-icon" aria-hidden="true">📄</span>
        <h3 class="empty-title">Settings File Does Not Exist</h3>
        <p class="empty-description">
          No <code>settings.json</code> was found for this target. Click <strong>Renew Defaults</strong> to create a fresh configuration.
        </p>
      </div>
    `
        : ''
    }

    <div class="settings-editor-wrapper">
      ${editorContentHtml}
    </div>
  </main>

  <footer class="settings-action-bar">
    <div class="action-bar-left">
      ${
        isDirty
          ? `<span class="dirty-badge" aria-live="polite">● Unsaved Changes</span>`
          : `<span class="clean-badge">All changes saved</span>`
      }
    </div>

    <div class="action-bar-right">
      <button
        type="button"
        class="btn btn-outline-danger btn-delete-settings"
        title="Delete settings file"
      >
        🗑️ Delete
      </button>

      <button
        type="button"
        class="btn btn-outline-warning btn-renew-settings"
        title="Reset to default settings"
      >
        🔄 Renew Defaults
      </button>

      <button
        type="button"
        class="btn btn-secondary btn-discard-settings"
        ${discardDisabled ? 'disabled' : ''}
      >
        Discard
      </button>

      <button
        type="button"
        class="btn btn-primary btn-save-settings"
        ${saveDisabled ? 'disabled' : ''}
      >
        ${isSaving ? 'Saving...' : '💾 Save Settings'}
      </button>
    </div>
  </footer>

  ${renewModalHtml}
  ${deleteModalHtml}
</div>
`.trim()
}

export const SettingsView = renderSettingsView

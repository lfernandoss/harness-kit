import type { SettingsScope } from '../../types/settings.types.js'
import { sanitizeHtml } from '../../utils/ansiParser.js'

export interface ScopeSelectorProps {
  scope: SettingsScope
  project?: string
  targetPath?: string
  isDirty?: boolean
}

export function renderScopeSelector(props: ScopeSelectorProps): string {
  const scope = props.scope || 'global'
  const isGlobal = scope === 'global'
  const isLocal = scope === 'local'
  const project = props.project || ''
  const targetPath = props.targetPath || ''

  return `
<div class="scope-selector-container">
  <div class="scope-tabs-nav" role="tablist" aria-label="Settings Scope Navigation">
    <button
      type="button"
      role="tab"
      id="tab-scope-global"
      class="scope-tab-btn ${isGlobal ? 'active' : ''}"
      data-scope="global"
      aria-selected="${isGlobal}"
      aria-pressed="${isGlobal}"
      aria-controls="settings-editor-panel"
    >
      <span class="tab-icon" aria-hidden="true">🌐</span>
      <span class="tab-label">Global Scope</span>
      <span class="tab-badge">~/.config/harness-kit</span>
    </button>
    <button
      type="button"
      role="tab"
      id="tab-scope-local"
      class="scope-tab-btn ${isLocal ? 'active' : ''}"
      data-scope="local"
      aria-selected="${isLocal}"
      aria-pressed="${isLocal}"
      aria-controls="settings-editor-panel"
    >
      <span class="tab-icon" aria-hidden="true">📁</span>
      <span class="tab-label">Local Workspace Scope</span>
      ${
        project
          ? `<span class="tab-badge project-badge">${sanitizeHtml(project)}</span>`
          : '<span class="tab-badge">.harness-kit</span>'
      }
    </button>
  </div>
  ${
    targetPath
      ? `
    <div class="scope-target-path-meta">
      <span class="path-label">Active Target File:</span>
      <code class="path-value">${sanitizeHtml(targetPath)}</code>
    </div>
  `
      : ''
  }
</div>
`.trim()
}

export const ScopeSelector = renderScopeSelector

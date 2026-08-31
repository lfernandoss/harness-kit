import type { SettingsDiagnostic } from '../../types/settings.types.js'
import { sanitizeHtml } from '../../utils/ansiParser.js'

export interface RawJsonEditorProps {
  jsonString: string
  diagnostics?: SettingsDiagnostic
  isReadOnly?: boolean
}

export function renderRawJsonEditor(props: RawJsonEditorProps): string {
  const jsonString = props.jsonString || '{}'
  const isReadOnly = Boolean(props.isReadOnly)
  const diagnostics = props.diagnostics || { valid: true, errors: [] }
  const lines = jsonString.split('\n')

  const lineNumbersHtml = lines
    .map((_, idx) => `<span class="line-number">${idx + 1}</span>`)
    .join('\n')

  const errorBannerHtml = !diagnostics.valid
    ? `
    <div class="json-diagnostic-banner" role="alert">
      <div class="diagnostic-header">
        <span class="diagnostic-icon" aria-hidden="true">⚠️</span>
        <span class="diagnostic-title">Schema &amp; Syntax Errors (${diagnostics.errors.length})</span>
      </div>
      <ul class="diagnostic-error-list">
        ${diagnostics.errors
          .map(
            (err) => `
          <li class="diagnostic-error-item">
            ${err.path ? `<code class="error-path">${sanitizeHtml(err.path)}</code>: ` : ''}
            <span class="error-message">${sanitizeHtml(err.message)}</span>
            ${err.line ? `<span class="error-line">(Line ${err.line})</span>` : ''}
          </li>
        `
          )
          .join('\n')}
      </ul>
    </div>
  `
    : ''

  return `
<div class="raw-json-editor-wrapper">
  ${errorBannerHtml}

  <div class="raw-json-editor" id="raw-json-editor">
    <div class="editor-toolbar">
      <span class="toolbar-title">Raw JSON Editor</span>
      <div class="toolbar-actions">
        <button type="button" class="btn btn-sm btn-secondary btn-format-json" title="Format and indent JSON">
          ✨ Prettify JSON
        </button>
      </div>
    </div>

    <div class="editor-body">
      <div class="line-numbers" aria-hidden="true">
        ${lineNumbersHtml}
      </div>
      <div class="textarea-container">
        <textarea
          id="raw-json-textarea"
          class="json-editor-textarea ${!diagnostics.valid ? 'has-errors' : ''}"
          name="rawJson"
          spellcheck="false"
          wrap="off"
          aria-label="Raw settings JSON editor"
          aria-invalid="${!diagnostics.valid}"
          ${isReadOnly ? 'readonly' : ''}
        >${sanitizeHtml(jsonString)}</textarea>
      </div>
    </div>
  </div>
</div>
`.trim()
}

export const RawJsonEditor = renderRawJsonEditor

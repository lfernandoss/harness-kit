import type { HarnessSettingsMap, RunnerSettings } from '../../types/settings.types.js'
import { sanitizeHtml } from '../../utils/ansiParser.js'

export interface SettingsFormEditorProps {
  settings: HarnessSettingsMap
  isReadOnly?: boolean
}

const DEFAULT_RUNNERS = ['antigravity', 'claude', 'copilot', 'cursor', 'codex']
const DEFAULT_PHASES = [
  'bootstrap',
  'planning',
  'implementation',
  'review_tl',
  'review_adv',
  'memory',
  'diagnose',
]

const RUNNER_METAS: Record<string, { label: string; icon: string }> = {
  antigravity: { label: 'Antigravity (Google / Gemini)', icon: '🚀' },
  claude: { label: 'Claude (Anthropic)', icon: '🧠' },
  copilot: { label: 'GitHub Copilot', icon: '🤖' },
  cursor: { label: 'Cursor CLI', icon: '⚡' },
  codex: { label: 'OpenAI Codex', icon: '💡' },
  kiro: { label: 'Kiro CLI', icon: '🔧' },
}

export function renderSettingsFormEditor(props: SettingsFormEditorProps): string {
  const settings = props.settings || {}
  const isReadOnly = Boolean(props.isReadOnly)

  const runnerKeys = Array.from(
    new Set([...DEFAULT_RUNNERS, ...Object.keys(settings)])
  )

  const cardsHtml = runnerKeys
    .map((runnerKey) => {
      const runnerCfg: RunnerSettings = settings[runnerKey] || {}
      const meta = RUNNER_METAS[runnerKey] || { label: runnerKey, icon: '⚙️' }
      const timeoutMs = runnerCfg.timeoutMs !== undefined ? runnerCfg.timeoutMs : 1800000
      const phases = runnerCfg.phases || {}

      const phaseKeys = Array.from(
        new Set([...DEFAULT_PHASES, ...Object.keys(phases)])
      )

      const phaseRowsHtml = phaseKeys
        .map((phaseKey) => {
          const p = phases[phaseKey] || {}
          const model = p.model || ''
          const effort = p.effort || ''
          const phaseTimeout = p.timeoutMs !== undefined ? p.timeoutMs : ''

          return `
        <tr class="phase-override-row phase-row-${sanitizeHtml(runnerKey)}-${sanitizeHtml(phaseKey)}">
          <td class="phase-name-cell">
            <code>${sanitizeHtml(phaseKey)}</code>
          </td>
          <td class="phase-model-cell">
            <input
              type="text"
              name="phase-model-${sanitizeHtml(runnerKey)}-${sanitizeHtml(phaseKey)}"
              data-runner="${sanitizeHtml(runnerKey)}"
              data-phase="${sanitizeHtml(phaseKey)}"
              data-field="model"
              class="form-input phase-input-model"
              value="${sanitizeHtml(model)}"
              placeholder="inherit default"
              ${isReadOnly ? 'disabled' : ''}
            />
          </td>
          <td class="phase-effort-cell">
            <select
              name="phase-effort-${sanitizeHtml(runnerKey)}-${sanitizeHtml(phaseKey)}"
              data-runner="${sanitizeHtml(runnerKey)}"
              data-phase="${sanitizeHtml(phaseKey)}"
              data-field="effort"
              class="form-select phase-select-effort"
              ${isReadOnly ? 'disabled' : ''}
            >
              <option value="" ${effort === '' ? 'selected' : ''}>(default)</option>
              <option value="low" ${effort === 'low' ? 'selected' : ''}>low</option>
              <option value="medium" ${effort === 'medium' ? 'selected' : ''}>medium</option>
              <option value="high" ${effort === 'high' ? 'selected' : ''}>high</option>
              <option value="xhigh" ${effort === 'xhigh' ? 'selected' : ''}>xhigh</option>
            </select>
          </td>
          <td class="phase-timeout-cell">
            <input
              type="number"
              min="1000"
              step="1000"
              name="phase-timeout-${sanitizeHtml(runnerKey)}-${sanitizeHtml(phaseKey)}"
              data-runner="${sanitizeHtml(runnerKey)}"
              data-phase="${sanitizeHtml(phaseKey)}"
              data-field="timeoutMs"
              class="form-input phase-input-timeout"
              value="${sanitizeHtml(String(phaseTimeout))}"
              placeholder="${timeoutMs}"
              ${isReadOnly ? 'disabled' : ''}
            />
          </td>
        </tr>
      `
        })
        .join('\n')

      return `
      <section class="runner-config-card runner-card-${sanitizeHtml(runnerKey)}" id="runner-card-${sanitizeHtml(runnerKey)}">
        <header class="runner-card-header">
          <div class="runner-identity">
            <span class="runner-icon" aria-hidden="true">${meta.icon}</span>
            <div class="runner-title-wrap">
              <h3 class="runner-title">${sanitizeHtml(meta.label)}</h3>
              <code class="runner-key">${sanitizeHtml(runnerKey)}</code>
            </div>
          </div>

          <div class="runner-base-timeout">
            <label for="runner-timeout-${sanitizeHtml(runnerKey)}" class="form-label">Base Timeout (ms):</label>
            <input
              id="runner-timeout-${sanitizeHtml(runnerKey)}"
              type="number"
              min="1000"
              step="1000"
              name="runner-timeout-${sanitizeHtml(runnerKey)}"
              data-runner="${sanitizeHtml(runnerKey)}"
              data-field="baseTimeoutMs"
              class="form-input input-base-timeout"
              value="${sanitizeHtml(String(timeoutMs))}"
              ${isReadOnly ? 'disabled' : ''}
            />
          </div>
        </header>

        <div class="runner-phases-section">
          <h4 class="phases-title">Per-Phase Model &amp; Timeout Overrides</h4>
          <div class="table-responsive">
            <table class="phases-override-table">
              <thead>
                <tr>
                  <th scope="col">Phase</th>
                  <th scope="col">Model Override</th>
                  <th scope="col">Effort</th>
                  <th scope="col">Timeout Override (ms)</th>
                </tr>
              </thead>
              <tbody>
                ${phaseRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `
    })
    .join('\n')

  return `
<form class="settings-form-editor" id="settings-form-editor" onsubmit="return false;">
  <div class="runner-cards-list">
    ${cardsHtml}
  </div>
</form>
`.trim()
}

export const SettingsFormEditor = renderSettingsFormEditor

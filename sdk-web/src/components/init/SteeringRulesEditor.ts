import type {
  PhaseSteeringKey,
  SteeringRulesPayload,
} from '../../types/index.js'

export interface PhaseInfo {
  readonly key: PhaseSteeringKey
  readonly label: string
  readonly description: string
}

export const PHASES: readonly PhaseInfo[] = [
  { key: 'user', label: 'Global (User)', description: 'Directives applied across all orchestration phases' },
  { key: 'bootstrap', label: 'Bootstrap', description: 'Project initialization & backlog generation' },
  { key: 'planning', label: 'Planning', description: 'Domain tactical design & test scenario generation' },
  { key: 'implementation', label: 'Implementation', description: 'Autonomous TDD loops (RED, GREEN, REFACTOR)' },
  { key: 'review', label: 'Review', description: 'Tech Lead and Adversarial QA code reviews' },
  { key: 'memory', label: 'Memory', description: 'Project memory updates and architectural documentation' },
]

export interface SteeringRulesEditorProps {
  defaultRules?: SteeringRulesPayload
  customRules?: Partial<SteeringRulesPayload>
  activePhase?: PhaseSteeringKey
}

export function renderSteeringRulesEditor(props: SteeringRulesEditorProps): string {
  const activeKey = props.activePhase || 'user'
  const activePhaseInfo = PHASES.find((p) => p.key === activeKey) || PHASES[0]
  const defaultRules = props.defaultRules || {
    user: [],
    bootstrap: [],
    planning: [],
    implementation: [],
    review: [],
    memory: [],
  }
  const customRules = props.customRules || {}

  const activeDefaults = defaultRules[activeKey] || []
  const activeCustoms = customRules[activeKey] || []

  const tabsHtml = PHASES.map((p) => {
    const isSelected = p.key === activeKey
    const count = (defaultRules[p.key]?.length || 0) + (customRules[p.key]?.length || 0)
    return `
      <button
        type="button"
        role="tab"
        class="phase-tab ${isSelected ? 'active' : ''}"
        data-phase="${p.key}"
        aria-selected="${isSelected}"
        aria-controls="panel-${p.key}"
        id="tab-${p.key}"
      >
        <span class="tab-label">${p.label}</span>
        ${count > 0 ? `<span class="tab-count-badge">${count}</span>` : ''}
      </button>
    `.trim()
  }).join('\n')

  const defaultRulesHtml =
    activeDefaults.length > 0
      ? `
    <div class="default-rules-section">
      <h4 class="rules-subtitle">Default Inherited Directives</h4>
      <div class="default-rules-list">
        ${activeDefaults
          .map(
            (rule) => `
          <div class="default-rule-badge">
            <span class="rule-tag">Default</span>
            <span class="rule-text">${escapeHtml(rule)}</span>
          </div>
        `
          )
          .join('\n')}
      </div>
    </div>
  `
      : ''

  const customRulesHtml =
    activeCustoms.length > 0
      ? `
    <div class="custom-rules-section">
      <h4 class="rules-subtitle">Custom Project Directives</h4>
      <ul class="custom-rules-list">
        ${activeCustoms
          .map(
            (rule, idx) => `
          <li class="custom-rule-item" data-index="${idx}">
            <span class="rule-text">${escapeHtml(rule)}</span>
            <button
              type="button"
              class="btn-remove-rule"
              data-phase="${activeKey}"
              data-index="${idx}"
              aria-label="Remove rule"
            >
              ✕
            </button>
          </li>
        `
          )
          .join('\n')}
      </ul>
    </div>
  `
      : `
    <div class="no-custom-rules">
      <p class="text-muted">No custom rules added for this phase yet.</p>
    </div>
  `

  return `
<div class="steering-rules-editor">
  <div class="editor-header">
    <h3 class="editor-title">Steering Rules Configuration</h3>
    <p class="editor-description">Configure phase-partitioned constraints and instructions for LLM agents.</p>
  </div>

  <div class="phase-tabs-container" role="tablist" aria-label="Steering Rule Phases">
    ${tabsHtml}
  </div>

  <div
    class="phase-tabpanel"
    role="tabpanel"
    id="panel-${activeKey}"
    aria-labelledby="tab-${activeKey}"
    data-phase="${activeKey}"
  >
    <div class="phase-info-banner">
      <h4 class="phase-name">${activePhaseInfo.label}</h4>
      <p class="phase-desc">${activePhaseInfo.description}</p>
    </div>

    ${defaultRulesHtml}
    ${customRulesHtml}

    <div class="add-rule-form">
      <div class="input-group">
        <input
          type="text"
          class="input-add-rule"
          data-phase="${activeKey}"
          placeholder="Add a directive or constraint for this phase..."
          aria-label="New directive for ${activePhaseInfo.label}"
        />
        <button
          type="button"
          class="btn btn-secondary btn-add-rule"
          data-phase="${activeKey}"
        >
          Add Rule
        </button>
      </div>
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

export const SteeringRulesEditor = renderSteeringRulesEditor

import { sanitizeHtml } from '../../../utils/ansiParser.js'

export interface RunnerOption {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly defaultModel?: string
  readonly models: string[]
}

export const AVAILABLE_RUNNERS: readonly RunnerOption[] = [
  {
    id: 'claude-cli',
    name: 'Claude CLI',
    description: 'Anthropic Claude Code CLI with native tool streaming',
    defaultModel: 'claude-3-7-sonnet',
    models: ['claude-3-7-sonnet', 'claude-3-5-sonnet', 'claude-3-5-haiku'],
  },
  {
    id: 'antigravity-cli',
    name: 'Antigravity CLI',
    description: 'Google Deepmind Advanced Agentic Coding CLI (agy)',
    defaultModel: 'gemini-3.7-flash',
    models: ['gemini-3.7-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  {
    id: 'cursor-cli',
    name: 'Cursor CLI',
    description: 'Cursor headless agent runner with composer support',
    defaultModel: 'claude-3-7-sonnet',
    models: ['claude-3-7-sonnet', 'gpt-5.6-sol', 'gpt-4o'],
  },
  {
    id: 'copilot-cli',
    name: 'Copilot CLI',
    description: 'GitHub Copilot Workspace CLI engine',
    defaultModel: 'gpt-5.6-sol',
    models: ['gpt-5.6-sol', 'claude-3-7-sonnet'],
  },
  {
    id: 'kiro-cli',
    name: 'Kiro CLI',
    description: 'AWS Kiro autonomous agent CLI',
    defaultModel: 'claude-3-7-sonnet',
    models: ['claude-3-7-sonnet'],
  },
]

export interface RunnerSelectorProps {
  selectedRunner?: string
  selectedModel?: string
  selectedEffort?: string
  disabled?: boolean
}

export function renderRunnerSelector(props: RunnerSelectorProps = {}): string {
  const selectedRunnerId = props.selectedRunner || 'claude-cli'
  const activeRunner =
    AVAILABLE_RUNNERS.find((r) => r.id === selectedRunnerId) || AVAILABLE_RUNNERS[0]
  const selectedModel = props.selectedModel || activeRunner.defaultModel || activeRunner.models[0]
  const selectedEffort = props.selectedEffort || 'medium'
  const isDisabled = Boolean(props.disabled)

  const runnerCardsHtml = AVAILABLE_RUNNERS.map((runner) => {
    const isSelected = runner.id === activeRunner.id
    return `
      <label class="runner-card ${isSelected ? 'selected' : ''}" data-runner="${sanitizeHtml(runner.id)}">
        <input
          type="radio"
          name="agent"
          value="${sanitizeHtml(runner.id)}"
          ${isSelected ? 'checked' : ''}
          ${isDisabled ? 'disabled' : ''}
          class="runner-radio"
        />
        <div class="runner-info">
          <div class="runner-name">${sanitizeHtml(runner.name)}</div>
          <div class="runner-desc">${sanitizeHtml(runner.description)}</div>
        </div>
      </label>
    `.trim()
  }).join('\n')

  const modelOptionsHtml = activeRunner.models
    .map((m) => {
      const isSelected = m === selectedModel
      return `<option value="${sanitizeHtml(m)}" ${isSelected ? 'selected' : ''}>${sanitizeHtml(m)}</option>`
    })
    .join('\n')

  return `
<div class="runner-selector">
  <div class="runner-cards-grid">
    ${runnerCardsHtml}
  </div>

  <div class="runner-parameters-row">
    <div class="form-group form-group-model">
      <label for="runner-model-select" class="form-label">Model</label>
      <select
        id="runner-model-select"
        name="model"
        class="form-select runner-model-select"
        ${isDisabled ? 'disabled' : ''}
      >
        ${modelOptionsHtml}
      </select>
    </div>

    <div class="form-group form-group-effort">
      <label for="runner-effort-select" class="form-label">Reasoning Effort</label>
      <select
        id="runner-effort-select"
        name="effort"
        class="form-select runner-effort-select"
        ${isDisabled ? 'disabled' : ''}
      >
        <option value="low" ${selectedEffort === 'low' ? 'selected' : ''}>Low</option>
        <option value="medium" ${selectedEffort === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="high" ${selectedEffort === 'high' ? 'selected' : ''}>High</option>
      </select>
    </div>
  </div>
</div>
`.trim()
}

export const RunnerSelector = renderRunnerSelector

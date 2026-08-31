import type { RunConfigDTO, ExecutionMode } from '../../types/index.js'
import { renderRunnerSelector, AVAILABLE_RUNNERS } from './components/RunnerSelector.js'
import { sanitizeHtml } from '../../utils/ansiParser.js'

export { AVAILABLE_RUNNERS }

export interface ModeOption {
  readonly id: ExecutionMode
  readonly name: string
  readonly description: string
}

export const AVAILABLE_MODES: readonly ModeOption[] = [
  {
    id: 'quick',
    name: 'Quick',
    description: 'Bootstrap → Planning → Development → Deploy (skips Review and Memory)',
  },
  {
    id: 'fast',
    name: 'Fast',
    description: 'All phases with complexity forced to LOW for fast iterations',
  },
  {
    id: 'thinking',
    name: 'Thinking (Default)',
    description: 'Standard autonomous loop with AUTO complexity',
  },
  {
    id: 'deep_thinking',
    name: 'Deep Thinking',
    description: 'High-rigor autonomous loops with forced HIGH reasoning depth',
  },
]

export function validateRunConfigDTO(cfg: Partial<RunConfigDTO>): RunConfigDTO {
  if (!cfg.scope || typeof cfg.scope !== 'string' || !cfg.scope.trim()) {
    throw new Error('Scope must be a non-empty string')
  }

  const validModes = new Set<string>(['quick', 'fast', 'thinking', 'deep_thinking'])
  const mode = (cfg.mode || 'thinking') as ExecutionMode
  if (!validModes.has(mode)) {
    throw new Error(`Invalid execution mode '${mode}'. Expected one of: ${Array.from(validModes).join(', ')}`)
  }

  return Object.freeze({
    scope: cfg.scope.trim(),
    mode,
    agent: cfg.agent,
    model: cfg.model,
    effort: cfg.effort,
    action: cfg.action ?? 'reset',
    projectPaths: cfg.projectPaths ? [...cfg.projectPaths] : undefined,
    project: cfg.project,
    idempotencyKey: cfg.idempotencyKey,
    skipValidation: cfg.skipValidation,
    skipMemory: cfg.skipMemory,
    skipDeploy: cfg.skipDeploy,
  })
}

export interface RunnerConfigCardProps {
  selectedRunner?: string
  selectedModel?: string
  selectedEffort?: string
  selectedMode?: ExecutionMode | string
  scope?: string
  action?: 'reset' | 'resume'
  hasExistingSession?: boolean
  isLoading?: boolean
  error?: string | null
}

export function renderRunnerConfigCard(props: RunnerConfigCardProps = {}): string {
  const selectedMode = props.selectedMode || 'thinking'
  const scope = props.scope || ''
  const action = props.action || (props.hasExistingSession ? 'resume' : 'reset')
  const isLoading = Boolean(props.isLoading)
  const error = props.error || null

  const runnerSelectorHtml = renderRunnerSelector({
    selectedRunner: props.selectedRunner,
    selectedModel: props.selectedModel,
    selectedEffort: props.selectedEffort,
    disabled: isLoading,
  })

  const modeOptionsHtml = AVAILABLE_MODES.map((mode) => {
    const isSelected = mode.id === selectedMode
    return `
      <label class="mode-card ${isSelected ? 'selected' : ''}">
        <input
          type="radio"
          name="mode"
          value="${sanitizeHtml(mode.id)}"
          ${isSelected ? 'checked' : ''}
          ${isLoading ? 'disabled' : ''}
          class="mode-radio"
        />
        <div class="mode-content">
          <span class="mode-name">${sanitizeHtml(mode.name)}</span>
          <span class="mode-desc">${sanitizeHtml(mode.description)}</span>
        </div>
      </label>
    `.trim()
  }).join('\n')

  const errorBannerHtml = error
    ? `
    <div class="config-error-banner" role="alert">
      <span class="error-icon">⚠️</span>
      <span class="error-text">${sanitizeHtml(error)}</span>
    </div>
  `
    : ''

  return `
<div class="runner-config-card">
  <div class="card-header">
    <h2 class="card-title">Launch Orchestration Execution</h2>
    <p class="card-description">Configure agent runner backend, execution mode, and scope directives.</p>
  </div>

  ${errorBannerHtml}

  <form class="runner-config-form" id="orchestrator-run-form">
    <div class="form-section">
      <h3 class="section-title">1. Agent Runner &amp; Model Selection</h3>
      ${runnerSelectorHtml}
    </div>

    <div class="form-section">
      <h3 class="section-title">2. Execution Mode</h3>
      <div class="modes-grid">
        ${modeOptionsHtml}
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">3. Session Action &amp; Scope</h3>
      
      <div class="session-action-group">
        <label class="action-toggle-label">
          <input
            type="radio"
            name="action"
            value="reset"
            ${action === 'reset' ? 'checked' : ''}
            ${isLoading ? 'disabled' : ''}
          />
          <span>Reset / New Session</span>
        </label>
        <label class="action-toggle-label">
          <input
            type="radio"
            name="action"
            value="resume"
            ${action === 'resume' ? 'checked' : ''}
            ${isLoading ? 'disabled' : ''}
          />
          <span>Resume Existing Session</span>
        </label>
      </div>

      <div class="form-group form-group-scope">
        <label for="execution-scope-input" class="form-label">Task Scope / Objective</label>
        <textarea
          id="execution-scope-input"
          name="scope"
          rows="3"
          class="form-textarea scope-input"
          placeholder="Describe the feature, bugfix, or refactoring objective to execute..."
          ${isLoading ? 'disabled' : ''}
        >${sanitizeHtml(scope)}</textarea>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="btn btn-primary btn-run-execution"
        ${isLoading ? 'disabled' : ''}
      >
        ${isLoading ? 'Starting Run...' : 'Start Execution ➔'}
      </button>
    </div>
  </form>
</div>
`.trim()
}

export const RunnerConfigCard = renderRunnerConfigCard

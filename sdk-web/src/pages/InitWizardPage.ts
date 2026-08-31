import type {
  WizardStep,
  PhaseSteeringKey,
  SteeringRulesPayload,
  WorkspaceInitStatusDTO,
  WorkspaceInitResultDTO,
} from '../types/index.js'
import { renderInitStepper } from '../components/init/InitStepper.js'
import { renderSteeringRulesEditor } from '../components/init/SteeringRulesEditor.js'
import { renderOverwriteGuardDialog } from '../components/init/OverwriteGuardDialog.js'

export interface InitWizardPageProps {
  currentStep?: WizardStep
  workspacePath?: string
  status?: WorkspaceInitStatusDTO | null
  customRules?: Partial<SteeringRulesPayload>
  activePhase?: PhaseSteeringKey
  createSettings?: boolean
  forceOverwrite?: boolean
  isLoading?: boolean
  isSubmitting?: boolean
  error?: string | null
  result?: WorkspaceInitResultDTO | null
}

export function renderInitWizardPage(props: InitWizardPageProps): string {
  const currentStep = props.currentStep || 'detection'
  const workspacePath = props.workspacePath || props.status?.workspacePath || ''
  const isSubmitting = Boolean(props.isSubmitting)
  const isLoading = Boolean(props.isLoading)
  const error = props.error || null
  const status = props.status || null
  const result = props.result || null

  const stepperHtml = renderInitStepper({ currentStep })

  const errorHtml = error
    ? `
    <div class="wizard-error-banner" role="alert">
      <span class="error-icon" aria-hidden="true">⚠️</span>
      <span class="error-message">${escapeHtml(error)}</span>
    </div>
  `
    : ''

  let contentHtml = ''

  switch (currentStep) {
    case 'detection':
      contentHtml = `
        <div class="wizard-step-card step-detection-content">
          <div class="step-header">
            <h2 class="step-title">Workspace Setup &amp; Inspection</h2>
            <p class="step-description">Configure the project directory path to inspect existing tracking files and steering rules.</p>
          </div>

          <div class="form-group">
            <label for="workspace-path-input" class="form-label">Project Directory Path</label>
            <div class="input-group">
              <input
                id="workspace-path-input"
                type="text"
                class="form-input input-workspace-path"
                value="${escapeHtml(workspacePath)}"
                placeholder="/path/to/project"
              />
              <button
                type="button"
                class="btn btn-primary btn-inspect"
                ${isLoading ? 'disabled' : ''}
              >
                ${isLoading ? 'Inspecting...' : 'Inspect Workspace'}
              </button>
            </div>
          </div>
        </div>
      `
      break

    case 'overwrite_guard':
      contentHtml = `
        <div class="wizard-step-card step-overwrite-content">
          ${renderOverwriteGuardDialog({
            isOpen: true,
            workspacePath,
          })}
        </div>
      `
      break

    case 'steering_editor':
      contentHtml = `
        <div class="wizard-step-card step-steering-content">
          ${renderSteeringRulesEditor({
            defaultRules: status?.defaultRules,
            customRules: props.customRules,
            activePhase: props.activePhase,
          })}

          <div class="wizard-navigation-footer">
            <button
              type="button"
              class="btn btn-secondary btn-wizard-prev"
            >
              Back
            </button>
            <button
              type="button"
              class="btn btn-primary btn-wizard-next"
            >
              Next: Settings
            </button>
          </div>
        </div>
      `
      break

    case 'settings_setup':
      contentHtml = `
        <div class="wizard-step-card settings-setup-content">
          <div class="step-header">
            <h2 class="step-title">Local Settings Configuration</h2>
            <p class="step-description">Configure runner presets, models, and local settings for this workspace.</p>
          </div>

          <div class="settings-card">
            <label class="settings-checkbox-label">
              <input
                type="checkbox"
                class="input-create-settings"
                ${props.createSettings ? 'checked' : ''}
              />
              <span class="checkbox-text">Generate <code>.harness-kit/settings.json</code> in this workspace</span>
            </label>
            <p class="settings-subtext">
              Provides local overrides for agent runners (Antigravity, Claude, Copilot, Cursor, Kiro), timeouts, and model parameters.
            </p>
          </div>

          <div class="wizard-navigation-footer">
            <button
              type="button"
              class="btn btn-secondary btn-wizard-prev"
            >
              Back
            </button>
            <button
              type="button"
              class="btn btn-primary btn-wizard-submit"
              ${isSubmitting ? 'disabled' : ''}
            >
              ${isSubmitting ? 'Initializing...' : 'Initialize Workspace'}
            </button>
          </div>
        </div>
      `
      break

    case 'summary':
      const files = result?.createdFiles || [
        'DEVELOPMENT-STATE.md',
        'ROADMAP.md',
        'REQUIREMENTS.md',
        'BACKLOG.md',
        'BOOTSTRAP-CONFIG.json',
      ]
      contentHtml = `
        <div class="wizard-step-card summary-step-content">
          <div class="summary-success-header">
            <div class="success-icon" aria-hidden="true">🎉</div>
            <h2 class="step-title">Workspace Initialized Successfully</h2>
            <p class="step-description">
              Harness Kit tracking files and steering configurations have been provisioned in <code>${escapeHtml(
                result?.workspacePath || workspacePath
              )}</code>.
            </p>
          </div>

          <div class="provisioned-files-card">
            <h3 class="files-title">Generated Project Artifacts</h3>
            <ul class="created-files-list">
              ${files
                .map(
                  (f) => `
                <li class="created-file-item">
                  <span class="file-icon" aria-hidden="true">📄</span>
                  <span class="file-name"><code>docs/product/${escapeHtml(f)}</code></span>
                </li>
              `
                )
                .join('\n')}
              ${
                result?.settingsPath
                  ? `
                <li class="created-file-item">
                  <span class="file-icon" aria-hidden="true">⚙️</span>
                  <span class="file-name"><code>.harness-kit/settings.json</code></span>
                </li>
              `
                  : ''
              }
            </ul>
          </div>

          <div class="summary-actions">
            <a
              href="/run"
              class="btn btn-primary btn-start-run"
            >
              Start First Orchestration Run ➔
            </a>
          </div>
        </div>
      `
      break
  }

  return `
<div class="init-wizard-page">
  ${stepperHtml}
  ${errorHtml}
  <main class="wizard-main-content">
    ${contentHtml}
  </main>
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

export const InitWizardPage = renderInitWizardPage

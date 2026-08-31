import type { WizardStep } from '../../types/index.js'

export interface StepperStepItem {
  readonly id: WizardStep
  readonly label: string
  readonly number: number
}

export const DEFAULT_STEPPER_STEPS: readonly StepperStepItem[] = [
  { id: 'detection', label: 'Workspace Detection', number: 1 },
  { id: 'steering_editor', label: 'Steering Rules', number: 2 },
  { id: 'settings_setup', label: 'Settings & Config', number: 3 },
  { id: 'summary', label: 'Ready to Run', number: 4 },
]

export interface InitStepperProps {
  currentStep: WizardStep
  steps?: readonly StepperStepItem[]
}

const STEP_PROGRESS_ORDER: Record<WizardStep, number> = {
  detection: 1,
  overwrite_guard: 1.5,
  steering_editor: 2,
  settings_setup: 3,
  summary: 4,
}

export function renderInitStepper(props: InitStepperProps): string {
  const current = props.currentStep
  const currentProgress = STEP_PROGRESS_ORDER[current] || 1
  const steps = props.steps || DEFAULT_STEPPER_STEPS

  const stepsHtml = steps
    .map((step) => {
      const stepProgress = STEP_PROGRESS_ORDER[step.id]
      const isActive =
        step.id === current || (current === 'overwrite_guard' && step.id === 'detection')
      const isCompleted = stepProgress < currentProgress && !isActive

      let stateClass = 'stepper-step-pending'
      if (isActive) stateClass = 'stepper-step-active'
      else if (isCompleted) stateClass = 'stepper-step-completed'

      return `
      <li
        class="stepper-step ${stateClass}"
        data-step="${step.id}"
        aria-current="${isActive ? 'step' : 'false'}"
      >
        <div class="step-indicator">
          <span class="step-number">${isCompleted ? '✓' : step.number}</span>
        </div>
        <div class="step-label-container">
          <span class="step-label">${escapeHtml(step.label)}</span>
        </div>
      </li>
    `.trim()
    })
    .join('\n')

  return `
<nav class="init-stepper" aria-label="Initialization Progress">
  <ol class="stepper-list">
    ${stepsHtml}
  </ol>
</nav>
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

export const InitStepper = renderInitStepper

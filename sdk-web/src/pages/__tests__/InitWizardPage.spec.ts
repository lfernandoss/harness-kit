import { describe, it, expect } from 'vitest'
import { renderInitStepper, InitStepper } from '../../components/init/InitStepper.js'
import { renderInitWizardPage, InitWizardPage } from '../InitWizardPage.js'
import type { WorkspaceInitStatusDTO, WorkspaceInitResultDTO } from '../../types/index.js'

describe('InitStepper Component', () => {
  it('should highlight active step indicator matching current WizardStep', () => {
    const html = renderInitStepper({
      currentStep: 'steering_editor',
    })

    expect(html).toContain('stepper-step-active')
    expect(html).toContain('data-step="steering_editor"')
    expect(html).toContain('aria-current="step"')
  })

  it('should display completed markers for previously passed steps', () => {
    const html = renderInitStepper({
      currentStep: 'settings_setup',
    })

    expect(html).toContain('stepper-step-completed')
    expect(html).toContain('data-step="detection"')
    expect(html).toContain('data-step="steering_editor"')
  })

  it('should provide alias export InitStepper', () => {
    expect(InitStepper).toBe(renderInitStepper)
  })
})

describe('InitWizardPage Component', () => {
  const sampleStatus: WorkspaceInitStatusDTO = {
    workspacePath: '/projects/my-app',
    hasExistingProduct: false,
    hasExistingSettings: false,
    defaultRules: {
      user: ['Global default'],
      bootstrap: [],
      planning: ['Planning default'],
      implementation: [],
      review: [],
      memory: [],
    },
  }

  const sampleResult: WorkspaceInitResultDTO = {
    success: true,
    workspacePath: '/projects/my-app',
    createdFiles: [
      'DEVELOPMENT-STATE.md',
      'ROADMAP.md',
      'REQUIREMENTS.md',
      'BACKLOG.md',
      'BOOTSTRAP-CONFIG.json',
    ],
    settingsPath: '/projects/my-app/.harness-kit/settings.json',
  }

  it('should render detection view when currentStep is detection', () => {
    const html = renderInitWizardPage({
      currentStep: 'detection',
      workspacePath: '/projects/my-app',
    })

    expect(html).toContain('init-wizard-page')
    expect(html).toContain('init-stepper')
    expect(html).toContain('step-detection-content')
    expect(html).toContain('Inspect Workspace')
    expect(html).toContain('btn-inspect')
  })

  it('should render overwrite guard dialog when currentStep is overwrite_guard', () => {
    const html = renderInitWizardPage({
      currentStep: 'overwrite_guard',
      workspacePath: '/projects/my-app',
      status: { ...sampleStatus, hasExistingProduct: true },
    })

    expect(html).toContain('overwrite-dialog')
    expect(html).toContain('Existing Workspace Detected')
    expect(html).toContain('btn-overwrite-confirm')
  })

  it('should render steering rules editor view when currentStep is steering_editor', () => {
    const html = renderInitWizardPage({
      currentStep: 'steering_editor',
      status: sampleStatus,
      activePhase: 'planning',
      customRules: {
        planning: ['TDD Red-Green'],
      },
    })

    expect(html).toContain('steering-rules-editor')
    expect(html).toContain('Planning default')
    expect(html).toContain('TDD Red-Green')
    expect(html).toContain('btn-wizard-next')
    expect(html).toContain('btn-wizard-prev')
  })

  it('should render settings setup toggle when currentStep is settings_setup', () => {
    const html = renderInitWizardPage({
      currentStep: 'settings_setup',
      status: sampleStatus,
      createSettings: true,
    })

    expect(html).toContain('settings-setup-content')
    expect(html).toContain('settings.json')
    expect(html).toContain('input-create-settings')
    expect(html).toContain('Initialize Workspace')
    expect(html).toContain('btn-wizard-submit')
  })

  it('should render summary view with created files and Start Run action on summary step', () => {
    const html = renderInitWizardPage({
      currentStep: 'summary',
      status: sampleStatus,
      result: sampleResult,
    })

    expect(html).toContain('summary-step-content')
    expect(html).toContain('Workspace Initialized Successfully')
    expect(html).toContain('DEVELOPMENT-STATE.md')
    expect(html).toContain('BOOTSTRAP-CONFIG.json')
    expect(html).toContain('btn-start-run')
    expect(html).toContain('/run')
  })

  it('should render error alert banner when error is present', () => {
    const html = renderInitWizardPage({
      currentStep: 'settings_setup',
      status: sampleStatus,
      error: 'Failed to acquire workspace lock',
    })

    expect(html).toContain('wizard-error-banner')
    expect(html).toContain('Failed to acquire workspace lock')
  })

  it('should disable submit button when isSubmitting is true', () => {
    const html = renderInitWizardPage({
      currentStep: 'settings_setup',
      status: sampleStatus,
      isSubmitting: true,
    })

    expect(html).toContain('disabled')
    expect(html).toContain('Initializing...')
  })

  it('should provide alias export InitWizardPage', () => {
    expect(InitWizardPage).toBe(renderInitWizardPage)
  })
})

import type {
  WizardStep,
  PhaseSteeringKey,
  SteeringRulesPayload,
  WorkspaceInitStatusDTO,
  InitializeWorkspaceDTO,
  WorkspaceInitResultDTO,
  IWorkspaceInitApiClient,
} from '../types/index.js'
import { WorkspaceInitApiClient } from '../services/WorkspaceInitApiClient.js'

export class WorkspaceInitStateManager {
  private _currentStep: WizardStep = 'detection'
  private _status: WorkspaceInitStatusDTO | null = null
  private _workspacePath?: string
  private _forceOverwrite = false
  private _createSettings = false
  private _customSteeringRules: Partial<SteeringRulesPayload> = {
    user: [],
    bootstrap: [],
    planning: [],
    implementation: [],
    review: [],
    memory: [],
  }
  private _isLoading = false
  private _isSubmitting = false
  private _error: string | null = null
  private _result: WorkspaceInitResultDTO | null = null

  private listeners = new Set<() => void>()

  constructor(private readonly apiClient: IWorkspaceInitApiClient = new WorkspaceInitApiClient()) {}

  get currentStep(): WizardStep {
    return this._currentStep
  }

  get status(): WorkspaceInitStatusDTO | null {
    return this._status
  }

  get workspacePath(): string | undefined {
    return this._workspacePath
  }

  get forceOverwrite(): boolean {
    return this._forceOverwrite
  }

  get createSettings(): boolean {
    return this._createSettings
  }

  get customSteeringRules(): Partial<SteeringRulesPayload> {
    return this._customSteeringRules
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get isSubmitting(): boolean {
    return this._isSubmitting
  }

  get error(): string | null {
    return this._error
  }

  get result(): WorkspaceInitResultDTO | null {
    return this._result
  }

  async loadStatus(workspacePath?: string): Promise<WorkspaceInitStatusDTO | null> {
    this._workspacePath = workspacePath
    this._isLoading = true
    this._error = null
    this.notify()

    try {
      const status = await this.apiClient.fetchStatus(workspacePath)
      this._status = status
      if (status.hasExistingProduct) {
        this._currentStep = 'overwrite_guard'
      } else {
        this._currentStep = 'steering_editor'
      }
      this._isLoading = false
      this.notify()
      return status
    } catch (err: any) {
      this._error = err.message || 'Failed to inspect workspace'
      this._isLoading = false
      this.notify()
      return null
    }
  }

  confirmOverwrite(): void {
    this._forceOverwrite = true
    this._currentStep = 'steering_editor'
    this.notify()
  }

  cancelOverwrite(): void {
    this._forceOverwrite = false
    this._currentStep = 'detection'
    this.notify()
  }

  goToStep(step: WizardStep): void {
    this._currentStep = step
    this.notify()
  }

  goToNext(): void {
    switch (this._currentStep) {
      case 'detection':
        if (this._status?.hasExistingProduct && !this._forceOverwrite) {
          this._currentStep = 'overwrite_guard'
        } else {
          this._currentStep = 'steering_editor'
        }
        break
      case 'overwrite_guard':
        this._currentStep = 'steering_editor'
        break
      case 'steering_editor':
        this._currentStep = 'settings_setup'
        break
      case 'settings_setup':
        this._currentStep = 'summary'
        break
      case 'summary':
        break
    }
    this.notify()
  }

  goToPrev(): void {
    switch (this._currentStep) {
      case 'settings_setup':
        this._currentStep = 'steering_editor'
        break
      case 'steering_editor':
        if (this._status?.hasExistingProduct) {
          this._currentStep = 'overwrite_guard'
        } else {
          this._currentStep = 'detection'
        }
        break
      case 'overwrite_guard':
        this._currentStep = 'detection'
        break
      case 'summary':
        this._currentStep = 'settings_setup'
        break
      case 'detection':
        break
    }
    this.notify()
  }

  updatePhaseRules(phase: PhaseSteeringKey, rules: string[]): void {
    this._customSteeringRules = {
      ...this._customSteeringRules,
      [phase]: [...rules],
    }
    this.notify()
  }

  addPhaseRule(phase: PhaseSteeringKey, rule: string): void {
    const trimmed = rule.trim()
    if (!trimmed) return
    const current = this._customSteeringRules[phase] || []
    this._customSteeringRules = {
      ...this._customSteeringRules,
      [phase]: [...current, trimmed],
    }
    this.notify()
  }

  removePhaseRule(phase: PhaseSteeringKey, index: number): void {
    const current = this._customSteeringRules[phase] || []
    const updated = current.filter((_, i) => i !== index)
    this._customSteeringRules = {
      ...this._customSteeringRules,
      [phase]: updated,
    }
    this.notify()
  }

  setCreateSettings(create: boolean): void {
    this._createSettings = create
    this.notify()
  }

  setForceOverwrite(force: boolean): void {
    this._forceOverwrite = force
    this.notify()
  }

  async submitInit(): Promise<WorkspaceInitResultDTO | null> {
    this._isSubmitting = true
    this._error = null
    this.notify()

    try {
      const populatedRules: Partial<SteeringRulesPayload> = {}
      for (const [key, rules] of Object.entries(this._customSteeringRules)) {
        if (Array.isArray(rules) && rules.length > 0) {
          populatedRules[key as PhaseSteeringKey] = rules
        }
      }

      const dto: InitializeWorkspaceDTO = {
        workspacePath: this._workspacePath,
        forceOverwrite: this._forceOverwrite,
        customSteeringRules: populatedRules,
        createSettings: this._createSettings,
      }

      const result = await this.apiClient.initializeWorkspace(dto)
      this._result = result
      this._isSubmitting = false
      this._currentStep = 'summary'
      this.notify()
      return result
    } catch (err: any) {
      this._error = err.message || 'Workspace initialization failed'
      this._isSubmitting = false
      this.notify()
      return null
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

let activeInitManager: WorkspaceInitStateManager | null = null

export function useWorkspaceInit(apiClient?: IWorkspaceInitApiClient): {
  readonly currentStep: WizardStep
  readonly status: WorkspaceInitStatusDTO | null
  readonly forceOverwrite: boolean
  readonly createSettings: boolean
  readonly customSteeringRules: Partial<SteeringRulesPayload>
  readonly isLoading: boolean
  readonly isSubmitting: boolean
  readonly error: string | null
  readonly result: WorkspaceInitResultDTO | null
  loadStatus(path?: string): Promise<WorkspaceInitStatusDTO | null>
  confirmOverwrite(): void
  cancelOverwrite(): void
  goToStep(step: WizardStep): void
  goToNext(): void
  goToPrev(): void
  updatePhaseRules(phase: PhaseSteeringKey, rules: string[]): void
  addPhaseRule(phase: PhaseSteeringKey, rule: string): void
  removePhaseRule(phase: PhaseSteeringKey, index: number): void
  setCreateSettings(val: boolean): void
  setForceOverwrite(val: boolean): void
  submitInit(): Promise<WorkspaceInitResultDTO | null>
  manager: WorkspaceInitStateManager
} {
  if (!activeInitManager || apiClient) {
    activeInitManager = new WorkspaceInitStateManager(apiClient)
  }

  return {
    get currentStep() {
      return activeInitManager!.currentStep
    },
    get status() {
      return activeInitManager!.status
    },
    get forceOverwrite() {
      return activeInitManager!.forceOverwrite
    },
    get createSettings() {
      return activeInitManager!.createSettings
    },
    get customSteeringRules() {
      return activeInitManager!.customSteeringRules
    },
    get isLoading() {
      return activeInitManager!.isLoading
    },
    get isSubmitting() {
      return activeInitManager!.isSubmitting
    },
    get error() {
      return activeInitManager!.error
    },
    get result() {
      return activeInitManager!.result
    },
    loadStatus: (path?: string) => activeInitManager!.loadStatus(path),
    confirmOverwrite: () => activeInitManager!.confirmOverwrite(),
    cancelOverwrite: () => activeInitManager!.cancelOverwrite(),
    goToStep: (step: WizardStep) => activeInitManager!.goToStep(step),
    goToNext: () => activeInitManager!.goToNext(),
    goToPrev: () => activeInitManager!.goToPrev(),
    updatePhaseRules: (p: PhaseSteeringKey, r: string[]) => activeInitManager!.updatePhaseRules(p, r),
    addPhaseRule: (p: PhaseSteeringKey, r: string) => activeInitManager!.addPhaseRule(p, r),
    removePhaseRule: (p: PhaseSteeringKey, idx: number) =>
      activeInitManager!.removePhaseRule(p, idx),
    setCreateSettings: (val: boolean) => activeInitManager!.setCreateSettings(val),
    setForceOverwrite: (val: boolean) => activeInitManager!.setForceOverwrite(val),
    submitInit: () => activeInitManager!.submitInit(),
    manager: activeInitManager,
  }
}

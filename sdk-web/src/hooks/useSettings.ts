import type {
  SettingsScope,
  HarnessSettingsMap,
  SettingsDiagnostic,
  ISettingsApiClient,
} from '../types/settings.types.js'
import { SettingsApiClient } from '../services/SettingsApiClient.js'
import { validateSettingsMap, validateRawJson } from '../utils/settingsValidator.js'

export type SettingsEditorMode = 'form' | 'raw'

export class SettingsStateManager {
  private _scope: SettingsScope = 'global'
  private _project?: string
  private _settings: HarnessSettingsMap = {}
  private _draft: HarnessSettingsMap = {}
  private _rawJson = '{}'
  private _targetPath = ''
  private _exists = false
  private _mode: SettingsEditorMode = 'form'
  private _isLoading = false
  private _isSaving = false
  private _isRenewing = false
  private _isDeleting = false
  private _error: string | null = null
  private _successMessage: string | null = null
  private _diagnostics: SettingsDiagnostic = { valid: true, errors: [] }

  private listeners = new Set<() => void>()

  constructor(private readonly apiClient: ISettingsApiClient = new SettingsApiClient()) {}

  get scope(): SettingsScope {
    return this._scope
  }

  get project(): string | undefined {
    return this._project
  }

  get settings(): HarnessSettingsMap {
    return this._settings
  }

  get draft(): HarnessSettingsMap {
    return this._draft
  }

  get rawJson(): string {
    return this._rawJson
  }

  get targetPath(): string {
    return this._targetPath
  }

  get exists(): boolean {
    return this._exists
  }

  get mode(): SettingsEditorMode {
    return this._mode
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get isSaving(): boolean {
    return this._isSaving
  }

  get isRenewing(): boolean {
    return this._isRenewing
  }

  get isDeleting(): boolean {
    return this._isDeleting
  }

  get error(): string | null {
    return this._error
  }

  get successMessage(): string | null {
    return this._successMessage
  }

  get diagnostics(): SettingsDiagnostic {
    return this._diagnostics
  }

  get isDirty(): boolean {
    return JSON.stringify(this._draft) !== JSON.stringify(this._settings)
  }

  async loadSettings(scope: SettingsScope = this._scope, project: string | undefined = this._project): Promise<void> {
    this._scope = scope
    this._project = project
    this._isLoading = true
    this._error = null
    this.notify()

    try {
      const payload = await this.apiClient.fetchSettings(scope, project)
      this._settings = payload.settings || {}
      this._draft = JSON.parse(JSON.stringify(this._settings))
      this._rawJson = JSON.stringify(this._draft, null, 2)
      this._targetPath = payload.targetPath || ''
      this._exists = payload.exists
      this._diagnostics = validateSettingsMap(this._draft)
      this._isLoading = false
      this.notify()
    } catch (err: any) {
      this._error = err.message || 'Failed to load settings'
      this._isLoading = false
      this.notify()
    }
  }

  async setScope(scope: SettingsScope, project?: string): Promise<void> {
    await this.loadSettings(scope, project ?? this._project)
  }

  setProject(project?: string): void {
    this._project = project
    this.notify()
  }

  setMode(mode: SettingsEditorMode): void {
    this._mode = mode
    this.notify()
  }

  updateDraft(draft: HarnessSettingsMap): void {
    this._draft = draft
    this._rawJson = JSON.stringify(draft, null, 2)
    this._diagnostics = validateSettingsMap(draft)
    this.notify()
  }

  updateRawJson(jsonText: string): void {
    this._rawJson = jsonText
    const { diagnostic, parsed } = validateRawJson(jsonText)
    this._diagnostics = diagnostic
    if (diagnostic.valid && parsed && typeof parsed === 'object') {
      this._draft = parsed
    }
    this.notify()
  }

  resetDraft(): void {
    this._draft = JSON.parse(JSON.stringify(this._settings))
    this._rawJson = JSON.stringify(this._draft, null, 2)
    this._diagnostics = validateSettingsMap(this._draft)
    this._error = null
    this.notify()
  }

  async save(): Promise<boolean> {
    if (!this._diagnostics.valid) {
      this._error = 'Cannot save invalid settings configuration'
      this.notify()
      return false
    }

    this._isSaving = true
    this._error = null
    this._successMessage = null
    this.notify()

    try {
      const payload = await this.apiClient.saveSettings(this._scope, this._draft, this._project)
      this._settings = payload.settings || this._draft
      this._draft = JSON.parse(JSON.stringify(this._settings))
      this._rawJson = JSON.stringify(this._draft, null, 2)
      this._targetPath = payload.targetPath || this._targetPath
      this._exists = true
      this._isSaving = false
      this._successMessage = 'Settings saved successfully'
      this.notify()
      return true
    } catch (err: any) {
      this._error = err.message || 'Failed to save settings'
      this._isSaving = false
      this.notify()
      return false
    }
  }

  async renew(): Promise<boolean> {
    this._isRenewing = true
    this._error = null
    this._successMessage = null
    this.notify()

    try {
      const payload = await this.apiClient.renewSettings(this._scope, this._project)
      this._settings = payload.settings || {}
      this._draft = JSON.parse(JSON.stringify(this._settings))
      this._rawJson = JSON.stringify(this._draft, null, 2)
      this._targetPath = payload.targetPath || this._targetPath
      this._exists = true
      this._diagnostics = validateSettingsMap(this._draft)
      this._isRenewing = false
      this._successMessage = 'Settings renewed to defaults'
      this.notify()
      return true
    } catch (err: any) {
      this._error = err.message || 'Failed to renew settings'
      this._isRenewing = false
      this.notify()
      return false
    }
  }

  async remove(): Promise<boolean> {
    this._isDeleting = true
    this._error = null
    this._successMessage = null
    this.notify()

    try {
      await this.apiClient.deleteSettings(this._scope, this._project)
      this._exists = false
      this._settings = {}
      this._draft = {}
      this._rawJson = '{}'
      this._diagnostics = { valid: true, errors: [] }
      this._isDeleting = false
      this._successMessage = 'Settings file deleted'
      this.notify()
      return true
    } catch (err: any) {
      this._error = err.message || 'Failed to delete settings'
      this._isDeleting = false
      this.notify()
      return false
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

let activeSettingsManager: SettingsStateManager | null = null

export function useSettings(apiClient?: ISettingsApiClient): {
  readonly scope: SettingsScope
  readonly project: string | undefined
  readonly settings: HarnessSettingsMap
  readonly draft: HarnessSettingsMap
  readonly rawJson: string
  readonly targetPath: string
  readonly exists: boolean
  readonly mode: SettingsEditorMode
  readonly isDirty: boolean
  readonly diagnostics: SettingsDiagnostic
  readonly isLoading: boolean
  readonly isSaving: boolean
  readonly isRenewing: boolean
  readonly isDeleting: boolean
  readonly error: string | null
  readonly successMessage: string | null
  loadSettings(scope?: SettingsScope, project?: string): Promise<void>
  setScope(scope: SettingsScope, project?: string): Promise<void>
  setProject(project?: string): void
  setMode(mode: SettingsEditorMode): void
  updateDraft(draft: HarnessSettingsMap): void
  updateRawJson(text: string): void
  resetDraft(): void
  save(): Promise<boolean>
  renew(): Promise<boolean>
  remove(): Promise<boolean>
  manager: SettingsStateManager
} {
  if (!activeSettingsManager || apiClient) {
    activeSettingsManager = new SettingsStateManager(apiClient)
  }

  return {
    get scope() {
      return activeSettingsManager!.scope
    },
    get project() {
      return activeSettingsManager!.project
    },
    get settings() {
      return activeSettingsManager!.settings
    },
    get draft() {
      return activeSettingsManager!.draft
    },
    get rawJson() {
      return activeSettingsManager!.rawJson
    },
    get targetPath() {
      return activeSettingsManager!.targetPath
    },
    get exists() {
      return activeSettingsManager!.exists
    },
    get mode() {
      return activeSettingsManager!.mode
    },
    get isDirty() {
      return activeSettingsManager!.isDirty
    },
    get diagnostics() {
      return activeSettingsManager!.diagnostics
    },
    get isLoading() {
      return activeSettingsManager!.isLoading
    },
    get isSaving() {
      return activeSettingsManager!.isSaving
    },
    get isRenewing() {
      return activeSettingsManager!.isRenewing
    },
    get isDeleting() {
      return activeSettingsManager!.isDeleting
    },
    get error() {
      return activeSettingsManager!.error
    },
    get successMessage() {
      return activeSettingsManager!.successMessage
    },
    loadSettings: (s, p) => activeSettingsManager!.loadSettings(s, p),
    setScope: (s, p) => activeSettingsManager!.setScope(s, p),
    setProject: (p) => activeSettingsManager!.setProject(p),
    setMode: (m) => activeSettingsManager!.setMode(m),
    updateDraft: (d) => activeSettingsManager!.updateDraft(d),
    updateRawJson: (t) => activeSettingsManager!.updateRawJson(t),
    resetDraft: () => activeSettingsManager!.resetDraft(),
    save: () => activeSettingsManager!.save(),
    renew: () => activeSettingsManager!.renew(),
    remove: () => activeSettingsManager!.remove(),
    manager: activeSettingsManager,
  }
}

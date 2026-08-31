export type SettingsScope = 'global' | 'local'

export const isSettingsScope = (v: unknown): v is SettingsScope => v === 'global' || v === 'local'

export interface PhaseSettings {
  readonly model?: string
  readonly effort?: string
  readonly timeoutMs?: number
}

export interface RunnerSettings {
  readonly timeoutMs?: number
  readonly phases?: Record<string, PhaseSettings>
}

export type HarnessSettingsMap = Record<string, RunnerSettings>

export interface DiagnosticError {
  readonly path: string
  readonly message: string
  readonly line?: number
}

export interface SettingsDiagnostic {
  readonly valid: boolean
  readonly errors: ReadonlyArray<DiagnosticError>
}

export interface SettingsApiPayload {
  readonly scope: SettingsScope
  readonly targetPath: string
  readonly exists: boolean
  readonly settings: HarnessSettingsMap
  readonly project?: string
  readonly agent?: string
}

export interface ISettingsApiClient {
  fetchSettings(scope: SettingsScope, project?: string): Promise<SettingsApiPayload>
  saveSettings(scope: SettingsScope, settings: HarnessSettingsMap, project?: string): Promise<SettingsApiPayload>
  renewSettings(scope: SettingsScope, project?: string): Promise<SettingsApiPayload>
  deleteSettings(scope: SettingsScope, project?: string): Promise<void>
  validateSettings(data: unknown): Promise<SettingsDiagnostic>
}

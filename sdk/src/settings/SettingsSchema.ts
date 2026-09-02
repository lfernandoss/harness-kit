export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh'

export interface PhaseSettings {
  model?: string
  effort?: EffortLevel | string
  timeoutMs?: number
}

export interface RunnerSettings {
  defaultModel?: string
  defaultEffort?: EffortLevel | string
  timeoutMs?: number
  phases?: Record<string, PhaseSettings>
}

export type HarnessSettingsMap = Record<string, RunnerSettings>

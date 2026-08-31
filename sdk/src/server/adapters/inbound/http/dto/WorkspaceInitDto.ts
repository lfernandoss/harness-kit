export type PhaseSteeringKey = 'user' | 'bootstrap' | 'planning' | 'implementation' | 'review' | 'memory'

export const VALID_PHASE_STEERING_KEYS: readonly PhaseSteeringKey[] = Object.freeze([
  'user',
  'bootstrap',
  'planning',
  'implementation',
  'review',
  'memory',
])

export function isValidPhaseSteeringKey(val: unknown): val is PhaseSteeringKey {
  return typeof val === 'string' && VALID_PHASE_STEERING_KEYS.includes(val as PhaseSteeringKey)
}

export type SteeringRulesPayload = Record<PhaseSteeringKey, string[]>

export function validateSteeringRulesPayload(
  raw?: Partial<Record<string, unknown>>
): SteeringRulesPayload {
  const result: SteeringRulesPayload = {
    user: [],
    bootstrap: [],
    planning: [],
    implementation: [],
    review: [],
    memory: [],
  }

  if (!raw || typeof raw !== 'object') {
    return result
  }

  for (const key of VALID_PHASE_STEERING_KEYS) {
    const arr = (raw as Record<string, unknown>)[key]
    if (Array.isArray(arr)) {
      result[key] = arr
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    }
  }

  return result
}

export function compileSteeringRules(
  defaults: SteeringRulesPayload,
  custom?: Partial<SteeringRulesPayload>
): SteeringRulesPayload {
  const compiled: SteeringRulesPayload = {
    user: [],
    bootstrap: [],
    planning: [],
    implementation: [],
    review: [],
    memory: [],
  }

  for (const key of VALID_PHASE_STEERING_KEYS) {
    const defaultList = Array.isArray(defaults[key]) ? defaults[key] : []
    const customList = custom && Array.isArray(custom[key]) ? custom[key]! : []

    const merged = [...defaultList]
    for (const rule of customList) {
      const trimmed = typeof rule === 'string' ? rule.trim() : ''
      if (trimmed.length > 0 && !merged.includes(trimmed)) {
        merged.push(trimmed)
      }
    }
    compiled[key] = merged
  }

  return compiled
}

export interface WorkspaceInitStatusDTO {
  readonly workspacePath: string
  readonly hasExistingProduct: boolean
  readonly hasExistingSettings: boolean
  readonly defaultRules: SteeringRulesPayload
}

export interface InitializeWorkspaceDTO {
  readonly workspacePath?: string
  readonly forceOverwrite?: boolean
  readonly customSteeringRules?: Partial<SteeringRulesPayload>
  readonly createSettings?: boolean
}

export interface WorkspaceInitResultDTO {
  readonly success: boolean
  readonly workspacePath: string
  readonly createdFiles: string[]
  readonly settingsPath?: string
}

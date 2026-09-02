import type { SettingsScope } from './PathResolver'
import type { HarnessSettingsMap } from './SettingsSchema'
export { isSettingsScope } from './PathResolver'
export type { SettingsScope }

export interface DiagnosticError {
  path: string
  message: string
  line?: number
}

export interface SettingsDiagnostic {
  readonly valid: boolean
  readonly errors: ReadonlyArray<DiagnosticError>
}

const MODEL_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/
const VALID_EFFORTS = new Set(['low', 'medium', 'high', 'xhigh'])

export class SettingsValidator {
  static validateModel(model?: string): void {
    if (model === undefined || model === '') return
    if (!MODEL_REGEX.test(model)) {
      throw new Error(`Invalid model identifier: '${model}'. Must match regex ^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$ and not start with '-' or contain whitespace/shell metacharacters.`)
    }
  }

  static validateEffort(effort?: string): void {
    if (effort === undefined || effort === '') return
    if (!VALID_EFFORTS.has(effort)) {
      throw new Error(`Invalid effort level: '${effort}'. Allowed values are: ${Array.from(VALID_EFFORTS).join(', ')}`)
    }
  }

  static validateMap(data: unknown): SettingsDiagnostic {
    return validateSettingsMap(data)
  }

  static validate(data: unknown): HarnessSettingsMap {
    const diagnostic = validateSettingsMap(data)
    if (!diagnostic.valid) {
      const msgs = diagnostic.errors.map(e => `${e.path ? e.path + ': ' : ''}${e.message}`).join('; ')
      throw new Error(`Settings validation failed: ${msgs}`)
    }
    return data as HarnessSettingsMap
  }
}

export function validateSettingsMap(data: unknown): SettingsDiagnostic {
  const errors: DiagnosticError[] = []

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Settings payload must be a JSON object' }],
    }
  }

  const map = data as Record<string, any>

  for (const [runnerKey, runnerVal] of Object.entries(map)) {
    if (typeof runnerVal !== 'object' || runnerVal === null || Array.isArray(runnerVal)) {
      errors.push({
        path: runnerKey,
        message: `Runner '${runnerKey}' configuration must be an object`,
      })
      continue
    }

    if (runnerVal.defaultModel !== undefined && runnerVal.defaultModel !== '') {
      if (typeof runnerVal.defaultModel !== 'string' || !MODEL_REGEX.test(runnerVal.defaultModel)) {
        errors.push({
          path: `${runnerKey}.defaultModel`,
          message: `Runner '${runnerKey}' defaultModel must be a valid model identifier without leading dashes or shell metacharacters`,
        })
      }
    }

    if (runnerVal.defaultEffort !== undefined && runnerVal.defaultEffort !== '') {
      if (typeof runnerVal.defaultEffort !== 'string' || !VALID_EFFORTS.has(runnerVal.defaultEffort)) {
        errors.push({
          path: `${runnerKey}.defaultEffort`,
          message: `Runner '${runnerKey}' defaultEffort must be one of: ${Array.from(VALID_EFFORTS).join(', ')}`,
        })
      }
    }

    if (runnerVal.timeoutMs !== undefined) {
      if (
        typeof runnerVal.timeoutMs !== 'number' ||
        runnerVal.timeoutMs <= 0 ||
        !Number.isFinite(runnerVal.timeoutMs)
      ) {
        errors.push({
          path: `${runnerKey}.timeoutMs`,
          message: `Runner '${runnerKey}' timeoutMs must be a positive number greater than 0`,
        })
      }
    }

    if (runnerVal.phases !== undefined) {
      if (
        typeof runnerVal.phases !== 'object' ||
        runnerVal.phases === null ||
        Array.isArray(runnerVal.phases)
      ) {
        errors.push({
          path: `${runnerKey}.phases`,
          message: `Runner '${runnerKey}' phases must be an object map`,
        })
        continue
      }

      for (const [phaseKey, phaseVal] of Object.entries(runnerVal.phases)) {
        if (typeof phaseVal !== 'object' || phaseVal === null || Array.isArray(phaseVal)) {
          errors.push({
            path: `${runnerKey}.phases.${phaseKey}`,
            message: `Phase '${phaseKey}' in runner '${runnerKey}' must be an object`,
          })
          continue
        }

        const p = phaseVal as Record<string, any>

        if (p.model !== undefined && p.model !== '') {
          if (typeof p.model !== 'string' || !MODEL_REGEX.test(p.model)) {
            errors.push({
              path: `${runnerKey}.phases.${phaseKey}.model`,
              message: `Phase '${phaseKey}' in runner '${runnerKey}' model must be a valid model identifier without leading dashes or shell metacharacters`,
            })
          }
        }

        if (p.effort !== undefined && p.effort !== '') {
          if (typeof p.effort !== 'string' || !VALID_EFFORTS.has(p.effort)) {
            errors.push({
              path: `${runnerKey}.phases.${phaseKey}.effort`,
              message: `Phase '${phaseKey}' in runner '${runnerKey}' effort must be one of: ${Array.from(VALID_EFFORTS).join(', ')}`,
            })
          }
        }

        if (p.timeoutMs !== undefined) {
          if (
            typeof p.timeoutMs !== 'number' ||
            p.timeoutMs <= 0 ||
            !Number.isFinite(p.timeoutMs)
          ) {
            errors.push({
              path: `${runnerKey}.phases.${phaseKey}.timeoutMs`,
              message: `Phase '${phaseKey}' in runner '${runnerKey}' timeoutMs must be a positive number greater than 0`,
            })
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}


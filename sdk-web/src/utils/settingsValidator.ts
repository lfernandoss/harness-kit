import type { SettingsDiagnostic, DiagnosticError } from '../types/settings.types.js'

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

export function validateRawJson(jsonString: string): {
  diagnostic: SettingsDiagnostic
  parsed: any | null
} {
  try {
    const parsed = JSON.parse(jsonString)
    const diag = validateSettingsMap(parsed)
    return {
      diagnostic: diag,
      parsed,
    }
  } catch (err: any) {
    return {
      diagnostic: {
        valid: false,
        errors: [{ path: '', message: `JSON Syntax Error: ${err.message || err}` }],
      },
      parsed: null,
    }
  }
}

import { describe, it, expect } from 'vitest'
import { isSettingsScope, validateSettingsMap } from '../SettingsValidator'
import { DEFAULT_SETTINGS } from '../DefaultSettings'

describe('SettingsValidator and Scope Validation', () => {
  describe('isSettingsScope', () => {
    it('validates global and local as valid SettingsScope', () => {
      expect(isSettingsScope('global')).toBe(true)
      expect(isSettingsScope('local')).toBe(true)
    })

    it('rejects unknown string values as invalid SettingsScope', () => {
      expect(isSettingsScope('system')).toBe(false)
      expect(isSettingsScope('temp')).toBe(false)
      expect(isSettingsScope(null)).toBe(false)
      expect(isSettingsScope(undefined)).toBe(false)
      expect(isSettingsScope(123)).toBe(false)
    })
  })

  describe('validateSettingsMap', () => {
    it('returns valid diagnostic for canonical DEFAULT_SETTINGS object', () => {
      const diagnostic = validateSettingsMap(DEFAULT_SETTINGS)
      expect(diagnostic.valid).toBe(true)
      expect(diagnostic.errors).toHaveLength(0)
    })

    it('reports error when root payload is not a valid JSON object', () => {
      expect(validateSettingsMap(null).valid).toBe(false)
      expect(validateSettingsMap([]).valid).toBe(false)
      expect(validateSettingsMap('string').valid).toBe(false)
      expect(validateSettingsMap(123).valid).toBe(false)
    })

    it('reports error when runner timeout is negative, zero or non-numeric', () => {
      const invalid = {
        antigravity: {
          timeoutMs: -500,
        },
      }
      const diagnostic = validateSettingsMap(invalid)
      expect(diagnostic.valid).toBe(false)
      expect(diagnostic.errors.some((e) => e.path.includes('antigravity.timeoutMs'))).toBe(true)

      const zeroTimeout = {
        antigravity: {
          timeoutMs: 0,
        },
      }
      expect(validateSettingsMap(zeroTimeout).valid).toBe(false)

      const nonNumeric = {
        antigravity: {
          timeoutMs: '1000' as any,
        },
      }
      expect(validateSettingsMap(nonNumeric).valid).toBe(false)
    })

    it('reports error when phase timeout is negative or non-numeric', () => {
      const invalid = {
        claude: {
          phases: {
            planning: {
              timeoutMs: -10,
            },
          },
        },
      }
      const diagnostic = validateSettingsMap(invalid)
      expect(diagnostic.valid).toBe(false)
      expect(diagnostic.errors.some((e) => e.path.includes('phases.planning.timeoutMs'))).toBe(true)
    })

    it('passes validation for custom runner keys when runner structure conforms to RunnerSettings', () => {
      const custom = {
        customRunner: {
          timeoutMs: 120000,
          phases: {
            customPhase: {
              model: 'custom-model',
              effort: 'high',
              timeoutMs: 60000,
            },
          },
        },
      }
      const diagnostic = validateSettingsMap(custom)
      expect(diagnostic.valid).toBe(true)
      expect(diagnostic.errors).toHaveLength(0)
    })
  })
})

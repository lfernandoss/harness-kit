import { describe, it, expect, vi } from 'vitest'
import {
  renderRunnerConfigCard,
  validateRunConfigDTO,
  AVAILABLE_RUNNERS,
  AVAILABLE_MODES,
} from '../RunnerConfigCard.js'
import { RunMode } from '../../../types/index.js'



describe('1.1 RunConfigDTO & 1.3 RunnerConfigCard component', () => {
  describe('RunConfigDTO validation', () => {
    it('Should validate RunConfigDTO successfully when non-empty scope and valid RunMode are provided', () => {
      const validConfig = {
        scope: 'Implement auth module',
        mode: RunMode.THINKING,
        agent: 'claude-cli',
        model: 'claude-3-7-sonnet',
        effort: 'high',
      }
      expect(() => validateRunConfigDTO(validConfig)).not.toThrow()
    })

    it('Should reject RunConfigDTO when scope is empty or contains only whitespace', () => {
      expect(() =>
        validateRunConfigDTO({
          scope: '',
          mode: RunMode.THINKING,
        })
      ).toThrow(/scope/i)

      expect(() =>
        validateRunConfigDTO({
          scope: '   \t\n  ',
          mode: RunMode.THINKING,
        })
      ).toThrow(/scope/i)
    })

    it('Should map optional runner backend, model, and effort options correctly without mutation', () => {
      const input = {
        scope: 'Test scope',
        mode: RunMode.FAST,
        agent: 'antigravity-cli',
        model: 'gemini-3.7-flash',
        effort: 'medium',
      }
      const validated = validateRunConfigDTO(input)
      expect(validated.agent).toBe('antigravity-cli')
      expect(validated.model).toBe('gemini-3.7-flash')
      expect(validated.effort).toBe('medium')
    })
  })

  describe('RunnerConfigCard rendering', () => {
    it('Should render available runner backend choices (claude-cli, antigravity-cli, cursor-cli, copilot-cli, kiro-cli)', () => {
      const html = renderRunnerConfigCard({
        selectedRunner: 'claude-cli',
        selectedMode: RunMode.THINKING,
        scope: '',
      })

      expect(html).toContain('claude-cli')
      expect(html).toContain('antigravity-cli')
      expect(html).toContain('cursor-cli')
      expect(html).toContain('copilot-cli')
      expect(html).toContain('kiro-cli')
    })

    it('Should render execution mode options (quick, fast, thinking, deep_thinking) with default selection', () => {
      const html = renderRunnerConfigCard({
        selectedRunner: 'claude-cli',
        selectedMode: RunMode.THINKING,
        scope: 'Test',
      })

      expect(html).toContain('quick')
      expect(html).toContain('fast')
      expect(html).toContain('thinking')
      expect(html).toContain('deep_thinking')
      expect(html).toContain('value="thinking"')
    })

    it('Should toggle reset vs resume mode based on existing session state', () => {
      const htmlWithResume = renderRunnerConfigCard({
        selectedRunner: 'claude-cli',
        selectedMode: RunMode.THINKING,
        scope: 'Test',
        hasExistingSession: true,
        action: 'resume',
      })

      expect(htmlWithResume).toContain('Resume Existing Session')

      const htmlWithReset = renderRunnerConfigCard({
        selectedRunner: 'claude-cli',
        selectedMode: RunMode.THINKING,
        scope: 'Test',
        hasExistingSession: false,
        action: 'reset',
      })

      expect(htmlWithReset).toContain('Reset / New Session')
    })
  })
})

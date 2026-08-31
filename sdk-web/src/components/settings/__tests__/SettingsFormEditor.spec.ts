import { describe, it, expect } from 'vitest'
import { renderScopeSelector } from '../ScopeSelector.js'
import { renderSettingsFormEditor } from '../SettingsFormEditor.js'
import { renderRawJsonEditor } from '../RawJsonEditor.js'
import type { HarnessSettingsMap } from '../../../types/settings.types.js'

describe('Settings Components', () => {
  const dummySettings: HarnessSettingsMap = {
    antigravity: {
      timeoutMs: 1800000,
      phases: {
        planning: { model: 'gemini-3.7-flash', effort: 'high', timeoutMs: 60000 },
        implementation: { model: 'gemini-3.7-flash', effort: 'medium' },
      },
    },
    claude: {
      timeoutMs: 1200000,
      phases: {
        planning: { model: 'claude-3-7-sonnet', effort: 'high' },
      },
    },
  }

  describe('ScopeSelector', () => {
    it('renders Global and Local scope tab buttons with proper aria-pressed states', () => {
      const globalHtml = renderScopeSelector({ scope: 'global' })
      expect(globalHtml).toContain('aria-pressed="true"')
      expect(globalHtml).toContain('data-scope="global"')
      expect(globalHtml).toContain('data-scope="local"')

      const localHtml = renderScopeSelector({ scope: 'local', project: 'my-project' })
      expect(localHtml).toContain('data-scope="local"')
      expect(localHtml).toContain('aria-pressed="true"')
      expect(localHtml).toContain('my-project')
    })
  })

  describe('SettingsFormEditor', () => {
    it('renders runner configuration cards for configured runners', () => {
      const html = renderSettingsFormEditor({ settings: dummySettings })
      expect(html).toContain('runner-card-antigravity')
      expect(html).toContain('runner-card-claude')
      expect(html).toContain('1800000')
      expect(html).toContain('gemini-3.7-flash')
      expect(html).toContain('claude-3-7-sonnet')
    })

    it('renders input fields for timeoutMs, model, effort, and phase overrides', () => {
      const html = renderSettingsFormEditor({ settings: dummySettings })
      expect(html).toContain('name="runner-timeout-antigravity"')
      expect(html).toContain('name="phase-model-antigravity-planning"')
      expect(html).toContain('name="phase-effort-antigravity-planning"')
      expect(html).toContain('name="phase-timeout-antigravity-planning"')
    })
  })

  describe('RawJsonEditor', () => {
    it('renders JSON editor with line numbers and editor container', () => {
      const jsonStr = JSON.stringify(dummySettings, null, 2)
      const html = renderRawJsonEditor({
        jsonString: jsonStr,
        diagnostics: { valid: true, errors: [] },
      })
      expect(html).toContain('raw-json-editor')
      expect(html).toContain('json-editor-textarea')
      expect(html).toContain('line-numbers')
      expect(html).toContain('antigravity')
    })

    it('displays inline diagnostic error list when validation fails', () => {
      const html = renderRawJsonEditor({
        jsonString: '{"antigravity": {"timeoutMs": -100}}',
        diagnostics: {
          valid: false,
          errors: [
            { path: 'antigravity.timeoutMs', message: 'timeoutMs must be greater than 0' },
          ],
        },
      })
      expect(html).toContain('diagnostic-error-item')
      expect(html).toContain('timeoutMs must be greater than 0')
    })
  })
})

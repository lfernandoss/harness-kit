import { describe, it, expect } from 'vitest'
import { renderSettingsView } from '../SettingsView.js'
import { renderSettingsConfirmModal } from '../../components/settings/SettingsConfirmModal.js'
import type { HarnessSettingsMap } from '../../types/settings.types.js'

describe('SettingsView and Modals', () => {
  const dummySettings: HarnessSettingsMap = {
    antigravity: {
      timeoutMs: 1800000,
      phases: {
        planning: { model: 'gemini-3.7-flash', effort: 'high' },
      },
    },
  }

  describe('SettingsConfirmModal', () => {
    it('renders modal title, warning description and target file path for Renew action', () => {
      const html = renderSettingsConfirmModal({
        isOpen: true,
        actionType: 'renew',
        targetPath: '/path/to/.harness-kit/settings.json',
        scope: 'local',
      })
      expect(html).toContain('settings-confirm-modal')
      expect(html).toContain('Renew Settings to Defaults')
      expect(html).toContain('/path/to/.harness-kit/settings.json')
      expect(html).toContain('btn-confirm-renew')
      expect(html).toContain('btn-cancel-modal')
    })

    it('renders modal title, warning description and target file path for Delete action', () => {
      const html = renderSettingsConfirmModal({
        isOpen: true,
        actionType: 'delete',
        targetPath: '/home/user/.config/harness-kit/settings.json',
        scope: 'global',
      })
      expect(html).toContain('Delete Settings File')
      expect(html).toContain('/home/user/.config/harness-kit/settings.json')
      expect(html).toContain('btn-confirm-delete')
    })

    it('returns empty string when isOpen is false', () => {
      const html = renderSettingsConfirmModal({
        isOpen: false,
        actionType: 'renew',
        targetPath: '/test',
        scope: 'global',
      })
      expect(html).toBe('')
    })
  })

  describe('SettingsView', () => {
    it('renders full settings layout at /settings with scope selector and form editor', () => {
      const html = renderSettingsView({
        scope: 'global',
        settings: dummySettings,
        draft: dummySettings,
        rawJson: JSON.stringify(dummySettings, null, 2),
        mode: 'form',
        isDirty: false,
        exists: true,
        targetPath: '/home/user/.config/harness-kit/settings.json',
      })

      expect(html).toContain('settings-view-page')
      expect(html).toContain('scope-tabs-nav')
      expect(html).toContain('settings-form-editor')
      expect(html).toContain('btn-save-settings')
      expect(html).toContain('btn-renew-settings')
      expect(html).toContain('btn-delete-settings')
    })

    it('renders raw JSON editor when mode is raw', () => {
      const html = renderSettingsView({
        scope: 'local',
        project: 'my-project',
        settings: dummySettings,
        draft: dummySettings,
        rawJson: JSON.stringify(dummySettings, null, 2),
        mode: 'raw',
        isDirty: true,
        exists: true,
        targetPath: '/my-project/.harness-kit/settings.json',
      })

      expect(html).toContain('raw-json-editor')
      expect(html).toContain('json-editor-textarea')
      expect(html).toContain('is-dirty')
    })

    it('renders success toast notification when successMessage is present', () => {
      const html = renderSettingsView({
        successMessage: 'Settings saved successfully',
        settings: dummySettings,
        draft: dummySettings,
      })

      expect(html).toContain('settings-toast-success')
      expect(html).toContain('Settings saved successfully')
    })

    it('renders error banner when error is present', () => {
      const html = renderSettingsView({
        error: 'Validation failed on timeoutMs',
        settings: dummySettings,
        draft: dummySettings,
      })

      expect(html).toContain('settings-error-banner')
      expect(html).toContain('Validation failed on timeoutMs')
    })

    it('renders confirmation modal when isRenewModalOpen is true', () => {
      const html = renderSettingsView({
        isRenewModalOpen: true,
        targetPath: '/path/settings.json',
        settings: dummySettings,
        draft: dummySettings,
      })

      expect(html).toContain('settings-confirm-modal')
      expect(html).toContain('Renew Settings to Defaults')
    })
  })
})

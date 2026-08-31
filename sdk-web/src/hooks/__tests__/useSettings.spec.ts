import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsStateManager, useSettings } from '../useSettings.js'
import type { ISettingsApiClient, SettingsApiPayload, HarnessSettingsMap } from '../../types/settings.types.js'

describe('useSettings and SettingsStateManager', () => {
  let mockApiClient: ISettingsApiClient

  const dummyGlobalSettings: HarnessSettingsMap = {
    antigravity: {
      timeoutMs: 1800000,
      phases: {
        planning: { model: 'gemini-3.7-flash', effort: 'high' },
      },
    },
  }

  const dummyLocalSettings: HarnessSettingsMap = {
    antigravity: {
      timeoutMs: 120000,
      phases: {
        planning: { model: 'gemini-3.7-flash', effort: 'low' },
      },
    },
  }

  beforeEach(() => {
    mockApiClient = {
      fetchSettings: vi.fn(async (scope: string): Promise<SettingsApiPayload> => ({
        scope: scope as any,
        targetPath: scope === 'global' ? '/global/settings.json' : '/local/settings.json',
        exists: true,
        settings: scope === 'global' ? dummyGlobalSettings : dummyLocalSettings,
      })),
      saveSettings: vi.fn(async (scope, settings, project): Promise<SettingsApiPayload> => ({
        scope,
        targetPath: '/saved/settings.json',
        exists: true,
        settings,
        project,
      })),
      renewSettings: vi.fn(async (scope, project): Promise<SettingsApiPayload> => ({
        scope,
        targetPath: '/renewed/settings.json',
        exists: true,
        settings: dummyGlobalSettings,
        project,
      })),
      deleteSettings: vi.fn(async () => {}),
      validateSettings: vi.fn(async () => ({ valid: true, errors: [] })),
    }
  })

  it('initializes with default global scope and loads corresponding settings', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('global')

    expect(manager.scope).toBe('global')
    expect(manager.settings.antigravity?.timeoutMs).toBe(1800000)
    expect(manager.draft.antigravity?.timeoutMs).toBe(1800000)
    expect(manager.isDirty).toBe(false)
    expect(manager.diagnostics.valid).toBe(true)
  })

  it('switches active scope to local and triggers settings fetch for local workspace', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('global')
    expect(manager.scope).toBe('global')

    await manager.setScope('local', 'backend')
    expect(manager.scope).toBe('local')
    expect(mockApiClient.fetchSettings).toHaveBeenCalledWith('local', 'backend')
    expect(manager.draft.antigravity?.timeoutMs).toBe(120000)
    expect(manager.isDirty).toBe(false)
  })

  it('marks state as isDirty = true when draft configuration is modified from original', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('global')

    expect(manager.isDirty).toBe(false)

    manager.updateDraft({
      antigravity: {
        timeoutMs: 99999,
        phases: {},
      },
    })

    expect(manager.isDirty).toBe(true)
    expect(manager.draft.antigravity?.timeoutMs).toBe(99999)
  })

  it('resets isDirty = false after successful save action', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('global')

    manager.updateDraft({
      antigravity: {
        timeoutMs: 50000,
      },
    })
    expect(manager.isDirty).toBe(true)

    await manager.save()
    expect(mockApiClient.saveSettings).toHaveBeenCalled()
    expect(manager.isDirty).toBe(false)
    expect(manager.settings.antigravity?.timeoutMs).toBe(50000)
  })

  it('synchronizes edits bidirectionally between structured form draft and raw JSON text representation', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('global')

    // Form -> Raw JSON
    manager.updateDraft({
      claude: {
        timeoutMs: 60000,
      },
    })
    const parsedRaw = JSON.parse(manager.rawJson)
    expect(parsedRaw.claude?.timeoutMs).toBe(60000)

    // Raw JSON -> Form
    const newJson = JSON.stringify({
      cursor: {
        timeoutMs: 40000,
      },
    })
    manager.updateRawJson(newJson)
    expect(manager.draft.cursor?.timeoutMs).toBe(40000)
    expect(manager.isDirty).toBe(true)
  })

  it('reports validation errors when raw JSON text contains negative timeout or invalid schema', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('global')

    manager.updateRawJson('{"antigravity":{"timeoutMs": -100}}')
    expect(manager.diagnostics.valid).toBe(false)
    expect(manager.diagnostics.errors.length).toBeGreaterThan(0)

    manager.updateRawJson('{ invalid json')
    expect(manager.diagnostics.valid).toBe(false)
  })

  it('renews settings to default and resets draft', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('local', 'backend')

    await manager.renew()
    expect(mockApiClient.renewSettings).toHaveBeenCalledWith('local', 'backend')
    expect(manager.isDirty).toBe(false)
  })

  it('removes settings file and resets state', async () => {
    const manager = new SettingsStateManager(mockApiClient)
    await manager.loadSettings('local', 'backend')

    await manager.remove()
    expect(mockApiClient.deleteSettings).toHaveBeenCalledWith('local', 'backend')
    expect(manager.exists).toBe(false)
  })
})

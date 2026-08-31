import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SettingsApiClient } from '../SettingsApiClient.js'
import type { HarnessSettingsMap } from '../../types/settings.types.js'

describe('SettingsApiClient', () => {
  let mockFetch: any
  let client: SettingsApiClient

  const dummySettings: HarnessSettingsMap = {
    antigravity: {
      timeoutMs: 1800000,
      phases: {
        planning: { model: 'gemini-3.7-flash', effort: 'high' },
      },
    },
  }

  beforeEach(() => {
    mockFetch = vi.fn()
    client = new SettingsApiClient({ baseUrl: 'http://localhost:3000', fetchFn: mockFetch })
  })

  describe('fetchSettings', () => {
    it('serializes scope and project query parameters correctly for global scope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scope: 'global',
          targetPath: '/home/user/.config/harness-kit/settings.json',
          exists: true,
          settings: dummySettings,
        }),
      })

      const result = await client.fetchSettings('global')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/orchestrator/settings?scope=global',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Accept: 'application/json' }),
        })
      )
      expect(result.scope).toBe('global')
      expect(result.settings.antigravity).toBeDefined()
    })

    it('serializes project parameter for local scope', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scope: 'local',
          targetPath: '/projects/backend/.harness-kit/settings.json',
          exists: true,
          settings: dummySettings,
        }),
      })

      const result = await client.fetchSettings('local', 'backend')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/orchestrator/settings?scope=local&project=backend',
        expect.objectContaining({ method: 'GET' })
      )
      expect(result.scope).toBe('local')
    })

    it('throws error when server responds with 400 or error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Missing project parameter', code: 'MISSING_PROJECT_IDENTIFIER' }),
      })

      await expect(client.fetchSettings('local')).rejects.toThrow('Missing project parameter')
    })
  })

  describe('saveSettings', () => {
    it('sends POST /orchestrator/settings with scope, project and settings map', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scope: 'local',
          targetPath: '/projects/backend/.harness-kit/settings.json',
          exists: true,
          settings: dummySettings,
        }),
      })

      const result = await client.saveSettings('local', dummySettings, 'backend')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/orchestrator/settings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            scope: 'local',
            project: 'backend',
            settings: dummySettings,
          }),
        })
      )
      expect(result.settings).toBeDefined()
    })
  })

  describe('renewSettings', () => {
    it('sends POST /orchestrator/settings/renew with scope and project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scope: 'global',
          targetPath: '/home/user/.config/harness-kit/settings.json',
          exists: true,
          settings: dummySettings,
        }),
      })

      const result = await client.renewSettings('global')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/orchestrator/settings/renew',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ scope: 'global', project: undefined }),
        })
      )
      expect(result.exists).toBe(true)
    })
  })

  describe('deleteSettings', () => {
    it('sends DELETE /orchestrator/settings with scope and project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, targetPath: '/target', scope: 'local' }),
      })

      await client.deleteSettings('local', 'backend')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/orchestrator/settings',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ scope: 'local', project: 'backend' }),
        })
      )
    })
  })

  describe('validateSettings', () => {
    it('sends POST /orchestrator/settings/validate and returns diagnostic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, errors: [] }),
      })

      const result = await client.validateSettings(dummySettings)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/orchestrator/settings/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ settings: dummySettings }),
        })
      )
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })
})

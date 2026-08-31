import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { GetSettingsUseCase } from '../GetSettingsUseCase'
import { UpdateSettingsUseCase } from '../UpdateSettingsUseCase'
import { HttpServerError } from '../../../domain/types'

describe('Settings Use Cases (Local Project Mode & Mandatory Identifier Rule)', () => {
  const testWorkspaceDir = join(process.cwd(), 'tests', '.temp', 'settings-use-case-test')
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.PROJECT_MAPPINGS
    delete process.env.PROJECT_BACKEND_PATH

    if (existsSync(testWorkspaceDir)) {
      rmSync(testWorkspaceDir, { recursive: true, force: true })
    }
    mkdirSync(testWorkspaceDir, { recursive: true })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    if (existsSync(testWorkspaceDir)) {
      rmSync(testWorkspaceDir, { recursive: true, force: true })
    }
  })

  describe('GetSettingsUseCase', () => {
    it('resolves registered project identifier from environment mapping and loads local .harness-kit/settings.json', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const useCase = new GetSettingsUseCase()
      const result = await useCase.execute('backend')

      expect(result.project).toBe('backend')
      expect(result.settings).toBeDefined()

      const settingsFilePath = join(testWorkspaceDir, '.harness-kit', 'settings.json')
      expect(existsSync(settingsFilePath)).toBe(true)
    })

    it('accepts short agent name "antigravity" and filters settings', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const useCase = new GetSettingsUseCase()
      const result = await useCase.execute('backend', 'antigravity')

      expect(result.project).toBe('backend')
      expect(result.agent).toBe('antigravity')
      expect(result.settings['antigravity']).toBeDefined()
    })

    it('throws HttpServerError(400, MISSING_PROJECT_IDENTIFIER) when project parameter is omitted', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const useCase = new GetSettingsUseCase()
      await expect(useCase.execute()).rejects.toThrowError(HttpServerError)
    })

    it('throws HttpServerError(400, PROJECT_NOT_FOUND) when project identifier is not registered in environment', async () => {
      const useCase = new GetSettingsUseCase()
      await expect(useCase.execute('unregistered-project')).rejects.toThrowError(HttpServerError)
    })
  })

  describe('UpdateSettingsUseCase', () => {
    it('resolves project identifier and updates .harness-kit/settings.json file with flat format', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const payload = {
        project: 'backend',
        agent: 'claude-sdk',
        timeoutMs: 90000,
        phases: ['planning'],
        model: 'anthropic.claude-5-sonnet',
        effort: 'high',
      }

      const result = await updateUseCase.execute(payload)
      expect(result.project).toBe('backend')
      expect(result.agent).toBe('claude-sdk')
      expect(result.settings['claude']?.timeoutMs).toBe(90000)
      expect(result.settings['claude']?.phases?.planning?.model).toBe('anthropic.claude-5-sonnet')
      expect(result.settings['claude']?.phases?.planning?.effort).toBe('high')

      const settingsFilePath = join(testWorkspaceDir, '.harness-kit', 'settings.json')
      const fileContent = JSON.parse(readFileSync(settingsFilePath, 'utf-8'))
      expect(fileContent['claude']?.timeoutMs).toBe(90000)
      expect(fileContent['claude']?.phases?.planning?.model).toBe('anthropic.claude-5-sonnet')
    })

    it('throws HttpServerError(400, MISSING_AGENT_PARAMETER) when agent parameter is omitted', async () => {
      const updateUseCase = new UpdateSettingsUseCase()
      await expect(updateUseCase.execute({ project: 'backend' })).rejects.toThrowError(HttpServerError)
    })

    it('successfully accepts short agent name "antigravity" and flat settings payload', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const payload = {
        project: 'backend',
        agent: 'antigravity',
        timeoutMs: 1800000,
        phases: ['bootstrap', 'planning', 'implementation', 'review_tl', 'review_adv', 'memory'],
        model: 'gemini-3.1-flash-lite',
        effort: 'high',
      }

      const result = await updateUseCase.execute(payload)
      expect(result.project).toBe('backend')
      expect(result.agent).toBe('antigravity')
      expect(result.settings['antigravity']?.timeoutMs).toBe(1800000)
      expect(result.settings['antigravity']?.phases?.bootstrap?.model).toBe('gemini-3.1-flash-lite')
      expect(result.settings['antigravity']?.phases?.bootstrap?.effort).toBe('high')

      const settingsFilePath = join(testWorkspaceDir, '.harness-kit', 'settings.json')
      const fileContent = JSON.parse(readFileSync(settingsFilePath, 'utf-8'))
      expect(fileContent['antigravity']?.phases?.bootstrap?.model).toBe('gemini-3.1-flash-lite')
      expect(fileContent['antigravity']?.phases?.memory?.effort).toBe('high')
    })

    it('supports simplified flat batch phase updates with model, effort, timeoutMs, and phases array', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const flatPayload = {
        project: 'backend',
        agent: 'antigravity',
        timeoutMs: 1800000,
        phases: ['bootstrap', 'planning'],
        model: 'gemini-3.1-flash-lite',
        effort: 'high',
      }

      const result = await updateUseCase.execute(flatPayload)
      expect(result.project).toBe('backend')
      expect(result.agent).toBe('antigravity')
      expect(result.settings['antigravity']?.timeoutMs).toBe(1800000)
      expect(result.settings['antigravity']?.phases?.bootstrap?.model).toBe('gemini-3.1-flash-lite')
      expect(result.settings['antigravity']?.phases?.bootstrap?.effort).toBe('high')
      expect(result.settings['antigravity']?.phases?.planning?.model).toBe('gemini-3.1-flash-lite')
      expect(result.settings['antigravity']?.phases?.planning?.effort).toBe('high')

      const settingsFilePath = join(testWorkspaceDir, '.harness-kit', 'settings.json')
      const fileContent = JSON.parse(readFileSync(settingsFilePath, 'utf-8'))
      expect(fileContent['antigravity']?.phases?.bootstrap?.model).toBe('gemini-3.1-flash-lite')
    })

    it('uses defaults for model and effort when omitted in simplified flat batch payload', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const flatPayload = {
        project: 'backend',
        agent: 'antigravity',
        phases: ['bootstrap', 'planning'],
      }

      const result = await updateUseCase.execute(flatPayload)
      expect(result.project).toBe('backend')
      expect(result.settings['antigravity']?.phases?.bootstrap?.model).toBe('gemini-3.7-flash')
      expect(result.settings['antigravity']?.phases?.planning?.model).toBe('gemini-3.7-flash')
    })

    it('supports piped string in phases array (e.g. ["bootstrap|planning"])', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const flatPayload = {
        project: 'backend',
        agent: 'antigravity',
        phases: ['bootstrap|planning|implementation'],
        model: 'gemini-3.1-flash-lite',
      }

      const result = await updateUseCase.execute(flatPayload)
      expect(result.settings['antigravity']?.phases?.bootstrap?.model).toBe('gemini-3.1-flash-lite')
      expect(result.settings['antigravity']?.phases?.planning?.model).toBe('gemini-3.1-flash-lite')
      expect(result.settings['antigravity']?.phases?.implementation?.model).toBe('gemini-3.1-flash-lite')
    })

    it('throws HttpServerError(400, INVALID_AGENT) when agent is invalid or unsupported', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const flatPayload = {
        project: 'backend',
        agent: 'invalid-agent',
        phases: ['bootstrap'],
      }

      await expect(updateUseCase.execute(flatPayload)).rejects.toThrowError(HttpServerError)
    })

    it('throws HttpServerError(400, INVALID_TIMEOUT_MS) when timeoutMs is 0 or negative', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      const zeroPayload = {
        project: 'backend',
        agent: 'antigravity',
        timeoutMs: 0,
      }
      const negativePayload = {
        project: 'backend',
        agent: 'antigravity',
        timeoutMs: -100,
      }

      await expect(updateUseCase.execute(zeroPayload)).rejects.toThrowError(HttpServerError)
      await expect(updateUseCase.execute(negativePayload)).rejects.toThrowError(HttpServerError)

      try {
        await updateUseCase.execute(zeroPayload)
      } catch (err: any) {
        expect(err.code).toBe('INVALID_TIMEOUT_MS')
        expect(err.statusCode).toBe(400)
      }
    })

    it('resets timeoutMs to default (1800000) when timeoutMs is omitted in request body', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const updateUseCase = new UpdateSettingsUseCase()
      // First update with custom timeoutMs
      await updateUseCase.execute({
        project: 'backend',
        agent: 'antigravity',
        timeoutMs: 45000,
        phases: ['bootstrap'],
      })

      // Second update omitting timeoutMs
      const flatPayload = {
        project: 'backend',
        agent: 'antigravity',
        phases: ['bootstrap'],
        model: 'string',
        effort: 'string',
      }

      const result = await updateUseCase.execute(flatPayload)
      expect(result.settings['antigravity']?.timeoutMs).toBe(1800000)

      const settingsFilePath = join(testWorkspaceDir, '.harness-kit', 'settings.json')
      const fileContent = JSON.parse(readFileSync(settingsFilePath, 'utf-8'))
      expect(fileContent['antigravity']?.timeoutMs).toBe(1800000)
    })

    it('throws HttpServerError(400, MISSING_PROJECT_IDENTIFIER) when project parameter is omitted', async () => {
      const updateUseCase = new UpdateSettingsUseCase()
      await expect(updateUseCase.execute({})).rejects.toThrowError(HttpServerError)
    })
  })

  describe('Global & Local Scope Resolution', () => {
    const globalTempPath = join(testWorkspaceDir, 'global-settings.json')

    beforeEach(() => {
      process.env.HARNESS_SETTINGS_PATH = globalTempPath
    })

    it('loads global settings when scope is global', async () => {
      const useCase = new GetSettingsUseCase()
      const result = await useCase.execute(undefined, undefined, 'global')

      expect(result.scope).toBe('global')
      expect(result.targetPath).toBe(globalTempPath)
      expect(result.exists).toBe(true)
      expect(result.settings).toBeDefined()
    })

    it('loads local settings when scope is local and project is valid', async () => {
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })

      const useCase = new GetSettingsUseCase()
      const result = await useCase.execute('backend', undefined, 'local')

      expect(result.scope).toBe('local')
      expect(result.targetPath).toBe(join(testWorkspaceDir, '.harness-kit', 'settings.json'))
      expect(result.exists).toBe(true)
      expect(result.settings).toBeDefined()
    })

    it('rejects path traversal attempts in project parameter', async () => {
      const useCase = new GetSettingsUseCase({ allowedWorkspaces: [testWorkspaceDir] })
      await expect(useCase.execute('../../etc/passwd', undefined, 'local')).rejects.toThrowError(HttpServerError)
    })
  })

  describe('RenewSettingsUseCase', () => {
    const globalTempPath = join(testWorkspaceDir, 'global-renew-settings.json')

    beforeEach(() => {
      process.env.HARNESS_SETTINGS_PATH = globalTempPath
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })
    })

    it('recreates local settings.json with canonical DEFAULT_SETTINGS', async () => {
      const { RenewSettingsUseCase } = await import('../RenewSettingsUseCase.js')
      const useCase = new RenewSettingsUseCase()
      const result = await useCase.execute('local', 'backend')

      expect(result.scope).toBe('local')
      expect(result.exists).toBe(true)
      expect(result.targetPath).toBe(join(testWorkspaceDir, '.harness-kit', 'settings.json'))
      expect(result.settings).toBeDefined()
      expect(result.settings['antigravity']).toBeDefined()
    })

    it('recreates global settings.json with canonical DEFAULT_SETTINGS', async () => {
      const { RenewSettingsUseCase } = await import('../RenewSettingsUseCase.js')
      const useCase = new RenewSettingsUseCase()
      const result = await useCase.execute('global')

      expect(result.scope).toBe('global')
      expect(result.exists).toBe(true)
      expect(result.targetPath).toBe(globalTempPath)
      expect(result.settings['claude']).toBeDefined()
    })
  })

  describe('DeleteSettingsUseCase', () => {
    const globalTempPath = join(testWorkspaceDir, 'global-delete-settings.json')

    beforeEach(() => {
      process.env.HARNESS_SETTINGS_PATH = globalTempPath
      process.env.PROJECT_MAPPINGS = JSON.stringify({
        backend: testWorkspaceDir,
      })
    })

    it('deletes target local settings.json and returns success status', async () => {
      const settingsFilePath = join(testWorkspaceDir, '.harness-kit', 'settings.json')
      mkdirSync(join(testWorkspaceDir, '.harness-kit'), { recursive: true })
      writeFileSync(settingsFilePath, '{}', 'utf-8')
      expect(existsSync(settingsFilePath)).toBe(true)

      const { DeleteSettingsUseCase } = await import('../DeleteSettingsUseCase.js')
      const useCase = new DeleteSettingsUseCase()
      const result = await useCase.execute('local', 'backend')

      expect(result.success).toBe(true)
      expect(result.targetPath).toBe(settingsFilePath)
      expect(existsSync(settingsFilePath)).toBe(false)
    })

    it('handles deletion of non-existent file gracefully without throwing an exception', async () => {
      const { DeleteSettingsUseCase } = await import('../DeleteSettingsUseCase.js')
      const useCase = new DeleteSettingsUseCase()
      const result = await useCase.execute('local', 'backend')

      expect(result.success).toBe(true)
      expect(result.targetPath).toBe(join(testWorkspaceDir, '.harness-kit', 'settings.json'))
    })
  })
})


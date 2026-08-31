import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'node:path'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import {
  PhaseSteeringKey,
  isValidPhaseSteeringKey,
  compileSteeringRules,
  validateSteeringRulesPayload,
  GetWorkspaceInitStatusUseCase,
  InitializeWorkspaceUseCase,
} from '../index'
import { WorkspaceLockManager } from '../../../adapters/outbound/mutex/WorkspaceLockManager'
import { HttpServerError } from '../../../domain/types'

describe('Value Objects and Steering Rules Helpers', () => {
  describe('PhaseSteeringKey Validation', () => {
    it("should validate 'user', 'bootstrap', 'planning', 'implementation', 'review', and 'memory' as valid PhaseSteeringKey identifiers", () => {
      const validKeys: PhaseSteeringKey[] = [
        'user',
        'bootstrap',
        'planning',
        'implementation',
        'review',
        'memory',
      ]
      for (const key of validKeys) {
        expect(isValidPhaseSteeringKey(key)).toBe(true)
      }
    })

    it("should reject unsupported phase keys (e.g., 'deploy', 'testing') as invalid PhaseSteeringKey", () => {
      expect(isValidPhaseSteeringKey('deploy')).toBe(false)
      expect(isValidPhaseSteeringKey('testing')).toBe(false)
      expect(isValidPhaseSteeringKey('')).toBe(false)
      expect(isValidPhaseSteeringKey(null as any)).toBe(false)
    })
  })

  describe('SteeringRulesPayload Validation & Compilation', () => {
    it('should construct valid SteeringRulesPayload containing string arrays for each supported phase', () => {
      const raw = {
        user: ['Rule 1'],
        bootstrap: ['Rule 2'],
        planning: ['Rule 3'],
        implementation: ['Rule 4'],
        review: ['Rule 5'],
        memory: ['Rule 6'],
      }
      const validated = validateSteeringRulesPayload(raw)
      expect(validated).toEqual(raw)
    })

    it('should trim leading/trailing whitespace and filter out empty string rule entries', () => {
      const raw = {
        user: ['  Rule 1  ', '   ', ''],
        bootstrap: ['\nRule 2\t'],
        planning: [],
      }
      const validated = validateSteeringRulesPayload(raw)
      expect(validated.user).toEqual(['Rule 1'])
      expect(validated.bootstrap).toEqual(['Rule 2'])
      expect(validated.planning).toEqual([])
    })

    it('should combine default steering rules with custom steering rules for matching phases', () => {
      const defaults = {
        user: ['Default User Rule'],
        bootstrap: [],
        planning: ['Default Planning Rule'],
        implementation: [],
        review: [],
        memory: [],
      }
      const custom = {
        planning: ['Custom Planning Rule'],
        implementation: ['Custom Implementation Rule'],
      }
      const compiled = compileSteeringRules(defaults, custom)
      expect(compiled.planning).toEqual(['Default Planning Rule', 'Custom Planning Rule'])
      expect(compiled.implementation).toEqual(['Custom Implementation Rule'])
      expect(compiled.user).toEqual(['Default User Rule'])
    })

    it('should preserve default rules intact when custom rules for a phase are empty or omitted', () => {
      const defaults = {
        user: ['Default User Rule'],
        bootstrap: ['Default Bootstrap'],
        planning: ['Default Plan'],
        implementation: ['Default Impl'],
        review: ['Default Review'],
        memory: ['Default Memory'],
      }
      const compiled = compileSteeringRules(defaults, {})
      expect(compiled).toEqual(defaults)
    })

    it('should append custom rules without mutating original default rule arrays', () => {
      const defaults = {
        user: ['Default 1'],
        bootstrap: [],
        planning: [],
        implementation: [],
        review: [],
        memory: [],
      }
      const custom = {
        user: ['Custom 1'],
      }
      const compiled = compileSteeringRules(defaults, custom)
      expect(defaults.user).toEqual(['Default 1'])
      expect(compiled.user).toEqual(['Default 1', 'Custom 1'])
    })

    it('should eliminate duplicate rule entries within the same phase array', () => {
      const defaults = {
        user: ['Duplicate Rule'],
        bootstrap: [],
        planning: [],
        implementation: [],
        review: [],
        memory: [],
      }
      const custom = {
        user: ['Duplicate Rule', 'Unique Rule'],
      }
      const compiled = compileSteeringRules(defaults, custom)
      expect(compiled.user).toEqual(['Duplicate Rule', 'Unique Rule'])
    })
  })
})

describe('GetWorkspaceInitStatusUseCase', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'hrns-init-status-test-'))
  })

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  })

  it('should return hasExistingProduct: false and hasExistingSettings: false when target workspace is uninitialized', async () => {
    const useCase = new GetWorkspaceInitStatusUseCase()
    const status = await useCase.execute(tempDir)

    expect(status.hasExistingProduct).toBe(false)
    expect(status.hasExistingSettings).toBe(false)
    expect(status.workspacePath).toBe(tempDir)
    expect(status.defaultRules).toBeDefined()
    expect(status.defaultRules.planning).toBeDefined()
  })

  it('should return hasExistingProduct: true when docs/product/ directory exists in the workspace', async () => {
    mkdirSync(join(tempDir, 'docs', 'product'), { recursive: true })

    const useCase = new GetWorkspaceInitStatusUseCase()
    const status = await useCase.execute(tempDir)

    expect(status.hasExistingProduct).toBe(true)
    expect(status.hasExistingSettings).toBe(false)
  })

  it('should return hasExistingSettings: true when .harness-kit/settings.json exists in the workspace', async () => {
    mkdirSync(join(tempDir, '.harness-kit'), { recursive: true })
    writeFileSync(join(tempDir, '.harness-kit', 'settings.json'), '{}', 'utf-8')

    const useCase = new GetWorkspaceInitStatusUseCase()
    const status = await useCase.execute(tempDir)

    expect(status.hasExistingSettings).toBe(true)
  })

  it('should return pre-populated default steering rules for all six execution phases', async () => {
    const useCase = new GetWorkspaceInitStatusUseCase()
    const status = await useCase.execute(tempDir)

    expect(status.defaultRules).toHaveProperty('user')
    expect(status.defaultRules).toHaveProperty('bootstrap')
    expect(status.defaultRules).toHaveProperty('planning')
    expect(status.defaultRules).toHaveProperty('implementation')
    expect(status.defaultRules).toHaveProperty('review')
    expect(status.defaultRules).toHaveProperty('memory')
    expect(Array.isArray(status.defaultRules.planning)).toBe(true)
    expect(status.defaultRules.planning.length).toBeGreaterThan(0)
  })
})

describe('InitializeWorkspaceUseCase', () => {
  let tempDir: string
  let lockManager: WorkspaceLockManager

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'hrns-init-exec-test-'))
    lockManager = new WorkspaceLockManager()
  })

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {}
  })

  it('should initialize clean workspace with tracking files and BOOTSTRAP-CONFIG.json', async () => {
    const useCase = new InitializeWorkspaceUseCase({ lockManager })
    const result = await useCase.execute({
      workspacePath: tempDir,
      customSteeringRules: {
        implementation: ['Write pure tests first'],
      },
    })

    expect(result.success).toBe(true)
    expect(result.workspacePath).toBe(tempDir)
    expect(result.createdFiles).toContain('DEVELOPMENT-STATE.md')
    expect(result.createdFiles).toContain('ROADMAP.md')
    expect(result.createdFiles).toContain('REQUIREMENTS.md')
    expect(result.createdFiles).toContain('BACKLOG.md')
    expect(result.createdFiles).toContain('BOOTSTRAP-CONFIG.json')

    const productDir = join(tempDir, 'docs', 'product')
    expect(existsSync(join(productDir, 'DEVELOPMENT-STATE.md'))).toBe(true)
    expect(existsSync(join(productDir, 'ROADMAP.md'))).toBe(true)
    expect(existsSync(join(productDir, 'REQUIREMENTS.md'))).toBe(true)
    expect(existsSync(join(productDir, 'BACKLOG.md'))).toBe(true)
    expect(existsSync(join(productDir, 'BOOTSTRAP-CONFIG.json'))).toBe(true)

    const bootstrapRaw = readFileSync(join(productDir, 'BOOTSTRAP-CONFIG.json'), 'utf-8')
    const config = JSON.parse(bootstrapRaw)
    expect(config.steeringRules.implementation).toContain('Write pure tests first')
  })

  it('should throw ConflictError (409) when docs/product/ exists and forceOverwrite is false', async () => {
    mkdirSync(join(tempDir, 'docs', 'product'), { recursive: true })
    writeFileSync(join(tempDir, 'docs', 'product', 'DEVELOPMENT-STATE.md'), '# Existing', 'utf-8')

    const useCase = new InitializeWorkspaceUseCase({ lockManager })

    await expect(
      useCase.execute({
        workspacePath: tempDir,
        forceOverwrite: false,
      })
    ).rejects.toThrow(HttpServerError)

    try {
      await useCase.execute({ workspacePath: tempDir, forceOverwrite: false })
    } catch (err: any) {
      expect(err.statusCode).toBe(409)
      expect(err.code).toBe('CONFLICT')
    }

    // Existing file should not be modified
    expect(readFileSync(join(tempDir, 'docs', 'product', 'DEVELOPMENT-STATE.md'), 'utf-8')).toBe('# Existing')
  })

  it('should overwrite existing docs/product/ when forceOverwrite is true', async () => {
    mkdirSync(join(tempDir, 'docs', 'product'), { recursive: true })
    writeFileSync(join(tempDir, 'docs', 'product', 'OLD_FILE.txt'), 'old', 'utf-8')

    const useCase = new InitializeWorkspaceUseCase({ lockManager })
    const result = await useCase.execute({
      workspacePath: tempDir,
      forceOverwrite: true,
    })

    expect(result.success).toBe(true)
    expect(existsSync(join(tempDir, 'docs', 'product', 'OLD_FILE.txt'))).toBe(false)
    expect(existsSync(join(tempDir, 'docs', 'product', 'DEVELOPMENT-STATE.md'))).toBe(true)
  })

  it('should create .harness-kit/settings.json when createSettings is true', async () => {
    const useCase = new InitializeWorkspaceUseCase({ lockManager })
    const result = await useCase.execute({
      workspacePath: tempDir,
      createSettings: true,
    })

    expect(result.success).toBe(true)
    expect(result.settingsPath).toBeDefined()
    expect(existsSync(join(tempDir, '.harness-kit', 'settings.json'))).toBe(true)
  })

  it('should reject path traversal attempts targeting directories outside workspace boundary or non-existent directories', async () => {
    const useCase = new InitializeWorkspaceUseCase({ lockManager })

    await expect(
      useCase.execute({
        workspacePath: join(tempDir, 'non-existent-subfolder-12345/sub2/sub3'),
      })
    ).rejects.toThrow(HttpServerError)

    try {
      await useCase.execute({ workspacePath: join(tempDir, 'non-existent-subfolder-12345/sub2/sub3') })
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
    }
  })

  it('should block initialization when orchestrator execution job is currently active in workspace (423/409 Locked)', async () => {
    await lockManager.acquire(tempDir, 'job-active-123')

    const useCase = new InitializeWorkspaceUseCase({ lockManager })

    await expect(
      useCase.execute({
        workspacePath: tempDir,
      })
    ).rejects.toThrow(HttpServerError)

    try {
      await useCase.execute({ workspacePath: tempDir })
    } catch (err: any) {
      expect([409, 423]).toContain(err.statusCode)
    }
  })
})

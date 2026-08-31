import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import {
  E2ETestEnvironment,
  createEphemeralSandbox,
  DefaultSandboxFileSystemAdapter,
  createTestServerInstance,
  createMultiTabConflictResult,
  areA11yAuditResultsEqual,
  type TestEnvironmentConfig,
  type A11yAuditResult,
} from '../sandbox.js'
import { DynamicPortAllocator } from '../port-allocator.js'

describe('Ephemeral Workspace Sandbox & Dynamic Port Harness', () => {
  describe('DynamicPortAllocator', () => {
    it('should allocate an available dynamic TCP port on 127.0.0.1', async () => {
      const allocator = new DynamicPortAllocator()
      const port = await allocator.allocate()
      expect(port).toBeGreaterThan(1024)
      expect(port).toBeLessThanOrEqual(65535)
      expect(port).not.toBe(3000)
    })

    it('should allocate different ports on subsequent calls', async () => {
      const allocator = new DynamicPortAllocator()
      const port1 = await allocator.allocate()
      const port2 = await allocator.allocate()
      expect(port1).not.toBe(port2)
    })
  })

  describe('Value Objects & Invariants', () => {
    it('should instantiate TestServerInstance successfully when host is strictly 127.0.0.1 and port is valid', () => {
      const instance = createTestServerInstance({
        host: '127.0.0.1',
        port: 34567,
        baseUrl: 'http://127.0.0.1:34567',
        workspacePath: '/tmp/mock-workspace',
      })
      expect(instance.host).toBe('127.0.0.1')
      expect(instance.port).toBe(34567)
      expect(instance.baseUrl).toBe('http://127.0.0.1:34567')
    })

    it('should reject TestServerInstance when host is not 127.0.0.1', () => {
      expect(() => {
        createTestServerInstance({
          host: '0.0.0.0',
          port: 34567,
          baseUrl: 'http://0.0.0.0:34567',
          workspacePath: '/tmp/mock-workspace',
        })
      }).toThrow(/127\.0\.0\.1/)
    })

    it('should reject TestServerInstance when port is out of range', () => {
      expect(() => {
        createTestServerInstance({
          host: '127.0.0.1',
          port: -1,
          baseUrl: 'http://127.0.0.1:-1',
          workspacePath: '/tmp/mock-workspace',
        })
      }).toThrow()
    })

    it('should instantiate MultiTabConflictResult when status code is 409', () => {
      const result = createMultiTabConflictResult({
        activeJobId: 'job-123',
        rejectedStatusCode: 409,
        isLocked: true,
        conflictMessage: 'Workspace is currently locked by active run job-123',
      })
      expect(result.rejectedStatusCode).toBe(409)
      expect(result.isLocked).toBe(true)
      expect(result.activeJobId).toBe('job-123')
    })

    it('should consider two A11yAuditResult instances equal when violation counts, modes, and contrast ratios match', () => {
      const res1: A11yAuditResult = {
        violations: 0,
        passesAA: true,
        mode: 'dark',
        contrastRatio: 5.2,
      }
      const res2: A11yAuditResult = {
        violations: 0,
        passesAA: true,
        mode: 'dark',
        contrastRatio: 5.2,
      }
      const res3: A11yAuditResult = {
        violations: 1,
        passesAA: false,
        mode: 'light',
        contrastRatio: 3.1,
      }
      expect(areA11yAuditResultsEqual(res1, res2)).toBe(true)
      expect(areA11yAuditResultsEqual(res1, res3)).toBe(false)
    })
  })

  describe('createEphemeralSandbox', () => {
    let createdPath: string | null = null

    afterEach(async () => {
      if (createdPath) {
        await fs.rm(createdPath, { recursive: true, force: true }).catch(() => {})
        createdPath = null
      }
    })

    it('should return unique directory path and populate files when createEphemeralSandbox is invoked', async () => {
      createdPath = await createEphemeralSandbox('default-mock')
      expect(createdPath).toBeDefined()
      expect(path.isAbsolute(createdPath)).toBe(true)
      const stat = await fs.stat(createdPath)
      expect(stat.isDirectory()).toBe(true)
    })
  })

  describe('ISandboxFileSystemAdapter', () => {
    it('should populate and remove sandbox directory using DefaultSandboxFileSystemAdapter', async () => {
      const adapter = new DefaultSandboxFileSystemAdapter()
      const tempDir = await adapter.createTempDir('harness-adapter-test')
      expect(tempDir).toBeDefined()

      const testFile = path.join(tempDir, 'test.txt')
      await fs.writeFile(testFile, 'hello adapter', 'utf-8')
      expect(await fs.readFile(testFile, 'utf-8')).toBe('hello adapter')

      await adapter.purgeDir(tempDir)
      await expect(fs.stat(tempDir)).rejects.toThrow()
    })
  })

  describe('E2ETestEnvironment Aggregate', () => {
    it('should initialize E2ETestEnvironment successfully when valid TestEnvironmentConfig is provided', () => {
      const config: TestEnvironmentConfig = {
        timeoutMs: 30000,
        fixtureTemplate: 'default-mock',
        headless: true,
      }
      const env = new E2ETestEnvironment(config)
      expect(env.getState()).toBe('INITIALIZED')
    })

    it('should reject E2ETestEnvironment creation when timeout is non-positive', () => {
      const config: TestEnvironmentConfig = {
        timeoutMs: 0,
        fixtureTemplate: 'default-mock',
      }
      expect(() => new E2ETestEnvironment(config)).toThrow(/timeout/i)
    })

    it('should transition E2ETestEnvironment to ACTIVE when setup completes successfully', async () => {
      const config: TestEnvironmentConfig = {
        timeoutMs: 30000,
        fixtureTemplate: 'default-mock',
      }
      const env = new E2ETestEnvironment(config)
      const instance = await env.setup()

      expect(env.getState()).toBe('ACTIVE')
      expect(instance.host).toBe('127.0.0.1')
      expect(instance.port).toBeGreaterThan(1024)
      expect(instance.workspacePath).toBeDefined()
      expect(env.getEmittedEvents().some((e) => e.name === 'TestSandboxProvisioned')).toBe(true)
      expect(env.getEmittedEvents().some((e) => e.name === 'TestServerReady')).toBe(true)

      await env.teardown()
    })

    it('should transition E2ETestEnvironment to TORN_DOWN and emit TestTeardownCompleted on teardown', async () => {
      const config: TestEnvironmentConfig = {
        timeoutMs: 30000,
        fixtureTemplate: 'default-mock',
      }
      const env = new E2ETestEnvironment(config)
      await env.setup()
      await env.teardown()

      expect(env.getState()).toBe('TORN_DOWN')
      const teardownEvent = env.getEmittedEvents().find((e) => e.name === 'TestTeardownCompleted')
      expect(teardownEvent).toBeDefined()
      expect(teardownEvent?.payload.cleaned).toBe(true)
    })
  })
})

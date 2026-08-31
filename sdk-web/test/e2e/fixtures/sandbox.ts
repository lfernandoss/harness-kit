import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { DynamicPortAllocator } from './port-allocator.js'

export interface TestEnvironmentConfig {
  readonly timeoutMs: number
  readonly fixtureTemplate: string
  readonly headless?: boolean
  readonly captureScreenshots?: boolean
}

export interface TestServerInstance {
  readonly host: string
  readonly port: number
  readonly baseUrl: string
  readonly workspacePath: string
}

export interface OrchestrationRunAssertion {
  readonly expectedPhases: readonly string[]
  readonly minLogLines: number
  readonly finalStatus: 'COMPLETED' | 'HALTED' | 'FAILED'
}

export interface A11yAuditResult {
  readonly violations: number
  readonly passesAA: boolean
  readonly mode: 'light' | 'dark'
  readonly contrastRatio: number
}

export interface MultiTabConflictResult {
  readonly activeJobId: string
  readonly rejectedStatusCode: 409
  readonly isLocked: boolean
  readonly conflictMessage: string
}

export interface DomainEvent<T = any> {
  readonly name: string
  readonly payload: T
  readonly timestamp: number
}

export function createTestServerInstance(data: TestServerInstance): TestServerInstance {
  if (data.host !== '127.0.0.1') {
    throw new Error(`Security invariant violation: host must strictly be 127.0.0.1 (got: ${data.host})`)
  }
  if (!Number.isInteger(data.port) || data.port <= 0 || data.port > 65535) {
    throw new Error(`Port must be a valid integer between 1 and 65535 (got: ${data.port})`)
  }
  return Object.freeze({ ...data })
}

export function createMultiTabConflictResult(data: MultiTabConflictResult): MultiTabConflictResult {
  if (data.rejectedStatusCode !== 409) {
    throw new Error(`Expected rejectedStatusCode to be 409 (got: ${data.rejectedStatusCode})`)
  }
  return Object.freeze({ ...data })
}

export function areA11yAuditResultsEqual(a: A11yAuditResult, b: A11yAuditResult): boolean {
  return (
    a.violations === b.violations &&
    a.passesAA === b.passesAA &&
    a.mode === b.mode &&
    Math.abs(a.contrastRatio - b.contrastRatio) < 0.001
  )
}

export interface ISandboxFileSystemAdapter {
  createTempDir(prefix?: string): Promise<string>
  copyTemplate(src: string, dest: string): Promise<void>
  purgeDir(dest: string): Promise<void>
}

export class DefaultSandboxFileSystemAdapter implements ISandboxFileSystemAdapter {
  async createTempDir(prefix = 'harness-e2e-'): Promise<string> {
    const tmpBase = os.tmpdir()
    return await fs.mkdtemp(path.join(tmpBase, prefix))
  }

  async copyTemplate(src: string, dest: string): Promise<void> {
    try {
      const stats = await fs.stat(src)
      if (stats.isDirectory()) {
        await fs.cp(src, dest, { recursive: true })
        return
      }
    } catch {
      // Fallback: create mock template files directly
    }

    await fs.mkdir(path.join(dest, '.harness-kit'), { recursive: true })
    await fs.mkdir(path.join(dest, 'docs', 'product'), { recursive: true })
    await fs.mkdir(path.join(dest, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(dest, 'package.json'),
      JSON.stringify(
        {
          name: 'mock-sandbox-project',
          version: '1.0.0',
          private: true,
        },
        null,
        2
      ),
      'utf-8'
    )

    await fs.writeFile(
      path.join(dest, 'docs', 'product', 'ROADMAP.md'),
      '# Mock Roadmap\n\n- Feature 1: Core E2E Verification\n',
      'utf-8'
    )
  }

  async purgeDir(dest: string): Promise<void> {
    await fs.rm(dest, { recursive: true, force: true }).catch(() => {})
  }
}

export async function createEphemeralSandbox(
  templateName = 'default-mock',
  fsAdapter: ISandboxFileSystemAdapter = new DefaultSandboxFileSystemAdapter()
): Promise<string> {
  const sandboxPath = await fsAdapter.createTempDir(`harness-e2e-${templateName}-`)
  await fsAdapter.copyTemplate(path.join(__dirname, '..', '..', '..', 'fixtures', templateName), sandboxPath)
  return sandboxPath
}

export type E2EEnvironmentState = 'INITIALIZED' | 'ACTIVE' | 'TORN_DOWN'

export class E2ETestEnvironment {
  private state: E2EEnvironmentState = 'INITIALIZED'
  private workspacePath: string | null = null
  private serverInstance: TestServerInstance | null = null
  private readonly events: DomainEvent[] = []
  private readonly fsAdapter: ISandboxFileSystemAdapter
  private readonly portAllocator: DynamicPortAllocator

  constructor(
    private readonly config: TestEnvironmentConfig,
    fsAdapter?: ISandboxFileSystemAdapter,
    portAllocator?: DynamicPortAllocator
  ) {
    if (!config || config.timeoutMs <= 0) {
      throw new Error(`TestEnvironmentConfig validation failed: timeoutMs must be positive (got: ${config?.timeoutMs})`)
    }
    if (!config.fixtureTemplate || typeof config.fixtureTemplate !== 'string') {
      throw new Error('TestEnvironmentConfig validation failed: fixtureTemplate must be specified')
    }

    this.fsAdapter = fsAdapter || new DefaultSandboxFileSystemAdapter()
    this.portAllocator = portAllocator || new DynamicPortAllocator()
  }

  getState(): E2EEnvironmentState {
    return this.state
  }

  getEmittedEvents(): readonly DomainEvent[] {
    return [...this.events]
  }

  async setup(): Promise<TestServerInstance> {
    if (this.state === 'ACTIVE' && this.serverInstance) {
      return this.serverInstance
    }

    this.workspacePath = await createEphemeralSandbox(this.config.fixtureTemplate, this.fsAdapter)
    this.events.push({
      name: 'TestSandboxProvisioned',
      payload: {
        sandboxPath: this.workspacePath,
        template: this.config.fixtureTemplate,
      },
      timestamp: Date.now(),
    })

    const port = await this.portAllocator.allocate()
    const instance = createTestServerInstance({
      host: '127.0.0.1',
      port,
      baseUrl: `http://127.0.0.1:${port}`,
      workspacePath: this.workspacePath,
    })

    this.serverInstance = instance
    this.state = 'ACTIVE'

    this.events.push({
      name: 'TestServerReady',
      payload: {
        baseUrl: instance.baseUrl,
        port: instance.port,
        host: instance.host,
      },
      timestamp: Date.now(),
    })

    return instance
  }

  async teardown(): Promise<void> {
    if (this.state === 'TORN_DOWN') {
      return
    }

    if (this.serverInstance) {
      this.portAllocator.release(this.serverInstance.port)
    }

    if (this.workspacePath) {
      await this.fsAdapter.purgeDir(this.workspacePath)
    }

    this.state = 'TORN_DOWN'
    this.events.push({
      name: 'TestTeardownCompleted',
      payload: {
        sandboxPath: this.workspacePath,
        cleaned: true,
      },
      timestamp: Date.now(),
    })
  }
}
